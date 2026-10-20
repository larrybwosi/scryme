import tech.scryme.app.data.dto.SwitchOrgRequestDto
package tech.scryme.app.data.repository

import android.os.Build
import com.google.gson.JsonParser
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import tech.scryme.app.BuildConfig
import tech.scryme.app.data.api.AuthApiService
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.EmailSignInRequestDto
import tech.scryme.app.data.dto.OAuthCodeExchangeRequestDto
import tech.scryme.app.data.dto.PasskeyDeleteRequestDto
import tech.scryme.app.data.dto.PasskeyItemDto
import tech.scryme.app.data.dto.PasskeyRegisterOptionsRequestDto
import tech.scryme.app.data.dto.PasskeyVerifyAuthenticationRequestDto
import tech.scryme.app.data.dto.PasskeyVerifyRegistrationRequestDto
import tech.scryme.app.data.dto.PosPairRequestDto
import tech.scryme.app.data.dto.RegisterDeviceRequestDto
import tech.scryme.app.data.dto.TerminalLoginRequestDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.util.CurrencyUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApiService: AuthApiService,
    private val sessionManager: SessionManager
) : AuthRepository {

    override suspend fun registerDeviceToken(pushToken: String?): Result<Unit> {
        return try {
            val token = pushToken ?: sessionManager.getFcmToken()
            val deviceId = sessionManager.getUserId() ?: "android_device_${Build.MODEL.lowercase().replace(" ", "_")}"
            val request = RegisterDeviceRequestDto(
                deviceId = deviceId,
                modelName = "${Build.MANUFACTURER} ${Build.MODEL}",
                appVersion = BuildConfig.VERSION_NAME,
                osVersion = "Android ${Build.VERSION.RELEASE}",
                pushToken = token
            )
            val response = authApiService.registerDevice(request)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Device registration failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun loginWithEmail(email: String, password: String): Result<Unit> {
        return try {
            val response = authApiService.loginWithEmail(EmailSignInRequestDto(email = email, password = password))
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()?.data
                val token = body?.effectiveToken ?: body?.token ?: ""
                val orgSlug = body?.effectiveOrgSlug ?: body?.orgSlug ?: "default"
                val userName = body?.user?.name
                val userEmail = body?.user?.email ?: email
                val userId = body?.user?.id
                val orgName = body?.organization?.name
                val orgCurrency = body?.organization?.effectiveCurrency ?: "USD"
                val orgCurrencySymbol = body?.organization?.currencySymbol ?: CurrencyUtils.getSymbol(orgCurrency)

                if (token.isNotEmpty()) {
                    sessionManager.saveSession(
                        accessToken = token,
                        memberToken = token,
                        orgSlug = orgSlug,
                        userId = userId,
                        memberId = null,
                        userName = userName,
                        userEmail = userEmail,
                        orgName = orgName,
                        orgCurrency = orgCurrency,
                        orgCurrencySymbol = orgCurrencySymbol
                    )

                    runCatching {
                        val meResponse = authApiService.getAndroidMe()
                        if (meResponse.isSuccessful && meResponse.body()?.success == true) {
                            val meData = meResponse.body()?.data
                            val activeOrgSlug = meData?.activeOrganization?.slug ?: orgSlug
                            val defaultLocationId = meData?.locations?.firstOrNull { it.isDefault == true }?.id
                                ?: meData?.locations?.firstOrNull()?.id
                            val memberId = meData?.member?.id
                            val activeOrgName = meData?.activeOrganization?.name ?: orgName
                            val activeOrgLogo = meData?.activeOrganization?.logo
                            val activeCurrency = meData?.activeOrganization?.effectiveCurrency ?: orgCurrency
                            val activeCurrencySymbol = meData?.activeOrganization?.currencySymbol ?: CurrencyUtils.getSymbol(activeCurrency)

                            sessionManager.saveSession(
                                accessToken = token,
                                memberToken = token,
                                orgSlug = activeOrgSlug,
                                locationId = defaultLocationId,
                                userId = meData?.user?.id ?: userId,
                                memberId = memberId,
                                userName = meData?.user?.name ?: userName,
                                userEmail = meData?.user?.email ?: userEmail,
                                orgName = activeOrgName,
                                orgLogo = activeOrgLogo,
                                orgCurrency = activeCurrency,
                                orgCurrencySymbol = activeCurrencySymbol
                            )
                        }
                    }

                    runCatching { registerDeviceToken() }

                    Result.success(Unit)
                } else {
                    Result.failure(Exception("Authentication succeeded but no token was returned"))
                }
            } else {
                val errorMsg = response.body()?.error?.message ?: response.message()
                Result.failure(Exception("Login failed: $errorMsg"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun exchangeOAuthCode(code: String, codeVerifier: String?): Result<Unit> {
        return try {
            val request = OAuthCodeExchangeRequestDto(
                code = code,
                codeVerifier = codeVerifier,
                redirectUri = "https://auth.scryme.tech/mobile-callback",
                clientId = "scryme-android-app"
            )
            val response = authApiService.exchangeOAuthCode(request)
            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()?.data
                val token = body?.effectiveToken ?: body?.token ?: ""
                val orgSlug = body?.effectiveOrgSlug ?: body?.orgSlug ?: "default"
                val userName = body?.user?.name
                val userEmail = body?.user?.email
                val userId = body?.user?.id
                val orgName = body?.organization?.name
                val orgCurrency = body?.organization?.effectiveCurrency ?: "USD"
                val orgCurrencySymbol = body?.organization?.currencySymbol ?: CurrencyUtils.getSymbol(orgCurrency)

                if (token.isNotEmpty()) {
                    sessionManager.saveSession(
                        accessToken = token,
                        memberToken = token,
                        orgSlug = orgSlug,
                        userId = userId,
                        memberId = null,
                        userName = userName,
                        userEmail = userEmail,
                        orgName = orgName,
                        orgCurrency = orgCurrency,
                        orgCurrencySymbol = orgCurrencySymbol
                    )

                    runCatching {
                        val meResponse = authApiService.getAndroidMe()
                        if (meResponse.isSuccessful && meResponse.body()?.success == true) {
                            val meData = meResponse.body()?.data
                            val activeOrgSlug = meData?.activeOrganization?.slug ?: orgSlug
                            val defaultLocationId = meData?.locations?.firstOrNull { it.isDefault == true }?.id
                                ?: meData?.locations?.firstOrNull()?.id
                            val memberId = meData?.member?.id
                            val activeOrgName = meData?.activeOrganization?.name ?: orgName
                            val activeOrgLogo = meData?.activeOrganization?.logo
                            val activeCurrency = meData?.activeOrganization?.effectiveCurrency ?: orgCurrency
                            val activeCurrencySymbol = meData?.activeOrganization?.currencySymbol ?: CurrencyUtils.getSymbol(activeCurrency)

                            sessionManager.saveSession(
                                accessToken = token,
                                memberToken = token,
                                orgSlug = activeOrgSlug,
                                locationId = defaultLocationId,
                                userId = meData?.user?.id ?: userId,
                                memberId = memberId,
                                userName = meData?.user?.name ?: userName,
                                userEmail = meData?.user?.email ?: userEmail,
                                orgName = activeOrgName,
                                orgLogo = activeOrgLogo,
                                orgCurrency = activeCurrency,
                                orgCurrencySymbol = activeCurrencySymbol
                            )
                        }
                    }

                    runCatching { registerDeviceToken() }

                    Result.success(Unit)
                } else {
                    Result.failure(Exception("OAuth authorization code exchange succeeded but no token was returned"))
                }
            } else {
                val errorMsg = response.body()?.error?.message ?: response.message()
                Result.failure(Exception("OAuth code exchange failed: $errorMsg"))
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
                val memberId = data.member?.id
                val activeOrgName = data.activeOrganization?.name ?: sessionManager.getOrgName()
                val activeOrgLogo = data.activeOrganization?.logo ?: sessionManager.getOrgLogo()
                val activeCurrency = data.activeOrganization?.effectiveCurrency ?: sessionManager.getOrgCurrency()
                val activeCurrencySymbol = data.activeOrganization?.currencySymbol ?: CurrencyUtils.getSymbol(activeCurrency)

                sessionManager.saveSession(
                    accessToken = token,
                    memberToken = token,
                    orgSlug = activeOrgSlug,
                    locationId = defaultLocationId,
                    userId = data.user?.id,
                    memberId = memberId,
                    userName = data.user?.name,
                    userEmail = data.user?.email,
                    orgName = activeOrgName,
                    orgLogo = activeOrgLogo,
                    orgCurrency = activeCurrency,
                    orgCurrencySymbol = activeCurrencySymbol
                )

                runCatching { registerDeviceToken() }

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

                runCatching { registerDeviceToken() }

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
                    runCatching { registerDeviceToken() }
                    return Result.success("POS Pairing authorized for session: $sessionId")
                }
            }

            val effectiveOrgSlug = orgSlug ?: "default"
            val response = authApiService.pairPosDevice(effectiveOrgSlug, pairReq)
            if (response.isSuccessful && response.body()?.success == true) {
                runCatching { registerDeviceToken() }
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

    // Passkey Operations Implementation
    override suspend fun generatePasskeyRegisterOptions(name: String?): Result<String> {
        return try {
            val response = authApiService.generatePasskeyRegisterOptions(PasskeyRegisterOptionsRequestDto(name = name ?: "Android Passkey"))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body().toString())
            } else {
                Result.failure(Exception("Failed to generate passkey register options: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun verifyPasskeyRegistration(responseJson: String): Result<Unit> {
        return try {
            val parsedResponse = JsonParser.parseString(responseJson)
            val response = authApiService.verifyPasskeyRegistration(PasskeyVerifyRegistrationRequestDto(response = parsedResponse))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to verify passkey registration: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun generatePasskeyAuthenticateOptions(): Result<String> {
        return try {
            val response = authApiService.generatePasskeyAuthenticateOptions()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body().toString())
            } else {
                Result.failure(Exception("Failed to generate passkey authenticate options: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun verifyPasskeyAuthentication(responseJson: String): Result<Unit> {
        return try {
            val parsedResponse = JsonParser.parseString(responseJson)
            val response = authApiService.verifyPasskeyAuthentication(PasskeyVerifyAuthenticationRequestDto(response = parsedResponse))
            if (response.isSuccessful) {
                val body = response.body()
                val token = body?.effectiveToken ?: body?.token ?: ""
                val orgSlug = body?.effectiveOrgSlug ?: body?.orgSlug ?: "default"
                if (token.isNotEmpty()) {
                    sessionManager.saveSession(
                        accessToken = token,
                        memberToken = token,
                        orgSlug = orgSlug,
                        userId = body?.user?.id,
                        userName = body?.user?.name,
                        userEmail = body?.user?.email
                    )
                    runCatching { validateSession() }
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to verify passkey authentication: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun listUserPasskeys(): Result<List<PasskeyItemDto>> {
        return try {
            val response = authApiService.listUserPasskeys()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body() ?: emptyList())
            } else {
                Result.failure(Exception("Failed to list passkeys: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deletePasskey(id: String): Result<Unit> {
        return try {
            val response = authApiService.deletePasskey(PasskeyDeleteRequestDto(id = id))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete passkey: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun switchOrganization(organizationId: String): Result<AndroidMeResponseDto> {
        return try {
            val response = authApiService.switchOrganization(SwitchOrgRequestDto(organizationId = organizationId))
            if (response.isSuccessful && response.body()?.success == true) {
                // Re-validate session to fetch full updated me context (user, member, org, memberships, locations)
                validateSession()
            } else {
                val errorMsg = response.body()?.error?.message ?: response.message()
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
