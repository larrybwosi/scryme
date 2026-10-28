package tech.scryme.app.domain.model

data class BranchLocation(
    val id: String,
    val name: String,
    val code: String?,
    val address: String?,
    val phone: String?,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val locationType: String,
    val geofenceRadiusMeters: Double?,
    val isDefault: Boolean,
    val isActive: Boolean
)
