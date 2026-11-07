package tech.scryme.app

import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.CustomerApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.repository.CustomerRepositoryImpl
import tech.scryme.app.domain.repository.CustomerRepository

@OptIn(ExperimentalCoroutinesApi::class)
class CustomerRepositoryTest {

    private lateinit var apiService: CustomerApiService
    private lateinit var repository: CustomerRepository

    @Before
    fun setup() {
        apiService = mockk()
        repository = CustomerRepositoryImpl(apiService)
    }

    @Test
    fun getCustomers_successReturnsList() = runTest {
        val mockDtos = listOf(
            CustomerDto(
                id = "cust-1",
                name = "Alice",
                email = "alice@example.com",
                phone = "+1234567890",
                company = "Acme",
                customerType = "INDIVIDUAL",
                loyaltyPoints = 50,
                isActive = true,
                createdAt = "2026-11-01T00:00:00Z",
                updatedAt = "2026-11-01T00:00:00Z"
            )
        )
        coEvery { apiService.getCustomers("Alice", 50, 0) } returns Response.success(
            V3ApiResponse(success = true, data = CustomerListResponseDto(mockDtos), error = null)
        )

        val result = repository.getCustomers("Alice", 50, 0)
        assertTrue(result.isSuccess)
        val list = result.getOrNull()!!
        assertEquals(1, list.size)
        assertEquals("Alice", list[0].name)
        assertEquals(50, list[0].loyaltyPoints)
    }

    @Test
    fun getCustomerDetails_successReturnsItem() = runTest {
        val mockDto = CustomerDto(
            id = "cust-1",
            name = "Alice",
            email = "alice@example.com",
            phone = "+1234567890",
            company = "Acme",
            customerType = "INDIVIDUAL",
            loyaltyPoints = 75,
            isActive = true,
            createdAt = "2026-11-01T00:00:00Z",
            updatedAt = "2026-11-01T00:00:00Z"
        )
        coEvery { apiService.getCustomerDetails("cust-1") } returns Response.success(
            V3ApiResponse(success = true, data = mockDto, error = null)
        )

        val result = repository.getCustomerDetails("cust-1")
        assertTrue(result.isSuccess)
        assertEquals("Alice", result.getOrNull()?.name)
        assertEquals(75, result.getOrNull()?.loyaltyPoints)
    }

    @Test
    fun getCustomerTransactions_successReturnsTransactions() = runTest {
        val mockTransactions = listOf(
            CustomerTransactionDto(
                id = "tx-1",
                transactionNumber = "TX001",
                totalAmount = 99.5,
                currencyCode = "USD",
                status = "COMPLETED",
                cashierName = "Bob",
                createdAt = "2026-11-02T00:00:00Z",
                items = listOf(
                    CustomerTransactionItemDto(
                        id = "it-1",
                        name = "Product A",
                        quantity = 2,
                        unitPrice = 49.75,
                        totalPrice = 99.5
                    )
                )
            )
        )
        coEvery { apiService.getCustomerTransactions("cust-1", 20) } returns Response.success(
            V3ApiResponse(success = true, data = CustomerTransactionsResponseDto(mockTransactions), error = null)
        )

        val result = repository.getCustomerTransactions("cust-1", 20)
        assertTrue(result.isSuccess)
        val list = result.getOrNull()!!
        assertEquals(1, list.size)
        assertEquals("TX001", list[0].transactionNumber)
        assertEquals(99.5, list[0].totalAmount, 0.01)
        assertEquals(1, list[0].items.size)
        assertEquals(49.75, list[0].items[0].unitPrice, 0.01)
    }

    @Test
    fun updateCustomer_successReturnsUpdatedItem() = runTest {
        val req = UpdateCustomerRequestDto(name = "Alice Updated")
        val mockDto = CustomerDto(
            id = "cust-1",
            name = "Alice Updated",
            email = "alice@example.com",
            phone = "+1234567890",
            company = "Acme",
            customerType = "INDIVIDUAL",
            loyaltyPoints = 75,
            isActive = true,
            createdAt = "2026-11-01T00:00:00Z",
            updatedAt = "2026-11-05T00:00:00Z"
        )
        coEvery { apiService.updateCustomer("cust-1", req) } returns Response.success(
            V3ApiResponse(success = true, data = mockDto, error = null)
        )

        val result = repository.updateCustomer("cust-1", req)
        assertTrue(result.isSuccess)
        assertEquals("Alice Updated", result.getOrNull()?.name)
    }

    @Test
    fun getCustomers_apiErrorReturnsFailure() = runTest {
        coEvery { apiService.getCustomers(any(), any(), any()) } returns Response.error(
            500,
            "Internal Server Error".toResponseBody("text/plain".toMediaTypeOrNull())
        )

        val result = repository.getCustomers()
        assertTrue(result.isFailure)
    }
}
