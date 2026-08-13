use keyring::Entry;

pub struct SecretStore {
    service: String,
}

impl SecretStore {
    pub fn new(service: &str) -> Self {
        Self { service: service.to_string() }
    }

    pub fn get(&self, account: &str) -> Option<Vec<u8>> {
        let entry = Entry::new(&self.service, account).ok()?;
        entry.get_password().ok().map(|p| p.into_bytes())
    }

    pub fn set(&self, account: &str, secret: &[u8]) -> Result<(), String> {
        let entry = Entry::new(&self.service, account).map_err(|e| e.to_string())?;
        let text = std::str::from_utf8(secret).map_err(|e| e.to_string())?;
        entry.set_password(text).map_err(|e| e.to_string())
    }
}
