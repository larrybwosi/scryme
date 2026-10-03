package tech.scryme.app.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject

sealed interface TasksUiState {
    object Loading : TasksUiState
    data class Success(
        val tasks: List<StaffTask>,
        val selectedFilter: String = "ALL"
    ) : TasksUiState
    data class Error(val message: String) : TasksUiState
}

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val sessionManager: SessionManager
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
            result.fold(
                onSuccess = { tasks ->
                    _uiState.value = TasksUiState.Success(tasks = tasks, selectedFilter = filterStatus)
                },
                onFailure = { error ->
                    _uiState.value = TasksUiState.Error(error.message ?: "Failed to load tasks")
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
                onSuccess = {
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
}
