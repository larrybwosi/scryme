package tech.scryme.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import tech.scryme.admin.data.api.AuthApiService
import tech.scryme.admin.data.api.AuthInterceptor
import tech.scryme.admin.data.api.MultiTenancyInterceptor
import tech.scryme.admin.data.api.DynamicBaseUrlInterceptor
import tech.scryme.admin.data.model.BetterAuthSessionResponse
import tech.scryme.admin.data.repository.AuthRepositoryImpl
import tech.scryme.admin.data.session.SessionManagerImpl
import tech.scryme.admin.presentation.viewmodel.AuthViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.data.api.PresenceApiService
import tech.scryme.admin.data.api.ApprovalsApiService
import tech.scryme.admin.data.api.AnalyticsApiService
import tech.scryme.admin.data.api.AnnouncementApiService
import tech.scryme.admin.data.api.ExpenseApiService
import tech.scryme.admin.data.repository.PresenceRepositoryImpl
import tech.scryme.admin.data.repository.ApprovalsRepositoryImpl
import tech.scryme.admin.data.repository.AnalyticsRepositoryImpl
import tech.scryme.admin.data.repository.AnnouncementRepositoryImpl
import tech.scryme.admin.data.repository.ExpenseRepositoryImpl
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.ScanViewModel
import tech.scryme.admin.presentation.viewmodel.ExpenseViewModel
import tech.scryme.admin.presentation.theme.ScrymeTheme
import tech.scryme.admin.presentation.components.LoginScreen
import tech.scryme.admin.presentation.components.AdminDashboard

class MainActivity : ComponentActivity() {

    private lateinit var authViewModel: AuthViewModel
    private lateinit var presenceViewModel: PresenceViewModel
    private lateinit var approvalsViewModel: ApprovalsViewModel
    private lateinit var analyticsViewModel: AnalyticsViewModel
    private lateinit var announcementViewModel: AnnouncementViewModel
    private lateinit var scanViewModel: ScanViewModel
    private lateinit var expenseViewModel: ExpenseViewModel
    private lateinit var sessionManager: SessionManagerImpl

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Secure Session & API Layer
        sessionManager = SessionManagerImpl(applicationContext)

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(DynamicBaseUrlInterceptor(sessionManager))
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

        scanViewModel = ScanViewModel(presenceRepository)

        val expenseApiService = retrofit.create(ExpenseApiService::class.java)
        val expenseRepository = ExpenseRepositoryImpl(expenseApiService)
        expenseViewModel = ExpenseViewModel(expenseRepository)

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
                        scanViewModel = scanViewModel,
                        expenseViewModel = expenseViewModel,
                        sessionManager = sessionManager
                    )
                }
            }
        }
    }
}

@Composable
fun AppNavigation(
    authViewModel: AuthViewModel,
    presenceViewModel: PresenceViewModel,
    approvalsViewModel: ApprovalsViewModel,
    analyticsViewModel: AnalyticsViewModel,
    announcementViewModel: AnnouncementViewModel,
    scanViewModel: ScanViewModel,
    expenseViewModel: ExpenseViewModel,
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
            scanViewModel = scanViewModel,
            expenseViewModel = expenseViewModel,
            onSignOut = { authViewModel.logout() }
        )
    } else {
        LoginScreen(viewModel = authViewModel)
    }
}
