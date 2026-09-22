import SwiftUI
import TouchPassCore
import TouchPassSerial
import TouchPassStorage
import TouchPassSmartCard

@main
struct TouchPassApp: App {
    @StateObject private var coordinator = AppCoordinator()

    var body: some Scene {
        MenuBarExtra("TouchPass", systemImage: coordinator.menuBarIcon) {
            MenuBarView(coordinator: coordinator)
        }
        .menuBarExtraStyle(.window)

        Window("TouchPass Dashboard", id: "main-window") {
            MainWindowView(coordinator: coordinator)
                .frame(minWidth: 880, minHeight: 560)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)
    }
}
