package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.ProductionApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.data.repository.ProductionRepositoryImpl

class ProductionRepositoryTest {

    private val apiService = mockk<ProductionApiService>()
    private val sessionManager = mockk<SessionManager>()
    private lateinit var repository: ProductionRepositoryImpl

    @Before
    fun setUp() {
        repository = ProductionRepositoryImpl(apiService, sessionManager)
    }

    @Test
    fun getBatches_success() = runTest {
        val dtos = listOf(
            ProductionBatchDto(
                id = "b1",
                batchNumber = "BAT-001",
                recipeId = "r1",
                recipe = RecipeSummaryDto("r1", "Baguette"),
                plannedQuantity = 50.0,
                status = "IN_PROGRESS",
                scheduledStartAt = "2026-11-03T09:00:00Z"
            )
        )
        val apiResponse = V3ApiResponse(success = true, data = dtos)
        coEvery { apiService.getBatches(any(), any(), any()) } returns Response.success(apiResponse)

        val result = repository.getBatches("IN_PROGRESS")
        assertTrue(result.isSuccess)
        val batches = result.getOrNull()!!
        assertEquals(1, batches.size)
        assertEquals("BAT-001", batches[0].batchNumber)
        assertEquals("Baguette", batches[0].recipeName)
    }

    @Test
    fun getBatches_error() = runTest {
        coEvery { apiService.getBatches(any(), any(), any()) } returns Response.error(
            500,
            "Internal Server Error".toResponseBody("application/json".toMediaTypeOrNull())
        )

        val result = repository.getBatches()
        assertTrue(result.isFailure)
    }

    @Test
    fun getStagedBatches_success() = runTest {
        val dtos = listOf(
            StagedBatchDto(
                id = "b1",
                batchNumber = "BAT-001",
                stagedQuantity = 100.0,
                dispatchedQuantity = 40.0,
                stagingStatus = "PARTIALLY_DISPATCHED"
            )
        )
        val apiResponse = V3ApiResponse(success = true, data = dtos)
        coEvery { apiService.getStagedBatches() } returns Response.success(apiResponse)

        val result = repository.getStagedBatches()
        assertTrue(result.isSuccess)
        val staged = result.getOrNull()!!
        assertEquals(1, staged.size)
        assertEquals(60.0, staged[0].remainingQuantity, 0.001)
    }

    @Test
    fun getSettings_success() = runTest {
        val settingsDto = ProductionSettingsDto(
            id = "set-1",
            batchPrefix = "LOT",
            timezone = "UTC"
        )
        val apiResponse = V3ApiResponse(success = true, data = settingsDto)
        coEvery { apiService.getSettings() } returns Response.success(apiResponse)

        val result = repository.getSettings()
        assertTrue(result.isSuccess)
        val settings = result.getOrNull()!!
        assertEquals("LOT", settings.batchPrefix)
        assertEquals("UTC", settings.timezone)
    }
}
