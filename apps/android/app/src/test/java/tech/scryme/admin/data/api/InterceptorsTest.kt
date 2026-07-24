package tech.scryme.admin.data.api

import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.MutableStateFlow
import okhttp3.Connection
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import org.junit.Assert.assertEquals
import org.junit.Test
import tech.scryme.admin.domain.session.SessionManager

class InterceptorsTest {

    private val sessionManager = mockk<SessionManager>()

    @Test
    fun `AuthInterceptor appends Authorization header when token is present`() {
        val mockToken = "secure_token_123"
        every { sessionManager.token } returns MutableStateFlow(mockToken)

        val interceptor = AuthInterceptor(sessionManager)

        val request = Request.Builder()
            .url("https://api.scryme.tech/v3/test")
            .build()

        var capturedRequest: Request? = null
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            capturedRequest = firstArg()
            mockk<Response>()
        }

        interceptor.intercept(chain)

        assertEquals("Bearer secure_token_123", capturedRequest?.header("Authorization"))
    }

    @Test
    fun `AuthInterceptor does not append Authorization header when token is empty`() {
        every { sessionManager.token } returns MutableStateFlow(null)

        val interceptor = AuthInterceptor(sessionManager)

        val request = Request.Builder()
            .url("https://api.scryme.tech/v3/test")
            .build()

        var capturedRequest: Request? = null
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            capturedRequest = firstArg()
            mockk<Response>()
        }

        interceptor.intercept(chain)

        assertEquals(null, capturedRequest?.header("Authorization"))
    }

    @Test
    fun `MultiTenancyInterceptor appends organization headers when present`() {
        every { sessionManager.activeOrgId } returns MutableStateFlow("org_id_abc")
        every { sessionManager.activeOrgSlug } returns MutableStateFlow("org_slug_abc")

        val interceptor = MultiTenancyInterceptor(sessionManager)

        val request = Request.Builder()
            .url("https://api.scryme.tech/v3/test")
            .build()

        var capturedRequest: Request? = null
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            capturedRequest = firstArg()
            mockk<Response>()
        }

        interceptor.intercept(chain)

        assertEquals("org_id_abc", capturedRequest?.header("X-Organization-Id"))
        assertEquals("org_slug_abc", capturedRequest?.header("X-Organization-Slug"))
    }
}
