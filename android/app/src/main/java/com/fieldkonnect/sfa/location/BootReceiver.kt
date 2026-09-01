package com.fieldkonnect.sfa.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val action = intent?.action ?: return
    if (!LocationStorage.isActive(context)) return

    if (
      action == Intent.ACTION_BOOT_COMPLETED ||
      action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
      action == Intent.ACTION_MY_PACKAGE_REPLACED
    ) {
      Log.d("FieldKonnectLocation", "Restarting tracking after $action")
      val serviceIntent = Intent(context, LocationForegroundService::class.java).apply {
        this.action = LocationForegroundService.ACTION_START
      }
      ContextCompat.startForegroundService(context, serviceIntent)
    }
  }
}
