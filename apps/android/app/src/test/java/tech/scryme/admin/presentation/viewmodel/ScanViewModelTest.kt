package tech.scryme.admin.presentation.viewmodel

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.PresenceRepository

@OptIn(ExperimentalCoroutinesApi::class)
class ScanViewModelTest {

    private val repository = mockk<PresenceRepository>()
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var viewModel: ScanViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = ScanViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `processCardScan matching member successfully updates state to Success`() = runTest(testDispatcher) {
        val targetCardId = "CARD_123"
        val member = MemberResponseDto(
            id = "mem_abc",
            user = UserSummaryDto("u1", "scan@scryme.tech", "Alice Scan"),
            role = MemberRole.MANAGER,
            membershipStatus = MembershipStatus.ACTIVE,
            isActive = true,
            status = PresenceStatus.ONLINE,
            cardId = targetCardId,
            createdAt = "2024-10-27T10:00:00Z",
            updatedAt = "2024-10-27T10:00:00Z"
        )

        coEvery { repository.getMembers(search = targetCardId) } coAnswers {
            delay(100)
            Result.success(listOf(member))
        }

        viewModel.processCardScan(targetCardId)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.scanState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.scanState.value is UiState.Success)
        assertEquals(member, (viewModel.scanState.value as UiState.Success).data)
    }

    @Test
    fun `processCardScan with no matching card ID returns Error state`() = runTest(testDispatcher) {
        val targetCardId = "CARD_UNREGISTERED"

        coEvery { repository.getMembers(search = targetCardId) } coAnswers {
            delay(100)
            Result.success(emptyList())
        }

        viewModel.processCardScan(targetCardId)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.scanState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.scanState.value is UiState.Error)
        assertEquals("No member registered with Card ID: $targetCardId", (viewModel.scanState.value as UiState.Error).message)
    }
}
