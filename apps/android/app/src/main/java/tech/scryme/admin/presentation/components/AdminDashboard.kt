package tech.scryme.admin.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.ScanViewModel
import tech.scryme.admin.presentation.viewmodel.ExpenseViewModel
import tech.scryme.admin.domain.session.SessionManager
import tech.scryme.admin.presentation.theme.ScrymeColors

enum class DashboardScreen {
    HOME,
    PRESENCE,
    SCAN,
    APPROVALS,
    EXPENSES,
    ANALYTICS,
    BROADCAST,
    SETTINGS,
    BRANCH_DETAIL
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
    scanViewModel: ScanViewModel,
    expenseViewModel: ExpenseViewModel,
    sessionManager: SessionManager,
    onSignOut: () -> Unit
) {
    var currentScreen by remember { mutableStateOf(DashboardScreen.HOME) }

    Scaffold(
        containerColor = ScrymeColors.InkBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentScreen) {
                DashboardScreen.HOME -> DashboardView(
                    userName = userName,
                    userEmail = userEmail,
                    activeOrg = activeOrg,
                    sessionToken = sessionToken,
                    analyticsViewModel = analyticsViewModel,
                    presenceViewModel = presenceViewModel,
                    onNavigateToScreen = { currentScreen = it },
                    onSignOut = onSignOut
                )
                DashboardScreen.EXPENSES -> ExpensesView(
                    expenseViewModel = expenseViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.PRESENCE -> PresenceView(
                    presenceViewModel = presenceViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.SCAN -> ScanView(
                    scanViewModel = scanViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.APPROVALS -> ApprovalsView(
                    approvalsViewModel = approvalsViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.ANALYTICS -> AnalyticsView(
                    analyticsViewModel = analyticsViewModel,
                    presenceViewModel = presenceViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.BROADCAST -> BroadcastView(
                    announcementViewModel = announcementViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.SETTINGS -> SettingsView(
                    presenceViewModel = presenceViewModel,
                    sessionManager = sessionManager,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
                DashboardScreen.BRANCH_DETAIL -> BranchDetailView(
                    presenceViewModel = presenceViewModel,
                    onBackToHome = { currentScreen = DashboardScreen.HOME }
                )
            }
        }
    }
}
