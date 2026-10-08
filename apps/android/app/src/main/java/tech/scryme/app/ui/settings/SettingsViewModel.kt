package tech.scryme.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
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
    val orgName: String = "",
    val orgCurrency: String = "USD",
    val orgCurrencySymbol: String = "$",
    val locationId: String = "",
    val showQrScanner: Boolean = false,
    val isPairingPos: Boolean = false,
    val posPairingMessage: String? = null
)

private data class PrefsState(
    val themeMode: String,
    val dutyStatus: String,
    val notificationsEnabled: Boolean,
    val shiftNotifications: Boolean,
    val taskNotifications: Boolean
)

private data class OrgConfigState(
    val slug: String,
    val name: String,
    val currency: String,
    val currencySymbol: String
)

private data class AccountState(
    val userName: String,
    val userEmail: String,
    val orgSlug: String,
    val orgName: String,
    val orgCurrency: String,
    val orgCurrencySymbol: String,
    val locationId: String
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val profileRepository: ProfileRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _showQrScanner = MutableStateFlow(false)
    private val _isPairingPos = MutableStateFlow(false)
    private val _posPairingMessage = MutableStateFlow<String?>(null)

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

    private val orgConfigFlow = combine(
        sessionManager.orgSlugFlow,
        sessionManager.orgNameFlow,
        sessionManager.orgCurrencyFlow,
        sessionManager.orgCurrencySymbolFlow
    ) { slug, name, curr, symbol ->
        OrgConfigState(
            slug = slug ?: "Default",
            name = name ?: slug ?: "Default Organization",
            currency = curr ?: "USD",
            currencySymbol = symbol ?: "$"
        )
    }

    private val accountFlow = combine(
        sessionManager.userNameFlow,
        sessionManager.userEmailFlow,
        sessionManager.locationIdFlow,
        orgConfigFlow
    ) { name, email, loc, orgConfig ->
        AccountState(
            userName = name ?: "User",
            userEmail = email ?: "user@scryme.tech",
            orgSlug = orgConfig.slug,
            orgName = orgConfig.name,
            orgCurrency = orgConfig.currency,
            orgCurrencySymbol = orgConfig.currencySymbol,
            locationId = loc ?: "Primary Location"
        )
    }

    val uiState: StateFlow<SettingsUiState> = combine(
        prefsFlow,
        accountFlow,
        _showQrScanner,
        _isPairingPos,
        _posPairingMessage
    ) { prefs, account, showScanner, isPairing, pairingMsg ->
        SettingsUiState(
            themeMode = prefs.themeMode,
            dutyStatus = prefs.dutyStatus,
            notificationsEnabled = prefs.notificationsEnabled,
            shiftNotifications = prefs.shiftNotifications,
            taskNotifications = prefs.taskNotifications,
            userName = account.userName,
            userEmail = account.userEmail,
            orgSlug = account.orgSlug,
            orgName = account.orgName,
            orgCurrency = account.orgCurrency,
            orgCurrencySymbol = account.orgCurrencySymbol,
            locationId = account.locationId,
            showQrScanner = showScanner,
            isPairingPos = isPairing,
            posPairingMessage = pairingMsg
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

    fun setShowQrScanner(show: Boolean) {
        _showQrScanner.value = show
    }

    fun pairPosDevice(qrContent: String) {
        viewModelScope.launch {
            _isPairingPos.value = true
            _posPairingMessage.value = "Authenticating POS Device..."
            val result = authRepository.pairPosDevice(qrContent)
            _isPairingPos.value = false
            result.fold(
                onSuccess = { msg ->
                    _posPairingMessage.value = msg
                },
                onFailure = { error ->
                    _posPairingMessage.value = error.message ?: "Failed to pair POS device"
                }
            )
        }
    }

    fun clearPairingMessage() {
        _posPairingMessage.value = null
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
