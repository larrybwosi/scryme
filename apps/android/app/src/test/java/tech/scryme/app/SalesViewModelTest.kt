package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.SalesRepository
import tech.scryme.app.ui.sales.SalesTab
import tech.scryme.app.ui.sales.SalesViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class SalesViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val salesRepository = mockk<SalesRepository>()
    private val authRepository = mockk<AuthRepository>()
    private lateinit var viewModel: SalesViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { authRepository.validateSession() } returns Result.failure(Exception("Offline"))
        coEvery { salesRepository.getSalesAnalytics() } returns Result.success(SalesAnalytics("Admin", "$0.00", emptyList(), emptyList()))
        coEvery { salesRepository.getOrders(any()) } returns Result.success(emptyList())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun init_loadsDataSuccessfully() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.isAuthorized)
        assertEquals(SalesTab.ANALYTICS, state.selectedTab)
        assertNotNull(state.analytics)
    }

    @Test
    fun selectTab_updatesTab() = runTest {
        viewModel = SalesViewModel(salesRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectTab(SalesTab.ORDERS)
        assertEquals(SalesTab.ORDERS, viewModel.uiState.value.selectedTab)
    }
}
