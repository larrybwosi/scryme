package tech.scryme.app.ui.overview

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.util.CurrencyUtils

private val CardShape = RoundedCornerShape(8.dp)
private val TileShape = RoundedCornerShape(6.dp)
private val ChipShape = RoundedCornerShape(4.dp)

private val StatusActive = Color(0xFF059669)
private val StatusInactive = Color(0xFFDC2626)
private val AccentSales = Color(0xFF059669)
private val AccentTasks = Color(0xFF4F46E5)

private val OverviewTabs = listOf("Summary", "Quick Actions")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OverviewScreen(
    viewModel: OverviewViewModel,
    onNavigateToSchedule: () -> Unit,
    onNavigateToTasks: () -> Unit,
    onNavigateToAdminAnalytics: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                text = "${state.greeting}, ${state.userName}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = state.orgName,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.loadOverviewData() }) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Refresh Overview",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        },
        modifier = modifier
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. Attendance / check-in
            item {
                AttendanceStatusOverviewCard(
                    isShiftActive = state.isShiftActive,
                    punctuality = state.shiftPunctuality,
                    onManageAttendance = onNavigateToSchedule
                )
            }

            // 2. Tabs
            item {
                OverviewTabRow(
                    selectedTab = selectedTab,
                    onTabSelected = { selectedTab = it }
                )
            }

            // 3. Tab content
            when (selectedTab) {
                0 -> {
                    item { SectionHeader(title = "Key Metrics") }
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(IntrinsicSize.Max),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            MetricCard(
                                title = "Today's Sales",
                                value = CurrencyUtils.formatAmount(state.todaySalesAmount, state.currencySymbol),
                                subtitle = "${state.totalOrdersCount} orders",
                                icon = Icons.Default.PointOfSale,
                                iconColor = AccentSales,
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                            )

                            MetricCard(
                                title = "Tasks",
                                value = "${state.pendingTasksCount} Pending",
                                subtitle = "${state.completedTasksCount} completed",
                                icon = Icons.Default.TaskAlt,
                                iconColor = AccentTasks,
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                            )
                        }
                    }
                }

                else -> {
                    item { SectionHeader(title = "Shortcuts") }
                    item {
                        OutlinedSurface {
                            Column {
                                ShortcutCard(
                                    title = "Check-In / Out",
                                    subtitle = "Manage shift attendance",
                                    icon = Icons.Default.Fingerprint,
                                    onClick = onNavigateToSchedule
                                )
                                RowDivider()
                                ShortcutCard(
                                    title = "View Schedule",
                                    subtitle = "Shifts and rosters",
                                    icon = Icons.Default.CalendarMonth,
                                    onClick = onNavigateToSchedule
                                )
                                RowDivider()
                                ShortcutCard(
                                    title = "Staff Tasks",
                                    subtitle = "My operational tasks",
                                    icon = Icons.Default.TaskAlt,
                                    onClick = onNavigateToTasks
                                )
                                RowDivider()
                                ShortcutCard(
                                    title = "Analytics",
                                    subtitle = "Admin sales analytics",
                                    icon = Icons.Default.QueryStats,
                                    onClick = onNavigateToAdminAnalytics
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

@Composable
private fun OverviewTabRow(
    selectedTab: Int,
    onTabSelected: (Int) -> Unit
) {
    Column {
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color.Transparent,
            contentColor = MaterialTheme.colorScheme.primary,
            divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) }
        ) {
            OverviewTabs.forEachIndexed { index, label ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { onTabSelected(index) },
                    selectedContentColor = MaterialTheme.colorScheme.primary,
                    unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    text = {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = if (selectedTab == index) FontWeight.SemiBold else FontWeight.Medium
                        )
                    }
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, modifier: Modifier = Modifier) {
    Text(
        text = title.uppercase(),
        style = MaterialTheme.typography.labelMedium,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.8.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier
    )
}

@Composable
private fun RowDivider() {
    HorizontalDivider(
        modifier = Modifier.padding(start = 64.dp),
        color = MaterialTheme.colorScheme.outlineVariant
    )
}

/** Flat, bordered container used across the screen for a consistent enterprise look. */
@Composable
private fun OutlinedSurface(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
        modifier = modifier.fillMaxWidth(),
        content = content
    )
}

@Composable
private fun StatusChip(text: String, color: Color) {
    Surface(
        shape = ChipShape,
        color = color.copy(alpha = 0.12f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(color)
            )
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp,
                color = color
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Attendance card
// ---------------------------------------------------------------------------

@Composable
fun AttendanceStatusOverviewCard(
    isShiftActive: Boolean,
    punctuality: String,
    onManageAttendance: () -> Unit
) {
    val statusColor = if (isShiftActive) StatusActive else StatusInactive

    OutlinedSurface {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
        ) {
            // Status accent bar
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .background(statusColor)
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Header: label + status chip
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    SectionHeader(title = "Attendance")
                    StatusChip(
                        text = if (isShiftActive) "ON DUTY" else "OFF DUTY",
                        color = statusColor
                    )
                }

                // Headline + supporting text
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = if (isShiftActive) "You're checked in" else "You're not checked in",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = if (isShiftActive) {
                            "Your shift is in progress."
                        } else {
                            "Check in to start your shift."
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Meta row: punctuality
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "Punctuality",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Surface(
                        shape = ChipShape,
                        color = MaterialTheme.colorScheme.surfaceVariant
                    ) {
                        Text(
                            text = punctuality,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }

                // Primary action: full width
                if (isShiftActive) {
                    OutlinedButton(
                        onClick = onManageAttendance,
                        shape = TileShape,
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Fingerprint,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Manage Attendance",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                } else {
                    Button(
                        onClick = onManageAttendance,
                        shape = TileShape,
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Fingerprint,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Check In",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    OutlinedSurface(modifier = modifier) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(TileShape)
                        .background(iconColor.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = iconColor,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/** A list-style action row. Rendered inside a shared bordered container. */
@Composable
fun ShortcutCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(TileShape)
                .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1
            )
        }

        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(20.dp)
        )
    }
}