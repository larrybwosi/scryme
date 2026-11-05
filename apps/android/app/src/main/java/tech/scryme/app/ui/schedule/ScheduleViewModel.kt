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
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.SubtaskGroup
import tech.scryme.app.domain.model.SubtaskItem
import tech.scryme.app.domain.model.TimelineItem
import tech.scryme.app.data.dto.AttendanceStatusDto
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.notifications.NotificationHelper
import tech.scryme.app.util.LocationHelper
import tech.scryme.app.util.LocationValidationResult
import javax.inject.Inject

sealed interface ScheduleUiState {
    object Loading : ScheduleUiState
    data class Success(
        val selectedDate: String = tech.scryme.app.util.DateUtils.getTodayString(),
        val weekDays: List<tech.scryme.app.util.CalendarDay> = emptyList(),
        val currentMonthTitle: String = "",
        val isMonthPickerVisible: Boolean = false,
        val monthPickerCalendar: java.util.Calendar = java.util.Calendar.getInstance(),
        val monthGridDays: List<tech.scryme.app.util.CalendarDay> = emptyList(),
        val myTasks: List<StaffTask> = emptyList(),
        val myShifts: List<StaffShift> = emptyList(),
        val teamShifts: List<StaffShift> = emptyList(),
        val trades: List<ShiftTrade> = emptyList(),
        val timelineItems: List<tech.scryme.app.domain.model.TimelineItem> = emptyList(),
        val selectedTab: Int = 0, // 0: Timeline, 1: Team Roster, 2: Shift Trades
        val attendanceStatus: AttendanceStatusDto? = null,
        val locations: List<BranchLocation> = emptyList(),
        val members: List<UserProfile> = emptyList(),
        val errorMessage: String? = null
    ) : ScheduleUiState
    data class Error(val message: String) : ScheduleUiState
}

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val branchRepository: BranchRepository,
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager,
    @ApplicationContext private val context: Context
) : ViewModel() {
    private var currentSelectedDate: String = tech.scryme.app.util.DateUtils.getTodayString()
    private var monthCalendar: java.util.Calendar = java.util.Calendar.getInstance()

    fun selectDate(dateStr: String) {
        currentSelectedDate = dateStr
        val state = _uiState.value as? ScheduleUiState.Success ?: return
        val dateObj = tech.scryme.app.util.DateUtils.parseDate(dateStr) ?: java.util.Date()
        val weekDays = tech.scryme.app.util.DateUtils.getWeekDays(dateObj, dateStr)
        val monthTitle = tech.scryme.app.util.DateUtils.formatMonthYear(java.util.Calendar.getInstance().apply { time = dateObj })
        val timeline = computeTimelineItems(state.myTasks, state.myShifts, dateStr)

        _uiState.value = state.copy(
            selectedDate = dateStr,
            weekDays = weekDays,
            currentMonthTitle = monthTitle,
            timelineItems = timeline,
            isMonthPickerVisible = false
        )
    }

    fun openMonthPicker() {
        val state = _uiState.value as? ScheduleUiState.Success ?: return
        val dateObj = tech.scryme.app.util.DateUtils.parseDate(currentSelectedDate) ?: java.util.Date()
        monthCalendar.time = dateObj
        _uiState.value = state.copy(
            isMonthPickerVisible = true,
            monthPickerCalendar = monthCalendar,
            monthGridDays = tech.scryme.app.util.DateUtils.getMonthGrid(
                monthCalendar.get(java.util.Calendar.YEAR),
                monthCalendar.get(java.util.Calendar.MONTH),
                currentSelectedDate
            )
        )
    }

    fun closeMonthPicker() {
        val state = _uiState.value as? ScheduleUiState.Success ?: return
        _uiState.value = state.copy(isMonthPickerVisible = false)
    }

    fun nextMonth() {
        val state = _uiState.value as? ScheduleUiState.Success ?: return
        monthCalendar.add(java.util.Calendar.MONTH, 1)
        _uiState.value = state.copy(
            monthPickerCalendar = monthCalendar,
            monthGridDays = tech.scryme.app.util.DateUtils.getMonthGrid(
                monthCalendar.get(java.util.Calendar.YEAR),
                monthCalendar.get(java.util.Calendar.MONTH),
                currentSelectedDate
            )
        )
    }

    fun previousMonth() {
        val state = _uiState.value as? ScheduleUiState.Success ?: return
        monthCalendar.add(java.util.Calendar.MONTH, -1)
        _uiState.value = state.copy(
            monthPickerCalendar = monthCalendar,
            monthGridDays = tech.scryme.app.util.DateUtils.getMonthGrid(
                monthCalendar.get(java.util.Calendar.YEAR),
                monthCalendar.get(java.util.Calendar.MONTH),
                currentSelectedDate
            )
        )
    }

    private fun computeTimelineItems(
        tasks: List<StaffTask>,
        shifts: List<StaffShift>,
        targetDateStr: String
    ): List<tech.scryme.app.domain.model.TimelineItem> {
        val filteredTasks = tasks.filter { task ->
            task.dueDate.isNullOrBlank() || task.dueDate.startsWith(targetDateStr)
        }

        val cal = java.util.Calendar.getInstance().apply {
            time = tech.scryme.app.util.DateUtils.parseDate(targetDateStr) ?: java.util.Date()
        }
        val calDayOfWeek = cal.get(java.util.Calendar.DAY_OF_WEEK)
        val dayOfWeekNormalized = if (calDayOfWeek == java.util.Calendar.SUNDAY) 7 else calDayOfWeek - 1

        val matchingShifts = shifts.filter { it.dayOfWeek == dayOfWeekNormalized }

        val taskItems = filteredTasks.map { tech.scryme.app.domain.model.TimelineItem.TaskItem(task = it) }
        val shiftItems = matchingShifts.map { tech.scryme.app.domain.model.TimelineItem.ShiftItem(shift = it) }

        return (taskItems + shiftItems).sortedBy { it.timeDisplay }
    }

    fun toggleTaskCompletion(taskId: String) {
        viewModelScope.launch {
            val state = _uiState.value as? ScheduleUiState.Success ?: return@launch
            val task = state.myTasks.find { it.id == taskId } ?: return@launch
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            val isCurrentlyCompleted = task.status.equals("COMPLETED", ignoreCase = true) ||
                    task.status.equals("DONE", ignoreCase = true)
            val newStatus = if (isCurrentlyCompleted) "TODO" else "COMPLETED"

            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = taskId,
                title = task.title,
                description = task.description,
                priority = task.priority,
                status = newStatus,
                dueDate = task.dueDate,
                dueTime = task.dueTime,
                category = task.category,
                subtaskGroups = task.subtaskGroups
            )

            result.fold(
                onSuccess = { updatedTask ->
                    val updatedList = state.myTasks.map {
                        if (it.id == taskId) updatedTask else it
                    }
                    val updatedTimeline = computeTimelineItems(updatedList, state.myShifts, state.selectedDate)
                    _uiState.value = state.copy(
                        myTasks = updatedList,
                        timelineItems = updatedTimeline
                    )
                },
                onFailure = { error ->
                    _uiState.value = state.copy(
                        errorMessage = error.message ?: "Failed to update task completion"
                    )
                }
            )
        }
    }

    fun createStaffTask(
        title: String,
        description: String?,
        priority: String = "MEDIUM",
        assignedMemberId: String? = null,
        dueDate: String?,
        dueTime: String?,
        category: String?,
        subtaskGroups: List<tech.scryme.app.domain.model.SubtaskGroup> = emptyList(),
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val state = _uiState.value as? ScheduleUiState.Success ?: return@launch
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            val result = scheduleRepository.createStaffTask(
                orgSlug = orgSlug,
                title = title,
                description = description,
                assignedMemberId = assignedMemberId,
                priority = priority,
                dueDate = dueDate ?: currentSelectedDate,
                dueTime = dueTime,
                category = category,
                subtaskGroups = subtaskGroups
            )

            result.fold(
                onSuccess = { newTask ->
                    val updatedTasks = state.myTasks + newTask
                    val updatedTimeline = computeTimelineItems(updatedTasks, state.myShifts, state.selectedDate)
                    _uiState.value = state.copy(
                        myTasks = updatedTasks,
                        timelineItems = updatedTimeline
                    )
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Task Created",
                        newTask.title
                    )
                    onSuccess()
                },
                onFailure = { error ->
                    val msg = error.message ?: "Failed to create task"
                    _uiState.value = state.copy(errorMessage = msg)
                    onError(msg)
                }
            )
        }
    }


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
            val membersResult = profileRepository.getMembers(orgSlug)

            myShiftsResult.fold(
                onSuccess = { myShifts ->
                    val teamShifts = teamShiftsResult.getOrDefault(emptyList())
                    val trades = tradesResult.getOrDefault(emptyList())
                    val attendanceStatus = attendanceStatusResult.getOrNull()
                    val locations = locationsResult.getOrDefault(emptyList())
                    val members = membersResult.getOrDefault(emptyList())
                    val tasks = scheduleRepository.getStaffTasks(orgSlug).getOrDefault(emptyList())
                    val selectedDateObj = tech.scryme.app.util.DateUtils.parseDate(currentSelectedDate) ?: java.util.Date()
                    val weekDays = tech.scryme.app.util.DateUtils.getWeekDays(selectedDateObj, currentSelectedDate)
                    val currentMonthTitle = tech.scryme.app.util.DateUtils.formatMonthYear(java.util.Calendar.getInstance().apply { time = selectedDateObj })
                    val timeline = computeTimelineItems(tasks, myShifts, currentSelectedDate)

                    _uiState.value = ScheduleUiState.Success(
                        selectedDate = currentSelectedDate,
                        weekDays = weekDays,
                        currentMonthTitle = currentMonthTitle,
                        isMonthPickerVisible = (_uiState.value as? ScheduleUiState.Success)?.isMonthPickerVisible ?: false,
                        monthPickerCalendar = monthCalendar,
                        monthGridDays = tech.scryme.app.util.DateUtils.getMonthGrid(
                            monthCalendar.get(java.util.Calendar.YEAR),
                            monthCalendar.get(java.util.Calendar.MONTH),
                            currentSelectedDate
                        ),
                        myTasks = tasks,
                        myShifts = myShifts,
                        teamShifts = teamShifts,
                        trades = trades,
                        timelineItems = timeline,
                        selectedTab = tabIndex,
                        attendanceStatus = attendanceStatus,
                        locations = locations,
                        members = members
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

    fun clearError() {
        val currentState = _uiState.value
        if (currentState is ScheduleUiState.Success) {
            _uiState.value = currentState.copy(errorMessage = null)
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

            var finalLat = latitude
            var finalLng = longitude
            var accuracy: Float? = null
            var isMock = false

            // 1. Acquire current device GPS location
            val deviceLocation = LocationHelper.getCurrentLocation(context)
            if (deviceLocation != null) {
                finalLat = deviceLocation.latitude
                finalLng = deviceLocation.longitude
                accuracy = deviceLocation.accuracy
                isMock = LocationHelper.isMockLocation(deviceLocation)
            }

            // 2. Mock Location (Fake GPS) Rejection Check
            if (isMock) {
                val errorMsg = "Fake/Mock GPS location detected. Check-in rejected."
                val state = _uiState.value as? ScheduleUiState.Success
                if (state != null) {
                    _uiState.value = state.copy(errorMessage = errorMsg)
                }
                onError(errorMsg)
                return@launch
            }

            if (deviceLocation == null && latitude == null && longitude == null && branchCode == null) {
                val errorMsg = "Unable to acquire device GPS location. Please ensure location services are enabled."
                val state = _uiState.value as? ScheduleUiState.Success
                if (state != null) {
                    _uiState.value = state.copy(errorMessage = errorMsg)
                }
                onError(errorMsg)
                return@launch
            }

            // 3. Geofence Distance Validation against pinned branch location
            val targetLocationId = locationId ?: sessionManager.getLocationId()
            val state = _uiState.value as? ScheduleUiState.Success
            val targetBranch = state?.locations?.find { it.id == targetLocationId }
            val targetLat = targetBranch?.latitude
            val targetLng = targetBranch?.longitude

            if (deviceLocation != null && targetLat != null && targetLng != null) {
                val validationResult = LocationHelper.validateCheckInLocation(
                    deviceLocation = deviceLocation,
                    targetLat = targetLat,
                    targetLng = targetLng,
                    maxRadiusMeters = 50.0
                )

                when (validationResult) {
                    is LocationValidationResult.MockLocationDetected -> {
                        val errorMsg = "Fake/Mock GPS location detected. Check-in rejected."
                        if (state != null) {
                            _uiState.value = state.copy(errorMessage = errorMsg)
                        }
                        onError(errorMsg)
                        return@launch
                    }
                    is LocationValidationResult.OutOfRadius -> {
                        val distFormatted = "%.1f".format(validationResult.distanceMeters)
                        val branchName = targetBranch?.name ?: "the branch"
                        val errorMsg = "Outside allowed location radius (50m). You are ${distFormatted}m away from ${branchName}."
                        if (state != null) {
                            _uiState.value = state.copy(errorMessage = errorMsg)
                        }
                        onError(errorMsg)
                        return@launch
                    }
                    is LocationValidationResult.Error -> {
                        if (state != null) {
                            _uiState.value = state.copy(errorMessage = validationResult.message)
                        }
                        onError(validationResult.message)
                        return@launch
                    }
                    is LocationValidationResult.Success -> {
                        // Location is within 50 meters
                    }
                }
            }

            // 4. Submit Attendance Check-In Request
            val result = scheduleRepository.checkInAttendance(
                orgSlug = orgSlug,
                locationId = targetLocationId,
                branchCode = branchCode,
                latitude = finalLat,
                longitude = finalLng,
                accuracy = accuracy,
                isMock = isMock,
                verificationMethod = if (branchCode != null) "QR_SCAN" else "GPS_GEOFENCE"
            )

            result.fold(
                onSuccess = { log ->
                    val statusMsg = if (log.isLocationVerified) "Checked in & Verified!" else "Checked in (Location Verified)"
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
                    val currentState = _uiState.value as? ScheduleUiState.Success
                    if (currentState != null) {
                        _uiState.value = currentState.copy(errorMessage = msg)
                    }
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

    fun saveShiftAssessment(
        shiftId: String,
        ratingScore: Int,
        attendancePunctuality: String,
        shiftNotes: String?,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.saveShiftAssessment(
                orgSlug = orgSlug,
                shiftId = shiftId,
                ratingScore = ratingScore,
                attendancePunctuality = attendancePunctuality,
                shiftNotes = shiftNotes
            )
            result.fold(
                onSuccess = {
                    NotificationHelper.showScheduleNotification(
                        context,
                        "Shift Assessment Saved",
                        "Performance Rating: $ratingScore/5 Stars"
                    )
                    onSuccess()
                    val currentTab = (_uiState.value as? ScheduleUiState.Success)?.selectedTab ?: 0
                    loadSchedule(currentTab)
                },
                onFailure = { error ->
                    onError(error.message ?: "Failed to save shift assessment")
                }
            )
        }
    }
}
