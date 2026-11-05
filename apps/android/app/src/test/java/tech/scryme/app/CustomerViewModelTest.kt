package tech.scryme.app

import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.app.domain.model.CustomerItem
import tech.scryme.app.domain.repository.CustomerRepository
import tech.scryme.app.ui.customer.CustomerUiState
import tech.scryme.app.ui.customer.CustomerViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class CustomerViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var customerRepository: CustomerRepository
    private lateinit var viewModel: CustomerViewModel

    private val mockCustomers = listOf(
        CustomerItem(
            id = "c-1",
            name = "Jane Smith",
            email = "jane@example.com",
            phone = "+254700000000",
            company = "Acme Corp",
            customerType = "INDIVIDUAL",
            loyaltyPoints = 100,
            isActive = true,
            createdAt = "2026-11-01T00:00:00Z",
            updatedAt = "2026-11-01T00:00:00Z"
        )
    )

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        customerRepository = mockk(relaxed = true)
        coEvery { customerRepository.getCustomers(any(), any(), any()) } returns Result.success(mockCustomers)
        viewModel = CustomerViewModel(customerRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun init_loadsCustomersSuccessfully() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is CustomerUiState.Success)
        val success = state as CustomerUiState.Success
        assertEquals(1, success.customers.size)
        assertEquals("Jane Smith", success.customers[0].name)
    }

    @Test
    fun onSearchQueryChanged_updatesList() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        val searchResult = listOf(
            mockCustomers[0].copy(name = "Jane Filtered")
        )
        coEvery { customerRepository.getCustomers("Jane", any(), any()) } returns Result.success(searchResult)

        viewModel.onSearchQueryChanged("Jane")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is CustomerUiState.Success)
        val success = state as CustomerUiState.Success
        assertEquals("Jane", success.searchQuery)
        assertEquals("Jane Filtered", success.customers[0].name)
    }

    @Test
    fun loadCustomers_failureSetsErrorState() = runTest {
        coEvery { customerRepository.getCustomers(any(), any(), any()) } returns Result.failure(Exception("Network error"))

        viewModel.loadCustomers(search = "error")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is CustomerUiState.Error)
        assertEquals("Network error", (state as CustomerUiState.Error).message)
    }
}
