package tech.scryme.admin.presentation.viewmodel

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.ApprovalsRepository

@OptIn(ExperimentalCoroutinesApi::class)
class ApprovalsViewModelTest {

    private val repository = mockk<ApprovalsRepository>()
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var viewModel: ApprovalsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = ApprovalsViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadPriceChangeRequests success populates state flow`() = runTest(testDispatcher) {
        val requests = listOf(
            PriceChangeRequestDto(
                id = "req_1",
                variantId = "v1",
                requestedBy = "m1",
                oldPrice = 10.0,
                newPrice = 12.0,
                status = "PENDING",
                createdAt = "2024-10-27T10:00:00Z"
            )
        )

        coEvery { repository.getPriceChangeRequests() } returns Result.success(requests)

        viewModel.loadPriceChangeRequests()
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.priceChanges.value is UiState.Success)
        assertEquals(requests, (viewModel.priceChanges.value as UiState.Success).data)
    }

    @Test
    fun `reviewPriceChange success triggers list reloading`() = runTest(testDispatcher) {
        coEvery { repository.reviewPriceChange("req_1", true, null) } returns Result.success(Unit)
        coEvery { repository.getPriceChangeRequests() } returns Result.success(emptyList())

        viewModel.reviewPriceChange("req_1", true)
        testScheduler.advanceUntilIdle()

        coVerify { repository.reviewPriceChange("req_1", true, null) }
        coVerify { repository.getPriceChangeRequests() }
    }

    @Test
    fun `loadStockAdjustments success populates state flow`() = runTest(testDispatcher) {
        val adjustments = listOf(
            StockAdjustmentResponseDto(
                id = "adj_1",
                variantId = "v1",
                locationId = "loc_1",
                quantity = 15.0,
                reason = "FOUND",
                status = "PENDING",
                createdAt = "2024-10-27T10:00:00Z"
            )
        )

        coEvery { repository.getStockAdjustments(status = "PENDING") } returns Result.success(adjustments)

        viewModel.loadStockAdjustments(status = "PENDING")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.stockAdjustments.value is UiState.Success)
        assertEquals(adjustments, (viewModel.stockAdjustments.value as UiState.Success).data)
    }

    @Test
    fun `reviewStockAdjustment approve success triggers list reloading`() = runTest(testDispatcher) {
        coEvery { repository.approveInventoryAdjustment("adj_1") } returns Result.success(Unit)
        coEvery { repository.getStockAdjustments(status = null) } returns Result.success(emptyList())

        viewModel.reviewStockAdjustment("adj_1", approve = true)
        testScheduler.advanceUntilIdle()

        coVerify { repository.approveInventoryAdjustment("adj_1") }
        coVerify { repository.getStockAdjustments(status = null) }
        assertTrue(viewModel.actionState.value is UiState.Success)
    }

    @Test
    fun `reviewStockAdjustment reject success triggers list reloading`() = runTest(testDispatcher) {
        val reason = "Incorrect entry"
        coEvery { repository.rejectInventoryAdjustment("adj_1", reason) } returns Result.success(Unit)
        coEvery { repository.getStockAdjustments(status = null) } returns Result.success(emptyList())

        viewModel.reviewStockAdjustment("adj_1", approve = false, rejectionReason = reason)
        testScheduler.advanceUntilIdle()

        coVerify { repository.rejectInventoryAdjustment("adj_1", reason) }
        coVerify { repository.getStockAdjustments(status = null) }
        assertTrue(viewModel.actionState.value is UiState.Success)
    }

    @Test
    fun `resetActionState clears action state`() = runTest(testDispatcher) {
        coEvery { repository.approveInventoryAdjustment("adj_1") } returns Result.success(Unit)
        coEvery { repository.getStockAdjustments(status = null) } returns Result.success(emptyList())

        viewModel.reviewStockAdjustment("adj_1", approve = true)
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.actionState.value is UiState.Success)

        viewModel.resetActionState()
        assertTrue(viewModel.actionState.value is UiState.Idle)
    }
}
