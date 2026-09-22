import AppKit
import SwiftUI
import TouchPassCore
import TouchPassSerial
import TouchPassStorage
import TouchPassSmartCard

/// MenuBarExtra as the first scene makes SwiftUI an agent app: the process
/// starts, but no dashboard window is ordered front, so a click looks like
/// the app never opened. Force a regular app and bring the dashboard forward.
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        DispatchQueue.main.async {
            AppDelegate.presentDashboard()
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    @MainActor
    static func presentDashboard() {
        NSApp.setActivationPolicy(.regular)
        NSApp.unhide(nil)
        NSApp.activate()
        for window in NSApp.windows where window.canBecomeMain && window.frame.height > 100 {
            window.makeKeyAndOrderFront(nil)
        }
    }
}

@main
struct TouchPassApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var coordinator = AppCoordinator()

    var body: some Scene {
        // WindowGroup must be the primary scene so launch and Dock reopen
        // create a visible dashboard. MenuBarExtra stays secondary.
        WindowGroup("TouchPass Dashboard", id: "main-window") {
            MainWindowView(coordinator: coordinator)
                .frame(minWidth: 880, minHeight: 560)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }

        // Keep the symbol stable. Swapping systemImage on connect/touch
        // rebuilds the status item and can push the app back to accessory.
        MenuBarExtra("TouchPass", systemImage: "touchid") {
            MenuBarView(coordinator: coordinator)
        }
        .menuBarExtraStyle(.window)
    }
}
