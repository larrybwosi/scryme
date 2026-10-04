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
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.ui.tasks.TasksScreen
import tech.scryme.app.ui.tasks.TasksUiState
import tech.scryme.app.ui.tasks.TasksViewModel
import tech.scryme.app.ui.theme.ScrymeTheme

@RunWith(AndroidJUnit4::class)
class TasksScreenE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun tasksScreen_rendersTaskListAndFilters() {
        val viewModel = mockk<TasksViewModel>(relaxed = true)
        val mockTasks = listOf(
            StaffTask(id = "1", title = "Prep Oven Tier 1", description = "Preheat to 220C", status = "TODO", priority = "HIGH")
        )
        every { viewModel.uiState } returns MutableStateFlow(TasksUiState.Success(tasks = mockTasks, selectedFilter = "ALL"))

        composeTestRule.setContent {
            ScrymeTheme {
                TasksScreen(viewModel = viewModel)
            }
        }

        composeTestRule.onNodeWithText("My Operational Tasks").assertIsDisplayed()
        composeTestRule.onNodeWithText("Prep Oven Tier 1").assertIsDisplayed()
        composeTestRule.onNodeWithText("Preheat to 220C").assertIsDisplayed()
        composeTestRule.onNodeWithText("Start").assertIsDisplayed()
    }
}
