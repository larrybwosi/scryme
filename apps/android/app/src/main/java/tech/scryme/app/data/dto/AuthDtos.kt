package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class TerminalLoginRequestDto(
    @SerializedName("pin") val pin: String? = null,
    @SerializedName("cardId") val cardId: String? = null
)

data class TerminalLoginResponseDto(
    @SerializedName("accessToken") val accessToken: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("organizationId") val organizationId: String,
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null
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
