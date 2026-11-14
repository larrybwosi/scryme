package tech.scryme.app.ui.staff

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import javax.inject.Inject

sealed interface StaffListUiState {
    object Loading : StaffListUiState
    data class Success(
        val staff: List<UserProfile> = emptyList(),
        val searchQuery: String = "",
        val selectedRole: String? = null
    ) : StaffListUiState
    data class Error(val message: String) : StaffListUiState
}

@HiltViewModel
class StaffViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<StaffListUiState>(StaffListUiState.Loading)
    val uiState: StateFlow<StaffListUiState> = _uiState.asStateFlow()

    private var currentSearch: String = ""
    private var currentRole: String? = null

    init {
        loadStaff()
    }

    fun loadStaff(search: String? = currentSearch, role: String? = currentRole) {
        currentSearch = search ?: ""
        currentRole = role
        viewModelScope.launch {
            _uiState.value = StaffListUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = StaffListUiState.Error("Missing organization context")
                return@launch
            }

            val result = profileRepository.getMembers(orgSlug, search = currentSearch.ifBlank { null }, role = currentRole)
            result.fold(
                onSuccess = { list ->
                    _uiState.value = StaffListUiState.Success(
                        staff = list,
                        searchQuery = currentSearch,
                        selectedRole = currentRole
                    )
                },
                onFailure = { err ->
                    _uiState.value = StaffListUiState.Error(err.message ?: "Failed to load staff")
                }
            )
        }
    }

    fun onSearchQueryChanged(query: String) {
        currentSearch = query
        loadStaff(query, currentRole)
    }

    fun onRoleFilterSelected(role: String?) {
        currentRole = role
        loadStaff(currentSearch, role)
    }
}
