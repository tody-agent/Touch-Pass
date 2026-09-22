import Foundation
import TouchPassCore
import TouchPassSerial

func assertTrue(_ condition: Bool, _ message: String = "") {
    if !condition {
        print("❌ ASSERTION FAILED: \(message)")
        exit(1)
    }
}

func assertEqual<T: Equatable>(_ actual: T, _ expected: T, _ message: String = "") {
    if actual != expected {
        print("❌ ASSERTION FAILED: expected '\(expected)', got '\(actual)'. \(message)")
        exit(1)
    }
}

@main
struct TouchPassTestsMain {
    static func main() async throws {
        print("🧪 Running TouchPass Native Test Suite...")

        // Test 1: Version
        assertTrue(!TouchPassCoreVersion.version.isEmpty, "version should not be empty")

        // Test 2: Crypto HMAC-SHA256
        let rawKeyHex = "41555448454e5449434154494f4e5f4b45595f54494e59544f5543485f323032"
        var keyBytes = [UInt8]()
        var index = rawKeyHex.startIndex
        while index < rawKeyHex.endIndex {
            let nextIndex = rawKeyHex.index(index, offsetBy: 2)
            if let byte = UInt8(rawKeyHex[index..<nextIndex], radix: 16) {
                keyBytes.append(byte)
            }
            index = nextIndex
        }
        let keyData = Data(keyBytes)
        let mac = TouchPassCrypto.hmacSHA256Hex(key: keyData, message: "TEST_MSG")
        assertTrue(!mac.isEmpty, "mac should not be empty")
        assertEqual(mac.count, 64, "hmac sha256 hex string should be 64 characters")

        // Test 3: Session Key Derivation
        let sessionKey = TouchPassCrypto.deriveSessionKey(pairingKey: keyData, nonce: "NONCE12345")
        assertEqual(sessionKey.count, 16, "session key should be 16 bytes for AES-128")

        // Test 4: AES-128-CTR Round Trip
        let plaintext = Data("Hello TouchPass ESP32-S3!".utf8)
        let (ivHex, ciphertextHex) = try TouchPassCrypto.encryptAESCTR(key: sessionKey, nonce: "NONCE12345", plaintext: plaintext)
        assertTrue(!ivHex.isEmpty, "ivHex should not be empty")
        assertTrue(!ciphertextHex.isEmpty, "ciphertextHex should not be empty")

        var ivBytes = [UInt8]()
        var ivIdx = ivHex.startIndex
        while ivIdx < ivHex.endIndex {
            let next = ivHex.index(ivIdx, offsetBy: 2)
            ivBytes.append(UInt8(ivHex[ivIdx..<next], radix: 16)!)
            ivIdx = next
        }
        var cipherBytes = [UInt8]()
        var cIdx = ciphertextHex.startIndex
        while cIdx < ciphertextHex.endIndex {
            let next = ciphertextHex.index(cIdx, offsetBy: 2)
            cipherBytes.append(UInt8(ciphertextHex[cIdx..<next], radix: 16)!)
            cIdx = next
        }

        let decrypted = try TouchPassCrypto.decryptAESCTR(key: sessionKey, iv: Data(ivBytes), ciphertext: Data(cipherBytes))
        assertEqual(decrypted, plaintext, "decrypted data must match original plaintext")

        // Test 5: Nonce Replay Filter
        let replayFilter = NonceReplayFilter(capacity: 3)
        let firstCheck = await replayFilter.validateAndRecord(nonce: "NONCE_A")
        assertTrue(firstCheck, "first check of unique nonce should be allowed")
        let secondCheck = await replayFilter.validateAndRecord(nonce: "NONCE_A")
        assertTrue(!secondCheck, "replay of same nonce should be rejected")

        // Test 6: Protocol Parser
        let statusLine = "OK STATUS mode=hid sensor=ok fingerprints=2 hid_key=configured keys=nvs"
        let parsedStatus = TouchPassProtocol.parseFirmwareLine(statusLine)
        assertEqual(parsedStatus, .status(StatusLine(
            mode: "hid",
            sensorOk: true,
            fingerprints: 2,
            hidKeyConfigured: true,
            hidConfigurationSupported: true
        )), "status line parsing")

        let eventLine = "EV 12345678 0001 2 95 abcdef0123456789"
        let parsedEvent = TouchPassProtocol.parseFirmwareLine(eventLine)
        assertEqual(parsedEvent, .event(SensorEvent(
            nonce: "12345678",
            counter: "0001",
            slot: 2,
            score: "95",
            mac: "abcdef0123456789"
        )), "event line parsing")

        // Test 7: Action Encoder
        let aiAcceptData = try ActionEncoder.encode(actionType: .aiAccept) { _ in Data() }
        assertEqual(Array(aiAcceptData), [1, 2, 1, 1, 0x79, 2, 0, 0x28], "aiAccept bytecode")

        let customData = try ActionEncoder.encode(actionType: .custom, customPayload: "git status") { _ in Data() }
        assertEqual(customData[0], 1, "version 1")
        assertEqual(customData[1], 1, "1 step")
        assertEqual(customData[2], 1, "op_text")
        assertEqual(customData[3], 10, "10 bytes")

        // Test 8: Trigger Gate (Double-touch safety)
        var gate = TriggerGate(windowSeconds: 3.0)
        let decNoConfirm = gate.touch(slot: 1, requireConfirm: false, nowSeconds: 100.0)
        assertEqual(decNoConfirm, .execute, "no confirm required executes immediately")

        let dec1 = gate.touch(slot: 2, requireConfirm: true, nowSeconds: 100.0)
        assertEqual(dec1, .armed, "first touch arms")
        let dec2 = gate.touch(slot: 2, requireConfirm: true, nowSeconds: 101.5)
        assertEqual(dec2, .execute, "second touch within window executes")

        // Test 9: IOKit Hotplug Device Discovery
        let discoveredDevices = IOKitHotplugMonitor.discoverDevices()
        print("ℹ️ IOKit discovered \(discoveredDevices.count) serial modem device(s).")

        print("✅ Task 2, 3, 4 tests passed successfully!")
    }
}
