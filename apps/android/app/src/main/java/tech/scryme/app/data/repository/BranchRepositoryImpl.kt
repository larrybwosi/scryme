package tech.scryme.app.data.repository

import tech.scryme.app.data.api.BranchApiService
import tech.scryme.app.data.dto.BranchActivityDto
import tech.scryme.app.data.dto.BranchDto
import tech.scryme.app.data.dto.BranchSaleDto
import tech.scryme.app.data.dto.BranchStockMovementDto
import tech.scryme.app.data.dto.CreateBranchRequestDto
import tech.scryme.app.data.dto.UpdateBranchRequestDto
import tech.scryme.app.data.dto.UpdateBranchCoordinatesDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchActivityItem
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.model.BranchSaleItem
import tech.scryme.app.domain.model.BranchStockMovementItem
import tech.scryme.app.domain.repository.BranchRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BranchRepositoryImpl @Inject constructor(
    private val branchApiService: BranchApiService,
    private val sessionManager: SessionManager
) : BranchRepository {

    override suspend fun getBranchLocations(orgSlug: String): Result<List<BranchLocation>> {
        return try {
            val res = branchApiService.getBranchLocations()
            if (res.isSuccessful && res.body()?.success == true) {
                val locations = res.body()?.data?.locations?.map { it.toDomain() } ?: emptyList()
                Result.success(locations)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBranchDetails(
        orgSlug: String,
        locationId: String
    ): Result<BranchLocation> {
        return try {
            val res = branchApiService.getBranchDetails(locationId)
            if (res.isSuccessful && res.body()?.success == true) {
                val branch = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null branch response"))
                Result.success(branch)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBranchActivity(
        orgSlug: String,
        locationId: String
    ): Result<List<BranchActivityItem>> {
        return try {
            val res = branchApiService.getBranchActivity(locationId)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.activity?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBranchSales(
        orgSlug: String,
        locationId: String
    ): Result<List<BranchSaleItem>> {
        return try {
            val res = branchApiService.getBranchSales(locationId)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.sales?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBranchStockMovements(
        orgSlug: String,
        locationId: String
    ): Result<List<BranchStockMovementItem>> {
        return try {
            val res = branchApiService.getBranchStockMovements(locationId)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.movements?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateBranchCoordinates(
        orgSlug: String,
        locationId: String,
        latitude: Double,
        longitude: Double
    ): Result<BranchLocation> {
        return try {
            val dto = UpdateBranchCoordinatesDto(latitude = latitude, longitude = longitude)
            val res = branchApiService.updateBranchCoordinates(locationId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val branch = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null branch response"))
                Result.success(branch)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun switchActiveBranch(locationId: String) {
        sessionManager.updateLocationId(locationId)
    }

    override suspend fun createBranch(request: CreateBranchRequestDto): Result<BranchLocation> {
        return try {
            val res = branchApiService.createBranch(request)
            if (res.isSuccessful && res.body()?.success == true) {
                val branch = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null creation response"))
                Result.success(branch)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateBranch(
        locationId: String,
        request: UpdateBranchRequestDto
    ): Result<BranchLocation> {
        return try {
            val res = branchApiService.updateBranch(locationId, request)
            if (res.isSuccessful && res.body()?.success == true) {
                val branch = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null update response"))
                Result.success(branch)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteBranch(locationId: String): Result<Unit> {
        return try {
            val res = branchApiService.deleteBranch(locationId)
            if (res.isSuccessful && res.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun BranchDto.toDomain() = BranchLocation(
        id = id,
        name = name,
        code = code,
        address = address,
        phone = phone,
        locationType = locationType ?: "STORE",
        latitude = latitude,
        longitude = longitude,
        geofenceRadiusMeters = geofenceRadiusMeters ?: 100.0,
        isDefault = isDefault,
        isActive = isActive
    )

    private fun BranchActivityDto.toDomain() = BranchActivityItem(
        id = id,
        memberId = memberId,
        memberName = memberName,
        memberAvatar = memberAvatar,
        checkInTime = checkInTime,
        checkOutTime = checkOutTime,
        shiftStatus = shiftStatus ?: "UNSCHEDULED",
        verificationMethod = verificationMethod,
        isLocationVerified = isLocationVerified,
        distanceMeters = distanceMeters,
        notes = notes
    )

    private fun BranchSaleDto.toDomain() = BranchSaleItem(
        id = id,
        transactionNumber = transactionNumber,
        totalAmount = totalAmount,
        currencyCode = currencyCode ?: "USD",
        customerName = customerName ?: "Walk-in Customer",
        cashierName = cashierName ?: "Staff",
        status = status ?: "CONFIRMED",
        createdAt = createdAt
    )

    private fun BranchStockMovementDto.toDomain() = BranchStockMovementItem(
        id = id,
        variantName = variantName,
        quantity = quantity,
        movementType = movementType,
        direction = direction,
        fromLocationName = fromLocationName,
        toLocationName = toLocationName,
        performedBy = performedBy ?: "Staff",
        timestamp = timestamp,
        notes = notes
    )
}
