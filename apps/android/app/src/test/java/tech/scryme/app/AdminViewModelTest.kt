package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.ui.admin.AdminUiState
import tech.scryme.app.ui.admin.AdminViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class AdminViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val scheduleRepository = mockk<ScheduleRepository>()
    private val profileRepository = mockk<ProfileRepository>()
    private val sessionManager = mockk<SessionManager>()
    private lateinit var viewModel: AdminViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = AdminViewModel(scheduleRepository, profileRepository, sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadAdminData_success_populatesMembersAndShifts() = runTest {
        val members = listOf(
            UserProfile(
                id = "m1",
                organizationId = "org1",
                userId = "u1",
                name = "Alice",
                email = "alice@example.com",
                phone = null,
                role = "Manager",
                status = "ONLINE",
                isActive = true,
                avatarUrl = "https://example.com/avatar.png"
            )
        )

        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { scheduleRepository.getOrganizationShifts("scryme-org") } returns Result.success(emptyList())
        coEvery { scheduleRepository.getShiftTrades("scryme-org", status = "PENDING") } returns Result.success(emptyList())
        coEvery { scheduleRepository.getStaffTasks("scryme-org") } returns Result.success(emptyList())
        coEvery { profileRepository.getMembers(any()) } returns Result.success(members)

        viewModel.loadAdminData()
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue("Expected Success state but was $state", state is AdminUiState.Success)
        val successState = state as AdminUiState.Success
        assertEquals(1, successState.members.size)
        assertEquals("Alice", successState.members[0].name)
    }
}
