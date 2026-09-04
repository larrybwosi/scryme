package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.PresenceRepository

class PresenceViewModel(
    private val repository: PresenceRepository
) : ViewModel() {

    private val _presenceState = MutableStateFlow<UiState<List<MemberResponseDto>>>(UiState.Idle)
    val presenceState: StateFlow<UiState<List<MemberResponseDto>>> = _presenceState.asStateFlow()

    private val _branches = MutableStateFlow<List<LocationDto>>(emptyList())
    val branches: StateFlow<List<LocationDto>> = _branches.asStateFlow()

    private val _selectedBranchId = MutableStateFlow<String?>(null)
    val selectedBranchId: StateFlow<String?> = _selectedBranchId.asStateFlow()

    private val _branchAttendanceLogs = MutableStateFlow<UiState<List<AttendanceLogDto>>>(UiState.Idle)
    val branchAttendanceLogs: StateFlow<UiState<List<AttendanceLogDto>>> = _branchAttendanceLogs.asStateFlow()

    private val _pettyCashTransactions = MutableStateFlow<UiState<List<PettyCashTransactionDto>>>(UiState.Idle)
    val pettyCashTransactions: StateFlow<UiState<List<PettyCashTransactionDto>>> = _pettyCashTransactions.asStateFlow()

    private val _branchSales = MutableStateFlow<Double>(0.0)
    val branchSales: StateFlow<Double> = _branchSales.asStateFlow()

    private val _memberSalesList = MutableStateFlow<List<MemberSalesDto>>(emptyList())
    val memberSalesList: StateFlow<List<MemberSalesDto>> = _memberSalesList.asStateFlow()

    private val _organizationTransactions = MutableStateFlow<UiState<List<TransactionDto>>>(UiState.Idle)
    val organizationTransactions: StateFlow<UiState<List<TransactionDto>>> = _organizationTransactions.asStateFlow()

    private val _organizationDetails = MutableStateFlow<UiState<OrganizationDetailsDto>>(UiState.Idle)
    val organizationDetails: StateFlow<UiState<OrganizationDetailsDto>> = _organizationDetails.asStateFlow()

    init {
        viewModelScope.launch {
            repository.monitorActivePresence().collect { activeMembers ->
                _presenceState.value = UiState.Success(activeMembers)
            }
        }
    }

    fun fetchOrganizationDetails() {
        viewModelScope.launch {
            _organizationDetails.value = UiState.Loading
            repository.getOrganizationDetails()
                .onSuccess { details ->
                    _organizationDetails.value = UiState.Success(details)
                }
                .onFailure { error ->
                    _organizationDetails.value = UiState.Error(error.message ?: "Failed to load organization details")
                }
        }
    }

    fun fetchBranches() {
        viewModelScope.launch {
            repository.getLocations()
                .onSuccess { locations ->
                    _branches.value = locations
                }
        }
    }

    fun fetchOrganizationTransactions(locationId: String? = null) {
        _organizationTransactions.value = UiState.Loading
        viewModelScope.launch {
            repository.getTransactions(locationId, null, null)
                .onSuccess { txns ->
                    _organizationTransactions.value = UiState.Success(txns)
                }
                .onFailure { error ->
                    _organizationTransactions.value = UiState.Error(error.message ?: "Failed to fetch transactions")
                }
        }
    }

    fun addBranch(name: String, code: String, type: String) {
        val newBranch = LocationDto(
            id = "loc_${_branches.value.size + 1}",
            name = name,
            organizationId = (_organizationDetails.value as? UiState.Success)?.data?.id ?: "org_1",
            isActive = true
        )
        _branches.value = _branches.value + newBranch
    }

    fun toggleBranchStatus(locationId: String) {
        _branches.value = _branches.value.map {
            if (it.id == locationId) {
                it.copy(isActive = !it.isActive)
            } else {
                it
            }
        }
    }

    fun fetchCheckedInMembers() {
        viewModelScope.launch {
            _presenceState.value = UiState.Loading
            repository.getMembers(isCheckedIn = true, search = null)
                .onSuccess { members ->
                    _presenceState.value = UiState.Success(members)
                }
                .onFailure { error ->
                    _presenceState.value = UiState.Error(error.message ?: "Failed to fetch members")
                }
        }
    }

    fun forceCheckoutMember(memberId: String, notes: String? = null) {
        viewModelScope.launch {
            repository.adminCheckOut(memberId, null, notes)
                .onSuccess {
                    fetchCheckedInMembers()
                }
                .onFailure {
                    fetchCheckedInMembers()
                }
        }
    }

    fun selectBranchForDetail(locationId: String) {
        _selectedBranchId.value = locationId
        _branchAttendanceLogs.value = UiState.Loading
        _pettyCashTransactions.value = UiState.Loading

        viewModelScope.launch {
            repository.getAttendanceLogs(1, 10, null, locationId)
                .onSuccess { response ->
                    _branchAttendanceLogs.value = UiState.Success(response.items)
                }
                .onFailure { error ->
                    _branchAttendanceLogs.value = UiState.Error(error.message ?: "Failed to load logs")
                }

            repository.getPettyCashTransactions()
                .onSuccess { txns ->
                    _pettyCashTransactions.value = UiState.Success(txns)
                }
                .onFailure { error ->
                    _pettyCashTransactions.value = UiState.Error(error.message ?: "Failed to load petty cash")
                }

            repository.getTransactions(locationId, null, null)
                .onSuccess { txns ->
                    val totalSales = txns.sumOf { it.effectiveAmount() }
                    _branchSales.value = totalSales

                    val groupedByMember = txns.groupBy { it.memberId ?: "unknown" }
                    val memberSales = groupedByMember.map { (memberId, memberTxns) ->
                        MemberSalesDto(
                            memberId = memberId,
                            memberName = memberTxns.firstOrNull()?.memberId ?: "Staff Member",
                            salesCount = memberTxns.size,
                            totalAmount = memberTxns.sumOf { it.effectiveAmount() }
                        )
                    }
                    _memberSalesList.value = memberSales
                }
        }
    }
}
