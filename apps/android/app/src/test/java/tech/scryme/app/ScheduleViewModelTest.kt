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
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.ui.schedule.ScheduleUiState
import tech.scryme.app.ui.schedule.ScheduleViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class ScheduleViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val scheduleRepository = mockk<ScheduleRepository>()
    private val sessionManager = mockk<SessionManager>()
    private lateinit var viewModel: ScheduleViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = ScheduleViewModel(scheduleRepository, sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadSchedule_success_setsSuccessState() = runTest {
        val shifts = listOf(
            StaffShift(id = "s1", memberId = "m1", dayOfWeek = 1, startTime = "08:00", endTime = "16:00")
        )
        val trades = listOf(
            ShiftTrade(id = "tr1", requestingMemberId = "m1", shiftId = "s1", status = "PENDING")
        )

        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { scheduleRepository.getCurrentMemberShifts("scryme-org") } returns Result.success(shifts)
        coEvery { scheduleRepository.getOrganizationShifts("scryme-org") } returns Result.success(shifts)
        coEvery { scheduleRepository.getShiftTrades("scryme-org") } returns Result.success(trades)

        viewModel.loadSchedule()
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is ScheduleUiState.Success)
        val state = viewModel.uiState.value as ScheduleUiState.Success
        assertEquals(1, state.myShifts.size)
        assertEquals(1, state.trades.size)
    }

    @Test
    fun requestShiftTrade_success_reloadsSchedule() = runTest {
        val trade = ShiftTrade(id = "tr1", requestingMemberId = "m1", shiftId = "s1", status = "PENDING")

        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { scheduleRepository.requestShiftTrade("scryme-org", "s1", null, "Personal reason") } returns Result.success(trade)
        coEvery { scheduleRepository.getCurrentMemberShifts("scryme-org") } returns Result.success(emptyList())
        coEvery { scheduleRepository.getOrganizationShifts("scryme-org") } returns Result.success(emptyList())
        coEvery { scheduleRepository.getShiftTrades("scryme-org") } returns Result.success(listOf(trade))

        viewModel.requestShiftTrade("s1", null, "Personal reason")
        testScheduler.advanceUntilIdle()

        coVerify { scheduleRepository.requestShiftTrade("scryme-org", "s1", null, "Personal reason") }
    }
}
