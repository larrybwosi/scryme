package tech.scryme.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import tech.scryme.app.notifications.NotificationHelper

@HiltAndroidApp
class ScrymeApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannels(this)
    }
}
