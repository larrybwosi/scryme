package tech.scryme.admin.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import tech.scryme.admin.data.model.*
import tech.scryme.admin.data.session.SessionManagerImpl
import tech.scryme.admin.presentation.viewmodel.*

data class DrawerMenuItem(
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val targetTab: Int
)

data class TaskAlertItem(
    val type: String,
    val title: String,
    val status: String,
    val due: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboard(
    userName: String,
    userEmail: String,
    activeOrgName: String,
    activeOrgSlug: String,
    sessionToken: String,
    presenceViewModel: PresenceViewModel,
    approvalsViewModel: ApprovalsViewModel,
    analyticsViewModel: AnalyticsViewModel,
    announcementViewModel: AnnouncementViewModel,
    expenseViewModel: ExpenseViewModel,
    deviceAuthViewModel: DeviceAuthViewModel? = null,
    sessionManager: SessionManagerImpl,
    onSignOut: () -> Unit
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var selectedTab by remember { mutableIntStateOf(0) }
    var showQrScanner by remember { mutableStateOf(false) }
    var showAiAssistantSheet by remember { mutableStateOf(false) }

    val deviceAuthState = deviceAuthViewModel?.uiState?.collectAsState()?.value
    val branches by presenceViewModel.branches.collectAsState()
    val presenceState by presenceViewModel.presenceState.collectAsState()
    val selectedBranchId by presenceViewModel.selectedBranchId.collectAsState()

    val branchSales by presenceViewModel.branchSales.collectAsState()
    val memberSalesList by presenceViewModel.memberSalesList.collectAsState()
    val orgTransactionsState by presenceViewModel.organizationTransactions.collectAsState()

    val priceChangeRequestsState by approvalsViewModel.priceChanges.collectAsState()
    val stockAdjustmentsState by approvalsViewModel.stockAdjustments.collectAsState()

    val analyticsState by analyticsViewModel.analyticsState.collectAsState()
    val expensesState by expenseViewModel.expensesState.collectAsState()
    val categoriesState by expenseViewModel.categoriesState.collectAsState()

    val activeOrgId by sessionManager.activeOrgId.collectAsState()

    LaunchedEffect(Unit) {
        presenceViewModel.fetchBranches()
        presenceViewModel.fetchCheckedInMembers()
        presenceViewModel.fetchOrganizationTransactions()
        approvalsViewModel.loadPriceChangeRequests()
        approvalsViewModel.loadStockAdjustments()
        analyticsViewModel.loadDashboardAnalytics()
        expenseViewModel.loadExpenses()
        expenseViewModel.loadCategories()
    }

    val drawerItems = listOf(
        DrawerMenuItem("Dashboard", Icons.Default.GridView, targetTab = 0),
        DrawerMenuItem("Transactions", Icons.Default.ShoppingBag, targetTab = 1),
        DrawerMenuItem("Approvals", Icons.Default.Event, targetTab = 2),
        DrawerMenuItem("Staff & Presence", Icons.Default.PeopleOutline, targetTab = 3),
        DrawerMenuItem("Expenses", Icons.Default.ReceiptLong, targetTab = 4),
        DrawerMenuItem("Announcements", Icons.Default.Campaign, targetTab = 5),
        DrawerMenuItem("Settings", Icons.Default.Settings, targetTab = 6)
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.width(300.dp),
                drawerContainerColor = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.primary),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.GridView,
                                    contentDescription = "Logo",
                                    tint = MaterialTheme.colorScheme.onPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = activeOrgName.ifBlank { "Scryme Admin" },
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1
                                )
                                Text(
                                    text = "Slug: $activeOrgSlug",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        IconButton(onClick = { scope.launch { drawerState.close() } }) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close Menu",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = userName.take(1).uppercase(),
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = userName,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = userEmail,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(12.dp))

                    LazyColumn(modifier = Modifier.weight(1f)) {
                        items(drawerItems) { item ->
                            val isSelected = selectedTab == item.targetTab
                            NavigationDrawerItem(
                                icon = {
                                    Icon(
                                        item.icon,
                                        contentDescription = item.title,
                                        tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                },
                                label = {
                                    Text(
                                        item.title,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                    )
                                },
                                selected = isSelected,
                                onClick = {
                                    selectedTab = item.targetTab
                                    scope.launch { drawerState.close() }
                                },
                                modifier = Modifier.padding(vertical = 2.dp),
                                colors = NavigationDrawerItemDefaults.colors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                    selectedIconColor = MaterialTheme.colorScheme.primary,
                                    selectedTextColor = MaterialTheme.colorScheme.primary
                                )
                            )
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onSignOut() }
                            .padding(vertical = 10.dp, horizontal = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                            contentDescription = "Sign Out",
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "Sign Out",
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                text = when (selectedTab) {
                                    0 -> "Dashboard Overview"
                                    1 -> "Transactions & Sales"
                                    2 -> "Administrative Approvals"
                                    3 -> "Staff Presence & Attendance"
                                    4 -> "Expenses Management"
                                    5 -> "Broadcast Announcements"
                                    6 -> "Settings & Preferences"
                                    else -> "Dashboard"
                                },
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = activeOrgName,
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "Open Drawer",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = { showAiAssistantSheet = true }) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = "AI Assist",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                        IconButton(onClick = { showQrScanner = true }) {
                            Icon(
                                imageVector = Icons.Default.QrCodeScanner,
                                contentDescription = "Scan POS QR",
                                tint = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        icon = { Icon(Icons.Default.GridView, contentDescription = "Dashboard") },
                        label = { Text("Overview") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = {
                            selectedTab = 1
                            presenceViewModel.fetchOrganizationTransactions()
                        },
                        icon = { Icon(Icons.Default.ShoppingBag, contentDescription = "Shop") },
                        label = { Text("Shop") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = {
                            selectedTab = 2
                            approvalsViewModel.loadPriceChangeRequests()
                            approvalsViewModel.loadStockAdjustments()
                        },
                        icon = { Icon(Icons.Default.Event, contentDescription = "Approvals") },
                        label = { Text("Approvals") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 3,
                        onClick = {
                            selectedTab = 3
                            presenceViewModel.fetchCheckedInMembers()
                        },
                        icon = { Icon(Icons.Default.PeopleOutline, contentDescription = "Presence") },
                        label = { Text("Presence") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 6,
                        onClick = { selectedTab = 6 },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings") }
                    )
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(paddingValues)
                    .padding(16.dp)
            ) {
                when (selectedTab) {
                    0 -> OverviewDashboardView(
                        userName = userName,
                        userEmail = userEmail,
                        activeOrg = activeOrgName,
                        branches = branches,
                        selectedBranchId = selectedBranchId,
                        branchSales = branchSales,
                        memberSalesList = memberSalesList,
                        onSelectBranch = { branchId -> presenceViewModel.selectBranchForDetail(branchId) },
                        onOpenQrScanner = { showQrScanner = true },
                        onOpenAiAssist = { showAiAssistantSheet = true }
                    )
                    1 -> OrganizationTransactionsView(
                        branches = branches,
                        transactionsState = orgTransactionsState,
                        onFilterByBranch = { locationId ->
                            presenceViewModel.fetchOrganizationTransactions(locationId)
                        }
                    )
                    2 -> ApprovalsView(
                        priceChangeRequestsState = priceChangeRequestsState,
                        stockAdjustmentsState = stockAdjustmentsState,
                        onReviewPrice = { id, approve, reason ->
                            approvalsViewModel.reviewPriceChange(id, approve, reason)
                        },
                        onReviewStock = { id, approve, reason ->
                            approvalsViewModel.reviewStockAdjustment(id, approve, reason)
                        }
                    )
                    3 -> PresenceView(
                        presenceState = presenceState,
                        analyticsState = analyticsState,
                        onForceCheckout = { memberId ->
                            presenceViewModel.forceCheckoutMember(memberId)
                        }
                    )
                    4 -> ExpenseManagementView(
                        expensesState = expensesState,
                        categoriesState = categoriesState,
                        expenseViewModel = expenseViewModel
                    )
                    5 -> BroadcastAnnouncementView(
                        branches = branches,
                        announcementViewModel = announcementViewModel
                    )
                    6 -> SettingsView(
                        userName = userName,
                        userEmail = userEmail,
                        activeOrgName = activeOrgName,
                        activeOrgSlug = activeOrgSlug,
                        activeOrgId = activeOrgId ?: "N/A",
                        sessionManager = sessionManager,
                        onSignOut = onSignOut
                    )
                }
            }
        }
    }

    if (showAiAssistantSheet) {
        AiAssistantModalSheet(onDismiss = { showAiAssistantSheet = false })
    }

    if (showQrScanner && deviceAuthViewModel != null) {
        QrScannerDialog(
            onDismissRequest = { showQrScanner = false },
            onQrCodeScanned = { qr ->
                showQrScanner = false
                deviceAuthViewModel.onQrCodeScanned(qr)
            }
        )
    }

    deviceAuthState?.let { state ->
        when (state) {
            is UiState.Loading -> {
                AlertDialog(
                    onDismissRequest = {},
                    title = { Text("Authorizing POS Terminal") },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(16.dp))
                            Text("Provisioning device with organization...")
                        }
                    },
                    confirmButton = {}
                )
            }
            is UiState.Success -> {
                AlertDialog(
                    onDismissRequest = { deviceAuthViewModel.resetState() },
                    title = { Text("POS Device Authorized!", fontWeight = FontWeight.Bold) },
                    text = {
                        Text(
                            "Device ${state.data.device?.deviceName ?: "Terminal"} has been successfully authorized for your organization."
                        )
                    },
                    confirmButton = {
                        Button(onClick = { deviceAuthViewModel.resetState() }) {
                            Text("OK")
                        }
                    }
                )
            }
            is UiState.Error -> {
                AlertDialog(
                    onDismissRequest = { deviceAuthViewModel.resetState() },
                    title = { Text("Authorization Failed", color = MaterialTheme.colorScheme.error) },
                    text = { Text(state.message) },
                    confirmButton = {
                        Button(onClick = { deviceAuthViewModel.resetState() }) {
                            Text("Dismiss")
                        }
                    }
                )
            }
            UiState.Idle -> {}
        }
    }
}

