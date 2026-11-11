package tech.scryme.app.ui.sales

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.SalesRepository
import tech.scryme.app.ui.finance.DateRangePreset
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import javax.inject.Inject

data class SalesUiState(
    val isLoading: Boolean = false,
    val analytics: SalesAnalytics? = null,
    val orders: List<OrderItem> = emptyList(),
    val searchQuery: String = "",
    val error: String? = null,
    val selectedTab: SalesTab = SalesTab.ANALYTICS,
    val selectedDatePreset: DateRangePreset = DateRangePreset.THIS_MONTH,
    val customStartDate: String? = null,
    val customEndDate: String? = null,
    val isAuthorized: Boolean = true,
    val selectedOrderForDetails: OrderItem? = null,
    val isLoadingOrderDetails: Boolean = false
)

enum class SalesTab(val title: String) {
    ANALYTICS("Analytics"),
    ORDERS("Orders")
}

@HiltViewModel
class SalesViewModel @Inject constructor(
    private val salesRepository: SalesRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SalesUiState())
    val uiState: StateFlow<SalesUiState> = _uiState.asStateFlow()

    init {
        checkUserAuthorizationAndLoad()
    }

    private fun checkUserAuthorizationAndLoad() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val sessionResult = authRepository.validateSession()
            val isAuth = sessionResult.getOrNull()?.let { meData ->
                val role = meData.member?.role ?: meData.memberships?.firstOrNull()?.role ?: "ADMIN"
                val upperRole = role.uppercase()
                upperRole == "ADMIN" || upperRole == "OWNER"
            } ?: true

            _uiState.update { it.copy(isAuthorized = isAuth) }

            if (isAuth) {
                loadAllSalesData()
            } else {
                _uiState.update { it.copy(isLoading = false, error = "Access Restricted: Admins & Owners only.") }
            }
        }
    }

    fun selectTab(tab: SalesTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun selectDatePreset(preset: DateRangePreset) {
        _uiState.update { it.copy(selectedDatePreset = preset) }
        loadAllSalesData()
    }

    fun setCustomDateRange(startDate: String?, endDate: String?) {
        _uiState.update {
            it.copy(
                selectedDatePreset = DateRangePreset.CUSTOM,
                customStartDate = startDate,
                customEndDate = endDate
            )
        }
        loadAllSalesData()
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadOrders(query)
    }

    fun selectOrderForDetails(order: OrderItem?) {
        if (order == null) {
            _uiState.update { it.copy(selectedOrderForDetails = null, isLoadingOrderDetails = false) }
            return
        }

        // Immediately show the selected order in the bottom drawer
        _uiState.update { it.copy(selectedOrderForDetails = order, isLoadingOrderDetails = true) }

        // Fetch full order details including line items, prices, and breakdown
        viewModelScope.launch {
            val result = salesRepository.getOrderDetails(order.id)
            result.onSuccess { detailedOrder ->
                _uiState.update { state ->
                    if (state.selectedOrderForDetails?.id == order.id) {
                        state.copy(selectedOrderForDetails = detailedOrder, isLoadingOrderDetails = false)
                    } else {
                        state
                    }
                }
            }.onFailure {
                _uiState.update { state ->
                    if (state.selectedOrderForDetails?.id == order.id) {
                        state.copy(isLoadingOrderDetails = false)
                    } else {
                        state
                    }
                }
            }
        }
    }

    fun refresh() {
        if (_uiState.value.isAuthorized) {
            _uiState.update { it.copy(isLoading = true, error = null) }
            loadAllSalesData()
        }
    }

    private fun loadAllSalesData() {
        loadAnalytics()
        loadOrders(_uiState.value.searchQuery)
    }

    private fun loadAnalytics() {
        viewModelScope.launch {
            val (startDate, endDate) = calculateDateRange(_uiState.value.selectedDatePreset)
            val result = salesRepository.getSalesAnalytics(startDate, endDate)
            result.onSuccess { analytics ->
                _uiState.update { it.copy(analytics = analytics, isLoading = false, error = null) }
            }.onFailure { error ->
                _uiState.update { it.copy(error = error.message, isLoading = false) }
            }
        }
    }

    private fun loadOrders(query: String? = null) {
        viewModelScope.launch {
            val (startDate, endDate) = calculateDateRange(_uiState.value.selectedDatePreset)
            val result = salesRepository.getOrders(query, startDate, endDate)
            result.onSuccess { orders ->
                _uiState.update { it.copy(orders = orders, isLoading = false) }
            }.onFailure { error ->
                _uiState.update { it.copy(error = error.message, isLoading = false) }
            }
        }
    }

    private fun calculateDateRange(preset: DateRangePreset): Pair<String?, String?> {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        val cal = Calendar.getInstance()

        return when (preset) {
            DateRangePreset.ALL -> Pair(null, null)
            DateRangePreset.TODAY -> {
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = sdf.format(cal.time)

                val endCal = Calendar.getInstance()
                endCal.set(Calendar.HOUR_OF_DAY, 23)
                endCal.set(Calendar.MINUTE, 59)
                endCal.set(Calendar.SECOND, 59)
                endCal.set(Calendar.MILLISECOND, 999)
                val end = sdf.format(endCal.time)
                Pair(start, end)
            }
            DateRangePreset.THIS_WEEK -> {
                cal.firstDayOfWeek = Calendar.MONDAY
                cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = sdf.format(cal.time)

                val endCal = Calendar.getInstance()
                endCal.firstDayOfWeek = Calendar.MONDAY
                endCal.set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY)
                if (endCal.before(cal)) {
                    endCal.add(Calendar.WEEK_OF_YEAR, 1)
                }
                endCal.set(Calendar.HOUR_OF_DAY, 23)
                endCal.set(Calendar.MINUTE, 59)
                endCal.set(Calendar.SECOND, 59)
                endCal.set(Calendar.MILLISECOND, 999)
                val end = sdf.format(endCal.time)
                Pair(start, end)
            }
            DateRangePreset.THIS_MONTH -> {
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal.set(Calendar.HOUR_OF_DAY, 0)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val start = sdf.format(cal.time)

                val endCal = Calendar.getInstance()
                endCal.set(Calendar.DAY_OF_MONTH, endCal.getActualMaximum(Calendar.DAY_OF_MONTH))
                endCal.set(Calendar.HOUR_OF_DAY, 23)
                endCal.set(Calendar.MINUTE, 59)
                endCal.set(Calendar.SECOND, 59)
                endCal.set(Calendar.MILLISECOND, 999)
                val end = sdf.format(endCal.time)
                Pair(start, end)
            }
            DateRangePreset.LAST_30_DAYS -> {
                val end = sdf.format(cal.time)
                cal.add(Calendar.DAY_OF_YEAR, -30)
                val start = sdf.format(cal.time)
                Pair(start, end)
            }
            DateRangePreset.CUSTOM -> {
                val start = _uiState.value.customStartDate?.let {
                    if (it.contains("T")) it else it + "T00:00:00Z"
                }
                val end = _uiState.value.customEndDate?.let {
                    if (it.contains("T")) it else it + "T23:59:59Z"
                }
                Pair(start, end)
            }
        }
    }
}
