package tech.scryme.app

import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.SalesApiService
import tech.scryme.app.data.dto.V3ApiResponse
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.data.repository.SalesRepositoryImpl
import tech.scryme.app.domain.model.MetricItem
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.OrderStatus
import tech.scryme.app.domain.model.SalesAnalytics

class SalesRepositoryTest {

    private val apiService: SalesApiService = mockk()
    private val sessionManager: SessionManager = mockk()
    private lateinit var repository: SalesRepositoryImpl

    @Before
    fun setUp() {
        coEvery { sessionManager.getOrgCurrency() } returns "USD"
        coEvery { sessionManager.getOrgCurrencySymbol() } returns "$"
        repository = SalesRepositoryImpl(apiService, sessionManager)
    }

    @Test
    fun getSalesAnalytics_success_returnsFormattedData() = runTest {
        val mockAnalytics = SalesAnalytics(
            userName = "Admin",
            totalBalance = "150841.93",
            metrics = listOf(MetricItem("Customer", "24139", "27%", true)),
            recentTransactions = emptyList()
        )
        val apiResponse = V3ApiResponse(success = true, data = mockAnalytics)
        coEvery { apiService.getAnalytics() } returns Response.success(apiResponse)

        val result = repository.getSalesAnalytics()

        assertTrue(result.isSuccess)
        val analytics = result.getOrNull()
        assertNotNull(analytics)
        assertEquals("Admin", analytics?.userName)
        assertEquals("$150,841.93", analytics?.totalBalance)
    }

    @Test
    fun getSalesAnalytics_error_returnsFailure() = runTest {
        coEvery { apiService.getAnalytics() } returns Response.error(500, okhttp3.ResponseBody.create(null, "Server error"))

        val result = repository.getSalesAnalytics()

        assertTrue(result.isFailure)
    }

    @Test
    fun getOrders_success_returnsOrderList() = runTest {
        val mockOrders = listOf(
            OrderItem(
                id = "ord_1",
                title = "TimeSync Smart Watch",
                itemCountText = "2 Items",
                timeText = "10:45 AM",
                status = OrderStatus.CONFIRMED,
                orderCode = "#TXN_10018",
                groupDate = "Today"
            )
        )
        val apiResponse = V3ApiResponse(success = true, data = mockOrders)
        coEvery { apiService.getOrders(any()) } returns Response.success(apiResponse)

        val result = repository.getOrders()

        assertTrue(result.isSuccess)
        val orders = result.getOrNull()
        assertEquals(1, orders?.size)
        assertEquals("TimeSync Smart Watch", orders?.first()?.title)
    }
}
