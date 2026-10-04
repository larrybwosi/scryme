package tech.scryme.app.ui.schedule

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.ShiftBreak
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject

sealed interface ScheduleUiState {
    object Loading : ScheduleUiState
    data class Success(
        val myShifts: List<StaffShift>,
        val teamShifts: List<StaffShift>,
        val trades: List<ShiftTrade>,
        val selectedTab: Int = 0 // 0: My Shifts, 1: Team Roster, 2: Shift Trades
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

    fun loadSchedule(tabIndex: Int = 0) {
        viewModelScope.launch {
            _uiState.value = ScheduleUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = ScheduleUiState.Error("Session missing organization context")
                return@launch
            }

            val myShiftsResult = scheduleRepository.getCurrentMemberShifts(orgSlug)
            val teamShiftsResult = scheduleRepository.getOrganizationShifts(orgSlug)
            val tradesResult = scheduleRepository.getShiftTrades(orgSlug)

            myShiftsResult.fold(
                onSuccess = { myShifts ->
                    val teamShifts = teamShiftsResult.getOrDefault(emptyList())
                    val trades = tradesResult.getOrDefault(emptyList())
                    _uiState.value = ScheduleUiState.Success(
                        myShifts = myShifts,
                        teamShifts = teamShifts,
                        trades = trades,
                        selectedTab = tabIndex
                    )
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to load schedule")
                }
            )
        }
    }

    fun selectTab(tabIndex: Int) {
        val currentState = _uiState.value
        if (currentState is ScheduleUiState.Success) {
            _uiState.value = currentState.copy(selectedTab = tabIndex)
        } else {
            loadSchedule(tabIndex)
        }
    }

    fun requestShiftTrade(shiftId: String, targetMemberId: String?, reason: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.requestShiftTrade(orgSlug, shiftId, targetMemberId, reason)
            result.fold(
                onSuccess = {
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 0
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to request shift trade")
                }
            )
        }
    }

    fun processShiftTrade(tradeId: String, action: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.processShiftTrade(orgSlug, tradeId, action)
            result.fold(
                onSuccess = {
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 2
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to process shift trade")
                }
            )
        }
    }

    fun addShiftBreak(shiftId: String, startTime: String, endTime: String, description: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val breakItem = ShiftBreak(
                id = "",
                startTime = startTime,
                endTime = endTime,
                description = description
            )
            val result = scheduleRepository.addShiftBreak(orgSlug, shiftId, breakItem)
            result.fold(
                onSuccess = {
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 0
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to add shift break")
                }
            )
        }
    }

    fun createStaffShift(memberId: String, dayOfWeek: Int, startTime: String, endTime: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.createStaffShift(orgSlug, memberId, dayOfWeek, startTime, endTime)
            result.fold(
                onSuccess = {
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 1
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to create shift")
                }
            )
        }
    }
}
