package tech.scryme.app.ui.profile

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import tech.scryme.app.data.dto.MembershipDto
import tech.scryme.app.data.dto.OrganizationDetailDto
import tech.scryme.app.data.dto.PasskeyItemDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.util.PasskeyManager
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
        val activeOrganization: OrganizationDetailDto? = null,
        val memberships: List<MembershipDto> = emptyList(),
        val preferences: UserPreferencesState = UserPreferencesState(),
        val passkeys: List<PasskeyItemDto> = emptyList(),
        val isEditing: Boolean = false,
        val isUpdating: Boolean = false,
        val isSwitchingOrg: Boolean = false,
        val passkeyActionMessage: String? = null,
        val updateError: String? = null
    ) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val authRepository: AuthRepository,
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
            val meResult = authRepository.validateSession()
            meResult.fold(
                onSuccess = { meData ->
                    val user = meData.user
                    val member = meData.member
                    val activeOrg = meData.activeOrganization
                    val memberships = meData.memberships ?: emptyList()

                    val orgSlug = sessionManager.getOrgSlug() ?: activeOrg?.slug ?: "default"
                    val memberId = member?.id ?: sessionManager.getMemberId()

                    var profile: UserProfile? = null

                    if (!memberId.isNullOrEmpty()) {
                        val profileResult = profileRepository.getMemberProfile(orgSlug, memberId)
                        profile = profileResult.getOrNull()
                    }

                    if (profile == null) {
                        profile = UserProfile(
                            id = memberId ?: user?.id ?: "user_profile",
                            organizationId = activeOrg?.id ?: "",
                            userId = user?.id ?: "",
                            name = user?.name ?: sessionManager.userNameFlow.first() ?: "User",
                            email = user?.email ?: sessionManager.userEmailFlow.first(),
                            phone = null,
                            role = member?.role ?: memberships.firstOrNull { it.organizationId == activeOrg?.id }?.role ?: "MEMBER",
                            status = sessionManager.dutyStatusFlow.first(),
                            isActive = true,
                            avatarUrl = sessionManager.userAvatarUrlFlow.first()
                        )
                    }

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

                    val passkeysResult = authRepository.listUserPasskeys()
                    val passkeysList = passkeysResult.getOrDefault(emptyList())

                    _uiState.value = ProfileUiState.Success(
                        profile = profile,
                        activeOrganization = activeOrg,
                        memberships = memberships,
                        preferences = prefs,
                        passkeys = passkeysList
                    )
                },
                onFailure = { error ->
                    _uiState.value = ProfileUiState.Error(error.message ?: "Failed to load organization context & profile")
                }
            )
        }
    }

    fun switchOrganization(organizationId: String) {
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isSwitchingOrg = true, updateError = null)
            val result = authRepository.switchOrganization(organizationId)
            result.fold(
                onSuccess = {
                    loadProfile()
                },
                onFailure = { err ->
                    _uiState.value = currentState.copy(
                        isSwitchingOrg = false,
                        updateError = err.message ?: "Failed to switch organization"
                    )
                }
            )
        }
    }

    fun registerPasskey(context: Context, name: String) {
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, passkeyActionMessage = null)
            val optionsResult = authRepository.generatePasskeyRegisterOptions(name.ifBlank { "Android Device Passkey" })
            optionsResult.fold(
                onSuccess = { optionsJson ->
                    val createResult = PasskeyManager.createPasskey(context, optionsJson)
                    createResult.fold(
                        onSuccess = { responseJson ->
                            val verifyResult = authRepository.verifyPasskeyRegistration(responseJson)
                            verifyResult.fold(
                                onSuccess = {
                                    val updatedPasskeys = authRepository.listUserPasskeys().getOrDefault(emptyList())
                                    _uiState.value = currentState.copy(
                                        isUpdating = false,
                                        passkeys = updatedPasskeys,
                                        passkeyActionMessage = "Passkey registered successfully!"
                                    )
                                },
                                onFailure = { err ->
                                    _uiState.value = currentState.copy(
                                        isUpdating = false,
                                        updateError = err.message ?: "Failed to verify passkey registration with server"
                                    )
                                }
                            )
                        },
                        onFailure = { err ->
                            _uiState.value = currentState.copy(
                                isUpdating = false,
                                updateError = err.message ?: "Passkey creation cancelled or failed"
                            )
                        }
                    )
                },
                onFailure = { err ->
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        updateError = err.message ?: "Failed to get registration options from server"
                    )
                }
            )
        }
    }

    fun deletePasskey(passkeyId: String) {
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, passkeyActionMessage = null)
            val result = authRepository.deletePasskey(passkeyId)
            result.fold(
                onSuccess = {
                    val updatedPasskeys = authRepository.listUserPasskeys().getOrDefault(emptyList())
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        passkeys = updatedPasskeys,
                        passkeyActionMessage = "Passkey deleted successfully"
                    )
                },
                onFailure = { err ->
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        updateError = err.message ?: "Failed to delete passkey"
                    )
                }
            )
        }
    }

    fun authorizeWebSession(qrContent: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val result = authRepository.pairPosDevice(qrContent)
            result.fold(
                onSuccess = { msg ->
                    onResult(true, msg)
                },
                onFailure = { err ->
                    onResult(false, err.message ?: "Authorization failed")
                }
            )
        }
    }

    fun updateProfile(name: String? = null, email: String? = null, phone: String? = null, avatarUrl: String? = null) {
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, updateError = null)
            val orgSlug = sessionManager.getOrgSlug() ?: currentState.activeOrganization?.slug ?: return@launch
            val memberId = sessionManager.getMemberId() ?: currentState.profile.id

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
        val currentState = _uiState.value as? ProfileUiState.Success ?: return
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: currentState.activeOrganization?.slug ?: return@launch
            val memberId = sessionManager.getMemberId() ?: currentState.profile.id
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
