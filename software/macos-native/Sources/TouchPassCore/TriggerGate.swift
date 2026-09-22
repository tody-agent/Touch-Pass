import Foundation

public enum GateDecision: Equatable, Sendable {
    case armed
    case execute
}

public struct TriggerGate: Sendable {
    public let windowSeconds: Double
    private var lastTouchTimes: [Int: Double] = [:]

    public init(windowSeconds: Double = 3.0) {
        self.windowSeconds = windowSeconds
    }

    public mutating func touch(slot: Int, requireConfirm: Bool, nowSeconds: Double) -> GateDecision {
        guard requireConfirm else {
            return .execute
        }

        if let last = lastTouchTimes[slot], (nowSeconds - last) <= windowSeconds {
            lastTouchTimes.removeValue(forKey: slot)
            return .execute
        }

        lastTouchTimes[slot] = nowSeconds
        return .armed
    }

    public mutating func reset() {
        lastTouchTimes.removeAll()
    }
}
