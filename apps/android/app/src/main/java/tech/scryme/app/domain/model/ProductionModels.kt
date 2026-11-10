package tech.scryme.app.domain.model

data class ProductionBatch(
    val id: String,
    val batchNumber: String,
    val recipeId: String,
    val recipeName: String,
    val plannedQuantity: Double,
    val actualQuantity: Double?,
    val unit: String?,
    val runType: String, // MAKE_TO_STOCK, ON_DEMAND
    val orderReference: String?,
    val status: String, // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    val scheduledStartAt: String,
    val startedAt: String?,
    val completedAt: String?,
    val durationMinutes: Int?,
    val leadOperatorName: String?,
    val notes: String?,
    val expirationStatus: String?,
    val expiresAt: String?,
    val qcData: String?,
    val wasteQuantity: Double?,
    val wasteReason: String?,
    val stagedQuantity: Double?,
    val dispatchedQuantity: Double?,
    val stagingStatus: String?
)

data class StagedBatch(
    val id: String,
    val batchNumber: String,
    val recipeName: String,
    val stagedQuantity: Double,
    val dispatchedQuantity: Double,
    val remainingQuantity: Double,
    val stagingStatus: String,
    val outputLocationName: String?,
    val completedAt: String?
)

data class QualityIncident(
    val id: String,
    val title: String,
    val description: String?,
    val severity: String, // low, medium, high, critical
    val status: String, // OPEN, INVESTIGATING, RESOLVED, CLOSED
    val batchId: String?,
    val batchNumber: String?,
    val reporterName: String?,
    val createdAt: String,
    val updatedAt: String?
)

data class ProductionOperator(
    val id: String,
    val memberId: String,
    val name: String,
    val email: String?,
    val role: String?,
    val specialties: List<String>,
    val isDefault: Boolean,
    val isActive: Boolean,
    val avatarUrl: String?
)

data class ProductionSettings(
    val id: String,
    val defaultOperatorId: String?,
    val autoCreateDailyBatches: Boolean,
    val expiryWarningDays: Int,
    val authMode: String,
    val batchPrefix: String,
    val batchSeparator: String,
    val batchDateFormat: String,
    val batchSequence: String,
    val batchGenerationType: String,
    val enableProductionStaging: Boolean,
    val autoApproveBatches: Boolean,
    val lowStockAlerts: Boolean,
    val timezone: String,
    val scrymeReportEnabled: Boolean,
    val scrymeReportDay: Int,
    val scrymeReportTime: String
)

data class ProductionOverview(
    val activeBatchesCount: Int,
    val completedTodayCount: Int,
    val stagedBatchesCount: Int,
    val openIncidentsCount: Int,
    val totalOperatorsCount: Int
)
