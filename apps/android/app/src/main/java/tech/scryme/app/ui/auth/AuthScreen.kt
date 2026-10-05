package tech.scryme.app.ui.auth

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

enum class AuthStep {
    GET_STARTED,
    LOGIN,
    SIGN_UP
}

@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    var currentStep by remember { mutableStateOf(AuthStep.GET_STARTED) }

    when (currentStep) {
        AuthStep.GET_STARTED -> {
            GetStartedScreen(
                onNavigateToSignUp = { currentStep = AuthStep.SIGN_UP },
                onNavigateToLogin = { currentStep = AuthStep.LOGIN },
                modifier = modifier
            )
        }
        AuthStep.LOGIN -> {
            LoginScreen(
                viewModel = viewModel,
                onLoginSuccess = onLoginSuccess,
                onNavigateToSignUp = { currentStep = AuthStep.SIGN_UP },
                onBackClick = { currentStep = AuthStep.GET_STARTED },
                modifier = modifier
            )
        }
        AuthStep.SIGN_UP -> {
            SignUpScreen(
                viewModel = viewModel,
                onSignUpSuccess = onLoginSuccess,
                onNavigateToLogin = { currentStep = AuthStep.LOGIN },
                onBackClick = { currentStep = AuthStep.GET_STARTED },
                modifier = modifier
            )
        }
    }
}
