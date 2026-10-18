package tech.scryme.app.ui.overview

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.repository.SalesRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import java.util.Calendar
import javax.inject.Inject

data class OverviewUiState(
    val userName: String = "",
    val orgName: String = "",
    val greeting: String = "Welcome",
    val todaySalesAmount: Double = 0.0,
    val currencySymbol: String = "$",
    val totalOrdersCount: Int = 0,
    val pendingTasksCount: Int = 0,
    val completedTasksCount: Int = 0,
    val isShiftActive: Boolean = false,
    val shiftPunctuality: String = "NO_SHIFT",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class OverviewViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val salesRepository: SalesRepository,
    private val scheduleRepository: ScheduleRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(OverviewUiState())
    val uiState: StateFlow<OverviewUiState> = _uiState.asStateFlow()

    init {
        observeSession()
        loadOverviewData()
    }

    private fun observeSession() {
        viewModelScope.launch {
            combine(
                sessionManager.userNameFlow,
                sessionManager.orgNameFlow,
                sessionManager.orgCurrencySymbolFlow
            ) { name, org, symbol ->
                Triple(name ?: "User", org ?: "Organization", symbol ?: "$")
            }.collect { (name, org, symbol) ->
                _uiState.update {
                    it.copy(
                        userName = name,
                        orgName = org,
                        currencySymbol = symbol,
                        greeting = getGreetingPrefix()
                    )
                }
            }
        }
    }

    fun loadOverviewData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val orgSlug = sessionManager.getOrgSlug()
                val memberId = sessionManager.getMemberId()

                val salesResult = salesRepository.getSalesAnalytics()
                var salesAmount = 0.0
                var ordersCount = 0
                salesResult.onSuccess { analytics ->
                    // Parse total balance string to double if applicable
                    val numericString = analytics.totalBalance.replace("[^0-9.]".toRegex(), "")
                    salesAmount = numericString.toDoubleOrNull() ?: 0.0
                    ordersCount = analytics.recentTransactions.size
                }

                var pendingTasks = 0
                var completedTasks = 0
                if (!orgSlug.isNullOrEmpty()) {
                    val tasksResult = scheduleRepository.getStaffTasks(orgSlug = orgSlug, memberId = memberId)
                    tasksResult.onSuccess { tasks ->
                        pendingTasks = tasks.count { it.status != "COMPLETED" }
                        completedTasks = tasks.count { it.status == "COMPLETED" }
                    }
                }

                var isShiftActive = false
                var punctuality = "NO_SHIFT"
                if (!orgSlug.isNullOrEmpty()) {
                    val attendanceResult = scheduleRepository.getMyAttendanceStatus(orgSlug = orgSlug)
                    attendanceResult.onSuccess { status ->
                        isShiftActive = status.isCheckedIn
                        punctuality = status.status ?: if (status.isCheckedIn) "ON_TIME" else "NO_SHIFT"
                    }
                }

                _uiState.update {
                    it.copy(
                        todaySalesAmount = salesAmount,
                        totalOrdersCount = ordersCount,
                        pendingTasksCount = pendingTasks,
                        completedTasksCount = completedTasks,
                        isShiftActive = isShiftActive,
                        shiftPunctuality = punctuality,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = e.localizedMessage ?: "Failed to load metrics"
                    )
                }
            }
        }
    }

    private fun getGreetingPrefix(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 4..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            in 17..22 -> "Good evening"
            else -> "Hello"
        }
    }
}
