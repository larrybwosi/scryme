package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.ExpenseCategoryDto
import tech.scryme.admin.data.model.ExpenseDto
import tech.scryme.admin.domain.repository.ExpenseRepository

class ExpenseViewModel(
    private val repository: ExpenseRepository
) : ViewModel() {

    private val _expensesState = MutableStateFlow<UiState<List<ExpenseDto>>>(UiState.Idle)
    val expensesState: StateFlow<UiState<List<ExpenseDto>>> = _expensesState.asStateFlow()

    private val _categoriesState = MutableStateFlow<UiState<List<ExpenseCategoryDto>>>(UiState.Idle)
    val categoriesState: StateFlow<UiState<List<ExpenseCategoryDto>>> = _categoriesState.asStateFlow()

    private val _actionState = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val actionState: StateFlow<UiState<Unit>> = _actionState.asStateFlow()

    init {
        loadExpenses()
        loadCategories()
    }

    fun loadExpenses(status: String? = null, categoryId: String? = null) {
        viewModelScope.launch {
            _expensesState.value = UiState.Loading
            repository.getExpenses(status, categoryId)
                .onSuccess { list ->
                    _expensesState.value = UiState.Success(list)
                }
                .onFailure { error ->
                    _expensesState.value = UiState.Error(error.message ?: "Failed to load expenses")
                }
        }
    }

    fun loadCategories() {
        viewModelScope.launch {
            _categoriesState.value = UiState.Loading
            repository.getExpenseCategories()
                .onSuccess { categories ->
                    _categoriesState.value = UiState.Success(categories)
                }
                .onFailure { error ->
                    _categoriesState.value = UiState.Error(error.message ?: "Failed to load categories")
                }
        }
    }

    fun createExpense(
        description: String,
        amount: Double,
        categoryId: String,
        paymentMethod: String,
        notes: String? = null
    ) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            repository.createExpense(description, amount, categoryId, paymentMethod, notes)
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    loadExpenses()
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Failed to create expense")
                }
        }
    }

    fun approveExpense(id: String) {
        viewModelScope.launch {
            _actionState.value = UiState.Loading
            repository.approveExpense(id)
                .onSuccess {
                    _actionState.value = UiState.Success(Unit)
                    loadExpenses()
                }
                .onFailure { error ->
                    _actionState.value = UiState.Error(error.message ?: "Failed to approve expense")
                }
        }
    }
}
