package tech.scryme.app

import android.content.Context
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
import tech.scryme.app.domain.repository.ScheduleRepository
import tech.scryme.app.ui.tasks.TasksUiState
import tech.scryme.app.ui.tasks.TasksViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class TasksViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val scheduleRepository = mockk<ScheduleRepository>()
    private val sessionManager = mockk<SessionManager>()
    private val context = mockk<Context>(relaxed = true)
    private lateinit var viewModel: TasksViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = TasksViewModel(scheduleRepository, sessionManager, context)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadTasks_missingOrgSlug_setsErrorState() = runTest {
        coEvery { sessionManager.getOrgSlug() } returns null

        viewModel.loadTasks()
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is TasksUiState.Error)
        assertEquals("Session missing organization context", (viewModel.uiState.value as TasksUiState.Error).message)
    }

    @Test
    fun loadTasks_success_setsSuccessState() = runTest {
        val tasks = listOf(
            StaffTask(id = "t1", title = "Inventory Audit", status = "TODO")
        )
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { sessionManager.getMemberId() } returns "mem-123"
        coEvery { scheduleRepository.getStaffTasks("scryme-org", "mem-123", null) } returns Result.success(tasks)

        viewModel.loadTasks("ALL")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is TasksUiState.Success)
        val successState = viewModel.uiState.value as TasksUiState.Success
        assertEquals(1, successState.tasks.size)
        assertEquals("Inventory Audit", successState.tasks[0].title)
    }

    @Test
    fun createStaffTask_success_reloadsTasks() = runTest {
        val createdTask = StaffTask(id = "t2", title = "Clean Station", status = "TODO", priority = "HIGH")
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { sessionManager.getMemberId() } returns "mem-123"
        coEvery {
            scheduleRepository.createStaffTask(
                orgSlug = "scryme-org",
                title = "Clean Station",
                description = "Deep clean",
                assignedMemberId = "mem-123",
                priority = "HIGH",
                dueDate = "2026-10-10"
            )
        } returns Result.success(createdTask)
        coEvery { scheduleRepository.getStaffTasks("scryme-org", "mem-123", null) } returns Result.success(listOf(createdTask))

        var returnedTask: StaffTask? = null
        viewModel.createStaffTask(
            title = "Clean Station",
            description = "Deep clean",
            assignedMemberId = "mem-123",
            priority = "HIGH",
            dueDate = "2026-10-10",
            onSuccess = { newTask -> returnedTask = newTask }
        )
        testScheduler.advanceUntilIdle()

        assertNotNull(returnedTask)
        assertEquals("Clean Station", returnedTask?.title)
        coVerify { scheduleRepository.createStaffTask("scryme-org", "Clean Station", "Deep clean", "mem-123", "HIGH", "2026-10-10") }
    }

    @Test
    fun updateTaskStatus_success_reloadsTasks() = runTest {
        val task = StaffTask(id = "t1", title = "Inventory Audit", status = "TODO")
        coEvery { sessionManager.getOrgSlug() } returns "scryme-org"
        coEvery { sessionManager.getMemberId() } returns "mem-123"
        coEvery { scheduleRepository.updateStaffTask("scryme-org", "t1", "COMPLETED") } returns Result.success(task.copy(status = "COMPLETED"))
        coEvery { scheduleRepository.getStaffTasks("scryme-org", "mem-123", null) } returns Result.success(listOf(task.copy(status = "COMPLETED")))

        viewModel.updateTaskStatus(task, "COMPLETED")
        testScheduler.advanceUntilIdle()

        coVerify { scheduleRepository.updateStaffTask("scryme-org", "t1", "COMPLETED") }
    }
}
