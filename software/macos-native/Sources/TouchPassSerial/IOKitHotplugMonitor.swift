import Foundation
import IOKit
import IOKit.serial
import IOKit.usb

public enum TouchPassDeviceKind: Sendable, Equatable {
    case runtime       // TinyUSB composite VID 0x303A, PID 0x4001
    case bootloader    // ESP32-S3 ROM bootloader VID 0x303A, PID 0x1001
    case otherSerial   // Any other fallback serial modem
}

public struct TouchPassDevice: Sendable, Equatable {
    public let path: String
    public let kind: TouchPassDeviceKind
    public let serialNumber: String?

    public init(path: String, kind: TouchPassDeviceKind, serialNumber: String? = nil) {
        self.path = path
        self.kind = kind
        self.serialNumber = serialNumber
    }
}

public final class IOKitHotplugMonitor: @unchecked Sendable {
    public static let espressifVID: UInt16 = 0x303A
    public static let touchPassPID: UInt16 = 0x4001
    public static let bootloaderPID: UInt16 = 0x1001

    private var notifyPort: IONotificationPortRef?
    private var addedIterator: io_iterator_t = 0
    private var removedIterator: io_iterator_t = 0
    private let queue = DispatchQueue(label: "com.touchpass.hotplug", qos: .utility)

    public var onDevicesChanged: (@Sendable ([TouchPassDevice]) -> Void)?

    public init() {}

    deinit {
        stopMonitoring()
    }

    public static func discoverDevices() -> [TouchPassDevice] {
        var devices: [TouchPassDevice] = []
        let matchingDict = IOServiceMatching(kIOSerialBSDServiceValue) as NSMutableDictionary
        matchingDict[kIOSerialBSDTypeKey] = kIOSerialBSDAllTypes

        var iterator: io_iterator_t = 0
        let result = IOServiceGetMatchingServices(kIOMainPortDefault, matchingDict, &iterator)
        guard result == KERN_SUCCESS else { return [] }
        defer { IOObjectRelease(iterator) }

        var service = IOIteratorNext(iterator)
        while service != 0 {
            if let device = inspectSerialService(service) {
                devices.append(device)
            }
            IOObjectRelease(service)
            service = IOIteratorNext(iterator)
        }

        // Sort so that runtime devices take precedence
        devices.sort { a, b in
            if a.kind == .runtime && b.kind != .runtime { return true }
            return false
        }
        return devices
    }

    public func startMonitoring() {
        queue.async { [weak self] in
            guard let self else { return }
            self.notifyPort = IONotificationPortCreate(kIOMainPortDefault)
            guard let notifyPort = self.notifyPort else { return }
            let runLoopSource = IONotificationPortGetRunLoopSource(notifyPort).takeUnretainedValue()
            CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .defaultMode)

            let matchingDict = IOServiceMatching(kIOSerialBSDServiceValue) as NSMutableDictionary
            matchingDict[kIOSerialBSDTypeKey] = kIOSerialBSDAllTypes

            // Match device arrival
            IOServiceAddMatchingNotification(
                notifyPort,
                kIOMatchedNotification,
                matchingDict,
                { refcon, iterator in
                    guard let refcon else { return }
                    let monitor = Unmanaged<IOKitHotplugMonitor>.fromOpaque(refcon).takeUnretainedValue()
                    monitor.drainIterator(iterator)
                    monitor.notifyDevices()
                },
                Unmanaged.passUnretained(self).toOpaque(),
                &self.addedIterator
            )

            // Match device departure
            let removeDict = IOServiceMatching(kIOSerialBSDServiceValue) as NSMutableDictionary
            removeDict[kIOSerialBSDTypeKey] = kIOSerialBSDAllTypes

            IOServiceAddMatchingNotification(
                notifyPort,
                kIOTerminatedNotification,
                removeDict,
                { refcon, iterator in
                    guard let refcon else { return }
                    let monitor = Unmanaged<IOKitHotplugMonitor>.fromOpaque(refcon).takeUnretainedValue()
                    monitor.drainIterator(iterator)
                    monitor.notifyDevices()
                },
                Unmanaged.passUnretained(self).toOpaque(),
                &self.removedIterator
            )

            self.drainIterator(self.addedIterator)
            self.drainIterator(self.removedIterator)
            self.notifyDevices()

            CFRunLoopRun()
        }
    }

    public func stopMonitoring() {
        if let notifyPort {
            IONotificationPortDestroy(notifyPort)
            self.notifyPort = nil
        }
        if addedIterator != 0 {
            IOObjectRelease(addedIterator)
            addedIterator = 0
        }
        if removedIterator != 0 {
            IOObjectRelease(removedIterator)
            removedIterator = 0
        }
    }

    private func drainIterator(_ iterator: io_iterator_t) {
        var service = IOIteratorNext(iterator)
        while service != 0 {
            IOObjectRelease(service)
            service = IOIteratorNext(iterator)
        }
    }

    private func notifyDevices() {
        let devices = Self.discoverDevices()
        onDevicesChanged?(devices)
    }

    private static func inspectSerialService(_ service: io_object_t) -> TouchPassDevice? {
        guard let pathCF = IORegistryEntryCreateCFProperty(service, kIOCalloutDeviceKey as CFString, kCFAllocatorDefault, 0) else {
            return nil
        }
        let bsdPath = pathCF.takeRetainedValue() as? String ?? ""
        guard !bsdPath.isEmpty else { return nil }

        // Filter only usb modem devices
        guard bsdPath.contains("usbmodem") || bsdPath.contains("usbserial") else {
            return nil
        }

        // Traverse parent entries in IORegistry to find USB VID and PID
        var parent: io_registry_entry_t = 0
        var current = service
        IOObjectRetain(current)

        var vid: UInt16?
        var pid: UInt16?
        var serialNum: String?

        while IORegistryEntryGetParentEntry(current, kIOServicePlane, &parent) == KERN_SUCCESS {
            IOObjectRelease(current)
            current = parent

            if vid == nil, let v = getUInt16Property(current, key: "idVendor") {
                vid = v
            }
            if pid == nil, let p = getUInt16Property(current, key: "idProduct") {
                pid = p
            }
            if serialNum == nil, let s = getStringProperty(current, key: "USB Serial Number") {
                serialNum = s
            }

            if vid != nil && pid != nil {
                break
            }
        }
        IOObjectRelease(current)

        let kind: TouchPassDeviceKind
        if vid == espressifVID {
            if pid == touchPassPID {
                kind = .runtime
            } else if pid == bootloaderPID {
                kind = .bootloader
            } else {
                kind = .otherSerial
            }
        } else {
            kind = .otherSerial
        }

        return TouchPassDevice(path: bsdPath, kind: kind, serialNumber: serialNum)
    }

    private static func getUInt16Property(_ entry: io_registry_entry_t, key: String) -> UInt16? {
        guard let prop = IORegistryEntryCreateCFProperty(entry, key as CFString, kCFAllocatorDefault, 0) else {
            return nil
        }
        let num = prop.takeRetainedValue() as? NSNumber
        return num?.uint16Value
    }

    private static func getStringProperty(_ entry: io_registry_entry_t, key: String) -> String? {
        guard let prop = IORegistryEntryCreateCFProperty(entry, key as CFString, kCFAllocatorDefault, 0) else {
            return nil
        }
        return prop.takeRetainedValue() as? String
    }
}
