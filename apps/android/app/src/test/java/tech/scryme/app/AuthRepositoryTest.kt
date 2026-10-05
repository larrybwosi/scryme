package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.AuthApiService
import tech.scryme.app.data.dto.*
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
    fun loginWithEmail_success_savesSession() = runBlocking {
        val signInResponse = EmailSignInResponseDto(
            token = "jwt-user-token-789",
            user = EmailUserDto(id = "usr_123", email = "test@scryme.tech", name = "Test User"),
            orgSlug = "test-org"
        )

        coEvery {
            authApiService.loginWithEmail(any())
        } returns Response.success(signInResponse)

        coEvery {
            authApiService.getAndroidMe()
        } returns Response.success(V3ApiResponse(success = true, data = AndroidMeResponseDto(
            user = UserDetailDto(id = "usr_123", email = "test@scryme.tech", name = "Test User"),
            activeOrganization = OrganizationDetailDto(id = "org_1", slug = "test-org", name = "Test Org")
        )))

        val result = repository.loginWithEmail("test@scryme.tech", "password123")

        assertTrue(result.isSuccess)
        coVerify {
            sessionManager.saveSession(
                accessToken = "jwt-user-token-789",
                memberToken = "jwt-user-token-789",
                orgSlug = "test-org",
                locationId = any(),
                memberId = any(),
                userName = "Test User",
                userEmail = "test@scryme.tech"
            )
        }
    }

    @Test
    fun validateSession_success_updatesSession() = runBlocking {
        coEvery { sessionManager.getAccessToken() } returns "jwt-valid-token"
        coEvery {
            authApiService.getAndroidMe()
        } returns Response.success(V3ApiResponse(
            success = true,
            data = AndroidMeResponseDto(
                user = UserDetailDto(id = "usr_1", email = "user@scryme.tech", name = "Scryme Admin"),
                activeOrganization = OrganizationDetailDto(id = "org_1", slug = "scryme-hq", name = "Scryme HQ")
            )
        ))

        val result = repository.validateSession()

        assertTrue(result.isSuccess)
        assertEquals("Scryme HQ", result.getOrNull()?.activeOrganization?.name)
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
    fun pairPosDevice_withSessionId_success() = runBlocking {
        val pairingResponse = PosPairResponseDto(
            sessionId = "sess_123",
            authorized = true
        )

        coEvery { sessionManager.getOrgSlug() } returns "org-slug"
        coEvery { sessionManager.getLocationId() } returns "loc-1"
        coEvery {
            authApiService.authorizePosPairingSession("sess_123", any())
        } returns Response.success(V3ApiResponse(success = true, data = pairingResponse))

        val result = repository.pairPosDevice("sess_123")

        assertTrue(result.isSuccess)
        assertTrue(result.getOrNull()?.contains("sess_123") == true)
    }

    @Test
    fun pairPosDevice_withJsonPayload_success() = runBlocking {
        val jsonPayload = "{\"sessionId\":\"sess_456\",\"orgSlug\":\"org-test\"}"
        val pairingResponse = PosPairResponseDto(
            sessionId = "sess_456",
            authorized = true
        )

        coEvery { sessionManager.getOrgSlug() } returns "org-test"
        coEvery { sessionManager.getLocationId() } returns "loc-1"
        coEvery {
            authApiService.authorizePosPairingSession("sess_456", any())
        } returns Response.success(V3ApiResponse(success = true, data = pairingResponse))

        val result = repository.pairPosDevice(jsonPayload)

        assertTrue(result.isSuccess)
    }

    @Test
    fun logout_clearsSession() = runBlocking {
        repository.logout()
        coVerify { sessionManager.clearSession() }
    }
}
