package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class EmailSignInRequestDto(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class EmailSignInResponseDto(
    @SerializedName("token") val token: String? = null,
    @SerializedName("accessToken") val accessToken: String? = null,
    @SerializedName("user") val user: EmailUserDto? = null,
    @SerializedName("session") val session: EmailSessionDto? = null,
    @SerializedName("organization") val organization: OrganizationDetailDto? = null,
    @SerializedName("orgSlug") val orgSlug: String? = null
) {
    val effectiveToken: String
        get() = token ?: accessToken ?: session?.token ?: ""

    val effectiveOrgSlug: String
        get() = orgSlug ?: organization?.slug ?: user?.activeOrganizationId ?: session?.activeOrganizationId ?: "default"
}

data class EmailUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("activeOrganizationId") val activeOrganizationId: String? = null
)

data class EmailSessionDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("activeOrganizationId") val activeOrganizationId: String? = null
)

data class OrganizationDetailDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("slug") val slug: String? = null,
    @SerializedName("name") val name: String? = null
)

data class TerminalLoginRequestDto(
    @SerializedName("pin") val pin: String? = null,
    @SerializedName("cardId") val cardId: String? = null
)

data class TerminalLoginResponseDto(
    @SerializedName("accessToken") val accessToken: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("memberId") val memberId: String? = null,
    @SerializedName("organizationId") val organizationId: String? = null,
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("member") val member: MemberUserDto? = null
) {
    val effectiveToken: String
        get() = token ?: accessToken ?: ""

    val effectiveMemberId: String
        get() = memberId ?: member?.id ?: ""
}

data class MemberUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("role") val role: String? = null,
    @SerializedName("user") val user: UserDetailDto? = null
)

data class UserDetailDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("name") val name: String? = null
)

data class TokenExchangeRequestDto(
    @SerializedName("clientId") val clientId: String,
    @SerializedName("clientSecret") val clientSecret: String
)

data class TokenExchangeResponseDto(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("tokenType") val tokenType: String = "Bearer",
    @SerializedName("expiresIn") val expiresIn: Long
)

data class PosPairRequestDto(
    @SerializedName("sessionId") val sessionId: String? = null,
    @SerializedName("pairingCode") val pairingCode: String? = null,
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("deviceName") val deviceName: String? = "Android POS Terminal",
    @SerializedName("deviceType") val deviceType: String? = "ANDROID"
)

data class PosPairResponseDto(
    @SerializedName("sessionId") val sessionId: String? = null,
    @SerializedName("pairingCode") val pairingCode: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("deviceKey") val deviceKey: String? = null,
    @SerializedName("apiKey") val apiKey: String? = null,
    @SerializedName("organizationId") val organizationId: String? = null,
    @SerializedName("authorized") val authorized: Boolean = true
)
