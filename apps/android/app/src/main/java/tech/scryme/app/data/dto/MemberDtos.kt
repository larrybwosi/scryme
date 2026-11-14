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

data class StaffOverviewDto(
    @SerializedName("member") val member: MemberDto,
    @SerializedName("tasks") val tasks: List<StaffTaskDto>? = null,
    @SerializedName("checkins") val checkins: List<StaffCheckinDto>? = null,
    @SerializedName("activity") val activity: List<StaffActivityDto>? = null
)

data class StaffCheckinDto(
    @SerializedName("id") val id: String,
    @SerializedName("checkInTime") val checkInTime: String,
    @SerializedName("checkOutTime") val checkOutTime: String? = null,
    @SerializedName("durationMinutes") val durationMinutes: Int? = null,
    @SerializedName("shiftStatus") val shiftStatus: String? = null,
    @SerializedName("verificationMethod") val verificationMethod: String? = null,
    @SerializedName("isLocationVerified") val isLocationVerified: Boolean = false,
    @SerializedName("locationName") val locationName: String? = null,
    @SerializedName("branchCode") val branchCode: String? = null
)

data class StaffActivityDto(
    @SerializedName("id") val id: String,
    @SerializedName("action") val action: String,
    @SerializedName("entityType") val entityType: String? = null,
    @SerializedName("entityId") val entityId: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("timestamp") val timestamp: String? = null
)
