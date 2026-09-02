package tech.scryme.admin.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.admin.data.model.*

interface AuthApiService {
    @POST("/api/android/auth/sign-in/email")
    suspend fun signInWithEmail(
        @Body request: Map<String, String> // e.g. email, password
    ): Response<BetterAuthSessionResponse>

    @GET("/api/android/auth/get-session")
    suspend fun getSession(): Response<BetterAuthSessionResponse>

    @POST("/api/android/auth/terminal-login")
    suspend fun terminalLogin(
        @Body request: TerminalLoginDto
    ): Response<ApiEnvelope<TerminalLoginResponseDto>>

    @POST("/api/android/auth/login/social/google")
    suspend fun signInWithGoogle(
        @Body request: Map<String, String> // e.g., idToken or token
    ): Response<BetterAuthSessionResponse>
}

interface PresenceApiService {
    @GET("/api/android/{orgSlug}/organization")
    suspend fun getOrganizationDetails(
        @Path("orgSlug") orgSlug: String
    ): Response<ApiEnvelope<OrganizationDetailsDto>>

    @GET("/api/android/{orgSlug}/locations")
    suspend fun getLocations(
        @Path("orgSlug") orgSlug: String
    ): Response<ApiEnvelope<List<LocationDto>>>

    @GET("/api/android/{orgSlug}/members")
    suspend fun getMembers(
        @Path("orgSlug") orgSlug: String,
        @Query("role") role: String? = null,
        @Query("membershipStatus") status: String? = null,
        @Query("isActive") isActive: Boolean? = null,
        @Query("isCheckedIn") isCheckedIn: Boolean? = null,
        @Query("search") search: String? = null
    ): Response<ApiEnvelope<List<MemberResponseDto>>>

