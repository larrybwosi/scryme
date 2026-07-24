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

enum class DashboardScreen {
    Home,
    Presence,
    Scan,
    Approvals,
    Analytics,
    Broadcast,
    Settings
}

@Composable
fun ShortcutCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(110.dp)
            .border(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        onClick = onClick,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = ScrymeColors.Brass,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = title,
                    color = ScrymeColors.Paper,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    maxLines = 1
                )
            }
            Text(
                text = description,
                color = ScrymeColors.SoftGray,
                fontSize = 10.sp,
                lineHeight = 13.sp,
                maxLines = 3
            )
        }
    }
}

@Composable
fun SubScreenHeader(
    title: String,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 16.dp, bottom = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onBack,
            modifier = Modifier.size(40.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "Back",
                tint = ScrymeColors.Brass
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            color = ScrymeColors.Paper,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
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
    var currentScreen by remember { mutableStateOf(DashboardScreen.Home) }
    val context = LocalContext.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ScrymeColors.InkBg)
            .padding(horizontal = 24.dp)
    ) {
        when (currentScreen) {
            DashboardScreen.Home -> {
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
                            .padding(top = 32.dp, bottom = 8.dp),
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

                    // Success Dynamic Welcome Banner
                    val greetingText = remember {
                        val calendar = java.util.Calendar.getInstance()
                        when (calendar.get(java.util.Calendar.HOUR_OF_DAY)) {
                            in 0..11 -> "Good Morning"
                            in 12..16 -> "Good Afternoon"
                            else -> "Good Evening"
                        }
                    }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "$greetingText, $userName",
                                color = ScrymeColors.Paper,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                            Text(
                                text = "You are currently signed in as $userEmail",
                                color = ScrymeColors.SoftGray,
                                fontSize = 13.sp
                            )
                        }
                    }

                    // Shortcuts Section Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        Text(
                            text = "QUICK SHORTCUTS",
                            color = ScrymeColors.Brass,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }

                    // Shortcuts Grid (Row-Column layout)
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ShortcutCard(
                                title = "Presence & Attendance",
                                description = "Manage active staff check-ins and check-outs",
                                icon = Icons.Default.AccountBox,
                                onClick = { currentScreen = DashboardScreen.Presence },
                                modifier = Modifier.weight(1f)
                            )
                            ShortcutCard(
                                title = "Secure Card Scan",
                                description = "Validate and scan secure staff cards",
                                icon = Icons.Default.Refresh,
                                onClick = { currentScreen = DashboardScreen.Scan },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ShortcutCard(
                                title = "Ledger Approvals",
                                description = "Approve price and inventory adjustments",
                                icon = Icons.Default.List,
                                onClick = { currentScreen = DashboardScreen.Approvals },
                                modifier = Modifier.weight(1f)
                            )
                            ShortcutCard(
                                title = "Real-time Analytics",
                                description = "View store traffic, peak hours, and sales metrics",
                                icon = Icons.Default.Star,
                                onClick = { currentScreen = DashboardScreen.Analytics },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ShortcutCard(
                                title = "Broadcast Alert",
                                description = "Send announcements to branch nodes",
                                icon = Icons.Default.Warning,
                                onClick = { currentScreen = DashboardScreen.Broadcast },
                                modifier = Modifier.weight(1f)
                            )
                            ShortcutCard(
                                title = "Security & Session",
                                description = "Inspect session token and tenant settings",
                                icon = Icons.Default.Settings,
                                onClick = { currentScreen = DashboardScreen.Settings },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Sign Out Button
                    Button(
                        onClick = onSignOut,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp),
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

            DashboardScreen.Presence -> {
                var searchPattern by remember { mutableStateOf("") }
                val mockMembers = remember {
                    listOf(
                        "Alice Johnson" to "Active (Check-in: 08:32 AM)",
                        "Bob Smith" to "Active (Check-in: 09:15 AM)",
                        "Charlie Davis" to "Offline",
                        "David Miller" to "Active (Check-in: 07:45 AM)",
                        "Emily Wilson" to "Offline"
                    )
                }
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SubScreenHeader(title = "Presence & Attendance") {
                        currentScreen = DashboardScreen.Home
                    }

                    // Search input
                    OutlinedTextField(
                        value = searchPattern,
                        onValueChange = { searchPattern = it },
                        label = { Text("Search Team Members", color = ScrymeColors.SoftGray) },
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

                    mockMembers.filter { it.first.contains(searchPattern, ignoreCase = true) }.forEach { member ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = member.first,
                                        color = ScrymeColors.Paper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                    Text(
                                        text = member.second,
                                        color = if (member.second.startsWith("Active")) ScrymeColors.GreenLogo else ScrymeColors.SoftGray,
                                        fontSize = 12.sp
                                    )
                                }
                                if (member.second.startsWith("Active")) {
                                    Button(
                                        onClick = {
                                            Toast.makeText(context, "Forcefully checked out ${member.first}", Toast.LENGTH_SHORT).show()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Crimson),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text("Checkout", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            DashboardScreen.Scan -> {
                var isScanning by remember { mutableStateOf(false) }
                var scanResult by remember { mutableStateOf<String?>(null) }
                val scope = rememberCoroutineScope()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    SubScreenHeader(title = "Secure Card Scan") {
                        currentScreen = DashboardScreen.Home
                    }

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp),
                        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(120.dp)
                                    .clip(CircleShape)
                                    .background(ScrymeColors.InkBg)
                                    .border(2.dp, ScrymeColors.Brass, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "Scan Icon",
                                    tint = ScrymeColors.Brass,
                                    modifier = Modifier.size(48.dp)
                                )
                            }

                            Text(
                                text = if (isScanning) "Reading Card... Hold Steady" else "Ready to Scan Secure NFC Card",
                                color = ScrymeColors.Paper,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                textAlign = TextAlign.Center
                            )

                            Text(
                                text = "Place a staff ID card near the back of this terminal device to securely validate attendance or credentials.",
                                color = ScrymeColors.SoftGray,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )

                            if (isScanning) {
                                LinearProgressIndicator(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = ScrymeColors.Brass,
                                    trackColor = ScrymeColors.InkBg
                                )
                            }
                        }
                    }

                    if (scanResult != null) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = ScrymeColors.GreenLogo.copy(alpha = 0.15f)),
                            border = BorderStroke(1.dp, ScrymeColors.GreenLogo)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "SCAN SUCCESSFUL",
                                    color = ScrymeColors.GreenLogo,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    letterSpacing = 1.sp
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = scanResult!!,
                                    color = ScrymeColors.Paper,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }

                    Button(
                        onClick = {
                            isScanning = true
                            scanResult = null
                            scope.launch {
                                kotlinx.coroutines.delay(2000)
                                isScanning = false
                                scanResult = "Member Verified: Johnathan Doe (ID: SCR-8930). Registered Check-in success."
                                Toast.makeText(context, "Card Verification Successful!", Toast.LENGTH_SHORT).show()
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !isScanning
                    ) {
                        Text("SIMULATE NFC SCAN", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }

            DashboardScreen.Approvals -> {
                val mockRequests = remember {
                    mutableStateListOf(
                        Triple("Organic Whole Milk 1L", "Price Adjustment: $2.50 -> $2.80", "Requested by Mary Smith (Manager)"),
                        Triple("Wheat Bakery Loaf 400g", "Price Adjustment: $1.80 -> $1.60", "Requested by Alice Johnson (Staff)"),
                        Triple("Ground Espresso Coffee 250g", "Stock Override: +50 units", "Requested by Charlie Davis (Admin)")
                    )
                }
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SubScreenHeader(title = "Ledger Approvals") {
                        currentScreen = DashboardScreen.Home
                    }

                    if (mockRequests.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No pending approval requests.",
                                color = ScrymeColors.SoftGray,
                                fontSize = 14.sp
                            )
                        }
                    } else {
                        mockRequests.forEach { req ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                                border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f))
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = req.first,
                                        color = ScrymeColors.Paper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Text(
                                        text = req.second,
                                        color = ScrymeColors.Brass,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )
                                    Text(
                                        text = req.third,
                                        color = ScrymeColors.SoftGray,
                                        fontSize = 12.sp
                                    )

                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(top = 12.dp),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Button(
                                            onClick = {
                                                mockRequests.remove(req)
                                                Toast.makeText(context, "Request Approved", Toast.LENGTH_SHORT).show()
                                            },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.GreenLogo),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text("Approve", color = Color.White, fontWeight = FontWeight.Bold)
                                        }
                                        OutlinedButton(
                                            onClick = {
                                                mockRequests.remove(req)
                                                Toast.makeText(context, "Request Rejected", Toast.LENGTH_SHORT).show()
                                            },
                                            modifier = Modifier.weight(1f),
                                            border = BorderStroke(1.dp, ScrymeColors.Crimson),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = ScrymeColors.Crimson),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text("Reject")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            DashboardScreen.Analytics -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    SubScreenHeader(title = "Ledger Analytics") {
                        currentScreen = DashboardScreen.Home
                    }

                    // KPI cards
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("TODAY SALES", color = ScrymeColors.SoftGray, fontSize = 10.sp)
                                Text("$14,250", color = ScrymeColors.Brass, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("ACTIVE STAFF", color = ScrymeColors.SoftGray, fontSize = 10.sp)
                                Text("12 Online", color = ScrymeColors.GreenLogo, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Simulated Peak Hours Chart
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text(
                                text = "STORE TRAFFIC BY HOUR",
                                color = ScrymeColors.Brass,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp,
                                modifier = Modifier.padding(bottom = 16.dp)
                            )

                            // 5 hour columns
                            val traffic = listOf(35, 65, 95, 45, 80)
                            val labels = listOf("08:00", "10:00", "12:00", "14:00", "16:00")

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(140.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                traffic.forEachIndexed { idx, value ->
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight(value / 100f)
                                                .width(18.dp)
                                                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                                .background(ScrymeColors.Brass)
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = labels[idx],
                                            color = ScrymeColors.SoftGray,
                                            fontSize = 9.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            DashboardScreen.Broadcast -> {
                var title by remember { mutableStateOf("") }
                var message by remember { mutableStateOf("") }
                var severity by remember { mutableStateOf("INFO") }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SubScreenHeader(title = "Broadcast Alert") {
                        currentScreen = DashboardScreen.Home
                    }

                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Announcement Title", color = ScrymeColors.SoftGray) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass
                        ),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        label = { Text("Message Body", color = ScrymeColors.SoftGray) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass
                        )
                    )

                    // Severity Picker
                    Text(
                        text = "Severity Level",
                        color = ScrymeColors.Brass,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("INFO", "WARNING", "SEVERE").forEach { level ->
                            val isSelected = severity == level
                            Button(
                                onClick = { severity = level },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSelected) ScrymeColors.Brass else ScrymeColors.SteelDark,
                                    contentColor = if (isSelected) ScrymeColors.InkBg else ScrymeColors.Paper
                                ),
                                shape = RoundedCornerShape(4.dp),
                                contentPadding = PaddingValues(vertical = 8.dp)
                            ) {
                                Text(level, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Button(
                        onClick = {
                            if (title.isBlank() || message.isBlank()) {
                                Toast.makeText(context, "Please enter both Title and Message", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Successfully broadcasted '$title' to branch nodes", Toast.LENGTH_SHORT).show()
                                title = ""
                                message = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("BROADCAST ALERT NOW", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                    }
                }
            }

            DashboardScreen.Settings -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SubScreenHeader(title = "Security & Settings") {
                        currentScreen = DashboardScreen.Home
                    }

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
                }
            }
        }
    }
}
