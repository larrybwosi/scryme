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
    @SerializedName("locationType") val locationType: String? = "STORE",
    @SerializedName("isDefault") val isDefault: Boolean = false,
    @SerializedName("isActive") val isActive: Boolean = true
)
