package tech.scryme.app.domain.model

data class BranchLocation(
    val id: String,
    val name: String,
    val code: String?,
    val address: String?,
    val locationType: String,
    val isDefault: Boolean,
    val isActive: Boolean
)
