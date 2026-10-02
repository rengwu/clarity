use librespot_playback::{
    NUM_CHANNELS, SAMPLE_RATE,
    audio_backend::{Sink, SinkError, SinkResult},
    convert::Converter,
    decoder::AudioPacket,
};
use rodio::{DeviceSinkBuilder, MixerDeviceSink, Player, buffer::SamplesBuffer};
use serde_json::json;
use std::{num::NonZero, sync::Arc, thread, time::Duration};

// librespot 0.8's bundled Rodio backend pins CPAL 0.16, which crashes on current macOS.
pub struct AudioOutput {
    player: Arc<Player>,
    _device: MixerDeviceSink,
}

impl AudioOutput {
    pub fn open() -> Result<Self, rodio::DeviceSinkError> {
        let mut device = DeviceSinkBuilder::from_default_device()?
            .with_error_callback(|error| {
                crate::emit(
                    json!({"event":"error","message":format!("Audio output failed: {error}")}),
                );
            })
            .open_sink_or_fallback()?;
        device.log_on_drop(false);
        let player = Arc::new(Player::connect_new(device.mixer()));
        Ok(Self {
            player,
            _device: device,
        })
    }

    pub fn volume_control(&self) -> Arc<Player> {
        self.player.clone()
    }
}

pub fn append_packet(player: &Player, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()> {
    let samples = packet
        .samples()
        .map_err(|error| SinkError::OnWrite(error.to_string()))?;
    let samples: &[f32] = &converter.f64_to_f32(samples);
    player.append(SamplesBuffer::new(
        NonZero::new(NUM_CHANNELS as u16).unwrap(),
        NonZero::new(SAMPLE_RATE).unwrap(),
        samples,
    ));
    Ok(())
}

impl Sink for AudioOutput {
    fn start(&mut self) -> SinkResult<()> {
        self.player.play();
        Ok(())
    }

    fn stop(&mut self) -> SinkResult<()> {
        self.player.sleep_until_end();
        self.player.pause();
        Ok(())
    }

    fn write(&mut self, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()> {
        append_packet(&self.player, packet, converter)?;
        // Bound decoded audio to roughly half a second, as in librespot's Rodio backend.
        while self.player.len() > 26 {
            thread::sleep(Duration::from_millis(10));
        }
        Ok(())
    }
}
