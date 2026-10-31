package tech.scryme.app

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.BranchApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.data.repository.BranchRepositoryImpl
import tech.scryme.app.domain.repository.BranchRepository

class BranchRepositoryTest {

    private lateinit var branchApiService: BranchApiService
    private lateinit var sessionManager: SessionManager
    private lateinit var repository: BranchRepository

    @Before
    fun setup() {
        branchApiService = mockk()
        sessionManager = mockk(relaxed = true)
        repository = BranchRepositoryImpl(branchApiService, sessionManager)
    }

    @Test
    fun getBranchDetails_success() = runTest {
        val dto = BranchDto(
            id = "loc-1",
            name = "Main Branch",
            code = "MAIN01",
            address = "123 High St",
            phone = "+254700000000",
            locationType = "STORE",
            latitude = -1.28,
            longitude = 36.81,
            geofenceRadiusMeters = 100.0,
            isDefault = true,
            isActive = true
        )
        val apiResponse = V3ApiResponse(success = true, data = dto)
        coEvery { branchApiService.getBranchDetails("loc-1") } returns Response.success(apiResponse)

        val result = repository.getBranchDetails("org-slug", "loc-1")
        assertTrue(result.isSuccess)
        val branch = result.getOrNull()
        assertEquals("Main Branch", branch?.name)
        assertEquals("MAIN01", branch?.code)
        assertEquals(-1.28, branch?.latitude)
    }

    @Test
    fun getBranchActivity_success() = runTest {
        val activityDto = BranchActivityDto(
            id = "act-1",
            memberId = "mem-1",
            memberName = "Bob",
            checkInTime = "2026-10-31T08:00:00Z",
            shiftStatus = "ON_TIME",
            isLocationVerified = true,
            distanceMeters = 12.0
        )
        val apiResponse = V3ApiResponse(success = true, data = BranchActivityResponseDto(listOf(activityDto)))
        coEvery { branchApiService.getBranchActivity("loc-1", 20) } returns Response.success(apiResponse)

        val result = repository.getBranchActivity("org-slug", "loc-1")
        assertTrue(result.isSuccess)
        val list = result.getOrNull()
        assertEquals(1, list?.size)
        assertEquals("Bob", list?.first()?.memberName)
        assertTrue(list?.first()?.isLocationVerified == true)
    }

    @Test
    fun getBranchSales_success() = runTest {
        val saleDto = BranchSaleDto(
            id = "tx-1",
            transactionNumber = "TX123456",
            totalAmount = 250.0,
            currencyCode = "KES",
            customerName = "Jane Doe",
            cashierName = "Cashier John",
            status = "COMPLETED",
            createdAt = "2026-10-31T10:00:00Z"
        )
        val apiResponse = V3ApiResponse(success = true, data = BranchSalesResponseDto(listOf(saleDto)))
        coEvery { branchApiService.getBranchSales("loc-1", 20) } returns Response.success(apiResponse)

        val result = repository.getBranchSales("org-slug", "loc-1")
        assertTrue(result.isSuccess)
        val list = result.getOrNull()
        assertEquals(1, list?.size)
        assertEquals(250.0, list?.first()?.totalAmount ?: 0.0, 0.01)
        assertEquals("KES", list?.first()?.currencyCode)
    }

    @Test
    fun getBranchStockMovements_success() = runTest {
        val movDto = BranchStockMovementDto(
            id = "mov-1",
            variantName = "Baguette 400g",
            quantity = 20.0,
            movementType = "PURCHASE_RECEIPT",
            direction = "IN",
            performedBy = "Baker Sam",
            timestamp = "2026-10-31T06:00:00Z"
        )
        val apiResponse = V3ApiResponse(success = true, data = BranchStockMovementsResponseDto(listOf(movDto)))
        coEvery { branchApiService.getBranchStockMovements("loc-1", 20) } returns Response.success(apiResponse)

        val result = repository.getBranchStockMovements("org-slug", "loc-1")
        assertTrue(result.isSuccess)
        val list = result.getOrNull()
        assertEquals(1, list?.size)
        assertEquals("Baguette 400g", list?.first()?.variantName)
        assertEquals("IN", list?.first()?.direction)
    }

    @Test
    fun switchActiveBranch_callsSessionManager() = runTest {
        repository.switchActiveBranch("loc-99")
        coVerify { sessionManager.updateLocationId("loc-99") }
    }
}
