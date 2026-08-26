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
        val result = safeApiCall {
            api.signInWithEmail(mapOf("email" to email, "password" to password))
        }
        return result.fold(
            onSuccess = { response ->
                val token = response.token
                if (!token.isNullOrBlank()) {
                    val orgSlug = response.user?.activeOrganizationSlug ?: response.user?.activeOrganizationId
                    sessionManager.saveSession(
                        token = token,
                        orgSlug = orgSlug,
                        orgId = response.user?.activeOrganizationId,
                        userEmail = response.user?.email,
                        userName = response.user?.name,
                        orgName = response.user?.activeOrganizationName
                    )
                    getSession()
                    Result.success(response)
                } else {
                    Result.failure(Exception("Authentication failed: No session token returned from server"))
                }
            },
            onFailure = { error ->
                Result.failure(error)
            }
        )
    }

    override suspend fun getSession(): Result<BetterAuthSessionResponse> {
        return safeApiCall {
            api.getSession()
        }.onSuccess { response ->
            val token = response.token ?: sessionManager.token.value
            if (!token.isNullOrBlank()) {
                val orgSlug = response.user?.activeOrganizationSlug ?: response.user?.activeOrganizationId
                sessionManager.saveSession(
                    token = token,
                    orgSlug = orgSlug,
                    orgId = response.user?.activeOrganizationId,
                    userEmail = response.user?.email,
                    userName = response.user?.name,
                    orgName = response.user?.activeOrganizationName
                )
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
                orgId = sessionManager.activeOrgId.value,
                orgName = sessionManager.activeOrgName.value
            )
        }
    }

    override suspend fun signOut(): Result<Unit> {
        sessionManager.clearSession()
        return Result.success(Unit)
    }

    override suspend fun signInWithGoogle(idToken: String): Result<BetterAuthSessionResponse> {
        val result = safeApiCall {
            api.signInWithGoogle(mapOf("idToken" to idToken))
        }
        return result.fold(
            onSuccess = { response ->
                val token = response.token
                if (!token.isNullOrBlank()) {
                    val orgSlug = response.user?.activeOrganizationSlug ?: response.user?.activeOrganizationId
                    sessionManager.saveSession(
                        token = token,
                        orgSlug = orgSlug,
                        orgId = response.user?.activeOrganizationId,
                        userEmail = response.user?.email,
                        userName = response.user?.name,
                        orgName = response.user?.activeOrganizationName
                    )
                    getSession()
                    Result.success(response)
                } else {
                    Result.failure(Exception("Authentication failed: No session token returned from server"))
                }
            },
            onFailure = { error ->
                Result.failure(error)
            }
        )
    }
}

class PresenceRepositoryImpl(
    private val api: PresenceApiService,
    private val sessionManager: SessionManager
) : PresenceRepository {

    override suspend fun getLocations(): Result<List<LocationDto>> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getLocations(slug)
        }
    }

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

    override suspend fun getPettyCashTransactions(limit: Int?): Result<List<PettyCashTransactionDto>> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getPettyCashTransactions(slug, limit)
        }
    }

    override suspend fun getTransactions(
        locationId: String?,
        startDate: String?,
        endDate: String?
    ): Result<List<TransactionDto>> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getTransactions(slug, locationId, startDate, endDate)
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

    override suspend fun getStockAdjustments(offset: Int, limit: Int, status: String?): Result<List<StockAdjustmentResponseDto>> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.getStockAdjustments(slug, offset, limit, status)
        }
    }

    override suspend fun approveInventoryAdjustment(id: String): Result<Unit> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.approveInventoryAdjustment(slug, id)
        }
    }

    override suspend fun rejectInventoryAdjustment(id: String, reason: String?): Result<Unit> {
        val slug = getOrgSlug() ?: return Result.failure(Exception("No active organization selected"))
        return safeApiCallEnvelope {
            api.rejectInventoryAdjustment(slug, id, StockAdjustmentRejectDto(reason))
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

class DeviceRepositoryImpl(
    private val api: DeviceApiService
) : DeviceRepository {

    override suspend fun provisionDevice(setupToken: String): Result<DeviceProvisionResponseDto> {
        return safeApiCallDirectOrEnvelope {
            api.provisionDevice(mapOf("setupToken" to setupToken))
        }
    }
}

class ExpenseRepositoryImpl(
    private val api: ExpenseApiService
) : ExpenseRepository {

    override suspend fun getExpenses(status: String?, categoryId: String?): Result<List<ExpenseDto>> {
        return safeApiCallEnvelope {
            api.getExpenses(status, categoryId)
        }
    }

    override suspend fun getExpenseCategories(): Result<List<ExpenseCategoryDto>> {
        return safeApiCallEnvelope {
            api.getExpenseCategories()
        }
    }

    override suspend fun createExpense(
        description: String,
        amount: Double,
        categoryId: String,
        paymentMethod: String,
        notes: String?
    ): Result<ExpenseDto> {
        return safeApiCallEnvelope {
            api.createExpense(
                CreateExpenseRequestDto(
                    description = description,
                    amount = amount,
                    categoryId = categoryId,
                    paymentMethod = paymentMethod,
                    notes = notes,
                    autoApprove = true
                )
            )
        }
    }

    override suspend fun approveExpense(id: String): Result<Unit> {
        return safeApiCallEnvelope {
            api.approveExpense(id)
        }
    }
}

// --- API Helpers ---

private suspend inline fun <reified T> safeApiCall(
    crossinline call: suspend () -> Response<T>
): Result<T> {
    return try {
        val response = call()
        if (response.isSuccessful) {
            val body = response.body()
            if (body != null) {
                Result.success(body)
            } else {
                if (Unit is T) {
                    @Suppress("UNCHECKED_CAST")
                    Result.success(Unit as T)
                } else {
                    Result.failure(Exception("Response body was empty"))
                }
            }
        } else {
            Result.failure(Exception("HTTP ${response.code()}: ${response.message()}"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}

private suspend inline fun <reified T> safeApiCallEnvelope(
    crossinline call: suspend () -> Response<ApiEnvelope<T>>
): Result<T> {
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
                        if (Unit is T) {
                            @Suppress("UNCHECKED_CAST")
                            Result.success(Unit as T)
                        } else {
                            Result.failure(Exception("Expected data was null/missing in API response"))
                        }
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

private suspend inline fun <reified T> safeApiCallDirectOrEnvelope(
    crossinline call: suspend () -> Response<ApiEnvelope<T>>
): Result<T> {
    return try {
        val response = call()
        if (response.isSuccessful) {
            val body = response.body()
            if (body != null) {
                val data = body.data
                if (data != null) {
                    Result.success(data)
                } else if (body.success) {
                    if (Unit is T) {
                        @Suppress("UNCHECKED_CAST")
                        Result.success(Unit as T)
                    } else {
                        Result.failure(Exception("Expected data was null/missing in API response"))
                    }
                } else {
                    Result.failure(Exception(body.error?.message ?: "Unknown API error occurred"))
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
