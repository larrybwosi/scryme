package tech.scryme.app.domain.repository

import tech.scryme.app.domain.model.ExpenseItem
import tech.scryme.app.domain.model.ExpenseSummary
import tech.scryme.app.domain.model.PettyCashFund
import tech.scryme.app.domain.model.PettyCashTransaction
import tech.scryme.app.domain.model.UtilityAccount

interface FinanceRepository {

    suspend fun getExpenseSummary(
        startDate: String? = null,
        endDate: String? = null
    ): Result<ExpenseSummary>

    suspend fun getExpenses(
        status: String? = null,
        categoryId: String? = null,
        startDate: String? = null,
        endDate: String? = null
    ): Result<List<ExpenseItem>>

    suspend fun getExpenseDetails(expenseId: String): Result<ExpenseItem>

    suspend fun approveExpense(expenseId: String): Result<ExpenseItem>

    suspend fun rejectExpense(expenseId: String, reason: String? = null): Result<ExpenseItem>

    suspend fun getPettyCashFunds(): Result<List<PettyCashFund>>

    suspend fun getPettyCashTransactions(fundId: String): Result<List<PettyCashTransaction>>

    suspend fun topUpPettyCashFund(fundId: String, amount: Double, description: String? = null): Result<PettyCashFund>

    suspend fun getUtilityAccounts(): Result<List<UtilityAccount>>

    suspend fun getUtilityAccount(accountId: String): Result<UtilityAccount>
}
