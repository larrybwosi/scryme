package tech.scryme.app.ui.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.ui.auth.SmokyBackgroundCanvas

@Composable
fun SplashScreen(
    viewModel: SplashViewModel,
    onNavigateToOverview: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    val splashState by viewModel.splashState.collectAsState()

    LaunchedEffect(splashState) {
        when (splashState) {
            is SplashState.Authenticated -> onNavigateToOverview()
            is SplashState.Unauthenticated -> onNavigateToLogin()
            is SplashState.Loading -> {}
        }
    }

    val transition = rememberInfiniteTransition(label = "pulse")
    val logoScale by transition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoScale"
    )

    val logoAlpha by transition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoAlpha"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F17)),
        contentAlignment = Alignment.Center
    ) {
        SmokyBackgroundCanvas()

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                text = "SCRYME",
                fontSize = 42.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.SansSerif,
                letterSpacing = 6.sp,
                color = Color.White,
                modifier = Modifier
                    .scale(logoScale)
                    .alpha(logoAlpha)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Enterprise POS & Workforce OS",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 1.5.sp,
                color = Color(0xFF94A3B8)
            )

            Spacer(modifier = Modifier.height(48.dp))

            CircularProgressIndicator(
                color = Color(0xFF6366F1),
                strokeWidth = 3.dp,
                modifier = Modifier.size(36.dp)
            )
        }
    }
}
