package tech.scryme.app.data.repository

import com.google.gson.JsonParser
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import tech.scryme.app.data.api.AuthApiService
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.EmailSignInRequestDto
import tech.scryme.app.data.dto.PosPairRequestDto
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

                    // Refresh context details via V3 Android Controller if available
                    runCatching {
                        val meResponse = authApiService.getAndroidMe()
                        if (meResponse.isSuccessful && meResponse.body()?.success == true) {
                            val meData = meResponse.body()?.data
                            val activeOrgSlug = meData?.activeOrganization?.slug ?: orgSlug
                            val defaultLocationId = meData?.locations?.firstOrNull { it.isDefault == true }?.id
                                ?: meData?.locations?.firstOrNull()?.id
                            val memberId = meData?.member?.id ?: userId

                            sessionManager.saveSession(
                                accessToken = token,
                                memberToken = token,
                                orgSlug = activeOrgSlug,
                                locationId = defaultLocationId,
                                memberId = memberId,
                                userName = meData?.user?.name ?: userName,
                                userEmail = meData?.user?.email ?: userEmail
                            )
                        }
                    }

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

    override suspend fun validateSession(): Result<AndroidMeResponseDto> {
        return try {
            val response = authApiService.getAndroidMe()
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data ?: return Result.failure(Exception("Empty profile response"))
                val token = sessionManager.getAccessToken() ?: ""
                val activeOrgSlug = data.activeOrganization?.slug ?: sessionManager.getOrgSlug() ?: "default"
                val defaultLocationId = data.locations?.firstOrNull { it.isDefault == true }?.id
                    ?: data.locations?.firstOrNull()?.id
                    ?: sessionManager.getLocationId()
                val memberId = data.member?.id ?: sessionManager.getMemberId()

                sessionManager.saveSession(
                    accessToken = token,
                    memberToken = token,
                    orgSlug = activeOrgSlug,
                    locationId = defaultLocationId,
                    memberId = memberId,
                    userName = data.user?.name,
                    userEmail = data.user?.email
                )
                Result.success(data)
            } else {
                val errorMsg = response.body()?.error?.message ?: response.message()
                Result.failure(Exception(errorMsg))
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

    override suspend fun pairPosDevice(qrContent: String): Result<String> {
        return try {
            var sessionId: String? = null
            var pairingCode: String? = null
            var orgSlug: String? = sessionManager.getOrgSlug()
            var locationId: String? = sessionManager.getLocationId()

            val trimmed = qrContent.trim()
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                try {
                    val json = JsonParser.parseString(trimmed).asJsonObject
                    if (json.has("sessionId")) sessionId = json.get("sessionId").asString
                    if (json.has("pairingCode")) pairingCode = json.get("pairingCode").asString
                    if (json.has("orgSlug")) orgSlug = json.get("orgSlug").asString
                    if (json.has("locationId")) locationId = json.get("locationId").asString
                } catch (e: Exception) {
                    sessionId = trimmed
                }
            } else if (trimmed.contains("?")) {
                val uri = android.net.Uri.parse(trimmed)
                sessionId = uri.getQueryParameter("sessionId") ?: uri.getQueryParameter("session")
                pairingCode = uri.getQueryParameter("pairingCode") ?: uri.getQueryParameter("code")
                orgSlug = uri.getQueryParameter("orgSlug") ?: uri.getQueryParameter("org") ?: orgSlug
                locationId = uri.getQueryParameter("locationId") ?: locationId
            } else {
                sessionId = trimmed
                pairingCode = trimmed
            }

            val pairReq = PosPairRequestDto(
                sessionId = sessionId,
                pairingCode = pairingCode,
                locationId = locationId,
                deviceName = "Android POS Terminal",
                deviceType = "ANDROID"
            )

            if (!sessionId.isNullOrEmpty()) {
                val response = authApiService.authorizePosPairingSession(sessionId, pairReq)
                if (response.isSuccessful && response.body()?.success == true) {
                    return Result.success("POS Pairing authorized for session: $sessionId")
                }
            }

            val effectiveOrgSlug = orgSlug ?: "default"
            val response = authApiService.pairPosDevice(effectiveOrgSlug, pairReq)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success("POS Device paired successfully for org: $effectiveOrgSlug")
            } else {
                val errorMsg = response.body()?.error?.message ?: response.message()
                Result.failure(Exception("POS Pairing failed: $errorMsg"))
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
