package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.StaffTaskDto
import tech.scryme.admin.domain.repository.AnnouncementRepository
import tech.scryme.admin.domain.repository.TasksRepository

class TasksViewModel(
    private val repository: TasksRepository,
    private val announcementRepository: AnnouncementRepository? = null
) : ViewModel() {

    private val _tasksState = MutableStateFlow<UiState<List<StaffTaskDto>>>(UiState.Idle)
    val tasksState: StateFlow<UiState<List<StaffTaskDto>>> = _tasksState.asStateFlow()

    private val _createTaskState = MutableStateFlow<UiState<StaffTaskDto>>(UiState.Idle)
    val createTaskState: StateFlow<UiState<StaffTaskDto>> = _createTaskState.asStateFlow()

    private val _updateTaskState = MutableStateFlow<UiState<StaffTaskDto>>(UiState.Idle)
    val updateTaskState: StateFlow<UiState<StaffTaskDto>> = _updateTaskState.asStateFlow()

    private val _notifyTaskState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val notifyTaskState: StateFlow<UiState<Unit>> = _notifyTaskState.asStateFlow()

    private val _selectedStatus = MutableStateFlow<String?>(null) // ALL / PENDING / IN_PROGRESS / COMPLETED / CANCELLED
    val selectedStatus: StateFlow<String?> = _selectedStatus.asStateFlow()

    private val _selectedPriority = MutableStateFlow<String?>(null) // LOW / MEDIUM / HIGH / URGENT
    val selectedPriority: StateFlow<String?> = _selectedPriority.asStateFlow()

    private val _selectedMemberId = MutableStateFlow<String?>(null)
    val selectedMemberId: StateFlow<String?> = _selectedMemberId.asStateFlow()

    fun setStatusFilter(status: String?) {
        _selectedStatus.value = if (status == "ALL") null else status
        loadTasks()
    }

    fun setPriorityFilter(priority: String?) {
        _selectedPriority.value = if (priority == "ALL") null else priority
        loadTasks()
    }

    fun setMemberFilter(memberId: String?) {
        _selectedMemberId.value = memberId
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            _tasksState.value = UiState.Loading
            val result = repository.getTasks(
                assignedMemberId = _selectedMemberId.value,
                status = _selectedStatus.value,
                priority = _selectedPriority.value
            )
            result.fold(
                onSuccess = { _tasksState.value = UiState.Success(it) },
                onFailure = { _tasksState.value = UiState.Error(it.message ?: "Failed to load operational tasks") }
            )
        }
    }

    fun createTask(
        title: String,
        description: String? = null,
        assignedMemberId: String? = null,
        shiftId: String? = null,
        locationId: String? = null,
        priority: String = "MEDIUM",
        dueDate: String? = null,
        notifyViaScrymeChat: Boolean = true
    ) {
        viewModelScope.launch {
            _createTaskState.value = UiState.Loading
            val result = repository.createTask(
                title = title,
                description = description,
                assignedMemberId = assignedMemberId,
                shiftId = shiftId,
                locationId = locationId,
                priority = priority,
                dueDate = dueDate,
                notifyViaScrymeChat = notifyViaScrymeChat
            )
            result.fold(
                onSuccess = { task ->
                    _createTaskState.value = UiState.Success(task)
                    if (notifyViaScrymeChat && !assignedMemberId.isNullOrBlank()) {
                        notifyTaskAssigned(task)
                    }
                    loadTasks()
                },
                onFailure = { error ->
                    _createTaskState.value = UiState.Error(error.message ?: "Failed to create task")
                }
            )
        }
    }

    fun updateTaskStatus(taskId: String, status: String, notes: String? = null) {
        viewModelScope.launch {
            _updateTaskState.value = UiState.Loading
            val result = repository.updateTaskStatus(taskId, status, notes)
            result.fold(
                onSuccess = { updated ->
                    _updateTaskState.value = UiState.Success(updated)
                    loadTasks()
                },
                onFailure = { error ->
                    _updateTaskState.value = UiState.Error(error.message ?: "Failed to update task status")
                }
            )
        }
    }

    fun notifyTaskAssigned(task: StaffTaskDto, customNote: String? = null) {
        val memberId = task.assignedMemberId ?: return
        val repo = announcementRepository ?: return

        val title = "📋 Task Assignment: ${task.title}"
        val dueStr = if (!task.dueDate.isNullOrBlank()) "\nDue Date: ${task.dueDate}" else ""
        val priorityTag = "[${task.priority.uppercase()}]"
        val descStr = if (!task.description.isNullOrBlank()) "\n\nDescription: ${task.description}" else ""
        val extraNote = if (!customNote.isNullOrBlank()) "\n\nNote: $customNote" else ""

        val body = """
            Priority: $priorityTag$dueStr$descStr$extraNote

            Prompt Instructions: Please update task progress or reply once completed.
            Action: Complete task or submit progress note.
        """.trimIndent()

        viewModelScope.launch {
            _notifyTaskState.value = UiState.Loading
            repo.sendMessageToMember(
                memberId = memberId,
                title = title,
                message = body,
                type = "TASK_ASSIGNMENT"
            ).fold(
                onSuccess = { _notifyTaskState.value = UiState.Success(Unit) },
                onFailure = { error -> _notifyTaskState.value = UiState.Error(error.message ?: "Failed to send Scryme Chat notification") }
            )
        }
    }

    fun resetActionStates() {
        _createTaskState.value = UiState.Idle
        _updateTaskState.value = UiState.Idle
        _notifyTaskState.value = UiState.Idle
    }
}
