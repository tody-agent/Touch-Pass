use crate::admin_flow::{AdminFlow, AdminFlowAction, AdminOperation};
use crate::gate::TriggerGate;
use crate::protocol::{handle_sensor_event, parse_firmware_line, FirmwareLine};
use crate::serial::{list_touchpass_ports, TouchPassPortKind};
use crate::state::{AdminCommand, AppState};
use crate::types::{
    CommandError, DeviceStatusChange, EnrollStepProgress, ErrorCode, FingerProfile,
    FingerTouchEvent, SensorStatus, TouchStatus, WorkerStatus,
};
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
    let mut gate = TriggerGate::new(3.0);
    let mut seen_nonces = VecDeque::new();
    let started = Instant::now();

    loop {
        let ports = list_touchpass_ports();
        let selected = ports.first().cloned();
        let selected_name = selected.as_ref().map(|port| port.name.clone());
        if matches!(
            selected.as_ref().map(|port| port.kind),
            Some(TouchPassPortKind::Bootloader)
        ) {
            update_connection(
                &app,
                &state,
                selected_name,
                Some(TouchPassPortKind::Bootloader),
            );
            reject_pending_commands(&app, &rx, "bootloader");
            thread::sleep(Duration::from_millis(750));
            continue;
        }

        if let Some(port_name) = selected_name {
            let open_result = serialport::new(&port_name, 115_200)
                .timeout(Duration::from_millis(120))
                .open();
            if let Ok(mut port) = open_result {
                update_connection(
                    &app,
                    &state,
                    Some(port_name),
                    selected.as_ref().map(|port| port.kind),
                );
                let _ = port.write_all(b"STATUS\n");
                let mut line = String::new();
                let mut buffer = [0u8; 1];
                let mut enroll_step = 1u8;
                let mut admin_flow = AdminFlow::default();
                let mut pending_delete_reply: Option<
                    mpsc::Sender<Result<FingerProfile, CommandError>>,
                > = None;
                let mut admin_started: Option<Instant> = None;
                let mut last_status = Instant::now();
                let mut last_rx = Instant::now();
                loop {
                    while let Ok(command) = rx.try_recv() {
                        let (operation, delete_reply) = match command {
                            AdminCommand::Enroll(slot) => (AdminOperation::Enroll(slot), None),
                            AdminCommand::Delete { slot, reply } => {
                                (AdminOperation::Delete(slot), Some(reply))
                            }
                        };
                        match admin_flow.start(operation) {
                            Ok(unlock) => {
                                pending_delete_reply = delete_reply;
                                if port
                                    .write_all(unlock.as_bytes())
                                    .and_then(|_| port.flush())
                                    .is_err()
                                {
                                    emit_admin_action(
                                        &app,
                                        &state,
                                        AdminFlowAction::Failed {
                                            operation,
                                            reason: "serial_write".to_string(),
                                        },
                                        &mut enroll_step,
                                        &mut pending_delete_reply,
                                    );
                                    admin_flow.clear();
                                } else {
                                    admin_started = Some(Instant::now());
                                }
                            }
                            Err(reason) => {
                                let mut rejected_delete_reply = delete_reply;
                                emit_admin_action(
                                    &app,
                                    &state,
                                    AdminFlowAction::Failed {
                                        operation,
                                        reason: reason.to_string(),
                                    },
                                    &mut enroll_step,
                                    &mut rejected_delete_reply,
                                )
                            }
                        }
                    }
                    if admin_flow.is_active()
                        && admin_started
                            .is_some_and(|started| admin_operation_timed_out(started.elapsed()))
                    {
                        let action = admin_flow.cancel("timeout");
                        emit_admin_action(
                            &app,
                            &state,
                            action,
                            &mut enroll_step,
                            &mut pending_delete_reply,
                        );
                        admin_started = None;
                    }
                    if last_status.elapsed() >= Duration::from_secs(2) {
                        if port.write_all(b"STATUS\n").is_err() {
                            let action = admin_flow.cancel("connection_lost");
                            emit_admin_action(
                                &app,
                                &state,
                                action,
                                &mut enroll_step,
                                &mut pending_delete_reply,
                            );
                            break;
                        }
                        let _ = port.flush();
                        last_status = Instant::now();
                    }
                    match port.read(&mut buffer) {
                        Ok(1) if buffer[0] == b'\n' => {
                            last_rx = Instant::now();
                            let context = LineContext {
                                app: &app,
                                state: &state,
                                gate: &mut gate,
                                seen_nonces: &mut seen_nonces,
                                enroll_step: &mut enroll_step,
                                admin_flow: &mut admin_flow,
                                pending_delete_reply: &mut pending_delete_reply,
                                started,
                            };
                            if let Some(reply) = handle_line(context, line.trim()) {
                                if port
                                    .write_all(reply.as_bytes())
                                    .and_then(|_| port.flush())
                                    .is_err()
                                {
                                    let action = admin_flow.cancel("serial_write");
                                    emit_admin_action(
                                        &app,
                                        &state,
                                        action,
                                        &mut enroll_step,
                                        &mut pending_delete_reply,
                                    );
                                    break;
                                }
                            }
                            if !admin_flow.is_active() {
                                admin_started = None;
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
                            if should_disconnect(admin_flow.is_active(), last_rx.elapsed()) {
                                let action = admin_flow.cancel("connection_lost");
                                emit_admin_action(
                                    &app,
                                    &state,
                                    action,
                                    &mut enroll_step,
                                    &mut pending_delete_reply,
                                );
                                break;
                            }
                        }
                    }
                }
                update_connection(&app, &state, None, None);
            } else {
                reject_pending_commands(&app, &rx, "serial_open");
                update_connection(&app, &state, None, None);
            }
        } else {
            reject_pending_commands(&app, &rx, "sensor_unavailable");
            update_connection(&app, &state, None, None);
        }
        thread::sleep(Duration::from_millis(750));
    }
}

