package tech.scryme.admin.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.BetterAuthSessionResponse
import tech.scryme.admin.domain.repository.AuthRepository
import tech.scryme.admin.domain.session.SessionManager

class AuthViewModel(
    private val repository: AuthRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _loginState = MutableStateFlow<UiState<BetterAuthSessionResponse>>(UiState.Idle)
    val loginState: StateFlow<UiState<BetterAuthSessionResponse>> = _loginState.asStateFlow()

    private val _isAuthenticated = MutableStateFlow<Boolean>(!sessionManager.token.value.isNullOrEmpty())
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    init {
        val currentToken = sessionManager.token.value
        if (!currentToken.isNullOrBlank()) {
            checkSession()
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            repository.signInWithEmail(email, password)
                .onSuccess { response ->
                    _isAuthenticated.value = true
                    _loginState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    val errorMessage = if (error.message?.contains("Unauthorized", ignoreCase = true) == true) {
                        "invalid credentials"
                    } else {
                        error.message ?: "Authentication failed"
                    }
                    _loginState.value = UiState.Error(errorMessage)
                }
        }
    }

    fun loginWithGoogle(idToken: String) {
        viewModelScope.launch {
            _loginState.value = UiState.Loading
            repository.signInWithGoogle(idToken)
                .onSuccess { response ->
                    _isAuthenticated.value = true
                    _loginState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    _loginState.value = UiState.Error(error.message ?: "Google login failed")
                }
        }
    }

    fun checkSession() {
        val currentToken = sessionManager.token.value
        if (currentToken.isNullOrBlank()) {
            _isAuthenticated.value = false
            _loginState.value = UiState.Idle
            return
        }

        viewModelScope.launch {
            _loginState.value = UiState.Loading
            repository.getSession()
                .onSuccess { response ->
                    _isAuthenticated.value = true
                    _loginState.value = UiState.Success(response)
                }
                .onFailure { error ->
                    val errorMsg = error.message ?: ""
                    if (errorMsg.contains("expired", ignoreCase = true) || errorMsg.contains("401", ignoreCase = true)) {
                        repository.signOut()
                        _isAuthenticated.value = false
                        _loginState.value = UiState.Idle
                    } else {
                        _loginState.value = UiState.Error(error.message ?: "Session check failed")
                    }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.signOut()
            _isAuthenticated.value = false
            _loginState.value = UiState.Idle
        }
    }
}
