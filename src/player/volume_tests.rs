use super::*;
use librespot_playback::{
    audio_backend::{Sink, SinkResult},
    convert::Converter,
    decoder::AudioPacket,
};
use std::{
    fs,
    path::Path,
    process::Command,
    sync::{Arc, Mutex},
};

struct Capture {
    samples: Arc<Mutex<Vec<f64>>>,
    player: rodio::Player,
    output: rodio::queue::SourcesQueueOutput,
}
impl Sink for Capture {
    fn write(&mut self, packet: AudioPacket, converter: &mut Converter) -> SinkResult<()> {
        let length = packet.samples().unwrap().len();
        audio_output::append_packet(&self.player, packet, converter)?;
        self.samples
            .lock()
            .unwrap()
            .extend(self.output.by_ref().take(length).map(f64::from));
        Ok(())
    }
}

fn fixture(directory: &Path) {
    fs::create_dir_all(directory).unwrap();
    let frames = 44100 * 2;
    let size = frames * 4;
    let mut wave = Vec::new();
    wave.extend_from_slice(b"RIFF");
    wave.extend_from_slice(&(36 + size as u32).to_le_bytes());
    wave.extend_from_slice(b"WAVEfmt ");
    wave.extend_from_slice(&16_u32.to_le_bytes());
    wave.extend_from_slice(&1_u16.to_le_bytes());
    wave.extend_from_slice(&2_u16.to_le_bytes());
    wave.extend_from_slice(&44100_u32.to_le_bytes());
    wave.extend_from_slice(&176400_u32.to_le_bytes());
    wave.extend_from_slice(&4_u16.to_le_bytes());
    wave.extend_from_slice(&16_u16.to_le_bytes());
    wave.extend_from_slice(b"data");
    wave.extend_from_slice(&(size as u32).to_le_bytes());
    for index in 0..frames {
        let sample =
            ((index as f64 * std::f64::consts::TAU * 440.0 / 44100.0).sin() * 16384.0) as i16;
        wave.extend_from_slice(&sample.to_le_bytes());
        wave.extend_from_slice(&sample.to_le_bytes());
    }
    let input = directory.join("fixture.wav");
    let output = directory.join("fixture.flac");
    fs::write(&input, wave).unwrap();
    assert!(
        Command::new("/usr/bin/afconvert")
            .args(["-f", "flac", "-d", "flac"])
            .arg(&input)
            .arg(&output)
            .status()
            .unwrap()
            .success()
    );
    let tags = ["TITLE=Fixture", "ARTIST=Clarity", "ALBUM=Album"];
    let mut comments = Vec::new();
    comments.extend_from_slice(&7_u32.to_le_bytes());
    comments.extend_from_slice(b"Clarity");
    comments.extend_from_slice(&(tags.len() as u32).to_le_bytes());
    for tag in tags {
        comments.extend_from_slice(&(tag.len() as u32).to_le_bytes());
        comments.extend_from_slice(tag.as_bytes());
    }
    let flac = fs::read(&output).unwrap();
    let mut tagged = b"fLaC".to_vec();
    let mut offset = 4;
    loop {
        let header = flac[offset];
        let length = ((flac[offset + 1] as usize) << 16)
            | ((flac[offset + 2] as usize) << 8)
            | flac[offset + 3] as usize;
        let end = offset + 4 + length;
        if header & 0x7f != 4 {
            tagged.push(header & 0x7f);
            tagged.extend_from_slice(&flac[offset + 1..end]);
        }
        offset = end;
        if header & 0x80 != 0 {
            break;
        }
    }
    tagged.push(0x84);
    tagged.extend_from_slice(&(comments.len() as u32).to_be_bytes()[1..]);
    tagged.extend_from_slice(&comments);
    tagged.extend_from_slice(&flac[offset..]);
    fs::write(output, tagged).unwrap();
}

