package tech.scryme.app.domain.repository

import kotlinx.coroutines.flow.Flow
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.PasskeyItemDto

interface AuthRepository {
    suspend fun loginWithEmail(email: String, password: String): Result<Unit>
    suspend fun exchangeOAuthCode(code: String, codeVerifier: String?): Result<Unit>
    suspend fun loginMember(orgSlug: String, pin: String?, cardId: String?, apiKey: String? = null): Result<Unit>
    suspend fun validateSession(): Result<AndroidMeResponseDto>
    suspend fun pairPosDevice(qrContent: String): Result<String>
    suspend fun logout()
    fun isLoggedIn(): Flow<Boolean>
    fun getActiveOrgSlug(): Flow<String?>
    fun getActiveLocationId(): Flow<String?>

    // Passkey Operations
    suspend fun generatePasskeyRegisterOptions(name: String? = null): Result<String>
    suspend fun verifyPasskeyRegistration(responseJson: String): Result<Unit>
    suspend fun generatePasskeyAuthenticateOptions(): Result<String>
    suspend fun verifyPasskeyAuthentication(responseJson: String): Result<Unit>
    suspend fun listUserPasskeys(): Result<List<PasskeyItemDto>>
    suspend fun deletePasskey(id: String): Result<Unit>
}
