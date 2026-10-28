package tech.scryme.app.domain.repository

import tech.scryme.app.data.dto.CreateBranchRequestDto
import tech.scryme.app.data.dto.UpdateBranchRequestDto
import tech.scryme.app.domain.model.BranchLocation

interface BranchRepository {
    suspend fun getBranchLocations(orgSlug: String): Result<List<BranchLocation>>
    suspend fun getBranchDetails(orgSlug: String, locationId: String): Result<BranchLocation>
    suspend fun updateBranchCoordinates(
        orgSlug: String,
        locationId: String,
        latitude: Double,
        longitude: Double
    ): Result<BranchLocation>
    suspend fun switchActiveBranch(locationId: String)
    suspend fun createBranch(request: CreateBranchRequestDto): Result<BranchLocation>
    suspend fun updateBranch(locationId: String, request: UpdateBranchRequestDto): Result<BranchLocation>
    suspend fun deleteBranch(locationId: String): Result<Unit>
}
