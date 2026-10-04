package tech.scryme.app.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import tech.scryme.app.data.api.AuthApiService
import tech.scryme.app.data.dto.EmailSignInRequestDto
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

    override suspend fun loginWithEmail(email: String, password: String): Result<Unit> {
        return try {
            val response = authApiService.loginWithEmail(EmailSignInRequestDto(email = email, password = password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                val token = body.effectiveToken
                val orgSlug = body.effectiveOrgSlug
                val userName = body.user?.name
                val userEmail = body.user?.email ?: email
                val userId = body.user?.id

                if (token.isNotEmpty()) {
                    sessionManager.saveSession(
                        accessToken = token,
                        memberToken = token,
                        orgSlug = orgSlug,
                        memberId = userId,
                        userName = userName,
                        userEmail = userEmail
                    )
                    Result.success(Unit)
                } else {
                    Result.failure(Exception("Authentication succeeded but no token was returned"))
                }
            } else {
                val errorMsg = response.errorBody()?.string()?.takeIf { it.isNotBlank() } ?: response.message()
                Result.failure(Exception("Login failed: $errorMsg"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

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
                val token = data.effectiveToken
                val memberId = data.effectiveMemberId
                sessionManager.saveSession(
                    accessToken = token,
                    memberToken = token,
                    orgSlug = data.organizationId?.ifEmpty { orgSlug } ?: orgSlug,
                    locationId = data.locationId,
                    memberId = memberId,
                    userName = data.name,
                    userEmail = data.email
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
