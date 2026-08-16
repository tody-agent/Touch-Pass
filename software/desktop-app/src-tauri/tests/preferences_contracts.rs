use tempfile::tempdir;
use touchpass_desktop_lib::preferences::{tray_labels, PreferenceStore};
use touchpass_desktop_lib::types::Locale;

#[test]
fn preferences_default_to_no_saved_locale_and_persist_selection() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("preferences.json");
    let store = PreferenceStore::new(path.clone());

    assert_eq!(store.load().unwrap().locale, None);
    store.save_locale(Locale::ZhCn).unwrap();

    assert_eq!(
        PreferenceStore::new(path).load().unwrap().locale,
        Some(Locale::ZhCn)
    );
}

#[test]
fn tray_labels_follow_the_selected_locale() {
    assert_eq!(tray_labels(Locale::Vi), ("Mở TouchPass", "Thoát"));
    assert_eq!(tray_labels(Locale::En), ("Show TouchPass", "Quit"));
    assert_eq!(tray_labels(Locale::ZhCn), ("打开 TouchPass", "退出"));
}
