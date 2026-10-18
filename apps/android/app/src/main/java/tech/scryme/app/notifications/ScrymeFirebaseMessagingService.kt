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
import tech.scryme.app.domain.repository.AuthRepository
import javax.inject.Inject

@AndroidEntryPoint
class ScrymeFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var sessionManager: SessionManager

    @Inject
    lateinit var authRepository: AuthRepository

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed FCM registration token: $token")
        serviceScope.launch {
            try {
                sessionManager.saveFcmToken(token)
                authRepository.registerDeviceToken(token)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to persist or sync FCM token", e)
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

        val type = (data["type"] ?: data["eventType"] ?: data["category"] ?: data["topic"] ?: "").uppercase()

        when {
            type.contains("ANNOUNCEMENT") || type.contains("BROADCAST") -> {
                NotificationHelper.showAnnouncementNotification(applicationContext, title, body)
            }
            type.contains("ATTENDANCE") || type.contains("CLOCK") || type.contains("GEOFENCE") -> {
                NotificationHelper.showAttendanceNotification(applicationContext, title, body)
            }
            type.contains("POS") || type.contains("PAIR") || type.contains("SYSTEM") || type.contains("SALE") -> {
                NotificationHelper.showPosNotification(applicationContext, title, body)
            }
            type.contains("TASK") -> {
                NotificationHelper.showTaskNotification(applicationContext, title, body)
            }
            type.contains("DAILY") || type.contains("ROSTER") -> {
                NotificationHelper.showDailyShiftNotification(applicationContext, title, body)
            }
            else -> {
                // Default shift & schedule changes
                NotificationHelper.showScheduleNotification(applicationContext, title, body)
            }
        }

        // Send local broadcast so foreground UI (MainActivity / Compose Snackbar) displays it immediately
        try {
            val intent = Intent(ACTION_FOREGROUND_NOTIFICATION).apply {
                setPackage(packageName)
                putExtra(EXTRA_NOTIFICATION_TITLE, title)
                putExtra(EXTRA_NOTIFICATION_BODY, body)
                putExtra(EXTRA_NOTIFICATION_TYPE, type)
            }
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending foreground notification broadcast", e)
        }
    }

    companion object {
        private const val TAG = "ScrymeFCM"
        const val ACTION_FOREGROUND_NOTIFICATION = "tech.scryme.app.ACTION_FOREGROUND_NOTIFICATION"
        const val EXTRA_NOTIFICATION_TITLE = "extra_notification_title"
        const val EXTRA_NOTIFICATION_BODY = "extra_notification_body"
        const val EXTRA_NOTIFICATION_TYPE = "extra_notification_type"
    }
}
