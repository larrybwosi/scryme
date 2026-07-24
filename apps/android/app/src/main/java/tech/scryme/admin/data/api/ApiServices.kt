package tech.scryme.admin.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.admin.data.model.*

interface AuthApiService {
    @POST("/api/auth/sign-in/email")
    suspend fun signInWithEmail(
        @Body request: Map<String, String> // e.g. email, password
    ): Response<BetterAuthSessionResponse>

    @GET("/api/auth/get-session")
    suspend fun getSession(): Response<BetterAuthSessionResponse>

    @POST("/v3/members/login")
    suspend fun terminalLogin(
        @Body request: TerminalLoginDto
    ): Response<ApiEnvelope<TerminalLoginResponseDto>>

    @POST("/api/auth/login/social/google")
    suspend fun signInWithGoogle(
        @Body request: Map<String, String> // e.g., idToken or token
    ): Response<BetterAuthSessionResponse>
}

interface PresenceApiService {
    @GET("/v3/{orgSlug}/members")
    suspend fun getMembers(
        @Path("orgSlug") orgSlug: String,
        @Query("role") role: String? = null,
        @Query("membershipStatus") status: String? = null,
        @Query("isActive") isActive: Boolean? = null,
        @Query("search") search: String? = null
    ): Response<ApiEnvelope<List<MemberResponseDto>>>

    @GET("/v3/{orgSlug}/members/attendance/logs")
    suspend fun getAttendanceLogs(
        @Path("orgSlug") orgSlug: String,
        @Query("page") page: Int,
        @Query("limit") limit: Int,
        @Query("memberId") memberId: String? = null,
        @Query("locationId") locationId: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): Response<ApiEnvelope<AttendanceLogsResponse>>

    @POST("/v3/{orgSlug}/members/attendance/check-in")
    suspend fun checkIn(
        @Path("orgSlug") orgSlug: String,
        @Body dto: CheckInDto
    ): Response<ApiEnvelope<AttendanceLogDto>>

    @POST("/v3/{orgSlug}/members/attendance/check-out")
    suspend fun checkOut(
        @Path("orgSlug") orgSlug: String,
        @Body dto: CheckOutDto
    ): Response<ApiEnvelope<AttendanceLogDto>>

    // Admin direct checkout on behalf of a member
    @POST("/v3/{orgSlug}/members/{memberId}/attendance/check-out")
    suspend fun adminCheckOut(
        @Path("orgSlug") orgSlug: String,
        @Path("memberId") memberId: String,
        @Body dto: CheckOutDto
    ): Response<ApiEnvelope<AttendanceLogDto>>
}

interface ApprovalsApiService {
    @GET("/v3/{orgSlug}/catalog/price-change-requests")
    suspend fun getPriceChangeRequests(
        @Path("orgSlug") orgSlug: String,
        @Query("offset") offset: Int = 0,
        @Query("limit") limit: Int = 20
    ): Response<ApiEnvelope<List<PriceChangeRequestDto>>>

    @POST("/v3/{orgSlug}/catalog/price-change-requests/{id}/review")
    suspend fun reviewPriceChange(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: PriceChangeReviewDto
    ): Response<ApiEnvelope<Unit>>

    @PATCH("/v3/{orgSlug}/inventory/adjustments/{id}/approve")
    suspend fun approveInventoryAdjustment(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String
    ): Response<ApiEnvelope<Unit>>
}

interface AnalyticsApiService {
    @GET("/v3/{orgSlug}/analytics/utilization")
    suspend fun getResourceUtilization(
        @Path("orgSlug") orgSlug: String,
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<ApiEnvelope<Unit>>

    // Creative consolidated dash statistics for admins
    @GET("/v3/{orgSlug}/analytics/dashboard")
    suspend fun getDashboardAnalytics(
        @Path("orgSlug") orgSlug: String
    ): Response<ApiEnvelope<DashboardAnalyticsDto>>
}

interface AnnouncementApiService {
    @POST("/v3/{orgSlug}/announcements")
    suspend fun broadcastAnnouncement(
        @Path("orgSlug") orgSlug: String,
        @Body dto: AnnouncementDto
    ): Response<ApiEnvelope<Unit>>
}