fn should_disconnect(admin_active: bool, silence: Duration) -> bool {
    !admin_active && silence > Duration::from_secs(8)
}

fn admin_operation_timed_out(elapsed: Duration) -> bool {
    elapsed > Duration::from_secs(120)
}

fn reject_pending_commands(app: &AppHandle, rx: &mpsc::Receiver<AdminCommand>, reason: &str) {
    while let Ok(command) = rx.try_recv() {
        reject_admin_command(Some(app), command, reason);
    }
}

fn reject_admin_command(app: Option<&AppHandle>, command: AdminCommand, reason: &str) {
    match command {
        AdminCommand::Enroll(finger_id) => {
            if let Some(app) = app {
                emit_enroll_error_with_reason(app, finger_id as u8, reason);
            }
        }
        AdminCommand::Delete { reply, .. } => {
            let _ = reply.send(Err(CommandError::with_detail(
                ErrorCode::HardwareUnavailable,
                reason,
            )));
        }
    }
}

struct LineContext<'a> {
    app: &'a AppHandle,
    state: &'a AppState,
    gate: &'a mut TriggerGate,
    seen_nonces: &'a mut VecDeque<String>,
    enroll_step: &'a mut u8,
    admin_flow: &'a mut AdminFlow,
    pending_delete_reply: &'a mut Option<mpsc::Sender<Result<FingerProfile, CommandError>>>,
    started: Instant,
}

