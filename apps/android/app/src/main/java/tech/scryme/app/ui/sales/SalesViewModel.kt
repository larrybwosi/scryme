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
import javax.inject.Inject

data class SalesUiState(
    val isLoading: Boolean = false,
    val analytics: SalesAnalytics? = null,
    val orders: List<OrderItem> = emptyList(),
    val searchQuery: String = "",
    val error: String? = null,
    val selectedTab: SalesTab = SalesTab.ANALYTICS,
    val isAuthorized: Boolean = true
)

enum class SalesTab {
    ANALYTICS,
    ORDERS
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
            _uiState.update { it.copy(isLoading = true) }
            val sessionResult = authRepository.validateSession()
            val isAuth = sessionResult.getOrNull()?.let { meData ->
                val role = meData.member?.role ?: meData.memberships?.firstOrNull()?.role ?: "ADMIN"
                val upperRole = role.uppercase()
                upperRole == "ADMIN" || upperRole == "OWNER"
            } ?: true // Fallback to true if offline/mock mode

            _uiState.update { it.copy(isAuthorized = isAuth) }

            if (isAuth) {
                loadAnalytics()
                loadOrders()
            } else {
                _uiState.update { it.copy(isLoading = false, error = "Access Restricted: Admins & Owners only.") }
            }
        }
    }

    fun selectTab(tab: SalesTab) {
        _uiState.update { it.copy(selectedTab = tab) }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadOrders(query)
    }

    fun refresh() {
        if (_uiState.value.isAuthorized) {
            loadAnalytics()
            loadOrders(_uiState.value.searchQuery)
        }
    }

    private fun loadAnalytics() {
        viewModelScope.launch {
            val result = salesRepository.getSalesAnalytics()
            result.onSuccess { analytics ->
                _uiState.update { it.copy(analytics = analytics, isLoading = false) }
            }.onFailure { error ->
                _uiState.update { it.copy(error = error.message, isLoading = false) }
            }
        }
    }

    private fun loadOrders(query: String? = null) {
        viewModelScope.launch {
            val result = salesRepository.getOrders(query)
            result.onSuccess { orders ->
                _uiState.update { it.copy(orders = orders) }
            }.onFailure { error ->
                _uiState.update { it.copy(error = error.message) }
            }
        }
    }
}
