package tech.scryme.app.domain.model

data class UserProfile(
    val id: String,
    val organizationId: String,
    val userId: String?,
    val name: String,
    val email: String?,
    val phone: String?,
    val role: String?,
    val status: String,
    val isActive: Boolean,
    val avatarUrl: String?
)
