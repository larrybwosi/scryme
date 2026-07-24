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
}
