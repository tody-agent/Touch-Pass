mod commands;
mod crypto;
mod event_loop;
mod gate;
mod profile_store;
mod protocol;
mod secret_store;
mod serial;
mod state;
pub mod types;

use commands::{
    get_app_status, list_finger_profiles, reset_finger_profile, save_finger_profile,
    start_enrollment, test_dispatch_action,
};
use state::AppState;
use tauri::menu::MenuBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            install_tray(app)?;
            let state = AppState::new(app.handle().clone())?;
            let state = event_loop::spawn_serial_worker(app.handle().clone(), state);
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            list_finger_profiles,
            save_finger_profile,
            reset_finger_profile,
            start_enrollment,
            test_dispatch_action
        ])
        .run(tauri::generate_context!())
        .expect("error while running TouchPass");
}

fn install_tray(app: &mut tauri::App) -> tauri::Result<()> {
    let menu = MenuBuilder::new(app)
        .text("show", "Show TouchPass")
        .separator()
        .text("quit", "Quit")
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

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
