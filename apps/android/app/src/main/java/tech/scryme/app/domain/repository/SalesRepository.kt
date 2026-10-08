package tech.scryme.app.domain.repository

import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.SalesAnalytics

interface SalesRepository {
    suspend fun getSalesAnalytics(): Result<SalesAnalytics>
    suspend fun getOrders(query: String? = null): Result<List<OrderItem>>
}
