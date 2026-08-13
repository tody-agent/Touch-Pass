use touchpass_helper::crypto::{mac_hex, session_key, aes_ctr_crypt, encrypt_password};

#[test]
fn test_mac_hex() {
    let key = b"12345678901234567890123456789012";
    let mac = mac_hex(key, "EV|nonce123|1|1|100");
    assert_eq!(mac.len(), 64);
}

#[test]
fn test_session_key_and_aes_ctr() {
    let key = b"12345678901234567890123456789012";
    let nonce = "0102030405060708090a0b0c0d0e0f10";
    let sess = session_key(key, nonce);
    assert_eq!(sess.len(), 32);

    let iv = vec![0u8; 16];
    let plaintext = b"Hello TouchPass";
    let cipher = aes_ctr_crypt(&sess, &iv, plaintext).unwrap();
    let decrypted = aes_ctr_crypt(&sess, &iv, &cipher).unwrap();
    assert_eq!(decrypted, plaintext);
}

#[test]
fn test_encrypt_password() {
    let key = b"12345678901234567890123456789012";
    let nonce = "0102030405060708090a0b0c0d0e0f10";
    let (iv_hex, ct_hex) = encrypt_password(key, nonce, b"MySecretPassword");
    assert_eq!(iv_hex.len(), 32);
    assert!(!ct_hex.is_empty());
}
