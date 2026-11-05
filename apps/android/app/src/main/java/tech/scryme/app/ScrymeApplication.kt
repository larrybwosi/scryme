package tech.scryme.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import tech.scryme.app.analytics.OpenPanelTracker
import tech.scryme.app.analytics.models.OpenPanelEvents
import tech.scryme.app.notifications.NotificationHelper
import javax.inject.Inject

@HiltAndroidApp
class ScrymeApplication : Application() {

    @Inject
    lateinit var openPanelTracker: OpenPanelTracker

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannels(this)
        openPanelTracker.track(OpenPanelEvents.APP_OPENED)
    }
}
