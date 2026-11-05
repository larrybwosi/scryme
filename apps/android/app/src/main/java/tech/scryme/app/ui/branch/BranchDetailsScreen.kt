package tech.scryme.app.ui.branch

import kotlinx.coroutines.launch

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

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
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
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

private val CardShape = RoundedCornerShape(16.dp)
private val TagShape = RoundedCornerShape(6.dp)
private val ControlShape = RoundedCornerShape(10.dp)
private val ListPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 32.dp)
private const val DEFAULT_RADIUS_METERS = 100

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

@Composable
private fun SurfaceCard(
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
private fun SectionHeader(title: String, count: Int? = null) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface
        )
        if (count != null) {
            Surface(shape = TagShape, color = MaterialTheme.colorScheme.surfaceVariant) {
                Text(
                    text = count.toString(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun StatusTag(text: String, color: Color) {
    Surface(shape = TagShape, color = color.copy(alpha = 0.12f)) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
            color = color,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
private fun DetailRow(
    icon: ImageVector,
    accent: Color,
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(accent.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(18.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                color = valueColor
            )
        }
    }
}

@Composable
private fun TabContentBox(content: @Composable BoxScope.() -> Unit) {
    Box(modifier = Modifier.fillMaxSize().padding(16.dp), content = content)
}

private fun String.toLabel(): String = lowercase().replaceFirstChar { it.uppercase() }

private fun String.toDisplayTime(): String = take(16).replace("T", " ")

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchDetailsScreen(
    viewModel: BranchDetailsViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }

    var showEditDialog by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            viewModel.pinCurrentLocation(context)
        } else {
            coroutineScope.launch {
                snackbarHostState.showSnackbar("Location permission is required to pin GPS coordinates.")
            }
        }
    }

    val requestLocationPinning = {
        val fineGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarseGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (fineGranted || coarseGranted) {
            viewModel.pinCurrentLocation(context)
        } else {
            locationPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    LaunchedEffect(Unit) { viewModel.loadBranchDetails() }

    val feedback = (uiState as? BranchDetailsUiState.Success)?.actionSuccessMessage
    LaunchedEffect(feedback) {
        if (!feedback.isNullOrEmpty()) snackbarHostState.showSnackbar(feedback)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    val title = (uiState as? BranchDetailsUiState.Success)?.branch?.name ?: "Branch"
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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
        ) {
            when (val state = uiState) {
                is BranchDetailsUiState.Loading -> TabContentBox { ListSkeleton(count = 5) }

                is BranchDetailsUiState.Error -> Box(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    ErrorMessageCard(
                        title = "Couldn't load branch",
                        message = state.message,
                        onRetry = { viewModel.loadBranchDetails() }
                    )
                }

                is BranchDetailsUiState.Success -> {
                    val tabs = listOf(
                        BranchDetailsTab.OVERVIEW to "Overview",
                        BranchDetailsTab.ACTIVITY to "Check-ins",
                        BranchDetailsTab.SALES to "Sales",
                        BranchDetailsTab.STOCK_MOVEMENTS to "Stock"
                    )

                    TabRow(
                        selectedTabIndex = state.selectedTab.ordinal,
                        containerColor = MaterialTheme.colorScheme.background,
                        contentColor = MaterialTheme.colorScheme.primary,
                        divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) }
                    ) {
                        tabs.forEach { (tab, label) ->
                            Tab(
                                selected = state.selectedTab == tab,
                                onClick = { viewModel.onTabSelected(tab) },
                                selectedContentColor = MaterialTheme.colorScheme.primary,
                                unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                text = {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelLarge,
                                        maxLines = 1
                                    )
                                }
                            )
                        }
                    }

                    Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                        when (state.selectedTab) {
                            BranchDetailsTab.OVERVIEW -> BranchOverviewTab(
                                branch = state.branch,
                                isActive = state.isActive,
                                isAdmin = state.isAdmin,
                                onSetActive = { viewModel.switchActiveBranch() },
                                onEdit = { showEditDialog = true },
                                onPinLocation = requestLocationPinning
                            )
                            BranchDetailsTab.ACTIVITY -> BranchActivityTab(
                                activityLogs = state.activityLogs,
                                isLoading = state.isActivityLoading,
                                onRefresh = { viewModel.loadActivity() }
                            )
                            BranchDetailsTab.SALES -> BranchSalesTab(
                                sales = state.sales,
                                isLoading = state.isSalesLoading,
                                onRefresh = { viewModel.loadSales() }
                            )
                            BranchDetailsTab.STOCK_MOVEMENTS -> BranchStockMovementsTab(
                                movements = state.stockMovements,
                                isLoading = state.isStockLoading,
                                onRefresh = { viewModel.loadStockMovements() }
                            )
                        }
                    }

                    if (showEditDialog) {
                        LocationFormDialog(
                            title = "Edit location",
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
// Overview tab
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
    val colors = MaterialTheme.colorScheme
    val isPinned = branch.latitude != null && branch.longitude != null

    LazyColumn(
        contentPadding = ListPadding,
        verticalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        // Identity + admin actions
        item {
            SurfaceCard {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = branch.name,
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.SemiBold),
                                color = colors.onSurface
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                StatusTag(text = branch.locationType.toLabel(), color = colors.primary)
                                if (!branch.code.isNullOrEmpty()) {
                                    StatusTag(text = "Code ${branch.code}", color = colors.onSurfaceVariant)
                                }
                            }
                        }

                        if (isActive) {
                            Spacer(Modifier.width(12.dp))
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = Emerald500,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Active",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = Emerald500
                                )
                            }
                        }
                    }

                    if (isAdmin) {
                        Spacer(Modifier.height(16.dp))
                        HorizontalDivider(color = colors.outlineVariant)
                        Spacer(Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (!isActive) {
                                Button(
                                    onClick = onSetActive,
                                    shape = ControlShape,
                                    modifier = Modifier.weight(1f)
                                ) { Text("Set as active") }
                            }
                            OutlinedButton(
                                onClick = onEdit,
                                shape = ControlShape,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Edit")
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        TextButton(
                            onClick = onPinLocation,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(if (isPinned) "Re-pin to my current location" else "Pin my current location")
                        }
                    }
                }
            }
        }

        // Details
        item {
            SurfaceCard {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SectionHeader("Details")

                    DetailRow(
                        icon = Icons.Default.Place,
                        accent = colors.primary,
                        label = "Address",
                        value = branch.address?.takeIf { it.isNotBlank() } ?: "Not provided",
                        valueColor = if (branch.address.isNullOrBlank()) colors.onSurfaceVariant else colors.onSurface
                    )
                    DetailRow(
                        icon = Icons.Default.Phone,
                        accent = colors.primary,
                        label = "Phone",
                        value = branch.phone?.takeIf { it.isNotBlank() } ?: "Not provided",
                        valueColor = if (branch.phone.isNullOrBlank()) colors.onSurfaceVariant else colors.onSurface
                    )
                    DetailRow(
                        icon = if (isPinned) Icons.Default.LocationOn else Icons.Default.Warning,
                        accent = if (isPinned) Emerald500 else colors.error,
                        label = "Geofence",
                        value = if (isPinned) {
                            "%.5f, %.5f  •  ${branch.geofenceRadiusMeters?.toInt() ?: DEFAULT_RADIUS_METERS} m radius"
                                .format(branch.latitude, branch.longitude)
                        } else {
                            "Not pinned. Staff can't check in until a location is set."
                        },
                        valueColor = if (isPinned) colors.onSurface else colors.error
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Check-ins tab
// ---------------------------------------------------------------------------

@Composable
fun BranchActivityTab(
    activityLogs: List<BranchActivityItem>,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    if (isLoading) {
        TabContentBox { ListSkeleton(count = 4) }
        return
    }
    if (activityLogs.isEmpty()) {
        TabContentBox {
            EmptyStateCard(
                title = "No check-ins yet",
                description = "Staff check-ins at this branch will appear here."
            )
        }
        return
    }

    LazyColumn(
        contentPadding = ListPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item { SectionHeader("Recent check-ins", count = activityLogs.size) }

        items(activityLogs, key = { it.id }) { log ->
            SurfaceCard {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        MemberAvatar(
                            avatarUrl = log.memberAvatar,
                            name = log.memberName,
                            modifier = Modifier.size(40.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = log.memberName,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (log.distanceMeters != null) {
                                Text(
                                    text = "${"%.0f".format(log.distanceMeters)} m from branch",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        if (log.isLocationVerified) {
                            StatusTag(text = "Verified", color = Emerald500)
                        } else {
                            StatusTag(text = log.shiftStatus.toLabel(), color = Amber500)
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    Row(modifier = Modifier.fillMaxWidth()) {
                        TimeBlock(label = "Checked in", value = log.checkInTime.toDisplayTime(), modifier = Modifier.weight(1f))
                        TimeBlock(
                            label = "Checked out",
                            value = log.checkOutTime?.toDisplayTime() ?: "Still on shift",
                            muted = log.checkOutTime == null,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TimeBlock(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    muted: Boolean = false
) {
    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = if (muted) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface
        )
    }
}

// ---------------------------------------------------------------------------
// Sales tab
// ---------------------------------------------------------------------------

@Composable
fun BranchSalesTab(
    sales: List<BranchSaleItem>,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    if (isLoading) {
        TabContentBox { ListSkeleton(count = 4) }
        return
    }
    if (sales.isEmpty()) {
        TabContentBox {
            EmptyStateCard(
                title = "No recent sales",
                description = "Transactions made at this branch will appear here."
            )
        }
        return
    }

    LazyColumn(
        contentPadding = ListPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item { SectionHeader("Recent sales", count = sales.size) }

        items(sales, key = { it.id }) { sale ->
            val statusColor = if (sale.status == "COMPLETED") Emerald500 else Amber500
            SurfaceCard {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Order #${sale.transactionNumber}",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold)
                            )
                            Text(
                                text = "${sale.customerName}  •  ${sale.cashierName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(
                            text = "${sale.currencyCode} ${"%,.2f".format(sale.totalAmount)}",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = sale.createdAt.toDisplayTime(),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        StatusTag(text = sale.status.toLabel(), color = statusColor)
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Stock tab
// ---------------------------------------------------------------------------

@Composable
fun BranchStockMovementsTab(
    movements: List<BranchStockMovementItem>,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    if (isLoading) {
        TabContentBox { ListSkeleton(count = 4) }
        return
    }
    if (movements.isEmpty()) {
        TabContentBox {
            EmptyStateCard(
                title = "No stock movements",
                description = "Inventory moving in or out of this branch will appear here."
            )
        }
        return
    }

    LazyColumn(
        contentPadding = ListPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        item { SectionHeader("Recent stock movements", count = movements.size) }

        items(movements, key = { it.id }) { mov ->
            val isIn = mov.direction == "IN"
            val qtyColor = if (isIn) Emerald500 else Rose500

            SurfaceCard {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = mov.variantName,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold)
                            )
                            Text(
                                text = if (isIn) "From ${mov.fromLocationName ?: "supplier or adjustment"}"
                                else "To ${mov.toLocationName ?: "customer or outgoing"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "${if (isIn) "+" else "−"}${"%,.2f".format(mov.quantity)}",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = qtyColor
                            )
                            StatusTag(text = mov.movementType.toLabel().replace("_", " "), color = qtyColor)
                        }
                    }

                    if (!mov.notes.isNullOrEmpty()) {
                        Text(
                            text = mov.notes,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = mov.performedBy,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = mov.timestamp.toDisplayTime(),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}