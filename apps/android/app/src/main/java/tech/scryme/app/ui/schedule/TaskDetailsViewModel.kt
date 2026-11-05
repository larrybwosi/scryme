package tech.scryme.app.ui.schedule

import android.content.Context
import androidx.lifecycle.SavedStateHandle
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
import tech.scryme.app.domain.model.SubtaskItem
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.notifications.NotificationHelper
import javax.inject.Inject

sealed interface TaskDetailsUiState {
    object Loading : TaskDetailsUiState
    data class Success(
        val task: StaffTask,
        val members: List<UserProfile> = emptyList(),
        val isSaving: Boolean = false,
        val isDeleted: Boolean = false,
        val errorMessage: String? = null
    ) : TaskDetailsUiState
    data class Error(val message: String) : TaskDetailsUiState
}

@HiltViewModel
class TaskDetailsViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager,
    savedStateHandle: SavedStateHandle,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val taskId: String = checkNotNull(savedStateHandle["taskId"])

    private val _uiState = MutableStateFlow<TaskDetailsUiState>(TaskDetailsUiState.Loading)
    val uiState: StateFlow<TaskDetailsUiState> = _uiState.asStateFlow()

    init {
        loadTaskDetails()
    }

    fun loadTaskDetails() {
        viewModelScope.launch {
            _uiState.value = TaskDetailsUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = TaskDetailsUiState.Error("Missing organization context")
                return@launch
            }

            val result = scheduleRepository.getStaffTaskById(orgSlug, taskId)
            val membersRes = profileRepository.getMembers(orgSlug)
            val members = membersRes.getOrDefault(emptyList())

            result.fold(
                onSuccess = { task ->
                    _uiState.value = TaskDetailsUiState.Success(task = task, members = members)
                },
                onFailure = { error ->
                    _uiState.value = TaskDetailsUiState.Error(error.message ?: "Failed to load task details")
                }
            )
        }
    }

    fun updateStatus(newStatus: String) {
        viewModelScope.launch {
            val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return@launch
            val task = currentState.task
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            _uiState.value = currentState.copy(isSaving = true)

            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = task.id,
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
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Status Updated",
                        "Task '${updatedTask.title}' set to $newStatus."
                    )
                    _uiState.value = currentState.copy(
                        task = updatedTask,
                        isSaving = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = currentState.copy(
                        isSaving = false,
                        errorMessage = error.message ?: "Failed to update status"
                    )
                }
            )
        }
    }

    fun updateTaskDetails(
        title: String,
        description: String?,
        priority: String?,
        category: String?,
        dueDate: String?,
        dueTime: String?,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return@launch
            val task = currentState.task
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            _uiState.value = currentState.copy(isSaving = true)

            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = task.id,
                title = title,
                description = description,
                priority = priority,
                status = task.status,
                dueDate = dueDate,
                dueTime = dueTime,
                category = category,
                subtaskGroups = task.subtaskGroups
            )

            result.fold(
                onSuccess = { updatedTask ->
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Details Updated",
                        "Task '${updatedTask.title}' has been modified."
                    )
                    _uiState.value = currentState.copy(
                        task = updatedTask,
                        isSaving = false
                    )
                    onSuccess()
                },
                onFailure = { error ->
                    _uiState.value = currentState.copy(
                        isSaving = false,
                        errorMessage = error.message ?: "Failed to update task details"
                    )
                }
            )
        }
    }

    fun toggleSubtask(groupId: String, itemId: String) {
        viewModelScope.launch {
            val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return@launch
            val task = currentState.task
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            val updatedGroups = task.subtaskGroups.map { group ->
                if (group.id == groupId) {
                    val updatedItems = group.items.map { item ->
                        if (item.id == itemId) {
                            item.copy(isCompleted = !item.isCompleted)
                        } else {
                            item
                        }
                    }
                    group.copy(items = updatedItems)
                } else {
                    group
                }
            }

            val optimisticTask = task.copy(subtaskGroups = updatedGroups)
            _uiState.value = currentState.copy(task = optimisticTask)

            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = task.id,
                title = task.title,
                description = task.description,
                priority = task.priority,
                status = task.status,
                dueDate = task.dueDate,
                dueTime = task.dueTime,
                category = task.category,
                subtaskGroups = updatedGroups
            )

            result.fold(
                onSuccess = { savedTask ->
                    _uiState.value = currentState.copy(task = savedTask)
                },
                onFailure = { error ->
                    _uiState.value = currentState.copy(
                        errorMessage = error.message ?: "Failed to update subtask"
                    )
                }
            )
        }
    }

    fun addSubtaskGroup(title: String) {
        viewModelScope.launch {
            val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return@launch
            val task = currentState.task
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            val newGroup = SubtaskGroup(
                id = "grp_${System.currentTimeMillis()}",
                title = title.ifBlank { "New Breakdown Group" },
                items = emptyList()
            )
            val updatedGroups = task.subtaskGroups + newGroup
            _uiState.value = currentState.copy(task = task.copy(subtaskGroups = updatedGroups))

            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = task.id,
                title = task.title,
                description = task.description,
                priority = task.priority,
                status = task.status,
                dueDate = task.dueDate,
                dueTime = task.dueTime,
                category = task.category,
                subtaskGroups = updatedGroups
            )
            result.onSuccess {
                _uiState.value = currentState.copy(task = it)
            }
        }
    }

    fun addSubtaskItem(groupId: String, title: String) {
        viewModelScope.launch {
            val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return@launch
            val task = currentState.task
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            val newItem = SubtaskItem(
                id = "item_${System.currentTimeMillis()}",
                title = title.ifBlank { "Checklist item" },
                isCompleted = false
            )
            val updatedGroups = task.subtaskGroups.map { g ->
                if (g.id == groupId) {
                    g.copy(items = g.items + newItem)
                } else {
                    g
                }
            }
            _uiState.value = currentState.copy(task = task.copy(subtaskGroups = updatedGroups))

            val result = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = task.id,
                title = task.title,
                description = task.description,
                priority = task.priority,
                status = task.status,
                dueDate = task.dueDate,
                dueTime = task.dueTime,
                category = task.category,
                subtaskGroups = updatedGroups
            )
            result.onSuccess {
                _uiState.value = currentState.copy(task = it)
            }
        }
    }

    fun deleteTask(onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return@launch
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch

            _uiState.value = currentState.copy(isSaving = true)

            val result = scheduleRepository.deleteStaffTask(orgSlug, taskId)
            result.fold(
                onSuccess = {
                    NotificationHelper.showTaskNotification(
                        context,
                        "Task Deleted",
                        "Task has been removed successfully."
                    )
                    _uiState.value = currentState.copy(isSaving = false, isDeleted = true)
                    onSuccess()
                },
                onFailure = { error ->
                    _uiState.value = currentState.copy(
                        isSaving = false,
                        errorMessage = error.message ?: "Failed to delete task"
                    )
                }
            )
        }
    }

    fun clearError() {
        val currentState = _uiState.value as? TaskDetailsUiState.Success ?: return
        _uiState.value = currentState.copy(errorMessage = null)
    }
}