@Composable
fun OverviewDashboardView(
    userName: String,
    userEmail: String,
    activeOrg: String,
    branches: List<LocationDto>,
    selectedBranchId: String?,
    branchSales: Double,
    memberSalesList: List<MemberSalesDto>,
    onSelectBranch: (String) -> Unit,
    onOpenQrScanner: () -> Unit,
    onOpenAiAssist: () -> Unit
) {
    val taskAlerts = remember {
        listOf(
            TaskAlertItem("Pending Approval", "Review new price request...", "Awaiting", "Today"),
            TaskAlertItem("Stock Adjustment", "Stock variance at Main Branch...", "Pending", "Today"),
            TaskAlertItem("POS Sync", "Terminal authorization active...", "Active", "Today"),
            TaskAlertItem("Attendance", "Staff shift starting soon...", "Scheduled", "Tomorrow"),
            TaskAlertItem("System Audit", "Monthly organization check...", "Completed", "This Week")
        )
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
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Organization Revenue", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(formatCurrency(12867.0, "USD"), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.AutoMirrored.Filled.TrendingUp, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("+8.2% vs Last Week", fontSize = 11.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Medium)
                        }
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Active Branches", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${branches.size}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(if (branches.isNotEmpty()) branches.first().name else "No active locations", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Pending Approvals", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("3", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Price & Inventory Review", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Active Members", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("1,867", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.AutoMirrored.Filled.TrendingUp, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("52 New this week", fontSize = 11.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("To-Do & Alerts", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        TextButton(onClick = {}) {
                            Text("View All", fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Type", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1.2f))
                        Text("Title", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1.5f))
                        Text("Status", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                        Text("Due", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(0.8f))
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    taskAlerts.forEach { task ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
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
                                Text(task.type, fontSize = 11.sp, maxLines = 1, color = MaterialTheme.colorScheme.onSurface)
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
                                Text(
                                    text = "• " + task.status,
                                    fontSize = 11.sp,
                                    color = statusColor,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Text(task.due, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(0.8f))
                        }
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Organization Branches (${branches.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = onOpenQrScanner,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Authorize POS Terminal (Scan QR)")
                    }

                    if (branches.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        branches.forEach { branch ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onSelectBranch(branch.id) }
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(branch.name, fontWeight = FontWeight.Medium, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface)
                                    Text(if (branch.isActive) "Active Location" else "Inactive", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Text(
                                    if (branch.id == selectedBranchId) "Selected" else "View",
                                    color = MaterialTheme.colorScheme.primary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiAssistantModalSheet(onDismiss: () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("Welcome Scryme AI", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Text(
                "Streamline tasks, automate workflows, and grow your organization intelligently.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 16.dp),
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(20.dp))
            Text("What's Next?", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = {}, shape = RoundedCornerShape(20.dp)) { Text("Take A Tour", fontSize = 12.sp) }
                OutlinedButton(onClick = {}, shape = RoundedCornerShape(20.dp)) { Text("What's New", fontSize = 12.sp) }
                OutlinedButton(onClick = {}, shape = RoundedCornerShape(20.dp)) { Text("View Actions", fontSize = 12.sp) }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(28.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    "Request AI Assist...",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 14.sp,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Send,
                        contentDescription = "Send",
                        tint = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun OrganizationTransactionsView(
    branches: List<LocationDto>,
    transactionsState: UiState<List<TransactionDto>>,
    onFilterByBranch: (String?) -> Unit
) {
    var selectedBranchFilter by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize()) {
        Text("Transactions Across Branches", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FilterChip(
                selected = selectedBranchFilter == null,
                onClick = {
                    selectedBranchFilter = null
                    onFilterByBranch(null)
                },
                label = { Text("All Branches") }
            )
            Spacer(modifier = Modifier.width(8.dp))
            branches.take(3).forEach { branch ->
                FilterChip(
                    selected = selectedBranchFilter == branch.id,
                    onClick = {
                        selectedBranchFilter = branch.id
                        onFilterByBranch(branch.id)
                    },
                    label = { Text(branch.name) },
                    modifier = Modifier.padding(end = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (transactionsState) {
            is UiState.Loading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            is UiState.Success -> {
                val transactions = transactionsState.data
                if (transactions.isEmpty()) {
                    Text("No transactions found for this selection.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(transactions) { tx ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("TX #${tx.id.takeLast(8)}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                        Text(
                                            formatCurrency(tx.effectiveAmount(), tx.currencyCode),
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Status: ${tx.status ?: "COMPLETED"}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(tx.createdAt ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> Text(transactionsState.message, color = MaterialTheme.colorScheme.error)
            UiState.Idle -> Text("Select a branch filter to inspect transactions.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun ApprovalsView(
    priceChangeRequestsState: UiState<List<PriceChangeRequestDto>>,
    stockAdjustmentsState: UiState<List<StockAdjustmentResponseDto>>,
    onReviewPrice: (String, Boolean, String?) -> Unit,
    onReviewStock: (String, Boolean, String?) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        item {
            Text("Pending Administrative Approvals", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(12.dp))
            Text("Price Change Requests", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (priceChangeRequestsState) {
            is UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Success -> {
                val requests = priceChangeRequestsState.data
                if (requests.isEmpty()) {
                    item { Text("No pending price change requests.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                } else {
                    items(requests) { req ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Variant ID: ${req.variantId}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("Old Price: $${req.oldPrice} -> New Price: $${req.newPrice}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { onReviewPrice(req.id, false, "Rejected by Admin") }) { Text("Reject") }
                                    Button(onClick = { onReviewPrice(req.id, true, null) }) { Text("Approve") }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> item { Text(priceChangeRequestsState.message, color = MaterialTheme.colorScheme.error) }
            UiState.Idle -> {}
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
            Text("Stock Adjustments", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (stockAdjustmentsState) {
            is UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Success -> {
                val adjustments = stockAdjustmentsState.data
                if (adjustments.isEmpty()) {
                    item { Text("No pending stock adjustments.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                } else {
                    items(adjustments) { adj ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Adjustment: ${adj.reason}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                Text("Quantity: ${adj.quantity}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { onReviewStock(adj.id, false, "Rejected by Admin") }) { Text("Reject") }
                                    Button(onClick = { onReviewStock(adj.id, true, null) }) { Text("Approve") }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> item { Text(stockAdjustmentsState.message, color = MaterialTheme.colorScheme.error) }
            UiState.Idle -> {}
        }
    }
}

@Composable
fun PresenceView(
    presenceState: UiState<List<MemberResponseDto>>,
    analyticsState: UiState<DashboardAnalyticsDto>,
    onForceCheckout: (String) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        item {
            Text("Staff Presence & Active Roster", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Spacer(modifier = Modifier.height(12.dp))
        }

        when (analyticsState) {
            is UiState.Success -> {
                val stats = analyticsState.data
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Total Checked In Now: ${stats.totalCheckedInNow}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
            else -> {}
        }

        when (presenceState) {
            is UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Success -> {
                val members = presenceState.data
                if (members.isEmpty()) {
                    item { Text("No active staff online currently.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                } else {
                    items(members) { member ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(member.user.name ?: member.user.email, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                    Text("Role: ${member.role}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Button(onClick = { onForceCheckout(member.id) }) {
                                    Text("Force Checkout")
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> item { Text(presenceState.message, color = MaterialTheme.colorScheme.error) }
            UiState.Idle -> {}
        }
    }
}

@Composable
fun ExpenseManagementView(
    expensesState: UiState<List<ExpenseDto>>,
    categoriesState: UiState<List<ExpenseCategoryDto>>,
    expenseViewModel: ExpenseViewModel
) {
    var showCreateModal by remember { mutableStateOf(false) }
    var description by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf("CASH") }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Organization Expenses", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Button(onClick = { showCreateModal = true }) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Expense")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (expensesState) {
            is UiState.Loading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            is UiState.Success -> {
                val list = expensesState.data
                if (list.isEmpty()) {
                    Text("No recorded expenses.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(list) { exp ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(exp.description, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                        Text(formatCurrency(exp.amount, "USD"), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Category: ${exp.category?.name ?: "General"} • Status: ${exp.status}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        if (exp.status.equals("PENDING", ignoreCase = true)) {
                                            TextButton(onClick = { expenseViewModel.approveExpense(exp.id) }) {
                                                Text("Approve")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> Text(expensesState.message, color = MaterialTheme.colorScheme.error)
            UiState.Idle -> {}
        }
    }

    if (showCreateModal) {
        AlertDialog(
            onDismissRequest = { showCreateModal = false },
            title = { Text("Create Expense Request") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Description") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Amount ($)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = paymentMethod,
                        onValueChange = { paymentMethod = it },
                        label = { Text("Payment Method (CASH/MPESA/CARD)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = amountText.toDoubleOrNull() ?: 0.0
                        val catId = selectedCategoryId.ifEmpty {
                            if (categoriesState is UiState.Success && categoriesState.data.isNotEmpty()) {
                                categoriesState.data.first().id
                            } else "general"
                        }
                        expenseViewModel.createExpense(description, amount, catId, paymentMethod)
                        showCreateModal = false
                        description = ""
                        amountText = ""
                    }
                ) {
                    Text("Submit Expense")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateModal = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun BroadcastAnnouncementView(
    branches: List<LocationDto>,
    announcementViewModel: AnnouncementViewModel
) {
    var title by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var selectedBranchId by remember { mutableStateOf<String?>(null) }
    var severity by remember { mutableStateOf("INFO") }

    val announcementState by announcementViewModel.announcementState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        Text("Broadcast Announcement", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(12.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("Announcement Message") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("INFO", "WARNING", "URGENT").forEach { level ->
                        FilterChip(
                            selected = severity == level,
                            onClick = { severity = level },
                            label = { Text(level) }
                        )
                    }
                }

                Button(
                    onClick = {
                        if (title.isNotBlank() && message.isNotBlank()) {
                            announcementViewModel.broadcastAnnouncement(title, message, selectedBranchId, severity)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = announcementState !is UiState.Loading
                ) {
                    if (announcementState is UiState.Loading) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Icon(Icons.Default.Campaign, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Broadcast Announcement")
                    }
                }

                if (announcementState is UiState.Success) {
                    Text("Announcement successfully sent!", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                } else if (announcementState is UiState.Error) {
                    Text((announcementState as UiState.Error).message, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
fun SettingsView(
    userName: String,
    userEmail: String,
    activeOrgName: String,
    activeOrgSlug: String,
    activeOrgId: String,
    sessionManager: SessionManagerImpl,
    onSignOut: () -> Unit
) {
    val currentTheme by sessionManager.themePreference.collectAsState()
    val syncInterval by sessionManager.syncIntervalSeconds.collectAsState()
    val notificationsEnabled by sessionManager.notificationsEnabled.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Settings & Customization", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Appearance & Theme", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("Light", "Dark", "System").forEach { themeMode ->
                            FilterChip(
                                selected = currentTheme.equals(themeMode, ignoreCase = true),
                                onClick = { sessionManager.saveThemePreference(themeMode) },
                                label = { Text(themeMode) }
                            )
                        }
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Active Session & Organization", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(8.dp))

                    Text("User: $userName ($userEmail)", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text("Organization Name: $activeOrgName", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text("Organization Slug: $activeOrgSlug", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Organization ID: $activeOrgId", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("System Preferences", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Enable Background Sync", color = MaterialTheme.colorScheme.onSurface)
                        Switch(
                            checked = notificationsEnabled,
                            onCheckedChange = { sessionManager.saveNotificationsEnabled(it) }
                        )
                    }
                }
            }
        }

        item {
            Button(
                onClick = onSignOut,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out")
            }
        }
    }
}
