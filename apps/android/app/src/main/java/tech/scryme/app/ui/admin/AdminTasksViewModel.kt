package tech.scryme.app.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject

sealed interface AdminTasksUiState {
    object Loading : AdminTasksUiState
    data class Success(
        val tasks: List<StaffTask> = emptyList(),
        val members: List<UserProfile> = emptyList(),
        val activeFilter: String = "ALL", // ALL, TODO, IN_PROGRESS, COMPLETED
        val searchQuery: String = ""
    ) : AdminTasksUiState
    data class Error(val message: String) : AdminTasksUiState
}

@HiltViewModel
class AdminTasksViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<AdminTasksUiState>(AdminTasksUiState.Loading)
    val uiState: StateFlow<AdminTasksUiState> = _uiState.asStateFlow()

    private var currentFilter: String = "ALL"
    private var currentSearch: String = ""

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = AdminTasksUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = AdminTasksUiState.Error("Missing organization context")
                return@launch
            }

            val tasksRes = scheduleRepository.getStaffTasks(orgSlug)
            val membersRes = profileRepository.getMembers(orgSlug)

            if (tasksRes.isSuccess) {
                _uiState.value = AdminTasksUiState.Success(
                    tasks = tasksRes.getOrDefault(emptyList()),
                    members = membersRes.getOrDefault(emptyList()),
                    activeFilter = currentFilter,
                    searchQuery = currentSearch
                )
            } else {
                _uiState.value = AdminTasksUiState.Error(
                    tasksRes.exceptionOrNull()?.message ?: "Failed to load tasks"
                )
            }
        }
    }

    fun setFilter(filter: String) {
        currentFilter = filter
        val state = _uiState.value
        if (state is AdminTasksUiState.Success) {
            _uiState.value = state.copy(activeFilter = filter)
        }
    }

    fun setSearchQuery(query: String) {
        currentSearch = query
        val state = _uiState.value
        if (state is AdminTasksUiState.Success) {
            _uiState.value = state.copy(searchQuery = query)
        }
    }

    fun createTask(
        title: String,
        description: String?,
        assignedMemberId: String?,
        priority: String,
        dueDate: String?
    ) {
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
                onSuccess = { loadData() },
                onFailure = { err ->
                    _uiState.value = AdminTasksUiState.Error(err.message ?: "Failed to create task")
                }
            )
        }
    }

    fun updateTaskStatus(taskId: String, status: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = taskId,
                status = status
            )
            res.fold(
                onSuccess = { loadData() },
                onFailure = { err ->
                    _uiState.value = AdminTasksUiState.Error(err.message ?: "Failed to update status")
                }
            )
        }
    }

    fun reassignTask(taskId: String, memberId: String?) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.updateStaffTask(
                orgSlug = orgSlug,
                taskId = taskId,
                assignedMemberId = memberId
            )
            res.fold(
                onSuccess = { loadData() },
                onFailure = { err ->
                    _uiState.value = AdminTasksUiState.Error(err.message ?: "Failed to reassign task")
                }
            )
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val res = scheduleRepository.deleteStaffTask(orgSlug, taskId)
            res.fold(
                onSuccess = { loadData() },
                onFailure = { err ->
                    _uiState.value = AdminTasksUiState.Error(err.message ?: "Failed to delete task")
                }
            )
        }
    }
}
