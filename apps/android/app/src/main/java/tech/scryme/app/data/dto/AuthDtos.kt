package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

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
