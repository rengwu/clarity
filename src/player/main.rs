use librespot_core::{
    SpotifyUri, authentication::Credentials, config::SessionConfig, session::Session,
};
use librespot_playback::{
    audio_backend,
    config::{AudioFormat, PlayerConfig},
    mixer::{self, MixerConfig},
    player::{Player, PlayerEvent},
};
use serde_json::{Value, json};
use std::io::{self, Write};
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, BufReader};

fn emit(value: Value) {
    println!("{value}");
    let _ = io::stdout().flush();
}

#[tokio::main]
async fn main() {
    if std::env::args().nth(1).as_deref() == Some("--info") {
        emit(json!({"clientId": SessionConfig::default().client_id, "version": "0.8.0"}));
        return;
    }
    if let Err(error) = run().await {
        emit(json!({"event":"error", "message":error.to_string()}));
        std::process::exit(1);
    }
}

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let mut input = BufReader::new(tokio::io::stdin()).lines();
    let Some(line) = input.next_line().await? else {
        return Ok(());
    };
    let init: Value = serde_json::from_str(&line)?;
    let token = init["token"].as_str().ok_or("Missing playback sign-in")?;
    let mut config = SessionConfig::default();
    config.autoplay = Some(false);
    if let Some(path) = init["temporaryDirectory"].as_str() {
        config.tmp_dir = path.into();
    }
    let session = Session::new(config, None);
    tokio::time::timeout(
        Duration::from_secs(45),
        session.connect(Credentials::with_access_token(token), false),
    )
    .await??;
    let mixer =
        mixer::find(Some("softvol")).ok_or("Audio mixer unavailable")?(MixerConfig::default())?;
    mixer.set_volume((0.7 * u16::MAX as f64) as u16);
    let sink = audio_backend::find(Some("rodio".to_string())).ok_or("Audio output unavailable")?;
    let config = PlayerConfig {
        position_update_interval: Some(Duration::from_secs(1)),
        ..PlayerConfig::default()
    };
    let player = Player::new(
        config,
        session.clone(),
        mixer.get_soft_volume(),
        move || sink(None, AudioFormat::default()),
    );
    let mut events = player.get_player_event_channel();
    let mut active_request = None;
    emit(json!({"event":"ready"}));
    loop {
        tokio::select! {
            line = input.next_line() => {
                let Some(line) = line? else { break };
                let command: Value = match serde_json::from_str(&line) {
                    Ok(value) => value,
                    Err(_) => { emit(json!({"event":"error","message":"Invalid player command"})); continue; }
                };
                match command["command"].as_str().unwrap_or("") {
                    "load" => {
                        match SpotifyUri::from_uri(command["uri"].as_str().unwrap_or("")) {
                            Ok(uri) => { player.load(uri, true, 0); }
                            Err(_) => emit(json!({"event":"error","message":"Invalid Spotify track"})),
                        }
                    }
                    "pause" => player.pause(),
                    "resume" => player.play(),
                    "stop" => player.stop(),
                    "seek" => player.seek(command["position"].as_u64().unwrap_or(0).min(u32::MAX as u64) as u32),
                    "volume" => mixer.set_volume((command["volume"].as_f64().unwrap_or(70.0).clamp(0.0,100.0)/100.0*u16::MAX as f64) as u16),
                    "quit" => break,
                    _ => emit(json!({"event":"error","message":"Unknown player command"})),
                }
            }
            event = events.recv() => {
                let Some(event) = event else { break };
                if let PlayerEvent::PlayRequestIdChanged { play_request_id } = event { active_request = Some(play_request_id); }
                if event.get_play_request_id().is_some_and(|id| Some(id) != active_request) { continue; }
                match event {
                    PlayerEvent::Playing { position_ms, .. } => emit(json!({"event":"state","playing":true,"position":position_ms as f64/1000.0})),
                    PlayerEvent::Paused { position_ms, .. } => emit(json!({"event":"state","playing":false,"position":position_ms as f64/1000.0})),
                    PlayerEvent::PositionChanged { position_ms, .. } => emit(json!({"event":"position","position":position_ms as f64/1000.0})),
                    PlayerEvent::Stopped { .. } => emit(json!({"event":"state","playing":false})),
                    PlayerEvent::EndOfTrack { .. } => emit(json!({"event":"ended"})),
                    PlayerEvent::Unavailable { .. } => emit(json!({"event":"error","message":"Spotify could not play this track. Check Premium access and playback sign-in."})),
                    _ => {}
                }
            }
            _ = tokio::signal::ctrl_c() => break,
        }
    }
    player.stop();
    session.shutdown();
    Ok(())
}
