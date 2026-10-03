package tech.scryme.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import javax.inject.Inject

sealed interface ProfileUiState {
    object Loading : ProfileUiState
    data class Success(val profile: UserProfile) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Loading)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            val memberId = sessionManager.getMemberId()
            if (orgSlug.isNullOrEmpty() || memberId.isNullOrEmpty()) {
                _uiState.value = ProfileUiState.Error("Missing session profile identifiers")
                return@launch
            }

            val result = profileRepository.getMemberProfile(orgSlug, memberId)
            result.fold(
                onSuccess = { profile ->
                    _uiState.value = ProfileUiState.Success(profile)
                },
                onFailure = { error ->
                    _uiState.value = ProfileUiState.Error(error.message ?: "Failed to load profile")
                }
            )
        }
    }

    fun updateDutyStatus(status: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val memberId = sessionManager.getMemberId() ?: return@launch
            val result = profileRepository.updateDutyStatus(orgSlug, memberId, status)
            result.fold(
                onSuccess = { loadProfile() },
                onFailure = { error ->
                    _uiState.value = ProfileUiState.Error(error.message ?: "Failed to update duty status")
                }
            )
        }
    }
}
