package tech.scryme.app.data.repository

import tech.scryme.app.data.api.ScheduleApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.domain.model.*
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ScheduleRepositoryImpl @Inject constructor(
    private val scheduleApiService: ScheduleApiService
) : ScheduleRepository {

    override suspend fun getCurrentMemberShifts(orgSlug: String): Result<List<StaffShift>> {
        return try {
            val res = scheduleApiService.getCurrentMemberShifts()
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getOrganizationShifts(
        orgSlug: String,
        memberId: String?,
        locationId: String?
    ): Result<List<StaffShift>> {
        return try {
            val res = scheduleApiService.getOrganizationShifts(memberId, locationId)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createStaffShift(
        orgSlug: String,
        memberId: String,
        dayOfWeek: Int,
        startTime: String,
        endTime: String
    ): Result<StaffShift> {
        return try {
            val dto = CreateShiftDto(dayOfWeek, startTime, endTime)
            val res = scheduleApiService.createStaffShift(memberId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val shift = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(shift)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addShiftBreak(
        orgSlug: String,
        shiftId: String,
        breakItem: ShiftBreak
    ): Result<StaffShift> {
        return try {
            val dto = ShiftBreakDto(
                id = breakItem.id,
                startTime = breakItem.startTime,
                endTime = breakItem.endTime,
                description = breakItem.description
            )
            val res = scheduleApiService.addShiftBreak(shiftId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val shift = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(shift)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getShiftTrades(
        orgSlug: String,
        memberId: String?,
        status: String?
    ): Result<List<ShiftTrade>> {
        return try {
            val res = scheduleApiService.getShiftTrades(memberId, status)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun requestShiftTrade(
        orgSlug: String,
        shiftId: String,
        targetMemberId: String?,
        reason: String?
    ): Result<ShiftTrade> {
        return try {
            val dto = RequestShiftTradeDto(shiftId, targetMemberId, reason)
            val res = scheduleApiService.requestShiftTrade(dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val trade = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(trade)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun processShiftTrade(
        orgSlug: String,
        tradeId: String,
        action: String
    ): Result<ShiftTrade> {
        return try {
            val dto = ProcessShiftTradeDto(action)
            val res = scheduleApiService.processShiftTrade(tradeId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val trade = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(trade)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getStaffTasks(
        orgSlug: String,
        memberId: String?,
        status: String?
    ): Result<List<StaffTask>> {
        return try {
            val res = scheduleApiService.getStaffTasks(memberId, status)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createStaffTask(
        orgSlug: String,
        title: String,
        description: String?,
        assignedMemberId: String?,
        priority: String?,
        dueDate: String?
    ): Result<StaffTask> {
        return try {
            val dto = CreateStaffTaskDto(title, description, assignedMemberId, priority, dueDate)
            val res = scheduleApiService.createStaffTask(dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val task = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(task)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateStaffTask(
        orgSlug: String,
        taskId: String,
        status: String?,
        title: String?,
        description: String?
    ): Result<StaffTask> {
        return try {
            val dto = UpdateStaffTaskDto(status, title, description)
            val res = scheduleApiService.updateStaffTask(taskId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val task = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(task)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun StaffShiftDto.toDomain() = StaffShift(
        id = id,
        memberId = memberId,
        dayOfWeek = dayOfWeek,
        startTime = startTime,
        endTime = endTime,
        breaks = breaks.map { ShiftBreak(it.id, it.startTime, it.endTime, it.description) },
        locationId = locationId,
        isActive = isActive
    )

    private fun ShiftTradeDto.toDomain() = ShiftTrade(
        id = id,
        requestingMemberId = requestingMemberId,
        targetMemberId = targetMemberId,
        shiftId = shiftId,
        status = status,
        reason = reason,
        createdAt = createdAt
    )

    private fun StaffTaskDto.toDomain() = StaffTask(
        id = id,
        title = title,
        description = description,
        status = status,
        priority = priority,
        assignedMemberId = assignedMemberId,
        dueDate = dueDate
    )
}
