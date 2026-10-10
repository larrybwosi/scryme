package tech.scryme.app

import android.content.Context
import io.mockk.*
import org.junit.Test
import tech.scryme.app.notifications.NotificationHelper

class NotificationHelperTest {

    @Test
    fun showScheduleNotification_doesNotCrash() {
        val context = mockk<Context>(relaxed = true)
        NotificationHelper.showScheduleNotification(context, "Shift Changed", "Your shift was moved to 09:00.")
    }

    @Test
    fun showTaskNotification_doesNotCrash() {
        val context = mockk<Context>(relaxed = true)
        NotificationHelper.showTaskNotification(context, "Task Assigned", "You were assigned to inventory audit.")
    }

    @Test
    fun showDailyShiftNotification_doesNotCrash() {
        val context = mockk<Context>(relaxed = true)
        NotificationHelper.showDailyShiftNotification(context, "Daily Summary", "You have 1 shift scheduled today.")
    }
}
