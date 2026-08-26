package tech.scryme.admin.presentation.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.AuthViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

// ---------------------------------------------------------------------------
// Palette — deep, smoky, enterprise-grade neutrals with a single accent.
// Pull these into your theme file if you want them reusable app-wide.
// ---------------------------------------------------------------------------
private val SmokyTop = Color(0xFF0D1117)
private val SmokyMid = Color(0xFF161B22)
private val SmokyBottom = Color(0xFF1F2733)
private val AccentBlue = Color(0xFF3B82F6)
private val AccentBlueDim = Color(0xFF2563EB)
private val CardSurface = Color(0xFF171C24)
private val CardBorder = Color(0xFF2A313D)
private val TextPrimary = Color(0xFFF3F5F7)
private val TextSecondary = Color(0xFF8B95A5)
private val ErrorRed = Color(0xFFEF4444)

@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    val loginState by viewModel.loginState.collectAsState()
    val isLoading = loginState is UiState.Loading

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(SmokyMid, SmokyTop, Color.Black),
                    center = Offset(0.5f, 0.0f),
                    radius = 1400f
                )
            )
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, SmokyBottom.copy(alpha = 0.6f))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 420.dp)
                .fillMaxWidth()
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Brand mark
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(listOf(AccentBlueDim, AccentBlue))
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(30.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Scryme Admin",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.2.sp
                ),
                color = TextPrimary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Sign in to access the control panel",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(36.dp))

            // Card container — the "glass panel" holding the form
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                color = CardSurface,
                border = BorderStroke(1.dp, CardBorder),
                shadowElevation = 24.dp,
                tonalElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier.padding(28.dp),
                    horizontalAlignment = Alignment.Start
                ) {
                    Text(
                        text = "EMAIL ADDRESS",
                        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        placeholder = { Text("you@company.com", color = TextSecondary.copy(alpha = 0.6f)) },
                        leadingIcon = {
                            Icon(Icons.Default.Email, contentDescription = null, tint = TextSecondary)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        shape = RoundedCornerShape(12.dp),
                        colors = scrymeFieldColors(),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = "PASSWORD",
                        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        placeholder = { Text("••••••••", color = TextSecondary.copy(alpha = 0.6f)) },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = TextSecondary)
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                    tint = TextSecondary
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = scrymeFieldColors(),
                        modifier = Modifier.fillMaxWidth()
                    )

                    AnimatedVisibility(visible = loginState is UiState.Error) {
                        Column {
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(ErrorRed.copy(alpha = 0.12f))
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ErrorOutline,
                                    contentDescription = null,
                                    tint = ErrorRed,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = (loginState as? UiState.Error)?.message ?: "Something went wrong",
                                    color = ErrorRed,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(28.dp))

                    Button(
                        onClick = { viewModel.login(email, password) },
                        enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AccentBlue,
                            disabledContainerColor = AccentBlue.copy(alpha = 0.35f)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                                strokeWidth = 2.5.dp
                            )
                        } else {
                            Text(
                                text = "Sign In",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "Protected by Scryme • Enterprise Access Only",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary.copy(alpha = 0.7f),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun scrymeFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = AccentBlue,
    unfocusedBorderColor = CardBorder,
    focusedContainerColor = Color(0xFF10141B),
    unfocusedContainerColor = Color(0xFF10141B),
    cursorColor = AccentBlue,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    focusedPlaceholderColor = TextSecondary.copy(alpha = 0.6f),
    unfocusedPlaceholderColor = TextSecondary.copy(alpha = 0.6f)
)
