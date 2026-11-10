package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName
import tech.scryme.app.domain.model.*

data class ProductionBatchDto(
    @SerializedName("id") val id: String,
    @SerializedName("batchNumber") val batchNumber: String,
    @SerializedName("recipeId") val recipeId: String,
    @SerializedName("recipe") val recipe: RecipeSummaryDto? = null,
    @SerializedName("plannedQuantity") val plannedQuantity: Double,
    @SerializedName("actualQuantity") val actualQuantity: Double? = null,
    @SerializedName("systemUnit") val systemUnit: UnitSummaryDto? = null,
    @SerializedName("orgUnit") val orgUnit: UnitSummaryDto? = null,
    @SerializedName("runType") val runType: String? = null,
    @SerializedName("orderReference") val orderReference: String? = null,
    @SerializedName("status") val status: String,
    @SerializedName("scheduledStartAt") val scheduledStartAt: String,
    @SerializedName("startedAt") val startedAt: String? = null,
    @SerializedName("completedAt") val completedAt: String? = null,
    @SerializedName("duration") val duration: Int? = null,
    @SerializedName("leadOperator") val leadOperator: OperatorSummaryDto? = null,
    @SerializedName("leadBaker") val leadBaker: OperatorSummaryDto? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("expirationStatus") val expirationStatus: String? = null,
    @SerializedName("expiresAt") val expiresAt: String? = null,
    @SerializedName("qcData") val qcData: Any? = null,
    @SerializedName("wasteQuantity") val wasteQuantity: Double? = null,
    @SerializedName("wasteReason") val wasteReason: String? = null,
    @SerializedName("stagedQuantity") val stagedQuantity: Double? = null,
    @SerializedName("dispatchedQuantity") val dispatchedQuantity: Double? = null,
    @SerializedName("stagingStatus") val stagingStatus: String? = null
) {
    fun toDomain(): ProductionBatch {
        val operatorName = leadOperator?.member?.user?.name
            ?: leadBaker?.member?.user?.name
            ?: leadOperator?.role
            ?: leadBaker?.role
        val unitName = systemUnit?.name ?: orgUnit?.name

        return ProductionBatch(
            id = id,
            batchNumber = batchNumber,
            recipeId = recipeId,
            recipeName = recipe?.name ?: "Recipe #$batchNumber",
            plannedQuantity = plannedQuantity,
            actualQuantity = actualQuantity,
            unit = unitName,
            runType = runType ?: "MAKE_TO_STOCK",
            orderReference = orderReference,
            status = status,
            scheduledStartAt = scheduledStartAt,
            startedAt = startedAt,
            completedAt = completedAt,
            durationMinutes = duration,
            leadOperatorName = operatorName,
            notes = notes,
            expirationStatus = expirationStatus,
            expiresAt = expiresAt,
            qcData = qcData?.toString(),
            wasteQuantity = wasteQuantity,
            wasteReason = wasteReason,
            stagedQuantity = stagedQuantity,
            dispatchedQuantity = dispatchedQuantity,
            stagingStatus = stagingStatus
        )
    }
}

data class RecipeSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String
)

data class UnitSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("symbol") val symbol: String? = null
)

data class OperatorSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("role") val role: String? = null,
    @SerializedName("member") val member: MemberUserWrapperDto? = null
)

data class MemberUserWrapperDto(
    @SerializedName("id") val id: String,
    @SerializedName("user") val user: UserMinimalDto? = null
)

data class UserMinimalDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("image") val image: String? = null
)

data class StagedBatchDto(
    @SerializedName("id") val id: String,
    @SerializedName("batchNumber") val batchNumber: String,
    @SerializedName("recipe") val recipe: RecipeSummaryDto? = null,
    @SerializedName("stagedQuantity") val stagedQuantity: Double? = null,
    @SerializedName("dispatchedQuantity") val dispatchedQuantity: Double? = null,
    @SerializedName("stagingStatus") val stagingStatus: String? = null,
    @SerializedName("outputLocation") val outputLocation: OutputLocationSummaryDto? = null,
    @SerializedName("completedAt") val completedAt: String? = null
) {
    fun toDomain(): StagedBatch {
        val staged = stagedQuantity ?: 0.0
        val dispatched = dispatchedQuantity ?: 0.0
        val remaining = (staged - dispatched).coerceAtLeast(0.0)

        return StagedBatch(
            id = id,
            batchNumber = batchNumber,
            recipeName = recipe?.name ?: "Batch #$batchNumber",
            stagedQuantity = staged,
            dispatchedQuantity = dispatched,
            remainingQuantity = remaining,
            stagingStatus = stagingStatus ?: "STAGED",
            outputLocationName = outputLocation?.name,
            completedAt = completedAt
        )
    }
}

