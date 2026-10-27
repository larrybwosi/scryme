package tech.scryme.app.domain.repository

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
}
