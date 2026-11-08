package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.ui.notifications.NotificationSettingsViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class NotificationSettingsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private lateinit var viewModel: NotificationSettingsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)

        every { sessionManager.notificationsEnabledFlow } returns flowOf(true)
        every { sessionManager.shiftNotificationsFlow } returns flowOf(true)
        every { sessionManager.taskNotificationsFlow } returns flowOf(true)
        every { sessionManager.dailyShiftNotificationsFlow } returns flowOf(true)
        every { sessionManager.posNotificationsFlow } returns flowOf(false)
        every { sessionManager.announcementNotificationsFlow } returns flowOf(true)
        every { sessionManager.attendanceNotificationsFlow } returns flowOf(false)

        viewModel = NotificationSettingsViewModel(sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun uiState_combinesAllChannelFlowsCorrectly() = runTest {
        val collectJob = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.notificationsEnabled)
        assertTrue(state.shiftNotifications)
        assertTrue(state.taskNotifications)
        assertTrue(state.dailyShiftNotifications)
        assertFalse(state.posNotifications)
        assertTrue(state.announcementNotifications)
        assertFalse(state.attendanceNotifications)
        collectJob.cancel()
    }

    @Test
    fun toggleChannels_callsSessionManagerUpdateMethods() = runTest {
        viewModel.setMasterNotificationsEnabled(false)
        viewModel.setShiftNotifications(false)
        viewModel.setTaskNotifications(false)
        viewModel.setDailyShiftNotifications(false)
        viewModel.setPosNotifications(true)
        viewModel.setAnnouncementNotifications(false)
        viewModel.setAttendanceNotifications(true)

        testScheduler.advanceUntilIdle()

        coVerify { sessionManager.updateNotificationsEnabled(false) }
        coVerify { sessionManager.updateShiftNotifications(false) }
        coVerify { sessionManager.updateTaskNotifications(false) }
        coVerify { sessionManager.updateDailyShiftNotifications(false) }
        coVerify { sessionManager.updatePosNotifications(true) }
        coVerify { sessionManager.updateAnnouncementNotifications(false) }
        coVerify { sessionManager.updateAttendanceNotifications(true) }
    }
}
