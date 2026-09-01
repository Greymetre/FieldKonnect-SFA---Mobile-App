package com.fieldkonnect.sfa.location

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class QueuedLocation(
  val id: String,
  val latitude: Double,
  val longitude: Double,
  val time: String,
  val createdAt: Long,
)

object LocationStorage {
  private const val PREFS = "fieldkonnect_location_tracking"
  private const val KEY_ACTIVE = "active"
  private const val KEY_STARTED_AT = "started_at"
  private const val KEY_LAST_CAPTURED_AT = "last_captured_at"
  private const val KEY_TOKEN = "token"
  private const val KEY_USER_DATA = "user_data"
  private const val KEY_QUEUE = "queue"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun isActive(context: Context): Boolean = prefs(context).getBoolean(KEY_ACTIVE, false)

  fun setActive(context: Context, active: Boolean, token: String? = null, userData: String? = null) {
    prefs(context).edit().apply {
      putBoolean(KEY_ACTIVE, active)
      if (active) {
        putLong(KEY_STARTED_AT, System.currentTimeMillis())
        if (!token.isNullOrBlank()) putString(KEY_TOKEN, token)
        if (!userData.isNullOrBlank()) putString(KEY_USER_DATA, userData)
      } else {
        remove(KEY_STARTED_AT)
        remove(KEY_LAST_CAPTURED_AT)
        remove(KEY_TOKEN)
        remove(KEY_USER_DATA)
      }
    }.apply()
  }

  fun token(context: Context): String? = prefs(context).getString(KEY_TOKEN, null)

  fun lastCapturedAt(context: Context): Long = prefs(context).getLong(KEY_LAST_CAPTURED_AT, 0L)

  fun markCaptured(context: Context, capturedAt: Long = System.currentTimeMillis()) {
    prefs(context).edit().putLong(KEY_LAST_CAPTURED_AT, capturedAt).apply()
  }

  fun enqueue(context: Context, latitude: Double, longitude: Double, time: String = apiDateTime()): QueuedLocation {
    val item = QueuedLocation(
      id = "${System.currentTimeMillis()}-${(1000..9999).random()}",
      latitude = latitude,
      longitude = longitude,
      time = time,
      createdAt = System.currentTimeMillis(),
    )
    val queue = JSONArray(prefs(context).getString(KEY_QUEUE, "[]"))
    queue.put(JSONObject().apply {
      put("id", item.id)
      put("latitude", item.latitude)
      put("longitude", item.longitude)
      put("time", item.time)
      put("createdAt", item.createdAt)
    })
    prefs(context).edit().putString(KEY_QUEUE, queue.toString()).apply()
    return item
  }

  fun queued(context: Context): List<QueuedLocation> {
    val queue = JSONArray(prefs(context).getString(KEY_QUEUE, "[]"))
    val items = mutableListOf<QueuedLocation>()
    for (index in 0 until queue.length()) {
      val item = queue.optJSONObject(index) ?: continue
      items.add(
        QueuedLocation(
          id = item.optString("id"),
          latitude = item.optDouble("latitude"),
          longitude = item.optDouble("longitude"),
          time = item.optString("time"),
          createdAt = item.optLong("createdAt"),
        )
      )
    }
    return items
  }

  fun removeQueued(context: Context, ids: Set<String>) {
    if (ids.isEmpty()) return
    val nextQueue = JSONArray()
    queued(context).forEach { item ->
      if (!ids.contains(item.id)) {
        nextQueue.put(JSONObject().apply {
          put("id", item.id)
          put("latitude", item.latitude)
          put("longitude", item.longitude)
          put("time", item.time)
          put("createdAt", item.createdAt)
        })
      }
    }
    prefs(context).edit().putString(KEY_QUEUE, nextQueue.toString()).apply()
  }

  fun status(context: Context): JSONObject =
    JSONObject().apply {
      put("active", isActive(context))
      put("startedAt", prefs(context).getLong(KEY_STARTED_AT, 0L))
      put("lastCapturedAt", lastCapturedAt(context))
      put("pendingCount", queued(context).size)
    }

  fun apiDateTime(date: Date = Date()): String =
    SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(date)
}