fn handle_line(context: LineContext<'_>, line: &str) -> Option<String> {
    let LineContext {
        app,
        state,
        gate,
        seen_nonces,
        enroll_step,
        admin_flow,
        pending_delete_reply,
        started,
    } = context;
    let parsed = parse_firmware_line(line);
    let admin_action = admin_flow.handle(&parsed);
    if !matches!(admin_action, AdminFlowAction::None) {
        if let AdminFlowAction::Write(command) = admin_action {
            return Some(command);
        }
        emit_admin_action(app, state, admin_action, enroll_step, pending_delete_reply);
        return None;
    }

    match parsed {
        FirmwareLine::Status(status) => {
            let change = if let Ok(mut current) = state.status.lock() {
                current.sensor_status = if status.sensor_ok {
                    SensorStatus::Ok
                } else {
                    SensorStatus::Error
                };
                current.firmware_mode = status.mode;
                current.fingerprint_count = status.fingerprints;
                current.hid_key_configured = status.hid_key_configured;
                current.background_worker = WorkerStatus::Running;
                Some(DeviceStatusChange {
                    connected: current.connected,
                    port: current.port.clone(),
                    sensor_status: current.sensor_status,
                })
            } else {
                None
            };
            if let Some(change) = change {
                let _ = app.emit("device_status_change", change);
            }
            None
        }
        FirmwareLine::Prompt(_)
        | FirmwareLine::ConfigUnlockOk
        | FirmwareLine::ConfigUnlockErr(_)
        | FirmwareLine::ConfigLocked
        | FirmwareLine::EnrollOk(_)
        | FirmwareLine::EnrollErr { .. }
        | FirmwareLine::DeleteOk(_)
        | FirmwareLine::DeleteErr(_) => None,
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
            if let Ok(Some((reply, executed, action_type))) = result {
                let _ = app.emit(
                    "finger_touch_event",
                    FingerTouchEvent {
                        finger_id: event.slot as u8,
                        action_type,
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

fn update_connection(
    app: &AppHandle,
    state: &AppState,
    port: Option<String>,
    kind: Option<TouchPassPortKind>,
) {
    let connected = port.is_some();
    let sensor_status = match kind {
        Some(TouchPassPortKind::Runtime) => SensorStatus::Checking,
        Some(TouchPassPortKind::Bootloader) => SensorStatus::Bootloader,
        Some(TouchPassPortKind::Candidate) if connected => SensorStatus::Checking,
        _ => SensorStatus::Unavailable,
    };
    let changed = if let Ok(mut status) = state.status.lock() {
        let changed = status.connected != connected
            || status.port != port
            || status.sensor_status != sensor_status;
        status.connected = connected;
        status.port = port.clone();
        status.device_id = port.clone();
        status.sensor_status = sensor_status;
        status.firmware_mode = match kind {
            Some(TouchPassPortKind::Runtime) => "checking".to_string(),
            Some(TouchPassPortKind::Bootloader) => "bootloader".to_string(),
            Some(TouchPassPortKind::Candidate) if connected => "unknown".to_string(),
            _ => "unknown".to_string(),
        };
        status.background_worker = WorkerStatus::Running;
        changed
    } else {
        false
    };
    if changed {
        let _ = app.emit(
            "device_status_change",
            DeviceStatusChange {
                connected,
                port,
                sensor_status,
            },
        );
    }
}

fn emit_enroll_error_with_reason(app: &AppHandle, finger_id: u8, reason: &str) {
    let _ = app.emit(
        "enroll_step_progress",
        EnrollStepProgress {
            finger_id,
            step: 0,
            total: 4,
            message: Some(reason.to_string()),
        },
    );
}

fn emit_admin_action(
    app: &AppHandle,
    state: &AppState,
    action: AdminFlowAction,
    enroll_step: &mut u8,
    pending_delete_reply: &mut Option<mpsc::Sender<Result<FingerProfile, CommandError>>>,
) {
    match action {
        AdminFlowAction::UnlockPrompt => {
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: 0,
                    step: 1,
                    total: 4,
                    message: Some("unlock_existing".to_string()),
                },
            );
        }
        AdminFlowAction::OperationPrompt(message) => {
            let step = (*enroll_step).min(3);
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: 0,
                    step,
                    total: 4,
                    message: Some(message.to_ascii_lowercase()),
                },
            );
            *enroll_step = enroll_step.saturating_add(1);
        }
        AdminFlowAction::Completed(AdminOperation::Enroll(slot)) => {
            let persisted = state
                .profiles
                .lock()
                .map_err(|_| CommandError::internal("profile store lock poisoned"))
                .and_then(|profiles| profiles.mark_enrolled(slot));
            if persisted.is_err() {
                emit_enroll_error_with_reason(app, slot as u8, "persistence_failed");
                *enroll_step = 1;
                return;
            }
            let _ = app.emit(
                "enroll_step_progress",
                EnrollStepProgress {
                    finger_id: slot as u8,
                    step: 4,
                    total: 4,
                    message: Some("stored".to_string()),
                },
            );
            *enroll_step = 1;
        }
        AdminFlowAction::Completed(AdminOperation::Delete(slot)) => {
            let result = state
                .profiles
                .lock()
                .map_err(|_| CommandError::internal("profile store lock poisoned"))
                .and_then(|profiles| profiles.reset_profile(slot));
            if let Some(reply) = pending_delete_reply.take() {
                let _ = reply.send(result);
            }
        }
        AdminFlowAction::Failed { operation, reason } => {
            let slot = match operation {
                AdminOperation::Enroll(slot) | AdminOperation::Delete(slot) => slot,
            };
            emit_enroll_error_with_reason(app, slot as u8, &reason);
            if matches!(operation, AdminOperation::Delete(_)) {
                if let Some(reply) = pending_delete_reply.take() {
                    let _ = reply.send(Err(CommandError::with_detail(
                        ErrorCode::HardwareUnavailable,
                        reason,
                    )));
                }
            }
            *enroll_step = 1;
        }
        AdminFlowAction::None | AdminFlowAction::Write(_) => {}
    }
}

#[cfg(test)]
mod tests {
    use super::{admin_operation_timed_out, reject_admin_command, should_disconnect};
    use crate::state::AdminCommand;
    use std::sync::mpsc;
    use std::time::Duration;

    #[test]
    fn enrollment_silence_does_not_force_disconnect() {
        assert!(!should_disconnect(true, Duration::from_secs(15)));
        assert!(!should_disconnect(true, Duration::from_secs(60)));
    }

    #[test]
    fn idle_silence_still_detects_lost_connection() {
        assert!(should_disconnect(false, Duration::from_secs(9)));
    }

    #[test]
    fn whole_operation_timeout_allows_the_firmware_worst_case() {
        assert!(!admin_operation_timed_out(Duration::from_secs(90)));
        assert!(!admin_operation_timed_out(Duration::from_secs(120)));
        assert!(admin_operation_timed_out(Duration::from_secs(121)));
    }

    #[test]
    fn queued_delete_is_rejected_when_runtime_port_is_unusable() {
        let (reply_tx, reply_rx) = mpsc::channel();
        reject_admin_command(
            None,
            AdminCommand::Delete {
                slot: 6,
                reply: reply_tx,
            },
            "bootloader",
        );

        let error = reply_rx.recv().unwrap().unwrap_err();
        assert_eq!(error.detail.as_deref(), Some("bootloader"));
    }
}
