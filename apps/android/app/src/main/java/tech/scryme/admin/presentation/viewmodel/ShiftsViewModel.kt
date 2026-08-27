package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.StaffBreakDto
import tech.scryme.admin.data.model.StaffShiftDto
import tech.scryme.admin.domain.repository.ShiftsRepository

class ShiftsViewModel(
    private val repository: ShiftsRepository
) : ViewModel() {

    private val _shiftsState = MutableStateFlow<UiState<List<StaffShiftDto>>>(UiState.Idle)
    val shiftsState: StateFlow<UiState<List<StaffShiftDto>>> = _shiftsState.asStateFlow()

    private val _createShiftState = MutableStateFlow<UiState<StaffShiftDto>>(UiState.Idle)
    val createShiftState: StateFlow<UiState<StaffShiftDto>> = _createShiftState.asStateFlow()

    private val _addBreakState = MutableStateFlow<UiState<StaffBreakDto>>(UiState.Idle)
    val addBreakState: StateFlow<UiState<StaffBreakDto>> = _addBreakState.asStateFlow()

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

    fun resetActionStates() {
        _createShiftState.value = UiState.Idle
        _addBreakState.value = UiState.Idle
    }
}
