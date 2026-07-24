package tech.scryme.admin

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import androidx.compose.material.icons.filled.*
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
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import tech.scryme.admin.data.api.AuthApiService
import tech.scryme.admin.data.api.AuthInterceptor
import tech.scryme.admin.data.api.MultiTenancyInterceptor
import tech.scryme.admin.data.model.BetterAuthSessionResponse
import tech.scryme.admin.data.model.SessionDto
import tech.scryme.admin.data.model.SessionUser
import tech.scryme.admin.data.repository.AuthRepositoryImpl
import tech.scryme.admin.data.session.SessionManagerImpl
import tech.scryme.admin.presentation.viewmodel.AuthViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

class MainActivity : ComponentActivity() {

    private lateinit var authViewModel: AuthViewModel
    private lateinit var sessionManager: SessionManagerImpl

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Secure Session & API Layer
        sessionManager = SessionManagerImpl(applicationContext)

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(sessionManager))
            .addInterceptor(MultiTenancyInterceptor(sessionManager))
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl("https://api.scryme.tech")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val authApiService = retrofit.create(AuthApiService::class.java)
        val authRepository = AuthRepositoryImpl(authApiService, sessionManager)

        authViewModel = AuthViewModel(authRepository, sessionManager)

        setContent {
            ScrymeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(red = 0x0B, green = 0x12, blue = 0x20) // Deep Navy Background #0B1220
                ) {
                    AppNavigation(authViewModel, sessionManager)
                }
            }
        }
    }
}

// --- Scryme Design Tokens ---
object ScrymeColors {
    val InkBg = Color(0xFF0B1220)       // Deep Navy
    val Paper = Color(0xFFF1E9D8)       // Warm Ivory
    val Brass = Color(0xFFC89A4B)       // Primary Gold Accent
    val SteelDark = Color(0xFF161F30)   // Dark Card Background
    val GreenLogo = Color(0xFF34A853)   // Rounded S Logo Green
    val Crimson = Color(0xFFD32F2F)     // Error text color
    val SoftGray = Color(0x80F1E9D8)    // Soft ivory placeholder/text
}

@Composable
fun ScrymeTheme(content: @Composable () -> Unit) {
    val scrymeColorScheme = darkColorScheme(
        primary = ScrymeColors.Brass,
        background = ScrymeColors.InkBg,
        surface = ScrymeColors.SteelDark,
        onPrimary = ScrymeColors.InkBg,
        onBackground = ScrymeColors.Paper,
        onSurface = ScrymeColors.Paper
    )
    MaterialTheme(
        colorScheme = scrymeColorScheme,
        content = content
    )
}

@Composable
fun AppNavigation(
    viewModel: AuthViewModel,
    sessionManager: SessionManagerImpl
) {
    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
    val loginState by viewModel.loginState.collectAsState()

    if (isAuthenticated) {
        var userEmail = "admin@scryme.tech"
        var userName = "System Administrator"
        var activeOrg = "The Operating Ledger"

        // Safely extract active session details if available in State
        if (loginState is UiState.Success) {
            val data = (loginState as UiState.Success<BetterAuthSessionResponse>).data
            userEmail = data.user.email
            userName = data.user.name
            activeOrg = data.user.activeOrganizationId ?: activeOrg
        }

        AdminDashboard(
            userName = userName,
            userEmail = userEmail,
            activeOrg = activeOrg,
            sessionToken = sessionManager.token.collectAsState().value ?: "",
            onSignOut = { viewModel.logout() }
        )
    } else {
        LoginScreen(viewModel = viewModel)
    }
}

