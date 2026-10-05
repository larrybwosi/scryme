package tech.scryme.app.domain.repository

import kotlinx.coroutines.flow.Flow
import tech.scryme.app.data.dto.AndroidMeResponseDto

interface AuthRepository {
    suspend fun loginWithEmail(email: String, password: String): Result<Unit>
    suspend fun loginMember(orgSlug: String, pin: String?, cardId: String?, apiKey: String? = null): Result<Unit>
    suspend fun validateSession(): Result<AndroidMeResponseDto>
    suspend fun pairPosDevice(qrContent: String): Result<String>
    suspend fun logout()
    fun isLoggedIn(): Flow<Boolean>
    fun getActiveOrgSlug(): Flow<String?>
    fun getActiveLocationId(): Flow<String?>
}
