package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query
import tech.scryme.app.data.dto.OrderItemDto
import tech.scryme.app.data.dto.SalesAnalyticsDto
import tech.scryme.app.data.dto.V3ApiResponse

interface SalesApiService {
    @GET("sales/analytics")
    suspend fun getAnalytics(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<V3ApiResponse<SalesAnalyticsDto>>

    @GET("sales/orders")
    suspend fun getOrders(
        @Query("query") query: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<V3ApiResponse<List<OrderItemDto>>>

    @GET("sales/orders/{id}")
    suspend fun getOrderDetails(
        @Path("id") id: String
    ): Response<V3ApiResponse<OrderItemDto>>
}
