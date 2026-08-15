use crate::gate::TriggerGate;
use crate::protocol::{handle_sensor_event, parse_firmware_line, FirmwareLine};
use crate::serial::{list_touchpass_ports, TouchPassPortKind};
use crate::state::{AdminCommand, AppState};
use crate::types::{DeviceStatusChange, EnrollStepProgress, FingerTouchEvent, TouchStatus};
use std::collections::VecDeque;
use std::io::{Read, Write};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub fn spawn_serial_worker(app: AppHandle, state: AppState) -> AppState {
    let (tx, rx) = mpsc::channel::<AdminCommand>();
    let worker_state = state.with_admin_channel(tx.clone());
    let thread_state = worker_state.clone();
    thread::spawn(move || run_worker(app, thread_state, rx));
    worker_state
}

fn run_worker(app: AppHandle, state: AppState, rx: mpsc::Receiver<AdminCommand>) {
    let mut last_port: Option<String> = None;
    let mut gate = TriggerGate::new(3.0);
    let mut seen_nonces = VecDeque::new();
    let started = Instant::now();

    loop {
        let ports = list_touchpass_ports();
        let selected = ports.first().cloned();
        let selected_name = selected.as_ref().map(|port| port.name.clone());
        if selected_name != last_port {
            update_connection(
                &app,
                &state,
                selected_name.clone(),
                selected.as_ref().map(|port| port.kind),
            );
            last_port = selected_name.clone();
        }

        if matches!(
            selected.as_ref().map(|port| port.kind),
            Some(TouchPassPortKind::Bootloader)
        ) {
            thread::sleep(Duration::from_millis(750));
            continue;
        }

        if let Some(port_name) = selected_name {
            let open_result = serialport::new(&port_name, 115_200)
                .timeout(Duration::from_millis(120))
                .open();
            if let Ok(mut port) = open_result {
                let _ = port.write_all(b"STATUS\n");
                let mut line = String::new();
                let mut buffer = [0u8; 1];
                let mut enroll_step = 1u8;
                let mut last_status = Instant::now();
                let mut last_rx = Instant::now();
                loop {
                    while let Ok(command) = rx.try_recv() {
                        write_admin_command(&mut port, command);
                    }
                    if last_status.elapsed() >= Duration::from_secs(2) {
                        if port.write_all(b"STATUS\n").is_err() {
                            break;
                        }
                        let _ = port.flush();
                        last_status = Instant::now();
                    }
                    match port.read(&mut buffer) {
                        Ok(1) if buffer[0] == b'\n' => {
                            last_rx = Instant::now();
                            if let Some(reply) = handle_line(
                                &app,
                                &state,
                                &mut gate,
                                &mut seen_nonces,
                                &mut enroll_step,
                                started,
                                line.trim(),
                            ) {
                                let _ = port.write_all(reply.as_bytes());
                                let _ = port.flush();
                            }
                            line.clear();
                        }
                        Ok(1) => {
                            last_rx = Instant::now();
                            if line.len() < 512 {
                                line.push(buffer[0] as char);
                            }
                        }
                        Ok(_) => {}
                        Err(_) => {
                            if last_rx.elapsed() > Duration::from_secs(8) {
                                break;
                            }
                        }
                    }
                }
            }
        } else {
            while let Ok(command) = rx.try_recv() {
                if let AdminCommand::Enroll(finger_id) = command {
                    emit_enroll_error(&app, finger_id as u8);
                }
            }
        }
        thread::sleep(Duration::from_millis(750));
    }
}

fn handle_line(
    app: &AppHandle,
    state: &AppState,
    gate: &mut TriggerGate,
    seen_nonces: &mut VecDeque<String>,
    enroll_step: &mut u8,
    started: Instant,
    line: &str,
) -> Option<String> {
    match parse_firmware_line(line) {
        FirmwareLine::Status(status) => {
            if let Ok(mut current) = state.status.lock() {
                current.sensor_status = if status.sensor_ok { "ok" } else { "error" }.to_string();
                current.firmware_mode = status.mode;
                current.fingerprint_count = status.fingerprints;
                current.hid_key_configured = status.hid_key_configured;
                current.background_worker = "running".to_string();
            }
            None
        }
        FirmwareLine::Prompt(_) => {
            let step = (*enroll_step).min(4);
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: 0,
                    step,
                    total: 4,
                },
            );
            *enroll_step = enroll_step.saturating_add(1);
            None
        }
        FirmwareLine::EnrollOk(slot) => {
            if let Ok(profiles) = state.profiles.lock() {
                let _ = profiles.mark_enrolled(slot);
            }
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: slot as u8,
                    step: 4,
                    total: 4,
                },
            );
            *enroll_step = 1;
            None
        }
        FirmwareLine::EnrollErr(slot) => {
            emit_enroll_error(app, slot as u8);
            *enroll_step = 1;
            None
        }
        FirmwareLine::DeleteOk(slot) | FirmwareLine::DeleteErr(slot) => {
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: slot as u8,
                    step: 0,
                    total: 4,
                },
            );
            None
        }
        FirmwareLine::Event(event) => {
            let profiles = state.profiles.clone();
            let secret_store = state.secret_store.clone();
            let pairing_key = state.secret_store.pairing_key("default");
            let result = handle_sensor_event(
                &event,
                &pairing_key,
                seen_nonces,
                |slot| profiles.lock().ok()?.get_profile(slot).ok(),
                |reference| secret_store.get(reference),
                gate,
                started.elapsed().as_secs_f64(),
            );
            if let Ok(Some((reply, executed, label))) = result {
                let _ = app.emit(
                    "finger_touch_event",
                    FingerTouchEvent {
                        finger_id: event.slot as u8,
                        action: label,
                        status: if executed {
                            TouchStatus::Executed
                        } else {
                            TouchStatus::Armed
                        },
                    },
                );
                return Some(reply);
            }
            None
        }
        FirmwareLine::Other(_) => None,
    }
}

fn write_admin_command(port: &mut Box<dyn serialport::SerialPort>, command: AdminCommand) {
    let line = match command {
        AdminCommand::Enroll(slot) => format!("ENROLL {}\n", slot),
        AdminCommand::Delete(slot) => format!("DELETE {}\n", slot),
    };
    let _ = port.write_all(line.as_bytes());
    let _ = port.flush();
}

fn update_connection(
    app: &AppHandle,
    state: &AppState,
    port: Option<String>,
    kind: Option<TouchPassPortKind>,
) {
    let connected = port.is_some();
    if let Ok(mut status) = state.status.lock() {
        status.connected = connected;
        status.port = port.clone();
        status.device_id = port.clone();
        status.sensor_status = match kind {
            Some(TouchPassPortKind::Runtime) => "checking",
            Some(TouchPassPortKind::Bootloader) => "bootloader",
            Some(TouchPassPortKind::Candidate) if connected => "checking",
            _ => "unavailable",
        }
        .to_string();
        status.firmware_mode = match kind {
            Some(TouchPassPortKind::Runtime) => "checking".to_string(),
            Some(TouchPassPortKind::Bootloader) => "bootloader".to_string(),
            Some(TouchPassPortKind::Candidate) if connected => "unknown".to_string(),
            _ => "unknown".to_string(),
        };
        status.background_worker = "running".to_string();
    }
    let _ = app.emit(
        "device_status_change",
        DeviceStatusChange { connected, port },
    );
}

fn emit_enroll_error(app: &AppHandle, finger_id: u8) {
    let _ = app.emit(
        "enroll_step_progress",
        EnrollStepProgress {
            finger_id,
            step: 0,
            total: 4,
        },
    );
}
