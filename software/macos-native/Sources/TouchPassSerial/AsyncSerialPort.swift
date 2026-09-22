import Foundation
import Darwin

public enum AsyncSerialPortError: Error, Equatable {
    case openFailed(Int32)
    case configureFailed(Int32)
    case writeFailed(Int32)
    case portClosed
}

public final class AsyncSerialPort: @unchecked Sendable {
    private var fileDescriptor: Int32 = -1
    private let path: String
    private var readSource: DispatchSourceRead?
    private let readQueue = DispatchQueue(label: "com.touchpass.serial.read", qos: .userInitiated)
    private var lineContinuation: AsyncStream<String>.Continuation?
    private var readBuffer = Data()

    public let lines: AsyncStream<String>

    public init(path: String) {
        self.path = path
        var continuation: AsyncStream<String>.Continuation?
        self.lines = AsyncStream { cont in
            continuation = cont
        }
        self.lineContinuation = continuation
    }

    deinit {
        close()
    }

    public func open(baudRate: speed_t = speed_t(B115200)) throws {
        let fd = Darwin.open(path, O_RDWR | O_NOCTTY | O_NONBLOCK)
        guard fd >= 0 else {
            throw AsyncSerialPortError.openFailed(errno)
        }
        self.fileDescriptor = fd

        // Configure termios
        var options = termios()
        guard tcgetattr(fd, &options) == 0 else {
            Darwin.close(fd)
            self.fileDescriptor = -1
            throw AsyncSerialPortError.configureFailed(errno)
        }

        cfmakeraw(&options)
        cfsetspeed(&options, baudRate)

        // 8N1
        options.c_cflag |= tcflag_t(CS8 | CLOCAL | CREAD)
        options.c_cflag &= ~tcflag_t(PARENB | CSTOPB | CRTSCTS)

        options.c_cc.16 = 1 // VMIN
        options.c_cc.17 = 0 // VTIME

        guard tcsetattr(fd, TCSANOW, &options) == 0 else {
            Darwin.close(fd)
            self.fileDescriptor = -1
            throw AsyncSerialPortError.configureFailed(errno)
        }

        // Start reading via DispatchSource
        let source = DispatchSource.makeReadSource(fileDescriptor: fd, queue: readQueue)
        source.setEventHandler { [weak self] in
            guard let self else { return }
            var chunk = [UInt8](repeating: 0, count: 512)
            let bytesRead = Darwin.read(fd, &chunk, chunk.count)
            if bytesRead > 0 {
                self.processIncomingBytes(Data(chunk.prefix(bytesRead)))
            } else if bytesRead == 0 {
                self.close()
            }
        }
        source.setCancelHandler {
            Darwin.close(fd)
        }
        source.resume()
        self.readSource = source
    }

    private func processIncomingBytes(_ data: Data) {
        readBuffer.append(data)
        while let newlineIdx = readBuffer.firstIndex(of: 0x0A) { // '\n'
            let lineData = readBuffer.subdata(in: readBuffer.startIndex..<newlineIdx)
            readBuffer.removeSubrange(readBuffer.startIndex...newlineIdx)
            if let lineStr = String(data: lineData, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines), !lineStr.isEmpty {
                lineContinuation?.yield(lineStr)
            }
        }
    }

    public func writeLine(_ line: String) throws {
        guard fileDescriptor >= 0 else {
            throw AsyncSerialPortError.portClosed
        }
        let fullLine = line.hasSuffix("\n") ? line : line + "\n"
        let data = Data(fullLine.utf8)
        let bytesWritten = data.withUnsafeBytes { buffer in
            Darwin.write(fileDescriptor, buffer.baseAddress, data.count)
        }
        guard bytesWritten == data.count else {
            throw AsyncSerialPortError.writeFailed(errno)
        }
        tcdrain(fileDescriptor)
    }

    public func close() {
        if let source = readSource {
            source.cancel()
            self.readSource = nil
            self.fileDescriptor = -1
        } else if fileDescriptor >= 0 {
            Darwin.close(fileDescriptor)
            self.fileDescriptor = -1
        }
        lineContinuation?.finish()
        lineContinuation = nil
    }
}
