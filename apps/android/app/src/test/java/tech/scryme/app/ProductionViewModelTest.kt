package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.*
import tech.scryme.app.domain.repository.ProductionRepository
import tech.scryme.app.ui.production.ProductionTab
import tech.scryme.app.ui.production.ProductionUiState
import tech.scryme.app.ui.production.ProductionViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class ProductionViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val productionRepository = mockk<ProductionRepository>()
    private val sessionManager = mockk<SessionManager>()
    private lateinit var viewModel: ProductionViewModel

    private val sampleSettings = ProductionSettings(
        id = "set-1",
        defaultOperatorId = "op-1",
        autoCreateDailyBatches = false,
        expiryWarningDays = 3,
        authMode = "CARD_PIN",
        batchPrefix = "BAT",
        batchSeparator = "-",
        batchDateFormat = "YYYYMMDD",
        batchSequence = "4",
        batchGenerationType = "SEQUENCE",
        enableProductionStaging = true,
        autoApproveBatches = false,
        lowStockAlerts = true,
        timezone = "UTC",
        scrymeReportEnabled = false,
        scrymeReportDay = 1,
        scrymeReportTime = "08:00"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = ProductionViewModel(productionRepository, sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadProductionData_success_populatesAllTabs() = runTest {
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"

        val batches = listOf(
            ProductionBatch(
                id = "b-1",
                batchNumber = "BAT-001",
                recipeId = "r-1",
                recipeName = "Brioche",
                plannedQuantity = 20.0,
                actualQuantity = 20.0,
                unit = "pcs",
                runType = "MAKE_TO_STOCK",
                orderReference = null,
                status = "COMPLETED",
                scheduledStartAt = "2026-11-03T08:00:00Z",
                startedAt = null,
                completedAt = null,
                durationMinutes = 60,
                leadOperatorName = "Baker Bob",
                notes = null,
                expirationStatus = "FRESH",
                expiresAt = null,
                qcData = null,
                wasteQuantity = 0.0,
                wasteReason = null,
                stagedQuantity = 20.0,
                dispatchedQuantity = 20.0,
                stagingStatus = "FULLY_DISPATCHED"
            )
        )

        val staged = listOf(
            StagedBatch(
                id = "s-1",
                batchNumber = "BAT-002",
                recipeName = "Sourdough",
                stagedQuantity = 50.0,
                dispatchedQuantity = 10.0,
                remainingQuantity = 40.0,
                stagingStatus = "PARTIALLY_DISPATCHED",
                outputLocationName = "Downtown Branch",
                completedAt = null
            )
        )

        val incidents = listOf(
            QualityIncident(
                id = "qi-1",
                title = "Burnt crust",
                description = "Overbaked",
                severity = "low",
                status = "RESOLVED",
                batchId = "b-1",
                batchNumber = "BAT-001",
                reporterName = "Bob",
                createdAt = "2026-11-03T10:00:00Z",
                updatedAt = null
            )
        )

        val operators = listOf(
            ProductionOperator(
                id = "op-1",
                memberId = "m-1",
                name = "Baker Bob",
                email = "bob@example.com",
                role = "Lead Baker",
                specialties = listOf("Pastry"),
                isDefault = true,
                isActive = true,
                avatarUrl = null
            )
        )

        coEvery { productionRepository.getOverview() } returns Result.success(
            ProductionOverview(
                activeBatchesCount = 0,
                completedTodayCount = 1,
                stagedBatchesCount = 1,
                openIncidentsCount = 0,
                totalOperatorsCount = 1
            )
        )
        coEvery { productionRepository.getBatches(any()) } returns Result.success(batches)
        coEvery { productionRepository.getStagedBatches() } returns Result.success(staged)
        coEvery { productionRepository.getQualityIncidents() } returns Result.success(incidents)
        coEvery { productionRepository.getOperators() } returns Result.success(operators)
        coEvery { productionRepository.getSettings() } returns Result.success(sampleSettings)

        viewModel.loadProductionData()
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue("Expected Success state but got $state", state is ProductionUiState.Success)
        val success = state as ProductionUiState.Success
        assertEquals(1, success.batches.size)
        assertEquals("BAT-001", success.batches[0].batchNumber)
        assertEquals(1, success.stagedBatches.size)
        assertEquals(40.0, success.stagedBatches[0].remainingQuantity, 0.001)
        assertEquals(1, success.qualityIncidents.size)
        assertEquals("Burnt crust", success.qualityIncidents[0].title)
        assertEquals(1, success.operators.size)
        assertNotNull(success.settings)
        assertEquals("BAT", success.settings?.batchPrefix)
    }

    @Test
    fun selectTab_updatesTabState() = runTest {
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { productionRepository.getOverview() } returns Result.success(
            ProductionOverview(0, 0, 0, 0, 0)
        )
        coEvery { productionRepository.getBatches(any()) } returns Result.success(emptyList())
        coEvery { productionRepository.getStagedBatches() } returns Result.success(emptyList())
        coEvery { productionRepository.getQualityIncidents() } returns Result.success(emptyList())
        coEvery { productionRepository.getOperators() } returns Result.success(emptyList())
        coEvery { productionRepository.getSettings() } returns Result.success(sampleSettings)

        viewModel.loadProductionData()
        testScheduler.advanceUntilIdle()

        viewModel.selectTab(ProductionTab.INCIDENTS)
        val state = viewModel.uiState.value as ProductionUiState.Success
        assertEquals(ProductionTab.INCIDENTS, state.selectedTab)
    }

    @Test
    fun setStatusFilter_reloadsBatchesWithFilter() = runTest {
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { productionRepository.getOverview() } returns Result.success(
            ProductionOverview(0, 0, 0, 0, 0)
        )
        coEvery { productionRepository.getBatches("IN_PROGRESS") } returns Result.success(emptyList())
        coEvery { productionRepository.getBatches(null) } returns Result.success(emptyList())
        coEvery { productionRepository.getStagedBatches() } returns Result.success(emptyList())
        coEvery { productionRepository.getQualityIncidents() } returns Result.success(emptyList())
        coEvery { productionRepository.getOperators() } returns Result.success(emptyList())
        coEvery { productionRepository.getSettings() } returns Result.success(sampleSettings)

        viewModel.loadProductionData()
        testScheduler.advanceUntilIdle()

        viewModel.setStatusFilter("IN_PROGRESS")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as ProductionUiState.Success
        assertEquals("IN_PROGRESS", state.statusFilter)
        coVerify { productionRepository.getBatches("IN_PROGRESS") }
    }
}
