package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import tech.scryme.app.data.dto.TerminalLoginRequestDto
import tech.scryme.app.data.dto.TerminalLoginResponseDto
import tech.scryme.app.data.dto.TokenExchangeRequestDto
import tech.scryme.app.data.dto.TokenExchangeResponseDto
import tech.scryme.app.data.dto.V3ApiResponse

interface AuthApiService {

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
}
