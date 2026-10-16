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
import tech.scryme.app.domain.repository.AuthRepository
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
    private val authRepository: AuthRepository
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
            }
        }
    }

    fun loginWithBrowser(context: Context) {
        viewModelScope.launch {
            try {
                val codeVerifier = PkceUtils.generateCodeVerifier()
                val codeChallenge = PkceUtils.generateCodeChallenge(codeVerifier)
                pendingCodeVerifier = codeVerifier

                val redirectUri = Uri.encode("https://auth.scryme.tech/mobile-callback")
                val authUrl = Uri.parse("https://auth.scryme.tech/oauth2/authorize")
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
            _uiState.value = AuthUiState.Error(errorDescription ?: error)
            return
        }

        if (!code.isNullOrEmpty()) {
            viewModelScope.launch {
                _uiState.value = AuthUiState.Loading
                val result = authRepository.exchangeOAuthCode(code, pendingCodeVerifier)
                result.fold(
                    onSuccess = {
                        _uiState.value = AuthUiState.Success
                        pendingCodeVerifier = null
                    },
                    onFailure = { err ->
                        _uiState.value = AuthUiState.Error(err.message ?: "Failed to authenticate via browser link.")
                    }
                )
            }
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
            val result = authRepository.loginWithEmail(email.trim(), password)
            result.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success
                },
                onFailure = { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Authentication failed. Please check credentials.")
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
            val result = authRepository.loginWithEmail(email.trim(), password)
            result.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success
                },
                onFailure = { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "Sign up failed. Please check your information.")
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
            val result = authRepository.loginMember(
                orgSlug = orgSlug.trim(),
                pin = pin.ifBlank { null },
                cardId = null
            )
            result.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success
                },
                onFailure = { error ->
                    _uiState.value = AuthUiState.Error(error.message ?: "PIN login failed. Please check credentials.")
                }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.value = AuthUiState.Idle
        }
    }
}
