package tech.scryme.app.data.repository

import tech.scryme.app.data.api.BranchApiService
import tech.scryme.app.data.dto.BranchDto
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
            val res = branchApiService.getBranchLocations(orgSlug)
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
            val res = branchApiService.getBranchDetails(orgSlug, locationId)
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

    private fun BranchDto.toDomain() = BranchLocation(
        id = id,
        name = name,
        code = code,
        address = address,
        locationType = locationType ?: "STORE",
        isDefault = isDefault,
        isActive = isActive
    )
}
