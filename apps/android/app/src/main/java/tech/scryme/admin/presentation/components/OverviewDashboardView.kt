package tech.scryme.admin.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.data.model.LocationDto
import tech.scryme.admin.data.model.MemberResponseDto
import tech.scryme.admin.data.model.OrganizationDetailsDto
import tech.scryme.admin.data.model.PriceChangeRequestDto
import tech.scryme.admin.data.model.StockAdjustmentResponseDto
import tech.scryme.admin.data.model.TransactionDto
import tech.scryme.admin.data.model.formatCurrency
import tech.scryme.admin.presentation.viewmodel.UiState

data class TaskAlertItem(
    val type: String,
    val title: String,
    val status: String,
    val due: String
)

// Consistent accent set for statuses across the dashboard
private val StatusBlue = Color(0xFF3B82F6)
private val StatusAmber = Color(0xFFF59E0B)
private val StatusGreen = Color(0xFF10B981)

@Composable
fun OverviewDashboardView(
    branches: List<LocationDto>,
    orgDetailsState: UiState<OrganizationDetailsDto> = UiState.Idle,
    transactionsState: UiState<List<TransactionDto>> = UiState.Idle,
    priceChangeRequestsState: UiState<List<PriceChangeRequestDto>> = UiState.Idle,
    stockAdjustmentsState: UiState<List<StockAdjustmentResponseDto>> = UiState.Idle,
    presenceState: UiState<List<MemberResponseDto>> = UiState.Idle,
    selectedBranchId: String?,
    onSelectBranch: (String) -> Unit,
    onOpenQrScanner: () -> Unit
) {
    val currencyCode = if (orgDetailsState is UiState.Success) orgDetailsState.data.currencyCode else "USD"
    val totalRevenue = if (transactionsState is UiState.Success) {
        transactionsState.data.sumOf { it.effectiveAmount() }
    } else 0.0

    val pendingPriceCount = if (priceChangeRequestsState is UiState.Success) {
        priceChangeRequestsState.data.count { it.status.equals("PENDING", ignoreCase = true) }
    } else 0

    val pendingStockCount = if (stockAdjustmentsState is UiState.Success) {
        stockAdjustmentsState.data.count { it.status.equals("PENDING", ignoreCase = true) }
    } else 0

    val totalPendingApprovals = pendingPriceCount + pendingStockCount

    val checkedInStaffCount = if (presenceState is UiState.Success) {
        presenceState.data.count { it.isCheckedIn == true }
    } else 0

    val totalMembersCount = if (orgDetailsState is UiState.Success) {
        orgDetailsState.data.membersCount
    } else if (presenceState is UiState.Success) {
        presenceState.data.size
    } else 0

    val taskAlerts = remember(pendingPriceCount, pendingStockCount, checkedInStaffCount, branches.size) {
        val list = mutableListOf<TaskAlertItem>()
        if (pendingPriceCount > 0) {
            list.add(TaskAlertItem("Price Approval", "$pendingPriceCount pending price change review(s)", "Awaiting", "Today"))
        }
        if (pendingStockCount > 0) {
            list.add(TaskAlertItem("Stock Adjustment", "$pendingStockCount pending inventory adjustment(s)", "Pending", "Today"))
        }
        if (checkedInStaffCount > 0) {
            list.add(TaskAlertItem("Live Presence", "$checkedInStaffCount staff member(s) checked in", "Active", "Now"))
        }
        if (branches.isNotEmpty()) {
            list.add(TaskAlertItem("Branch Oversight", "${branches.size} active location(s) operational", "Active", "Ongoing"))
        }
        if (list.isEmpty()) {
            list.add(TaskAlertItem("System Audit", "All system approvals and rosters up to date", "Completed", "Today"))
        }
        list
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.AutoMirrored.Filled.TrendingUp,
                    iconTint = StatusGreen,
                    label = "ORGANIZATION REVENUE",
                    value = formatCurrency(totalRevenue, currencyCode),
                    footnote = "Live transaction sum",
                    footnoteColor = StatusGreen
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.Storefront,
                    iconTint = StatusBlue,
                    label = "ACTIVE LOCATIONS",
                    value = "${branches.size}",
                    footnote = if (branches.isNotEmpty()) branches.first().name else "No active locations",
                    footnoteColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.PendingActions,
                    iconTint = StatusAmber,
                    label = "PENDING APPROVALS",
                    value = "$totalPendingApprovals",
                    footnote = "Price $pendingPriceCount  ·  Stock $pendingStockCount",
                    footnoteColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
                MetricCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.Groups,
                    iconTint = StatusGreen,
                    label = "ACTIVE MEMBERS",
                    value = "$totalMembersCount",
                    footnote = "$checkedInStaffCount checked in now",
                    footnoteColor = StatusGreen
                )
            }
        }

        item {
            EnterpriseSurface {
                Column(modifier = Modifier.padding(20.dp)) {
                    SectionHeader(
                        title = "To-Do & Priority Tasks",
                        subtitle = "${taskAlerts.size} item(s) requiring attention"
                    ) {
                        TextButton(onClick = {}, contentPadding = PaddingValues(horizontal = 8.dp)) {
                            Text("View All", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.width(2.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            TableHeaderCell("TYPE", 1.2f)
                            TableHeaderCell("TITLE", 1.6f)
                            TableHeaderCell("STATUS", 1f)
                            TableHeaderCell("DUE", 0.8f, alignEnd = true)
                        }
                    }

                    taskAlerts.forEachIndexed { index, task ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(modifier = Modifier.weight(1.2f), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(statusColorFor(task.status))
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    task.type,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Medium
                                )
                            }

                            Text(
                                task.title,
                                fontSize = 12.sp,
                                modifier = Modifier.weight(1.6f),
                                maxLines = 1,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Box(modifier = Modifier.weight(1f)) {
                                StatusBadge(task.status)
                            }

                            Text(
                                task.due,
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.weight(0.8f),
                                textAlign = TextAlign.End
                            )
                        }
                        if (index < taskAlerts.lastIndex) {
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        }
                    }
                }
            }
        }

        item {
            EnterpriseSurface {
                Column(modifier = Modifier.padding(20.dp)) {
                    SectionHeader(
                        title = "Organization Locations",
                        subtitle = "${branches.size} location(s) under management"
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = onOpenQrScanner,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Authorize POS Terminal",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }

                    if (branches.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        branches.forEachIndexed { index, branch ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onSelectBranch(branch.id) }
                                    .padding(vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(
                                                if (branch.isActive) StatusGreen.copy(alpha = 0.12f)
                                                else MaterialTheme.colorScheme.surfaceVariant
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Storefront,
                                            contentDescription = null,
                                            tint = if (branch.isActive) StatusGreen else MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            branch.name,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            if (branch.isActive) "Active Location" else "Inactive",
                                            fontSize = 11.sp,
                                            color = if (branch.isActive) StatusGreen else MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = if (branch.id == selectedBranchId)
                                        MaterialTheme.colorScheme.primaryContainer
                                    else Color.Transparent,
                                    border = if (branch.id == selectedBranchId) null
                                    else BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                                ) {
                                    Text(
                                        if (branch.id == selectedBranchId) "Selected" else "Select",
                                        color = if (branch.id == selectedBranchId)
                                            MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                    )
                                }
                            }
                            if (index < branches.lastIndex) {
                                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

@Composable
private fun EnterpriseSurface(content: @Composable () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        tonalElevation = 0.dp,
        shadowElevation = 0.dp
    ) {
        content()
    }
}

@Composable
private fun MetricCard(
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    label: String,
    value: String,
    footnote: String,
    footnoteColor: Color
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        tonalElevation = 0.dp,
        shadowElevation = 0.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(7.dp))
                        .background(iconTint.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(15.dp))
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.6.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                footnote,
                fontSize = 11.sp,
                color = footnoteColor,
                fontWeight = FontWeight.Medium,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String,
    trailing: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                subtitle,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        trailing?.invoke()
    }
}

@Composable
private fun RowScope.TableHeaderCell(text: String, weight: Float, alignEnd: Boolean = false) {
    Text(
        text,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.6.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.weight(weight),
        textAlign = if (alignEnd) TextAlign.End else TextAlign.Start
    )
}

@Composable
private fun StatusBadge(status: String) {
    val color = statusColorFor(status)
    Surface(
        shape = RoundedCornerShape(4.dp),
        color = color.copy(alpha = 0.12f),
        border = BorderStroke(1.dp, color.copy(alpha = 0.25f))
    ) {
        Text(
            text = status,
            fontSize = 10.sp,
            color = color,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

private fun statusColorFor(status: String): Color = when (status) {
    "Awaiting" -> StatusBlue
    "Pending" -> StatusAmber
    "Active" -> StatusGreen
    "Completed" -> StatusGreen
    else -> Color(0xFF8B95A5)
}
