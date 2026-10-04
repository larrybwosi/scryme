package tech.scryme.app

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.ui.schedule.ScheduleScreen
import tech.scryme.app.ui.schedule.ScheduleUiState
import tech.scryme.app.ui.schedule.ScheduleViewModel
import tech.scryme.app.ui.theme.ScrymeTheme

@RunWith(AndroidJUnit4::class)
class ScheduleScreenE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun scheduleScreen_rendersShiftsAndTradeButton() {
        val viewModel = mockk<ScheduleViewModel>(relaxed = true)
        val mockShifts = listOf(
            StaffShift(id = "s1", memberId = "m1", dayOfWeek = 1, startTime = "08:00", endTime = "16:00")
        )
        every { viewModel.uiState } returns MutableStateFlow(ScheduleUiState.Success(shifts = mockShifts, trades = emptyList()))

        composeTestRule.setContent {
            ScrymeTheme {
                ScheduleScreen(viewModel = viewModel)
            }
        }

        composeTestRule.onNodeWithText("My Work Schedule").assertIsDisplayed()
        composeTestRule.onNodeWithText("Monday").assertIsDisplayed()
        composeTestRule.onNodeWithText("Hours: 08:00 - 16:00").assertIsDisplayed()
        composeTestRule.onNodeWithText("Swap / Trade").assertIsDisplayed()
    }
}
