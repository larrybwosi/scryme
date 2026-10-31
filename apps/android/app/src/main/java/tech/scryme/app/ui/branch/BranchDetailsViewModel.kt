package tech.scryme.app.ui.branch

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.dto.UpdateBranchRequestDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchActivityItem
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.model.BranchSaleItem
import tech.scryme.app.domain.model.BranchStockMovementItem
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.util.LocationHelper
import javax.inject.Inject

enum class BranchDetailsTab {
    OVERVIEW,
    ACTIVITY,
    SALES,
    STOCK_MOVEMENTS
}

sealed interface BranchDetailsUiState {
    object Loading : BranchDetailsUiState
    data class Success(
        val branch: BranchLocation,
        val isActive: Boolean,
        val isAdmin: Boolean,
        val selectedTab: BranchDetailsTab = BranchDetailsTab.OVERVIEW,
        val activityLogs: List<BranchActivityItem> = emptyList(),
        val isActivityLoading: Boolean = false,
        val sales: List<BranchSaleItem> = emptyList(),
        val isSalesLoading: Boolean = false,
        val stockMovements: List<BranchStockMovementItem> = emptyList(),
        val isStockLoading: Boolean = false,
        val actionSuccessMessage: String? = null
    ) : BranchDetailsUiState
    data class Error(val message: String) : BranchDetailsUiState
}

@HiltViewModel
class BranchDetailsViewModel @Inject constructor(
    private val branchRepository: BranchRepository,
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val branchId: String = checkNotNull(savedStateHandle["branchId"])

    private val _uiState = MutableStateFlow<BranchDetailsUiState>(BranchDetailsUiState.Loading)
    val uiState: StateFlow<BranchDetailsUiState> = _uiState.asStateFlow()

    fun loadBranchDetails(actionMessage: String? = null) {
        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = BranchDetailsUiState.Error("Missing organization context")
                return@launch
            }

            val sessionResult = authRepository.validateSession()
            val isAdmin = sessionResult.getOrNull()?.let { meData ->
                val role = meData.member?.role ?: meData.memberships?.firstOrNull()?.role ?: "MEMBER"
                val upper = role.uppercase()
                upper == "ADMIN" || upper == "OWNER" || upper == "SUPERADMIN"
            } ?: false

            val currentTab = (_uiState.value as? BranchDetailsUiState.Success)?.selectedTab ?: BranchDetailsTab.OVERVIEW

            val result = branchRepository.getBranchDetails(orgSlug, branchId)
            val activeLoc = sessionManager.getLocationId()

            result.fold(
                onSuccess = { branch ->
                    _uiState.value = BranchDetailsUiState.Success(
                        branch = branch,
                        isActive = branch.id == activeLoc,
                        isAdmin = isAdmin,
                        selectedTab = currentTab,
                        actionSuccessMessage = actionMessage
                    )
                    // Trigger tab load
                    onTabSelected(currentTab)
                },
                onFailure = { error ->
                    _uiState.value = BranchDetailsUiState.Error(error.message ?: "Failed to load branch details")
                }
            )
        }
    }

    fun onTabSelected(tab: BranchDetailsTab) {
        val currentState = _uiState.value as? BranchDetailsUiState.Success ?: return
        _uiState.value = currentState.copy(selectedTab = tab, actionSuccessMessage = null)

        when (tab) {
            BranchDetailsTab.OVERVIEW -> {
                // Already loaded
            }
            BranchDetailsTab.ACTIVITY -> {
                if (currentState.activityLogs.isEmpty()) {
                    loadActivity()
                }
            }
            BranchDetailsTab.SALES -> {
                if (currentState.sales.isEmpty()) {
                    loadSales()
                }
            }
            BranchDetailsTab.STOCK_MOVEMENTS -> {
                if (currentState.stockMovements.isEmpty()) {
                    loadStockMovements()
                }
            }
        }
    }

    fun loadActivity() {
        val current = _uiState.value as? BranchDetailsUiState.Success ?: return
        _uiState.value = current.copy(isActivityLoading = true)

        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = branchRepository.getBranchActivity(orgSlug, branchId)
            result.fold(
                onSuccess = { logs ->
                    val state = _uiState.value as? BranchDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(activityLogs = logs, isActivityLoading = false)
                },
                onFailure = {
                    val state = _uiState.value as? BranchDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(isActivityLoading = false)
                }
            )
        }
    }

    fun loadSales() {
        val current = _uiState.value as? BranchDetailsUiState.Success ?: return
        _uiState.value = current.copy(isSalesLoading = true)

        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = branchRepository.getBranchSales(orgSlug, branchId)
            result.fold(
                onSuccess = { sales ->
                    val state = _uiState.value as? BranchDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(sales = sales, isSalesLoading = false)
                },
                onFailure = {
                    val state = _uiState.value as? BranchDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(isSalesLoading = false)
                }
            )
        }
    }

    fun loadStockMovements() {
        val current = _uiState.value as? BranchDetailsUiState.Success ?: return
        _uiState.value = current.copy(isStockLoading = true)

        viewModelScope.launch {
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = branchRepository.getBranchStockMovements(orgSlug, branchId)
            result.fold(
                onSuccess = { movements ->
                    val state = _uiState.value as? BranchDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(stockMovements = movements, isStockLoading = false)
                },
                onFailure = {
                    val state = _uiState.value as? BranchDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(isStockLoading = false)
                }
            )
        }
    }

    fun switchActiveBranch() {
        viewModelScope.launch {
            branchRepository.switchActiveBranch(branchId)
            loadBranchDetails(actionMessage = "Active branch switched to this location")
        }
    }

    fun updateBranch(
        name: String? = null,
        code: String? = null,
        address: String? = null,
        phone: String? = null,
        locationType: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        geofenceRadiusMeters: Double? = null
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
                geofenceRadiusMeters = geofenceRadiusMeters
            )
            val result = branchRepository.updateBranch(branchId, req)
            result.fold(
                onSuccess = {
                    loadBranchDetails(actionMessage = "Branch updated successfully")
                },
                onFailure = { error ->
                    _uiState.value = BranchDetailsUiState.Error(error.message ?: "Failed to update branch")
                }
            )
        }
    }

    fun pinCurrentLocation(context: Context) {
        viewModelScope.launch {
            try {
                val loc = LocationHelper.getCurrentLocation(context)
                if (loc != null) {
                    val orgSlug = sessionManager.getOrgSlug() ?: return@launch
                    val result = branchRepository.updateBranchCoordinates(
                        orgSlug = orgSlug,
                        locationId = branchId,
                        latitude = loc.latitude,
                        longitude = loc.longitude
                    )
                    result.fold(
                        onSuccess = {
                            loadBranchDetails(actionMessage = "GPS Coordinates updated to current location")
                        },
                        onFailure = { err ->
                            _uiState.value = BranchDetailsUiState.Error(err.message ?: "Failed to update GPS coordinates")
                        }
                    )
                } else {
                    _uiState.value = BranchDetailsUiState.Error("Unable to acquire current GPS coordinates. Please ensure location services are enabled.")
                }
            } catch (e: Exception) {
                _uiState.value = BranchDetailsUiState.Error("Error acquiring location: ${e.message}")
            }
        }
    }
}
