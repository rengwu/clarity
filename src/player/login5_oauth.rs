// Included in the externally cached librespot-core crate by tooling/player.mjs.
// The host already owns a renewable streaming grant; don't exchange it through login5.
impl Login5Manager {
    pub fn set_access_token(&self, access_token: String, expires_in: Duration) -> Result<(), Error> {
        if access_token.is_empty() || expires_in <= Duration::from_secs(10) {
            return Err(Error::unauthenticated("Spotify playback token is missing or expired"));
        }
        let token = Token {
            access_token,
            expires_in,
            token_type: "Bearer".to_owned(),
            scopes: vec![],
            timestamp: SystemTime::now(),
        };
        self.lock(|inner| {
            inner.auth_token = Some(token);
            inner.external_token = true;
        });
        Ok(())
    }
}
