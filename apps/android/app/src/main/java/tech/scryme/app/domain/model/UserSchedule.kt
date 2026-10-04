package tech.scryme.app.domain.model

data class StaffShift(
    val id: String,
    val memberId: String,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val breaks: List<ShiftBreak> = emptyList(),
    val locationId: String? = null,
    val isActive: Boolean = true
)

data class ShiftBreak(
    val id: String? = null,
    val startTime: String,
    val endTime: String,
    val description: String? = null
)

data class ShiftTrade(
    val id: String,
    val requestingMemberId: String,
    val targetMemberId: String? = null,
    val shiftId: String,
    val status: String,
    val reason: String? = null,
    val createdAt: String? = null
)

data class StaffTask(
    val id: String,
    val title: String,
    val description: String? = null,
    val status: String,
    val priority: String? = "MEDIUM",
    val assignedMemberId: String? = null,
    val dueDate: String? = null
)
