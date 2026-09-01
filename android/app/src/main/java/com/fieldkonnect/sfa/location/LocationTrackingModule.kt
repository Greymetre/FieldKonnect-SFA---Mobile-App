package com.fieldkonnect.sfa.location

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import androidx.core.content.ContextCompat

class LocationTrackingModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LocationTracking"

  @ReactMethod
  fun startLocationTrackingAfterPunchIn(userData: ReadableMap?, token: String?, promise: Promise) {
    try {
      val authToken = token?.takeIf { it.isNotBlank() } ?: LocationStorage.token(reactContext)
      if (authToken.isNullOrBlank()) {
        promise.reject("missing_token", "Cannot start live location tracking without an auth token")
        return
      }
      val intent = Intent(reactContext, LocationForegroundService::class.java).apply {
        action = LocationForegroundService.ACTION_START
        putExtra(LocationForegroundService.EXTRA_TOKEN, authToken)
        userData?.let { putExtra(LocationForegroundService.EXTRA_USER_DATA, it.toHashMap().toString()) }
      }
      ContextCompat.startForegroundService(reactContext, intent)
      android.util.Log.d("FieldKonnectLocation", "Punch-in tracking started")
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("start_failed", error)
    }
  }

  @ReactMethod
  fun stopLocationTrackingAfterPunchOut(promise: Promise) {
    try {
      // Do not launch a foreground service only to stop it when tracking is
      // already inactive. Android requires every service launched with
      // startForegroundService() to promote itself immediately; exiting
      // before that promotion causes a RemoteServiceException and kills the
      // app shortly after Home loads.
      if (!LocationStorage.isActive(reactContext)) {
        reactContext.stopService(
          Intent(reactContext, LocationForegroundService::class.java),
        )
        promise.resolve(true)
        return
      }

      val intent = Intent(reactContext, LocationForegroundService::class.java).apply {
        action = LocationForegroundService.ACTION_STOP
      }
      ContextCompat.startForegroundService(reactContext, intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("stop_failed", error)
    }
  }

  @ReactMethod
  fun syncPendingLocations(promise: Promise) {
    try {
      if (!LocationStorage.isActive(reactContext)) {
        promise.resolve(true)
        return
      }

      val intent = Intent(reactContext, LocationForegroundService::class.java).apply {
        action = LocationForegroundService.ACTION_SYNC
      }
      ContextCompat.startForegroundService(reactContext, intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("sync_failed", error)
    }
  }

  @ReactMethod
  fun getTrackingStatus(promise: Promise) {
    try {
      val status = LocationStorage.status(reactContext)
      val map = Arguments.createMap().apply {
        putBoolean("active", status.optBoolean("active"))
        putDouble("startedAt", status.optLong("startedAt").toDouble())
        putDouble("lastCapturedAt", status.optLong("lastCapturedAt").toDouble())
        putInt("pendingCount", status.optInt("pendingCount"))
      }
      promise.resolve(map)
    } catch (error: Exception) {
      promise.reject("status_failed", error)
    }
  }

}
