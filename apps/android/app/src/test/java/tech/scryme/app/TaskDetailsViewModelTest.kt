package tech.scryme.app

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.SubtaskGroup
import tech.scryme.app.domain.model.SubtaskItem
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.ui.schedule.TaskDetailsUiState
import tech.scryme.app.ui.schedule.TaskDetailsViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class TaskDetailsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val scheduleRepository = mockk<ScheduleRepository>()
    private val profileRepository = mockk<ProfileRepository>()
    private val sessionManager = mockk<SessionManager>()
    private val context = mockk<Context>(relaxed = true)
    private val savedStateHandle = SavedStateHandle(mapOf("taskId" to "task_123"))
    private lateinit var viewModel: TaskDetailsViewModel

    private val sampleTask = StaffTask(
        id = "task_123",
        title = "Design Brand Guidelines",
        description = "Create full Figma token library",
        status = "TODO",
        priority = "HIGH",
        category = "UI/UX Design",
        dueDate = "2026-10-20",
        dueTime = "09:00 AM",
        subtaskGroups = listOf(
            SubtaskGroup(
                id = "group_1",
                title = "Design System",
                items = listOf(
                    SubtaskItem(id = "sub_1", title = "Color Palette", isCompleted = false),
                    SubtaskItem(id = "sub_2", title = "Typography Scale", isCompleted = true)
                )
            )
        )
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { profileRepository.getMembers(any()) } returns Result.success(emptyList())
        coEvery { scheduleRepository.getStaffTaskById("scryme-org", "task_123") } returns Result.success(sampleTask)
        viewModel = TaskDetailsViewModel(scheduleRepository, profileRepository, sessionManager, savedStateHandle, context)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadTaskDetails_success_updatesState() = runTest {
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is TaskDetailsUiState.Success)
        val state = viewModel.uiState.value as TaskDetailsUiState.Success
        assertEquals("task_123", state.task.id)
        assertEquals("Design Brand Guidelines", state.task.title)
        assertEquals("UI/UX Design", state.task.category)
        assertEquals(1, state.task.subtaskGroups.size)
        assertEquals(2, state.task.subtaskGroups.first().items.size)
    }

    @Test
    fun updateStatus_success_updatesTaskStatus() = runTest {
        val updatedTask = sampleTask.copy(status = "IN_PROGRESS")
        coEvery {
            scheduleRepository.updateStaffTask(
                orgSlug = "scryme-org",
                taskId = "task_123",
                status = "IN_PROGRESS",
                title = any(),
                description = any(),
                priority = any(),
                category = any(),
                dueDate = any(),
                dueTime = any(),
                subtaskGroups = any()
            )
        } returns Result.success(updatedTask)

        testScheduler.advanceUntilIdle()
        viewModel.updateStatus("IN_PROGRESS")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as TaskDetailsUiState.Success
        assertEquals("IN_PROGRESS", state.task.status)
        assertFalse(state.isSaving)
    }

    @Test
    fun toggleSubtask_togglesSubtaskState() = runTest {
        val updatedSubtaskTask = sampleTask.copy(
            subtaskGroups = listOf(
                SubtaskGroup(
                    id = "group_1",
                    title = "Design System",
                    items = listOf(
                        SubtaskItem(id = "sub_1", title = "Color Palette", isCompleted = true),
                        SubtaskItem(id = "sub_2", title = "Typography Scale", isCompleted = true)
                    )
                )
            )
        )

        coEvery {
            scheduleRepository.updateStaffTask(
                orgSlug = "scryme-org",
                taskId = "task_123",
                status = any(),
                title = any(),
                description = any(),
                priority = any(),
                category = any(),
                dueDate = any(),
                dueTime = any(),
                subtaskGroups = any()
            )
        } returns Result.success(updatedSubtaskTask)

        testScheduler.advanceUntilIdle()
        viewModel.toggleSubtask("group_1", "sub_1")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as TaskDetailsUiState.Success
        val firstItem = state.task.subtaskGroups.first().items.first()
        assertTrue(firstItem.isCompleted)
    }

    @Test
    fun updateTaskDetails_success_updatesTask() = runTest {
        val updatedTask = sampleTask.copy(title = "New Title", priority = "LOW")
        coEvery {
            scheduleRepository.updateStaffTask(
                orgSlug = "scryme-org",
                taskId = "task_123",
                title = "New Title",
                description = any(),
                priority = "LOW",
                status = any(),
                dueDate = any(),
                dueTime = any(),
                category = any(),
                subtaskGroups = any()
            )
        } returns Result.success(updatedTask)

        testScheduler.advanceUntilIdle()
        var successCalled = false
        viewModel.updateTaskDetails(
            title = "New Title",
            description = "Desc",
            priority = "LOW",
            category = "General",
            dueDate = "2026-11-01",
            dueTime = "10:00 AM",
            onSuccess = { successCalled = true }
        )
        testScheduler.advanceUntilIdle()

        assertTrue(successCalled)
        val state = viewModel.uiState.value as TaskDetailsUiState.Success
        assertEquals("New Title", state.task.title)
    }

    @Test
    fun deleteTask_success_setsDeletedState() = runTest {
        coEvery { scheduleRepository.deleteStaffTask("scryme-org", "task_123") } returns Result.success(true)

        testScheduler.advanceUntilIdle()
        var successCalled = false
        viewModel.deleteTask(onSuccess = { successCalled = true })
        testScheduler.advanceUntilIdle()

        assertTrue(successCalled)
        val state = viewModel.uiState.value as TaskDetailsUiState.Success
        assertTrue(state.isDeleted)
    }
}
