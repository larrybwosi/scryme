package tech.scryme.app

import androidx.lifecycle.SavedStateHandle
import io.mockk.coEvery
import io.mockk.coVerify
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
import tech.scryme.app.domain.model.CustomerTransactionItem
import tech.scryme.app.domain.repository.CustomerRepository
import tech.scryme.app.ui.customer.CustomerDetailsUiState
import tech.scryme.app.ui.customer.CustomerDetailsViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class CustomerDetailsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var customerRepository: CustomerRepository
    private lateinit var savedStateHandle: SavedStateHandle
    private lateinit var viewModel: CustomerDetailsViewModel

    private val mockCustomer = CustomerItem(
        id = "cust-1",
        name = "Bob Marley",
        email = "bob@example.com",
        phone = "+254711111111",
        company = "Island Records",
        customerType = "INDIVIDUAL",
        loyaltyPoints = 250,
        isActive = true,
        createdAt = "2026-11-01T00:00:00Z",
        updatedAt = "2026-11-01T00:00:00Z"
    )

    private val mockTransactions = listOf(
        CustomerTransactionItem(
            id = "tx-1",
            transactionNumber = "TX999",
            totalAmount = 145.0,
            currencyCode = "USD",
            status = "COMPLETED",
            cashierName = "Cashier Bob",
            createdAt = "2026-11-03T10:00:00Z"
        )
    )

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        customerRepository = mockk(relaxed = true)
        savedStateHandle = SavedStateHandle(mapOf("customerId" to "cust-1"))

        coEvery { customerRepository.getCustomerDetails("cust-1") } returns Result.success(mockCustomer)
        coEvery { customerRepository.getCustomerTransactions("cust-1", any()) } returns Result.success(mockTransactions)

        viewModel = CustomerDetailsViewModel(customerRepository, savedStateHandle)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun init_loadsCustomerDetailsAndTransactions() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is CustomerDetailsUiState.Success)
        val success = state as CustomerDetailsUiState.Success
        assertEquals("Bob Marley", success.customer.name)
        assertEquals(250, success.customer.loyaltyPoints)
        assertEquals(1, success.transactions.size)
        assertEquals("TX999", success.transactions[0].transactionNumber)
    }

    @Test
    fun updateCustomer_successUpdatesState() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        val updatedCustomer = mockCustomer.copy(name = "Robert Nesta Marley")
        coEvery { customerRepository.updateCustomer("cust-1", any()) } returns Result.success(updatedCustomer)

        viewModel.updateCustomer(name = "Robert Nesta Marley")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is CustomerDetailsUiState.Success)
        val success = state as CustomerDetailsUiState.Success
        assertEquals("Robert Nesta Marley", success.customer.name)
        assertEquals("Customer profile updated successfully", success.actionSuccessMessage)
    }

    @Test
    fun loadCustomerDetails_failureSetsErrorState() = runTest {
        coEvery { customerRepository.getCustomerDetails("cust-1") } returns Result.failure(Exception("Not found"))

        viewModel.loadCustomerDetails()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is CustomerDetailsUiState.Error)
        assertEquals("Not found", (state as CustomerDetailsUiState.Error).message)
    }
}
