package tech.scryme.app.ui.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.analytics.OpenPanelTracker
import tech.scryme.app.analytics.models.OpenPanelEvents
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.util.PasskeyManager
import tech.scryme.app.util.PkceUtils
import javax.inject.Inject

sealed interface AuthUiState {
    object Idle : AuthUiState
    object Loading : AuthUiState
    object Success : AuthUiState
    data class Error(val message: String) : AuthUiState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager,
    private val openPanelTracker: OpenPanelTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private var pendingCodeVerifier: String? = null

    init {
        viewModelScope.launch {
            authRepository.isLoggedIn().collect { loggedIn ->
                _isLoggedIn.value = loggedIn
                if (loggedIn) {
                    identifyCurrentSession()
                }
            }
        }
    }

    private suspend fun identifyCurrentSession() {
        val userId = sessionManager.getUserId() ?: sessionManager.getMemberId()
        val email = sessionManager.userEmailFlow.toString()
        val name = sessionManager.userNameFlow.toString()
        val orgSlug = sessionManager.getOrgSlug()
        val locationId = sessionManager.getLocationId()

        if (!userId.isNullOrBlank()) {
            openPanelTracker.identify(
                profileId = userId,
                email = sessionManager.getUserId()?.let { sessionManager.getMemberId() } ?: email,
                name = name,
                properties = mapOf(
                    "org_slug" to orgSlug,
                    "location_id" to locationId
                )
            )
            openPanelTracker.setGlobalProperties(
                mapOf(
                    "org_slug" to orgSlug,
                    "location_id" to locationId,
                    "user_id" to userId
                )
            )
        }
    }

    fun loginWithBrowser(context: Context) {
        viewModelScope.launch {
            try {
                openPanelTracker.track(
                    OpenPanelEvents.WEB_BROWSER_AUTH_TRIGGERED,
                    mapOf("auth_method" to "oauth_browser")
                )
                val codeVerifier = PkceUtils.generateCodeVerifier()
                val codeChallenge = PkceUtils.generateCodeChallenge(codeVerifier)
                pendingCodeVerifier = codeVerifier

                val authUrl = Uri.parse("https://auth.scryme.tech/api/auth/oauth2/authorize")
                    .buildUpon()
                    .appendQueryParameter("client_id", "scryme-android-app")
                    .appendQueryParameter("response_type", "code")
                    .appendQueryParameter("redirect_uri", "https://auth.scryme.tech/mobile-callback")
                    .appendQueryParameter("scope", "openid profile email org_info membership")
                    .appendQueryParameter("code_challenge", codeChallenge)
                    .appendQueryParameter("code_challenge_method", "S256")
                    .build()

                val customTabsIntent = CustomTabsIntent.Builder().build()
                customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                customTabsIntent.launchUrl(context, authUrl)
            } catch (e: Exception) {
                openPanelTracker.track(
                    OpenPanelEvents.LOGIN_FAILED,
                    mapOf("auth_method" to "oauth_browser", "error" to (e.message ?: "Launch failed"))
                )
                _uiState.value = AuthUiState.Error("Failed to launch web sign-in: ${e.message}")
            }
        }
    }

    fun handleDeepLinkIntent(uri: Uri?) {
        if (uri == null) return
        val code = uri.getQueryParameter("code")
        val error = uri.getQueryParameter("error")
        val errorDescription = uri.getQueryParameter("error_description")

        if (!error.isNullOrEmpty()) {
            openPanelTracker.track(
                OpenPanelEvents.LOGIN_FAILED,
                mapOf("auth_method" to "oauth_browser", "error" to (errorDescription ?: error))
            )
            _uiState.value = AuthUiState.Error(errorDescription ?: error)
            return
        }

        if (!code.isNullOrEmpty()) {
            viewModelScope.launch {
                _uiState.value = AuthUiState.Loading
                openPanelTracker.track(
                    OpenPanelEvents.LOGIN_ATTEMPT,
                    mapOf("auth_method" to "oauth_browser")
                )
                val result = authRepository.exchangeOAuthCode(code, pendingCodeVerifier)
                result.fold(
                    onSuccess = {
                        _uiState.value = AuthUiState.Success
                        pendingCodeVerifier = null
                        openPanelTracker.track(
                            OpenPanelEvents.LOGIN_SUCCESS,
                            mapOf("auth_method" to "oauth_browser")
                        )
                        identifyCurrentSession()
                    },
                    onFailure = { err ->
                        val errMsg = err.message ?: "Failed to authenticate via browser link."
                        openPanelTracker.track(
                            OpenPanelEvents.LOGIN_FAILED,
                            mapOf("auth_method" to "oauth_browser", "error" to errMsg)
                        )
                        _uiState.value = AuthUiState.Error(errMsg)
                    }
                )
            }
        }
    }

