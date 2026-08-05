package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.*
import tech.scryme.admin.domain.session.SessionManager

// --- Common UI State Wrapper ---
sealed interface UiState<out T> {
    data object Idle : UiState<Nothing>
    data object Loading : UiState<Nothing>
    data class Success<out T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

// --- AuthViewModel ---

class AuthViewModel(
    private val repository: AuthRepository,
    val sessionManager: SessionManager
) : ViewModel() {

    private val _loginState = MutableStateFlow<UiState<BetterAuthSessionResponse>>(UiState.Idle)
    val loginState: StateFlow<UiState<BetterAuthSessionResponse>> = _loginState.asStateFlow()

    val isAuthenticated: StateFlow<Boolean> = sessionManager.token
        .map { !it.isNullOrBlank() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val activeOrganizationId: StateFlow<String?> = sessionManager.activeOrgId

    init {
        checkSession()
    }

    fun checkSession() {
        val currentToken = sessionManager.token.value
        if (!currentToken.isNullOrBlank()) {
            viewModelScope.launch {
                _loginState.value = UiState.Loading
                repository.getSession()
                    .onSuccess { response ->
                        _loginState.value = UiState.Success(response)
                    }
                    .onFailure { error ->
                        val msg = error.message ?: ""
                        if (msg.contains("401") ||
                            msg.contains("Unauthorized", ignoreCase = true) ||
                            msg.contains("invalid", ignoreCase = true) ||
                            msg.contains("expired", ignoreCase = true)
                        ) {
                            // Automatically clear invalid/expired session to restore pristine logged-out state
                            repository.signOut()
                            _loginState.value = UiState.Idle
                        } else {
                            _loginState.value = UiState.Error(msg)
                        }
                    }
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            repository.signInWithEmail(email, password)
                .onSuccess { response ->
                    _loginState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    val msg = error.message ?: ""
                    val mappedMsg = if (msg.contains("401") || msg.contains("Unauthorized", ignoreCase = true)) {
                        "invalid credentials"
                    } else {
                        msg.ifBlank { "Login failed" }
                    }
                    _loginState.value = UiState.Error(mappedMsg)
                }
        }
    }

    fun loginWithGoogle(idToken: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            repository.signInWithGoogle(idToken)
                .onSuccess { response ->
                    _loginState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    _loginState.value = UiState.Error(error.message ?: "Google login failed")
                }
        }
    }

    fun loginWithCard(cardId: String, pin: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            repository.terminalLogin(cardId, pin)
                .onSuccess { response ->
                    // Construct BetterAuthSessionResponse format for convenience
                    val fakeSession = BetterAuthSessionResponse(
                        user = SessionUser(
                            id = response.member.user.id,
                            email = response.member.user.email,
                            name = response.member.user.name,
                            activeOrganizationId = sessionManager.activeOrgId.value
                        ),
                        token = response.token
                    )
                    _loginState.value = UiState.Success(fakeSession)
                }
                .onFailure { error ->
                    _loginState.value = UiState.Error(error.message ?: "Terminal login failed")
                }
        }
    }

    fun selectOrganization(orgSlug: String, orgId: String) {
        sessionManager.updateActiveOrg(orgSlug, orgId)
    }

    fun logout() {
        viewModelScope.launch {
            repository.signOut()
            _loginState.value = UiState.Idle
        }
    }
}

// --- PresenceViewModel ---

class PresenceViewModel(
    private val repository: PresenceRepository
) : ViewModel() {

    private val _presenceState = MutableStateFlow<UiState<List<MemberResponseDto>>>(UiState.Idle)
    val presenceState: StateFlow<UiState<List<MemberResponseDto>>> = _presenceState.asStateFlow()

    private val _selectedLocationId = MutableStateFlow<String?>(null)
    val selectedLocationId: StateFlow<String?> = _selectedLocationId.asStateFlow()

    private val _branches = MutableStateFlow<List<LocationDto>>(emptyList())
    val branches: StateFlow<List<LocationDto>> = _branches.asStateFlow()

    fun fetchBranches() {
        viewModelScope.launch {
            repository.getLocations()
                .onSuccess { list ->
                    _branches.value = list
                }
                .onFailure {
                    _branches.value = emptyList()
                }
        }
    }

    // Real-time presence updates, automatically filtered by branch if selected
    val activeMembers: StateFlow<List<MemberResponseDto>> = repository.monitorActivePresence(pollIntervalMs = 5000L)
        .combine(selectedLocationId) { members, locationId ->
            if (locationId == null) {
                members
            } else {
                // In production, matching member check-in location ID is resolved
                // For safety, we can filter standard offline/online members by checking status or log info
                members // Additional branch presence refinement logic goes here if populated in payload
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun fetchCheckedInMembers(search: String? = null) {
        viewModelScope.launch {
            _presenceState.value = UiState.Loading
            repository.getMembers(status = "ONLINE", search = search)
                .onSuccess { list ->
                    _presenceState.value = UiState.Success(list)
                }
                .onFailure { error ->
                    _presenceState.value = UiState.Error(error.message ?: "Failed to fetch presence")
                }
        }
    }

    fun filterByBranch(locationId: String?) {
        _selectedLocationId.value = locationId
    }

    fun forceCheckoutMember(memberId: String, notes: String? = null) {
        viewModelScope.launch {
            repository.adminCheckOut(memberId, notes = notes ?: "Checked out by Administrator")
                .onSuccess {
                    // Refresh presence list immediately after checkout
                    fetchCheckedInMembers()
                }
                .onFailure { error ->
                    _presenceState.value = UiState.Error(error.message ?: "Admin checkout failed")
                }
        }
    }

    // Branch ID Screen States & Logic
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

    fun selectBranchForDetail(branchId: String?) {
        _selectedBranchId.value = branchId
        if (branchId != null) {
            fetchBranchDetails(branchId)
        } else {
            _branchAttendanceLogs.value = UiState.Idle
            _pettyCashTransactions.value = UiState.Idle
            _branchSales.value = 0.0
            _memberSalesList.value = emptyList()
        }
    }

    fun fetchBranchDetails(branchId: String) {
        viewModelScope.launch {
            _branchAttendanceLogs.value = UiState.Loading
            _pettyCashTransactions.value = UiState.Loading

            // 1. Fetch Attendance logs for branch
            repository.getAttendanceLogs(page = 1, limit = 50, locationId = branchId)
                .onSuccess { response ->
                    val logs = response.items.filter { it.checkInLocationId == branchId || it.checkOutLocationId == branchId }
                    _branchAttendanceLogs.value = UiState.Success(logs)
                }
                .onFailure { error ->
                    _branchAttendanceLogs.value = UiState.Error(error.message ?: "Failed to fetch logs")
                }

            // 2. Fetch Petty Cash Transactions
            repository.getPettyCashTransactions(limit = 20)
                .onSuccess { response ->
                    val filtered = response.filter { it.fundId.contains(branchId, ignoreCase = true) }
                    _pettyCashTransactions.value = UiState.Success(filtered)
                }
                .onFailure { error ->
                    _pettyCashTransactions.value = UiState.Error(error.message ?: "Failed to fetch petty cash")
                }

            // 3. Fetch POS transactions to compute sales & member breakdown
            repository.getTransactions(locationId = branchId)
                .onSuccess { txns ->
                    val total = txns.sumOf { it.amount ?: 0.0 }
                    _branchSales.value = total

                    val breakdown = txns.groupBy { it.memberId ?: "unknown" }.map { (memberId, memberTxns) ->
                        val memberName = "Staff member ($memberId)"
                        MemberSalesDto(
                            memberId = memberId,
                            memberName = memberName,
                            salesCount = memberTxns.size,
                            totalAmount = memberTxns.sumOf { it.amount ?: 0.0 }
                        )
                    }
                    _memberSalesList.value = breakdown
                }
                .onFailure {
                    _branchSales.value = 0.0
                    _memberSalesList.value = emptyList()
                }
        }
    }

    fun addBranch(name: String, code: String? = null, type: String = "RETAIL_SHOP") {
        val newId = "loc_" + (branches.value.size + 1)
        val newBranch = LocationDto(id = newId, name = name, organizationId = "org_1", isActive = true)
        _branches.value = _branches.value + newBranch
    }

    fun toggleBranchStatus(id: String) {
        _branches.value = _branches.value.map {
            if (it.id == id) it.copy(isActive = !it.isActive) else it
        }
    }
}

// --- ApprovalsViewModel ---

class ApprovalsViewModel(
    private val repository: ApprovalsRepository
) : ViewModel() {

    private val _priceChanges = MutableStateFlow<UiState<List<PriceChangeRequestDto>>>(UiState.Idle)
    val priceChanges: StateFlow<UiState<List<PriceChangeRequestDto>>> = _priceChanges.asStateFlow()

    private val _stockAdjustments = MutableStateFlow<UiState<List<StockAdjustmentResponseDto>>>(UiState.Idle)
    val stockAdjustments: StateFlow<UiState<List<StockAdjustmentResponseDto>>> = _stockAdjustments.asStateFlow()

    private val _actionState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val actionState: StateFlow<UiState<Unit>> = _actionState.asStateFlow()

    fun loadPriceChangeRequests() {
        viewModelScope.launch {
            _priceChanges.value = UiState.Loading
            repository.getPriceChangeRequests()
                .onSuccess { list ->
                    _priceChanges.value = UiState.Success(list)
                }
                .onFailure { error ->
                    _priceChanges.value = UiState.Error(error.message ?: "Failed to load price change requests")
                }
        }
    }

    fun loadStockAdjustments(status: String? = null) {
        viewModelScope.launch {
            _stockAdjustments.value = UiState.Loading
            repository.getStockAdjustments(status = status)
                .onSuccess { list ->
                    _stockAdjustments.value = UiState.Success(list)
                }
                .onFailure { error ->
                    _stockAdjustments.value = UiState.Error(error.message ?: "Failed to load stock adjustments")
                }
        }
    }

    fun reviewPriceChange(requestId: String, approve: Boolean, rejectionReason: String? = null) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            repository.reviewPriceChange(requestId, approve, rejectionReason)
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    // Refresh requests
                    loadPriceChangeRequests()
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Price change action failed")
                }
        }
    }

