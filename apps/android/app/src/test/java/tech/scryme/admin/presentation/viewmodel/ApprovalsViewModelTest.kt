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
}
