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
    const val TASKS_CHANNEL_ID = "tasks_updates_channel"
    const val DAILY_SHIFT_CHANNEL_ID = "daily_shifts_channel"
    const val POS_CHANNEL_ID = "pos_alerts_channel"
    const val ANNOUNCEMENTS_CHANNEL_ID = "announcements_channel"
    const val ATTENDANCE_CHANNEL_ID = "attendance_alerts_channel"

    const val EXTRA_TARGET_SCREEN = "extra_target_screen"
    const val EXTRA_NOTIFICATION_TITLE = "extra_notification_title"
    const val EXTRA_NOTIFICATION_BODY = "extra_notification_body"
    const val EXTRA_PAYLOAD_DATA = "extra_payload_data"

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

                val tasksChannel = NotificationChannel(
                    TASKS_CHANNEL_ID,
                    "Task Assignments & Updates",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Notifications for new task assignments, updates, and deadlines"
                }

                val dailyShiftChannel = NotificationChannel(
                    DAILY_SHIFT_CHANNEL_ID,
                    "Daily Shifts & Roster Summary",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Daily shift reminders and scheduled task summaries"
                }

                val posChannel = NotificationChannel(
                    POS_CHANNEL_ID,
                    "POS & Pairing Alerts",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Notifications for POS pairing and system alerts"
                }

                val announcementsChannel = NotificationChannel(
                    ANNOUNCEMENTS_CHANNEL_ID,
                    "General Announcements",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Company-wide broadcasts, updates, and announcements"
                }

                val attendanceChannel = NotificationChannel(
                    ATTENDANCE_CHANNEL_ID,
                    "Attendance Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Geofence check-in reminders, late alerts, and attendance updates"
                }

                notificationManager?.createNotificationChannel(scheduleChannel)
                notificationManager?.createNotificationChannel(tasksChannel)
                notificationManager?.createNotificationChannel(dailyShiftChannel)
                notificationManager?.createNotificationChannel(posChannel)
                notificationManager?.createNotificationChannel(announcementsChannel)
                notificationManager?.createNotificationChannel(attendanceChannel)
            }
        } catch (e: Throwable) {
            // Ignored in test environment
        }
    }

    fun showScheduleNotification(
        context: Context,
        title: String,
        message: String,
        targetScreen: String? = "schedule",
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        showNotification(context, SCHEDULE_CHANNEL_ID, title, message, targetScreen, notificationId)
    }

    fun showTaskNotification(
        context: Context,
        title: String,
        message: String,
        targetScreen: String? = "tasks",
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        showNotification(context, TASKS_CHANNEL_ID, title, message, targetScreen, notificationId)
    }

    fun showDailyShiftNotification(
        context: Context,
        title: String,
        message: String,
        targetScreen: String? = "schedule",
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        showNotification(context, DAILY_SHIFT_CHANNEL_ID, title, message, targetScreen, notificationId)
    }

    fun showAnnouncementNotification(
        context: Context,
        title: String,
        message: String,
        targetScreen: String? = "admin",
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        showNotification(context, ANNOUNCEMENTS_CHANNEL_ID, title, message, targetScreen, notificationId)
    }

    fun showAttendanceNotification(
        context: Context,
        title: String,
        message: String,
        targetScreen: String? = "schedule",
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        showNotification(context, ATTENDANCE_CHANNEL_ID, title, message, targetScreen, notificationId)
    }

    fun showNotification(
        context: Context,
        channelId: String,
        title: String,
        message: String,
        targetScreen: String? = null,
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        try {
            createNotificationChannels(context)

            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra(EXTRA_TARGET_SCREEN, targetScreen)
                putExtra(EXTRA_NOTIFICATION_TITLE, title)
                putExtra(EXTRA_NOTIFICATION_BODY, message)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, channelId)
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
