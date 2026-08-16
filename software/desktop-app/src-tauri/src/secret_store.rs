use keyring::Entry;
use rand::{rngs::OsRng, RngCore};

#[derive(Clone)]
pub struct SecretStore {
    service: String,
}

pub struct PreparedPairingKey {
    pub key: Vec<u8>,
    pub old_key: Option<Vec<u8>>,
    pub needs_commit: bool,
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

    pub fn prepare_pairing_key(
        &self,
        device_id: &str,
        rotate: bool,
    ) -> Result<PreparedPairingKey, String> {
        let live_account = pairing_account(device_id);
        let pending_account = pending_pairing_account(device_id);
        let live = self.get_optional(&live_account)?;
        let mut pending = self.get_optional(&pending_account)?;
        if live.as_deref().and_then(parse_pairing_key)
            == pending.as_deref().and_then(parse_pairing_key)
        {
            let _ = self.delete(&pending_account);
            pending = None;
        }
        let mut random = OsRng;
        prepare_pairing_key(
            live,
            pending,
            rotate,
            |bytes| random.fill_bytes(bytes),
            |encoded| self.set(&pending_account, encoded),
        )
    }

    pub fn commit_prepared_pairing_key(&self, device_id: &str) -> Result<(), String> {
        let pending_account = pending_pairing_account(device_id);
        let pending = self
            .get_optional(&pending_account)?
            .and_then(|value| parse_pairing_key(&value))
            .ok_or_else(|| "prepared pairing key is unavailable".to_string())?;
        self.set(&pairing_account(device_id), hex::encode(pending).as_bytes())?;
        let _ = self.delete(&pending_account);
        Ok(())
    }

    pub fn discard_prepared_pairing_key(&self, device_id: &str) -> Result<(), String> {
        self.delete(&pending_pairing_account(device_id))
    }

    pub fn has_live_pairing_key(&self, device_id: &str) -> bool {
        self.get_optional(&pairing_account(device_id))
            .ok()
            .flatten()
            .as_deref()
            .and_then(parse_pairing_key)
            .is_some()
    }

    pub fn has_pending_pairing_key(&self, device_id: &str) -> bool {
        let pending = self
            .get_optional(&pending_pairing_account(device_id))
            .ok()
            .flatten()
            .as_deref()
            .and_then(parse_pairing_key);
        let live = self
            .get_optional(&pairing_account(device_id))
            .ok()
            .flatten()
            .as_deref()
            .and_then(parse_pairing_key);
        pending.is_some() && pending != live
    }
}

fn pairing_account(device_id: &str) -> String {
    format!("pairing-{device_id}")
}

fn pending_pairing_account(device_id: &str) -> String {
    format!("pairing-{device_id}-pending")
}

fn prepare_pairing_key(
    live: Option<Vec<u8>>,
    pending: Option<Vec<u8>>,
    rotate: bool,
    fill_random: impl FnOnce(&mut [u8]),
    stage: impl FnOnce(&[u8]) -> Result<(), String>,
) -> Result<PreparedPairingKey, String> {
    let old_key = live.as_deref().and_then(parse_pairing_key);
    if let Some(key) = pending.as_deref().and_then(parse_pairing_key) {
        return Ok(PreparedPairingKey {
            key,
            old_key,
            needs_commit: true,
        });
    }
    if !rotate {
        if let Some(key) = old_key.clone() {
            return Ok(PreparedPairingKey {
                key,
                old_key,
                needs_commit: false,
            });
        }
    }

    let mut key = vec![0_u8; 32];
    fill_random(&mut key);
    stage(hex::encode(&key).as_bytes())?;
    Ok(PreparedPairingKey {
        key,
        old_key,
        needs_commit: true,
    })
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
    use super::{parse_pairing_key, prepare_pairing_key};
    use std::cell::Cell;

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

    #[test]
    fn creates_and_persists_a_random_pairing_key_when_missing() {
        let persisted = std::cell::RefCell::new(Vec::new());
        let prepared = prepare_pairing_key(
            None,
            None,
            false,
            |bytes| bytes.fill(0x2a),
            |encoded| {
                persisted.replace(encoded.to_vec());
                Ok(())
            },
        )
        .unwrap();

        assert_eq!(prepared.key, vec![0x2a; 32]);
        assert!(prepared.needs_commit);
        assert_eq!(persisted.borrow().as_slice(), "2a".repeat(32).as_bytes());
    }

    #[test]
    fn reuses_a_valid_pairing_key_without_replacing_secure_storage() {
        let filled = Cell::new(false);
        let persisted = Cell::new(false);
        let existing = "10".repeat(32).into_bytes();

        let prepared = prepare_pairing_key(
            Some(existing),
            None,
            false,
            |_| filled.set(true),
            |_| {
                persisted.set(true);
                Ok(())
            },
        )
        .unwrap();

        assert_eq!(prepared.key, vec![0x10; 32]);
        assert!(!prepared.needs_commit);
        assert!(!filled.get());
        assert!(!persisted.get());
    }

    #[test]
    fn repair_stages_a_new_key_without_replacing_the_live_key() {
        let staged = std::cell::RefCell::new(Vec::new());
        let prepared = prepare_pairing_key(
            Some("10".repeat(32).into_bytes()),
            None,
            true,
            |bytes| bytes.fill(0x4d),
            |encoded| {
                staged.replace(encoded.to_vec());
                Ok(())
            },
        )
        .unwrap();

        assert_eq!(prepared.key, vec![0x4d; 32]);
        assert!(prepared.needs_commit);
        assert_eq!(staged.borrow().as_slice(), "4d".repeat(32).as_bytes());
    }

    #[test]
    fn recovery_prefers_a_durable_pending_key_over_the_live_key() {
        let prepared = prepare_pairing_key(
            Some("10".repeat(32).into_bytes()),
            Some("20".repeat(32).into_bytes()),
            false,
            |_| panic!("recovery must reuse the pending key"),
            |_| panic!("recovery must not stage another key"),
        )
        .unwrap();

        assert_eq!(prepared.key, vec![0x20; 32]);
        assert_eq!(prepared.old_key, Some(vec![0x10; 32]));
        assert!(prepared.needs_commit);
    }
}
