package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

data class CustomerListResponseDto(
    @SerializedName("customers") val customers: List<CustomerDto>
)

data class CustomerDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("company") val company: String? = null,
    @SerializedName("customerType") val customerType: String? = "INDIVIDUAL",
    @SerializedName("loyaltyPoints") val loyaltyPoints: Int = 0,
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String
)

data class CustomerTransactionsResponseDto(
    @SerializedName("transactions") val transactions: List<CustomerTransactionDto>
)

data class CustomerTransactionDto(
    @SerializedName("id") val id: String,
    @SerializedName("transactionNumber") val transactionNumber: String,
    @SerializedName("totalAmount") val totalAmount: Double,
    @SerializedName("currencyCode") val currencyCode: String? = "USD",
    @SerializedName("status") val status: String? = "CONFIRMED",
    @SerializedName("cashierName") val cashierName: String? = null,
    @SerializedName("createdAt") val createdAt: String
)

data class UpdateCustomerRequestDto(
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("company") val company: String? = null,
    @SerializedName("isActive") val isActive: Boolean? = null
)
