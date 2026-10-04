package tech.scryme.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import tech.scryme.app.MainActivity
import tech.scryme.app.R

object NotificationHelper {

    const val SCHEDULE_CHANNEL_ID = "schedule_updates_channel"
    const val POS_CHANNEL_ID = "pos_alerts_channel"

    fun createNotificationChannels(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

                val scheduleChannel = NotificationChannel(
                    SCHEDULE_CHANNEL_ID,
                    "Schedule & Shift Updates",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for roster changes, shift assignments, and trades"
                }

                val posChannel = NotificationChannel(
                    POS_CHANNEL_ID,
                    "POS & Pairing Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Notifications for POS pairing and system alerts"
                }

                notificationManager?.createNotificationChannel(scheduleChannel)
                notificationManager?.createNotificationChannel(posChannel)
            }
        } catch (e: Throwable) {
            // Ignored in test environment
        }
    }

    fun showScheduleNotification(
        context: Context,
        title: String,
        message: String,
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        try {
            createNotificationChannels(context)

            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, SCHEDULE_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)

            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.notify(notificationId, builder.build())
        } catch (e: Throwable) {
            // Ignored in test environment
        }
    }
}
