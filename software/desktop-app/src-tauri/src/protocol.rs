use crate::crypto::{encrypt_payload, mac_hex};
use crate::gate::{GateDecision, TriggerGate};
use crate::types::{ActionType, FingerProfile};
use std::collections::VecDeque;

const ACTION_VERSION: u8 = 1;
const MAX_ACTION_BYTES: usize = 256;
const OP_TEXT: u8 = 1;
const OP_KEY: u8 = 2;
const OP_DELAY: u8 = 3;
const KEY_ENTER: u8 = 0x28;
const KEY_ESCAPE: u8 = 0x29;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StatusLine {
    pub mode: String,
    pub sensor_ok: bool,
    pub fingerprints: usize,
    pub hid_key_configured: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SensorEvent {
    pub nonce: String,
    pub counter: String,
    pub slot: usize,
    pub score: String,
    pub mac: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FirmwareLine {
    Status(StatusLine),
    Prompt(String),
    EnrollOk(usize),
    EnrollErr(usize),
    DeleteOk(usize),
    DeleteErr(usize),
    Event(SensorEvent),
    Other(String),
}

pub fn parse_firmware_line(line: &str) -> FirmwareLine {
    if line.starts_with("OK STATUS") {
        let mode = token_value(line, "mode").unwrap_or("unknown").to_string();
        let fingerprints = token_value(line, "fingerprints")
            .and_then(|v| v.parse::<usize>().ok())
            .unwrap_or(0);
        let hid_key_configured = token_value(line, "hid_key") == Some("configured");
        return FirmwareLine::Status(StatusLine {
            mode,
            sensor_ok: line.contains("sensor=ok"),
            fingerprints,
            hid_key_configured,
        });
    }
    if let Some(message) = line.strip_prefix("PROMPT ") {
        return FirmwareLine::Prompt(message.to_string());
    }
    if line.starts_with("OK ENROLL") {
        return FirmwareLine::EnrollOk(slot_from_line(line));
    }
    if line.starts_with("ERR ENROLL") {
        return FirmwareLine::EnrollErr(slot_from_line(line));
    }
    if line.starts_with("OK DELETE") {
        return FirmwareLine::DeleteOk(slot_from_line(line));
    }
    if line.starts_with("ERR DELETE") {
        return FirmwareLine::DeleteErr(slot_from_line(line));
    }
    if line.starts_with("EV ") {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() == 6 {
            if let Ok(slot) = parts[3].parse::<usize>() {
                return FirmwareLine::Event(SensorEvent {
                    nonce: parts[1].to_string(),
                    counter: parts[2].to_string(),
                    slot,
                    score: parts[4].to_string(),
                    mac: parts[5].to_string(),
                });
            }
        }
    }
    FirmwareLine::Other(line.to_string())
}

pub fn encode_action<F>(profile: &FingerProfile, secret_resolver: F) -> Result<Vec<u8>, String>
where
    F: Fn(&str) -> Result<Vec<u8>, String>,
{
    let mut steps = Vec::new();
    match profile.action_type {
        ActionType::Password => {
            let ref_name = profile
                .secret_ref
                .as_deref()
                .ok_or_else(|| "password action requires secretRef".to_string())?;
            steps.push(text_step(&secret_resolver(ref_name)?)?);
            steps.push(key_step(KEY_ENTER));
        }
        ActionType::Enter => steps.push(key_step(KEY_ENTER)),
        ActionType::Escape => steps.push(key_step(KEY_ESCAPE)),
        ActionType::AiAccept => {
            steps.push(text_step(b"y")?);
            steps.push(key_step(KEY_ENTER));
        }
        ActionType::Custom => {
            let payload = profile.custom_payload.as_deref().unwrap_or("").trim();
            if payload.is_empty() || payload.len() > 128 || !payload.is_ascii() {
                return Err("customPayload must be 1..128 ASCII bytes".to_string());
            }
            steps.push(text_step(payload.as_bytes())?);
        }
        ActionType::Disabled => {}
    }

    let mut out = vec![ACTION_VERSION, steps.len() as u8];
    for step in steps {
        out.extend_from_slice(&step);
    }
    if out.len() > MAX_ACTION_BYTES {
        return Err("encoded action exceeds 256 bytes".to_string());
    }
    Ok(out)
}

pub fn handle_sensor_event<F>(
    event: &SensorEvent,
    pairing_key: &[u8],
    seen_nonces: &mut VecDeque<String>,
    profile_resolver: F,
    secret_resolver: impl Fn(&str) -> Result<Vec<u8>, String>,
    gate: &mut TriggerGate,
    now_seconds: f64,
) -> Result<Option<(String, bool, String)>, String>
where
    F: Fn(usize) -> Option<FingerProfile>,
{
    validate_event(event, pairing_key, seen_nonces)?;
    let profile = match profile_resolver(event.slot) {
        Some(profile) if profile.configured && profile.action_type != ActionType::Disabled => {
            profile
        }
        _ => return Ok(None),
    };
    seen_nonces.push_back(event.nonce.clone());
    while seen_nonces.len() > 64 {
        seen_nonces.pop_front();
    }

    match gate.touch(event.slot, profile.require_confirm, now_seconds) {
        GateDecision::Armed => {
            let expires_ms = (gate.window_seconds * 1000.0).round() as u64;
            let reply_mac = mac_hex(
                pairing_key,
                &format!("ARM|{}|{}|{}", event.nonce, event.slot, expires_ms),
            );
            Ok(Some((
                format!(
                    "ARM {} {} {} {}\n",
                    event.nonce, event.slot, expires_ms, reply_mac
                ),
                false,
                profile.label,
            )))
        }
        GateDecision::Execute => {
            let payload = encode_action(&profile, secret_resolver)?;
            let (iv_hex, ciphertext_hex) = encrypt_payload(pairing_key, &event.nonce, &payload)?;
            let reply_mac = mac_hex(
                pairing_key,
                &format!("ACT|{}|{}|{}", event.nonce, iv_hex, ciphertext_hex),
            );
            Ok(Some((
                format!(
                    "ACT {} {} {} {}\n",
                    event.nonce, iv_hex, ciphertext_hex, reply_mac
                ),
                true,
                profile.label,
            )))
        }
    }
}

fn validate_event(
    event: &SensorEvent,
    pairing_key: &[u8],
    seen_nonces: &VecDeque<String>,
) -> Result<(), String> {
    if event.nonce.len() != 32 || !event.nonce.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("bad event nonce".to_string());
    }
    if seen_nonces.contains(&event.nonce) {
        return Err("replayed event nonce".to_string());
    }
    let expected = mac_hex(
        pairing_key,
        &format!(
            "EV|{}|{}|{}|{}",
            event.nonce, event.counter, event.slot, event.score
        ),
    );
    if expected != event.mac {
        return Err("bad event mac".to_string());
    }
    Ok(())
}

fn token_value<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    line.split_whitespace()
        .find_map(|token| token.strip_prefix(&format!("{}=", key)))
}

