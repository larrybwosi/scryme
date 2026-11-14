package tech.scryme.app.domain.model

data class StaffCheckin(
    val id: String,
    val checkInTime: String,
    val checkOutTime: String? = null,
    val durationMinutes: Int? = null,
    val shiftStatus: String? = null,
    val verificationMethod: String? = null,
    val isLocationVerified: Boolean = false,
    val locationName: String? = null,
    val branchCode: String? = null
)

data class StaffActivity(
    val id: String,
    val action: String,
    val entityType: String? = null,
    val entityId: String? = null,
    val description: String? = null,
    val status: String? = null,
    val timestamp: String? = null
)

data class StaffOverview(
    val member: UserProfile,
    val tasks: List<StaffTask> = emptyList(),
    val checkins: List<StaffCheckin> = emptyList(),
    val activity: List<StaffActivity> = emptyList()
)
