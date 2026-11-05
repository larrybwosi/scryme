package tech.scryme.app.ui.customer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.domain.model.CustomerItem
import tech.scryme.app.domain.repository.CustomerRepository
import javax.inject.Inject

sealed interface CustomerUiState {
    object Loading : CustomerUiState
    data class Success(
        val customers: List<CustomerItem>,
        val searchQuery: String = "",
        val isRefreshing: Boolean = false
    ) : CustomerUiState
    data class Error(val message: String) : CustomerUiState
}

@HiltViewModel
class CustomerViewModel @Inject constructor(
    private val customerRepository: CustomerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CustomerUiState>(CustomerUiState.Loading)
    val uiState: StateFlow<CustomerUiState> = _uiState.asStateFlow()

    private var currentSearch: String = ""

    init {
        loadCustomers()
    }

    fun loadCustomers(search: String? = null, isRefresh: Boolean = false) {
        val previousState = _uiState.value
        currentSearch = search ?: currentSearch

        if (isRefresh && previousState is CustomerUiState.Success) {
            _uiState.value = previousState.copy(isRefreshing = true)
        } else if (!isRefresh) {
            _uiState.value = CustomerUiState.Loading
        }

        viewModelScope.launch {
            val result = customerRepository.getCustomers(
                search = if (currentSearch.isBlank()) null else currentSearch.trim()
            )

            result.fold(
                onSuccess = { customers ->
                    _uiState.value = CustomerUiState.Success(
                        customers = customers,
                        searchQuery = currentSearch,
                        isRefreshing = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = CustomerUiState.Error(
                        error.message ?: "Failed to load customers"
                    )
                }
            )
        }
    }

    fun onSearchQueryChanged(query: String) {
        currentSearch = query
        loadCustomers(search = query, isRefresh = false)
    }

    fun refresh() {
        loadCustomers(isRefresh = true)
    }
}
