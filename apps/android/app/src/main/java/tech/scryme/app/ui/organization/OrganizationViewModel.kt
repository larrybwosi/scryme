package tech.scryme.app.ui.organization

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import tech.scryme.app.analytics.OpenPanelTracker
import tech.scryme.app.analytics.models.OpenPanelEvents
import tech.scryme.app.data.dto.MembershipDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import javax.inject.Inject

data class OrganizationUiState(
    val orgId: String = "",
    val orgName: String = "",
    val orgSlug: String = "",
    val orgLogo: String? = null,
    val orgCurrency: String = "USD",
    val orgCurrencySymbol: String = "$",
    val locationId: String = "",
    val locations: List<BranchLocation> = emptyList(),
    val memberships: List<MembershipDto> = emptyList(),
    val isSwitchingOrg: Boolean = false,
    val showQrScanner: Boolean = false,
    val isPairingPos: Boolean = false,
    val posPairingMessage: String? = null,
    val actionSuccessMessage: String? = null,
    val errorMessage: String? = null
)

private data class OrgCoreInfo(
    val slug: String,
    val name: String,
    val logo: String?
)

private data class OrgLocaleInfo(
    val currency: String,
    val currencySymbol: String,
    val locationId: String
)

@HiltViewModel
class OrganizationViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val authRepository: AuthRepository,
    private val branchRepository: BranchRepository,
    private val openPanelTracker: OpenPanelTracker
) : ViewModel() {

    private val _locations = MutableStateFlow<List<BranchLocation>>(emptyList())
    private val _memberships = MutableStateFlow<List<MembershipDto>>(emptyList())
    private val _isSwitchingOrg = MutableStateFlow(false)
    private val _showQrScanner = MutableStateFlow(false)
    private val _isPairingPos = MutableStateFlow(false)
    private val _posPairingMessage = MutableStateFlow<String?>(null)
    private val _actionSuccessMessage = MutableStateFlow<String?>(null)
    private val _errorMessage = MutableStateFlow<String?>(null)

    private val orgCoreFlow = combine(
        sessionManager.orgSlugFlow,
        sessionManager.orgNameFlow,
        sessionManager.orgLogoFlow
    ) { slug, name, logo ->
        OrgCoreInfo(
            slug = slug ?: "default",
            name = name ?: slug ?: "Organization",
            logo = logo
        )
    }

    private val orgLocaleFlow = combine(
        sessionManager.orgCurrencyFlow,
        sessionManager.orgCurrencySymbolFlow,
        sessionManager.locationIdFlow
    ) { curr, symbol, locId ->
        OrgLocaleInfo(
            currency = curr ?: "USD",
            currencySymbol = symbol ?: "$",
            locationId = locId ?: ""
        )
    }

    private val actionsFlow1 = combine(
        _locations,
        _memberships,
        _isSwitchingOrg,
        _showQrScanner
    ) { locs, mems, switching, scanner ->
        locs to (mems to (switching to scanner))
    }

    private val actionsFlow2 = combine(
        _isPairingPos,
        _posPairingMessage,
        _actionSuccessMessage,
        _errorMessage
    ) { pairing, pairMsg, successMsg, errMsg ->
        pairing to (pairMsg to (successMsg to errMsg))
    }

    val uiState: StateFlow<OrganizationUiState> = combine(
        orgCoreFlow,
        orgLocaleFlow,
        actionsFlow1,
        actionsFlow2
    ) { core, locale, a1, a2 ->
        val locs = a1.first
        val mems = a1.second.first
        val switching = a1.second.second.first
        val scanner = a1.second.second.second

        val pairing = a2.first
        val pairMsg = a2.second.first
        val successMsg = a2.second.second.first
        val errMsg = a2.second.second.second

        OrganizationUiState(
            orgId = core.slug,
            orgName = core.name,
            orgSlug = core.slug,
            orgLogo = core.logo,
            orgCurrency = locale.currency,
            orgCurrencySymbol = locale.currencySymbol,
            locationId = locale.locationId,
            locations = locs,
            memberships = mems,
            isSwitchingOrg = switching,
            showQrScanner = scanner,
            isPairingPos = pairing,
            posPairingMessage = pairMsg,
            actionSuccessMessage = successMsg,
            errorMessage = errMsg
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = OrganizationUiState()
    )

    init {
        loadOrganizationData()
    }

    fun loadOrganizationData() {
        viewModelScope.launch {
            try {
                val orgSlug = sessionManager.getOrgSlug()
                val sessionRes = authRepository.validateSession()
                sessionRes.fold(
                    onSuccess = { meData ->
                        _memberships.value = meData.memberships ?: emptyList()
                        val effectiveSlug = orgSlug ?: meData.activeOrganization?.slug ?: "default"
                        loadBranchLocations(effectiveSlug)
                    },
                    onFailure = {
                        if (!orgSlug.isNullOrEmpty()) {
                            loadBranchLocations(orgSlug)
                        }
                    }
                )
            } catch (e: Exception) {
                _errorMessage.value = "Failed to load organization context: ${e.message}"
            }
        }
    }

    private suspend fun loadBranchLocations(orgSlug: String) {
        branchRepository.getBranchLocations(orgSlug).fold(
            onSuccess = { branchList ->
                _locations.value = branchList
            },
            onFailure = {
                // Keep existing locations if fail
            }
        )
    }

    fun switchOrganization(organizationId: String) {
        viewModelScope.launch {
            _isSwitchingOrg.value = true
            _errorMessage.value = null
            _actionSuccessMessage.value = null
            val result = authRepository.switchOrganization(organizationId)
            _isSwitchingOrg.value = false
            result.fold(
                onSuccess = { meData ->
                    _actionSuccessMessage.value = "Switched to ${meData.activeOrganization?.name ?: organizationId}"
                    loadOrganizationData()
                },
                onFailure = { err ->
                    _errorMessage.value = err.message ?: "Failed to switch organization"
                }
            )
        }
    }

    fun setActiveLocation(locationId: String) {
        viewModelScope.launch {
            sessionManager.updateLocationId(locationId)
            _actionSuccessMessage.value = "Active branch updated"
        }
    }

    fun setShowQrScanner(show: Boolean) {
        _showQrScanner.value = show
    }

    fun pairPosDevice(qrOrCodeContent: String, locationId: String? = null) {
        viewModelScope.launch {
            _isPairingPos.value = true
            _posPairingMessage.value = "Authenticating POS Device..."
            openPanelTracker.track(
                OpenPanelEvents.POS_PAIRING_ATTEMPT,
                mapOf("location_id" to locationId)
            )
            val effectiveLocId = locationId ?: sessionManager.getLocationId()
            val result = authRepository.pairPosDevice(qrOrCodeContent, effectiveLocId)
            _isPairingPos.value = false
            result.fold(
                onSuccess = { msg ->
                    openPanelTracker.track(
                        OpenPanelEvents.POS_PAIRING_SUCCESS,
                        mapOf("location_id" to effectiveLocId)
                    )
                    _posPairingMessage.value = msg
                    _actionSuccessMessage.value = "POS Terminal paired successfully!"
                },
                onFailure = { err ->
                    val errorMsg = err.message ?: "Failed to pair POS terminal"
                    openPanelTracker.track(
                        OpenPanelEvents.POS_PAIRING_FAILED,
                        mapOf("location_id" to effectiveLocId, "error" to errorMsg)
                    )
                    _posPairingMessage.value = errorMsg
                    _errorMessage.value = errorMsg
                }
            )
        }
    }

    fun clearPairingMessage() {
        _posPairingMessage.value = null
    }

    fun clearMessages() {
        _actionSuccessMessage.value = null
        _errorMessage.value = null
    }
}
