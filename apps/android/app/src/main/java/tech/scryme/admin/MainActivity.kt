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
import androidx.compose.material.icons.automirrored.filled.ExitToApp
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
import tech.scryme.admin.data.model.PresenceStatus
import tech.scryme.admin.data.repository.AuthRepositoryImpl
import tech.scryme.admin.data.session.SessionManagerImpl
import tech.scryme.admin.presentation.viewmodel.AuthViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.data.api.PresenceApiService
import tech.scryme.admin.data.api.ApprovalsApiService
import tech.scryme.admin.data.api.AnalyticsApiService
import tech.scryme.admin.data.api.AnnouncementApiService
import tech.scryme.admin.data.repository.PresenceRepositoryImpl
import tech.scryme.admin.data.repository.ApprovalsRepositoryImpl
import tech.scryme.admin.data.repository.AnalyticsRepositoryImpl
import tech.scryme.admin.data.repository.AnnouncementRepositoryImpl
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel

class MainActivity : ComponentActivity() {

    private lateinit var authViewModel: AuthViewModel
    private lateinit var presenceViewModel: PresenceViewModel
    private lateinit var approvalsViewModel: ApprovalsViewModel
    private lateinit var analyticsViewModel: AnalyticsViewModel
    private lateinit var announcementViewModel: AnnouncementViewModel
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

        val presenceApiService = retrofit.create(PresenceApiService::class.java)
        val presenceRepository = PresenceRepositoryImpl(presenceApiService, sessionManager)
        presenceViewModel = PresenceViewModel(presenceRepository)

        val approvalsApiService = retrofit.create(ApprovalsApiService::class.java)
        val approvalsRepository = ApprovalsRepositoryImpl(approvalsApiService, sessionManager)
        approvalsViewModel = ApprovalsViewModel(approvalsRepository)

        val analyticsApiService = retrofit.create(AnalyticsApiService::class.java)
        val analyticsRepository = AnalyticsRepositoryImpl(analyticsApiService, sessionManager)
        analyticsViewModel = AnalyticsViewModel(analyticsRepository)

        val announcementApiService = retrofit.create(AnnouncementApiService::class.java)
        val announcementRepository = AnnouncementRepositoryImpl(announcementApiService, sessionManager)
        announcementViewModel = AnnouncementViewModel(announcementRepository)

