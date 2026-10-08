package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query
import tech.scryme.app.data.dto.V3ApiResponse
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.SalesAnalytics

interface SalesApiService {
    @GET("sales/analytics")
    suspend fun getAnalytics(): Response<V3ApiResponse<SalesAnalytics>>

    @GET("sales/orders")
    suspend fun getOrders(
        @Query("query") query: String? = null
    ): Response<V3ApiResponse<List<OrderItem>>>
}
