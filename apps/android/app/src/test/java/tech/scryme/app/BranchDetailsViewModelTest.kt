package tech.scryme.app

import androidx.lifecycle.SavedStateHandle
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.MemberUserDto
import tech.scryme.app.data.dto.UserDetailDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchActivityItem
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.model.BranchSaleItem
import tech.scryme.app.domain.model.BranchStockMovementItem
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.ui.branch.BranchDetailsTab
import tech.scryme.app.ui.branch.BranchDetailsUiState
import tech.scryme.app.ui.branch.BranchDetailsViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class BranchDetailsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var branchRepository: BranchRepository
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionManager: SessionManager
    private lateinit var savedStateHandle: SavedStateHandle
    private lateinit var viewModel: BranchDetailsViewModel

    private val mockBranch = BranchLocation(
        id = "branch-1",
        name = "Westlands Flagship",
        code = "WEST01",
        address = "Parklands Rd",
        phone = "+254711111111",
        locationType = "STORE",
        latitude = -1.26,
        longitude = 36.80,
        geofenceRadiusMeters = 100.0,
        isDefault = true,
        isActive = true
    )

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        branchRepository = mockk(relaxed = true)
        authRepository = mockk(relaxed = true)
        sessionManager = mockk(relaxed = true)
        savedStateHandle = SavedStateHandle(mapOf("branchId" to "branch-1"))

        coEvery { sessionManager.getOrgSlug() } returns "my-org"
        coEvery { sessionManager.getLocationId() } returns "branch-1"
        coEvery { authRepository.validateSession() } returns Result.success(
            AndroidMeResponseDto(
                user = UserDetailDto(id = "u-1", email = "admin@example.com", name = "Admin User"),
                member = MemberUserDto(id = "m-1", role = "ADMIN")
            )
        )
        coEvery { branchRepository.getBranchDetails("my-org", "branch-1") } returns Result.success(mockBranch)

        viewModel = BranchDetailsViewModel(
            branchRepository,
            authRepository,
            sessionManager,
            savedStateHandle
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadBranchDetails_successSetsState() = runTest {
        viewModel.loadBranchDetails()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is BranchDetailsUiState.Success)
        val success = state as BranchDetailsUiState.Success
        assertEquals("Westlands Flagship", success.branch.name)
        assertTrue(success.isActive)
        assertTrue(success.isAdmin)
    }

    @Test
    fun onTabSelected_activityLoadsLogs() = runTest {
        val mockLogs = listOf(
            BranchActivityItem(
                id = "log-1",
                memberId = "mem-1",
                memberName = "Alice",
                memberAvatar = null,
                checkInTime = "2026-10-31T08:00:00Z",
                checkOutTime = null,
                shiftStatus = "ON_TIME",
                verificationMethod = "GPS",
                isLocationVerified = true,
                distanceMeters = 5.0,
                notes = null
            )
        )
        coEvery { branchRepository.getBranchActivity("my-org", "branch-1") } returns Result.success(mockLogs)

        viewModel.loadBranchDetails()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onTabSelected(BranchDetailsTab.ACTIVITY)
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as BranchDetailsUiState.Success
        assertEquals(BranchDetailsTab.ACTIVITY, state.selectedTab)
        assertEquals(1, state.activityLogs.size)
        assertEquals("Alice", state.activityLogs.first().memberName)
    }

    @Test
    fun onTabSelected_salesLoadsTransactions() = runTest {
        val mockSales = listOf(
            BranchSaleItem(
                id = "tx-1",
                transactionNumber = "TX888",
                totalAmount = 45.0,
                currencyCode = "USD",
                customerName = "Guest",
                cashierName = "Cashier Bob",
                status = "COMPLETED",
                createdAt = "2026-10-31T11:00:00Z"
            )
        )
        coEvery { branchRepository.getBranchSales("my-org", "branch-1") } returns Result.success(mockSales)

        viewModel.loadBranchDetails()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onTabSelected(BranchDetailsTab.SALES)
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as BranchDetailsUiState.Success
        assertEquals(BranchDetailsTab.SALES, state.selectedTab)
        assertEquals(1, state.sales.size)
        assertEquals("TX888", state.sales.first().transactionNumber)
    }

    @Test
    fun onTabSelected_stockMovementsLoadsData() = runTest {
        val mockMovements = listOf(
            BranchStockMovementItem(
                id = "mov-1",
                variantName = "Sourdough Bread",
                quantity = 15.0,
                movementType = "SALE",
                direction = "OUT",
                fromLocationName = "Westlands Flagship",
                toLocationName = null,
                performedBy = "Cashier Bob",
                timestamp = "2026-10-31T12:00:00Z",
                notes = null
            )
        )
        coEvery { branchRepository.getBranchStockMovements("my-org", "branch-1") } returns Result.success(mockMovements)

        viewModel.loadBranchDetails()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.onTabSelected(BranchDetailsTab.STOCK_MOVEMENTS)
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as BranchDetailsUiState.Success
        assertEquals(BranchDetailsTab.STOCK_MOVEMENTS, state.selectedTab)
        assertEquals(1, state.stockMovements.size)
        assertEquals("Sourdough Bread", state.stockMovements.first().variantName)
    }

    @Test
    fun switchActiveBranch_callsRepository() = runTest {
        viewModel.switchActiveBranch()
        testDispatcher.scheduler.advanceUntilIdle()

        coVerify { branchRepository.switchActiveBranch("branch-1") }
    }
}
