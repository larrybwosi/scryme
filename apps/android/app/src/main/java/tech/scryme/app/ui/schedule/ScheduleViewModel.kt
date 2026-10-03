package tech.scryme.app.ui.schedule

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject

sealed interface ScheduleUiState {
    object Loading : ScheduleUiState
    data class Success(
        val shifts: List<StaffShift>,
        val trades: List<ShiftTrade>
    ) : ScheduleUiState
    data class Error(val message: String) : ScheduleUiState
}

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<ScheduleUiState>(ScheduleUiState.Loading)
    val uiState: StateFlow<ScheduleUiState> = _uiState.asStateFlow()

    fun loadSchedule() {
        viewModelScope.launch {
            _uiState.value = ScheduleUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = ScheduleUiState.Error("Session missing organization context")
                return@launch
            }

            val shiftsResult = scheduleRepository.getCurrentMemberShifts(orgSlug)
            val tradesResult = scheduleRepository.getShiftTrades(orgSlug)

            shiftsResult.fold(
                onSuccess = { shifts ->
                    val trades = tradesResult.getOrDefault(emptyList())
                    _uiState.value = ScheduleUiState.Success(shifts = shifts, trades = trades)
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to load schedule")
                }
            )
        }
    }

    fun requestShiftTrade(shiftId: String, targetMemberId: String?, reason: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.requestShiftTrade(orgSlug, shiftId, targetMemberId, reason)
            result.fold(
                onSuccess = { loadSchedule() },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to request shift trade")
                }
            )
        }
    }
}
