package tech.scryme.app.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import tech.scryme.app.data.api.AuthApiService
import tech.scryme.app.data.dto.TerminalLoginRequestDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApiService: AuthApiService,
    private val sessionManager: SessionManager
) : AuthRepository {

    override suspend fun loginMember(
        orgSlug: String,
        pin: String?,
        cardId: String?,
        apiKey: String?
    ): Result<Unit> {
        return try {
            val response = authApiService.loginMember(
                orgSlug = orgSlug,
                apiKey = apiKey,
                request = TerminalLoginRequestDto(pin = pin, cardId = cardId)
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data ?: return Result.failure(Exception("Empty response data"))
                sessionManager.saveSession(
                    accessToken = data.accessToken,
                    orgSlug = data.organizationId.ifEmpty { orgSlug },
                    locationId = data.locationId,
                    memberId = data.memberId
                )
                Result.success(Unit)
            } else {
                val errorMsg = response.body()?.error?.message ?: response.message()
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout() {
        sessionManager.clearSession()
    }

    override fun isLoggedIn(): Flow<Boolean> {
        return sessionManager.accessTokenFlow.map { !it.isNullOrEmpty() }
    }

    override fun getActiveOrgSlug(): Flow<String?> = sessionManager.orgSlugFlow

    override fun getActiveLocationId(): Flow<String?> = sessionManager.locationIdFlow
}
