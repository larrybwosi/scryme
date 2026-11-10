package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import tech.scryme.app.data.dto.ExpenseDto
import tech.scryme.app.data.dto.ExpenseSummaryDto
import tech.scryme.app.data.dto.PettyCashFundDto
import tech.scryme.app.data.dto.PettyCashTransactionDto
import tech.scryme.app.data.dto.RejectExpenseRequestDto
import tech.scryme.app.data.dto.TopUpPettyCashRequestDto
import tech.scryme.app.data.dto.UtilityAccountDto
import tech.scryme.app.data.dto.V3ApiResponse

interface FinanceApiService {

    // --- Expenses ---

    @GET("finance/expenses")
    suspend fun getExpenses(
        @Query("status") status: String? = null,
        @Query("categoryId") categoryId: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<V3ApiResponse<List<ExpenseDto>>>

    @GET("finance/expenses/reports/summary")
    suspend fun getExpenseSummary(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<V3ApiResponse<ExpenseSummaryDto>>

    @GET("finance/expenses/{id}")
    suspend fun getExpenseDetails(
        @Path("id") id: String
    ): Response<V3ApiResponse<ExpenseDto>>

    @POST("finance/expenses/{id}/approve")
    suspend fun approveExpense(
        @Path("id") id: String
    ): Response<V3ApiResponse<ExpenseDto>>

    @POST("finance/expenses/{id}/reject")
    suspend fun rejectExpense(
        @Path("id") id: String,
        @Body request: RejectExpenseRequestDto
    ): Response<V3ApiResponse<ExpenseDto>>

    // --- Petty Cash ---

    @GET("finance/petty-cash")
    suspend fun getPettyCashFunds(): Response<V3ApiResponse<List<PettyCashFundDto>>>

    @GET("finance/petty-cash/{id}")
    suspend fun getPettyCashFund(
        @Path("id") id: String
    ): Response<V3ApiResponse<PettyCashFundDto>>

    @GET("finance/petty-cash/{id}/transactions")
    suspend fun getPettyCashTransactions(
        @Path("id") id: String
    ): Response<V3ApiResponse<List<PettyCashTransactionDto>>>

    @POST("finance/petty-cash/{id}/top-up")
    suspend fun topUpPettyCashFund(
        @Path("id") id: String,
        @Body request: TopUpPettyCashRequestDto
    ): Response<V3ApiResponse<PettyCashFundDto>>

    // --- Utilities ---

    @GET("finance/utility-accounts")
    suspend fun getUtilityAccounts(): Response<V3ApiResponse<List<UtilityAccountDto>>>

    @GET("finance/utility-accounts/{id}")
    suspend fun getUtilityAccount(
        @Path("id") id: String
    ): Response<V3ApiResponse<UtilityAccountDto>>
}
