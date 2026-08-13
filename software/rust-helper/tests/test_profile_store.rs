use touchpass_helper::profile_store::ProfileStore;
use tempfile::NamedTempFile;
use serde_json::json;

#[test]
fn test_default_10_profiles() {
    let tmp = NamedTempFile::new().unwrap();
    let store = ProfileStore::new(tmp.path().to_path_buf());
    let profiles = store.list_profiles();
    assert_eq!(profiles.len(), 10);
    assert_eq!(profiles[0]["slot"], 1);
    assert_eq!(profiles[9]["slot"], 10);
}

#[test]
fn test_get_profile_by_slot() {
    let tmp = NamedTempFile::new().unwrap();
    let store = ProfileStore::new(tmp.path().to_path_buf());
    let profile5 = store.get_profile(5).unwrap();
    assert_eq!(profile5["slot"], 5);
    assert_eq!(profile5["label"], "Ngón 5");
    
    // Invalid slot validation
    assert!(store.get_profile(0).is_err());
    assert!(store.get_profile(11).is_err());
}

#[test]
fn test_update_and_persist_profile() {
    let tmp = NamedTempFile::new().unwrap();
    let path = tmp.path().to_path_buf();
    let store = ProfileStore::new(path.clone());
    
    // Update profile 2
    let updated = store.update_profile(2, json!({
        "label": "Ngón Trỏ Phải",
        "enrolled": true,
        "action": { "preset": "password", "confirm": false }
    })).unwrap();

    assert_eq!(updated["label"], "Ngón Trỏ Phải");
    assert_eq!(updated["enrolled"], true);
    assert_eq!(updated["action"]["preset"], "password");

    // Reload store from file to verify persistence
    let store_reloaded = ProfileStore::new(path);
    let profile2 = store_reloaded.get_profile(2).unwrap();
    assert_eq!(profile2["label"], "Ngón Trỏ Phải");
    assert_eq!(profile2["enrolled"], true);
}

#[test]
fn test_set_enrolled_and_delete_profile() {
    let tmp = NamedTempFile::new().unwrap();
    let store = ProfileStore::new(tmp.path().to_path_buf());
    
    // Set enrolled
    store.set_enrolled(3, true).unwrap();
    assert_eq!(store.get_profile(3).unwrap()["enrolled"], true);

    // Delete profile resets to default
    store.delete_profile(3).unwrap();
    let res = store.get_profile(3).unwrap();
    assert_eq!(res["enrolled"], false);
    assert_eq!(res["label"], "Ngón 3");
}
