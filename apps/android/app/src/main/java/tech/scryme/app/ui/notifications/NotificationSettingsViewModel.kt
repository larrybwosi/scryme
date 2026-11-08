package tech.scryme.app.ui.notifications

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.notifications.NotificationHelper
import javax.inject.Inject

data class NotificationSettingsUiState(
    val notificationsEnabled: Boolean = true,
    val shiftNotifications: Boolean = true,
    val taskNotifications: Boolean = true,
    val dailyShiftNotifications: Boolean = true,
    val posNotifications: Boolean = true,
    val announcementNotifications: Boolean = true,
    val attendanceNotifications: Boolean = true,
    val testTriggerMessage: String? = null
)

private data class CoreNotificationPrefs(
    val master: Boolean,
    val shift: Boolean,
    val task: Boolean,
    val daily: Boolean
)

private data class AlertNotificationPrefs(
    val pos: Boolean,
    val announce: Boolean,
    val attend: Boolean
)

@HiltViewModel
class NotificationSettingsViewModel @Inject constructor(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _testTriggerMessage = MutableStateFlow<String?>(null)

    private val corePrefsFlow = combine(
        sessionManager.notificationsEnabledFlow,
        sessionManager.shiftNotificationsFlow,
        sessionManager.taskNotificationsFlow,
        sessionManager.dailyShiftNotificationsFlow
    ) { master, shift, task, daily ->
        CoreNotificationPrefs(master, shift, task, daily)
    }

    private val alertPrefsFlow = combine(
        sessionManager.posNotificationsFlow,
        sessionManager.announcementNotificationsFlow,
        sessionManager.attendanceNotificationsFlow
    ) { pos, announce, attend ->
        AlertNotificationPrefs(pos, announce, attend)
    }

    val uiState: StateFlow<NotificationSettingsUiState> = combine(
        corePrefsFlow,
        alertPrefsFlow,
        _testTriggerMessage
    ) { core, alert, testMsg ->
        NotificationSettingsUiState(
            notificationsEnabled = core.master,
            shiftNotifications = core.shift,
            taskNotifications = core.task,
            dailyShiftNotifications = core.daily,
            posNotifications = alert.pos,
            announcementNotifications = alert.announce,
            attendanceNotifications = alert.attend,
            testTriggerMessage = testMsg
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = NotificationSettingsUiState()
    )

    fun setMasterNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updateNotificationsEnabled(enabled)
        }
    }

    fun setShiftNotifications(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updateShiftNotifications(enabled)
        }
    }

    fun setTaskNotifications(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updateTaskNotifications(enabled)
        }
    }

    fun setDailyShiftNotifications(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updateDailyShiftNotifications(enabled)
        }
    }

    fun setPosNotifications(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updatePosNotifications(enabled)
        }
    }

    fun setAnnouncementNotifications(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updateAnnouncementNotifications(enabled)
        }
    }

    fun setAttendanceNotifications(enabled: Boolean) {
        viewModelScope.launch {
            sessionManager.updateAttendanceNotifications(enabled)
        }
    }

    fun triggerTestNotification(context: Context, channelId: String) {
        viewModelScope.launch {
            when (channelId) {
                NotificationHelper.SCHEDULE_CHANNEL_ID -> {
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Shift Schedule Update",
                        "Your shift for tomorrow has been confirmed."
                    )
                    _testTriggerMessage.value = "Sent test alert for Schedule & Shifts"
                }
                NotificationHelper.TASKS_CHANNEL_ID -> {
                    NotificationHelper.showTaskNotification(
                        context,
                        "New Task Assigned",
                        "Review POS inventory discrepancies before end of day."
                    )
                    _testTriggerMessage.value = "Sent test alert for Task Assignments"
                }
                NotificationHelper.DAILY_SHIFT_CHANNEL_ID -> {
                    NotificationHelper.showDailyShiftNotification(
                        context,
                        "Daily Roster Summary",
                        "3 team members on duty at Headquarters today."
                    )
                    _testTriggerMessage.value = "Sent test alert for Daily Shifts"
                }
                NotificationHelper.POS_CHANNEL_ID -> {
                    NotificationHelper.showPosNotification(
                        context,
                        "POS Device Paired",
                        "Terminal 01 successfully paired with active branch."
                    )
                    _testTriggerMessage.value = "Sent test alert for POS & Hardware"
                }
                NotificationHelper.ANNOUNCEMENTS_CHANNEL_ID -> {
                    NotificationHelper.showAnnouncementNotification(
                        context,
                        "Company Announcement",
                        "Welcome to the updated Scryme Android mobile workspace."
                    )
                    _testTriggerMessage.value = "Sent test alert for Announcements"
                }
                NotificationHelper.ATTENDANCE_CHANNEL_ID -> {
                    NotificationHelper.showAttendanceNotification(
                        context,
                        "Geofence Clock-in",
                        "You arrived at Headquarters. Ready to check in."
                    )
                    _testTriggerMessage.value = "Sent test alert for Attendance"
                }
            }
        }
    }

    fun clearTestMessage() {
        _testTriggerMessage.value = null
    }
}
