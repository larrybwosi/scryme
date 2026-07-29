package tech.scryme.admin.presentation.viewmodel

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.PresenceRepository

@OptIn(ExperimentalCoroutinesApi::class)
class PresenceViewModelTest {

    private val repository = mockk<PresenceRepository>()
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var viewModel: PresenceViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { repository.monitorActivePresence(any()) } returns flowOf(emptyList())
        viewModel = PresenceViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `fetchCheckedInMembers success updates state to Success with members list`() = runTest(testDispatcher) {
        val members = listOf(
            MemberResponseDto(
                id = "mem_1",
                user = UserSummaryDto("u1", "johndoe@scryme.tech", "John Doe"),
                role = MemberRole.EMPLOYEE,
                membershipStatus = MembershipStatus.ACTIVE,
                isActive = true,
                status = PresenceStatus.ONLINE,
                createdAt = "2024-10-27T10:00:00Z",
                updatedAt = "2024-10-27T10:00:00Z"
            )
        )

        coEvery { repository.getMembers(status = "ONLINE", search = null) } coAnswers {
            delay(100)
            Result.success(members)
        }

        viewModel.fetchCheckedInMembers()

        runCurrent()
        assertEquals(UiState.Loading, viewModel.presenceState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.presenceState.value is UiState.Success)
        assertEquals(members, (viewModel.presenceState.value as UiState.Success).data)
    }

    @Test
    fun `forceCheckoutMember performs checkout and triggers list refresh`() = runTest(testDispatcher) {
        coEvery { repository.adminCheckOut("mem_1", any(), any()) } returns Result.success(mockk())
        coEvery { repository.getMembers(status = "ONLINE", search = null) } returns Result.success(emptyList())

        viewModel.forceCheckoutMember("mem_1", "Forgot checkout")

        runCurrent()

        coVerify { repository.adminCheckOut("mem_1", any(), any()) }
        coVerify { repository.getMembers(status = "ONLINE", search = null) }
    }

    @Test
    fun `addBranch successfully appends the branch to the state-driven list`() = runTest(testDispatcher) {
        val initialSize = viewModel.branches.value.size
        assertEquals(3, initialSize)

        viewModel.addBranch("West Counter", "WEST_01", "RETAIL_SHOP")

        val updatedBranches = viewModel.branches.value
        assertEquals(4, updatedBranches.size)
        assertEquals("West Counter", updatedBranches.last().name)
        assertEquals("loc_4", updatedBranches.last().id)
        assertTrue(updatedBranches.last().isActive)
    }

    @Test
    fun `toggleBranchStatus correctly updates its active state`() = runTest(testDispatcher) {
        // Initially active
        val firstBranch = viewModel.branches.value.first { it.id == "loc_1" }
        assertTrue(firstBranch.isActive)

        // Deactivate
        viewModel.toggleBranchStatus("loc_1")
        var updatedBranch = viewModel.branches.value.first { it.id == "loc_1" }
        assertEquals(false, updatedBranch.isActive)

        // Reactivate
        viewModel.toggleBranchStatus("loc_1")
        updatedBranch = viewModel.branches.value.first { it.id == "loc_1" }
        assertEquals(true, updatedBranch.isActive)
    }

    @Test
    fun `selectBranchForDetail updates states and fetches from API or triggers fallbacks`() = runTest(testDispatcher) {
        coEvery { repository.getAttendanceLogs(any(), any(), any(), eq("loc_1")) } returns Result.success(
            AttendanceLogsResponse(items = emptyList(), meta = PaginationMeta(0, 1, 10, 0))
        )
        coEvery { repository.getPettyCashTransactions(any()) } returns Result.success(emptyList())
        coEvery { repository.getTransactions(eq("loc_1"), any(), any()) } returns Result.success(emptyList())

        // Initial states
        assertEquals(null, viewModel.selectedBranchId.value)
        assertEquals(UiState.Idle, viewModel.branchAttendanceLogs.value)

        // Select branch
        viewModel.selectBranchForDetail("loc_1")
        assertEquals("loc_1", viewModel.selectedBranchId.value)

        runCurrent()

        // Wait for coroutines to execute
        advanceTimeBy(100)

        // Verify API was called
        coVerify { repository.getAttendanceLogs(any(), any(), any(), eq("loc_1")) }
        coVerify { repository.getPettyCashTransactions(any()) }
        coVerify { repository.getTransactions(eq("loc_1"), any(), any()) }

        // Fallbacks should be triggered as we returned empty lists
        assertTrue(viewModel.branchAttendanceLogs.value is UiState.Success)
        val logs = (viewModel.branchAttendanceLogs.value as UiState.Success).data
        assertTrue(logs.isNotEmpty())
        assertEquals("Sarah Connor", logs.first().member?.user?.name)

        assertTrue(viewModel.pettyCashTransactions.value is UiState.Success)
        val pcTxns = (viewModel.pettyCashTransactions.value as UiState.Success).data
        assertTrue(pcTxns.isNotEmpty())
        assertEquals("pc_1", pcTxns.first().id)

        assertEquals(1845.50, viewModel.branchSales.value, 0.01)
        assertEquals(3, viewModel.memberSalesList.value.size)
    }
}
