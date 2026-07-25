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
import androidx.compose.material.icons.automirrored.filled.ArrowForward
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
            .background(ScrymeColors.InkBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 20.dp, bottom = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Header — quieter kicker + title, monogram simplified
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "SCRYME",
                    color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 2.dp)
                )
                Text(
                    text = "Dashboard",
                    color = ScrymeColors.Paper,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(ScrymeColors.SteelDark)
                    .border(1.dp, ScrymeColors.Brass.copy(alpha = 0.3f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text("S", color = ScrymeColors.Brass, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }

        // Welcome banner — flatter, quieter border
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "Welcome back, $userName",
                    color = ScrymeColors.Paper,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
                Text(
                    text = userEmail,
                    color = ScrymeColors.SoftGray.copy(alpha = 0.65f),
                    fontSize = 12.sp
                )
            }
        }

        // Live stats overview card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                SectionLabel(icon = Icons.Default.Info, text = "REAL-TIME METRICS")

                Spacer(modifier = Modifier.height(10.dp))

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
                            fontSize = 30.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Active check-ins now",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.65f),
                            fontSize = 12.sp
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(ScrymeColors.GreenLogo)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "LIVE",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.sp
                        )
                    }
                }
            }
        }

        // Administrative actions
        Text(
            text = "ADMINISTRATIVE ACTIONS",
            color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.5.sp,
            modifier = Modifier.padding(top = 10.dp, bottom = 2.dp)
        )

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
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
        }

        // Session security inspector
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                SectionLabel(icon = Icons.Default.Home, text = "ACTIVE TENANT")
                Text(
                    text = activeOrg,
                    color = ScrymeColors.Paper,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(top = 6.dp, bottom = 14.dp)
                )

                HorizontalDivider(color = ScrymeColors.SoftGray.copy(alpha = 0.08f), modifier = Modifier.padding(bottom = 14.dp))

                SectionLabel(icon = Icons.Default.Lock, text = "SECURE SESSION TOKEN")

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(ScrymeColors.InkBg)
                        .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(
                        text = if (sessionToken.length > 30) {
                            "${sessionToken.take(15)}...${sessionToken.takeLast(15)}"
                        } else {
                            sessionToken
                        },
                        color = ScrymeColors.SoftGray.copy(alpha = 0.9f),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Sign out button — quieter destructive treatment
        Button(
            onClick = onSignOut,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp, bottom = 12.dp)
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = ScrymeColors.Crimson.copy(alpha = 0.12f),
                contentColor = ScrymeColors.Crimson
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Securely close session", fontWeight = FontWeight.SemiBold, fontSize = 13.5.sp, letterSpacing = 0.3.sp)
            }
        }
    }
}

@Composable
private fun SectionLabel(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = ScrymeColors.Brass,
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            color = ScrymeColors.Brass,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.2.sp
        )
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
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(ScrymeColors.Brass.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(18.dp))
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, color = ScrymeColors.Paper, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(
                    text = subtitle,
                    color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                    fontSize = 11.5.sp,
                    modifier = Modifier.padding(top = 1.dp)
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = ScrymeColors.SoftGray.copy(alpha = 0.4f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
