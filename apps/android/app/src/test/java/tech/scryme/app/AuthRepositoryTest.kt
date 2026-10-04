package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.AuthApiService
import tech.scryme.app.data.dto.MemberUserDto
import tech.scryme.app.data.dto.TerminalLoginResponseDto
import tech.scryme.app.data.dto.V3ApiResponse
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.data.repository.AuthRepositoryImpl

class AuthRepositoryTest {

    private val authApiService = mockk<AuthApiService>()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private lateinit var repository: AuthRepositoryImpl

    @Before
    fun setUp() {
        repository = AuthRepositoryImpl(authApiService, sessionManager)
    }

    @Test
    fun loginMember_success_savesSession() = runBlocking {
        val loginResponse = TerminalLoginResponseDto(
            token = "jwt-member-token-123",
            organizationId = "org_test_1",
            locationId = "loc_test_1",
            member = MemberUserDto(id = "mem_123")
        )

        coEvery {
            authApiService.loginMember("org-slug", apiKey = null, request = any())
        } returns Response.success(V3ApiResponse(success = true, data = loginResponse))

        val result = repository.loginMember("org-slug", pin = "1234", cardId = null)

        assertTrue(result.isSuccess)
        coVerify {
            sessionManager.saveSession(
                accessToken = "jwt-member-token-123",
                memberToken = "jwt-member-token-123",
                orgSlug = "org_test_1",
                locationId = "loc_test_1",
                memberId = "mem_123"
            )
        }
    }

    @Test
    fun loginMember_failure_returnsError() = runBlocking {
        coEvery {
            authApiService.loginMember("invalid-org", apiKey = null, request = any())
        } returns Response.success(V3ApiResponse(success = false, error = tech.scryme.app.data.dto.V3ApiError(message = "Invalid PIN")))

        val result = repository.loginMember("invalid-org", pin = "0000", cardId = null)

        assertTrue(result.isFailure)
        assertEquals("Invalid PIN", result.exceptionOrNull()?.message)
    }

    @Test
    fun logout_clearsSession() = runBlocking {
        repository.logout()
        coVerify { sessionManager.clearSession() }
    }
}