fn slot_from_line(line: &str) -> usize {
    token_value(line, "slot")
        .and_then(|v| v.parse::<usize>().ok())
        .unwrap_or(0)
}

fn text_step(value: &[u8]) -> Result<Vec<u8>, String> {
    if value.len() > 128 {
        return Err("text action step exceeds 128 bytes".to_string());
    }
    let mut step = vec![OP_TEXT, value.len() as u8];
    step.extend_from_slice(value);
    Ok(step)
}

fn key_step(key: u8) -> Vec<u8> {
    vec![OP_KEY, key]
}

#[allow(dead_code)]
fn delay_step(ms: u16) -> Vec<u8> {
    vec![OP_DELAY, (ms >> 8) as u8, (ms & 0xff) as u8]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{default_profile, ActionType};

    #[test]
    fn parses_status_line() {
        let parsed = parse_firmware_line(
            "OK STATUS firmware=unified mode=hid sensor=ok fingerprints=3 keys=nvs hid_key=configured",
        );
        match parsed {
            FirmwareLine::Status(status) => {
                assert_eq!(status.mode, "hid");
                assert_eq!(status.fingerprints, 3);
                assert!(status.sensor_ok);
                assert!(status.hid_key_configured);
            }
            _ => panic!("expected status"),
        }
    }

    #[test]
    fn maps_ai_accept_to_y_enter() {
        let mut profile = default_profile(1);
        profile.configured = true;
        profile.action_type = ActionType::AiAccept;
        let payload = encode_action(&profile, |_| Ok(Vec::new())).unwrap();
        assert_eq!(payload, vec![1, 2, 1, 1, b'y', 2, KEY_ENTER]);
    }

    #[test]
    fn handles_double_touch_arm_then_act() {
        let key = vec![0x41; 32];
        let mut profile = default_profile(1);
        profile.configured = true;
        profile.action_type = ActionType::AiAccept;
        profile.require_confirm = true;

        let event1 = signed_event(&key, "0102030405060708090a0b0c0d0e0f10", "1", 1, "150");
        let event2 = signed_event(&key, "11223344556677889900aabbccddeeff", "2", 1, "151");
        let mut seen = VecDeque::new();
        let mut gate = TriggerGate::new(3.0);

        let first = handle_sensor_event(
            &event1,
            &key,
            &mut seen,
            |_| Some(profile.clone()),
            |_| Ok(Vec::new()),
            &mut gate,
            1.0,
        )
        .unwrap()
        .unwrap();
        assert!(first.0.starts_with("ARM "));
        assert!(!first.1);

        let second = handle_sensor_event(
            &event2,
            &key,
            &mut seen,
            |_| Some(profile.clone()),
            |_| Ok(Vec::new()),
            &mut gate,
            2.0,
        )
        .unwrap()
        .unwrap();
        assert!(second.0.starts_with("ACT "));
        assert!(second.1);
    }

    #[test]
    fn rejects_replayed_nonce() {
        let key = vec![0x41; 32];
        let mut profile = default_profile(1);
        profile.configured = true;
        let event = signed_event(&key, "0102030405060708090a0b0c0d0e0f10", "1", 1, "150");
        let mut seen = VecDeque::from([event.nonce.clone()]);
        let mut gate = TriggerGate::new(3.0);

        let result = handle_sensor_event(
            &event,
            &key,
            &mut seen,
            |_| Some(profile.clone()),
            |_| Ok(Vec::new()),
            &mut gate,
            1.0,
        );
        assert!(result.unwrap_err().contains("replayed"));
    }

    fn signed_event(
        key: &[u8],
        nonce: &str,
        counter: &str,
        slot: usize,
        score: &str,
    ) -> SensorEvent {
        let mac = mac_hex(key, &format!("EV|{}|{}|{}|{}", nonce, counter, slot, score));
        SensorEvent {
            nonce: nonce.to_string(),
            counter: counter.to_string(),
            slot,
            score: score.to_string(),
            mac,
        }
    }
}
