use touchpass_helper::gate::{TriggerGate, GateDecision};
use touchpass_helper::protocol::encode_action;
use serde_json::json;

#[test]
fn test_trigger_gate_confirmation() {
    let mut gate = TriggerGate::new(3.0);
    let profile = json!({ "confirm": true });
    
    // First touch -> armed
    assert_eq!(gate.touch(1, &profile, 10.0), GateDecision::Armed);
    // Second touch within window -> execute
    assert_eq!(gate.touch(1, &profile, 11.5), GateDecision::Execute);
}

#[test]
fn test_encode_action_enter() {
    let action = json!({ "preset": "enter" });
    let encoded = encode_action(&action, |_| None).unwrap();
    assert!(!encoded.is_empty());
}
