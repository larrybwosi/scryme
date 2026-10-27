package tech.scryme.app.ui.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.repository.AuthRepository
import javax.inject.Inject

sealed class SplashState {
    object Loading : SplashState()
    object Authenticated : SplashState()
    object Unauthenticated : SplashState()
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _splashState = MutableStateFlow<SplashState>(SplashState.Loading)
    val splashState: StateFlow<SplashState> = _splashState.asStateFlow()

    init {
        checkSession()
    }

        fun checkSession() {
        viewModelScope.launch {
            _splashState.value = SplashState.Loading
            delay(1000)
            val token = sessionManager.getAccessToken()
            if (token.isNullOrEmpty()) {
                _splashState.value = SplashState.Unauthenticated
                return@launch
            }

            val validateResult = authRepository.validateSession()
            validateResult.fold(
                onSuccess = { meData ->
                    val effectiveOrgSlug = meData.activeOrganization?.slug ?: sessionManager.getOrgSlug() ?: "default"
                    val currentToken = sessionManager.getAccessToken()
                    if (!currentToken.isNullOrEmpty() && !effectiveOrgSlug.isNullOrEmpty()) {
                        _splashState.value = SplashState.Authenticated
                    } else {
                        _splashState.value = SplashState.Unauthenticated
                    }
                },
                onFailure = {
                    val localOrgSlug = sessionManager.getOrgSlug()
                    if (!token.isNullOrEmpty() && !localOrgSlug.isNullOrEmpty()) {
                        _splashState.value = SplashState.Authenticated
                    } else if (!token.isNullOrEmpty()) {
                        sessionManager.saveSession(
                            accessToken = token,
                            orgSlug = localOrgSlug ?: "default"
                        )
                        _splashState.value = SplashState.Authenticated
                    } else {
                        _splashState.value = SplashState.Unauthenticated
                    }
                }
            )
        }
    }
}
