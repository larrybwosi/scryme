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

// ---------- Shared design tokens ----------
private val CardRadius = 18.dp
private val RowRadius = 15.dp

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
            .padding(top = 20.dp, bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // ---------- Header ----------
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "SCRYME ADMIN",
                    color = ScrymeColors.Brass.copy(alpha = 0.85f),
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
                                    ScrymeColors.SteelDark,
                                    ScrymeColors.InkBg
                                )
                            )
                        )
                        .border(1.dp, ScrymeColors.Brass.copy(alpha = 0.35f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text("S", color = ScrymeColors.Brass, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            }
        }

        // ---------- Welcome banner ----------
        ElevatedSurface(elevationDp = 6.dp) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
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
                            .size(44.dp)
                            .clip(RoundedCornerShape(13.dp))
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        ScrymeColors.Brass.copy(alpha = 0.25f),
                                        ScrymeColors.Brass.copy(alpha = 0.08f)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = userName.take(1).uppercase(),
                            color = ScrymeColors.Brass,
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp
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

        // ---------- Live stats overview ----------
        ElevatedSurface(elevationDp = 6.dp) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
                shape = RoundedCornerShape(CardRadius),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        SectionLabel(icon = Icons.Default.Insights, text = "REAL-TIME METRICS")
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(ScrymeColors.GreenLogo.copy(alpha = 0.12f))
                                .padding(horizontal = 9.dp, vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(ScrymeColors.GreenLogo)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "LIVE",
                                color = ScrymeColors.GreenLogo,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    val totalCheckedIn = liveStats?.totalCheckedInNow ?: activeMembers.size
                    Text(
                        text = "$totalCheckedIn",
                        color = ScrymeColors.Paper,
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = (-0.5).sp
                    )
                    Text(
                        text = "Active check-ins right now",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                        fontSize = 12.5.sp,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }
        }

        // ---------- Administrative actions ----------
        Text(
            text = "ADMINISTRATIVE ACTIONS",
            color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.6.sp,
            modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
        )

        Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
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
                icon = Icons.Default.Insights,
                onClick = { onNavigateToScreen(DashboardScreen.ANALYTICS) }
            )

            ShortcutCard(
                title = "Branch ID Inspector",
                subtitle = "View sales, petty cash, and check-ins per branch",
                icon = Icons.Default.Storefront,
                onClick = { onNavigateToScreen(DashboardScreen.BRANCH_DETAIL) }
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

        // ---------- Session security inspector ----------
        ElevatedSurface(elevationDp = 6.dp) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
                shape = RoundedCornerShape(CardRadius),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    SectionLabel(icon = Icons.Default.Business, text = "ACTIVE TENANT")
                    Text(
                        text = activeOrg,
                        color = ScrymeColors.Paper,
                        fontSize = 14.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 8.dp, bottom = 16.dp)
                    )

                    HorizontalDivider(color = ScrymeColors.Paper.copy(alpha = 0.06f), modifier = Modifier.padding(bottom = 16.dp))

                    SectionLabel(icon = Icons.Default.Lock, text = "SECURE SESSION TOKEN")

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(ScrymeColors.InkBg)
                            .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(10.dp))
                            .padding(14.dp)
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
        }

        // ---------- Sign out ----------
        OutlinedButton(
            onClick = onSignOut,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp, bottom = 12.dp)
                .height(52.dp),
            border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.35f)),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = ScrymeColors.Crimson.copy(alpha = 0.08f),
                contentColor = ScrymeColors.Crimson
            ),
            shape = RoundedCornerShape(13.dp)
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
        Box(
            modifier = Modifier
                .size(22.dp)
                .clip(RoundedCornerShape(7.dp))
                .background(
                    Brush.linearGradient(
                        listOf(
                            ScrymeColors.Brass.copy(alpha = 0.22f),
                            ScrymeColors.Brass.copy(alpha = 0.07f)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = ScrymeColors.Brass,
                modifier = Modifier.size(12.dp)
            )
        }
        Spacer(modifier = Modifier.width(9.dp))
        Text(
            text = text,
            color = ScrymeColors.Brass,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
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
    ElevatedSurface(radius = RowRadius, elevationDp = 5.dp) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
            shape = RoundedCornerShape(RowRadius),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(
                modifier = Modifier.padding(15.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    ScrymeColors.Brass.copy(alpha = 0.2f),
                                    ScrymeColors.Brass.copy(alpha = 0.06f)
                                )
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(18.dp))
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = title, color = ScrymeColors.Paper, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text(
                        text = subtitle,
                        color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                        fontSize = 11.5.sp,
                        modifier = Modifier.padding(top = 1.dp)
                    )
                }
                Box(
                    modifier = Modifier
                        .size(26.dp)
                        .clip(CircleShape)
                        .background(ScrymeColors.InkBg),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                        modifier = Modifier.size(13.dp)
                    )
                }
            }
        }
    }
}
