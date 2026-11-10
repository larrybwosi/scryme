package tech.scryme.app

import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.FinanceApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.data.repository.FinanceRepositoryImpl
import tech.scryme.app.domain.model.ExpenseStatusDomain

class FinanceRepositoryTest {

    private val apiService: FinanceApiService = mockk()
    private val sessionManager: SessionManager = mockk()
    private lateinit var repository: FinanceRepositoryImpl

    @Before
    fun setUp() {
        coEvery { sessionManager.getOrgCurrency() } returns "USD"
        coEvery { sessionManager.getOrgCurrencySymbol() } returns "$"
        repository = FinanceRepositoryImpl(apiService, sessionManager)
    }

    @Test
    fun getExpenseSummary_success_returnsFormattedSummary() = runTest {
        val summaryDto = ExpenseSummaryDto(
            totalAmount = 12500.50,
            totalApproved = 10000.0,
            totalPending = 2000.0,
            totalRejected = 500.50,
            totalTaxAmount = 1200.0,
            totalExpensesCount = 15,
            categoryBreakdown = listOf(
                ExpenseCategoryBreakdownDto(id = "cat_1", name = "Office Supplies", total = 3500.0, count = 5)
            )
        )
        val apiResponse = V3ApiResponse(success = true, data = summaryDto)
        coEvery { apiService.getExpenseSummary(any(), any()) } returns Response.success(apiResponse)

        val result = repository.getExpenseSummary()

        assertTrue(result.isSuccess)
        val summary = result.getOrNull()
        assertNotNull(summary)
        assertEquals("$12,500.50", summary?.totalAmount)
        assertEquals("$10,000.00", summary?.totalApproved)
        assertEquals(1, summary?.categoryBreakdown?.size)
        assertEquals("Office Supplies", summary?.categoryBreakdown?.first()?.name)
    }

    @Test
    fun getExpenses_success_returnsExpenseList() = runTest {
        val expenseDto = ExpenseDto(
            id = "exp_1",
            expenseNumber = "EXP-2025-0001",
            description = "Electricity Bill May",
            amount = 450.0,
            currencyCode = "USD",
            status = "PENDING",
            category = ExpenseRelationDto(id = "cat_util", name = "Utilities"),
            paymentMethod = "BANK_TRANSFER"
        )
        val apiResponse = V3ApiResponse(success = true, data = listOf(expenseDto))
        coEvery { apiService.getExpenses(any(), any(), any(), any()) } returns Response.success(apiResponse)

        val result = repository.getExpenses()

        assertTrue(result.isSuccess)
        val list = result.getOrNull()
        assertEquals(1, list?.size)
        val item = list?.first()
        assertEquals("EXP-2025-0001", item?.expenseNumber)
        assertEquals("$450.00", item?.amount)
        assertEquals(ExpenseStatusDomain.PENDING, item?.status)
    }

    @Test
    fun approveExpense_success_returnsApprovedItem() = runTest {
        val expenseDto = ExpenseDto(
            id = "exp_1",
            expenseNumber = "EXP-2025-0001",
            description = "Electricity Bill May",
            amount = 450.0,
            status = "APPROVED"
        )
        val apiResponse = V3ApiResponse(success = true, data = expenseDto)
        coEvery { apiService.approveExpense("exp_1") } returns Response.success(apiResponse)

        val result = repository.approveExpense("exp_1")

        assertTrue(result.isSuccess)
        assertEquals(ExpenseStatusDomain.APPROVED, result.getOrNull()?.status)
    }

    @Test
    fun getPettyCashFunds_success_returnsFundsWithUtilization() = runTest {
        val fundDto = PettyCashFundDto(
            id = "pcf_1",
            name = "Main Vault Petty Cash",
            amount = 800.0,
            floatAmount = 1000.0,
            currencyCode = "USD",
            responsibleMember = ExpenseMemberDto("mem_1", ExpenseUserDto("Alice", "alice@example.com"))
        )
        val apiResponse = V3ApiResponse(success = true, data = listOf(fundDto))
        coEvery { apiService.getPettyCashFunds() } returns Response.success(apiResponse)

        val result = repository.getPettyCashFunds()

        assertTrue(result.isSuccess)
        val fund = result.getOrNull()?.first()
        assertNotNull(fund)
        assertEquals("Main Vault Petty Cash", fund?.name)
        assertEquals("$800.00", fund?.currentBalance)
        assertEquals("$1,000.00", fund?.floatAmount)
        assertEquals(0.8f, fund?.utilizationPercent ?: 0f, 0.01f)
    }

    @Test
    fun getUtilityAccounts_success_returnsAccountsWithBills() = runTest {
        val utilDto = UtilityAccountDto(
            id = "util_1",
            name = "Headquarters Electricity",
            provider = "Kenya Power",
            accountNumber = "12345678",
            meterNumber = "MTR-9988",
            type = "ELECTRICITY",
            expenses = listOf(
                ExpenseDto(id = "exp_u1", description = "April Power", amount = 300.0)
            )
        )
        val apiResponse = V3ApiResponse(success = true, data = listOf(utilDto))
        coEvery { apiService.getUtilityAccounts() } returns Response.success(apiResponse)

        val result = repository.getUtilityAccounts()

        assertTrue(result.isSuccess)
        val util = result.getOrNull()?.first()
        assertNotNull(util)
        assertEquals("Headquarters Electricity", util?.name)
        assertEquals(1, util?.recentExpenses?.size)
        assertEquals("$300.00", util?.totalSpent)
    }
}
