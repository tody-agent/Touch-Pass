use touchpass_desktop_lib::types::{default_profile, ActionType};

#[test]
fn default_profile_contract_matches_public_interface() {
    let profile = default_profile(1);
    assert_eq!(profile.id, 1);
    assert_eq!(profile.action_type, ActionType::Enter);
    assert!(!profile.configured);
    assert!(!profile.secret_configured);
    assert!(profile.secret_ref.is_none());
}
