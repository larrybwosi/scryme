package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class RegisterDeviceRequestDto(
    @SerializedName("deviceId") val deviceId: String,
    @SerializedName("modelName") val modelName: String? = null,
    @SerializedName("appVersion") val appVersion: String? = null,
    @SerializedName("osVersion") val osVersion: String? = null,
    @SerializedName("pushToken") val pushToken: String? = null,
    @SerializedName("metadata") val metadata: Map<String, Any>? = null
)

data class RegisterDeviceResponseDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("deviceId") val deviceId: String? = null,
    @SerializedName("deviceName") val deviceName: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("appVersion") val appVersion: String? = null
)
