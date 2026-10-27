package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class BranchListResponseDto(
    @SerializedName("locations") val locations: List<BranchDto>
)

data class BranchDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("code") val code: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("locationType") val locationType: String? = "STORE",
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("geofenceRadiusMeters") val geofenceRadiusMeters: Double? = 100.0,
    @SerializedName("isDefault") val isDefault: Boolean = false,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class CreateBranchRequestDto(
    @SerializedName("name") val name: String,
    @SerializedName("code") val code: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("locationType") val locationType: String? = "STORE",
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("geofenceRadiusMeters") val geofenceRadiusMeters: Double? = 100.0
)

data class UpdateBranchRequestDto(
    @SerializedName("name") val name: String? = null,
    @SerializedName("code") val code: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("locationType") val locationType: String? = null,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("geofenceRadiusMeters") val geofenceRadiusMeters: Double? = null,
    @SerializedName("isActive") val isActive: Boolean? = null
)
