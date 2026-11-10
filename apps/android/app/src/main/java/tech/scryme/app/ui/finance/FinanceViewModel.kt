package tech.scryme.app.ui.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import tech.scryme.app.domain.model.ExpenseItem
import tech.scryme.app.domain.model.ExpenseSummary
import tech.scryme.app.domain.model.PettyCashFund
import tech.scryme.app.domain.model.PettyCashTransaction
import tech.scryme.app.domain.model.UtilityAccount
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.FinanceRepository
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import javax.inject.Inject

enum class FinanceTab(val title: String) {
    EXPENSES("Expenses"),
    PETTY_CASH("Petty Cash"),
    UTILITIES("Utilities")
}

enum class DateRangePreset(val label: String) {
    ALL("All Time"),
    THIS_MONTH("This Month"),
    LAST_30_DAYS("Last 30 Days")
}

data class FinanceUiState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val isAuthorized: Boolean = true,
    val selectedTab: FinanceTab = FinanceTab.EXPENSES,
    val selectedDatePreset: DateRangePreset = DateRangePreset.ALL,
    val statusFilter: String? = null,
    val searchQuery: String = "",
    val error: String? = null,
    val actionMessage: String? = null,

    // Expenses Tab
    val expenseSummary: ExpenseSummary? = null,
    val expenses: List<ExpenseItem> = emptyList(),
    val selectedExpenseForDetails: ExpenseItem? = null,

    // Petty Cash Tab
    val pettyCashFunds: List<PettyCashFund> = emptyList(),
    val selectedFundForDetails: PettyCashFund? = null,
    val selectedFundTransactions: List<PettyCashTransaction> = emptyList(),
    val isLoadingTransactions: Boolean = false,

    // Utilities Tab
    val utilityAccounts: List<UtilityAccount> = emptyList(),
    val selectedUtilityForDetails: UtilityAccount? = null
)

