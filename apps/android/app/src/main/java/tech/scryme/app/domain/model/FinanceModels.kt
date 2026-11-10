package tech.scryme.app.domain.model

/**
 * Domain representation of overall expense summary and breakdowns.
 */
data class ExpenseSummary(
    val totalAmount: String,
    val totalApproved: String,
    val totalPending: String,
    val totalRejected: String,
    val totalTaxAmount: String,
    val totalExpensesCount: Int,
    val categoryBreakdown: List<ExpenseCategoryBreakdown> = emptyList(),
    val rawTotalAmount: Double = 0.0,
    val rawTotalApproved: Double = 0.0,
    val rawTotalPending: Double = 0.0,
    val rawTotalRejected: Double = 0.0
)

data class ExpenseCategoryBreakdown(
    val id: String,
    val name: String,
    val total: String,
    val count: Int,
    val rawTotal: Double = 0.0
)

enum class ExpenseStatusDomain {
    PENDING,
    APPROVED,
    REJECTED,
    PAID
}

/**
 * Domain model for an Expense item.
 */
data class ExpenseItem(
    val id: String,
    val expenseNumber: String,
    val description: String,
    val amount: String,
    val rawAmount: Double,
    val currencyCode: String,
    val taxAmount: String?,
    val taxRate: String?,
    val paymentMethod: String,
    val status: ExpenseStatusDomain,
    val expenseDate: String,
    val receiptUrl: String?,
    val notes: String?,
    val tags: List<String> = emptyList(),
    val isReimbursable: Boolean = false,
    val isBillable: Boolean = false,
    val categoryName: String,
    val locationName: String?,
    val requesterName: String?,
    val requesterEmail: String?,
    val pettyCashFundName: String?,
    val utilityAccountName: String?,
    val createdAt: String
)

/**
 * Domain model for a Petty Cash Fund.
 */
data class PettyCashFund(
    val id: String,
    val name: String,
    val currentBalance: String,
    val floatAmount: String,
    val rawCurrentBalance: Double,
    val rawFloatAmount: Double,
    val currencyCode: String,
    val responsibleMemberName: String?,
    val responsibleMemberEmail: String?,
    val isActive: Boolean = true,
    val utilizationPercent: Float = 0f
)

/**
 * Domain model for a Petty Cash Transaction.
 */
data class PettyCashTransaction(
    val id: String,
    val fundId: String,
    val type: String, // TOP_UP, EXPENSE, ADJUSTMENT
    val amount: String,
    val rawAmount: Double,
    val description: String,
    val memberName: String?,
    val createdAt: String
)

/**
 * Domain model for a Utility Account.
 */
data class UtilityAccount(
    val id: String,
    val name: String,
    val provider: String?,
    val accountNumber: String,
    val meterNumber: String?,
    val type: String, // ELECTRICITY, WATER, INTERNET, GAS, WASTE_MANAGEMENT, OTHER
    val createdAt: String,
    val recentExpenses: List<ExpenseItem> = emptyList(),
    val totalSpent: String = "$0.00",
    val rawTotalSpent: Double = 0.0
)
