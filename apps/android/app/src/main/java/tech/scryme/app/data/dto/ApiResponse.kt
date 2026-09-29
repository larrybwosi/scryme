package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

/**
 * Standard V3 NestJS API response envelope wrapper.
 */
data class V3ApiResponse<T>(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("data") val data: T? = null,
    @SerializedName("error") val error: V3ApiError? = null,
    @SerializedName("timestamp") val timestamp: String? = null
)

data class V3ApiError(
    @SerializedName("code") val code: String? = null,
    @SerializedName("message") val message: String,
    @SerializedName("details") val details: Any? = null
)
