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
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF070A10))
    ) {
        // Atmospheric Smoky Nebula Canvas
        SmokyBackgroundCanvas()

        // Content Stack
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Center Word Art Hero Section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.weight(1f)
            ) {
                ScrymeWordArt(
                    modifier = Modifier.padding(bottom = 28.dp)
                )

                Text(
                    text = "The All-In-One Enterprise Platform\nFor Unified Operations & Workflow Intelligence.",
                    fontSize = 15.sp,
                    color = Color(0xFFCBD5E1),
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp,
                    fontWeight = FontWeight.Normal,
                    modifier = Modifier.padding(horizontal = 12.dp)
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
}
