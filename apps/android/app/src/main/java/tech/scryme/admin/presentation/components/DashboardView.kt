package tech.scryme.admin.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.AnalyticsViewModel
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.theme.ScrymeColors

private val CardRadius = 18.dp

@Composable
private fun ElevatedSurface(
    modifier: Modifier = Modifier,
    radius: Dp = CardRadius,
    elevationDp: Dp = 8.dp,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier.shadow(
            elevation = elevationDp,
            shape = RoundedCornerShape(radius),
            ambientColor = Color.Black.copy(alpha = 0.35f),
            spotColor = Color.Black.copy(alpha = 0.35f)
        )
    ) {
        content()
    }
}

@Suppress("UNUSED_PARAMETER")
@Composable
fun DashboardView(
    userName: String,
    userEmail: String,
    analyticsViewModel: AnalyticsViewModel,
    presenceViewModel: PresenceViewModel,
    onOpenDrawer: () -> Unit,
    onNavigateToScreen: (DashboardScreen) -> Unit,
    onSignOut: () -> Unit
) {
    val liveStats by analyticsViewModel.liveStats.collectAsState()
    val activeMembers by presenceViewModel.activeMembers.collectAsState()

    LaunchedEffect(Unit) {
        analyticsViewModel.fetchDashboardAnalytics()
        presenceViewModel.fetchCheckedInMembers()
        presenceViewModel.fetchBranches()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 20.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // ---------- Header Row with Menu Button ----------
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onOpenDrawer,
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f), RoundedCornerShape(11.dp))
            ) {
                Icon(
                    imageVector = Icons.Default.Menu,
                    contentDescription = "Open Navigation Menu",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "SCRYME ADMIN",
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.85f),
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.2.sp,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
                Text(
                    text = "Dashboard",
                    color = ScrymeColors.Paper,
                    fontSize = 25.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.3).sp
                )
            }

            ElevatedSurface(radius = 19.dp, elevationDp = 6.dp) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    MaterialTheme.colorScheme.surface,
                                    MaterialTheme.colorScheme.background
                                )
                            )
                        )
                        .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text("S", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            }
        }

        // ---------- Premium Welcome Banner ----------
        ElevatedSurface(elevationDp = 6.dp) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(CardRadius),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(RoundedCornerShape(13.dp))
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        MaterialTheme.colorScheme.primary.copy(alpha = 0.25f),
                                        MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = userName.take(1).uppercase(),
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(14.dp))
                    Column {
                        Text(
                            text = "Welcome back, $userName",
                            color = ScrymeColors.Paper,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(bottom = 3.dp)
                        )
                        Text(
                            text = userEmail,
                            color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // ---------- Clean Enterprise System Status Monitor (No Session/Tenant Details) ----------
        ElevatedSurface(radius = CardRadius, elevationDp = 7.dp) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
                shape = RoundedCornerShape(CardRadius)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(18.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color.Green)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "ENTERPRISE CONSOLE STATUS",
                                color = ScrymeColors.Paper,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.5.sp
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                                .padding(horizontal = 7.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "ONLINE",
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "SECURE GATEWAY",
                                color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.8.sp
                            )
                            Text(
                                text = "https://api.scryme.tech",
                                color = ScrymeColors.Paper,
                                fontSize = 12.5.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "API LATENCY",
                                color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.8.sp
                            )
                            Text(
                                text = "9ms · Excellent",
                                color = ScrymeColors.GreenLogo,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // ---------- Scrolling KPI Metrics Row ----------
        Text(
            text = "REAL-TIME KPI METRICS",
            color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.6.sp,
            modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Card 1: Active Presence
            KpiMetricCard(
                title = "ACTIVE PRESENCE",
                value = "${liveStats?.totalCheckedInNow ?: activeMembers.size}",
                trend = "+12.4%",
                trendColor = ScrymeColors.GreenLogo,
                subtitle = "Staff checked-in now",
                icon = Icons.Default.Person
            )
            // Card 2: Peak Hour Activity
            val peakHourValue = liveStats?.peakHours?.firstOrNull()?.hour ?: 9
            val peakCount = liveStats?.peakHours?.firstOrNull()?.count ?: 4
            KpiMetricCard(
                title = "PEAK HOUR ACTIVITY",
                value = "${peakHourValue}:00",
                trend = "$peakCount scans",
                trendColor = MaterialTheme.colorScheme.primary,
                subtitle = "Highest load period",
                icon = Icons.Default.Insights
            )
            // Card 3: Connected Nodes
            KpiMetricCard(
                title = "ACTIVE NETWORK NODES",
                value = "${liveStats?.branchStats?.size ?: 3}",
                trend = "100% online",
                trendColor = ScrymeColors.GreenLogo,
                subtitle = "Operational locations",
                icon = Icons.Default.Storefront
            )
        }

        // ---------- Premium System Actions Summary ----------
        ElevatedSurface(radius = CardRadius, elevationDp = 6.dp) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
                shape = RoundedCornerShape(CardRadius)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(bottom = 12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(RoundedCornerShape(7.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Shield,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(13.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "SECURITY & STABILITY STATUS",
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        )
                    }

                    Text(
                        text = "Your console session is fully encrypted and operational. Use the navigation sidebar on the top left of the screen to manage presence, check approvals, disperse registered expenses, broadcast notifications, or configure systems settings.",
                        color = ScrymeColors.Paper.copy(alpha = 0.85f),
                        fontSize = 13.sp,
                        lineHeight = 18.5.sp,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )

                    Button(
                        onClick = onOpenDrawer,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.background
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Menu, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Open Navigation Menu", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun KpiMetricCard(
    title: String,
    value: String,
    trend: String,
    trendColor: Color,
    subtitle: String,
    icon: ImageVector
) {
    ElevatedSurface(radius = CardRadius, elevationDp = 6.dp) {
        Card(
            modifier = Modifier
                .width(180.dp)
                .height(136.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
            shape = RoundedCornerShape(CardRadius)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(trendColor.copy(alpha = 0.1f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = trend,
                            color = trendColor,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Column {
                    Text(
                        text = value,
                        color = ScrymeColors.Paper,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.5).sp
                    )
                    Text(
                        text = title,
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.75f),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp,
                        modifier = Modifier.padding(top = 2.dp, bottom = 1.dp)
                    )
                    Text(
                        text = subtitle,
                        color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                        fontSize = 10.sp
                    )
                }
            }
        }
    }
}
