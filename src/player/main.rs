mod audio_output;
#[cfg(test)]
mod volume_tests;

use audio_output::AudioOutput;
use librespot_core::{
    SpotifyUri, authentication::Credentials, config::SessionConfig, error::ErrorKind,
    session::Session,
};
use librespot_playback::{
    config::{NormalisationMethod, NormalisationType, PlayerConfig, VolumeCtrl},
    mixer::{NoOpVolume, mappings::MappedCtrl},
    player::{Player, PlayerEvent},
};
use serde_json::{Value, json};
use std::io::{self, Write};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncBufReadExt, BufReader};

fn emit(value: Value) {
    println!("{value}");
    let _ = io::stdout().flush();
}

fn install_token(session: &Session, value: &Value) -> Result<(), Box<dyn std::error::Error>> {
    let token = value["token"].as_str().ok_or("Missing playback token")?;
    let expires = value["expires"].as_u64().ok_or("Missing playback token expiry")?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as u64;
    let lifetime = Duration::from_millis(expires.saturating_sub(now).min(86_400_000));
    session.login5().set_access_token(token.to_owned(), lifetime)?;
    Ok(())
}

#[tokio::main]
async fn main() {
    if std::env::args().nth(1).as_deref() == Some("--info") {
        emit(json!({"clientId": SessionConfig::default().client_id, "version": "0.8.0"}));
        return;
    }
    if let Err(error) = run().await {
        let authentication = error
            .downcast_ref::<librespot_core::Error>()
            .is_some_and(|error| {
                matches!(
                    error.kind,
                    ErrorKind::PermissionDenied | ErrorKind::Unauthenticated
                )
            });
        emit(
            json!({"event":"error", "code": if authentication { "authentication" } else { "connection" }, "message":error.to_string()}),
        );
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
    install_token(&session, &init)?;
    tokio::time::timeout(Duration::from_secs(45), async {
        session
            .connect(Credentials::with_access_token(token), false)
            .await?;
        Ok::<(), librespot_core::Error>(())
    })
    .await??;
    let output =
        AudioOutput::open().map_err(|error| format!("Cannot open audio output: {error}"))?;
    let volume = output.volume_control();
    volume.set_volume(volume_gain(&init));
    let config = player_config(init["normalization"].as_bool().unwrap_or(true));
    let player = Player::new(
        config,
        session.clone(),
        // Apply slider gain at output so queued audio follows volume changes too.
        Box::new(NoOpVolume),
        move || Box::new(output),
    );
    let mut events = player.get_player_event_channel();
    let mut active_request = None;
    let mut health = tokio::time::interval(Duration::from_secs(1));
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
                    "token" => {
                        if let Err(error) = install_token(&session, &command) {
                            emit(json!({"event":"error","recoverable":true,"message":error.to_string()}));
                        }
                    }
                    "load" => {
                        volume.set_volume(volume_gain(&command));
                        player.set_auto_normalise_as_album(command["albumGain"].as_bool().unwrap_or(false));
                        match SpotifyUri::from_uri(command["uri"].as_str().unwrap_or("")) {
                            Ok(uri) => { player.load(uri, true, command["position"].as_u64().unwrap_or(0).min(u32::MAX as u64) as u32); }
                            Err(_) => emit(json!({"event":"error","message":"Invalid Spotify track"})),
                        }
                    }
                    "pause" => player.pause(),
                    "resume" => player.play(),
                    "stop" => player.stop(),
                    "seek" => player.seek(command["position"].as_u64().unwrap_or(0).min(u32::MAX as u64) as u32),
                    "volume" => volume.set_volume(volume_gain(&command)),
                    "quit" => break,
                    _ => emit(json!({"event":"error","message":"Unknown player command"})),
                }
            }
            event = events.recv() => {
                let Some(event) = event else { return Err("Spotify audio engine stopped unexpectedly. Try playing again.".into()) };
                if let PlayerEvent::PlayRequestIdChanged { play_request_id } = event { active_request = Some(play_request_id); }
                if event.get_play_request_id().is_some_and(|id| Some(id) != active_request) { continue; }
                match event {
                    PlayerEvent::Playing { position_ms, .. } => emit(json!({"event":"state","playing":true,"position":position_ms as f64/1000.0})),
                    PlayerEvent::Paused { position_ms, .. } => emit(json!({"event":"state","playing":false,"position":position_ms as f64/1000.0})),
                    PlayerEvent::PositionChanged { position_ms, .. }
                    | PlayerEvent::PositionCorrection { position_ms, .. }
                    | PlayerEvent::Seeked { position_ms, .. } => emit(json!({"event":"position","position":position_ms as f64/1000.0})),
                    PlayerEvent::Stopped { .. } => emit(json!({"event":"state","playing":false})),
                    PlayerEvent::EndOfTrack { .. } => emit(json!({"event":"ended"})),
                    PlayerEvent::Unavailable { .. } => emit(json!({"event":"error","recoverable":true,"message":"Spotify could not load this track. Try again or choose another track."})),
                    _ => {}
                }
            }
            _ = health.tick() => {
                if session.is_invalid() {
                    emit(json!({"event":"error","recoverable":true,"message":"Spotify's playback connection was interrupted. Try playing again."}));
                    break;
                }
            }
            _ = tokio::signal::ctrl_c() => break,
        }
    }
    player.stop();
    session.shutdown();
    Ok(())
}

fn player_config(normalization: bool) -> PlayerConfig {
    PlayerConfig {
        normalisation: normalization,
        normalisation_type: NormalisationType::Auto,
        normalisation_method: NormalisationMethod::Basic,
        position_update_interval: Some(Duration::from_secs(1)),
        ..PlayerConfig::default()
    }
}

fn volume_gain(command: &Value) -> f32 {
    let value = (command["volume"].as_f64().unwrap_or(70.0).clamp(0.0, 100.0) / 100.0 * u16::MAX as f64) as u16;
    VolumeCtrl::Log(60.0).to_mapped(value) as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn oauth_expiry_never_uses_login5_and_a_renewed_token_restores_access() {
        let session = Session::new(SessionConfig::default(), None);
        session.set_auth_data(b"fixture");
        let manager = session.login5();
        // Librespot considers a token expired ten seconds before its deadline.
        manager.set_access_token("first".into(), Duration::from_secs(11)).unwrap();
        assert_eq!(manager.auth_token().await.unwrap().access_token, "first");
        assert!(manager.set_access_token("".into(), Duration::from_secs(120)).is_err());
        assert!(manager.set_access_token("old".into(), Duration::ZERO).is_err());
        assert_eq!(manager.auth_token().await.unwrap().access_token, "first");

        tokio::time::sleep(Duration::from_millis(1100)).await;
        let error = tokio::time::timeout(Duration::from_millis(100), manager.auth_token())
            .await.unwrap().unwrap_err();
        assert_eq!(error.kind, ErrorKind::Unauthenticated);

        manager.set_access_token("renewed".into(), Duration::from_secs(120)).unwrap();
        assert_eq!(manager.auth_token().await.unwrap().access_token, "renewed");
    }
}
