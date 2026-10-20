import tech.scryme.app.data.dto.SwitchOrgRequestDto
import tech.scryme.app.data.dto.SwitchOrgResponseDto
package tech.scryme.app.data.api

import com.google.gson.JsonObject
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.EmailSignInRequestDto
import tech.scryme.app.data.dto.EmailSignInResponseDto
import tech.scryme.app.data.dto.OAuthCodeExchangeRequestDto
import tech.scryme.app.data.dto.PasskeyDeleteRequestDto
import tech.scryme.app.data.dto.PasskeyItemDto
import tech.scryme.app.data.dto.PasskeyRegisterOptionsRequestDto
import tech.scryme.app.data.dto.PasskeyVerifyAuthenticationRequestDto
import tech.scryme.app.data.dto.PasskeyVerifyRegistrationRequestDto
import tech.scryme.app.data.dto.PosPairRequestDto
import tech.scryme.app.data.dto.PosPairResponseDto
import tech.scryme.app.data.dto.RegisterDeviceRequestDto
import tech.scryme.app.data.dto.RegisterDeviceResponseDto
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

    @POST("android/auth/oauth/token")
    suspend fun exchangeOAuthCode(
        @Body request: OAuthCodeExchangeRequestDto
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

    @POST("android/register-device")
    suspend fun registerDevice(
        @Body request: RegisterDeviceRequestDto
    ): Response<V3ApiResponse<RegisterDeviceResponseDto>>

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

    // Better-Auth Passkey Endpoints
    @POST("/api/auth/passkey/generate-register-options")
    suspend fun generatePasskeyRegisterOptions(
        @Body request: PasskeyRegisterOptionsRequestDto = PasskeyRegisterOptionsRequestDto()
    ): Response<JsonObject>

    @POST("/api/auth/passkey/verify-registration")
    suspend fun verifyPasskeyRegistration(
        @Body request: PasskeyVerifyRegistrationRequestDto
    ): Response<JsonObject>

    @GET("/api/auth/passkey/generate-authenticate-options")
    suspend fun generatePasskeyAuthenticateOptions(): Response<JsonObject>

    @POST("/api/auth/passkey/verify-authentication")
    suspend fun verifyPasskeyAuthentication(
        @Body request: PasskeyVerifyAuthenticationRequestDto
    ): Response<EmailSignInResponseDto>

    @GET("/api/auth/passkey/list-user-passkeys")
    suspend fun listUserPasskeys(): Response<List<PasskeyItemDto>>

    @POST("/api/auth/passkey/delete-passkey")
    suspend fun deletePasskey(
        @Body request: PasskeyDeleteRequestDto
    ): Response<JsonObject>

    @POST("android/auth/switch-org")
    suspend fun switchOrganization(
        @Body request: SwitchOrgRequestDto
    ): Response<V3ApiResponse<SwitchOrgResponseDto>>
}
