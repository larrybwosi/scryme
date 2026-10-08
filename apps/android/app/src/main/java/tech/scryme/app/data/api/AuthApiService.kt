package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.EmailSignInRequestDto
import tech.scryme.app.data.dto.EmailSignInResponseDto
import tech.scryme.app.data.dto.PosPairRequestDto
import tech.scryme.app.data.dto.PosPairResponseDto
import tech.scryme.app.data.dto.TerminalLoginRequestDto
import tech.scryme.app.data.dto.TerminalLoginResponseDto
import tech.scryme.app.data.dto.TokenExchangeRequestDto
import tech.scryme.app.data.dto.TokenExchangeResponseDto
import tech.scryme.app.data.dto.V3ApiResponse

interface AuthApiService {

    @POST("android/auth/login")
    suspend fun loginWithEmail(
        @Body request: EmailSignInRequestDto
    ): Response<V3ApiResponse<EmailSignInResponseDto>>

    @POST("android/pos/members/login")
    suspend fun loginMember(
        @Header("x-org-slug") orgSlug: String,
        @Header("x-api-key") apiKey: String? = null,
        @Body request: TerminalLoginRequestDto
    ): Response<V3ApiResponse<TerminalLoginResponseDto>>

    @POST("android/pos/token")
    suspend fun exchangeToken(
        @Body request: TokenExchangeRequestDto
    ): Response<V3ApiResponse<TokenExchangeResponseDto>>

    @GET("android/auth/me")
    suspend fun getAndroidMe(): Response<V3ApiResponse<AndroidMeResponseDto>>

    @POST("android/pos/pair")
    suspend fun pairPosDevice(
        @Header("x-org-slug") orgSlug: String,
        @Body request: PosPairRequestDto
    ): Response<V3ApiResponse<PosPairResponseDto>>

    @POST("android/pos/pairing/session/{sessionId}/authorize")
    suspend fun authorizePosPairingSession(
        @Path("sessionId") sessionId: String,
        @Body request: PosPairRequestDto
    ): Response<V3ApiResponse<PosPairResponseDto>>
}
