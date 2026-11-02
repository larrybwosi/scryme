package tech.scryme.app.domain.model

sealed class TimelineItem {
    abstract val id: String
    abstract val title: String
    abstract val timeDisplay: String
    abstract val isCompleted: Boolean

    data class TaskItem(
        val task: StaffTask,
        override val id: String = task.id,
        override val title: String = task.title,
        override val timeDisplay: String = task.dueTime?.takeIf { it.isNotBlank() } ?: "All Day",
        override val isCompleted: Boolean = task.status.equals("COMPLETED", ignoreCase = true) || task.status.equals("DONE", ignoreCase = true),
        val category: String? = task.category,
        val priority: String = task.priority ?: "MEDIUM",
        val assignedMemberId: String? = task.assignedMemberId,
        val breakdownTotal: Int = task.subtaskGroups.sumOf { it.items.size },
        val breakdownCompleted: Int = task.subtaskGroups.sumOf { g -> g.items.count { it.isCompleted } }
    ) : TimelineItem()

    data class ShiftItem(
        val shift: StaffShift,
        override val id: String = shift.id,
        override val title: String = "Staff Shift",
        override val timeDisplay: String = "${shift.startTime} - ${shift.endTime}",
        override val isCompleted: Boolean = false,
        val breaksCount: Int = shift.breaks.size
    ) : TimelineItem()
}
