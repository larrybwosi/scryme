package tech.scryme.admin.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.ExpenseViewModel
import tech.scryme.admin.domain.session.SessionManager
import tech.scryme.admin.presentation.theme.ScrymeColors

enum class DashboardScreen {
    HOME,
    PRESENCE,
    APPROVALS,
    EXPENSES,
    ANALYTICS,
    BROADCAST,
    SETTINGS,
    BRANCH_DETAIL
}

@Suppress("UNUSED_PARAMETER")
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
    expenseViewModel: ExpenseViewModel,
    sessionManager: SessionManager,
    onSignOut: () -> Unit
) {
    var currentScreen by remember { mutableStateOf(DashboardScreen.HOME) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = MaterialTheme.colorScheme.background,
                drawerContentColor = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.width(320.dp)
            ) {
                // Sidebar Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(
                                    MaterialTheme.colorScheme.surface,
                                    MaterialTheme.colorScheme.background
                                )
                            )
                        )
                        .padding(horizontal = 24.dp, vertical = 28.dp)
                ) {
                    Column {
                        Text(
                            text = "SCRYME ADMIN",
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            letterSpacing = 2.sp
                        )
                        Spacer(modifier = Modifier.height(18.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                                    .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = userName.take(1).uppercase(),
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = userName,
                                    color = ScrymeColors.Paper,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = userEmail,
                                    color = ScrymeColors.SoftGray.copy(alpha = 0.7f),
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(color = ScrymeColors.Paper.copy(alpha = 0.06f))

                Spacer(modifier = Modifier.height(12.dp))

                // Navigation Items
                val menuItems = listOf(
                    Triple(DashboardScreen.HOME, "Dashboard", Icons.Default.Home),
                    Triple(DashboardScreen.PRESENCE, "Presence Monitor", Icons.Default.Person),
                    Triple(DashboardScreen.APPROVALS, "Approvals", Icons.Default.CheckCircle),
                    Triple(DashboardScreen.EXPENSES, "Expenses", Icons.Default.ShoppingCart),
                    Triple(DashboardScreen.ANALYTICS, "Analytics", Icons.Default.Insights),
                    Triple(DashboardScreen.BRANCH_DETAIL, "Branch Inspector", Icons.Default.Storefront),
                    Triple(DashboardScreen.BROADCAST, "Broadcast", Icons.Default.Campaign),
                    Triple(DashboardScreen.SETTINGS, "Settings & Management", Icons.Default.Settings)
                )

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    menuItems.forEach { (screen, label, icon) ->
                        val isSelected = currentScreen == screen
                        NavigationDrawerItem(
                            label = {
                                Text(
                                    text = label,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 13.5.sp
                                )
                            },
                            selected = isSelected,
                            onClick = {
                                currentScreen = screen
                                scope.launch { drawerState.close() }
                            },
                            icon = {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                            },
                            colors = NavigationDrawerItemDefaults.colors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                unselectedContainerColor = Color.Transparent,
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedTextColor = ScrymeColors.Paper
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 2.dp)
                        )
                    }
                }

                // Sign Out at the bottom
                HorizontalDivider(color = ScrymeColors.Paper.copy(alpha = 0.06f))
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = {
                        scope.launch { drawerState.close() }
                        onSignOut()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .height(48.dp),
                    border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.35f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = ScrymeColors.Crimson.copy(alpha = 0.08f),
                        contentColor = ScrymeColors.Crimson
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Sign Out Session", fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
                    }
                }
            }
        }
    ) {
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background
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
                        analyticsViewModel = analyticsViewModel,
                        presenceViewModel = presenceViewModel,
                        onOpenDrawer = { scope.launch { drawerState.open() } },
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
}
