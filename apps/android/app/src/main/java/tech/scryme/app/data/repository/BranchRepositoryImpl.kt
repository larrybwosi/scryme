package tech.scryme.app.data.repository

import tech.scryme.app.data.api.BranchApiService
import tech.scryme.app.data.dto.BranchDto
import tech.scryme.app.data.dto.CreateBranchRequestDto
import tech.scryme.app.data.dto.UpdateBranchRequestDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchLocation
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
}
