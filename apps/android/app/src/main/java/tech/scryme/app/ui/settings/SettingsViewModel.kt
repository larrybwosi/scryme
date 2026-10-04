package tech.scryme.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.ProfileRepository
import javax.inject.Inject

data class SettingsUiState(
    val themeMode: String = "SYSTEM",
    val dutyStatus: String = "ONLINE",
    val notificationsEnabled: Boolean = true,
    val shiftNotifications: Boolean = true,
    val taskNotifications: Boolean = true,
    val userName: String = "",
    val userEmail: String = "",
    val orgSlug: String = "",
    val locationId: String = ""
)

private data class PrefsState(
    val themeMode: String,
    val dutyStatus: String,
    val notificationsEnabled: Boolean,
    val shiftNotifications: Boolean,
    val taskNotifications: Boolean
)

private data class AccountState(
    val userName: String,
    val userEmail: String,
    val orgSlug: String,
    val locationId: String
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val profileRepository: ProfileRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val prefsFlow = combine(
        sessionManager.themeModeFlow,
        sessionManager.dutyStatusFlow,
        sessionManager.notificationsEnabledFlow,
        sessionManager.shiftNotificationsFlow,
        sessionManager.taskNotificationsFlow
    ) { theme, status, notifs, shiftNotifs, taskNotifs ->
        PrefsState(
            themeMode = theme,
            dutyStatus = status,
            notificationsEnabled = notifs,
            shiftNotifications = shiftNotifs,
            taskNotifications = taskNotifs
        )
    }

    private val accountFlow = combine(
        sessionManager.userNameFlow,
        sessionManager.userEmailFlow,
        sessionManager.orgSlugFlow,
        sessionManager.locationIdFlow
    ) { name, email, org, loc ->
        AccountState(
            userName = name ?: "User",
            userEmail = email ?: "user@scryme.tech",
            orgSlug = org ?: "Default",
            locationId = loc ?: "Primary Location"
        )
    }

    val uiState: StateFlow<SettingsUiState> = combine(prefsFlow, accountFlow) { prefs, account ->
        SettingsUiState(
            themeMode = prefs.themeMode,
            dutyStatus = prefs.dutyStatus,
            notificationsEnabled = prefs.notificationsEnabled,
            shiftNotifications = prefs.shiftNotifications,
            taskNotifications = prefs.taskNotifications,
            userName = account.userName,
            userEmail = account.userEmail,
            orgSlug = account.orgSlug,
            locationId = account.locationId
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SettingsUiState()
    )

    fun setThemeMode(mode: String) {
        viewModelScope.launch {
            sessionManager.updateThemeMode(mode)
        }
    }

    fun setDutyStatus(status: String) {
        viewModelScope.launch {
            sessionManager.updateDutyStatus(status)
            val orgSlug = sessionManager.getOrgSlug()
            val memberId = sessionManager.getMemberId()
            if (!orgSlug.isNullOrEmpty() && !memberId.isNullOrEmpty()) {
                profileRepository.updateMemberStatus(orgSlug, memberId, status)
            }
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
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

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