async fn render(directory: &Path, enabled: bool, album: bool, volume: f64) -> Vec<f64> {
    let (output_player, output) = rodio::Player::new();
    output_player.set_volume(volume_gain(&json!({ "volume": volume })));
    let mut config = player_config(enabled);
    config.local_file_directories = vec![directory.to_path_buf()];
    let samples = Arc::new(Mutex::new(Vec::new()));
    let captured = samples.clone();
    let player = Player::new(
        config,
        Session::new(SessionConfig::default(), None),
        Box::new(NoOpVolume),
        move || Box::new(Capture { samples: captured, player: output_player, output }),
    );
    let mut events = player.get_player_event_channel();
    player.set_auto_normalise_as_album(album);
    player.load(
        SpotifyUri::from_uri("spotify:local:Clarity:Album:Fixture:2").unwrap(),
        true,
        0,
    );
    tokio::time::timeout(Duration::from_secs(10), async {
        loop {
            match events.recv().await.unwrap() {
                PlayerEvent::EndOfTrack { .. } => break,
                PlayerEvent::Unavailable { .. } => panic!("Fixture was not decoded"),
                _ => {}
            }
        }
    })
    .await
    .expect("Native PCM rendering timed out");
    drop(player);
    samples.lock().unwrap().clone()
}

#[tokio::test]
async fn decoded_pcm_uses_matching_volume_and_preserves_untagged_audio() {
    let root = std::env::temp_dir().join(format!("clarity-native-volume-{}", std::process::id()));
    fixture(&root);
    let baseline = render(&root, false, false, 100.0).await;
    assert!(baseline.len() >= 176000);
    assert!(baseline.iter().any(|sample| sample.abs() > 0.4));
    let mut scenarios = vec![];
    for volume in [0.0, 25.0, 50.0, 70.0, 100.0] {
        let expected = volume / 100.0;
        scenarios.push((false, false, volume, expected));
        scenarios.push((true, false, volume, expected));
    }
    scenarios.extend([(true, true, 100.0, 1.0)]);
    for (enabled, album, volume, gain) in scenarios {
        let output = render(&root, enabled, album, volume).await;
        assert_eq!(output.len(), baseline.len());
        for (sample, original) in output.iter().zip(&baseline) {
            assert!(
                (sample - original * gain).abs() < 1e-7,
                "Unexpected PCM gain: enabled={enabled}, album={album}, volume={volume}, expected={gain}, sample={sample}, original={original}, ratio={}",
                sample / original
            );
        }
        println!(
            "PCM checked: enabled={enabled} album={album} volume={volume} gain={gain:.9} samples={}",
            output.len()
        );
    }
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn output_volume_changes_already_queued_audio_without_draining_it() {
    let (player, mut output) = rodio::Player::new();
    let mut converter = Converter::new(None);
    for _ in 0..30 {
        audio_output::append_packet(
            &player,
            AudioPacket::Samples(vec![0.5; 2048]),
            &mut converter,
        ).unwrap();
    }
    assert_eq!(output.next(), Some(0.5));
    for volume in [0.0, 25.0, 70.0, 100.0, 0.0, 100.0] {
        // Intermediate drag inputs must not queue a series of old gain changes.
        player.set_volume(volume_gain(&json!({ "volume": 50.0 })));
        let expected = 0.5 * volume_gain(&json!({ "volume": volume }));
        player.set_volume(volume_gain(&json!({ "volume": volume })));
        let samples_until_change = (1..=442).find(|_| {
            (output.next().unwrap() - expected).abs() < 1e-7
        }).expect("Queued audio did not follow volume within one 5 ms output interval");
        for _ in 0..1000 {
            assert!((output.next().unwrap() - expected).abs() < 1e-7);
        }
        assert!(player.len() > 20, "The original audio must still be queued");
        println!("Queued PCM volume={volume} samples_until_change={samples_until_change} queued_packets={}", player.len());
    }
}