@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    val context = LocalContext.current
    val loginState by viewModel.loginState.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Email, 1 = Terminal PIN

    // Email Input States
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isPasswordVisible by remember { mutableStateOf(false) }

    // Terminal Input States
    var cardId by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }

    // Validation States
    var emailError by remember { mutableStateOf<String?>(null) }
    var passwordError by remember { mutableStateOf<String?>(null) }
    var terminalError by remember { mutableStateOf<String?>(null) }

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
            // App Logo Section
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(ScrymeColors.GreenLogo),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "S",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Serif
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "SCRYME",
                    color = ScrymeColors.Paper,
                    fontSize = 32.sp,
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
                modifier = Modifier.padding(bottom = 32.dp)
            )

            // Auth Selector Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, ScrymeColors.Brass.copy(alpha = 0.3f), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    // Custom tab selector
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(ScrymeColors.InkBg.copy(alpha = 0.6f))
                            .padding(4.dp)
                    ) {
                        Button(
                            onClick = { selectedTab = 0 },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (selectedTab == 0) ScrymeColors.Brass else Color.Transparent,
                                contentColor = if (selectedTab == 0) ScrymeColors.InkBg else ScrymeColors.Paper
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Text("Manager Sign In", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        Button(
                            onClick = { selectedTab = 1 },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (selectedTab == 1) ScrymeColors.Brass else Color.Transparent,
                                contentColor = if (selectedTab == 1) ScrymeColors.InkBg else ScrymeColors.Paper
                            ),
                            shape = RoundedCornerShape(6.dp),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Text("Terminal PIN", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }

                    if (selectedTab == 0) {
                        // Email & Password tab
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
                                    // We pass a fully valid mock oauth/idToken to the ViewModel
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

                    } else {
                        // Terminal PIN Tab
                        OutlinedTextField(
                            value = cardId,
                            onValueChange = {
                                cardId = it
                                terminalError = null
                            },
                            label = { Text("Staff Card ID", color = ScrymeColors.SoftGray) },
                            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = ScrymeColors.Brass) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ScrymeColors.Brass,
                                unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                                focusedLabelColor = ScrymeColors.Brass,
                                cursorColor = ScrymeColors.Brass
                            ),
                            singleLine = true
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = pin,
                            onValueChange = {
                                if (it.length <= 4 && it.all { char -> char.isDigit() }) {
                                    pin = it
                                    terminalError = null
                                }
                            },
                            label = { Text("4-Digit PIN", color = ScrymeColors.SoftGray) },
                            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = ScrymeColors.Brass) },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ScrymeColors.Brass,
                                unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                                focusedLabelColor = ScrymeColors.Brass,
                                cursorColor = ScrymeColors.Brass
                            ),
                            singleLine = true
                        )

                        if (terminalError != null) {
                            Text(
                                text = terminalError!!,
                                color = ScrymeColors.Crimson,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = {
                                if (cardId.isBlank()) {
                                    terminalError = "Staff Card ID is required"
                                } else if (pin.length != 4) {
                                    terminalError = "PIN must be exactly 4 digits"
                                }

                                if (terminalError == null) {
                                    viewModel.loginWithCard(cardId.trim(), pin)
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
                                Text("VALIDATE CARD & ACCESS", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            }
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
}

@Composable
fun AdminDashboard(
    userName: String,
    userEmail: String,
    activeOrg: String,
    sessionToken: String,
    onSignOut: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ScrymeColors.InkBg)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "SCRYME ADMIN",
                        color = ScrymeColors.Brass,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "The Operating Ledger Portal",
                        color = ScrymeColors.SoftGray,
                        fontSize = 12.sp
                    )
                }
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(ScrymeColors.GreenLogo),
                    contentAlignment = Alignment.Center
                ) {
                    Text("S", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
            }

            // Success Welcome Banner
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Welcome back, $userName",
                        color = ScrymeColors.Paper,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    Text(
                        text = userEmail,
                        color = ScrymeColors.SoftGray,
                        fontSize = 13.sp
                    )
                }
            }

            // Session Security Inspector
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(bottom = 12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Home,
                            contentDescription = null,
                            tint = ScrymeColors.Brass,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "ACTIVE TENANT",
                            color = ScrymeColors.Brass,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }
                    Text(
                        text = activeOrg,
                        color = ScrymeColors.Paper,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )

                    HorizontalDivider(color = ScrymeColors.SoftGray.copy(alpha = 0.1f), modifier = Modifier.padding(bottom = 16.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(bottom = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = ScrymeColors.Brass,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SECURE SESSION TOKEN",
                            color = ScrymeColors.Brass,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(ScrymeColors.InkBg)
                            .padding(12.dp)
                    ) {
                        Text(
                            text = if (sessionToken.length > 30) {
                                "${sessionToken.take(15)}...${sessionToken.takeLast(15)}"
                            } else {
                                sessionToken
                            },
                            color = ScrymeColors.Paper,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Sign Out Button
            Button(
                onClick = onSignOut,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Crimson, contentColor = Color.White),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.ExitToApp, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SECURELY CLOSE SESSION", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
            }
        }
    }
}
