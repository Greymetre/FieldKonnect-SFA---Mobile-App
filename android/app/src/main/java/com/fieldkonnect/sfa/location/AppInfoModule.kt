package com.fieldkonnect.sfa.location

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.fieldkonnect.sfa.BuildConfig

class AppInfoModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AppInfo"

  override fun getConstants(): Map<String, Any> =
    mapOf(
      "versionName" to BuildConfig.VERSION_NAME,
      "versionCode" to BuildConfig.VERSION_CODE,
    )

  /**
   * Opens the system chooser listing every installed email app (Gmail, Outlook, ...)
   * so the user picks one, instead of jumping straight to the default mail app.
   */
  @ReactMethod
  fun composeEmail(email: String, promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:" + Uri.encode(email)))
      val chooser = Intent.createChooser(intent, "Send email with").apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      if (intent.resolveActivity(reactApplicationContext.packageManager) == null) {
        promise.reject("NO_EMAIL_APP", "No email app is installed.")
        return
      }
      reactApplicationContext.startActivity(chooser)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("EMAIL_FAILED", error.message, error)
    }
  }
}
