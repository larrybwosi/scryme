package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.DashboardAnalyticsDto
import tech.scryme.admin.domain.repository.AnalyticsRepository

class AnalyticsViewModel(
    private val repository: AnalyticsRepository
) : ViewModel() {

    private val _analyticsState = MutableStateFlow<UiState<DashboardAnalyticsDto>>(UiState.Idle)
    val analyticsState: StateFlow<UiState<DashboardAnalyticsDto>> = _analyticsState.asStateFlow()

    init {
        loadDashboardAnalytics()
    }

    fun loadDashboardAnalytics() {
        viewModelScope.launch {
            _analyticsState.value = UiState.Loading
            repository.getDashboardAnalytics()
                .onSuccess { data ->
                    _analyticsState.value = UiState.Success(data)
                }
                .onFailure { error ->
                    _analyticsState.value = UiState.Error(error.message ?: "Failed to load dashboard analytics")
                }
        }
    }
}