    fun signInWithPasskey(context: Context) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            openPanelTracker.track(
                OpenPanelEvents.PASSKEY_AUTH_TRIGGERED,
                mapOf("auth_method" to "passkey")
            )
            val optionsResult = authRepository.generatePasskeyAuthenticateOptions()
            optionsResult.fold(
                onSuccess = { optionsJson ->
                    val credentialResult = PasskeyManager.getPasskey(context, optionsJson)
                    credentialResult.fold(
                        onSuccess = { responseJson ->
                            val verifyResult = authRepository.verifyPasskeyAuthentication(responseJson)
                            verifyResult.fold(
                                onSuccess = {
                                    _uiState.value = AuthUiState.Success
                                    openPanelTracker.track(
                                        OpenPanelEvents.LOGIN_SUCCESS,
                                        mapOf("auth_method" to "passkey")
                                    )
                                    identifyCurrentSession()
                                },
                                onFailure = { err ->
                                    val msg = err.message ?: "Passkey authentication failed"
                                    openPanelTracker.track(
                                        OpenPanelEvents.LOGIN_FAILED,
                                        mapOf("auth_method" to "passkey", "error" to msg)
                                    )
                                    _uiState.value = AuthUiState.Error(msg)
                                }
                            )
                        },
                        onFailure = { err ->
                            val msg = err.message ?: "Passkey selection cancelled or failed"
                            openPanelTracker.track(
                                OpenPanelEvents.LOGIN_FAILED,
                                mapOf("auth_method" to "passkey", "error" to msg)
                            )
                            _uiState.value = AuthUiState.Error(msg)
                        }
                    )
                },
                onFailure = { err ->
                    val msg = err.message ?: "Could not initiate passkey authentication"
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_FAILED,
                        mapOf("auth_method" to "passkey", "error" to msg)
                    )
                    _uiState.value = AuthUiState.Error(msg)
                }
            )
        }
    }

    fun loginWithEmail(email: String, password: String) {
        if (email.isBlank()) {
            _uiState.value = AuthUiState.Error("Email is required")
            return
        }
        if (password.isBlank()) {
            _uiState.value = AuthUiState.Error("Password is required")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            openPanelTracker.track(
                OpenPanelEvents.LOGIN_ATTEMPT,
                mapOf("auth_method" to "email")
            )
            val result = authRepository.loginWithEmail(email.trim(), password)
            result.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_SUCCESS,
                        mapOf("auth_method" to "email")
                    )
                    identifyCurrentSession()
                },
                onFailure = { error ->
                    val msg = error.message ?: "Authentication failed. Please check credentials."
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_FAILED,
                        mapOf("auth_method" to "email", "error" to msg)
                    )
                    _uiState.value = AuthUiState.Error(msg)
                }
            )
        }
    }

    fun signUp(fullName: String, email: String, password: String, agreeTerms: Boolean = true) {
        if (fullName.isBlank()) {
            _uiState.value = AuthUiState.Error("Full Name is required")
            return
        }
        if (email.isBlank()) {
            _uiState.value = AuthUiState.Error("Email is required")
            return
        }
        if (password.isBlank()) {
            _uiState.value = AuthUiState.Error("Password is required")
            return
        }
        if (!agreeTerms) {
            _uiState.value = AuthUiState.Error("You must agree to the Terms and Conditions")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            openPanelTracker.track(
                OpenPanelEvents.LOGIN_ATTEMPT,
                mapOf("auth_method" to "signup")
            )
            val result = authRepository.loginWithEmail(email.trim(), password)
            result.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_SUCCESS,
                        mapOf("auth_method" to "signup")
                    )
                    identifyCurrentSession()
                },
                onFailure = { error ->
                    val msg = error.message ?: "Sign up failed. Please check your information."
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_FAILED,
                        mapOf("auth_method" to "signup", "error" to msg)
                    )
                    _uiState.value = AuthUiState.Error(msg)
                }
            )
        }
    }

    fun loginWithPin(orgSlug: String, pin: String) {
        if (orgSlug.isBlank()) {
            _uiState.value = AuthUiState.Error("Organization Slug is required")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            openPanelTracker.track(
                OpenPanelEvents.LOGIN_ATTEMPT,
                mapOf("auth_method" to "terminal_pin", "org_slug" to orgSlug)
            )
            val result = authRepository.loginMember(
                orgSlug = orgSlug.trim(),
                pin = pin.ifBlank { null },
                cardId = null
            )
            result.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_SUCCESS,
                        mapOf("auth_method" to "terminal_pin", "org_slug" to orgSlug)
                    )
                    identifyCurrentSession()
                },
                onFailure = { error ->
                    val msg = error.message ?: "PIN login failed. Please check credentials."
                    openPanelTracker.track(
                        OpenPanelEvents.LOGIN_FAILED,
                        mapOf("auth_method" to "terminal_pin", "error" to msg)
                    )
                    _uiState.value = AuthUiState.Error(msg)
                }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            openPanelTracker.track(OpenPanelEvents.LOGOUT)
            openPanelTracker.clearUser()
            authRepository.logout()
            _uiState.value = AuthUiState.Idle
        }
    }
}
