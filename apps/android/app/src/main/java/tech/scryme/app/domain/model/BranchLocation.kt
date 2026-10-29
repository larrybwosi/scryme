package tech.scryme.app.domain.model

data class BranchLocation(
    val id: String,
    val name: String,
    val code: String?,
    val address: String?,
    val phone: String?,
    val locationType: String,
    val geofenceRadiusMeters: Double?,
    val isDefault: Boolean,
    val isActive: Boolean
)
