package tech.scryme.app.domain.model

data class StaffShift(
    val id: String,
    val memberId: String,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val breaks: List<ShiftBreak>,
    val locationId: String?,
    val isActive: Boolean
)

data class ShiftBreak(
    val id: String?,
    val startTime: String,
    val endTime: String,
    val description: String?
)

data class ShiftTrade(
    val id: String,
    val requestingMemberId: String,
    val targetMemberId: String?,
    val shiftId: String,
    val status: String,
    val reason: String?,
    val createdAt: String?
)

data class StaffTask(
    val id: String,
    val title: String,
    val description: String?,
    val status: String,
    val priority: String?,
    val assignedMemberId: String?,
    val dueDate: String?
)
