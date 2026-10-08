package tech.scryme.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun GetStartedScreen(
    onNavigateToSignUp: () -> Unit,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AuthBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Header
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 16.dp)
        ) {
            ScrymeBrandHeader(
                modifier = Modifier.padding(bottom = 16.dp)
            )

            Text(
                text = "Get Started",
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF0F172A),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "The All-In-One Enterprise Platform\nFor Operations & Workflow Management.",
                fontSize = 14.sp,
                color = SubtitleText,
                textAlign = TextAlign.Center,
                lineHeight = 20.sp
            )
        }

        // Illustration & Dots
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Wallet3DIllustration(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            PageIndicatorDots(
                pageCount = 4,
                selectedIndex = 1
            )
        }

        // Action Buttons
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            AuthPrimaryButton(
                text = "Sign Up",
                onClick = onNavigateToSignUp
            )

            AuthSecondaryButton(
                text = "Log In",
                onClick = onNavigateToLogin
            )
        }
    }
}
