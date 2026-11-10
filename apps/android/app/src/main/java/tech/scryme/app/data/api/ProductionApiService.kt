package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.app.data.dto.*

interface ProductionApiService {

    @GET("production/overview")
    suspend fun getOverview(): Response<V3ApiResponse<ProductionOverviewDto>>

    @GET("production/batches")
    suspend fun getBatches(
        @Query("status") status: String? = null,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<V3ApiResponse<List<ProductionBatchDto>>>

    @GET("production/batches/{id}")
    suspend fun getBatch(
        @Path("id") id: String
    ): Response<V3ApiResponse<ProductionBatchDto>>

    @GET("production/staged-batches")
    suspend fun getStagedBatches(): Response<V3ApiResponse<List<StagedBatchDto>>>

    @GET("production/quality-incidents")
    suspend fun getQualityIncidents(): Response<V3ApiResponse<List<QualityIncidentDto>>>

    @GET("production/operators")
    suspend fun getOperators(): Response<V3ApiResponse<List<ProductionOperatorDto>>>

    @GET("production/settings")
    suspend fun getSettings(): Response<V3ApiResponse<ProductionSettingsDto>>
}
