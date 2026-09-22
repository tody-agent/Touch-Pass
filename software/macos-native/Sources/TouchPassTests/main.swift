import Foundation
import TouchPassCore

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

print("🧪 Running TouchPassCore smoke test...")
assertTrue(!TouchPassCoreVersion.version.isEmpty, "version should not be empty")
print("✅ Smoke test passed!")
