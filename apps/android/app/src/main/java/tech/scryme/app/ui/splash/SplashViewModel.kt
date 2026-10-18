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
import javax.inject.Inject

sealed class SplashState {
    object Loading : SplashState()
    object Authenticated : SplashState()
    object Unauthenticated : SplashState()
}

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _splashState = MutableStateFlow<SplashState>(SplashState.Loading)
    val splashState: StateFlow<SplashState> = _splashState.asStateFlow()

    init {
        checkSession()
    }

    fun checkSession() {
        viewModelScope.launch {
            _splashState.value = SplashState.Loading
            // Small minimum delay for smooth splash presentation
            delay(1200)
            val token = sessionManager.getAccessToken()
            val orgSlug = sessionManager.getOrgSlug()
            if (!token.isNullOrEmpty() && !orgSlug.isNullOrEmpty()) {
                _splashState.value = SplashState.Authenticated
            } else {
                _splashState.value = SplashState.Unauthenticated
            }
        }
    }
}
