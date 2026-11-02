package tech.scryme.app.domain.model

data class SubtaskItem(
    val id: String,
    val title: String,
    val isCompleted: Boolean = false
)

data class SubtaskGroup(
    val id: String,
    val title: String,
    val items: List<SubtaskItem> = emptyList()
)

data class StaffShift(
    val id: String,
    val memberId: String,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val breaks: List<ShiftBreak> = emptyList(),
    val locationId: String? = null,
    val isActive: Boolean = true,
    val assessment: ShiftAssessment? = null
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
    val category: String? = "UI/UX Design",
    val assignedMemberId: String? = null,
    val dueDate: String? = null,
    val dueTime: String? = null,
    val estimatedHours: Double? = null,
    val actualHours: Double? = null,
    val assessment: TaskAssessment? = null,
    val subtaskGroups: List<SubtaskGroup> = emptyList()
)

data class TaskAssessment(
    val id: String? = null,
    val taskId: String,
    val qualityScore: Int = 5,
    val complexity: String = "MEDIUM",
    val riskLevel: String = "LOW",
    val estimatedHours: Double? = null,
    val actualHours: Double? = null,
    val notes: String? = null,
    val createdAt: String? = null
)

data class ShiftAssessment(
    val id: String? = null,
    val shiftId: String,
    val memberId: String? = null,
    val ratingScore: Int = 5,
    val attendancePunctuality: String = "ON_TIME",
    val shiftNotes: String? = null,
    val verifiedBy: String? = null,
    val createdAt: String? = null
)
