package tech.scryme.app.ui.account

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import tech.scryme.app.data.dto.PasskeyItemDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.util.PasskeyManager
import javax.inject.Inject

sealed interface AccountUiState {
    object Loading : AccountUiState
    data class Success(
        val profile: UserProfile,
        val passkeys: List<PasskeyItemDto> = emptyList(),
        val isUpdating: Boolean = false,
        val isEditing: Boolean = false,
        val actionSuccessMessage: String? = null,
        val errorMessage: String? = null
    ) : AccountUiState
    data class Error(val message: String) : AccountUiState
}

@HiltViewModel
class AccountViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<AccountUiState>(AccountUiState.Loading)
    val uiState: StateFlow<AccountUiState> = _uiState.asStateFlow()

    init {
        loadAccountData()
    }

    fun loadAccountData() {
        viewModelScope.launch {
            _uiState.value = AccountUiState.Loading
            try {
                val orgSlug = sessionManager.getOrgSlug()
                val memberId = sessionManager.getMemberId()
                val userName = sessionManager.userNameFlow.first() ?: ""
                val userEmail = sessionManager.userEmailFlow.first() ?: ""
                val userAvatarUrl = sessionManager.userAvatarUrlFlow.first()
                val dutyStatus = sessionManager.dutyStatusFlow.first()

                if (orgSlug.isNullOrEmpty() || memberId.isNullOrEmpty()) {
                    val meResult = authRepository.validateSession()
                    meResult.fold(
                        onSuccess = { meData ->
                            val currentOrgSlug = meData.activeOrganization?.slug ?: "default"
                            val currentMemberId = meData.member?.id ?: ""
                            fetchProfileAndPasskeys(currentOrgSlug, currentMemberId, meData.user?.name ?: userName, meData.user?.email ?: userEmail, userAvatarUrl, dutyStatus)
                        },
                        onFailure = {
                            val fallback = UserProfile(
                                id = memberId ?: "local",
                                organizationId = "local",
                                userId = "local",
                                name = userName.ifBlank { "User" },
                                email = userEmail.ifBlank { "user@scryme.tech" },
                                phone = null,
                                role = "MEMBER",
                                status = dutyStatus,
                                isActive = true,
                                avatarUrl = userAvatarUrl
                            )
                            _uiState.value = AccountUiState.Success(profile = fallback)
                        }
                    )
                } else {
                    fetchProfileAndPasskeys(orgSlug, memberId, userName, userEmail, userAvatarUrl, dutyStatus)
                }
            } catch (e: Exception) {
                _uiState.value = AccountUiState.Error(e.message ?: "Failed to load account details.")
            }
        }
    }

    private suspend fun fetchProfileAndPasskeys(
        orgSlug: String,
        memberId: String,
        fallbackName: String,
        fallbackEmail: String,
        fallbackAvatar: String?,
        dutyStatus: String
    ) {
        val passkeys = authRepository.listUserPasskeys().getOrDefault(emptyList())
        val profileRes = profileRepository.getMemberProfile(orgSlug, memberId)
        profileRes.fold(
            onSuccess = { profile ->
                sessionManager.updateUserProfile(profile.name, profile.email, profile.avatarUrl)
                sessionManager.updateDutyStatus(profile.status)
                _uiState.value = AccountUiState.Success(
                    profile = profile,
                    passkeys = passkeys
                )
            },
            onFailure = { error ->
                val fallback = UserProfile(
                    id = memberId,
                    organizationId = orgSlug,
                    userId = memberId,
                    name = fallbackName.ifBlank { "User" },
                    email = fallbackEmail.ifBlank { "user@scryme.tech" },
                    phone = null,
                    role = "MEMBER",
                    status = dutyStatus,
                    isActive = true,
                    avatarUrl = fallbackAvatar
                )
                _uiState.value = AccountUiState.Success(
                    profile = fallback,
                    passkeys = passkeys,
                    errorMessage = error.message
                )
            }
        )
    }

    fun updateProfileInfo(name: String, email: String, phone: String) {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, errorMessage = null, actionSuccessMessage = null)
            val orgSlug = sessionManager.getOrgSlug() ?: currentState.profile.organizationId
            val memberId = sessionManager.getMemberId() ?: currentState.profile.id

            val result = profileRepository.updateMemberProfile(
                orgSlug = orgSlug,
                memberId = memberId,
                name = name,
                email = email,
                phone = phone,
                avatarUrl = currentState.profile.avatarUrl
            )
            result.fold(
                onSuccess = { updated ->
                    sessionManager.updateUserProfile(
                        name = updated.name,
                        email = updated.email,
                        avatarUrl = updated.avatarUrl
                    )
                    _uiState.value = currentState.copy(
                        profile = updated,
                        isEditing = false,
                        isUpdating = false,
                        actionSuccessMessage = "Account details updated successfully!"
                    )
                },
                onFailure = { err ->
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        errorMessage = err.message ?: "Failed to update profile information."
                    )
                }
            )
        }
    }

    fun updateDutyStatus(status: String) {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        viewModelScope.launch {
            sessionManager.updateDutyStatus(status)
            val orgSlug = sessionManager.getOrgSlug() ?: currentState.profile.organizationId
            val memberId = sessionManager.getMemberId() ?: currentState.profile.id
            val result = profileRepository.updateMemberStatus(orgSlug, memberId, status)
            result.fold(
                onSuccess = { updated ->
                    _uiState.value = currentState.copy(
                        profile = updated,
                        actionSuccessMessage = "Duty status updated to $status"
                    )
                },
                onFailure = {
                    _uiState.value = currentState.copy(
                        profile = currentState.profile.copy(status = status),
                        actionSuccessMessage = "Duty status updated locally"
                    )
                }
            )
        }
    }

    fun updateAvatarFromUri(context: Context, uri: Uri) {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        viewModelScope.launch {
            try {
                _uiState.value = currentState.copy(isUpdating = true, errorMessage = null)
                val inputStream = context.contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes()
                inputStream?.close()
                if (bytes != null && bytes.isNotEmpty()) {
                    val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
                    val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                    val dataUri = "data:$mimeType;base64,$base64"

                    val orgSlug = sessionManager.getOrgSlug() ?: currentState.profile.organizationId
                    val memberId = sessionManager.getMemberId() ?: currentState.profile.id
                    val result = profileRepository.updateMemberProfile(
                        orgSlug = orgSlug,
                        memberId = memberId,
                        name = currentState.profile.name,
                        email = currentState.profile.email,
                        phone = currentState.profile.phone,
                        avatarUrl = dataUri
                    )
                    result.fold(
                        onSuccess = { updated ->
                            sessionManager.updateUserProfile(avatarUrl = updated.avatarUrl)
                            _uiState.value = currentState.copy(
                                profile = updated,
                                isUpdating = false,
                                actionSuccessMessage = "Avatar photo updated successfully!"
                            )
                        },
                        onFailure = { err ->
                            _uiState.value = currentState.copy(
                                isUpdating = false,
                                errorMessage = err.message ?: "Failed to upload avatar"
                            )
                        }
                    )
                } else {
                    _uiState.value = currentState.copy(isUpdating = false, errorMessage = "Empty image file")
                }
            } catch (e: Exception) {
                _uiState.value = currentState.copy(
                    isUpdating = false,
                    errorMessage = "Error reading image: ${e.message}"
                )
            }
        }
    }

    fun registerPasskey(context: Context, name: String) {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, errorMessage = null, actionSuccessMessage = null)
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
                                        actionSuccessMessage = "Passkey registered successfully!"
                                    )
                                },
                                onFailure = { err ->
                                    _uiState.value = currentState.copy(
                                        isUpdating = false,
                                        errorMessage = err.message ?: "Failed to verify passkey with server"
                                    )
                                }
                            )
                        },
                        onFailure = { err ->
                            _uiState.value = currentState.copy(
                                isUpdating = false,
                                errorMessage = err.message ?: "Passkey registration cancelled"
                            )
                        }
                    )
                },
                onFailure = { err ->
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        errorMessage = err.message ?: "Failed to get registration options"
                    )
                }
            )
        }
    }

    fun deletePasskey(passkeyId: String) {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        viewModelScope.launch {
            _uiState.value = currentState.copy(isUpdating = true, errorMessage = null, actionSuccessMessage = null)
            val result = authRepository.deletePasskey(passkeyId)
            result.fold(
                onSuccess = {
                    val updatedPasskeys = authRepository.listUserPasskeys().getOrDefault(emptyList())
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        passkeys = updatedPasskeys,
                        actionSuccessMessage = "Passkey removed"
                    )
                },
                onFailure = { err ->
                    _uiState.value = currentState.copy(
                        isUpdating = false,
                        errorMessage = err.message ?: "Failed to delete passkey"
                    )
                }
            )
        }
    }

    fun authorizeWebSession(qrContent: String, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            val result = authRepository.pairPosDevice(qrContent)
            result.fold(
                onSuccess = { msg -> onResult(true, msg) },
                onFailure = { err -> onResult(false, err.message ?: "Authorization failed") }
            )
        }
    }

    fun setEditing(isEditing: Boolean) {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        _uiState.value = currentState.copy(isEditing = isEditing, errorMessage = null, actionSuccessMessage = null)
    }

    fun clearMessages() {
        val currentState = _uiState.value as? AccountUiState.Success ?: return
        _uiState.value = currentState.copy(errorMessage = null, actionSuccessMessage = null)
    }
}
