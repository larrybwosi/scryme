package tech.scryme.app.ui.admin

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
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject

sealed interface AdminUiState {
    object Loading : AdminUiState
    data class Success(
        val allShifts: List<StaffShift>,
        val pendingTrades: List<ShiftTrade>,
        val allTasks: List<StaffTask>
    ) : AdminUiState
    data class Error(val message: String) : AdminUiState
}

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<AdminUiState>(AdminUiState.Loading)
    val uiState: StateFlow<AdminUiState> = _uiState.asStateFlow()

    fun loadAdminData() {
        viewModelScope.launch {
            _uiState.value = AdminUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = AdminUiState.Error("Missing organization context")
                return@launch
            }

            val shiftsRes = scheduleRepository.getOrganizationShifts(orgSlug)
            val tradesRes = scheduleRepository.getShiftTrades(orgSlug, status = "PENDING")
            val tasksRes = scheduleRepository.getStaffTasks(orgSlug)

            if (shiftsRes.isSuccess) {
                _uiState.value = AdminUiState.Success(
                    allShifts = shiftsRes.getOrDefault(emptyList()),
                    pendingTrades = tradesRes.getOrDefault(emptyList()),
                    allTasks = tasksRes.getOrDefault(emptyList())
                )
            } else {
                _uiState.value = AdminUiState.Error(shiftsRes.exceptionOrNull()?.message ?: "Failed to load admin data")
            }
        }
    }

    fun createShift(memberId: String, dayOfWeek: Int, startTime: String, endTime: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.createStaffShift(orgSlug, memberId, dayOfWeek, startTime, endTime)
            res.fold(
                onSuccess = { loadAdminData() },
                onFailure = { error ->
                    _uiState.value = AdminUiState.Error(error.message ?: "Failed to create shift")
                }
            )
        }
    }

    fun addShiftBreak(shiftId: String, startTime: String, endTime: String, description: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val breakItem = ShiftBreak(id = null, startTime = startTime, endTime = endTime, description = description)
            val res = scheduleRepository.addShiftBreak(orgSlug, shiftId, breakItem)
            res.fold(
                onSuccess = { loadAdminData() },
                onFailure = { error ->
                    _uiState.value = AdminUiState.Error(error.message ?: "Failed to add shift break")
                }
            )
        }
    }

    fun createTask(title: String, description: String?, assignedMemberId: String?, priority: String, dueDate: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.createStaffTask(
                orgSlug = orgSlug,
                title = title,
                description = description,
                assignedMemberId = assignedMemberId,
                priority = priority,
                dueDate = dueDate
            )
            res.fold(
                onSuccess = { loadAdminData() },
                onFailure = { error ->
                    _uiState.value = AdminUiState.Error(error.message ?: "Failed to create task")
                }
            )
        }
    }

    fun processTrade(tradeId: String, action: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.processShiftTrade(orgSlug, tradeId, action)
            res.fold(
                onSuccess = { loadAdminData() },
                onFailure = { error ->
                    _uiState.value = AdminUiState.Error(error.message ?: "Failed to process trade")
                }
            )
        }
    }
}
