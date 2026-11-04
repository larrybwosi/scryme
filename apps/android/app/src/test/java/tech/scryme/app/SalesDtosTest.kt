package tech.scryme.app

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test
import tech.scryme.app.data.dto.OrderItemDto
import tech.scryme.app.data.dto.SalesAnalyticsDto
import tech.scryme.app.domain.model.OrderStatus

class SalesDtosTest {

    private val gson = Gson()

    @Test
    fun orderItemDto_deserializesNullListsSafelyWithoutNPE() {
        // Missing lineItems, status, customerName etc
        val json = """
            {
               "id": "ord_99",
               "title": "Minimal Order",
               "orderCode": "#TXN_99"
            }
        """.trimIndent()

        val dto = gson.fromJson(json, OrderItemDto::class.java)
        assertNotNull(dto)

        val domain = dto.toDomain()
        assertNotNull(domain.lineItems)
        assertTrue(domain.lineItems.isEmpty()) // Does NOT throw NPE!
        assertEquals("Minimal Order", domain.title)
        assertEquals(OrderStatus.CONFIRMED, domain.status)
        assertEquals("#TXN_99", domain.orderCode)
    }

    @Test
    fun salesAnalyticsDto_deserializesNullListsSafelyWithoutNPE() {
        val json = """
            {
               "userName": "Owner",
               "totalBalance": "1200.50"
            }
        """.trimIndent()

        val dto = gson.fromJson(json, SalesAnalyticsDto::class.java)
        val domain = dto.toDomain()

        assertNotNull(domain.metrics)
        assertTrue(domain.metrics.isEmpty())
        assertNotNull(domain.recentTransactions)
        assertTrue(domain.recentTransactions.isEmpty())
    }
}