        setContent {
            ScrymeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(red = 0x0B, green = 0x12, blue = 0x20) // Deep Navy Background #0B1220
                ) {
                    AppNavigation(
                        authViewModel = authViewModel,
                        presenceViewModel = presenceViewModel,
                        approvalsViewModel = approvalsViewModel,
                        analyticsViewModel = analyticsViewModel,
                        announcementViewModel = announcementViewModel,
                        sessionManager = sessionManager
                    )
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
    authViewModel: AuthViewModel,
    presenceViewModel: PresenceViewModel,
    approvalsViewModel: ApprovalsViewModel,
    analyticsViewModel: AnalyticsViewModel,
    announcementViewModel: AnnouncementViewModel,
    sessionManager: SessionManagerImpl
) {
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()
    val loginState by authViewModel.loginState.collectAsState()

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
            presenceViewModel = presenceViewModel,
            approvalsViewModel = approvalsViewModel,
            analyticsViewModel = analyticsViewModel,
            announcementViewModel = announcementViewModel,
            onSignOut = { authViewModel.logout() }
        )
    } else {
        LoginScreen(viewModel = authViewModel)
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
    presenceViewModel: PresenceViewModel,
    approvalsViewModel: ApprovalsViewModel,
    analyticsViewModel: AnalyticsViewModel,
    announcementViewModel: AnnouncementViewModel,
    onSignOut: () -> Unit
) {
    var activeTab by remember { mutableIntStateOf(0) } // 0 = Dashboard, 1 = Presence, 2 = Operations

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = ScrymeColors.SteelDark,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ScrymeColors.InkBg,
                        selectedTextColor = ScrymeColors.Brass,
                        indicatorColor = ScrymeColors.Brass,
                        unselectedIconColor = ScrymeColors.SoftGray,
                        unselectedTextColor = ScrymeColors.SoftGray
                    )
                )
                NavigationBarItem(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Presence") },
                    label = { Text("Presence") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ScrymeColors.InkBg,
                        selectedTextColor = ScrymeColors.Brass,
                        indicatorColor = ScrymeColors.Brass,
                        unselectedIconColor = ScrymeColors.SoftGray,
                        unselectedTextColor = ScrymeColors.SoftGray
                    )
                )
                NavigationBarItem(
                    selected = activeTab == 2,
                    onClick = { activeTab = 2 },
                    icon = { Icon(Icons.Default.Check, contentDescription = "Operations") },
                    label = { Text("Operations") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ScrymeColors.InkBg,
                        selectedTextColor = ScrymeColors.Brass,
                        indicatorColor = ScrymeColors.Brass,
                        unselectedIconColor = ScrymeColors.SoftGray,
                        unselectedTextColor = ScrymeColors.SoftGray
                    )
                )
            }
        },
        containerColor = ScrymeColors.InkBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (activeTab) {
                0 -> DashboardView(
                    userName = userName,
                    userEmail = userEmail,
                    activeOrg = activeOrg,
                    sessionToken = sessionToken,
                    analyticsViewModel = analyticsViewModel,
                    presenceViewModel = presenceViewModel,
                    onSignOut = onSignOut
                )
                1 -> PresenceView(
                    presenceViewModel = presenceViewModel
                )
                2 -> OperationsView(
                    approvalsViewModel = approvalsViewModel,
                    announcementViewModel = announcementViewModel
                )
            }
        }
    }
}

@Composable
fun DashboardView(
    userName: String,
    userEmail: String,
    activeOrg: String,
    sessionToken: String,
    analyticsViewModel: AnalyticsViewModel,
    presenceViewModel: PresenceViewModel,
    onSignOut: () -> Unit
) {
    val liveStats by analyticsViewModel.liveStats.collectAsState()
    val activeMembers by presenceViewModel.activeMembers.collectAsState()

    LaunchedEffect(Unit) {
        analyticsViewModel.fetchDashboardAnalytics()
        presenceViewModel.fetchCheckedInMembers()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "SCRYME DASHBOARD",
                    color = ScrymeColors.Brass,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Real-time Administrative Control",
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

        // Live stats overview card
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
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = ScrymeColors.Brass,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "REAL-TIME METRICS",
                        color = ScrymeColors.Brass,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                val totalCheckedIn = liveStats?.totalCheckedInNow ?: activeMembers.size
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "$totalCheckedIn",
                            color = ScrymeColors.Paper,
                            fontSize = 36.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            text = "Active Check-Ins Now",
                            color = ScrymeColors.SoftGray,
                            fontSize = 13.sp
                        )
                    }

                    // Pulse green circle
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(Color.Green)
                    )
                }
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

        // Branch Breakdown
        val stats = liveStats
        if (stats != null && stats.branchStats.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "BRANCH STATUS",
                        color = ScrymeColors.Brass,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    stats.branchStats.forEach { branch ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = branch.locationName, color = ScrymeColors.Paper, fontSize = 14.sp)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "${branch.activePresenceCount} active",
                                    color = ScrymeColors.Brass,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "(${branch.averageDurationMinutes.toInt()}m avg)",
                                    color = ScrymeColors.SoftGray,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Sign Out Button
        Button(
            onClick = onSignOut,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp, bottom = 16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Crimson, contentColor = Color.White),
            shape = RoundedCornerShape(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("SECURELY CLOSE SESSION", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }
        }
    }
}

