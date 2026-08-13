use touchpass_helper::crypto::{mac_hex, session_key, aes_ctr_crypt, encrypt_password};

#[test]
fn test_mac_hex_determinism() {
    let key = b"12345678901234567890123456789012";
    let mac1 = mac_hex(key, "EV|nonce123|1|1|100");
    let mac2 = mac_hex(key, "EV|nonce123|1|1|100");
    assert_eq!(mac1.len(), 64);
    assert_eq!(mac1, mac2);
    
    // Different message -> different MAC
    let mac3 = mac_hex(key, "EV|nonce123|1|1|101");
    assert_ne!(mac1, mac3);
}

#[test]
fn test_session_key_derivation() {
    let key = b"12345678901234567890123456789012";
    let nonce = "0102030405060708090a0b0c0d0e0f10";
    let sess = session_key(key, nonce);
    assert_eq!(sess.len(), 32);
}

#[test]
fn test_aes_ctr_encryption_decryption() {
    let key = b"12345678901234567890123456789012";
    let iv = vec![0u8; 16];
    let plaintext = b"TouchPass Secret Password 123!";

    let ciphertext = aes_ctr_crypt(key, &iv, plaintext).unwrap();
    assert_ne!(ciphertext, plaintext);

    let decrypted = aes_ctr_crypt(key, &iv, &ciphertext).unwrap();
    assert_eq!(decrypted, plaintext);
}

#[test]
fn test_aes_ctr_invalid_lengths() {
    let short_key = b"short_key";
    let iv = vec![0u8; 16];
    assert!(aes_ctr_crypt(short_key, &iv, b"test").is_err());

    let key = b"12345678901234567890123456789012";
    let short_iv = vec![0u8; 8];
    assert!(aes_ctr_crypt(key, &short_iv, b"test").is_err());
}

#[test]
fn test_encrypt_password_random_iv() {
    let key = b"12345678901234567890123456789012";
    let nonce = "0102030405060708090a0b0c0d0e0f10";
    
    let (iv1, ct1) = encrypt_password(key, nonce, b"MySecretPassword");
    let (iv2, ct2) = encrypt_password(key, nonce, b"MySecretPassword");
    
    assert_eq!(iv1.len(), 32);
    assert_eq!(iv2.len(), 32);
    // Random IVs should be different
    assert_ne!(iv1, iv2);
    assert_ne!(ct1, ct2);
}
