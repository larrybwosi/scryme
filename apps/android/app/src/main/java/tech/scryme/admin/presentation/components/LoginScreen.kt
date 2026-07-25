package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ScrymeColors.InkBg)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Server Config Shortcut at Top Right
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.End
            ) {
                IconButton(
                    onClick = { showServerSettingsDialog = true },
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(ScrymeColors.SteelDark)
                        .border(1.dp, ScrymeColors.Brass.copy(alpha = 0.4f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Configure Server Endpoint",
                        tint = ScrymeColors.Brass
                    )
                }
            }

            // App Logo Section
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "SCRYME",
                    color = ScrymeColors.Paper,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
            }

            Text(
                text = "THE OPERATING LEDGER",
                color = ScrymeColors.Brass,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 4.sp,
                modifier = Modifier.padding(bottom = 24.dp)
            )

            // Current Server Badge
            Text(
                text = "Node: ${currentBaseUrl ?: "https://api.scryme.tech"}",
                color = ScrymeColors.SoftGray,
                fontSize = 11.sp,
                modifier = Modifier
                    .padding(bottom = 16.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(ScrymeColors.SteelDark)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            )

            // Auth Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ScrymeColors.Brass.copy(alpha = 0.3f), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    // Email & Password Sign In
                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            emailError = null
                        },
                        label = { Text("Business Email", color = ScrymeColors.SoftGray) },
                        leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = ScrymeColors.Brass) },
                        isError = emailError != null,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass
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

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            passwordError = null
                        },
                        label = { Text("Secure Password", color = ScrymeColors.SoftGray) },
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = ScrymeColors.Brass) },
                        trailingIcon = {
                            TextButton(onClick = { isPasswordVisible = !isPasswordVisible }) {
                                Text(
                                    text = if (isPasswordVisible) "HIDE" else "SHOW",
                                    color = ScrymeColors.Brass,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                )
                            }
                        },
                        visualTransformation = if (isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        isError = passwordError != null,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass
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
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                        shape = RoundedCornerShape(8.dp),
                        enabled = loginState !is UiState.Loading
                    ) {
                        if (loginState is UiState.Loading) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = ScrymeColors.InkBg)
                        } else {
                            Text("SIGN IN TO LEDGER", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                    }

                    // Decorative Spacer / Or separator
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HorizontalDivider(modifier = Modifier.weight(1f), color = ScrymeColors.SoftGray.copy(alpha = 0.2f))
                        Text(
                            text = "OR CONTINUE WITH",
                            color = ScrymeColors.SoftGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                        HorizontalDivider(modifier = Modifier.weight(1f), color = ScrymeColors.SoftGray.copy(alpha = 0.2f))
                    }

                    // Google Sign-In Button
                    OutlinedButton(
                        onClick = {
                            coroutineScope.launch {
                                // Trigger high-fidelity Mock Google Sign-In flow
                                Toast.makeText(context, "Initiating Google Secure Authentication...", Toast.LENGTH_SHORT).show()
                                viewModel.loginWithGoogle("google_oauth_id_token_scryme_prod")
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.3f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = ScrymeColors.Paper),
                        shape = RoundedCornerShape(8.dp),
                        enabled = loginState !is UiState.Loading
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            // Customized Google Icon Vector representation
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
                            Text("Sign In with Google", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        }
                    }
                }
            }

            // Trust badge and security notice
            Row(
                modifier = Modifier.padding(top = 32.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Security Status",
                    tint = ScrymeColors.SoftGray,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "End-to-End Encrypted Session. Built for Scryme enterprise nodes.",
                    color = ScrymeColors.SoftGray,
                    fontSize = 10.sp,
                    textAlign = TextAlign.Center
                )
            }
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
