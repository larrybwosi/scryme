package tech.scryme.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.domain.repository.AuthRepository
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

    init {
        viewModelScope.launch {
            authRepository.isLoggedIn().collect { loggedIn ->
                _isLoggedIn.value = loggedIn
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
