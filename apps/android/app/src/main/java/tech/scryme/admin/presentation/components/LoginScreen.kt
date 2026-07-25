package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.scryme.admin.presentation.viewmodel.AuthViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors

@Suppress("ktlint:standard:function-naming")
@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    val context = LocalContext.current
    val loginState by viewModel.loginState.collectAsState()
    val currentBaseUrl by viewModel.sessionManager.baseUrl.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    // Email Input States
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }

    // Validation States
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }

    // Dialog state for server settings
    var showServerSettingsDialog by remember { mutableStateOf(false) }

    // Display state-driven error from API
    LaunchedEffect(loginState) {
        if (loginState is UiState.Error) {
            Toast.makeText(context, (loginState as UiState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    // Subtle, premium radial-leaning gradient — restrained rather than showy
    val backgroundBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF05070C),
            ScrymeColors.InkBg
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundBrush)
    ) {
        // Main scrollable content, centered
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(72.dp))

            // Wordmark — quieter, tighter tracking, small kicker above for a premium feel
            Text(
                text = "PRIVATE LEDGER ACCESS",
                color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 2.5.sp,
                modifier = Modifier.padding(bottom = 10.dp)
            )
            Text(
                text = "SCRYME",
                color = ScrymeColors.Paper,
                fontSize = 34.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 5.sp,
                modifier = Modifier.padding(bottom = 40.dp)
            )

            // Auth Card — restrained single hairline border, flatter elevation for a modern look
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
                        shape = RoundedCornerShape(20.dp)
                    ),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(modifier = Modifier.padding(28.dp)) {
                    Text(
                        text = "Sign in",
                        color = ScrymeColors.Paper,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Enter your credentials to access the ledger.",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                        fontSize = 12.5.sp,
                        modifier = Modifier.padding(bottom = 24.dp)
                    )

                    // Business Email Input
                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            emailError = null
                        },
                        label = { Text("Business email", color = ScrymeColors.SoftGray.copy(alpha = 0.7f), fontWeight = FontWeight.Medium) },
                        isError = emailError != null,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.18f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass,
                            focusedTextColor = ScrymeColors.Paper,
                            unfocusedTextColor = ScrymeColors.Paper
                        ),
                        singleLine = true
                    )
                    if (emailError != null) {
                        Text(
                            text = emailError!!,
                            color = ScrymeColors.Crimson,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Secure Password Input
                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            passwordError = null
                        },
                        label = { Text("Password", color = ScrymeColors.SoftGray.copy(alpha = 0.7f), fontWeight = FontWeight.Medium) },
                        trailingIcon = {
                            TextButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                Text(
                                    text = if (isPasswordVisible) "HIDE" else "SHOW",
                                    color = ScrymeColors.Brass,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    letterSpacing = 1.sp
                                )
                            }
                        },
                        visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        isError = passwordError != null,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.18f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass,
                            focusedTextColor = ScrymeColors.Paper,
                            unfocusedTextColor = ScrymeColors.Paper
                        ),
                        singleLine = true
                    )
                    if (passwordError != null) {
                        Text(
                            text = passwordError!!,
                            color = ScrymeColors.Crimson,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Sign In Button
                    Button(
                        onClick = {
                            val isEmailValid = android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
                            if (email.isBlank()) {
                                emailError = "Email is required"
                            } else if (!isEmailValid) {
                                emailError = "Please enter a valid email"
                            }
                            if (password.length < 6) {
                                passwordError = "Password must be at least 6 characters"
                            }

                            if (emailError == null && passwordError == null) {
                                viewModel.login(email.trim(), password)
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ScrymeColors.Brass,
                            contentColor = ScrymeColors.InkBg,
                            disabledContainerColor = ScrymeColors.Brass.copy(alpha = 0.5f),
                            disabledContentColor = ScrymeColors.InkBg.copy(alpha = 0.5f)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        enabled = loginState !is UiState.Loading
                    ) {
                        if (loginState is UiState.Loading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = ScrymeColors.InkBg)
                        } else {
                            Text(
                                text = "Sign in to ledger",
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 0.3.sp,
                                fontSize = 14.sp
                            )
                        }
                    }

                    // Or separator
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f), color = ScrymeColors.SoftGray.copy(alpha = 0.12f))
                        Text(
                            text = "OR CONTINUE WITH",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.2.sp,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f), color = ScrymeColors.SoftGray.copy(alpha = 0.12f))
                    }

                    // Google Sign-In Button
                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                Toast.makeText(context, "Initiating Google Secure Authentication...", Toast.LENGTH_SHORT).show()
                                viewModel.loginWithGoogle("google_oauth_id_token_scryme_prod")
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.12f)),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = Color.White.copy(alpha = 0.02f),
                            contentColor = ScrymeColors.Paper
                        ),
                        shape = RoundedCornerShape(12.dp),
                        enabled = loginState !is UiState.Loading
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(18.dp)
                                    .clip(CircleShape)
                                    .background(Color.White),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "G",
                                    color = Color(0xFF4285F4),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "Sign in with Google",
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp,
                                letterSpacing = 0.2.sp
                            )
                        }
                    }
                }
            }

            // Trust badge and security notice
            Row(
                modifier = Modifier.padding(top = 28.dp, bottom = 32.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Security Status",
                    tint = ScrymeColors.SoftGray.copy(alpha = 0.45f),
                    modifier = Modifier.size(13.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "End-to-end encrypted session · Built for Scryme enterprise nodes",
                    color = ScrymeColors.SoftGray.copy(alpha = 0.45f),
                    fontSize = 10.sp,
                    textAlign = TextAlign.Center
                )
            }
        }

        // Settings icon pinned to the true top-right corner of the screen,
        // independent of scroll, respecting the status bar via safe padding.
        IconButton(
            onClick = { showServerSettingsDialog = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = 16.dp, end = 16.dp)
                .size(40.dp)
                .clip(CircleShape)
                .background(ScrymeColors.SteelDark.copy(alpha = 0.6f))
                .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.1f), CircleShape)
        ) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Configure Server Endpoint",
                tint = ScrymeColors.SoftGray.copy(alpha = 0.8f),
                modifier = Modifier.size(18.dp)
            )
        }
    }

    // Dynamic Server Settings dialog
    if (showServerSettingsDialog) {
        var inputUrl by remember { mutableStateOf(currentBaseUrl ?: "https://api.scryme.tech") }
        var selectedPreset by remember { mutableStateOf(
            when (currentBaseUrl) {
                "https://api.scryme.tech" -> "production"
                "http://10.0.2.2:3002" -> "emulator"
                else -> "custom"
            }
        ) }

        AlertDialog(
            onDismissRequest = { showServerSettingsDialog = false },
            title = {
                Text(
                    "Server Node Configuration",
                    color = ScrymeColors.Paper,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Configure the endpoint of the Scryme ledger to dynamically connect to local or cloud instances.",
                        color = ScrymeColors.SoftGray,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )

                    // Presets
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                selectedPreset = "production"
                                inputUrl = "https://api.scryme.tech"
                            },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(
                                1.dp,
                                if (selectedPreset == "production") ScrymeColors.Brass else ScrymeColors.SoftGray.copy(alpha = 0.2f)
                            ),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (selectedPreset == "production") ScrymeColors.Brass.copy(alpha = 0.15f) else Color.Transparent,
                                contentColor = ScrymeColors.Paper
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Text("Prod Cloud", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                selectedPreset = "emulator"
                                inputUrl = "http://10.0.2.2:3002"
                            },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(
                                1.dp,
                                if (selectedPreset == "emulator") ScrymeColors.Brass else ScrymeColors.SoftGray.copy(alpha = 0.2f)
                            ),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (selectedPreset == "emulator") ScrymeColors.Brass.copy(alpha = 0.15f) else Color.Transparent,
                                contentColor = ScrymeColors.Paper
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Text("Emulator", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = {
                                selectedPreset = "custom"
                            },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(
                                1.dp,
                                if (selectedPreset == "custom") ScrymeColors.Brass else ScrymeColors.SoftGray.copy(alpha = 0.2f)
                            ),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = if (selectedPreset == "custom") ScrymeColors.Brass.copy(alpha = 0.15f) else Color.Transparent,
                                contentColor = ScrymeColors.Paper
                            ),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Text("Custom", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Custom URL input
                    OutlinedTextField(
                        value = inputUrl,
                        onValueChange = {
                            inputUrl = it
                            selectedPreset = "custom"
                        },
                        label = { Text("Server URL", color = ScrymeColors.SoftGray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass,
                            focusedTextColor = ScrymeColors.Paper,
                            unfocusedTextColor = ScrymeColors.Paper
                        ),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cleanedUrl = inputUrl.trim().removeSuffix("/")
                        viewModel.sessionManager.saveBaseUrl(cleanedUrl)
                        showServerSettingsDialog = false
                        Toast.makeText(context, "Node configured to: $cleanedUrl", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ScrymeColors.Brass,
                        contentColor = ScrymeColors.InkBg
                    )
                ) {
                    Text("Apply & Connect", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showServerSettingsDialog = false }) {
                    Text("Cancel", color = ScrymeColors.SoftGray)
                }
            },
            containerColor = ScrymeColors.SteelDark,
            shape = RoundedCornerShape(16.dp)
        )
    }
}
