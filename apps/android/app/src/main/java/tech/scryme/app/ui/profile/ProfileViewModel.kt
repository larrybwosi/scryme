package tech.scryme.app.ui.profile

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import javax.inject.Inject

data class UserPreferencesState(
    val themeMode: String = "SYSTEM",
    val notificationsEnabled: Boolean = true,
    val shiftNotifications: Boolean = true,
    val taskNotifications: Boolean = true
)

sealed interface ProfileUiState {
    object Loading : ProfileUiState
    data class Success(
        val profile: UserProfile,
        val preferences: UserPreferencesState = UserPreferencesState(),
        val isEditing: Boolean = false,
        val isUpdating: Boolean = false,
        val updateError: String? = null
    ) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        observePreferences()
    }

    private fun observePreferences() {
        viewModelScope.launch {
            combine(
                sessionManager.themeModeFlow,
                sessionManager.notificationsEnabledFlow,
                sessionManager.shiftNotificationsFlow,
                sessionManager.taskNotificationsFlow
            ) { theme, notifEnabled, shiftNotif, taskNotif ->
                UserPreferencesState(
                    themeMode = theme,
                    notificationsEnabled = notifEnabled,
                    shiftNotifications = shiftNotif,
                    taskNotifications = taskNotif
                )
            }.collect { prefs ->
                val currentState = _uiState.value
                if (currentState is ProfileUiState.Success) {
                    _uiState.value = currentState.copy(preferences = prefs)
                }
            }
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            val memberId = sessionManager.getMemberId()
            if (orgSlug.isNullOrEmpty() || memberId.isNullOrEmpty()) {
                _uiState.value = ProfileUiState.Error("Organization member profile context missing. Please ensure your account has staff membership in this organization.")
                return@launch
            }

            val result = profileRepository.getMemberProfile(orgSlug, memberId)
            result.fold(
                onSuccess = { profile ->
                    sessionManager.updateUserProfile(
                        name = profile.name,
                        email = profile.email,
                        avatarUrl = profile.avatarUrl
                    )
                    sessionManager.updateDutyStatus(profile.status)

                    val prefs = UserPreferencesState(
                        themeMode = sessionManager.themeModeFlow.first(),
                        notificationsEnabled = sessionManager.notificationsEnabledFlow.first(),
                        shiftNotifications = sessionManager.shiftNotificationsFlow.first(),
                        taskNotifications = sessionManager.taskNotificationsFlow.first()
                    )
                    _uiState.value = ProfileUiState.Success(
                        profile = profile,
                        preferences = prefs
                    )
                },
                onFailure = { error ->
                    _uiState.value = ProfileUiState.Error(error.message ?: "Failed to load profile")
                }
            )
        }
    }

    fun updateProfile(name: String? = null, email: String? = null, phone: String? = null, avatarUrl: String? = null) {
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, updateError = null)
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val memberId = sessionManager.getMemberId() ?: return@launch

            val result = profileRepository.updateMemberProfile(
                orgSlug = orgSlug,
                memberId = memberId,
                name = name,
                email = email,
                phone = phone,
                avatarUrl = avatarUrl
            )
            result.fold(
                onSuccess = { updatedProfile ->
                    sessionManager.updateUserProfile(
                        name = updatedProfile.name,
                        email = updatedProfile.email,
                        avatarUrl = updatedProfile.avatarUrl
                    )
                    _uiState.value = currentState.copy(
                        profile = updatedProfile,
                        isEditing = false,
                        isUpdating = false,
                        updateError = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        updateError = error.message ?: "Failed to update profile"
                    )
                }
            )
        }
    }

    fun updateAvatarFromUri(context: Context, uri: Uri) {
        viewModelScope.launch {
            try {
                val inputStream = context.contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes()
                inputStream?.close()
                if (bytes != null && bytes.isNotEmpty()) {
                    val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                    val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                    val dataUri = "data:$mimeType;base64,$base64"
                    updateProfile(avatarUrl = dataUri)
                }
            } catch (e: Exception) {
                val currentState = _uiState.value as? ProfileUiState.Success
                if (currentState != null) {
                    _uiState.value = currentState.copy(updateError = "Failed to process image: ${e.message}")
                }
            }
        }
    }

    fun updateDutyStatus(status: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val memberId = sessionManager.getMemberId() ?: return@launch
            val result = profileRepository.updateMemberStatus(orgSlug, memberId, status)
            result.fold(
                onSuccess = { updatedProfile ->
                    sessionManager.updateDutyStatus(updatedProfile.status)
                    loadProfile()
                },
                onFailure = { error ->
                    val currentState = _uiState.value as? ProfileUiState.Success
                    if (currentState != null) {
                        _uiState.value = currentState.copy(updateError = error.message ?: "Failed to update status")
                    }
                }
            )
        }
    }

    fun setEditing(isEditing: Boolean) {
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        _uiState.value = currentState.copy(isEditing = isEditing, updateError = null)
    }

    fun setThemeMode(mode: String) {
        viewModelScope.launch {
            sessionManager.updateThemeMode(mode)
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
}