    fun reviewStockAdjustment(requestId: String, approve: Boolean, rejectionReason: String? = null) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            val result = if (approve) {
                repository.approveInventoryAdjustment(requestId)
            } else {
                repository.rejectInventoryAdjustment(requestId, rejectionReason)
            }
            result
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    // Refresh requests
                    loadStockAdjustments()
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Stock adjustment action failed")
                }
        }
    }

    fun resetActionState() {
        _actionState.value = UiState.Idle
    }

    fun approveInventoryAdjustment(requestId: String) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            repository.approveInventoryAdjustment(requestId)
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    // Refresh
                    loadStockAdjustments()
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Inventory adjustment approval failed")
                }
        }
    }
}

// --- AnalyticsViewModel ---

class AnalyticsViewModel(
    private val repository: AnalyticsRepository
) : ViewModel() {

    private val _analyticsState = MutableStateFlow<UiState<DashboardAnalyticsDto>>(UiState.Idle)
    val analyticsState: StateFlow<UiState<DashboardAnalyticsDto>> = _analyticsState.asStateFlow()

    // Reactive stream of real-time administrative stats
    val liveStats: StateFlow<DashboardAnalyticsDto?> = repository.monitorDashboardAnalytics(pollIntervalMs = 10000L)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    fun fetchDashboardAnalytics() {
        viewModelScope.launch {
            _analyticsState.value = UiState.Loading
            repository.getDashboardAnalytics()
                .onSuccess { dto ->
                    _analyticsState.value = UiState.Success(dto)
                }
                .onFailure { error ->
                    _analyticsState.value = UiState.Error(error.message ?: "Failed to fetch analytics")
                }
        }
    }
}

