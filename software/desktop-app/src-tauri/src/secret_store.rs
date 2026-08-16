use keyring::Entry;

#[derive(Clone)]
pub struct SecretStore {
    service: String,
}

impl SecretStore {
    pub fn new(service: &str) -> Self {
        Self {
            service: service.to_string(),
        }
    }

    pub fn get(&self, account: &str) -> Result<Vec<u8>, String> {
        self.get_optional(account)?
            .ok_or_else(|| "No matching entry found in secure storage".to_string())
    }

    pub fn get_optional(&self, account: &str) -> Result<Option<Vec<u8>>, String> {
        let entry = Entry::new(&self.service, account).map_err(|e| e.to_string())?;
        match entry.get_password() {
            Ok(password) => Ok(Some(password.into_bytes())),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(error.to_string()),
        }
    }

    pub fn set(&self, account: &str, secret: &[u8]) -> Result<(), String> {
        let text =
            std::str::from_utf8(secret).map_err(|_| "secret must be ASCII/UTF-8".to_string())?;
        let entry = Entry::new(&self.service, account).map_err(|e| e.to_string())?;
        entry.set_password(text).map_err(|e| e.to_string())
    }

    pub fn delete(&self, account: &str) -> Result<(), String> {
        let entry = Entry::new(&self.service, account).map_err(|e| e.to_string())?;
        match entry.delete_password() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(error.to_string()),
        }
    }

    pub fn exists(&self, account: &str) -> bool {
        self.get(account).is_ok()
    }

    pub fn pairing_key(&self, device_id: &str) -> Vec<u8> {
        let candidates = [
            format!("pairing-{}", device_id),
            "pairing-default".to_string(),
        ];
        for account in candidates {
            if let Ok(value) = self.get(&account) {
                if let Some(decoded) = parse_pairing_key(&value) {
                    return decoded;
                }
            }
        }
        vec![0; 32]
    }
}

fn parse_pairing_key(value: &[u8]) -> Option<Vec<u8>> {
    if value.len() == 32 {
        return Some(value.to_vec());
    }
    let text = std::str::from_utf8(value).ok()?.trim();
    if text.len() == 64 && text.chars().all(|c| c.is_ascii_hexdigit()) {
        return hex::decode(text).ok().filter(|key| key.len() == 32);
    }
    None
}

#[cfg(test)]
mod tests {
    use super::parse_pairing_key;

    #[test]
    fn parses_hex_pairing_key() {
        let parsed =
            parse_pairing_key(b"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")
                .unwrap();
        assert_eq!(parsed.len(), 32);
        assert_eq!(parsed[31], 31);
    }

    #[test]
    fn rejects_wrong_pairing_key_length() {
        assert!(parse_pairing_key(b"1234").is_none());
    }
}
