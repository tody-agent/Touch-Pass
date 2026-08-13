use touchpass_helper::profile_store::ProfileStore;
use tempfile::NamedTempFile;

#[test]
fn test_default_10_profiles() {
    let tmp = NamedTempFile::new().unwrap();
    let store = ProfileStore::new(tmp.path().to_path_buf());
    let profiles = store.list_profiles();
    assert_eq!(profiles.len(), 10);
    assert_eq!(profiles[0]["slot"], 1);
}
