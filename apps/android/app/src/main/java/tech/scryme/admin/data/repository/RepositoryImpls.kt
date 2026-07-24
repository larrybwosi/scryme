package tech.scryme.admin.data.repository

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.Response
import tech.scryme.admin.data.api.*
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.*
import tech.scryme.admin.domain.session.SessionManager

class AuthRepositoryImpl(
    private val api: AuthApiService,
    private val sessionManager: SessionManager
) : AuthRepository {

    override suspend fun signInWithEmail(email: String, password: String): Result<BetterAuthSessionResponse> {
        return safeApiCall {
            api.signInWithEmail(mapOf("email" to email, "password" to password))
        }.onSuccess { response ->
            sessionManager.saveSession(
                token = response.session.token,
                orgSlug = response.user.activeOrganizationId, // slug fallback
                orgId = response.user.activeOrganizationId
            )
        }
    }

    override suspend fun getSession(): Result<BetterAuthSessionResponse> {
        return safeApiCall {
            api.getSession()
        }.onSuccess { response ->
            // Keep organization information up-to-date
            response.user.activeOrganizationId?.let { orgId ->
                sessionManager.updateActiveOrg(orgId, orgId)
            }
        }
    }

    override suspend fun terminalLogin(cardId: String, pin: String): Result<TerminalLoginResponseDto> {
        return safeApiCallEnvelope {
            api.terminalLogin(TerminalLoginDto(cardId, pin))
        }.onSuccess { response ->
            sessionManager.saveSession(
                token = response.token,
                orgSlug = sessionManager.activeOrgSlug.value,
                orgId = sessionManager.activeOrgId.value
            )
        }
    }

    override suspend fun signOut(): Result<Unit> {
        sessionManager.clearSession()
        return Result.success(Unit)
    }
}

class PresenceRepositoryImpl(
    private val api: PresenceApiService,
    private val sessionManager: SessionManager
) : PresenceRepository {

    override suspend fun getMembers(
        role: String?,
        status: String?,
        isActive: Boolean?,
        search: String?
    ): Result<List<MemberResponseDto>> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getMembers(slug, role, status, isActive, search)
        }
    }

    override suspend fun getAttendanceLogs(
        page: Int,
        limit: Int,
        memberId: String?,
        locationId: String?
    ): Result<AttendanceLogsResponse> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getAttendanceLogs(slug, page, limit, memberId, locationId)
        }
    }

    override suspend fun checkIn(locationId: String, notes: String?): Result<AttendanceLogDto> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.checkIn(slug, CheckInDto(locationId, notes))
        }
    }

    override suspend fun checkOut(locationId: String?, notes: String?): Result<AttendanceLogDto> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.checkOut(slug, CheckOutDto(locationId, notes))
        }
    }

    override suspend fun adminCheckOut(
        memberId: String,
        locationId: String?,
        notes: String?
    ): Result<AttendanceLogDto> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.adminCheckOut(slug, memberId, CheckOutDto(locationId, notes))
        }
    }

    override fun monitorActivePresence(pollIntervalMs: Long): Flow<List<MemberResponseDto>> = flow {
        while (true) {
            getMembers(status = "ONLINE").onSuccess { list ->
                emit(list)
            }.onFailure {
                // emit empty or previous list on failure
                emit(emptyList())
            }
            delay(pollIntervalMs)
        }
    }

    private fun getOrgSlug(): String? = sessionManager.activeOrgSlug.value
}

class ApprovalsRepositoryImpl(
    private val api: ApprovalsApiService,
    private val sessionManager: SessionManager
) : ApprovalsRepository {

    override suspend fun getPriceChangeRequests(offset: Int, limit: Int): Result<List<PriceChangeRequestDto>> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getPriceChangeRequests(slug, offset, limit)
        }
    }

    override suspend fun reviewPriceChange(id: String, approve: Boolean, reason: String?): Result<Unit> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        val status = if (approve) "APPROVED" else "REJECTED"
        return safeApiCallEnvelope {
            api.reviewPriceChange(slug, id, PriceChangeReviewDto(status, reason))
        }
    }

    override suspend fun approveInventoryAdjustment(id: String): Result<Unit> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.approveInventoryAdjustment(slug, id)
        }
    }

    private fun getOrgSlug(): String? = sessionManager.activeOrgSlug.value
}

class AnalyticsRepositoryImpl(
    private val api: AnalyticsApiService,
    private val sessionManager: SessionManager
) : AnalyticsRepository {

    override suspend fun getDashboardAnalytics(): Result<DashboardAnalyticsDto> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getDashboardAnalytics(slug)
        }
    }

    override fun monitorDashboardAnalytics(pollIntervalMs: Long): Flow<DashboardAnalyticsDto> = flow {
        while (true) {
            getDashboardAnalytics().onSuccess { stats ->
                emit(stats)
            }
            delay(pollIntervalMs)
        }
    }

    private fun getOrgSlug(): String? = sessionManager.activeOrgSlug.value
}

class AnnouncementRepositoryImpl(
    private val api: AnnouncementApiService,
    private val sessionManager: SessionManager
) : AnnouncementRepository {

    override suspend fun broadcastAnnouncement(
        title: String,
        message: String,
        targetBranchId: String?,
        severity: String
    ): Result<Unit> {
        val slug = sessionManager.activeOrgSlug.value ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.broadcastAnnouncement(slug, AnnouncementDto(title, message, targetBranchId, severity))
        }
    }
}

// --- API Helpers ---

private suspend fun <T> safeApiCall(call: suspend () -> Response<T>): Result<T> {
    return try {
        val response = call()
        if (response.isSuccessful) {
            val body = response.body()
            if (body != null) {
                Result.success(body)
            } else {
                Result.failure(Exception("Response body was empty"))
            }
        } else {
            Result.failure(Exception("HTTP ${response.code()}: ${response.message()}"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}

private suspend fun <T> safeApiCallEnvelope(call: suspend () -> Response<ApiEnvelope<T>>): Result<T> {
    return try {
        val response = call()
        if (response.isSuccessful) {
            val envelope = response.body()
            if (envelope != null) {
                if (envelope.success) {
                    val data = envelope.data
                    if (data != null) {
                        Result.success(data)
                    } else {
                        @Suppress("UNCHECKED_CAST")
                        Result.success(Unit as T)
                    }
                } else {
                    Result.failure(Exception(envelope.error?.message ?: "Unknown API error occurred"))
                }
            } else {
                Result.failure(Exception("Response body was empty"))
            }
        } else {
            Result.failure(Exception("HTTP ${response.code()}: ${response.message()}"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
