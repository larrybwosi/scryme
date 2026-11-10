package tech.scryme.app.data.repository

import tech.scryme.app.data.api.FinanceApiService
import tech.scryme.app.data.dto.ExpenseDto
import tech.scryme.app.data.dto.PettyCashFundDto
import tech.scryme.app.data.dto.PettyCashTransactionDto
import tech.scryme.app.data.dto.RejectExpenseRequestDto
import tech.scryme.app.data.dto.TopUpPettyCashRequestDto
import tech.scryme.app.data.dto.UtilityAccountDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.ExpenseCategoryBreakdown
import tech.scryme.app.domain.model.ExpenseItem
import tech.scryme.app.domain.model.ExpenseStatusDomain
import tech.scryme.app.domain.model.ExpenseSummary
import tech.scryme.app.domain.model.PettyCashFund
import tech.scryme.app.domain.model.PettyCashTransaction
import tech.scryme.app.domain.model.UtilityAccount
import tech.scryme.app.domain.repository.FinanceRepository
import tech.scryme.app.util.CurrencyUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FinanceRepositoryImpl @Inject constructor(
    private val financeApiService: FinanceApiService,
    private val sessionManager: SessionManager
) : FinanceRepository {

    override suspend fun getExpenseSummary(startDate: String?, endDate: String?): Result<ExpenseSummary> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getExpenseSummary(startDate, endDate)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                val data = body.data
                val totalAmount = data.totalAmount ?: 0.0
                val totalApproved = data.totalApproved ?: 0.0
                val totalPending = data.totalPending ?: 0.0
                val totalRejected = data.totalRejected ?: 0.0
                val totalTax = data.totalTaxAmount ?: 0.0

                val categoryBreakdown = (data.categoryBreakdown ?: emptyList()).map { cat ->
                    val catTotal = cat.total ?: 0.0
                    ExpenseCategoryBreakdown(
                        id = cat.id ?: "",
                        name = cat.name ?: "Uncategorized",
                        total = CurrencyUtils.formatAmount(catTotal, currencyCode, currencySymbol),
                        count = cat.count ?: 0,
                        rawTotal = catTotal
                    )
                }

                Result.success(
                    ExpenseSummary(
                        totalAmount = CurrencyUtils.formatAmount(totalAmount, currencyCode, currencySymbol),
                        totalApproved = CurrencyUtils.formatAmount(totalApproved, currencyCode, currencySymbol),
                        totalPending = CurrencyUtils.formatAmount(totalPending, currencyCode, currencySymbol),
                        totalRejected = CurrencyUtils.formatAmount(totalRejected, currencyCode, currencySymbol),
                        totalTaxAmount = CurrencyUtils.formatAmount(totalTax, currencyCode, currencySymbol),
                        totalExpensesCount = data.totalExpensesCount ?: 0,
                        categoryBreakdown = categoryBreakdown,
                        rawTotalAmount = totalAmount,
                        rawTotalApproved = totalApproved,
                        rawTotalPending = totalPending,
                        rawTotalRejected = totalRejected
                    )
                )
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load expense summary" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getExpenses(
        status: String?,
        categoryId: String?,
        startDate: String?,
        endDate: String?
    ): Result<List<ExpenseItem>> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getExpenses(status, categoryId, startDate, endDate)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                val expenseDtos = body.data
                val items = expenseDtos.map { dto -> mapExpenseDtoToDomain(dto, currencyCode, currencySymbol) }
                Result.success(items)
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load expenses" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getExpenseDetails(expenseId: String): Result<ExpenseItem> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getExpenseDetails(expenseId)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(mapExpenseDtoToDomain(body.data, currencyCode, currencySymbol))
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load expense details" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun approveExpense(expenseId: String): Result<ExpenseItem> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.approveExpense(expenseId)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(mapExpenseDtoToDomain(body.data, currencyCode, currencySymbol))
            } else {
                val errorMsg = response.message().ifBlank { "Failed to approve expense" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun rejectExpense(expenseId: String, reason: String?): Result<ExpenseItem> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.rejectExpense(expenseId, RejectExpenseRequestDto(reason))
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(mapExpenseDtoToDomain(body.data, currencyCode, currencySymbol))
            } else {
                val errorMsg = response.message().ifBlank { "Failed to reject expense" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getPettyCashFunds(): Result<List<PettyCashFund>> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getPettyCashFunds()
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                val funds = body.data.map { dto -> mapPettyCashFundDtoToDomain(dto, currencyCode, currencySymbol) }
                Result.success(funds)
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load petty cash funds" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getPettyCashTransactions(fundId: String): Result<List<PettyCashTransaction>> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getPettyCashTransactions(fundId)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                val txs = body.data.map { dto -> mapPettyCashTransactionDtoToDomain(dto, currencyCode, currencySymbol) }
                Result.success(txs)
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load petty cash transactions" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun topUpPettyCashFund(fundId: String, amount: Double, description: String?): Result<PettyCashFund> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.topUpPettyCashFund(fundId, TopUpPettyCashRequestDto(amount, description))
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(mapPettyCashFundDtoToDomain(body.data, currencyCode, currencySymbol))
            } else {
                val errorMsg = response.message().ifBlank { "Failed to top up petty cash fund" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getUtilityAccounts(): Result<List<UtilityAccount>> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getUtilityAccounts()
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                val accounts = body.data.map { dto -> mapUtilityAccountDtoToDomain(dto, currencyCode, currencySymbol) }
                Result.success(accounts)
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load utility accounts" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getUtilityAccount(accountId: String): Result<UtilityAccount> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = financeApiService.getUtilityAccount(accountId)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(mapUtilityAccountDtoToDomain(body.data, currencyCode, currencySymbol))
            } else {
                val errorMsg = response.message().ifBlank { "Unable to load utility account details" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // --- Helper mappers ---

    private fun mapExpenseDtoToDomain(
        dto: ExpenseDto,
        currencyCode: String?,
        currencySymbol: String?
    ): ExpenseItem {
        val rawAmt = parseDouble(dto.amount)
        val formattedAmt = CurrencyUtils.formatAmount(rawAmt, currencyCode, currencySymbol)
        val rawTax = dto.taxAmount?.let { parseDouble(it) }
        val formattedTax = rawTax?.let { CurrencyUtils.formatAmount(it, currencyCode, currencySymbol) }
        val taxRateStr = dto.taxRate?.toString()?.takeIf { it.isNotBlank() }?.let { "$it%" }

        val statusEnum = when (dto.status?.uppercase()) {
            "APPROVED" -> ExpenseStatusDomain.APPROVED
            "REJECTED" -> ExpenseStatusDomain.REJECTED
            "PAID" -> ExpenseStatusDomain.PAID
            else -> ExpenseStatusDomain.PENDING
        }

        return ExpenseItem(
            id = dto.id,
            expenseNumber = dto.expenseNumber ?: "EXP-${dto.id.takeLast(4)}",
            description = dto.description ?: "Expense item",
            amount = formattedAmt,
            rawAmount = rawAmt,
            currencyCode = dto.currencyCode ?: currencyCode ?: "USD",
            taxAmount = formattedTax,
            taxRate = taxRateStr,
            paymentMethod = (dto.paymentMethod ?: "CASH").replace('_', ' '),
            status = statusEnum,
            expenseDate = dto.expenseDate?.take(10) ?: "",
            receiptUrl = dto.receiptUrl,
            notes = dto.notes,
            tags = dto.tags ?: emptyList(),
            isReimbursable = dto.isReimbursable ?: false,
            isBillable = dto.isBillable ?: false,
            categoryName = dto.category?.name ?: "General Expenses",
            locationName = dto.location?.name,
            requesterName = dto.member?.user?.name,
            requesterEmail = dto.member?.user?.email,
            pettyCashFundName = dto.pettyCashFund?.name,
            utilityAccountName = dto.utilityAccount?.name,
            createdAt = dto.createdAt ?: ""
        )
    }

    private fun mapPettyCashFundDtoToDomain(
        dto: PettyCashFundDto,
        currencyCode: String?,
        currencySymbol: String?
    ): PettyCashFund {
        val rawAmount = parseDouble(dto.amount)
        val rawFloat = parseDouble(dto.floatAmount)
        val ratio = if (rawFloat > 0.0) (rawAmount / rawFloat).toFloat().coerceIn(0f, 1f) else 1f

        return PettyCashFund(
            id = dto.id,
            name = dto.name,
            currentBalance = CurrencyUtils.formatAmount(rawAmount, currencyCode, currencySymbol),
            floatAmount = CurrencyUtils.formatAmount(rawFloat, currencyCode, currencySymbol),
            rawCurrentBalance = rawAmount,
            rawFloatAmount = rawFloat,
            currencyCode = dto.currencyCode ?: currencyCode ?: "USD",
            responsibleMemberName = dto.responsibleMember?.user?.name,
            responsibleMemberEmail = dto.responsibleMember?.user?.email,
            isActive = dto.isActive ?: true,
            utilizationPercent = ratio
        )
    }

    private fun mapPettyCashTransactionDtoToDomain(
        dto: PettyCashTransactionDto,
        currencyCode: String?,
        currencySymbol: String?
    ): PettyCashTransaction {
        val rawAmt = parseDouble(dto.amount)
        return PettyCashTransaction(
            id = dto.id,
            fundId = dto.fundId ?: "",
            type = dto.type ?: "EXPENSE",
            amount = CurrencyUtils.formatAmount(rawAmt, currencyCode, currencySymbol),
            rawAmount = rawAmt,
            description = dto.description ?: "Transaction",
            memberName = dto.member?.user?.name,
            createdAt = dto.createdAt ?: ""
        )
    }

    private fun mapUtilityAccountDtoToDomain(
        dto: UtilityAccountDto,
        currencyCode: String?,
        currencySymbol: String?
    ): UtilityAccount {
        val expenses = (dto.expenses ?: emptyList()).map { expDto ->
            mapExpenseDtoToDomain(expDto, currencyCode, currencySymbol)
        }
        val rawTotal = expenses.sumOf { it.rawAmount }
        val formattedTotal = CurrencyUtils.formatAmount(rawTotal, currencyCode, currencySymbol)

        return UtilityAccount(
            id = dto.id,
            name = dto.name,
            provider = dto.provider,
            accountNumber = dto.accountNumber,
            meterNumber = dto.meterNumber,
            type = dto.type ?: "OTHER",
            createdAt = dto.createdAt ?: "",
            recentExpenses = expenses,
            totalSpent = formattedTotal,
            rawTotalSpent = rawTotal
        )
    }

    private fun parseDouble(value: Any?): Double {
        if (value == null) return 0.0
        return when (value) {
            is Number -> value.toDouble()
            is String -> value.toDoubleOrNull() ?: 0.0
            else -> value.toString().toDoubleOrNull() ?: 0.0
        }
    }
}
