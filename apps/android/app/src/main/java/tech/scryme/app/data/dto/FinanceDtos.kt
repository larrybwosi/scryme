package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName

/**
 * DTOs for Expense Summary & Breakdown Analytics.
 */
data class ExpenseSummaryDto(
    @SerializedName("totalAmount") val totalAmount: Double? = 0.0,
    @SerializedName("totalApproved") val totalApproved: Double? = 0.0,
    @SerializedName("totalPending") val totalPending: Double? = 0.0,
    @SerializedName("totalRejected") val totalRejected: Double? = 0.0,
    @SerializedName("totalTaxAmount") val totalTaxAmount: Double? = 0.0,
    @SerializedName("totalExpensesCount") val totalExpensesCount: Int? = 0,
    @SerializedName("categoryBreakdown") val categoryBreakdown: List<ExpenseCategoryBreakdownDto>? = null,
    @SerializedName("costCenterBreakdown") val costCenterBreakdown: List<ExpenseCostCenterBreakdownDto>? = null
)

data class ExpenseCategoryBreakdownDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("total") val total: Double? = 0.0,
    @SerializedName("count") val count: Int? = 0
)

data class ExpenseCostCenterBreakdownDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("code") val code: String? = null,
    @SerializedName("total") val total: Double? = 0.0,
    @SerializedName("count") val count: Int? = 0
)

/**
 * Expense Entity DTO.
 */
data class ExpenseDto(
    @SerializedName("id") val id: String,
    @SerializedName("expenseNumber") val expenseNumber: String? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("amount") val amount: Any? = null, // Can be String, Number, or Prisma Decimal
    @SerializedName("currencyCode") val currencyCode: String? = null,
    @SerializedName("taxAmount") val taxAmount: Any? = null,
    @SerializedName("taxRate") val taxRate: Any? = null,
    @SerializedName("paymentMethod") val paymentMethod: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("expenseDate") val expenseDate: String? = null,
    @SerializedName("receiptUrl") val receiptUrl: String? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("tags") val tags: List<String>? = null,
    @SerializedName("isReimbursable") val isReimbursable: Boolean? = false,
    @SerializedName("isBillable") val isBillable: Boolean? = false,
    @SerializedName("categoryId") val categoryId: String? = null,
    @SerializedName("category") val category: ExpenseRelationDto? = null,
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("location") val location: ExpenseRelationDto? = null,
    @SerializedName("memberId") val memberId: String? = null,
    @SerializedName("member") val member: ExpenseMemberDto? = null,
    @SerializedName("pettyCashFundId") val pettyCashFundId: String? = null,
    @SerializedName("pettyCashFund") val pettyCashFund: ExpenseRelationDto? = null,
    @SerializedName("utilityAccountId") val utilityAccountId: String? = null,
    @SerializedName("utilityAccount") val utilityAccount: ExpenseRelationDto? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class ExpenseRelationDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String? = null
)

data class ExpenseMemberDto(
    @SerializedName("id") val id: String,
    @SerializedName("user") val user: ExpenseUserDto? = null
)

data class ExpenseUserDto(
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null
)

data class RejectExpenseRequestDto(
    @SerializedName("reason") val reason: String? = null
)

/**
 * Petty Cash Entity & Transaction DTOs.
 */
data class PettyCashFundDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("amount") val amount: Any? = null,
    @SerializedName("floatAmount") val floatAmount: Any? = null,
    @SerializedName("currencyCode") val currencyCode: String? = null,
    @SerializedName("responsibleMemberId") val responsibleMemberId: String? = null,
    @SerializedName("responsibleMember") val responsibleMember: ExpenseMemberDto? = null,
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("isActive") val isActive: Boolean? = true,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class PettyCashTransactionDto(
    @SerializedName("id") val id: String,
    @SerializedName("fundId") val fundId: String? = null,
    @SerializedName("type") val type: String? = null,
    @SerializedName("amount") val amount: Any? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("memberId") val memberId: String? = null,
    @SerializedName("member") val member: ExpenseMemberDto? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class TopUpPettyCashRequestDto(
    @SerializedName("amount") val amount: Double,
    @SerializedName("description") val description: String? = null
)

/**
 * Utility Account DTOs.
 */
data class UtilityAccountDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("provider") val provider: String? = null,
    @SerializedName("accountNumber") val accountNumber: String,
    @SerializedName("meterNumber") val meterNumber: String? = null,
    @SerializedName("type") val type: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null,
    @SerializedName("expenses") val expenses: List<ExpenseDto>? = null
)
