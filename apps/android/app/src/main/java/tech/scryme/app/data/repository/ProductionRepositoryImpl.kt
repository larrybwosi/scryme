package tech.scryme.app.data.repository

import tech.scryme.app.data.api.ProductionApiService
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.*
import tech.scryme.app.domain.repository.ProductionRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductionRepositoryImpl @Inject constructor(
    private val productionApiService: ProductionApiService,
    private val sessionManager: SessionManager
) : ProductionRepository {

    override suspend fun getOverview(): Result<ProductionOverview> {
        return try {
            val res = productionApiService.getOverview()
            if (res.isSuccessful && res.body()?.success == true) {
                val overview = res.body()?.data?.toDomain()
                    ?: ProductionOverview(0, 0, 0, 0, 0)
                Result.success(overview)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBatches(status: String?): Result<List<ProductionBatch>> {
        return try {
            val res = productionApiService.getBatches(status = status)
            if (res.isSuccessful && res.body()?.success == true) {
                val batches = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(batches)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getBatchDetails(batchId: String): Result<ProductionBatch> {
        return try {
            val res = productionApiService.getBatch(batchId)
            if (res.isSuccessful && res.body()?.success == true) {
                val batch = res.body()?.data?.toDomain()
                    ?: return Result.failure(Exception("Batch details not found"))
                Result.success(batch)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getStagedBatches(): Result<List<StagedBatch>> {
        return try {
            val res = productionApiService.getStagedBatches()
            if (res.isSuccessful && res.body()?.success == true) {
                val staged = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(staged)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getQualityIncidents(): Result<List<QualityIncident>> {
        return try {
            val res = productionApiService.getQualityIncidents()
            if (res.isSuccessful && res.body()?.success == true) {
                val incidents = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(incidents)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getOperators(): Result<List<ProductionOperator>> {
        return try {
            val res = productionApiService.getOperators()
            if (res.isSuccessful && res.body()?.success == true) {
                val operators = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(operators)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getSettings(): Result<ProductionSettings> {
        return try {
            val res = productionApiService.getSettings()
            if (res.isSuccessful && res.body()?.success == true) {
                val settings = res.body()?.data?.toDomain()
                    ?: return Result.failure(Exception("Production settings not found"))
                Result.success(settings)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
