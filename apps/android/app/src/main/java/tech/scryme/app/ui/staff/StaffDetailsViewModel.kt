package tech.scryme.app.ui.staff

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.StaffOverview
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject

sealed interface StaffDetailsUiState {
    object Loading : StaffDetailsUiState
    data class Success(
        val overview: StaffOverview,
        val isUpdatingStatus: Boolean = false,
        val actionSuccessMessage: String? = null
    ) : StaffDetailsUiState
    data class Error(val message: String) : StaffDetailsUiState
}

@HiltViewModel
class StaffDetailsViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val scheduleRepository: ScheduleRepository,
    private val sessionManager: SessionManager,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val staffId: String = savedStateHandle.get<String>("staffId") ?: ""

    private val _uiState = MutableStateFlow<StaffDetailsUiState>(StaffDetailsUiState.Loading)
    val uiState: StateFlow<StaffDetailsUiState> = _uiState.asStateFlow()

    init {
        loadStaffOverview()
    }

    fun loadStaffOverview() {
        viewModelScope.launch {
            _uiState.value = StaffDetailsUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = StaffDetailsUiState.Error("Missing organization context")
                return@launch
            }

            val result = profileRepository.getMemberOverview(orgSlug, staffId)
            result.fold(
                onSuccess = { overview ->
                    _uiState.value = StaffDetailsUiState.Success(overview = overview)
                },
                onFailure = { err ->
                    _uiState.value = StaffDetailsUiState.Error(err.message ?: "Failed to load staff overview")
                }
            )
        }
    }

    fun updateTaskStatus(taskId: String, newStatus: String) {
        viewModelScope.launch {
            val currentState = _uiState.value
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = taskId,
                status = newStatus
            )
            res.fold(
                onSuccess = {
                    loadStaffOverview()
                },
                onFailure = { _ ->
                    if (currentState is StaffDetailsUiState.Success) {
                        _uiState.value = currentState.copy(
                            actionSuccessMessage = null
                        )
                    }
                }
            )
        }
    }

    fun reassignTask(taskId: String, newMemberId: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = taskId,
                assignedMemberId = newMemberId
            )
            res.fold(
                onSuccess = {
                    loadStaffOverview()
                },
                onFailure = { }
            )
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.deleteStaffTask(orgSlug, taskId)
            res.fold(
                onSuccess = {
                    loadStaffOverview()
                },
                onFailure = { }
            )
        }
    }
}
