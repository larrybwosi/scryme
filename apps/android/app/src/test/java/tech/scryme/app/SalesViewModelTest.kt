package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.OrderLineItem
import tech.scryme.app.domain.model.OrderStatus
import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.SalesRepository
import tech.scryme.app.ui.finance.DateRangePreset
import tech.scryme.app.ui.sales.SalesTab
import tech.scryme.app.ui.sales.SalesViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class SalesViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val salesRepository = mockk<SalesRepository>()
    private val authRepository = mockk<AuthRepository>()
    private lateinit var viewModel: SalesViewModel

    private val sampleOrder = OrderItem(
        id = "ord_1",
        title = "TimeSync Smart Watch",
        itemCountText = "1 Item",
        timeText = "10:30 AM",
        status = OrderStatus.CONFIRMED,
        orderCode = "#TXN_1001",
        groupDate = "Today",
        lineItems = emptyList()
    )

    private val sampleDetailedOrder = sampleOrder.copy(
        lineItems = listOf(
            OrderLineItem(
                id = "item_1",
                name = "TimeSync Smart Watch",
                quantity = 1,
                unitPrice = "$45.00",
                totalPrice = "$45.00",
                sku = "SKU-1001"
            )
        ),
        subtotal = "$45.00",
        tax = "$5.00",
        discount = "$0.00",
        totalAmount = "$50.00"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { authRepository.validateSession() } returns Result.failure(Exception("Offline"))
        coEvery { salesRepository.getSalesAnalytics(any(), any()) } returns Result.success(
            SalesAnalytics("Admin", "$0.00", emptyList(), emptyList())
        )
        coEvery { salesRepository.getOrders(any(), any(), any()) } returns Result.success(listOf(sampleOrder))
        coEvery { salesRepository.getOrderDetails("ord_1") } returns Result.success(sampleDetailedOrder)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun init_loadsDataSuccessfullyWithDefaultMonthPreset() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.isAuthorized)
        assertEquals(SalesTab.ANALYTICS, state.selectedTab)
        assertEquals(DateRangePreset.THIS_MONTH, state.selectedDatePreset)
        assertNotNull(state.analytics)
        assertEquals(1, state.orders.size)
        coVerify { salesRepository.getOrders(any(), any(), any()) }
        coVerify { salesRepository.getSalesAnalytics(any(), any()) }
    }

    @Test
    fun selectTab_updatesTab() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectTab(SalesTab.ORDERS)
        assertEquals(SalesTab.ORDERS, viewModel.uiState.value.selectedTab)
    }

    @Test
    fun selectDatePreset_switchesPresetsAndReloads() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectDatePreset(DateRangePreset.TODAY)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.TODAY, viewModel.uiState.value.selectedDatePreset)

        viewModel.selectDatePreset(DateRangePreset.THIS_WEEK)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.THIS_WEEK, viewModel.uiState.value.selectedDatePreset)

        viewModel.selectDatePreset(DateRangePreset.LAST_30_DAYS)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.LAST_30_DAYS, viewModel.uiState.value.selectedDatePreset)

        viewModel.selectDatePreset(DateRangePreset.ALL)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.ALL, viewModel.uiState.value.selectedDatePreset)
    }

    @Test
    fun setCustomDateRange_setsCustomDatesAndReloads() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.setCustomDateRange("2025-01-01", "2025-01-31")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(DateRangePreset.CUSTOM, state.selectedDatePreset)
        assertEquals("2025-01-01", state.customStartDate)
        assertEquals("2025-01-31", state.customEndDate)
        coVerify { salesRepository.getOrders(any(), "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z") }
    }

    @Test
    fun selectOrderForDetails_fetchesFullOrderDetailsWithPricing() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectOrderForDetails(sampleOrder)
        // Advance coroutines to resolve getOrderDetails
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoadingOrderDetails)
        assertNotNull(state.selectedOrderForDetails)
        assertEquals("ord_1", state.selectedOrderForDetails?.id)
        assertEquals(1, state.selectedOrderForDetails?.lineItems?.size)
        assertEquals("$45.00", state.selectedOrderForDetails?.lineItems?.first()?.unitPrice)
        assertEquals("$50.00", state.selectedOrderForDetails?.totalAmount)
        coVerify { salesRepository.getOrderDetails("ord_1") }
    }

    @Test
    fun selectOrderForDetails_withNull_clearsSelectedOrder() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectOrderForDetails(sampleOrder)
        testScheduler.advanceUntilIdle()
        assertNotNull(viewModel.uiState.value.selectedOrderForDetails)

        viewModel.selectOrderForDetails(null)
        assertNull(viewModel.uiState.value.selectedOrderForDetails)
    }
}
