package tech.scryme.app.ui.branch

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.dto.CreateBranchRequestDto
import tech.scryme.app.data.dto.UpdateBranchRequestDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.util.LocationHelper
import javax.inject.Inject

sealed interface BranchUiState {
    object Loading : BranchUiState
    data class Success(
        val branches: List<BranchLocation>,
        val activeLocationId: String?,
        val isAdmin: Boolean = false,
        val actionSuccessMessage: String? = null,
        val message: String? = null
    ) : BranchUiState
    data class Error(val message: String) : BranchUiState
}

@HiltViewModel
class BranchViewModel @Inject constructor(
    private val branchRepository: BranchRepository,
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<BranchUiState>(BranchUiState.Loading)
    val uiState: StateFlow<BranchUiState> = _uiState.asStateFlow()

    fun loadBranches(actionMessage: String? = null) {
        viewModelScope.launch {
            _uiState.value = BranchUiState.Loading
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = BranchUiState.Error("Missing organization context")
                return@launch
            }

            // Check if user is admin or owner
            val sessionResult = authRepository.validateSession()
            val isAdmin = sessionResult.getOrNull()?.let { meData ->
                val role = meData.member?.role ?: meData.memberships?.firstOrNull()?.role ?: "MEMBER"
                val upper = role.uppercase()
                upper == "ADMIN" || upper == "OWNER" || upper == "SUPERADMIN"
            } ?: false

            val result = branchRepository.getBranchLocations(orgSlug)
            val activeLoc = sessionManager.getLocationId()

            result.fold(
                onSuccess = { branches ->
                    _uiState.value = BranchUiState.Success(
                        branches = branches,
                        activeLocationId = activeLoc,
                        isAdmin = isAdmin,
                        actionSuccessMessage = actionMessage
                    )
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
            loadBranches(actionMessage = "Active location updated")
        }
    }

    fun createBranch(
        name: String,
        code: String?,
        address: String?,
        phone: String?,
        locationType: String,
        latitude: Double?,
        longitude: Double?,
        geofenceRadiusMeters: Double?
    ) {
        viewModelScope.launch {
            val req = CreateBranchRequestDto(
                name = name,
                code = code,
                address = address,
                phone = phone,
                locationType = locationType,
                latitude = latitude,
                longitude = longitude,
                geofenceRadiusMeters = geofenceRadiusMeters ?: 100.0
            )
            val result = branchRepository.createBranch(req)
            result.fold(
                onSuccess = {
                    loadBranches(actionMessage = "Location created successfully")
                },
                onFailure = { error ->
                    _uiState.value = BranchUiState.Error(error.message ?: "Failed to create location")
                }
            )
        }
    }

    fun updateBranch(
        locationId: String,
        name: String? = null,
        code: String? = null,
        address: String? = null,
        phone: String? = null,
        locationType: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        geofenceRadiusMeters: Double? = null,
        isActive: Boolean? = null
    ) {
        viewModelScope.launch {
            val req = UpdateBranchRequestDto(
                name = name,
                code = code,
                address = address,
                phone = phone,
                locationType = locationType,
                latitude = latitude,
                longitude = longitude,
                geofenceRadiusMeters = geofenceRadiusMeters,
                isActive = isActive
            )
            val result = branchRepository.updateBranch(locationId, req)
            result.fold(
                onSuccess = {
                    loadBranches(actionMessage = "Location updated successfully")
                },
                onFailure = { error ->
                    _uiState.value = BranchUiState.Error(error.message ?: "Failed to update location")
                }
            )
        }
    }

    fun deleteBranch(locationId: String) {
        viewModelScope.launch {
            val result = branchRepository.deleteBranch(locationId)
            result.fold(
                onSuccess = {
                    loadBranches(actionMessage = "Location deleted successfully")
                },
                onFailure = { error ->
                    _uiState.value = BranchUiState.Error(error.message ?: "Failed to delete location")
                }
            )
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
