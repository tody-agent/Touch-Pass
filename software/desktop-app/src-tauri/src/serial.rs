use serialport::{available_ports, SerialPortType};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TouchPassPortKind {
    Runtime,
    Bootloader,
    Candidate,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TouchPassPort {
    pub name: String,
    pub kind: TouchPassPortKind,
}

pub fn list_touchpass_ports() -> Vec<TouchPassPort> {
    let mut result = Vec::new();
    if let Ok(ports) = available_ports() {
        for port in ports {
            let name = port.port_name;
            let kind = match &port.port_type {
                SerialPortType::UsbPort(info) if info.vid == 0x303a && info.pid == 0x4001 => {
                    Some(TouchPassPortKind::Runtime)
                }
                SerialPortType::UsbPort(info) if info.vid == 0x303a && info.pid == 0x1001 => {
                    Some(TouchPassPortKind::Bootloader)
                }
                SerialPortType::UsbPort(info)
                    if info.vid == 0x303a
                        || info
                            .product
                            .as_deref()
                            .unwrap_or("")
                            .to_ascii_lowercase()
                            .contains("esp") =>
                {
                    Some(TouchPassPortKind::Candidate)
                }
                _ => None,
            };
            if kind.is_some()
                || name.contains("usbmodem")
                || name.contains("usbserial")
                || name.contains("wchusbserial")
                || name.starts_with("COM")
            {
                let inferred = kind.unwrap_or(TouchPassPortKind::Candidate);
                result.push(TouchPassPort {
                    name,
                    kind: inferred,
                });
            }
        }
    }
    result.sort_by_key(|port| match port.kind {
        TouchPassPortKind::Runtime => 0,
        TouchPassPortKind::Bootloader => 1,
        TouchPassPortKind::Candidate => 2,
    });
    result
}
