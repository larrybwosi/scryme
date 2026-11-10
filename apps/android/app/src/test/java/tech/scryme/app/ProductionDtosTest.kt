package tech.scryme.app

import org.junit.Assert.*
import org.junit.Test
import tech.scryme.app.data.dto.*

class ProductionDtosTest {

    @Test
    fun testProductionBatchDtoMapping() {
        val dto = ProductionBatchDto(
            id = "batch-1",
            batchNumber = "BAT-20261103-0001",
            recipeId = "recipe-1",
            recipe = RecipeSummaryDto(id = "recipe-1", name = "Artisan Sourdough"),
            plannedQuantity = 100.0,
            actualQuantity = 98.0,
            systemUnit = UnitSummaryDto(id = "unit-kg", name = "Kilogram", symbol = "kg"),
            runType = "MAKE_TO_STOCK",
            status = "COMPLETED",
            scheduledStartAt = "2026-11-03T08:00:00Z",
            completedAt = "2026-11-03T12:00:00Z",
            leadOperator = OperatorSummaryDto(
                id = "op-1",
                role = "Head Baker",
                member = MemberUserWrapperDto(
                    id = "m-1",
                    user = UserMinimalDto(id = "u-1", name = "Master Baker")
                )
            ),
            stagedQuantity = 98.0,
            dispatchedQuantity = 50.0,
            stagingStatus = "PARTIALLY_DISPATCHED"
        )

        val domain = dto.toDomain()
        assertEquals("batch-1", domain.id)
        assertEquals("BAT-20261103-0001", domain.batchNumber)
        assertEquals("Artisan Sourdough", domain.recipeName)
        assertEquals(100.0, domain.plannedQuantity, 0.001)
        assertEquals(98.0, domain.actualQuantity!!, 0.001)
        assertEquals("Kilogram", domain.unit)
        assertEquals("Master Baker", domain.leadOperatorName)
        assertEquals("PARTIALLY_DISPATCHED", domain.stagingStatus)
    }

    @Test
    fun testStagedBatchDtoMapping() {
        val dto = StagedBatchDto(
            id = "batch-2",
            batchNumber = "BAT-0002",
            recipe = RecipeSummaryDto("rec-2", "Croissants"),
            stagedQuantity = 50.0,
            dispatchedQuantity = 20.0,
            stagingStatus = "PARTIALLY_DISPATCHED",
            outputLocation = OutputLocationSummaryDto("loc-1", "Main Bakery Front")
        )

        val domain = dto.toDomain()
        assertEquals("batch-2", domain.id)
        assertEquals(50.0, domain.stagedQuantity, 0.001)
        assertEquals(20.0, domain.dispatchedQuantity, 0.001)
        assertEquals(30.0, domain.remainingQuantity, 0.001)
        assertEquals("Main Bakery Front", domain.outputLocationName)
    }

    @Test
    fun testQualityIncidentDtoMapping() {
        val dto = QualityIncidentDto(
            id = "qi-1",
            title = "Temperature deviation in oven #2",
            description = "Oven dropped by 15C during baking stage",
            severity = "high",
            status = "OPEN",
            batchId = "batch-1",
            batch = BatchMinimalDto(id = "batch-1", batchNumber = "BAT-0001"),
            reporter = MemberUserWrapperDto(
                id = "m-1",
                user = UserMinimalDto(id = "u-1", name = "Alice QA")
            ),
            createdAt = "2026-11-03T10:00:00Z"
        )

        val domain = dto.toDomain()
        assertEquals("qi-1", domain.id)
        assertEquals("Temperature deviation in oven #2", domain.title)
        assertEquals("high", domain.severity)
        assertEquals("BAT-0001", domain.batchNumber)
        assertEquals("Alice QA", domain.reporterName)
    }

    @Test
    fun testProductionSettingsDtoMapping() {
        val dto = ProductionSettingsDto(
            id = "settings-1",
            batchPrefix = "PROD",
            batchSeparator = "/",
            enableProductionStaging = true,
            autoApproveBatches = true,
            expiryWarningDays = 5,
            timezone = "Africa/Nairobi"
        )

        val domain = dto.toDomain()
        assertEquals("settings-1", domain.id)
        assertEquals("PROD", domain.batchPrefix)
        assertEquals("/", domain.batchSeparator)
        assertTrue(domain.enableProductionStaging)
        assertTrue(domain.autoApproveBatches)
        assertEquals(5, domain.expiryWarningDays)
        assertEquals("Africa/Nairobi", domain.timezone)
    }
}
