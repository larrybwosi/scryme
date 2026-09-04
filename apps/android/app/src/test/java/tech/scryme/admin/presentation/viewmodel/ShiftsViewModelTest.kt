package tech.scryme.admin.presentation.viewmodel

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.StaffBreakDto
import tech.scryme.admin.data.model.StaffShiftDto
import tech.scryme.admin.domain.repository.ShiftsRepository

@OptIn(ExperimentalCoroutinesApi::class)
class ShiftsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeRepository: FakeShiftsRepository
    private lateinit var fakeAnnouncementRepository: FakeAnnouncementRepository
    private lateinit var viewModel: ShiftsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeShiftsRepository()
        fakeAnnouncementRepository = FakeAnnouncementRepository()
        viewModel = ShiftsViewModel(fakeRepository, fakeAnnouncementRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadShifts_success_updatesUiStateToSuccess() = runTest {
        val shift = StaffShiftDto(
            id = "shift-1",
            memberId = "mem-1",
            organizationId = "org-1",
            dayOfWeek = 1,
            startTime = "09:00",
            endTime = "17:00"
        )
        fakeRepository.shiftsToReturn = listOf(shift)

        viewModel.loadShifts()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.shiftsState.value
        assertTrue(state is UiState.Success)
        assertEquals(1, (state as UiState.Success).data.size)
        assertEquals("shift-1", state.data[0].id)
    }

    @Test
    fun loadShifts_failure_updatesUiStateToError() = runTest {
        fakeRepository.shouldReturnError = true

        viewModel.loadShifts()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.shiftsState.value
        assertTrue(state is UiState.Error)
        assertEquals("Failed to fetch shifts", (state as UiState.Error).message)
    }

    @Test
    fun createShift_success_triggersReload() = runTest {
        viewModel.createShift("mem-1", 1, "09:00", "17:00")
        testDispatcher.scheduler.advanceUntilIdle()

        val actionState = viewModel.createShiftState.value
        assertTrue(actionState is UiState.Success)
        assertEquals("shift-new", (actionState as UiState.Success).data.id)
    }

    @Test
    fun addBreak_success_updatesStateAndReloads() = runTest {
        viewModel.addBreak("shift-1", "12:00", "13:00", "Lunch")
        testDispatcher.scheduler.advanceUntilIdle()

        val actionState = viewModel.addBreakState.value
        assertTrue(actionState is UiState.Success)
        assertEquals("break-new", (actionState as UiState.Success).data.id)
    }

    @Test
    fun notifyMemberOfShift_success_updatesNotifyShiftState() = runTest {
        val shift = StaffShiftDto(
            id = "shift-1",
            memberId = "mem-100",
            organizationId = "org-1",
            dayOfWeek = 1,
            startTime = "09:00",
            endTime = "17:00"
        )

        viewModel.notifyMemberOfShift(shift)
        testDispatcher.scheduler.advanceUntilIdle()

        val notifyState = viewModel.notifyShiftState.value
        assertTrue(notifyState is UiState.Success)
        assertEquals("mem-100", fakeAnnouncementRepository.lastSentMemberId)
    }

    @Test
    fun broadcastRosterUpdate_success_updatesNotifyShiftState() = runTest {
        viewModel.broadcastRosterUpdate(dayOfWeek = 1)
        testDispatcher.scheduler.advanceUntilIdle()

        val notifyState = viewModel.notifyShiftState.value
        assertTrue(notifyState is UiState.Success)
        assertEquals("shifts", fakeAnnouncementRepository.lastChannelSlug)
    }
}

private class FakeAnnouncementRepository : tech.scryme.admin.domain.repository.AnnouncementRepository {
    var lastSentMemberId: String? = null
    var lastChannelSlug: String? = null

    override suspend fun broadcastAnnouncement(
        title: String,
        message: String,
        targetBranchId: String?,
        targetMemberId: String?,
        channelSlug: String?,
        severity: String
    ): Result<Unit> {
        lastChannelSlug = channelSlug
        return Result.success(Unit)
    }

    override suspend fun sendMessageToMember(
        memberId: String,
        title: String,
        message: String,
        type: String
    ): Result<Unit> {
        lastSentMemberId = memberId
        return Result.success(Unit)
    }
}

private class FakeShiftsRepository : ShiftsRepository {
    var shiftsToReturn = listOf<StaffShiftDto>()
    var shouldReturnError = false

    override suspend fun getShifts(
        memberId: String?,
        dayOfWeek: Int?,
        isActive: Boolean?
    ): Result<List<StaffShiftDto>> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to fetch shifts"))
        } else {
            Result.success(shiftsToReturn)
        }
    }

    override suspend fun createShift(
        memberId: String,
        dayOfWeek: Int,
        startTime: String,
        endTime: String
    ): Result<StaffShiftDto> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to create shift"))
        } else {
            val newShift = StaffShiftDto(
                id = "shift-new",
                memberId = memberId,
                organizationId = "org-1",
                dayOfWeek = dayOfWeek,
                startTime = startTime,
                endTime = endTime
            )
            Result.success(newShift)
        }
    }

    override suspend fun addBreak(
        shiftId: String,
        startTime: String,
        endTime: String,
        description: String?
    ): Result<StaffBreakDto> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to add break"))
        } else {
            val newBreak = StaffBreakDto(
                id = "break-new",
                shiftId = shiftId,
                startTime = startTime,
                endTime = endTime,
                description = description
            )
            Result.success(newBreak)
        }
    }
}
