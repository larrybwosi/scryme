package tech.scryme.app.ui.production

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.*
import tech.scryme.app.domain.repository.ProductionRepository
import javax.inject.Inject

enum class ProductionTab(val title: String) {
    BATCHES("Batches"),
    STAGING("Staging / Runs"),
    INCIDENTS("Quality Incidents"),
    OPERATORS("Operators"),
    SETTINGS("Settings")
}

sealed interface ProductionUiState {
    object Loading : ProductionUiState
    data class Success(
        val overview: ProductionOverview,
        val batches: List<ProductionBatch>,
        val stagedBatches: List<StagedBatch>,
        val qualityIncidents: List<QualityIncident>,
        val operators: List<ProductionOperator>,
        val settings: ProductionSettings?,
        val selectedTab: ProductionTab = ProductionTab.BATCHES,
        val statusFilter: String = "ALL", // ALL, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
        val searchQuery: String = "",
        val selectedBatch: ProductionBatch? = null,
        val message: String? = null
    ) : ProductionUiState
    data class Error(val message: String) : ProductionUiState
}

@HiltViewModel
class ProductionViewModel @Inject constructor(
    private val productionRepository: ProductionRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProductionUiState>(ProductionUiState.Loading)
    val uiState: StateFlow<ProductionUiState> = _uiState.asStateFlow()

    fun loadProductionData(actionMessage: String? = null) {
        viewModelScope.launch {
            val current = _uiState.value
            val currentTab = if (current is ProductionUiState.Success) current.selectedTab else ProductionTab.BATCHES
            val currentFilter = if (current is ProductionUiState.Success) current.statusFilter else "ALL"
            val currentQuery = if (current is ProductionUiState.Success) current.searchQuery else ""

            _uiState.value = ProductionUiState.Loading

            val orgSlug = sessionManager.getOrgSlug()
            if (orgSlug.isNullOrEmpty()) {
                _uiState.value = ProductionUiState.Error("Missing organization context")
                return@launch
            }

            try {
                val overviewRes = productionRepository.getOverview()
                val batchesRes = productionRepository.getBatches(
                    status = if (currentFilter == "ALL") null else currentFilter
                )
                val stagedRes = productionRepository.getStagedBatches()
                val incidentsRes = productionRepository.getQualityIncidents()
                val operatorsRes = productionRepository.getOperators()
                val settingsRes = productionRepository.getSettings()

                val batches = batchesRes.getOrDefault(emptyList())
                val staged = stagedRes.getOrDefault(emptyList())
                val incidents = incidentsRes.getOrDefault(emptyList())
                val operators = operatorsRes.getOrDefault(emptyList())
                val settings = settingsRes.getOrNull()
                val overview = overviewRes.getOrDefault(
                    ProductionOverview(
                        activeBatchesCount = batches.count { it.status == "IN_PROGRESS" },
                        completedTodayCount = batches.count { it.status == "COMPLETED" },
                        stagedBatchesCount = staged.size,
                        openIncidentsCount = incidents.count { it.status == "OPEN" || it.status == "INVESTIGATING" },
                        totalOperatorsCount = operators.size
                    )
                )

                _uiState.value = ProductionUiState.Success(
                    overview = overview,
                    batches = batches,
                    stagedBatches = staged,
                    qualityIncidents = incidents,
                    operators = operators,
                    settings = settings,
                    selectedTab = currentTab,
                    statusFilter = currentFilter,
                    searchQuery = currentQuery,
                    message = actionMessage
                )
            } catch (e: Exception) {
                _uiState.value = ProductionUiState.Error(e.message ?: "Failed to load production data")
            }
        }
    }

    fun selectTab(tab: ProductionTab) {
        val current = _uiState.value
        if (current is ProductionUiState.Success) {
            _uiState.value = current.copy(selectedTab = tab)
        }
    }

    fun setStatusFilter(status: String) {
        val current = _uiState.value
        if (current is ProductionUiState.Success) {
            _uiState.value = current.copy(statusFilter = status)
            loadProductionData()
        }
    }

    fun setSearchQuery(query: String) {
        val current = _uiState.value
        if (current is ProductionUiState.Success) {
            _uiState.value = current.copy(searchQuery = query)
        }
    }

    fun selectBatch(batch: ProductionBatch?) {
        val current = _uiState.value
        if (current is ProductionUiState.Success) {
            _uiState.value = current.copy(selectedBatch = batch)
        }
    }
}
