package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.ApprovalsRepository

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
                .onSuccess { requests ->
                    _priceChanges.value = UiState.Success(requests)
                }
                .onFailure { error ->
                    _priceChanges.value = UiState.Error(error.message ?: "Failed to load price changes")
                }
        }
    }

    fun reviewPriceChange(id: String, approve: Boolean, reason: String? = null) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            repository.reviewPriceChange(id, approve, reason)
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    loadPriceChangeRequests()
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Review failed")
                }
        }
    }

    fun loadStockAdjustments(status: String? = null) {
        viewModelScope.launch {
            _stockAdjustments.value = UiState.Loading
            repository.getStockAdjustments(status = status)
                .onSuccess { adjustments ->
                    _stockAdjustments.value = UiState.Success(adjustments)
                }
                .onFailure { error ->
                    _stockAdjustments.value = UiState.Error(error.message ?: "Failed to load stock adjustments")
                }
        }
    }

    fun reviewStockAdjustment(id: String, approve: Boolean, rejectionReason: String? = null) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            val result = if (approve) {
                repository.approveInventoryAdjustment(id)
            } else {
                repository.rejectInventoryAdjustment(id, rejectionReason)
            }
            result
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    loadStockAdjustments(status = null)
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Review stock adjustment failed")
                }
        }
    }

    fun resetActionState() {
        _actionState.value = UiState.Idle
    }
}
