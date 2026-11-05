package tech.scryme.app.domain.model

data class CustomerItem(
    val id: String,
    val name: String,
    val email: String?,
    val phone: String?,
    val company: String?,
    val customerType: String,
    val loyaltyPoints: Int,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class CustomerTransactionItem(
    val id: String,
    val transactionNumber: String,
    val totalAmount: Double,
    val currencyCode: String,
    val status: String,
    val cashierName: String?,
    val createdAt: String
)
