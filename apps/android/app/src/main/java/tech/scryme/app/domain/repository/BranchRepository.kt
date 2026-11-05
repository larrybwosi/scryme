package tech.scryme.app.domain.repository

import tech.scryme.app.data.dto.CreateBranchRequestDto
import tech.scryme.app.data.dto.UpdateBranchRequestDto
import tech.scryme.app.domain.model.BranchActivityItem
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.model.BranchSaleItem
import tech.scryme.app.domain.model.BranchStockMovementItem

interface BranchRepository {
    suspend fun getBranchLocations(orgSlug: String): Result<List<BranchLocation>>
    suspend fun getBranchDetails(orgSlug: String, locationId: String): Result<BranchLocation>
    suspend fun getBranchActivity(orgSlug: String, locationId: String): Result<List<BranchActivityItem>>
    suspend fun getBranchSales(orgSlug: String, locationId: String): Result<List<BranchSaleItem>>
    suspend fun getBranchStockMovements(orgSlug: String, locationId: String): Result<List<BranchStockMovementItem>>
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
