package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class MemberDto(
    @SerializedName("id") val id: String,
    @SerializedName("organizationId") val organizationId: String,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("status") val status: String? = "ONLINE", // ONLINE, BUSY, OFFLINE, AWAY
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class UpdateMemberDto(
    @SerializedName("name") val name: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null
)

data class UpdateMemberStatusDto(
    @SerializedName("status") val status: String
)
