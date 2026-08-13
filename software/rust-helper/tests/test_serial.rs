use touchpass_helper::serial::list_device_ports;

#[test]
fn test_list_device_ports_returns_vec() {
    let ports = list_device_ports();
    // Verification that scanning doesn't panic
    let _ = ports.len();
}
