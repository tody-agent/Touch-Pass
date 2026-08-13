use serialport::available_ports;

pub fn list_device_ports() -> Vec<String> {
    let mut result = Vec::new();
    if let Ok(ports) = available_ports() {
        for p in ports {
            let name = p.port_name;
            if name.contains("usbmodem") || name.contains("usbserial") || name.starts_with("COM") {
                result.push(name);
            }
        }
    }
    result.sort();
    result
}
