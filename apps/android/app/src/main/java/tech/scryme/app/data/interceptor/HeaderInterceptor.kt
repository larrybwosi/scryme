package tech.scryme.app.data.interceptor

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HeaderInterceptor @Inject constructor(
    private val sessionManager: SessionManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val requestBuilder = originalRequest.newBuilder()

        runBlocking {
            val token = sessionManager.getAccessToken()
            val memberToken = sessionManager.getMemberToken()
            val orgSlug = sessionManager.getOrgSlug()
            val locationId = sessionManager.getLocationId()

            if (!token.isNullOrEmpty()) {
                requestBuilder.header("Authorization", "Bearer $token")
            }
            if (!memberToken.isNullOrEmpty()) {
                requestBuilder.header("x-member-token", memberToken)
            }
            if (!orgSlug.isNullOrEmpty()) {
                requestBuilder.header("x-org-slug", orgSlug)
                requestBuilder.header("x-organization-slug", orgSlug)
            }
            if (!locationId.isNullOrEmpty()) {
                requestBuilder.header("x-location-id", locationId)
            }
        }

        requestBuilder.header("Accept", "application/json")
        return chain.proceed(requestBuilder.build())
    }
}
