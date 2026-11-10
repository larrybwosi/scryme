package tech.scryme.app.domain.repository

import tech.scryme.app.domain.model.*

interface ProductionRepository {
    suspend fun getOverview(): Result<ProductionOverview>
    suspend fun getBatches(status: String? = null): Result<List<ProductionBatch>>
    suspend fun getBatchDetails(batchId: String): Result<ProductionBatch>
    suspend fun getStagedBatches(): Result<List<StagedBatch>>
    suspend fun getQualityIncidents(): Result<List<QualityIncident>>
    suspend fun getOperators(): Result<List<ProductionOperator>>
    suspend fun getSettings(): Result<ProductionSettings>
}
