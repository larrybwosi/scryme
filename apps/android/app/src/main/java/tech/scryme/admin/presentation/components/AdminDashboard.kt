package tech.scryme.admin.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.theme.ScrymeColors

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
