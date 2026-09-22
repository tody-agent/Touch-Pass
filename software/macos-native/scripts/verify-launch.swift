import CoreGraphics
import Foundation

/// Fails unless TouchPass owns an on-screen window large enough to be the dashboard.
/// Menu-bar backing windows are ~30pt tall and do not count.
let info = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
let dashboards = info.filter { window in
    let owner = window[kCGWindowOwnerName as String] as? String ?? ""
    guard owner == "TouchPass" else { return false }
    let bounds = window[kCGWindowBounds as String] as? [String: Any] ?? [:]
    let height = (bounds["Height"] as? NSNumber)?.doubleValue ?? 0
    let width = (bounds["Width"] as? NSNumber)?.doubleValue ?? 0
    return height >= 200 && width >= 400
}

if dashboards.isEmpty {
    fputs("FAIL: TouchPass has no on-screen dashboard window (height>=200, width>=400)\n", stderr)
    exit(1)
}

print("PASS: TouchPass dashboard window is on screen (\(dashboards.count))")
