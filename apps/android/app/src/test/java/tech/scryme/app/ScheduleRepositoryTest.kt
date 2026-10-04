package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.ScheduleApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.repository.ScheduleRepositoryImpl

class ScheduleRepositoryTest {

    private val scheduleApiService = mockk<ScheduleApiService>()
    private lateinit var repository: ScheduleRepositoryImpl

    @Before
    fun setUp() {
        repository = ScheduleRepositoryImpl(scheduleApiService)
    }

    @Test
    fun getCurrentMemberShifts_success_returnsShifts() = runBlocking {
        val dtoList = listOf(
            StaffShiftDto(
                id = "shift_1",
                memberId = "mem_1",
                dayOfWeek = 1,
                startTime = "09:00",
                endTime = "17:00",
                breaks = listOf(ShiftBreakDto(id = "b1", startTime = "12:00", endTime = "13:00", description = "Lunch"))
            )
        )

        coEvery {
            scheduleApiService.getCurrentMemberShifts("scryme-org")
        } returns Response.success(V3ApiResponse(success = true, data = dtoList))

        val result = repository.getCurrentMemberShifts("scryme-org")

        assertTrue(result.isSuccess)
        val shifts = result.getOrNull()!!
        assertEquals(1, shifts.size)
        assertEquals("shift_1", shifts[0].id)
        assertEquals("09:00", shifts[0].startTime)
        assertEquals(1, shifts[0].breaks.size)
    }

    @Test
    fun getStaffTasks_success_returnsTasks() = runBlocking {
        val tasksDto = listOf(
            StaffTaskDto(
                id = "task_1",
                title = "Clean Baking Station",
                description = "Sanitize counters",
                status = "TODO",
                priority = "HIGH"
            )
        )

        coEvery {
            scheduleApiService.getStaffTasks("scryme-org", "mem_1", null)
        } returns Response.success(V3ApiResponse(success = true, data = tasksDto))

        val result = repository.getStaffTasks("scryme-org", "mem_1", null)

        assertTrue(result.isSuccess)
        val tasks = result.getOrNull()!!
        assertEquals(1, tasks.size)
        assertEquals("Clean Baking Station", tasks[0].title)
        assertEquals("TODO", tasks[0].status)
    }

    @Test
    fun updateStaffTask_success_returnsUpdatedTask() = runBlocking {
        val updatedTaskDto = StaffTaskDto(
            id = "task_1",
            title = "Clean Baking Station",
            status = "COMPLETED"
        )

        coEvery {
            scheduleApiService.updateStaffTask("scryme-org", "task_1", any())
        } returns Response.success(V3ApiResponse(success = true, data = updatedTaskDto))

        val result = repository.updateStaffTask("scryme-org", "task_1", status = "COMPLETED")

        assertTrue(result.isSuccess)
        assertEquals("COMPLETED", result.getOrNull()?.status)
    }
}
