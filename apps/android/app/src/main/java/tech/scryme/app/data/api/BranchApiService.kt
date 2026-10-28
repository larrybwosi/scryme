package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import tech.scryme.app.data.dto.BranchDto
import tech.scryme.app.data.dto.BranchListResponseDto
import tech.scryme.app.data.dto.UpdateBranchCoordinatesDto
import tech.scryme.app.data.dto.V3ApiResponse

interface BranchApiService {

    @GET("android/branches/locations")
    suspend fun getBranchLocations(): Response<V3ApiResponse<BranchListResponseDto>>

    @GET("android/branches/locations/{id}")
    suspend fun getBranchDetails(
        @Path("id") id: String
    ): Response<V3ApiResponse<BranchDto>>

    @PATCH("android/branches/locations/{id}/coordinates")
    suspend fun updateBranchCoordinates(
        @Path("id") id: String,
        @Body dto: UpdateBranchCoordinatesDto
    ): Response<V3ApiResponse<BranchDto>>
}
