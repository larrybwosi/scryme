package tech.scryme.app.ui.branch

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.BranchActivityItem
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.model.BranchSaleItem
import tech.scryme.app.domain.model.BranchStockMovementItem
import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.MemberAvatar
import tech.scryme.app.ui.theme.Amber500
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

private val CardShape = RoundedCornerShape(8.dp)
private val ChipShape = RoundedCornerShape(4.dp)
private val ControlShape = RoundedCornerShape(6.dp)

@Composable
private fun OutlinedCard(
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
private fun SectionHeader(text: String) {
    Text(
        text = text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.8.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchDetailsScreen(
    viewModel: BranchDetailsViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showEditDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadBranchDetails()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    val branchTitle = (uiState as? BranchDetailsUiState.Success)?.branch?.name ?: "Branch Details"
                    Text(
                        text = branchTitle,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadBranchDetails() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (val state = uiState) {
                is BranchDetailsUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        ListSkeleton(count = 5)
                    }
                }
                is BranchDetailsUiState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        ErrorMessageCard(
                            title = "Branch Error",
                            message = state.message,
                            onRetry = { viewModel.loadBranchDetails() }
                        )
                    }
                }
                is BranchDetailsUiState.Success -> {
                    val successMsg = state.actionSuccessMessage
                    if (!successMsg.isNullOrEmpty()) {
                        Snackbar(
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        ) {
                            Text(successMsg)
                        }
                    }

                    // Tabs
                    TabRow(
                        selectedTabIndex = state.selectedTab.ordinal,
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = MaterialTheme.colorScheme.primary,
                        divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) }
                    ) {
                        Tab(
                            selected = state.selectedTab == BranchDetailsTab.OVERVIEW,
                            onClick = { viewModel.onTabSelected(BranchDetailsTab.OVERVIEW) },
                            text = { Text("Overview", fontSize = 13.sp, fontWeight = FontWeight.Medium) }
                        )
                        Tab(
                            selected = state.selectedTab == BranchDetailsTab.ACTIVITY,
                            onClick = { viewModel.onTabSelected(BranchDetailsTab.ACTIVITY) },
                            text = { Text("Check-ins", fontSize = 13.sp, fontWeight = FontWeight.Medium) }
                        )
                        Tab(
                            selected = state.selectedTab == BranchDetailsTab.SALES,
                            onClick = { viewModel.onTabSelected(BranchDetailsTab.SALES) },
                            text = { Text("Sales", fontSize = 13.sp, fontWeight = FontWeight.Medium) }
                        )
                        Tab(
                            selected = state.selectedTab == BranchDetailsTab.STOCK_MOVEMENTS,
                            onClick = { viewModel.onTabSelected(BranchDetailsTab.STOCK_MOVEMENTS) },
                            text = { Text("Stock", fontSize = 13.sp, fontWeight = FontWeight.Medium) }
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        when (state.selectedTab) {
                            BranchDetailsTab.OVERVIEW -> {
                                BranchOverviewTab(
                                    branch = state.branch,
                                    isActive = state.isActive,
                                    isAdmin = state.isAdmin,
                                    onSetActive = { viewModel.switchActiveBranch() },
                                    onEdit = { showEditDialog = true },
                                    onPinLocation = { viewModel.pinCurrentLocation(context) }
                                )
                            }
                            BranchDetailsTab.ACTIVITY -> {
                                BranchActivityTab(
                                    activityLogs = state.activityLogs,
                                    isLoading = state.isActivityLoading,
                                    onRefresh = { viewModel.loadActivity() }
                                )
                            }
                            BranchDetailsTab.SALES -> {
                                BranchSalesTab(
                                    sales = state.sales,
                                    isLoading = state.isSalesLoading,
                                    onRefresh = { viewModel.loadSales() }
                                )
                            }
                            BranchDetailsTab.STOCK_MOVEMENTS -> {
                                BranchStockMovementsTab(
                                    movements = state.stockMovements,
                                    isLoading = state.isStockLoading,
                                    onRefresh = { viewModel.loadStockMovements() }
                                )
                            }
                        }
                    }

                    if (showEditDialog) {
                        LocationFormDialog(
                            title = "Edit Branch Location",
                            initialBranch = state.branch,
                            onDismiss = { showEditDialog = false },
                            onSubmit = { name, code, address, phone, type, lat, lng, radius ->
                                viewModel.updateBranch(
                                    name = name,
                                    code = code,
                                    address = address,
                                    phone = phone,
                                    locationType = type,
                                    latitude = lat,
                                    longitude = lng,
                                    geofenceRadiusMeters = radius
                                )
                                showEditDialog = false
                            }
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

@Composable
fun BranchOverviewTab(
    branch: BranchLocation,
    isActive: Boolean,
    isAdmin: Boolean,
    onSetActive: () -> Unit,
    onEdit: () -> Unit,
    onPinLocation: () -> Unit
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            // Status & Quick Action Surface
            OutlinedCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = branch.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Surface(
                                    shape = ChipShape,
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                                ) {
                                    Text(
                                        text = branch.locationType,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                if (branch.code != null) {
                                    Surface(
                                        shape = ChipShape,
                                        color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f)
                                    ) {
                                        Text(
                                            text = "Code: ${branch.code}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.secondary,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        }

                        if (isActive) {
                            Surface(
                                shape = ChipShape,
                                color = Emerald500.copy(alpha = 0.15f)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Emerald500,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(
                                        text = "Active Branch",
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Emerald500
                                    )
                                }
                            }
                        }
                    }

                    if (isAdmin) {
                        Spacer(modifier = Modifier.height(16.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        Spacer(modifier = Modifier.height(12.dp))

                        SectionHeader("Admin Quick Actions")
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (!isActive) {
                                Button(
                                    onClick = onSetActive,
                                    shape = ControlShape,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Set as Active Branch", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                            } else {
                                OutlinedButton(
                                    onClick = onSetActive,
                                    shape = ControlShape,
                                    modifier = Modifier.weight(1f),
                                    enabled = false
                                ) {
                                    Text("Currently Active", fontSize = 12.sp)
                                }
                            }

                            OutlinedButton(
                                onClick = onEdit,
                                shape = ControlShape,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Edit Branch", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        OutlinedButton(
                            onClick = onPinLocation,
                            shape = ControlShape,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Pin Current GPS Location", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }

        item {
            // Location & Contact details card
            OutlinedCard {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SectionHeader("Location Details")

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Place, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Column {
                            Text(text = "Physical Address", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(text = branch.address ?: "Not provided", style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Phone, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Column {
                            Text(text = "Phone Number", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(text = branch.phone ?: "Not provided", style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = Emerald500, modifier = Modifier.size(18.dp))
                        Column {
                            Text(text = "GPS Coordinates & Geofence", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            if (branch.latitude != null && branch.longitude != null) {
                                Text(
                                    text = "${"%.5f".format(branch.latitude)}, ${"%.5f".format(branch.longitude)} (Radius: ${branch.geofenceRadiusMeters?.toInt() ?: 100}m)",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                            } else {
                                Text(
                                    text = "Coordinates not pinned yet",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Activity & Check-ins Tab
// ---------------------------------------------------------------------------

@Composable
fun BranchActivityTab(
    activityLogs: List<BranchActivityItem>,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    if (isLoading) {
        ListSkeleton(count = 4)
        return
    }

    if (activityLogs.isEmpty()) {
        EmptyStateCard(
            title = "No Check-ins Recorded",
            description = "There are no recent staff attendance check-ins or user activity logged for this branch."
        )
        return
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            SectionHeader("Recent Staff Check-ins (${activityLogs.size})")
        }

        items(activityLogs, key = { it.id }) { log ->
            OutlinedCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            MemberAvatar(
                                avatarUrl = log.memberAvatar,
                                name = log.memberName,
                                modifier = Modifier.size(32.dp)
                            )
                            Column {
                                Text(
                                    text = log.memberName,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "In: ${log.checkInTime.take(16).replace("T", " ")}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Surface(
                            shape = ChipShape,
                            color = if (log.isLocationVerified) Emerald500.copy(alpha = 0.12f) else Amber500.copy(alpha = 0.12f)
                        ) {
                            Text(
                                text = if (log.isLocationVerified) "VERIFIED" else log.shiftStatus,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (log.isLocationVerified) Emerald500 else Amber500,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    if (log.checkOutTime != null) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Out: ${log.checkOutTime.take(16).replace("T", " ")}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (log.distanceMeters != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Distance: ${"%.1f".format(log.distanceMeters)}m from branch",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Sales Tab
// ---------------------------------------------------------------------------

@Composable
fun BranchSalesTab(
    sales: List<BranchSaleItem>,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    if (isLoading) {
        ListSkeleton(count = 4)
        return
    }

    if (sales.isEmpty()) {
        EmptyStateCard(
            title = "No Recent Sales",
            description = "No transactions have been recorded at this branch location recently."
        )
        return
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            SectionHeader("Recent Branch Transactions (${sales.size})")
        }

        items(sales, key = { it.id }) { sale ->
            OutlinedCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Order #${sale.transactionNumber}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "${sale.customerName} · by ${sale.cashierName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "${sale.currencyCode} ${"%.2f".format(sale.totalAmount)}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Surface(
                                shape = ChipShape,
                                color = if (sale.status == "COMPLETED") Emerald500.copy(alpha = 0.12f) else Amber500.copy(alpha = 0.12f)
                            ) {
                                Text(
                                    text = sale.status,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (sale.status == "COMPLETED") Emerald500 else Amber500,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = sale.createdAt.take(16).replace("T", " "),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Stock Movements Tab
// ---------------------------------------------------------------------------

@Composable
fun BranchStockMovementsTab(
    movements: List<BranchStockMovementItem>,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    if (isLoading) {
        ListSkeleton(count = 4)
        return
    }

    if (movements.isEmpty()) {
        EmptyStateCard(
            title = "No Stock Movements",
            description = "No incoming or outgoing inventory movements have occurred for this branch."
        )
        return
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item {
            SectionHeader("Recent Stock Movements (${movements.size})")
        }

        items(movements, key = { it.id }) { mov ->
            OutlinedCard {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = mov.variantName,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold
                            )
                            val locationContext = if (mov.direction == "IN") {
                                "From: ${mov.fromLocationName ?: "Supplier / Adjustment"}"
                            } else {
                                "To: ${mov.toLocationName ?: "Customer / Outgoing"}"
                            }
                            Text(
                                text = locationContext,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            val sign = if (mov.direction == "IN") "+" else "-"
                            val qtyColor = if (mov.direction == "IN") Emerald500 else Rose500
                            Text(
                                text = "$sign${"%.2f".format(mov.quantity)}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = qtyColor
                            )
                            Surface(
                                shape = ChipShape,
                                color = qtyColor.copy(alpha = 0.12f)
                            ) {
                                Text(
                                    text = mov.movementType,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = qtyColor,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "By: ${mov.performedBy}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = mov.timestamp.take(16).replace("T", " "),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (!mov.notes.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Note: ${mov.notes}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