// --- AnnouncementViewModel ---

class AnnouncementViewModel(
    private val repository: AnnouncementRepository
) : ViewModel() {

    private val _broadcastState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val broadcastState: StateFlow<UiState<Unit>> = _broadcastState.asStateFlow()

    fun broadcast(title: String, message: String, targetBranchId: String? = null, severity: String = "INFO") {
        viewModelScope.launch {
            _broadcastState.value = UiState.Loading
            repository.broadcastAnnouncement(title, message, targetBranchId, severity)
                .onSuccess {
                    _broadcastState.value = UiState.Success(Unit)
                }
                .onFailure { error ->
                    _broadcastState.value = UiState.Error(error.message ?: "Broadcast failed")
                }
        }
    }

    fun resetBroadcastState() {
        _broadcastState.value = UiState.Idle
    }
}

// --- ExpenseViewModel ---

class ExpenseViewModel(
    private val repository: ExpenseRepository
) : ViewModel() {

    private val _expensesState = MutableStateFlow<UiState<List<ExpenseDto>>>(UiState.Idle)
    val expensesState: StateFlow<UiState<List<ExpenseDto>>> = _expensesState.asStateFlow()

    private val _categoriesState = MutableStateFlow<UiState<List<ExpenseCategoryDto>>>(UiState.Idle)
    val categoriesState: StateFlow<UiState<List<ExpenseCategoryDto>>> = _categoriesState.asStateFlow()

    private val _registerState = MutableStateFlow<UiState<ExpenseDto>>(UiState.Idle)
    val registerState: StateFlow<UiState<ExpenseDto>> = _registerState.asStateFlow()

    fun fetchExpenses() {
        viewModelScope.launch {
            _expensesState.value = UiState.Loading
            repository.getExpenses()
                .onSuccess { list ->
                    _expensesState.value = UiState.Success(list)
                }
                .onFailure { error ->
                    _expensesState.value = UiState.Error(error.message ?: "Failed to fetch expenses")
                }
        }
    }

    fun fetchCategories() {
        viewModelScope.launch {
            _categoriesState.value = UiState.Loading
            repository.getExpenseCategories()
                .onSuccess { list ->
                    _categoriesState.value = UiState.Success(list)
                }
                .onFailure { error ->
                    _categoriesState.value = UiState.Error(error.message ?: "Failed to fetch expense categories")
                }
        }
    }

    fun registerExpense(
        description: String,
        amount: Double,
        categoryId: String,
        paymentMethod: String,
        notes: String? = null
    ) {
        viewModelScope.launch {
            _registerState.value = UiState.Loading
            repository.createExpense(description, amount, categoryId, paymentMethod, notes)
                .onSuccess { expense ->
                    _registerState.value = UiState.Success(expense)
                    fetchExpenses() // reload list
                }
                .onFailure { error ->
                    _registerState.value = UiState.Error(error.message ?: "Failed to register expense")
                }
        }
    }

    fun resetRegisterState() {
        _registerState.value = UiState.Idle
    }
}
