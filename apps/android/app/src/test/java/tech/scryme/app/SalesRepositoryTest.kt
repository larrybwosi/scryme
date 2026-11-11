package tech.scryme.app

import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.SalesApiService
import tech.scryme.app.data.dto.MetricItemDto
import tech.scryme.app.data.dto.OrderItemDto
import tech.scryme.app.data.dto.OrderLineItemDto
import tech.scryme.app.data.dto.SalesAnalyticsDto
import tech.scryme.app.data.dto.V3ApiResponse
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.data.repository.SalesRepositoryImpl
import tech.scryme.app.domain.model.OrderStatus

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
        val mockAnalyticsDto = SalesAnalyticsDto(
            userName = "Admin",
            totalBalance = "150841.93",
            metrics = listOf(MetricItemDto("Customer", "24139", "27%", true)),
            recentTransactions = emptyList()
        )
        val apiResponse = V3ApiResponse(success = true, data = mockAnalyticsDto)
        coEvery { apiService.getAnalytics(any(), any()) } returns Response.success(apiResponse)

        val result = repository.getSalesAnalytics("2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z")

        assertTrue(result.isSuccess)
        val analytics = result.getOrNull()
        assertNotNull(analytics)
        assertEquals("Admin", analytics?.userName)
        assertEquals("$150,841.93", analytics?.totalBalance)
    }

    @Test
    fun getSalesAnalytics_error_returnsFailure() = runTest {
        coEvery { apiService.getAnalytics(any(), any()) } returns Response.error(500, okhttp3.ResponseBody.create(null, "Server error"))

        val result = repository.getSalesAnalytics()

        assertTrue(result.isFailure)
    }

    @Test
    fun getOrders_success_returnsOrderList() = runTest {
        val mockOrders = listOf(
            OrderItemDto(
                id = "ord_1",
                title = "TimeSync Smart Watch",
                itemCountText = "2 Items",
                timeText = "10:45 AM",
                status = "CONFIRMED",
                orderCode = "#TXN_10018",
                groupDate = "Today"
            )
        )
        val apiResponse = V3ApiResponse(success = true, data = mockOrders)
        coEvery { apiService.getOrders(any(), any(), any()) } returns Response.success(apiResponse)

        val result = repository.getOrders("Watch", "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z")

        assertTrue(result.isSuccess)
        val orders = result.getOrNull()
        assertEquals(1, orders?.size)
        assertEquals("TimeSync Smart Watch", orders?.first()?.title)
        assertEquals(OrderStatus.CONFIRMED, orders?.first()?.status)
    }

    @Test
    fun getOrderDetails_success_returnsPopulatedOrder() = runTest {
        val mockOrderDto = OrderItemDto(
            id = "ord_101",
            title = "TimeSync Smart Watch",
            itemCountText = "1 Item",
            timeText = "11:00 AM",
            status = "COMPLETED",
            orderCode = "#TXN_10018",
            groupDate = "Today",
            lineItems = listOf(
                OrderLineItemDto(
                    id = "li_1",
                    name = "TimeSync Smart Watch",
                    quantity = 1,
                    unitPrice = "$45.00",
                    totalPrice = "$45.00"
                )
            ),
            customerName = "Jane Doe"
        )
        val apiResponse = V3ApiResponse(success = true, data = mockOrderDto)
        coEvery { apiService.getOrderDetails("ord_101") } returns Response.success(apiResponse)

        val result = repository.getOrderDetails("ord_101")

        assertTrue(result.isSuccess)
        val order = result.getOrNull()
        assertNotNull(order)
        assertEquals("Jane Doe", order?.customerName)
        assertEquals(OrderStatus.FULFILLED, order?.status)
        assertEquals(1, order?.lineItems?.size)
    }
}
