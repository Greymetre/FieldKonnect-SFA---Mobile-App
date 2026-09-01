import Foundation
import React
import UserNotifications

@objc(FieldKonnectNotifications)
class FieldKonnectNotifications: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(requestAuthorization:rejecter:)
  func requestAuthorization(
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if let error = error {
        reject("notification_permission_failed", error.localizedDescription, error)
        return
      }

      resolve(granted)
    }
  }

  @objc(showNotification:message:resolver:rejecter:)
  func showNotification(
    title: String,
    message: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = message
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: "fieldkonnect-location-\(UUID().uuidString)",
      content: content,
      trigger: nil
    )

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        reject("notification_failed", error.localizedDescription, error)
        return
      }

      resolve(true)
    }
  }
}

@objc(AppInfo)
class AppInfo: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc
  func constantsToExport() -> [AnyHashable: Any] {
    [
      "versionName": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0.0.0",
      "versionCode": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "0",
    ]
  }
}
