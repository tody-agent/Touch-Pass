import Foundation
import CryptoKit
import CommonCrypto

public enum TouchPassCryptoError: Error, Equatable {
    case encryptionFailed(Int32)
    case decryptionFailed(Int32)
    case invalidKeyLength
    case replayDetected
}

public struct TouchPassCrypto: Sendable {
    public static func hmacSHA256Hex(key: Data, message: String) -> String {
        let symmetricKey = SymmetricKey(data: key)
        let mac = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: symmetricKey)
        return mac.map { String(format: "%02x", $0) }.joined()
    }

    public static func deriveSessionKey(pairingKey: Data, nonce: String) -> Data {
        let message = "SESSION|\(nonce)"
        let symmetricKey = SymmetricKey(data: pairingKey)
        let mac = HMAC<SHA256>.authenticationCode(for: Data(message.utf8), using: symmetricKey)
        return Data(mac.prefix(16)) // 128-bit AES key
    }

    private static func runAESCTR(op: CCOperation, key: Data, iv: Data, input: Data) throws -> Data {
        var cryptor: CCCryptorRef?
        let mode = CCMode(kCCModeCTR)
        let options = CCModeOptions(kCCModeOptionCTR_BE)

        let createStatus = key.withUnsafeBytes { keyBuf in
            iv.withUnsafeBytes { ivBuf in
                CCCryptorCreateWithMode(
                    op,
                    mode,
                    CCAlgorithm(kCCAlgorithmAES),
                    CCPadding(ccNoPadding),
                    ivBuf.baseAddress,
                    keyBuf.baseAddress,
                    key.count,
                    nil,
                    0,
                    0,
                    options,
                    &cryptor
                )
            }
        }

        guard createStatus == kCCSuccess, let cryptor = cryptor else {
            throw op == kCCEncrypt ? TouchPassCryptoError.encryptionFailed(createStatus) : TouchPassCryptoError.decryptionFailed(createStatus)
        }
        defer {
            CCCryptorRelease(cryptor)
        }

        var output = Data(count: input.count)
        var bytesMoved = 0
        let outputCapacity = output.count
        let inputCount = input.count

        let updateStatus = input.withUnsafeBytes { inBuf in
            output.withUnsafeMutableBytes { outBuf in
                CCCryptorUpdate(
                    cryptor,
                    inBuf.baseAddress,
                    inputCount,
                    outBuf.baseAddress,
                    outputCapacity,
                    &bytesMoved
                )
            }
        }

        guard updateStatus == kCCSuccess else {
            throw op == kCCEncrypt ? TouchPassCryptoError.encryptionFailed(updateStatus) : TouchPassCryptoError.decryptionFailed(updateStatus)
        }

        return output
    }

    public static func encryptAESCTR(key: Data, nonce: String, plaintext: Data) throws -> (ivHex: String, ciphertextHex: String) {
        var ivBytes = [UInt8](repeating: 0, count: 16)
        _ = SecRandomCopyBytes(kSecRandomDefault, 16, &ivBytes)
        let ivData = Data(ivBytes)

        let ciphertext = try runAESCTR(op: CCOperation(kCCEncrypt), key: key, iv: ivData, input: plaintext)
        let ivHex = ivData.map { String(format: "%02x", $0) }.joined()
        let cipherHex = ciphertext.map { String(format: "%02x", $0) }.joined()
        return (ivHex, cipherHex)
    }

    public static func decryptAESCTR(key: Data, iv: Data, ciphertext: Data) throws -> Data {
        return try runAESCTR(op: CCOperation(kCCDecrypt), key: key, iv: iv, input: ciphertext)
    }
}

public actor NonceReplayFilter {
    private var seenNonces: [String] = []
    private let capacity: Int

    public init(capacity: Int = 64) {
        self.capacity = capacity
    }

    public func validateAndRecord(nonce: String) -> Bool {
        if seenNonces.contains(nonce) {
            return false
        }
        seenNonces.append(nonce)
        if seenNonces.count > capacity {
            seenNonces.removeFirst()
        }
        return true
    }

    public func clear() {
        seenNonces.removeAll()
    }
}
