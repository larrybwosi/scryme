package tech.scryme.app.ui.branch

import android.content.Context
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
import tech.scryme.app.util.LocationHelper
import javax.inject.Inject

sealed interface BranchUiState {
    object Loading : BranchUiState
    data class Success(
        val branches: List<BranchLocation>,
        val activeLocationId: String?,
        val message: String? = null
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

    fun pinCurrentLocation(context: Context, locationId: String) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val location = LocationHelper.getCurrentLocation(context)
            if (location == null) {
                val currentState = _uiState.value
                if (currentState is BranchUiState.Success) {
                    _uiState.value = currentState.copy(message = "Unable to acquire current GPS location")
                }
                return@launch
            }

            updateBranchCoordinates(locationId, location.latitude, location.longitude)
        }
    }

    fun updateBranchCoordinates(locationId: String, latitude: Double, longitude: Double) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = branchRepository.updateBranchCoordinates(orgSlug, locationId, latitude, longitude)
            result.fold(
                onSuccess = { updatedBranch ->
                    val currentState = _uiState.value
                    if (currentState is BranchUiState.Success) {
                        val updatedList = currentState.branches.map {
                            if (it.id == updatedBranch.id) updatedBranch else it
                        }
                        _uiState.value = currentState.copy(
                            branches = updatedList,
                            message = "Pinned coordinates: ${"%.5f".format(latitude)}, ${"%.5f".format(longitude)}"
                        )
                    } else {
                        loadBranches()
                    }
                },
                onFailure = { error ->
                    val currentState = _uiState.value
                    if (currentState is BranchUiState.Success) {
                        _uiState.value = currentState.copy(message = "Failed to update coordinates: ${error.message}")
                    }
                }
            )
        }
    }
}
