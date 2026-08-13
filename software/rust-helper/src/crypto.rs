use ctr::cipher::{KeyIvInit, StreamCipher};
use hmac::{Hmac, Mac};
use rand::RngCore;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;
type Aes256Ctr = ctr::Ctr128BE<aes::Aes256>;

pub fn mac_hex(pairing_key: &[u8], message: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(pairing_key)
        .expect("HMAC can take key of any size");
    mac.update(message.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

pub fn session_key(pairing_key: &[u8], nonce_hex: &str) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(pairing_key)
        .expect("HMAC key size");
    let msg = format!("SESSION|{}", nonce_hex);
    mac.update(msg.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

pub fn aes_ctr_crypt(key: &[u8], iv: &[u8], data: &[u8]) -> Result<Vec<u8>, String> {
    if key.len() != 32 || iv.len() != 16 {
        return Err("AES-256-CTR requires 32-byte key and 16-byte IV".into());
    }
    let mut cipher = Aes256Ctr::new(key.into(), iv.into());
    let mut buffer = data.to_vec();
    cipher.apply_keystream(&mut buffer);
    Ok(buffer)
}

pub fn encrypt_password(pairing_key: &[u8], nonce_hex: &str, password: &[u8]) -> (String, String) {
    let mut iv = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut iv);
    let sess_key = session_key(pairing_key, nonce_hex);
    let ct = aes_ctr_crypt(&sess_key, &iv, password).unwrap_or_default();
    (hex::encode(iv), hex::encode(ct))
}
