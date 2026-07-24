package tech.scryme.admin.data.api

import okhttp3.Interceptor
import okhttp3.Response
import tech.scryme.admin.domain.session.SessionManager

class AuthInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = sessionManager.token.value

        return if (!token.isNullOrBlank()) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            chain.proceed(originalRequest)
        }
    }
}

class MultiTenancyInterceptor(private val sessionManager: SessionManager) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val orgId = sessionManager.activeOrgId.value
        val orgSlug = sessionManager.activeOrgSlug.value

        val builder = originalRequest.newBuilder()
        if (!orgId.isNullOrBlank()) {
            builder.header("X-Organization-Id", orgId)
        }
        if (!orgSlug.isNullOrBlank()) {
            builder.header("X-Organization-Slug", orgSlug)
        }

        return chain.proceed(builder.build())
    }
}
