package tech.scryme.app.ui.schedule

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.ShiftBreak
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.data.dto.AttendanceStatusDto
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.notifications.NotificationHelper
import javax.inject.Inject

sealed interface ScheduleUiState {
    object Loading : ScheduleUiState
    data class Success(
        val myShifts: List<StaffShift>,
        val teamShifts: List<StaffShift>,
        val trades: List<ShiftTrade>,
        val selectedTab: Int = 0, // 0: My Shifts, 1: Team Roster, 2: Shift Trades
        val attendanceStatus: AttendanceStatusDto? = null,
        val locations: List<BranchLocation> = emptyList()
    ) : ScheduleUiState
    data class Error(val message: String) : ScheduleUiState
}

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val branchRepository: BranchRepository,
    private val sessionManager: SessionManager,
    @ApplicationContext private val context: Context
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
            val attendanceStatusResult = scheduleRepository.getMyAttendanceStatus(orgSlug)
            val locationsResult = branchRepository.getBranchLocations(orgSlug)

            myShiftsResult.fold(
                onSuccess = { myShifts ->
                    val teamShifts = teamShiftsResult.getOrDefault(emptyList())
                    val trades = tradesResult.getOrDefault(emptyList())
                    val attendanceStatus = attendanceStatusResult.getOrNull()
                    val locations = locationsResult.getOrDefault(emptyList())
                    _uiState.value = ScheduleUiState.Success(
                        myShifts = myShifts,
                        teamShifts = teamShifts,
                        trades = trades,
                        selectedTab = tabIndex,
                        attendanceStatus = attendanceStatus,
                        locations = locations
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

    fun checkInAttendance(
        locationId: String? = null,
        branchCode: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        onSuccess: (String) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.checkInAttendance(
                orgSlug = orgSlug,
                locationId = locationId,
                branchCode = branchCode,
                latitude = latitude,
                longitude = longitude,
                verificationMethod = if (branchCode != null) "QR_SCAN" else "GPS_GEOFENCE"
            )
            result.fold(
                onSuccess = { log ->
                    val statusMsg = if (log.isLocationVerified) "Checked in & Verified!" else "Checked in (Location Unverified)"
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Attendance Signed In",
                        statusMsg
                    )
                    onSuccess(statusMsg)
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 0
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    val msg = error.message ?: "Failed to check in"
                    onError(msg)
                }
            )
        }
    }

    fun checkOutAttendance(
        locationId: String? = null,
        onSuccess: (String) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.checkOutAttendance(orgSlug, locationId)
            result.fold(
                onSuccess = {
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Attendance Signed Out",
                        "You have checked out successfully."
                    )
                    onSuccess("Checked out successfully")
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 0
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    onError(error.message ?: "Failed to check out")
                }
            )
        }
    }

    fun requestShiftTrade(shiftId: String, targetMemberId: String?, reason: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.requestShiftTrade(orgSlug, shiftId, targetMemberId, reason)
            result.fold(
                onSuccess = {
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Shift Trade Requested",
                        "Your request to swap shift $shiftId was submitted successfully."
                    )
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
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Shift Trade Updated",
                        "Shift trade $tradeId has been $action."
                    )
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
                    NotificationHelper.showScheduleNotification(
                        context,
                        "New Shift Assigned",
                        "A new shift was assigned for day $dayOfWeek ($startTime - $endTime)."
                    )
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
