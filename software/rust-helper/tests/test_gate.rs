use touchpass_helper::gate::{TriggerGate, GateDecision};
use serde_json::json;

#[test]
fn test_gate_single_touch_no_confirmation() {
    let mut gate = TriggerGate::new(3.0);
    let profile = json!({ "preset": "password", "confirm": false });
    
    // Single touch executes immediately
    assert_eq!(gate.touch(1, &profile, 10.0), GateDecision::Execute);
}

#[test]
fn test_gate_double_touch_success() {
    let mut gate = TriggerGate::new(3.0);
    let profile = json!({ "preset": "enter", "confirm": true });
    
    // First touch arms the gate
    assert_eq!(gate.touch(1, &profile, 10.0), GateDecision::Armed);
    // Second touch within 3s window executes
    assert_eq!(gate.touch(1, &profile, 12.0), GateDecision::Execute);
}

#[test]
fn test_gate_double_touch_expired() {
    let mut gate = TriggerGate::new(3.0);
    let profile = json!({ "preset": "enter", "confirm": true });
    
    // First touch arms the gate at t=10.0 (deadline t=13.0)
    assert_eq!(gate.touch(1, &profile, 10.0), GateDecision::Armed);
    // Second touch at t=14.0 (expired) -> re-arms instead of executing
    assert_eq!(gate.touch(1, &profile, 14.0), GateDecision::Armed);
}

#[test]
fn test_gate_slot_switching() {
    let mut gate = TriggerGate::new(3.0);
    let profile1 = json!({ "preset": "enter", "confirm": true });
    let profile2 = json!({ "preset": "enter", "confirm": true });
    
    // Touch slot 1 -> armed
    assert_eq!(gate.touch(1, &profile1, 10.0), GateDecision::Armed);
    // Touch slot 2 -> arms slot 2 instead of executing slot 1
    assert_eq!(gate.touch(2, &profile2, 10.5), GateDecision::Armed);
    // Touch slot 2 again -> executes slot 2
    assert_eq!(gate.touch(2, &profile2, 11.0), GateDecision::Execute);
}

#[test]
fn test_gate_preset_defaults() {
    let mut gate = TriggerGate::new(3.0);
    
    // Password preset defaults to no confirmation (Execute immediately)
    let password_profile = json!({ "preset": "password" });
    assert_eq!(gate.touch(1, &password_profile, 10.0), GateDecision::Execute);
    
    // Non-password preset defaults to confirmation required (Armed first)
    let enter_profile = json!({ "preset": "enter" });
    assert_eq!(gate.touch(2, &enter_profile, 10.0), GateDecision::Armed);
}
