package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query
import tech.scryme.app.data.dto.CustomerDto
import tech.scryme.app.data.dto.CustomerListResponseDto
import tech.scryme.app.data.dto.CustomerTransactionsResponseDto
import tech.scryme.app.data.dto.UpdateCustomerRequestDto
import tech.scryme.app.data.dto.V3ApiResponse

interface CustomerApiService {

    @GET("android/customers")
    suspend fun getCustomers(
        @Query("search") search: String? = null,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<V3ApiResponse<CustomerListResponseDto>>

    @GET("android/customers/{id}")
    suspend fun getCustomerDetails(
        @Path("id") id: String
    ): Response<V3ApiResponse<CustomerDto>>

    @GET("android/customers/{id}/transactions")
    suspend fun getCustomerTransactions(
        @Path("id") id: String,
        @Query("limit") limit: Int = 20
    ): Response<V3ApiResponse<CustomerTransactionsResponseDto>>

    @PATCH("android/customers/{id}")
    suspend fun updateCustomer(
        @Path("id") id: String,
        @Body request: UpdateCustomerRequestDto
    ): Response<V3ApiResponse<CustomerDto>>
}