@HiltViewModel
class FinanceViewModel @Inject constructor(
    private val financeRepository: FinanceRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FinanceUiState())
    val uiState: StateFlow<FinanceUiState> = _uiState.asStateFlow()

    init {
        checkAuthorizationAndLoad()
    }

    fun checkAuthorizationAndLoad() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val sessionResult = authRepository.validateSession()
            val isAuth = sessionResult.getOrNull()?.let { meData ->
                val role = meData.member?.role ?: meData.memberships?.firstOrNull()?.role ?: "ADMIN"
                val upper = role.uppercase()
                upper == "ADMIN" || upper == "OWNER" || upper == "SUPERADMIN"
            } ?: true

            _uiState.update { it.copy(isAuthorized = isAuth) }

            if (isAuth) {
                loadAllData()
            } else {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Access Restricted: Finance analytics are only accessible to Admins and Owners."
                    )
                }
            }
        }
    }

    fun selectTab(tab: FinanceTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun selectDatePreset(preset: DateRangePreset) {
        _uiState.update { it.copy(selectedDatePreset = preset) }
        loadExpenses()
    }

    fun setStatusFilter(status: String?) {
        _uiState.update { it.copy(statusFilter = status) }
        loadExpenses()
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun refresh() {
        if (_uiState.value.isAuthorized) {
            _uiState.update { it.copy(isRefreshing = true, error = null) }
            loadAllData()
        }
    }

    fun clearActionMessage() {
        _uiState.update { it.copy(actionMessage = null) }
    }

    // Detail selection
    fun selectExpenseForDetails(expense: ExpenseItem?) {
        _uiState.update { it.copy(selectedExpenseForDetails = expense) }
    }

    fun selectFundForDetails(fund: PettyCashFund?) {
        _uiState.update {
            it.copy(
                selectedFundForDetails = fund,
                selectedFundTransactions = emptyList()
            )
        }
        if (fund != null) {
            loadFundTransactions(fund.id)
        }
    }

    fun selectUtilityForDetails(utility: UtilityAccount?) {
        _uiState.update { it.copy(selectedUtilityForDetails = utility) }
    }

    // Actions
    fun approveExpense(expenseId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val res = financeRepository.approveExpense(expenseId)
            res.fold(
                onSuccess = { updated ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            actionMessage = "Expense ${updated.expenseNumber} approved successfully.",
                            selectedExpenseForDetails = updated,
                            expenses = state.expenses.map { if (it.id == updated.id) updated else it }
                        )
                    }
                    loadExpenses()
                },
                onFailure = { err ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = err.message ?: "Failed to approve expense"
                        )
                    }
                }
            )
        }
    }

    fun rejectExpense(expenseId: String, reason: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val res = financeRepository.rejectExpense(expenseId, reason)
            res.fold(
                onSuccess = { updated ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            actionMessage = "Expense ${updated.expenseNumber} rejected.",
                            selectedExpenseForDetails = updated,
                            expenses = state.expenses.map { if (it.id == updated.id) updated else it }
                        )
                    }
                    loadExpenses()
                },
                onFailure = { err ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = err.message ?: "Failed to reject expense"
                        )
                    }
                }
            )
        }
    }

    fun topUpPettyCash(fundId: String, amount: Double, description: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val res = financeRepository.topUpPettyCashFund(fundId, amount, description)
            res.fold(
                onSuccess = { updatedFund ->
                    _uiState.update { state ->
                        state.copy(
                            isLoading = false,
                            actionMessage = "Petty cash fund '${updatedFund.name}' topped up.",
                            selectedFundForDetails = updatedFund,
                            pettyCashFunds = state.pettyCashFunds.map { if (it.id == updatedFund.id) updatedFund else it }
                        )
                    }
                    loadFundTransactions(fundId)
                },
                onFailure = { err ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = err.message ?: "Failed to top up petty cash fund"
                        )
                    }
                }
            )
        }
    }

    private fun loadAllData() {
        loadExpenses()
        loadPettyCash()
        loadUtilities()
    }

    private fun loadExpenses() {
        viewModelScope.launch {
            val (startDate, endDate) = calculateDateRange(_uiState.value.selectedDatePreset)

            val summaryRes = financeRepository.getExpenseSummary(startDate, endDate)
            summaryRes.onSuccess { summary ->
                _uiState.update { it.copy(expenseSummary = summary) }
            }

            val expensesRes = financeRepository.getExpenses(
                status = _uiState.value.statusFilter,
                startDate = startDate,
                endDate = endDate
            )
            expensesRes.fold(
                onSuccess = { list ->
                    _uiState.update {
                        it.copy(
                            expenses = list,
                            isLoading = false,
                            isRefreshing = false
                        )
                    }
                },
                onFailure = { err ->
                    _uiState.update {
                        it.copy(
                            error = err.message ?: "Failed to load expenses",
                            isLoading = false,
                            isRefreshing = false
                        )
                    }
                }
            )
        }
    }

    private fun loadPettyCash() {
        viewModelScope.launch {
            val res = financeRepository.getPettyCashFunds()
            res.fold(
                onSuccess = { funds ->
                    _uiState.update { it.copy(pettyCashFunds = funds) }
                },
                onFailure = { err ->
                    _uiState.update { it.copy(error = err.message ?: "Failed to load petty cash funds") }
                }
            )
        }
    }

    private fun loadFundTransactions(fundId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingTransactions = true) }
            val res = financeRepository.getPettyCashTransactions(fundId)
            res.fold(
                onSuccess = { txs ->
                    _uiState.update {
                        it.copy(
                            selectedFundTransactions = txs,
                            isLoadingTransactions = false
                        )
                    }
                },
                onFailure = { err ->
                    _uiState.update {
                        it.copy(
                            isLoadingTransactions = false,
                            error = err.message ?: "Failed to load fund transactions"
                        )
                    }
                }
            )
        }
    }

    private fun loadUtilities() {
        viewModelScope.launch {
            val res = financeRepository.getUtilityAccounts()
            res.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(utilityAccounts = list) }
                },
                onFailure = { err ->
                    _uiState.update { it.copy(error = err.message ?: "Failed to load utility accounts") }
                }
            )
        }
    }

    private fun calculateDateRange(preset: DateRangePreset): Pair<String?, String?> {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        val cal = Calendar.getInstance()

        return when (preset) {
            DateRangePreset.ALL -> Pair(null, null)
            DateRangePreset.THIS_MONTH -> {
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                val start = sdf.format(cal.time)

                val endCal = Calendar.getInstance()
                endCal.set(Calendar.DAY_OF_MONTH, endCal.getActualMaximum(Calendar.DAY_OF_MONTH))
                endCal.set(Calendar.HOUR_OF_DAY, 23)
                endCal.set(Calendar.MINUTE, 59)
                endCal.set(Calendar.SECOND, 59)
                val end = sdf.format(endCal.time)
                Pair(start, end)
            }
            DateRangePreset.LAST_30_DAYS -> {
                val end = sdf.format(cal.time)
                cal.add(Calendar.DAY_OF_YEAR, -30)
                val start = sdf.format(cal.time)
                Pair(start, end)
            }
        }
    }
}
