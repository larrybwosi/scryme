package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.domain.model.*
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.FinanceRepository
import tech.scryme.app.ui.finance.DateRangePreset
import tech.scryme.app.ui.finance.FinanceTab
import tech.scryme.app.ui.finance.FinanceViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class FinanceViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val financeRepository = mockk<FinanceRepository>()
    private val authRepository = mockk<AuthRepository>()
    private lateinit var viewModel: FinanceViewModel

    private val sampleSummary = ExpenseSummary(
        totalAmount = "$5,000.00",
        totalApproved = "$4,000.00",
        totalPending = "$1,000.00",
        totalRejected = "$0.00",
        totalTaxAmount = "$500.00",
        totalExpensesCount = 10
    )

    private val sampleExpense = ExpenseItem(
        id = "exp_1",
        expenseNumber = "EXP-001",
        description = "Internet Subscription",
        amount = "$100.00",
        rawAmount = 100.0,
        currencyCode = "USD",
        taxAmount = null,
        taxRate = null,
        paymentMethod = "CARD",
        status = ExpenseStatusDomain.PENDING,
        expenseDate = "2025-05-20",
        receiptUrl = null,
        notes = null,
        categoryName = "Internet",
        locationName = null,
        requesterName = "John",
        requesterEmail = "john@example.com",
        pettyCashFundName = null,
        utilityAccountName = null,
        createdAt = "2025-05-20"
    )

    private val sampleFund = PettyCashFund(
        id = "fund_1",
        name = "Front Desk",
        currentBalance = "$500.00",
        floatAmount = "$500.00",
        rawCurrentBalance = 500.0,
        rawFloatAmount = 500.0,
        currencyCode = "USD",
        responsibleMemberName = "Sarah",
        responsibleMemberEmail = "sarah@example.com",
        utilizationPercent = 1.0f
    )

    private val sampleUtility = UtilityAccount(
        id = "util_1",
        name = "Water Supply",
        provider = "City Water",
        accountNumber = "W-100",
        meterNumber = null,
        type = "WATER",
        createdAt = "2025-05-01",
        recentExpenses = emptyList(),
        totalSpent = "$0.00",
        rawTotalSpent = 0.0
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        coEvery { authRepository.validateSession() } returns Result.failure(Exception("Offline"))
        coEvery { financeRepository.getExpenseSummary(any(), any()) } returns Result.success(sampleSummary)
        coEvery { financeRepository.getExpenses(any(), any(), any(), any()) } returns Result.success(listOf(sampleExpense))
        coEvery { financeRepository.getPettyCashFunds() } returns Result.success(listOf(sampleFund))
        coEvery { financeRepository.getPettyCashTransactions(any()) } returns Result.success(emptyList())
        coEvery { financeRepository.getUtilityAccounts() } returns Result.success(listOf(sampleUtility))
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun init_loadsAllFinanceDataSuccessfully() = runTest {
        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state.isAuthorized)
        assertEquals(FinanceTab.EXPENSES, state.selectedTab)
        assertEquals(DateRangePreset.THIS_MONTH, state.selectedDatePreset)
        assertNotNull(state.expenseSummary)
        assertEquals(1, state.expenses.size)
        assertEquals(1, state.pettyCashFunds.size)
        assertEquals(1, state.utilityAccounts.size)
        coVerify { financeRepository.getExpenses(any(), any(), any(), any()) }
    }

    @Test
    fun selectDatePreset_switchesPresetsCorrectly() = runTest {
        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectDatePreset(DateRangePreset.TODAY)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.TODAY, viewModel.uiState.value.selectedDatePreset)

        viewModel.selectDatePreset(DateRangePreset.THIS_WEEK)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.THIS_WEEK, viewModel.uiState.value.selectedDatePreset)

        viewModel.selectDatePreset(DateRangePreset.LAST_30_DAYS)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.LAST_30_DAYS, viewModel.uiState.value.selectedDatePreset)

        viewModel.selectDatePreset(DateRangePreset.ALL)
        testScheduler.advanceUntilIdle()
        assertEquals(DateRangePreset.ALL, viewModel.uiState.value.selectedDatePreset)
    }

    @Test
    fun setCustomDateRange_setsCustomRangeAndReloads() = runTest {
        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.setCustomDateRange("2025-01-01", "2025-01-31")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(DateRangePreset.CUSTOM, state.selectedDatePreset)
        assertEquals("2025-01-01", state.customStartDate)
        assertEquals("2025-01-31", state.customEndDate)
        coVerify { financeRepository.getExpenses(any(), any(), "2025-01-01T00:00:00Z", "2025-01-31T23:59:59Z") }
    }

    @Test
    fun setSearchQuery_updatesSearchQueryInState() = runTest {
        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.setSearchQuery("Internet")
        assertEquals("Internet", viewModel.uiState.value.searchQuery)
    }

    @Test
    fun rejectExpense_withReason_updatesStateAndReloads() = runTest {
        val rejectedExpense = sampleExpense.copy(status = ExpenseStatusDomain.REJECTED)
        coEvery { financeRepository.rejectExpense("exp_1", "Out of budget") } returns Result.success(rejectedExpense)

        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.rejectExpense("exp_1", "Out of budget")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertNotNull(state.actionMessage)
        assertTrue(state.actionMessage!!.contains("rejected"))
        coVerify { financeRepository.rejectExpense("exp_1", "Out of budget") }
    }

    @Test
    fun selectTab_switchesTabCorrectly() = runTest {
        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectTab(FinanceTab.PETTY_CASH)
        assertEquals(FinanceTab.PETTY_CASH, viewModel.uiState.value.selectedTab)

        viewModel.selectTab(FinanceTab.UTILITIES)
        assertEquals(FinanceTab.UTILITIES, viewModel.uiState.value.selectedTab)
    }

    @Test
    fun approveExpense_updatesStateAndReloads() = runTest {
        val approvedExpense = sampleExpense.copy(status = ExpenseStatusDomain.APPROVED)
        coEvery { financeRepository.approveExpense("exp_1") } returns Result.success(approvedExpense)

        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.approveExpense("exp_1")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertNotNull(state.actionMessage)
        assertTrue(state.actionMessage!!.contains("approved"))
        coVerify { financeRepository.approveExpense("exp_1") }
    }

    @Test
    fun selectFundForDetails_fetchesTransactions() = runTest {
        viewModel = FinanceViewModel(financeRepository, authRepository)
        testScheduler.advanceUntilIdle()

        viewModel.selectFundForDetails(sampleFund)
        testScheduler.advanceUntilIdle()

        assertEquals(sampleFund, viewModel.uiState.value.selectedFundForDetails)
        coVerify { financeRepository.getPettyCashTransactions("fund_1") }
    }
}
