package tech.scryme.app.ui.tasks

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
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.SubtaskGroup
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.notifications.NotificationHelper
import javax.inject.Inject

sealed interface TasksUiState {
    object Loading : TasksUiState
    data class Success(
        val tasks: List<StaffTask>,
        val selectedFilter: String = "ALL",
        val members: List<UserProfile> = emptyList()
    ) : TasksUiState
    data class Error(val message: String) : TasksUiState
}

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow<TasksUiState>(TasksUiState.Loading)
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()

    fun loadTasks(filterStatus: String = "ALL") {
        viewModelScope.launch {
            _uiState.value = TasksUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = TasksUiState.Error("Session missing organization context")
                return@launch
            }
            val memberId = sessionManager.getMemberId()
            val statusParam = if (filterStatus == "ALL") null else filterStatus

            val result = scheduleRepository.getStaffTasks(orgSlug, memberId = memberId, status = statusParam)
            val membersResult = profileRepository.getMembers(orgSlug)
            val members = membersResult.getOrDefault(emptyList())
            result.fold(
                onSuccess = { tasks ->
                    _uiState.value = TasksUiState.Success(
                        tasks = tasks,
                        selectedFilter = filterStatus,
                        members = members
                    )
                },
                onFailure = { error ->
                    _uiState.value = TasksUiState.Error(error.message ?: "Failed to load tasks")
                }
            )
        }
    }

    fun createStaffTask(
        title: String,
        description: String?,
        assignedMemberId: String?,
        priority: String?,
        dueDate: String?,
        dueTime: String? = null,
        category: String? = null,
        estimatedHours: Double? = null,
        subtaskGroups: List<SubtaskGroup> = emptyList(),
        onSuccess: (StaffTask) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                onError("Session missing organization context")
                return@launch
            }
            val currentMemberId = sessionManager.getMemberId()
            val targetMemberId = assignedMemberId ?: currentMemberId

            val result = scheduleRepository.createStaffTask(
                orgSlug = orgSlug,
                title = title,
                description = description,
                assignedMemberId = targetMemberId,
                priority = priority,
                dueDate = dueDate,
                dueTime = dueTime,
                category = category,
                subtaskGroups = subtaskGroups
            )
            result.fold(
                onSuccess = { newTask ->
                    NotificationHelper.showTaskNotification(
                        context,
                        "New Task Assigned",
                        "Task '${newTask.title}' has been assigned."
                    )
                    onSuccess(newTask)
                    val currentFilter = (_uiState.value as? TasksUiState.Success)?.selectedFilter ?: "ALL"
                    loadTasks(currentFilter)
                },
                onFailure = { error ->
                    val msg = error.message ?: "Failed to create task"
                    onError(msg)
                }
            )
        }
    }

    fun updateTask(
        taskId: String,
        title: String?,
        description: String?,
        status: String?,
        priority: String?,
        category: String?,
        dueDate: String?,
        dueTime: String?,
        estimatedHours: Double? = null,
        actualHours: Double? = null,
        subtaskGroups: List<SubtaskGroup>? = null,
        onSuccess: (StaffTask) -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                onError("Session missing organization context")
                return@launch
            }
            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = taskId,
                title = title,
                description = description,
                status = status,
                priority = priority,
                category = category,
                dueDate = dueDate,
                dueTime = dueTime,
                subtaskGroups = subtaskGroups
            )
            result.fold(
                onSuccess = { updatedTask ->
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Updated",
                        "Task '${updatedTask.title}' has been updated."
                    )
                    onSuccess(updatedTask)
                    val current = _uiState.value
                    if (current is TasksUiState.Success) {
                        loadTasks(current.selectedFilter)
                    } else {
                        loadTasks()
                    }
                },
                onFailure = { error ->
                    onError(error.message ?: "Failed to update task")
                }
            )
        }
    }

    fun updateTaskStatus(task: StaffTask, newStatus: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = task.id,
                status = newStatus
            )
            result.fold(
                onSuccess = { updatedTask ->
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Status Updated",
                        "Task '${updatedTask.title}' set to $newStatus."
                    )
                    val current = _uiState.value
                    if (current is TasksUiState.Success) {
                        loadTasks(current.selectedFilter)
                    } else {
                        loadTasks()
                    }
                },
                onFailure = { error ->
                    _uiState.value = TasksUiState.Error(error.message ?: "Failed to update task")
                }
            )
        }
    }

    fun deleteTask(
        taskId: String,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                onError("Session missing organization context")
                return@launch
            }
            val result = scheduleRepository.deleteStaffTask(orgSlug, taskId)
            result.fold(
                onSuccess = {
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Deleted",
                        "Task has been removed successfully."
                    )
                    onSuccess()
                    val currentFilter = (_uiState.value as? TasksUiState.Success)?.selectedFilter ?: "ALL"
                    loadTasks(currentFilter)
                },
                onFailure = { error ->
                    onError(error.message ?: "Failed to delete task")
                }
            )
        }
    }

    fun saveTaskAssessment(
        taskId: String,
        qualityScore: Int,
        complexity: String,
        riskLevel: String,
        estimatedHours: Double?,
        actualHours: Double?,
        notes: String?,
        onSuccess: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                onError("Session missing organization context")
                return@launch
            }
            val result = scheduleRepository.saveTaskAssessment(
                orgSlug = orgSlug,
                taskId = taskId,
                qualityScore = qualityScore,
                complexity = complexity,
                riskLevel = riskLevel,
                estimatedHours = estimatedHours,
                actualHours = actualHours,
                notes = notes
            )
            result.fold(
                onSuccess = {
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Assessment Saved",
                        "Quality: $qualityScore/5 Stars | Risk: $riskLevel"
                    )
                    onSuccess()
                    val currentFilter = (_uiState.value as? TasksUiState.Success)?.selectedFilter ?: "ALL"
                    loadTasks(currentFilter)
                },
                onFailure = { error ->
                    onError(error.message ?: "Failed to save task assessment")
                }
            )
        }
    }
}
