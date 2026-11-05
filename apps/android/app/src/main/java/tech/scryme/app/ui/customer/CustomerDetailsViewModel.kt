package tech.scryme.app.ui.customer

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.dto.UpdateCustomerRequestDto
import tech.scryme.app.domain.model.CustomerItem
import tech.scryme.app.domain.model.CustomerTransactionItem
import tech.scryme.app.domain.repository.CustomerRepository
import javax.inject.Inject

sealed interface CustomerDetailsUiState {
    object Loading : CustomerDetailsUiState
    data class Success(
        val customer: CustomerItem,
        val transactions: List<CustomerTransactionItem> = emptyList(),
        val isTransactionsLoading: Boolean = false,
        val isUpdating: Boolean = false,
        val actionSuccessMessage: String? = null
    ) : CustomerDetailsUiState
    data class Error(val message: String) : CustomerDetailsUiState
}

@HiltViewModel
class CustomerDetailsViewModel @Inject constructor(
    private val customerRepository: CustomerRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val customerId: String = checkNotNull(savedStateHandle["customerId"])

    private val _uiState = MutableStateFlow<CustomerDetailsUiState>(CustomerDetailsUiState.Loading)
    val uiState: StateFlow<CustomerDetailsUiState> = _uiState.asStateFlow()

    init {
        loadCustomerDetails()
    }

    fun loadCustomerDetails(actionMessage: String? = null) {
        _uiState.value = CustomerDetailsUiState.Loading
        viewModelScope.launch {
            val result = customerRepository.getCustomerDetails(customerId)
            result.fold(
                onSuccess = { customer ->
                    _uiState.value = CustomerDetailsUiState.Success(
                        customer = customer,
                        actionSuccessMessage = actionMessage
                    )
                    loadTransactions()
                },
                onFailure = { error ->
                    _uiState.value = CustomerDetailsUiState.Error(
                        error.message ?: "Failed to load customer details"
                    )
                }
            )
        }
    }

    fun loadTransactions() {
        val current = _uiState.value as? CustomerDetailsUiState.Success ?: return
        _uiState.value = current.copy(isTransactionsLoading = true)

        viewModelScope.launch {
            val result = customerRepository.getCustomerTransactions(customerId)
            result.fold(
                onSuccess = { transactions ->
                    val state = _uiState.value as? CustomerDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(
                        transactions = transactions,
                        isTransactionsLoading = false
                    )
                },
                onFailure = {
                    val state = _uiState.value as? CustomerDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(isTransactionsLoading = false)
                }
            )
        }
    }

    fun updateCustomer(
        name: String? = null,
        email: String? = null,
        phone: String? = null,
        company: String? = null,
        isActive: Boolean? = null
    ) {
        val current = _uiState.value as? CustomerDetailsUiState.Success ?: return
        _uiState.value = current.copy(isUpdating = true)

        viewModelScope.launch {
            val req = UpdateCustomerRequestDto(
                name = name,
                email = email,
                phone = phone,
                company = company,
                isActive = isActive
            )
            val result = customerRepository.updateCustomer(customerId, req)
            result.fold(
                onSuccess = { updatedCustomer ->
                    val state = _uiState.value as? CustomerDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(
                        customer = updatedCustomer,
                        isUpdating = false,
                        actionSuccessMessage = "Customer profile updated successfully"
                    )
                },
                onFailure = { error ->
                    val state = _uiState.value as? CustomerDetailsUiState.Success ?: return@launch
                    _uiState.value = state.copy(isUpdating = false)
                }
            )
        }
    }

    fun clearActionMessage() {
        val current = _uiState.value as? CustomerDetailsUiState.Success ?: return
        _uiState.value = current.copy(actionSuccessMessage = null)
    }
}
