package tech.scryme.app.ui.branch

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.repository.BranchRepository
import javax.inject.Inject

sealed interface BranchUiState {
    object Loading : BranchUiState
    data class Success(
        val branches: List<BranchLocation>,
        val activeLocationId: String?
    ) : BranchUiState
    data class Error(val message: String) : BranchUiState
}

@HiltViewModel
class BranchViewModel @Inject constructor(
    private val branchRepository: BranchRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<BranchUiState>(BranchUiState.Loading)
    val uiState: StateFlow<BranchUiState> = _uiState.asStateFlow()

    fun loadBranches() {
        viewModelScope.launch {
            _uiState.value = BranchUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = BranchUiState.Error("Missing organization context")
                return@launch
            }

            val result = branchRepository.getBranchLocations(orgSlug)
            val activeLoc = sessionManager.getLocationId()

            result.fold(
                onSuccess = { branches ->
                    _uiState.value = BranchUiState.Success(branches = branches, activeLocationId = activeLoc)
                },
                onFailure = { error ->
                    _uiState.value = BranchUiState.Error(error.message ?: "Failed to load branches")
                }
            )
        }
    }

    fun switchBranch(locationId: String) {
        viewModelScope.launch {
            branchRepository.switchActiveBranch(locationId)
            loadBranches()
        }
    }
}
