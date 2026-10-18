package tech.scryme.app.notifications

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import javax.inject.Inject

@AndroidEntryPoint
class ScrymeFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var sessionManager: SessionManager

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed FCM registration token: $token")
        serviceScope.launch {
            try {
                sessionManager.saveFcmToken(token)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save FCM token to session manager", e)
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val data = remoteMessage.data
        val notification = remoteMessage.notification

        val title = notification?.title
            ?: data["title"]
            ?: "Scryme Notification"

        val body = notification?.body
            ?: data["body"]
            ?: data["message"]
            ?: "You have a new update."

        val rawType = (data["type"] ?: data["eventType"] ?: data["category"] ?: data["topic"] ?: "").uppercase()
        val targetScreen = data["targetScreen"] ?: data["screen"] ?: data["route"]

        Log.d(TAG, "Notification received: title=$title, body=$body, type=$rawType, targetScreen=$targetScreen")

        // Broadcast event for foreground in-app display
        val foregroundIntent = Intent(ACTION_FOREGROUND_NOTIFICATION).apply {
            setPackage(packageName)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_BODY, body)
            putExtra(EXTRA_TYPE, rawType)
            putExtra(EXTRA_TARGET_SCREEN, targetScreen)
        }
        sendBroadcast(foregroundIntent)

        // Also post to system tray using notification channels
        when {
            rawType.contains("TASK") -> {
                NotificationHelper.showTaskNotification(
                    context = applicationContext,
                    title = title,
                    message = body,
                    targetScreen = targetScreen ?: "tasks"
                )
            }
            rawType.contains("ATTENDANCE") || rawType.contains("CHECKIN") || rawType.contains("GEOFENCE") -> {
                NotificationHelper.showAttendanceNotification(
                    context = applicationContext,
                    title = title,
                    message = body,
                    targetScreen = targetScreen ?: "schedule"
                )
            }
            rawType.contains("ANNOUNCEMENT") || rawType.contains("BROADCAST") -> {
                NotificationHelper.showAnnouncementNotification(
                    context = applicationContext,
                    title = title,
                    message = body,
                    targetScreen = targetScreen ?: "admin"
                )
            }
            rawType.contains("DAILY") || rawType.contains("ROSTER") -> {
                NotificationHelper.showDailyShiftNotification(
                    context = applicationContext,
                    title = title,
                    message = body,
                    targetScreen = targetScreen ?: "schedule"
                )
            }
            else -> {
                // Default schedule & shift changes
                NotificationHelper.showScheduleNotification(
                    context = applicationContext,
                    title = title,
                    message = body,
                    targetScreen = targetScreen ?: "schedule"
                )
            }
        }
    }

    companion object {
        private const val TAG = "ScrymeFCM"
        const val ACTION_FOREGROUND_NOTIFICATION = "tech.scryme.app.FOREGROUND_NOTIFICATION"
        const val EXTRA_TITLE = "title"
        const val EXTRA_BODY = "body"
        const val EXTRA_TYPE = "type"
        const val EXTRA_TARGET_SCREEN = "targetScreen"
    }
}
