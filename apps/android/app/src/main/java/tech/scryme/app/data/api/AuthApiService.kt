package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
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

    @POST("auth/sign-in/email")
    suspend fun loginWithEmail(
        @Body request: EmailSignInRequestDto
    ): Response<EmailSignInResponseDto>

    @POST("members/login")
    suspend fun loginMember(
        @Header("x-org-slug") orgSlug: String,
        @Header("x-api-key") apiKey: String? = null,
        @Body request: TerminalLoginRequestDto
    ): Response<V3ApiResponse<TerminalLoginResponseDto>>

    @POST("auth/token")
    suspend fun exchangeToken(
        @Body request: TokenExchangeRequestDto
    ): Response<V3ApiResponse<TokenExchangeResponseDto>>

    @POST("{orgSlug}/pos/pair")
    suspend fun pairPosDevice(
        @Path("orgSlug") orgSlug: String,
        @Body request: PosPairRequestDto
    ): Response<V3ApiResponse<PosPairResponseDto>>

    @POST("pos/pairing/session/{sessionId}/authorize")
    suspend fun authorizePosPairingSession(
        @Path("sessionId") sessionId: String,
        @Body request: PosPairRequestDto
    ): Response<V3ApiResponse<PosPairResponseDto>>
}
