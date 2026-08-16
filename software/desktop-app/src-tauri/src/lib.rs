mod admin_flow;
mod commands;
mod crypto;
mod event_loop;
mod gate;
pub mod preferences;
mod profile_store;
mod protocol;
mod secret_store;
mod serial;
mod state;
pub mod types;

use commands::{
    get_app_preferences, get_app_status, list_finger_profiles, reset_finger_profile,
    save_finger_profile, set_app_locale, start_enrollment,
};
use preferences::tray_labels;
use state::AppState;
use tauri::menu::MenuBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use types::Locale;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            let state = AppState::new(app.handle().clone())?;
            let locale = state
                .preferences
                .lock()
                .ok()
                .and_then(|preferences| preferences.load().ok())
                .and_then(|preferences| preferences.locale)
                .unwrap_or(Locale::Vi);
            install_tray(app, locale)?;
            let state = event_loop::spawn_serial_worker(app.handle().clone(), state);
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            get_app_preferences,
            set_app_locale,
            list_finger_profiles,
            save_finger_profile,
            reset_finger_profile,
            start_enrollment
        ])
        .run(tauri::generate_context!())
        .expect("error while running TouchPass");
}

fn install_tray(app: &mut tauri::App, locale: Locale) -> tauri::Result<()> {
    let (show_label, quit_label) = tray_labels(locale);
    let menu = MenuBuilder::new(app)
        .text("show", show_label)
        .separator()
        .text("quit", quit_label)
        .build()?;

    let mut builder = TrayIconBuilder::with_id("touchpass")
        .tooltip("TouchPass")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if matches!(
                event,
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                }
            ) {
                show_main_window(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }
    builder.build(app)?;
    Ok(())
}

pub fn update_tray_menu(app: &tauri::AppHandle, locale: Locale) -> tauri::Result<()> {
    let (show_label, quit_label) = tray_labels(locale);
    let menu = MenuBuilder::new(app)
        .text("show", show_label)
        .separator()
        .text("quit", quit_label)
        .build()?;
    if let Some(tray) = app.tray_by_id("touchpass") {
        tray.set_menu(Some(menu))?;
    }
    Ok(())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
