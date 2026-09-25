package tech.scryme.admin.presentation.viewmodel

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.StaffTaskDto
import tech.scryme.admin.domain.repository.AnnouncementRepository
import tech.scryme.admin.domain.repository.TasksRepository

@OptIn(ExperimentalCoroutinesApi::class)
class TasksViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeRepository: FakeTasksRepository
    private lateinit var fakeAnnouncementRepository: FakeTasksAnnouncementRepository
    private lateinit var viewModel: TasksViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeTasksRepository()
        fakeAnnouncementRepository = FakeTasksAnnouncementRepository()
        viewModel = TasksViewModel(fakeRepository, fakeAnnouncementRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadTasks_success_updatesUiStateToSuccess() = runTest {
        val task = StaffTaskDto(
            id = "task-1",
            organizationId = "org-1",
            title = "Sanitize register counters",
            description = "Wipe down POS terminals and counters",
            status = "PENDING",
            priority = "HIGH"
        )
        fakeRepository.tasksToReturn = listOf(task)

        viewModel.loadTasks()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.tasksState.value
        assertTrue(state is UiState.Success)
        assertEquals(1, (state as UiState.Success).data.size)
        assertEquals("task-1", state.data[0].id)
    }

    @Test
    fun loadTasks_failure_updatesUiStateToError() = runTest {
        fakeRepository.shouldReturnError = true

        viewModel.loadTasks()
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.tasksState.value
        assertTrue(state is UiState.Error)
        assertEquals("Failed to fetch tasks", (state as UiState.Error).message)
    }

    @Test
    fun createTask_success_dispatchesNotificationAndReloads() = runTest {
        viewModel.createTask(
            title = "Stock shelf A",
            description = "Restock beverages",
            assignedMemberId = "mem-55",
            priority = "URGENT",
            notifyViaScrymeChat = true
        )
        testDispatcher.scheduler.advanceUntilIdle()

        val actionState = viewModel.createTaskState.value
        assertTrue(actionState is UiState.Success)
        assertEquals("task-new", (actionState as UiState.Success).data.id)
        assertEquals("mem-55", fakeAnnouncementRepository.lastSentMemberId)
    }

    @Test
    fun updateTaskStatus_success_reloadsTasks() = runTest {
        viewModel.updateTaskStatus("task-1", "COMPLETED", "All items restocked")
        testDispatcher.scheduler.advanceUntilIdle()

        val actionState = viewModel.updateTaskState.value
        assertTrue(actionState is UiState.Success)
        assertEquals("COMPLETED", (actionState as UiState.Success).data.status)
    }

    @Test
    fun notifyTaskAssigned_success_updatesNotifyTaskState() = runTest {
        val task = StaffTaskDto(
            id = "task-1",
            organizationId = "org-1",
            title = "Audit inventory",
            assignedMemberId = "mem-101",
            status = "PENDING",
            priority = "HIGH"
        )

        viewModel.notifyTaskAssigned(task, "Please finish before 5 PM")
        testDispatcher.scheduler.advanceUntilIdle()

        val notifyState = viewModel.notifyTaskState.value
        assertTrue(notifyState is UiState.Success)
        assertEquals("mem-101", fakeAnnouncementRepository.lastSentMemberId)
    }
}

private class FakeTasksAnnouncementRepository : AnnouncementRepository {
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

private class FakeTasksRepository : TasksRepository {
    var tasksToReturn = listOf<StaffTaskDto>()
    var shouldReturnError = false

    override suspend fun getTasks(
        assignedMemberId: String?,
        status: String?,
        priority: String?
    ): Result<List<StaffTaskDto>> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to fetch tasks"))
        } else {
            Result.success(tasksToReturn)
        }
    }

    override suspend fun createTask(
        title: String,
        description: String?,
        assignedMemberId: String?,
        shiftId: String?,
        locationId: String?,
        priority: String,
        dueDate: String?,
        notifyViaScrymeChat: Boolean
    ): Result<StaffTaskDto> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to create task"))
        } else {
            val newTask = StaffTaskDto(
                id = "task-new",
                organizationId = "org-1",
                title = title,
                description = description,
                assignedMemberId = assignedMemberId,
                priority = priority,
                status = "PENDING"
            )
            Result.success(newTask)
        }
    }

    override suspend fun updateTaskStatus(
        taskId: String,
        status: String,
        notes: String?
    ): Result<StaffTaskDto> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to update task status"))
        } else {
            val updatedTask = StaffTaskDto(
                id = taskId,
                organizationId = "org-1",
                title = "Updated Task",
                status = status
            )
            Result.success(updatedTask)
        }
    }

    override suspend fun sendTaskNotification(taskId: String): Result<Unit> {
        return if (shouldReturnError) {
            Result.failure(Exception("Failed to send task notification"))
        } else {
            Result.success(Unit)
        }
    }
}
