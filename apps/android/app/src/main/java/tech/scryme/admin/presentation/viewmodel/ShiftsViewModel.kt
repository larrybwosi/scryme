package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.StaffBreakDto
import tech.scryme.admin.data.model.StaffShiftDto
import tech.scryme.admin.domain.repository.AnnouncementRepository
import tech.scryme.admin.domain.repository.ShiftsRepository

class ShiftsViewModel(
    private val repository: ShiftsRepository,
    private val announcementRepository: AnnouncementRepository? = null
) : ViewModel() {

    private val _shiftsState = MutableStateFlow<UiState<List<StaffShiftDto>>>(UiState.Idle)
    val shiftsState: StateFlow<UiState<List<StaffShiftDto>>> = _shiftsState.asStateFlow()

    private val _createShiftState = MutableStateFlow<UiState<StaffShiftDto>>(UiState.Idle)
    val createShiftState: StateFlow<UiState<StaffShiftDto>> = _createShiftState.asStateFlow()

    private val _addBreakState = MutableStateFlow<UiState<StaffBreakDto>>(UiState.Idle)
    val addBreakState: StateFlow<UiState<StaffBreakDto>> = _addBreakState.asStateFlow()

    private val _notifyShiftState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val notifyShiftState: StateFlow<UiState<Unit>> = _notifyShiftState.asStateFlow()

    private val _selectedDayOfWeek = MutableStateFlow<Int?>(null) // null = all days
    val selectedDayOfWeek: StateFlow<Int?> = _selectedDayOfWeek.asStateFlow()

    private val _selectedMemberId = MutableStateFlow<String?>(null)
    val selectedMemberId: StateFlow<String?> = _selectedMemberId.asStateFlow()

    fun selectDayOfWeek(day: Int?) {
        _selectedDayOfWeek.value = day
        loadShifts()
    }

    fun selectMember(memberId: String?) {
        _selectedMemberId.value = memberId
        loadShifts()
    }

    fun loadShifts() {
        viewModelScope.launch {
            _shiftsState.value = UiState.Loading
            val result = repository.getShifts(
                memberId = _selectedMemberId.value,
                dayOfWeek = _selectedDayOfWeek.value,
                isActive = true
            )
            result.fold(
                onSuccess = { _shiftsState.value = UiState.Success(it) },
                onFailure = { _shiftsState.value = UiState.Error(it.message ?: "Failed to load shifts") }
            )
        }
    }

    fun createShift(memberId: String, dayOfWeek: Int, startTime: String, endTime: String) {
        viewModelScope.launch {
            _createShiftState.value = UiState.Loading
            val result = repository.createShift(memberId, dayOfWeek, startTime, endTime)
            result.fold(
                onSuccess = {
                    _createShiftState.value = UiState.Success(it)
                    loadShifts()
                },
                onFailure = {
                    _createShiftState.value = UiState.Error(it.message ?: "Failed to schedule shift")
                }
            )
        }
    }

    fun addBreak(shiftId: String, startTime: String, endTime: String, description: String? = null) {
        viewModelScope.launch {
            _addBreakState.value = UiState.Loading
            val result = repository.addBreak(shiftId, startTime, endTime, description)
            result.fold(
                onSuccess = {
                    _addBreakState.value = UiState.Success(it)
                    loadShifts()
                },
                onFailure = {
                    _addBreakState.value = UiState.Error(it.message ?: "Failed to add break")
                }
            )
        }
    }

    fun notifyMemberOfShift(
        shift: StaffShiftDto,
        customMessage: String? = null
    ) {
        val repo = announcementRepository ?: return
        val staffName = shift.member?.user?.name ?: "Staff Member"
        val dayName = when (shift.dayOfWeek) {
            0 -> "Sunday"
            1 -> "Monday"
            2 -> "Tuesday"
            3 -> "Wednesday"
            4 -> "Thursday"
            5 -> "Friday"
            6 -> "Saturday"
            else -> "Day ${shift.dayOfWeek}"
        }
        val title = "Upcoming Work Shift Notice"
        val body = customMessage ?: "Reminder: You are scheduled for a shift on $dayName from ${shift.startTime} to ${shift.endTime}."

        viewModelScope.launch {
            _notifyShiftState.value = UiState.Loading
            repo.sendMessageToMember(
                memberId = shift.memberId,
                title = title,
                message = body,
                type = "SHIFT_NOTIFICATION"
            ).fold(
                onSuccess = { _notifyShiftState.value = UiState.Success(Unit) },
                onFailure = { error -> _notifyShiftState.value = UiState.Error(error.message ?: "Failed to send shift notification") }
            )
        }
    }

    fun broadcastRosterUpdate(
        dayOfWeek: Int?,
        message: String = "The staff roster schedule has been updated. Please check your assigned shifts."
    ) {
        val repo = announcementRepository ?: return
        val dayTag = if (dayOfWeek != null) "for Day $dayOfWeek" else "for the week"

        viewModelScope.launch {
            _notifyShiftState.value = UiState.Loading
            repo.broadcastAnnouncement(
                title = "Weekly Roster Schedule Updated",
                message = "$message ($dayTag)",
                channelSlug = "shifts",
                severity = "INFO"
            ).fold(
                onSuccess = { _notifyShiftState.value = UiState.Success(Unit) },
                onFailure = { error -> _notifyShiftState.value = UiState.Error(error.message ?: "Failed to broadcast roster update") }
            )
        }
    }

    fun resetActionStates() {
        _createShiftState.value = UiState.Idle
        _addBreakState.value = UiState.Idle
        _notifyShiftState.value = UiState.Idle
    }
}
