package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.domain.repository.AnnouncementRepository

class AnnouncementViewModel(
    private val repository: AnnouncementRepository
) : ViewModel() {

    private val _announcementState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val announcementState: StateFlow<UiState<Unit>> = _announcementState.asStateFlow()

    fun broadcastAnnouncement(
        title: String,
        message: String,
        targetBranchId: String? = null,
        targetMemberId: String? = null,
        channelSlug: String? = null,
        severity: String = "INFO"
    ) {
        viewModelScope.launch {
            _announcementState.value = UiState.Loading
            repository.broadcastAnnouncement(title, message, targetBranchId, targetMemberId, channelSlug, severity)
                .onSuccess {
                    _announcementState.value = UiState.Success(Unit)
                }
                .onFailure { error ->
                    _announcementState.value = UiState.Error(error.message ?: "Broadcast failed")
                }
        }
    }

    fun sendMessageToMember(
        memberId: String,
        title: String,
        message: String,
        type: String = "DIRECT_MESSAGE"
    ) {
        viewModelScope.launch {
            _announcementState.value = UiState.Loading
            repository.sendMessageToMember(memberId, title, message, type)
                .onSuccess {
                    _announcementState.value = UiState.Success(Unit)
                }
                .onFailure { error ->
                    _announcementState.value = UiState.Error(error.message ?: "Failed to send message")
                }
        }
    }

    fun resetState() {
        _announcementState.value = UiState.Idle
    }
}
