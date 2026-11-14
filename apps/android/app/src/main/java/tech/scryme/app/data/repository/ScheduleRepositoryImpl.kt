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
    private val localTaskCache = java.util.concurrent.ConcurrentHashMap<String, StaffTask>()

    override suspend fun getStaffTaskById(orgSlug: String, taskId: String): Result<StaffTask> {
        val cached = localTaskCache[taskId]
        if (cached != null) return Result.success(cached)

        val tasksRes = getStaffTasks(orgSlug)
        return tasksRes.mapCatching { list ->
            list.find { it.id == taskId }
                ?: throw NoSuchElementException("Task not found with ID: $taskId")
        }
    }


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
        dueDate: String?,
        dueTime: String?,
        category: String?,
        subtaskGroups: List<SubtaskGroup>
    ): Result<StaffTask> {
        return try {
            val dto = CreateStaffTaskDto(
                title = title,
                description = description,
                assignedMemberId = assignedMemberId,
                priority = priority,
                dueDate = dueDate,
                dueTime = dueTime,
                category = category ?: "UI/UX Design"
            )
            val res = scheduleApiService.createStaffTask(dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val task = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                val enrichedTask = task.copy(
                    dueTime = dueTime ?: task.dueTime,
                    category = category ?: task.category,
                    subtaskGroups = subtaskGroups
                )
                localTaskCache[enrichedTask.id] = enrichedTask
                Result.success(enrichedTask)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteStaffTask(orgSlug: String, taskId: String): Result<Boolean> {
        return try {
            localTaskCache.remove(taskId)
            val res = scheduleApiService.deleteStaffTask(taskId)
            if (res.isSuccessful && res.body()?.success == true) {
                Result.success(true)
            } else {
                // If API returned failure, still consider local cache invalidated
                Result.success(true)
            }
        } catch (e: Exception) {
            localTaskCache.remove(taskId)
            Result.success(true)
        }
    }

    override suspend fun updateStaffTask(
        orgSlug: String,
        taskId: String,
        status: String?,
        title: String?,
        description: String?,
        priority: String?,
        category: String?,
        dueDate: String?,
        dueTime: String?,
        subtaskGroups: List<SubtaskGroup>?,
        assignedMemberId: String?
    ): Result<StaffTask> {
        return try {
            val dto = UpdateStaffTaskDto(
                status = status,
                title = title,
                description = description,
                priority = priority,
                category = category,
                dueDate = dueDate,
                dueTime = dueTime,
                assignedMemberId = assignedMemberId,
                subtaskGroups = subtaskGroups?.map { g ->
                    SubtaskGroupDto(
                        id = g.id,
                        title = g.title,
                        items = g.items.map { SubtaskItemDto(it.id, it.title, it.isCompleted) }
                    )
                }
            )
            val res = scheduleApiService.updateStaffTask(taskId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val task = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                val enrichedTask = task.copy(
                    status = status ?: task.status,
                    assignedMemberId = assignedMemberId ?: task.assignedMemberId,
                    title = title ?: task.title,
                    description = description ?: task.description,
                    priority = priority ?: task.priority,
                    category = category ?: task.category,
                    dueDate = dueDate ?: task.dueDate,
                    dueTime = dueTime ?: task.dueTime,
                    subtaskGroups = subtaskGroups ?: task.subtaskGroups
                )
                localTaskCache[enrichedTask.id] = enrichedTask
                Result.success(enrichedTask)
            } else {
                val cached = localTaskCache[taskId]
                if (cached != null) {
                    val updated = cached.copy(
                        status = status ?: cached.status,
                        title = title ?: cached.title,
                        description = description ?: cached.description,
                        priority = priority ?: cached.priority,
                        category = category ?: cached.category,
                        dueDate = dueDate ?: cached.dueDate,
                        dueTime = dueTime ?: cached.dueTime,
                        subtaskGroups = subtaskGroups ?: cached.subtaskGroups
                    )
                    localTaskCache[taskId] = updated
                    Result.success(updated)
                } else {
                    Result.failure(Exception(res.body()?.error?.message ?: res.message()))
                }
            }
        } catch (e: Exception) {
            val cached = localTaskCache[taskId]
            if (cached != null) {
                val updated = cached.copy(
                    status = status ?: cached.status,
                    title = title ?: cached.title,
                    description = description ?: cached.description,
                    priority = priority ?: cached.priority,
                    category = category ?: cached.category,
                    dueDate = dueDate ?: cached.dueDate,
                    dueTime = dueTime ?: cached.dueTime,
                    subtaskGroups = subtaskGroups ?: cached.subtaskGroups
                )
                localTaskCache[taskId] = updated
                Result.success(updated)
            } else {
                Result.failure(e)
            }
        }
    }

    override suspend fun saveTaskAssessment(
        orgSlug: String,
        taskId: String,
        qualityScore: Int,
        complexity: String,
        riskLevel: String,
        estimatedHours: Double?,
        actualHours: Double?,
        notes: String?
    ): Result<TaskAssessment> {
        return try {
            val dto = CreateTaskAssessmentDto(
                taskId = taskId,
                qualityScore = qualityScore,
                complexity = complexity,
                riskLevel = riskLevel,
                estimatedHours = estimatedHours,
                actualHours = actualHours,
                notes = notes
            )
            val res = scheduleApiService.saveTaskAssessment(taskId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val assessment = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(assessment)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getTaskAssessment(orgSlug: String, taskId: String): Result<TaskAssessment> {
        return try {
            val res = scheduleApiService.getTaskAssessment(taskId)
            if (res.isSuccessful && res.body()?.success == true) {
                val assessment = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(assessment)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun saveShiftAssessment(
        orgSlug: String,
        shiftId: String,
        ratingScore: Int,
        attendancePunctuality: String,
        shiftNotes: String?,
        verifiedBy: String?
    ): Result<ShiftAssessment> {
        return try {
            val dto = CreateShiftAssessmentDto(
                shiftId = shiftId,
                ratingScore = ratingScore,
                attendancePunctuality = attendancePunctuality,
                shiftNotes = shiftNotes,
                verifiedBy = verifiedBy
            )
            val res = scheduleApiService.saveShiftAssessment(shiftId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val assessment = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(assessment)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getShiftAssessment(orgSlug: String, shiftId: String): Result<ShiftAssessment> {
        return try {
            val res = scheduleApiService.getShiftAssessment(shiftId)
            if (res.isSuccessful && res.body()?.success == true) {
                val assessment = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null response"))
                Result.success(assessment)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getMyAttendanceStatus(orgSlug: String): Result<AttendanceStatusDto> {
        return try {
            val res = scheduleApiService.getMyAttendanceStatus(orgSlug)
            if (res.isSuccessful && res.body()?.success == true) {
                val status = res.body()?.data ?: return Result.failure(Exception("Null status response"))
                Result.success(status)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun checkInAttendance(
        orgSlug: String,
        locationId: String?,
        branchCode: String?,
        latitude: Double?,
        longitude: Double?,
        accuracy: Float?,
        isMock: Boolean?,
        verificationMethod: String?,
        notes: String?
    ): Result<AttendanceLogDto> {
        return try {
            val dto = CheckInAttendanceRequestDto(
                locationId = locationId,
                branchCode = branchCode,
                latitude = latitude,
                longitude = longitude,
                accuracy = accuracy,
                isMock = isMock,
                verificationMethod = verificationMethod ?: "GPS_GEOFENCE",
                notes = notes
            )
            val res = scheduleApiService.checkInAttendance(orgSlug, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val log = res.body()?.data ?: return Result.failure(Exception("Null response"))
                Result.success(log)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun checkOutAttendance(
        orgSlug: String,
        locationId: String?,
        notes: String?
    ): Result<AttendanceLogDto> {
        return try {
            val dto = CheckOutAttendanceRequestDto(locationId = locationId, notes = notes)
            val res = scheduleApiService.checkOutAttendance(orgSlug, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val log = res.body()?.data ?: return Result.failure(Exception("Null response"))
                Result.success(log)
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
        isActive = isActive,
        assessment = assessment?.toDomain()
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
        priority = priority ?: "MEDIUM",
        category = category,
        assignedMemberId = assignedMemberId,
        dueDate = dueDate,
        dueTime = dueTime,
        estimatedHours = estimatedHours,
        actualHours = actualHours,
        assessment = assessment?.toDomain(),
        subtaskGroups = subtaskGroups?.map { g ->
            SubtaskGroup(
                id = g.id,
                title = g.title,
                items = g.items.map { SubtaskItem(it.id, it.title, it.isCompleted) }
            )
        } ?: emptyList()
    )

    private fun TaskAssessmentDto.toDomain() = TaskAssessment(
        id = id,
        taskId = taskId,
        qualityScore = qualityScore,
        complexity = complexity,
        riskLevel = riskLevel,
        estimatedHours = estimatedHours,
        actualHours = actualHours,
        notes = notes,
        createdAt = createdAt
    )

    private fun ShiftAssessmentDto.toDomain() = ShiftAssessment(
        id = id,
        shiftId = shiftId,
        memberId = memberId,
        ratingScore = ratingScore,
        attendancePunctuality = attendancePunctuality,
        shiftNotes = shiftNotes,
        verifiedBy = verifiedBy,
        createdAt = createdAt
    )
}
