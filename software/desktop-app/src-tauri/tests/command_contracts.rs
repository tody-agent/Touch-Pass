use touchpass_desktop_lib::types::{
    default_profile, ActionType, CommandError, DeviceStatusChange, ErrorCode, FingerTouchEvent,
    Locale, SensorStatus, TouchStatus,
};

#[test]
fn default_profile_contract_matches_public_interface() {
    let profile = default_profile(1);
    assert_eq!(profile.id, 1);
    assert_eq!(profile.action_type, ActionType::Enter);
    assert!(!profile.configured);
    assert!(!profile.secret_configured);
    assert!(profile.secret_ref.is_none());
}

#[test]
fn touch_event_exposes_semantic_action_type() {
    let event = FingerTouchEvent {
        finger_id: 2,
        action_type: ActionType::Enter,
        status: TouchStatus::Executed,
    };

    let json = serde_json::to_value(event).unwrap();
    assert_eq!(json["actionType"], "enter");
    assert!(json.get("action").is_none());
}

#[test]
fn locale_contract_uses_bcp47_values() {
    assert_eq!(serde_json::to_value(Locale::Vi).unwrap(), "vi");
    assert_eq!(serde_json::to_value(Locale::En).unwrap(), "en");
    assert_eq!(serde_json::to_value(Locale::ZhCn).unwrap(), "zh-CN");
}

#[test]
fn status_and_structured_error_contracts_use_stable_codes() {
    let change = DeviceStatusChange {
        connected: true,
        port: Some("COM5".to_string()),
        sensor_status: SensorStatus::Bootloader,
        firmware_mode: "bootloader".to_string(),
        hid_key_configured: false,
        hid_configuration_supported: false,
        local_pairing_key_configured: false,
        pairing_in_doubt: false,
    };
    let status_json = serde_json::to_value(change).unwrap();
    assert_eq!(status_json["sensorStatus"], "bootloader");

    let error = CommandError::with_detail(ErrorCode::PersistenceFailed, "disk full");
    let error_json = serde_json::to_value(error).unwrap();
    assert_eq!(error_json["code"], "persistence_failed");
    assert_eq!(error_json["detail"], "disk full");

    let hid_error = CommandError::with_detail(
        ErrorCode::DeviceConfigurationFailed,
        "config_unlock:fingerprint",
    );
    let hid_error_json = serde_json::to_value(hid_error).unwrap();
    assert_eq!(hid_error_json["code"], "device_configuration_failed");
    assert_eq!(hid_error_json["detail"], "config_unlock:fingerprint");
}
