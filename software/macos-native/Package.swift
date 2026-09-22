// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TouchPassNative",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "TouchPassApp", targets: ["TouchPassApp"]),
        .executable(name: "TouchPassTests", targets: ["TouchPassTests"]),
        .library(name: "TouchPassCore", targets: ["TouchPassCore"]),
        .library(name: "TouchPassSerial", targets: ["TouchPassSerial"]),
        .library(name: "TouchPassStorage", targets: ["TouchPassStorage"]),
        .library(name: "TouchPassSmartCard", targets: ["TouchPassSmartCard"])
    ],
    dependencies: [],
    targets: [
        .target(
            name: "TouchPassCore",
            dependencies: []
        ),
        .target(
            name: "TouchPassSerial",
            dependencies: ["TouchPassCore"]
        ),
        .target(
            name: "TouchPassStorage",
            dependencies: ["TouchPassCore"]
        ),
        .target(
            name: "TouchPassSmartCard",
            dependencies: ["TouchPassCore"]
        ),
        .executableTarget(
            name: "TouchPassApp",
            dependencies: [
                "TouchPassCore",
                "TouchPassSerial",
                "TouchPassStorage",
                "TouchPassSmartCard"
            ]
        ),
        .executableTarget(
            name: "TouchPassTests",
            dependencies: [
                "TouchPassCore",
                "TouchPassSerial",
                "TouchPassStorage",
                "TouchPassSmartCard"
            ]
        )
    ]
)
