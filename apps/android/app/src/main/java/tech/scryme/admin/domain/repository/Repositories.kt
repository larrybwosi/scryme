package tech.scryme.admin.domain.repository

import kotlinx.coroutines.flow.Flow
import tech.scryme.admin.data.model.*

interface AuthRepository {
    suspend fun signInWithEmail(email: String, password: String): Result<BetterAuthSessionResponse>
    suspend fun getSession(): Result<BetterAuthSessionResponse>
    suspend fun terminalLogin(cardId: String, pin: String): Result<TerminalLoginResponseDto>
    suspend fun signOut(): Result<Unit>
    suspend fun signInWithGoogle(idToken: String): Result<BetterAuthSessionResponse>
}

interface PresenceRepository {
    suspend fun getOrganizationDetails(): Result<OrganizationDetailsDto>
    suspend fun getLocations(): Result<List<LocationDto>>
    suspend fun getMembers(role: String? = null, status: String? = null, isActive: Boolean? = null, isCheckedIn: Boolean? = null, search: String? = null): Result<List<MemberResponseDto>>
    suspend fun getAttendanceLogs(page: Int, limit: Int, memberId: String? = null, locationId: String? = null): Result<AttendanceLogsResponse>
    suspend fun checkIn(locationId: String, notes: String? = null): Result<AttendanceLogDto>
    suspend fun checkOut(locationId: String? = null, notes: String? = null): Result<AttendanceLogDto>
    suspend fun adminCheckOut(memberId: String, locationId: String? = null, notes: String? = null): Result<AttendanceLogDto>
    suspend fun getPettyCashTransactions(limit: Int? = null): Result<List<PettyCashTransactionDto>>
    suspend fun getTransactions(locationId: String? = null, startDate: String? = null, endDate: String? = null): Result<List<TransactionDto>>

    // Real-time Presence Flow using Poll/WS Pattern
    fun monitorActivePresence(pollIntervalMs: Long = 10000L): Flow<List<MemberResponseDto>>
}

interface ApprovalsRepository {
    suspend fun getPriceChangeRequests(offset: Int = 0, limit: Int = 20): Result<List<PriceChangeRequestDto>>
    suspend fun reviewPriceChange(id: String, approve: Boolean, reason: String? = null): Result<Unit>
    suspend fun getStockAdjustments(offset: Int = 0, limit: Int = 50, status: String? = null): Result<List<StockAdjustmentResponseDto>>
    suspend fun approveInventoryAdjustment(id: String): Result<Unit>
    suspend fun rejectInventoryAdjustment(id: String, reason: String? = null): Result<Unit>
}

interface AnalyticsRepository {
    suspend fun getDashboardAnalytics(): Result<DashboardAnalyticsDto>
    fun monitorDashboardAnalytics(pollIntervalMs: Long = 30000L): Flow<DashboardAnalyticsDto>
}

interface AnnouncementRepository {
    suspend fun broadcastAnnouncement(
        title: String,
        message: String,
        targetBranchId: String? = null,
        targetMemberId: String? = null,
        channelSlug: String? = null,
        severity: String = "INFO"
    ): Result<Unit>

    suspend fun sendMessageToMember(
        memberId: String,
        title: String,
        message: String,
        type: String = "DIRECT_MESSAGE"
    ): Result<Unit>
}

interface ExpenseRepository {
    suspend fun getExpenses(status: String? = null, categoryId: String? = null): Result<List<ExpenseDto>>
    suspend fun getExpenseCategories(): Result<List<ExpenseCategoryDto>>
    suspend fun createExpense(description: String, amount: Double, categoryId: String, paymentMethod: String, notes: String? = null): Result<ExpenseDto>
    suspend fun approveExpense(id: String): Result<Unit>
}

interface DeviceRepository {
    suspend fun provisionDevice(setupToken: String): Result<DeviceProvisionResponseDto>
    suspend fun authorizePairingSession(sessionId: String, locationId: String? = null): Result<DeviceProvisionResponseDto>
}

interface ShiftsRepository {
    suspend fun getShifts(memberId: String? = null, dayOfWeek: Int? = null, isActive: Boolean? = null): Result<List<StaffShiftDto>>
    suspend fun createShift(memberId: String, dayOfWeek: Int, startTime: String, endTime: String): Result<StaffShiftDto>
    suspend fun addBreak(shiftId: String, startTime: String, endTime: String, description: String? = null): Result<StaffBreakDto>
}
