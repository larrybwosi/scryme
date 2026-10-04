package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.runBlocking
import okhttp3.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.interceptor.HeaderInterceptor
import tech.scryme.app.data.interceptor.SessionManager

class HeaderInterceptorTest {

    private val sessionManager = mockk<SessionManager>()
    private val chain = mockk<Interceptor.Chain>()
    private lateinit var interceptor: HeaderInterceptor

    @Before
    fun setUp() {
        interceptor = HeaderInterceptor(sessionManager)
    }

    @Test
    fun intercept_addsAuthAndTenantHeaders() = runBlocking {
        coEvery { sessionManager.getAccessToken() } returns "jwt-token-xyz"
        coEvery { sessionManager.getMemberToken() } returns "jwt-token-xyz"
        coEvery { sessionManager.getOrgSlug() } returns "demo-org"
        coEvery { sessionManager.getLocationId() } returns "loc-123"

        val request = Request.Builder()
            .url("https://api.scryme.tech/v3/members/login")
            .build()

        val capturedRequest = slot<Request>()
        coEvery { chain.request() } returns request
        coEvery { chain.proceed(capture(capturedRequest)) } returns Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(200)
            .message("OK")
            .build()

        interceptor.intercept(chain)

        val processed = capturedRequest.captured
        assertEquals("Bearer jwt-token-xyz", processed.header("Authorization"))
        assertEquals("jwt-token-xyz", processed.header("x-member-token"))
        assertEquals("demo-org", processed.header("x-org-slug"))
        assertEquals("demo-org", processed.header("x-organization-slug"))
        assertEquals("loc-123", processed.header("x-location-id"))
        assertEquals("application/json", processed.header("Accept"))
    }
}