    @GET("/api/android/{orgSlug}/members/attendance/logs")
    suspend fun getAttendanceLogs(
        @Path("orgSlug") orgSlug: String,
        @Query("page") page: Int,
        @Query("limit") limit: Int,
        @Query("memberId") memberId: String? = null,
        @Query("locationId") locationId: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<ApiEnvelope<AttendanceLogsResponse>>

    @POST("/api/android/{orgSlug}/members/attendance/check-in")
    suspend fun checkIn(
        @Path("orgSlug") orgSlug: String,
        @Body dto: CheckInDto
    ): Response<ApiEnvelope<AttendanceLogDto>>

    @POST("/api/android/{orgSlug}/members/attendance/check-out")
    suspend fun checkOut(
        @Path("orgSlug") orgSlug: String,
        @Body dto: CheckOutDto
    ): Response<ApiEnvelope<AttendanceLogDto>>

    // Admin direct checkout on behalf of a member
    @POST("/api/android/{orgSlug}/members/{memberId}/attendance/check-out")
    suspend fun adminCheckOut(
        @Path("orgSlug") orgSlug: String,
        @Path("memberId") memberId: String,
        @Body dto: CheckOutDto
    ): Response<ApiEnvelope<AttendanceLogDto>>

    @GET("/api/android/{orgSlug}/pos/petty-cash/transactions")
    suspend fun getPettyCashTransactions(
        @Path("orgSlug") orgSlug: String,
        @Query("limit") limit: Int? = null
    ): Response<ApiEnvelope<List<PettyCashTransactionDto>>>

    @GET("/api/android/{orgSlug}/pos/transactions")
    suspend fun getTransactions(
        @Path("orgSlug") orgSlug: String,
        @Query("locationId") locationId: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<ApiEnvelope<List<TransactionDto>>>
}

interface ApprovalsApiService {
    @GET("/api/android/{orgSlug}/catalog/price-change-requests")
    suspend fun getPriceChangeRequests(
        @Path("orgSlug") orgSlug: String,
        @Query("offset") offset: Int = 0,
        @Query("limit") limit: Int = 20
    ): Response<ApiEnvelope<List<PriceChangeRequestDto>>>

    @POST("/api/android/{orgSlug}/catalog/price-change-requests/{id}/review")
    suspend fun reviewPriceChange(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: PriceChangeReviewDto
    ): Response<ApiEnvelope<Unit>>

    @GET("/api/android/{orgSlug}/inventory/adjustments")
    suspend fun getStockAdjustments(
        @Path("orgSlug") orgSlug: String,
        @Query("offset") offset: Int = 0,
        @Query("limit") limit: Int = 50,
        @Query("status") status: String? = null
    ): Response<ApiEnvelope<List<StockAdjustmentResponseDto>>>

    @PATCH("/api/android/{orgSlug}/inventory/adjustments/{id}/approve")
    suspend fun approveInventoryAdjustment(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String
    ): Response<ApiEnvelope<Unit>>

    @PATCH("/api/android/{orgSlug}/inventory/adjustments/{id}/reject")
    suspend fun rejectInventoryAdjustment(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: StockAdjustmentRejectDto
    ): Response<ApiEnvelope<Unit>>
}

interface AnalyticsApiService {
    @GET("/api/android/{orgSlug}/analytics/utilization")
    suspend fun getResourceUtilization(
        @Path("orgSlug") orgSlug: String,
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<ApiEnvelope<Unit>>

    // Creative consolidated dash statistics for admins
    @GET("/api/android/{orgSlug}/analytics/dashboard")
    suspend fun getDashboardAnalytics(
        @Path("orgSlug") orgSlug: String
    ): Response<ApiEnvelope<DashboardAnalyticsDto>>
}

interface AnnouncementApiService {
    @POST("/api/android/{orgSlug}/announcements")
    suspend fun broadcastAnnouncement(
        @Path("orgSlug") orgSlug: String,
        @Body dto: AnnouncementDto
    ): Response<ApiEnvelope<Unit>>

    @POST("/api/android/{orgSlug}/members/messages")
    suspend fun sendMessageToMember(
        @Path("orgSlug") orgSlug: String,
        @Body dto: DirectMessageDto
    ): Response<ApiEnvelope<Unit>>
}

interface DeviceApiService {
    @POST("/api/v3/global/pos/provision")
    suspend fun provisionDevice(
        @Body request: Map<String, String> // setupToken
    ): Response<ApiEnvelope<DeviceProvisionResponseDto>>

    @POST("/api/v3/pos/pairing/session/{sessionId}/authorize")
    suspend fun authorizePairingSession(
        @Path("sessionId") sessionId: String,
        @Body request: Map<String, String> // locationId, etc.
    ): Response<ApiEnvelope<DeviceProvisionResponseDto>>
}

interface ExpenseApiService {
    @GET("/api/android/finance/expenses")
    suspend fun getExpenses(
        @Query("status") status: String? = null,
        @Query("categoryId") categoryId: String? = null
    ): Response<ApiEnvelope<List<ExpenseDto>>>

    @GET("/api/android/finance/expenses/categories")
    suspend fun getExpenseCategories(): Response<ApiEnvelope<List<ExpenseCategoryDto>>>

    @POST("/api/android/finance/expenses")
    suspend fun createExpense(
        @Body dto: CreateExpenseRequestDto
    ): Response<ApiEnvelope<ExpenseDto>>

    @POST("/api/android/finance/expenses/{id}/approve")
    suspend fun approveExpense(
        @Path("id") id: String
    ): Response<ApiEnvelope<Unit>>
}

interface ShiftsApiService {
    @GET("/api/android/{orgSlug}/shifts")
    suspend fun getShifts(
        @Path("orgSlug") orgSlug: String,
        @Query("memberId") memberId: String? = null,
        @Query("dayOfWeek") dayOfWeek: Int? = null,
        @Query("isActive") isActive: Boolean? = null
    ): Response<ApiEnvelope<List<StaffShiftDto>>>

    @POST("/api/android/{orgSlug}/staff/{memberId}/shifts")
    suspend fun createShift(
        @Path("orgSlug") orgSlug: String,
        @Path("memberId") memberId: String,
        @Body dto: CreateShiftRequestDto
    ): Response<ApiEnvelope<StaffShiftDto>>

    @POST("/api/android/{orgSlug}/shifts/{shiftId}/breaks")
    suspend fun addBreak(
        @Path("orgSlug") orgSlug: String,
        @Path("shiftId") shiftId: String,
        @Body dto: CreateBreakRequestDto
    ): Response<ApiEnvelope<StaffBreakDto>>
}
