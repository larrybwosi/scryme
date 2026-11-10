package tech.scryme.app.domain.repository

import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.SalesAnalytics

interface SalesRepository {
    suspend fun getSalesAnalytics(
        startDate: String? = null,
        endDate: String? = null
    ): Result<SalesAnalytics>

    suspend fun getOrders(
        query: String? = null,
        startDate: String? = null,
        endDate: String? = null
    ): Result<List<OrderItem>>

    suspend fun getOrderDetails(orderId: String): Result<OrderItem>
}
