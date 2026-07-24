package tech.scryme.admin.domain.repository

import kotlinx.coroutines.flow.Flow
import tech.scryme.admin.data.model.*

interface AuthRepository {
    suspend fun signInWithEmail(email: String, password: String): Result<BetterAuthSessionResponse>
    suspend fun getSession(): Result<BetterAuthSessionResponse>
    suspend fun terminalLogin(cardId: String, pin: String): Result<TerminalLoginResponseDto>
    suspend fun signOut(): Result<Unit>
}

interface PresenceRepository {
    suspend fun getMembers(role: String? = null, status: String? = null, isActive: Boolean? = null, search: String? = null): Result<List<MemberResponseDto>>
    suspend fun getAttendanceLogs(page: Int, limit: Int, memberId: String? = null, locationId: String? = null): Result<AttendanceLogsResponse>
    suspend fun checkIn(locationId: String, notes: String? = null): Result<AttendanceLogDto>
    suspend fun checkOut(locationId: String? = null, notes: String? = null): Result<AttendanceLogDto>
    suspend fun adminCheckOut(memberId: String, locationId: String? = null, notes: String? = null): Result<AttendanceLogDto>

    // Real-time Presence Flow using Poll/WS Pattern
    fun monitorActivePresence(pollIntervalMs: Long = 10000L): Flow<List<MemberResponseDto>>
}

interface ApprovalsRepository {
    suspend fun getPriceChangeRequests(offset: Int = 0, limit: Int = 20): Result<List<PriceChangeRequestDto>>
    suspend fun reviewPriceChange(id: String, approve: Boolean, reason: String? = null): Result<Unit>
    suspend fun approveInventoryAdjustment(id: String): Result<Unit>
}

interface AnalyticsRepository {
    suspend fun getDashboardAnalytics(): Result<DashboardAnalyticsDto>
    fun monitorDashboardAnalytics(pollIntervalMs: Long = 30000L): Flow<DashboardAnalyticsDto>
}

interface AnnouncementRepository {
    suspend fun broadcastAnnouncement(title: String, message: String, targetBranchId: String? = null, severity: String = "INFO"): Result<Unit>
}