data class OutputLocationSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String
)

data class QualityIncidentDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("severity") val severity: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("batchId") val batchId: String? = null,
    @SerializedName("batch") val batch: BatchMinimalDto? = null,
    @SerializedName("reporter") val reporter: MemberUserWrapperDto? = null,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String? = null
) {
    fun toDomain(): QualityIncident {
        return QualityIncident(
            id = id,
            title = title,
            description = description,
            severity = severity ?: "medium",
            status = status ?: "OPEN",
            batchId = batchId ?: batch?.id,
            batchNumber = batch?.batchNumber,
            reporterName = reporter?.user?.name,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}

data class BatchMinimalDto(
    @SerializedName("id") val id: String,
    @SerializedName("batchNumber") val batchNumber: String
)

data class ProductionOperatorDto(
    @SerializedName("id") val id: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("role") val role: String? = null,
    @SerializedName("specialties") val specialties: List<String>? = null,
    @SerializedName("isActive") val isActive: Boolean? = true,
    @SerializedName("member") val member: MemberUserWrapperDto? = null
) {
    fun toDomain(): ProductionOperator {
        return ProductionOperator(
            id = id,
            memberId = memberId,
            name = member?.user?.name ?: "Operator $id",
            email = member?.user?.email,
            role = role,
            specialties = specialties ?: emptyList(),
            isDefault = false,
            isActive = isActive ?: true,
            avatarUrl = member?.user?.image
        )
    }
}

data class ProductionSettingsDto(
    @SerializedName("id") val id: String,
    @SerializedName("defaultOperatorId") val defaultOperatorId: String? = null,
    @SerializedName("autoCreateDailyBatches") val autoCreateDailyBatches: Boolean? = false,
    @SerializedName("expiryWarningDays") val expiryWarningDays: Int? = 3,
    @SerializedName("authMode") val authMode: String? = "CARD_PIN",
    @SerializedName("batchPrefix") val batchPrefix: String? = "BAT",
    @SerializedName("batchSeparator") val batchSeparator: String? = "-",
    @SerializedName("batchDateFormat") val batchDateFormat: String? = "YYYYMMDD",
    @SerializedName("batchSequence") val batchSequence: String? = "4",
    @SerializedName("batchGenerationType") val batchGenerationType: String? = "SEQUENCE",
    @SerializedName("enableProductionStaging") val enableProductionStaging: Boolean? = false,
    @SerializedName("autoApproveBatches") val autoApproveBatches: Boolean? = false,
    @SerializedName("lowStockAlerts") val lowStockAlerts: Boolean? = true,
    @SerializedName("timezone") val timezone: String? = "UTC",
    @SerializedName("scrymeReportEnabled") val scrymeReportEnabled: Boolean? = false,
    @SerializedName("scrymeReportDay") val scrymeReportDay: Int? = 1,
    @SerializedName("scrymeReportTime") val scrymeReportTime: String? = "08:00"
) {
    fun toDomain(): ProductionSettings {
        return ProductionSettings(
            id = id,
            defaultOperatorId = defaultOperatorId,
            autoCreateDailyBatches = autoCreateDailyBatches ?: false,
            expiryWarningDays = expiryWarningDays ?: 3,
            authMode = authMode ?: "CARD_PIN",
            batchPrefix = batchPrefix ?: "BAT",
            batchSeparator = batchSeparator ?: "-",
            batchDateFormat = batchDateFormat ?: "YYYYMMDD",
            batchSequence = batchSequence ?: "4",
            batchGenerationType = batchGenerationType ?: "SEQUENCE",
            enableProductionStaging = enableProductionStaging ?: false,
            autoApproveBatches = autoApproveBatches ?: false,
            lowStockAlerts = lowStockAlerts ?: true,
            timezone = timezone ?: "UTC",
            scrymeReportEnabled = scrymeReportEnabled ?: false,
            scrymeReportDay = scrymeReportDay ?: 1,
            scrymeReportTime = scrymeReportTime ?: "08:00"
        )
    }
}

data class ProductionOverviewDto(
    @SerializedName("activeBatches") val activeBatches: Int? = 0,
    @SerializedName("completedToday") val completedToday: Int? = 0,
    @SerializedName("stagedBatches") val stagedBatches: Int? = 0,
    @SerializedName("openIncidents") val openIncidents: Int? = 0,
    @SerializedName("totalOperators") val totalOperators: Int? = 0
) {
    fun toDomain(): ProductionOverview {
        return ProductionOverview(
            activeBatchesCount = activeBatches ?: 0,
            completedTodayCount = completedToday ?: 0,
            stagedBatchesCount = stagedBatches ?: 0,
            openIncidentsCount = openIncidents ?: 0,
            totalOperatorsCount = totalOperators ?: 0
        )
    }
}
