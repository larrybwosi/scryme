package tech.scryme.admin.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun DashboardView(
    userName: String,
    userEmail: String,
    activeOrg: String,
    sessionToken: String,
    analyticsViewModel: AnalyticsViewModel,
    presenceViewModel: PresenceViewModel,
    onNavigateToScreen: (DashboardScreen) -> Unit,
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
        verticalArrangement = Arrangement.spacedBy(16.dp)
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

        // Welcome Banner
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Welcome back, $userName",
                    color = ScrymeColors.Paper,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = userEmail,
                    color = ScrymeColors.SoftGray,
                    fontSize = 12.sp
                )
            }
        }

        // Live stats overview card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = ScrymeColors.Brass,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "REAL-TIME METRICS",
                        color = ScrymeColors.Brass,
                        fontSize = 11.sp,
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
                            fontSize = 32.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                        Text(
                            text = "Active Check-Ins Now",
                            color = ScrymeColors.SoftGray,
                            fontSize = 12.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(Color.Green)
                    )
                }
            }
        }

        // GRID OF ADMINISTRATIVE ACTIONS
        Text(
            text = "ADMINISTRATIVE ACTIONS",
            color = ScrymeColors.Brass,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
        )

        ShortcutCard(
            title = "Presence Monitor",
            subtitle = "View and force checkout active staff",
            icon = Icons.Default.Person,
            onClick = { onNavigateToScreen(DashboardScreen.PRESENCE) }
        )

        ShortcutCard(
            title = "Terminal Card Scan",
            subtitle = "Simulate and resolve staff card IDs",
            icon = Icons.Default.Search,
            onClick = { onNavigateToScreen(DashboardScreen.SCAN) }
        )

        ShortcutCard(
            title = "Price & Inventory Approvals",
            subtitle = "Review price changes and stock adjustments",
            icon = Icons.Default.Check,
            onClick = { onNavigateToScreen(DashboardScreen.APPROVALS) }
        )

        ShortcutCard(
            title = "Registered Expenses",
            subtitle = "Disburse auto-approved operational expenses",
            icon = Icons.Default.ShoppingCart,
            onClick = { onNavigateToScreen(DashboardScreen.EXPENSES) }
        )

        ShortcutCard(
            title = "Real-time Analytics",
            subtitle = "Analyze branch utilization and peak hours",
            icon = Icons.Default.Info,
            onClick = { onNavigateToScreen(DashboardScreen.ANALYTICS) }
        )

        ShortcutCard(
            title = "Branch Broadcast",
            subtitle = "Send global or branch-specific announcements",
            icon = Icons.Default.Share,
            onClick = { onNavigateToScreen(DashboardScreen.BROADCAST) }
        )

        ShortcutCard(
            title = "Branch Settings & Management",
            subtitle = "Configure active branches and tenant settings",
            icon = Icons.Default.Settings,
            onClick = { onNavigateToScreen(DashboardScreen.SETTINGS) }
        )

        // Session Security Inspector
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = null,
                        tint = ScrymeColors.Brass,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "ACTIVE TENANT",
                        color = ScrymeColors.Brass,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
                Text(
                    text = activeOrg,
                    color = ScrymeColors.Paper,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                HorizontalDivider(color = ScrymeColors.SoftGray.copy(alpha = 0.1f), modifier = Modifier.padding(bottom = 12.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = ScrymeColors.Brass,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "SECURE SESSION TOKEN",
                        color = ScrymeColors.Brass,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(ScrymeColors.InkBg)
                        .padding(10.dp)
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

        // Sign Out Button
        Button(
            onClick = onSignOut,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp, bottom = 16.dp),
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShortcutCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(ScrymeColors.Brass.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = ScrymeColors.Brass)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, color = ScrymeColors.Paper, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(text = subtitle, color = ScrymeColors.SoftGray, fontSize = 11.sp)
            }
            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(16.dp))
        }
    }
}
