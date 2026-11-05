package tech.scryme.app.domain.model

data class BranchActivityItem(
    val id: String,
    val memberId: String,
    val memberName: String,
    val memberAvatar: String?,
    val checkInTime: String,
    val checkOutTime: String?,
    val shiftStatus: String,
    val verificationMethod: String?,
    val isLocationVerified: Boolean,
    val distanceMeters: Double?,
    val notes: String?
)

data class BranchSaleItem(
    val id: String,
    val transactionNumber: String,
    val totalAmount: Double,
    val currencyCode: String,
    val customerName: String,
    val cashierName: String,
    val status: String,
    val createdAt: String
)

data class BranchStockMovementItem(
    val id: String,
    val variantName: String,
    val quantity: Double,
    val movementType: String,
    val direction: String, // IN or OUT
    val fromLocationName: String?,
    val toLocationName: String?,
    val performedBy: String,
    val timestamp: String,
    val notes: String?
)
