package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class StaffShiftDto(
    @SerializedName("id") val id: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("dayOfWeek") val dayOfWeek: Int, // 0 = Sunday, 6 = Saturday
    @SerializedName("startTime") val startTime: String, // HH:mm
    @SerializedName("endTime") val endTime: String, // HH:mm
    @SerializedName("breaks") val breaks: List<ShiftBreakDto> = emptyList(),
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class ShiftBreakDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("description") val description: String? = null
)

data class CreateShiftDto(
    @SerializedName("dayOfWeek") val dayOfWeek: Int,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String
)

data class ShiftTradeDto(
    @SerializedName("id") val id: String,
    @SerializedName("requestingMemberId") val requestingMemberId: String,
    @SerializedName("targetMemberId") val targetMemberId: String? = null,
    @SerializedName("shiftId") val shiftId: String,
    @SerializedName("status") val status: String, // PENDING, APPROVED, REJECTED, CANCELLED
    @SerializedName("reason") val reason: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class RequestShiftTradeDto(
    @SerializedName("shiftId") val shiftId: String,
    @SerializedName("targetMemberId") val targetMemberId: String? = null,
    @SerializedName("reason") val reason: String? = null
)

data class ProcessShiftTradeDto(
    @SerializedName("action") val action: String // APPROVE, REJECT, CANCEL
)

data class StaffTaskDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("status") val status: String, // TODO, IN_PROGRESS, COMPLETED, CANCELLED
    @SerializedName("priority") val priority: String? = "MEDIUM",
    @SerializedName("assignedMemberId") val assignedMemberId: String? = null,
    @SerializedName("dueDate") val dueDate: String? = null
)

data class CreateStaffTaskDto(
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("assignedMemberId") val assignedMemberId: String? = null,
    @SerializedName("priority") val priority: String? = "MEDIUM",
    @SerializedName("dueDate") val dueDate: String? = null
)

data class UpdateStaffTaskDto(
    @SerializedName("status") val status: String? = null,
    @SerializedName("title") val title: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("dueDate") val dueDate: String? = null
)

data class CheckInAttendanceRequestDto(
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("branchCode") val branchCode: String? = null,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("verificationMethod") val verificationMethod: String? = null,
    @SerializedName("notes") val notes: String? = null
)

data class CheckOutAttendanceRequestDto(
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("notes") val notes: String? = null
)

data class AttendanceLogDto(
    @SerializedName("id") val id: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("checkInTime") val checkInTime: String,
    @SerializedName("checkOutTime") val checkOutTime: String? = null,
    @SerializedName("checkInLocationId") val checkInLocationId: String,
    @SerializedName("shiftStatus") val shiftStatus: String? = null,
    @SerializedName("verificationMethod") val verificationMethod: String? = null,
    @SerializedName("isLocationVerified") val isLocationVerified: Boolean = false,
    @SerializedName("distanceMeters") val distanceMeters: Double? = null
)
