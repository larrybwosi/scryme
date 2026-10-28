package tech.scryme.app.domain.repository

import tech.scryme.app.data.dto.AttendanceLogDto
import tech.scryme.app.data.dto.AttendanceStatusDto
import tech.scryme.app.domain.model.ShiftBreak
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.TaskAssessment
import tech.scryme.app.domain.model.ShiftAssessment

interface ScheduleRepository {
    suspend fun getCurrentMemberShifts(orgSlug: String): Result<List<StaffShift>>
    suspend fun getOrganizationShifts(orgSlug: String, memberId: String? = null, locationId: String? = null): Result<List<StaffShift>>
    suspend fun createStaffShift(orgSlug: String, memberId: String, dayOfWeek: Int, startTime: String, endTime: String): Result<StaffShift>
    suspend fun addShiftBreak(orgSlug: String, shiftId: String, breakItem: ShiftBreak): Result<StaffShift>
    suspend fun getShiftTrades(orgSlug: String, memberId: String? = null, status: String? = null): Result<List<ShiftTrade>>
    suspend fun requestShiftTrade(orgSlug: String, shiftId: String, targetMemberId: String? = null, reason: String? = null): Result<ShiftTrade>
    suspend fun processShiftTrade(orgSlug: String, tradeId: String, action: String): Result<ShiftTrade>
    suspend fun getStaffTasks(orgSlug: String, memberId: String? = null, status: String? = null): Result<List<StaffTask>>
    suspend fun createStaffTask(orgSlug: String, title: String, description: String? = null, assignedMemberId: String? = null, priority: String? = "MEDIUM", dueDate: String? = null): Result<StaffTask>
    suspend fun updateStaffTask(orgSlug: String, taskId: String, status: String? = null, title: String? = null, description: String? = null): Result<StaffTask>

    suspend fun saveTaskAssessment(
        orgSlug: String,
        taskId: String,
        qualityScore: Int,
        complexity: String,
        riskLevel: String,
        estimatedHours: Double? = null,
        actualHours: Double? = null,
        notes: String? = null
    ): Result<TaskAssessment>

    suspend fun getTaskAssessment(orgSlug: String, taskId: String): Result<TaskAssessment>

    suspend fun saveShiftAssessment(
        orgSlug: String,
        shiftId: String,
        ratingScore: Int,
        attendancePunctuality: String,
        shiftNotes: String? = null,
        verifiedBy: String? = null
    ): Result<ShiftAssessment>

    suspend fun getShiftAssessment(orgSlug: String, shiftId: String): Result<ShiftAssessment>

    suspend fun getMyAttendanceStatus(orgSlug: String): Result<AttendanceStatusDto>

    suspend fun checkInAttendance(
        orgSlug: String,
        locationId: String? = null,
        branchCode: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        accuracy: Float? = null,
        isMock: Boolean? = null,
        verificationMethod: String? = null,
        notes: String? = null
    ): Result<AttendanceLogDto>

    suspend fun checkOutAttendance(
        orgSlug: String,
        locationId: String? = null,
        notes: String? = null
    ): Result<AttendanceLogDto>
}
