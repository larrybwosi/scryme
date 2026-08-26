package tech.scryme.admin.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
    // 1. Calculate Real Revenue
    val currencyCode = if (orgDetailsState is UiState.Success) orgDetailsState.data.currencyCode else "USD"
    val totalRevenue = if (transactionsState is UiState.Success) {
        transactionsState.data.sumOf { it.effectiveAmount() }
    } else 0.0

    // 2. Calculate Real Pending Approvals
    val pendingPriceCount = if (priceChangeRequestsState is UiState.Success) {
        priceChangeRequestsState.data.count { it.status.equals("PENDING", ignoreCase = true) }
    } else 0

    val pendingStockCount = if (stockAdjustmentsState is UiState.Success) {
        stockAdjustmentsState.data.count { it.status.equals("PENDING", ignoreCase = true) }
    } else 0

    val totalPendingApprovals = pendingPriceCount + pendingStockCount

    // 3. Calculate Real Active Staff / Members
    val checkedInStaffCount = if (presenceState is UiState.Success) {
        presenceState.data.count { it.isCheckedIn == true }
    } else 0

    val totalMembersCount = if (orgDetailsState is UiState.Success) {
        orgDetailsState.data.membersCount
    } else if (presenceState is UiState.Success) {
        presenceState.data.size
    } else 0

    // 4. Generate Dynamic Real Priority Tasks
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
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ElevatedCard(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Organization Revenue",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            formatCurrency(totalRevenue, currencyCode),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Live Transactions Sum",
                            fontSize = 11.sp,
                            color = Color(0xFF10B981),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                ElevatedCard(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Active Locations",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "${branches.size}",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            if (branches.isNotEmpty()) branches.first().name else "No active locations",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ElevatedCard(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Pending Approvals",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "$totalPendingApprovals",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "Price: $pendingPriceCount • Stock: $pendingStockCount",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                ElevatedCard(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Active Members",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "$totalMembersCount",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            "$checkedInStaffCount Staff Checked-In Now",
                            fontSize = 11.sp,
                            color = Color(0xFF10B981),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "To-Do & Priority Tasks",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        TextButton(onClick = {}) {
                            Text("View All", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Type", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1.2f))
                        Text("Title", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1.5f))
                        Text("Status", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                        Text("Due", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(0.8f))
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    taskAlerts.forEach { task ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(modifier = Modifier.weight(1.2f), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(task.type, fontSize = 11.sp, maxLines = 1, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium)
                            }

                            Text(task.title, fontSize = 11.sp, modifier = Modifier.weight(1.5f), maxLines = 1, color = MaterialTheme.colorScheme.onSurface)

                            Box(modifier = Modifier.weight(1f)) {
                                val statusColor = when (task.status) {
                                    "Awaiting" -> Color(0xFF3B82F6)
                                    "Pending" -> Color(0xFFF59E0B)
                                    "Active" -> Color(0xFF10B981)
                                    "Completed" -> Color(0xFF10B981)
                                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                                }
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = statusColor.copy(alpha = 0.15f)
                                ) {
                                    Text(
                                        text = task.status,
                                        fontSize = 10.sp,
                                        color = statusColor,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Text(task.due, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(0.8f))
                        }
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    }
                }
            }
        }

        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Organization Locations (${branches.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = onOpenQrScanner,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Authorize POS Terminal (Scan QR)", fontWeight = FontWeight.Bold)
                    }

                    if (branches.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        branches.forEach { branch ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onSelectBranch(branch.id) }
                                    .padding(vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        branch.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        if (branch.isActive) "Active Location" else "Inactive",
                                        fontSize = 11.sp,
                                        color = if (branch.isActive) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = if (branch.id == selectedBranchId) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                                ) {
                                    Text(
                                        if (branch.id == selectedBranchId) "Selected" else "Select",
                                        color = if (branch.id == selectedBranchId) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        }
                    }
                }
            }
        }
    }
}
