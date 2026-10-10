package tech.scryme.app.notifications

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class ScrymeFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed FCM registration token: $token")
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
    }

    companion object {
        private const val TAG = "ScrymeFCM"
    }
}
