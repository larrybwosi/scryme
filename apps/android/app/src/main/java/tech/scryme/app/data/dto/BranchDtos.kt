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

data class BranchActivityResponseDto(
    @SerializedName("activity") val activity: List<BranchActivityDto>
)

data class BranchActivityDto(
    @SerializedName("id") val id: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("memberName") val memberName: String,
    @SerializedName("memberAvatar") val memberAvatar: String? = null,
    @SerializedName("checkInTime") val checkInTime: String,
    @SerializedName("checkOutTime") val checkOutTime: String? = null,
    @SerializedName("shiftStatus") val shiftStatus: String? = null,
    @SerializedName("verificationMethod") val verificationMethod: String? = null,
    @SerializedName("isLocationVerified") val isLocationVerified: Boolean = false,
    @SerializedName("distanceMeters") val distanceMeters: Double? = null,
    @SerializedName("notes") val notes: String? = null
)

data class BranchSalesResponseDto(
    @SerializedName("sales") val sales: List<BranchSaleDto>
)

data class BranchSaleDto(
    @SerializedName("id") val id: String,
    @SerializedName("transactionNumber") val transactionNumber: String,
    @SerializedName("totalAmount") val totalAmount: Double,
    @SerializedName("currencyCode") val currencyCode: String? = "USD",
    @SerializedName("customerName") val customerName: String? = null,
    @SerializedName("cashierName") val cashierName: String? = null,
    @SerializedName("status") val status: String? = "CONFIRMED",
    @SerializedName("createdAt") val createdAt: String
)

data class BranchStockMovementsResponseDto(
    @SerializedName("movements") val movements: List<BranchStockMovementDto>
)

data class BranchStockMovementDto(
    @SerializedName("id") val id: String,
    @SerializedName("variantName") val variantName: String,
    @SerializedName("quantity") val quantity: Double,
    @SerializedName("movementType") val movementType: String,
    @SerializedName("direction") val direction: String,
    @SerializedName("fromLocationName") val fromLocationName: String? = null,
    @SerializedName("toLocationName") val toLocationName: String? = null,
    @SerializedName("performedBy") val performedBy: String? = null,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("notes") val notes: String? = null
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

data class UpdateBranchCoordinatesDto(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)