@Composable
fun PresenceView(
    presenceViewModel: PresenceViewModel
) {
    val context = LocalContext.current
    val activeMembers by presenceViewModel.activeMembers.collectAsState()
    val presenceState by presenceViewModel.presenceState.collectAsState()
    val selectedLocationId by presenceViewModel.selectedLocationId.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var showBranchDropdown by remember { mutableStateOf(false) }

    LaunchedEffect(searchQuery, selectedLocationId) {
        presenceViewModel.fetchCheckedInMembers(search = searchQuery.ifBlank { null })
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Title block
        Column {
            Text(
                text = "PRESENCE MONITOR",
                color = ScrymeColors.Brass,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Text(
                text = "Real-time Checked-in Staff & Active Members",
                color = ScrymeColors.SoftGray,
                fontSize = 12.sp
            )
        }

        // Search Bar & Filter Action Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search staff name / Card ID", color = ScrymeColors.SoftGray, fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = ScrymeColors.Brass) },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ScrymeColors.Brass,
                    unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                    cursorColor = ScrymeColors.Brass
                )
            )

            // Branch filter Button
            Box {
                Button(
                    onClick = { showBranchDropdown = !showBranchDropdown },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (selectedLocationId != null) ScrymeColors.Brass else ScrymeColors.SteelDark
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = "Filter",
                        tint = if (selectedLocationId != null) ScrymeColors.InkBg else ScrymeColors.Brass,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (selectedLocationId != null) "Filtered" else "Branch",
                        color = if (selectedLocationId != null) ScrymeColors.InkBg else ScrymeColors.Paper,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                DropdownMenu(
                    expanded = showBranchDropdown,
                    onDismissRequest = { showBranchDropdown = false },
                    modifier = Modifier.background(ScrymeColors.SteelDark)
                ) {
                    DropdownMenuItem(
                        text = { Text("All Branches", color = ScrymeColors.Paper) },
                        onClick = {
                            presenceViewModel.filterByBranch(null)
                            showBranchDropdown = false
                        }
                    )
                    listOf(
                        "loc_1" to "North Branch",
                        "loc_2" to "Downtown Bakery",
                        "loc_3" to "Express Counter"
                    ).forEach { (locId, locName) ->
                        DropdownMenuItem(
                            text = { Text(locName, color = ScrymeColors.Paper) },
                            onClick = {
                                presenceViewModel.filterByBranch(locId)
                                showBranchDropdown = false
                            }
                        )
                    }
                }
            }
        }

        // Active Members list title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "ACTIVE STAFF MEMBERS",
                color = ScrymeColors.Brass,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(ScrymeColors.Brass.copy(alpha = 0.15f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "REALTIME",
                    color = ScrymeColors.Brass,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        // Members List Container
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            val membersList = when (val state = presenceState) {
                is UiState.Success -> state.data
                else -> activeMembers
            }

            if (membersList.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No active staff found",
                        color = ScrymeColors.SoftGray,
                        fontSize = 14.sp
                    )
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    membersList.forEach { member ->
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
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    // S Logo or initial circle
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(ScrymeColors.Brass.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = member.user.name.take(1).uppercase(),
                                            color = ScrymeColors.Brass,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column {
                                        Text(
                                            text = member.user.name,
                                            color = ScrymeColors.Paper,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                        Text(
                                            text = "${member.role} • ${member.user.email}",
                                            color = ScrymeColors.SoftGray,
                                            fontSize = 12.sp
                                        )
                                    }
                                }

                                // Status indicator & Checkout action
                                Column(horizontalAlignment = Alignment.End) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(bottom = 6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(if (member.status == PresenceStatus.ONLINE) Color.Green else Color.Gray)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = member.status.name,
                                            color = if (member.status == PresenceStatus.ONLINE) Color.Green else ScrymeColors.SoftGray,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    if (member.status == PresenceStatus.ONLINE) {
                                        OutlinedButton(
                                            onClick = {
                                                presenceViewModel.forceCheckoutMember(member.id)
                                                Toast.makeText(context, "Force check-out sent for ${member.user.name}", Toast.LENGTH_SHORT).show()
                                            },
                                            border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.5f)),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Text("CHECK-OUT", color = ScrymeColors.Crimson, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OperationsView(
    approvalsViewModel: ApprovalsViewModel,
    announcementViewModel: AnnouncementViewModel
) {
    val context = LocalContext.current
    val priceChanges by approvalsViewModel.priceChanges.collectAsState()
    val actionState by approvalsViewModel.actionState.collectAsState()
    val broadcastState by announcementViewModel.broadcastState.collectAsState()

    var broadcastTitle by remember { mutableStateOf("") }
    var broadcastMsg by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        approvalsViewModel.loadPriceChangeRequests()
    }

    LaunchedEffect(actionState) {
        if (actionState is UiState.Success) {
            Toast.makeText(context, "Price change request successfully reviewed!", Toast.LENGTH_SHORT).show()
        } else if (actionState is UiState.Error) {
            Toast.makeText(context, (actionState as UiState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    LaunchedEffect(broadcastState) {
        if (broadcastState is UiState.Success) {
            Toast.makeText(context, "Announcement broadcast successfully!", Toast.LENGTH_SHORT).show()
            broadcastTitle = ""
            broadcastMsg = ""
            announcementViewModel.resetBroadcastState()
        } else if (broadcastState is UiState.Error) {
            Toast.makeText(context, (broadcastState as UiState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Title Block
        Column {
            Text(
                text = "LEDGER OPERATIONS",
                color = ScrymeColors.Brass,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Text(
                text = "Pending Price approvals & Branch Broadcasts",
                color = ScrymeColors.SoftGray,
                fontSize = 12.sp
            )
        }

        // 1. Price Change Approvals Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "PRICE CHANGE APPROVALS",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                val requestsList = (priceChanges as? UiState.Success)?.data ?: emptyList()

                if (requestsList.isEmpty()) {
                    Text(
                        text = "No pending price change requests",
                        color = ScrymeColors.SoftGray,
                        fontSize = 13.sp
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        requestsList.forEach { req ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(ScrymeColors.InkBg)
                                    .padding(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Variant: ${req.variantId.take(8)}...",
                                        color = ScrymeColors.Paper,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp
                                    )
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(ScrymeColors.Brass.copy(alpha = 0.15f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = req.status,
                                            color = ScrymeColors.Brass,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "$${req.oldPrice} -> $${req.newPrice}",
                                        color = ScrymeColors.Paper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                    Text(
                                        text = "By: ${req.requestedBy.take(8)}...",
                                        color = ScrymeColors.SoftGray,
                                        fontSize = 11.sp
                                    )
                                }

                                if (req.status == "PENDING") {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = { approvalsViewModel.reviewPriceChange(req.id, approve = true) },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(vertical = 4.dp)
                                        ) {
                                            Text("Approve", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }

                                        OutlinedButton(
                                            onClick = { approvalsViewModel.reviewPriceChange(req.id, approve = false, "Rejected by Admin") },
                                            modifier = Modifier.weight(1f),
                                            border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.5f)),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(vertical = 4.dp)
                                        ) {
                                            Text("Reject", color = ScrymeColors.Crimson, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Broadcast Announcements Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "BROADCAST TO BRANCHES",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                OutlinedTextField(
                    value = broadcastTitle,
                    onValueChange = { broadcastTitle = it },
                    label = { Text("Announcement Title", color = ScrymeColors.SoftGray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                        cursorColor = ScrymeColors.Brass
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = broadcastMsg,
                    onValueChange = { broadcastMsg = it },
                    label = { Text("Broadcast Message", color = ScrymeColors.SoftGray) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                        cursorColor = ScrymeColors.Brass
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (broadcastTitle.isNotBlank() && broadcastMsg.isNotBlank()) {
                            announcementViewModel.broadcast(broadcastTitle, broadcastMsg)
                        } else {
                            Toast.makeText(context, "Title and Message are required", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                    shape = RoundedCornerShape(6.dp),
                    enabled = broadcastState !is UiState.Loading
                ) {
                    if (broadcastState is UiState.Loading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = ScrymeColors.InkBg)
                    } else {
                        Text("SEND BROADCAST", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }
        }
    }
}