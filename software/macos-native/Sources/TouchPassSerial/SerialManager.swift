import Foundation
import TouchPassCore

public actor SerialManager {
    private let hotplugMonitor = IOKitHotplugMonitor()
    private var activePort: AsyncSerialPort?
    private var activeDevice: TouchPassDevice?
    private var readTask: Task<Void, Never>?

    public var onConnectionChanged: (@Sendable (Bool, TouchPassDevice?) -> Void)?
    public var onStatusUpdated: (@Sendable (StatusLine) -> Void)?
    public var onSensorEventReceived: (@Sendable (SensorEvent) -> Void)?
    public var onEnrollPrompt: (@Sendable (String) -> Void)?
    public var onRawLineReceived: (@Sendable (String) -> Void)?

    public func setCallbacks(
        onConnectionChanged: (@Sendable (Bool, TouchPassDevice?) -> Void)? = nil,
        onStatusUpdated: (@Sendable (StatusLine) -> Void)? = nil,
        onSensorEventReceived: (@Sendable (SensorEvent) -> Void)? = nil,
        onEnrollPrompt: (@Sendable (String) -> Void)? = nil,
        onRawLineReceived: (@Sendable (String) -> Void)? = nil
    ) {
        if let onConnectionChanged { self.onConnectionChanged = onConnectionChanged }
        if let onStatusUpdated { self.onStatusUpdated = onStatusUpdated }
        if let onSensorEventReceived { self.onSensorEventReceived = onSensorEventReceived }
        if let onEnrollPrompt { self.onEnrollPrompt = onEnrollPrompt }
        if let onRawLineReceived { self.onRawLineReceived = onRawLineReceived }
    }

    public init() {}

    public func start() {
        hotplugMonitor.onDevicesChanged = { [weak self] devices in
            Task { [weak self] in
                await self?.handleDevicesChanged(devices)
            }
        }
        hotplugMonitor.startMonitoring()
        let initialDevices = IOKitHotplugMonitor.discoverDevices()
        handleDevicesChanged(initialDevices)
    }

    public func stop() {
        hotplugMonitor.stopMonitoring()
        disconnect()
    }

    public func getActiveDevice() -> TouchPassDevice? {
        return activeDevice
    }

    public func isConnected() -> Bool {
        return activePort != nil
    }

    private func handleDevicesChanged(_ devices: [TouchPassDevice]) {
        if let runtime = devices.first(where: { $0.kind == .runtime }) {
            if activeDevice?.path != runtime.path {
                connect(to: runtime)
            }
        } else if let bootloader = devices.first(where: { $0.kind == .bootloader }) {
            disconnect()
            activeDevice = bootloader
            onConnectionChanged?(false, bootloader)
        } else if let fallback = devices.first {
            if activeDevice?.path != fallback.path {
                connect(to: fallback)
            }
        } else {
            disconnect()
        }
    }

    public func connect(to device: TouchPassDevice) {
        disconnect()
        let port = AsyncSerialPort(path: device.path)
        do {
            try port.open()
            self.activePort = port
            self.activeDevice = device
            self.onConnectionChanged?(true, device)

            // Start listening to lines
            readTask = Task { [weak self, port] in
                for await line in port.lines {
                    await self?.processLine(line)
                }
            }

            // Send initial STATUS probe
            try? port.writeLine("STATUS")
        } catch {
            print("Failed to open port \(device.path): \(error)")
        }
    }

    public func disconnect() {
        readTask?.cancel()
        readTask = nil
        activePort?.close()
        activePort = nil
        let prev = activeDevice
        activeDevice = nil
        if prev != nil {
            onConnectionChanged?(false, nil)
        }
    }

    public func sendCommand(_ cmd: String) throws {
        guard let port = activePort else {
            throw AsyncSerialPortError.portClosed
        }
        try port.writeLine(cmd)
    }

    private func processLine(_ line: String) {
        onRawLineReceived?(line)
        let parsed = TouchPassProtocol.parseFirmwareLine(line)
        switch parsed {
        case .status(let statusLine):
            onStatusUpdated?(statusLine)
        case .event(let sensorEvent):
            onSensorEventReceived?(sensorEvent)
        case .prompt(let msg):
            onEnrollPrompt?(msg)
        default:
            break
        }
    }
}
