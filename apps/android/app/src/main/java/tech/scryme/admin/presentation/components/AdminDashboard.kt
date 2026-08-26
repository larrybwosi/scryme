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

data class DrawerMenuItem(val title: String, val icon: androidx.compose.ui.graphics.vector.ImageVector, val isSelected: Boolean = false)
data class TaskAlertItem(val type: String, val title: String, val status: String, val due: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboard(
    userName: String,
    userEmail: String,
    activeOrg: String,
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
    var selectedDrawerItem by remember { mutableStateOf("Dashboard") }
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

    LaunchedEffect(Unit) {
        presenceViewModel.fetchBranches()
        presenceViewModel.fetchCheckedInMembers()
        presenceViewModel.fetchOrganizationTransactions()
        approvalsViewModel.loadPriceChangeRequests()
        approvalsViewModel.loadStockAdjustments()
        analyticsViewModel.loadDashboardAnalytics()
    }

    val drawerItems = listOf(
        DrawerMenuItem("Dashboard", Icons.Default.GridView, selectedDrawerItem == "Dashboard"),
        DrawerMenuItem("People", Icons.Default.PeopleOutline, selectedDrawerItem == "People"),
        DrawerMenuItem("Prayer Time", Icons.Default.Schedule, selectedDrawerItem == "Prayer Time"),
        DrawerMenuItem("Events", Icons.Default.Event, selectedDrawerItem == "Events"),
        DrawerMenuItem("Programs", Icons.Default.FolderOpen, selectedDrawerItem == "Programs"),
        DrawerMenuItem("Donations", Icons.Default.VolunteerActivism, selectedDrawerItem == "Donations"),
        DrawerMenuItem("Assistance", Icons.Default.Support, selectedDrawerItem == "Assistance"),
        DrawerMenuItem("Website", Icons.Default.Language, selectedDrawerItem == "Website"),
        DrawerMenuItem("Facility", Icons.Default.Apartment, selectedDrawerItem == "Facility"),
        DrawerMenuItem("Posts", Icons.Default.Article, selectedDrawerItem == "Posts"),
        DrawerMenuItem("Shop", Icons.Default.ShoppingBag, selectedDrawerItem == "Shop"),
        DrawerMenuItem("Service", Icons.Default.Build, selectedDrawerItem == "Service"),
        DrawerMenuItem("Announcements", Icons.Default.Campaign, selectedDrawerItem == "Announcements"),
        DrawerMenuItem("Settings", Icons.Default.Settings, selectedDrawerItem == "Settings")
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.width(300.dp),
                drawerContainerColor = Color.White
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
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = if (activeOrg.isNotBlank() && activeOrg != "The Operating Ledger") activeOrg else "Scryme Admin",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        IconButton(onClick = { scope.launch { drawerState.close() } }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close Menu")
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF8FAFC))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFCBD5E1)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = userName.take(1).uppercase(),
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF334155)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = userName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(text = "Admin", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                    Spacer(modifier = Modifier.height(12.dp))

                    LazyColumn(modifier = Modifier.weight(1f)) {
                        items(drawerItems) { item ->
                            NavigationDrawerItem(
                                icon = { Icon(item.icon, contentDescription = item.title) },
                                label = { Text(item.title, fontWeight = if (item.isSelected) FontWeight.Bold else FontWeight.Normal) },
                                selected = item.isSelected,
                                onClick = {
                                    selectedDrawerItem = item.title
                                    scope.launch { drawerState.close() }
                                    when (item.title) {
                                        "Dashboard" -> selectedTab = 0
                                        "Shop" -> selectedTab = 1
                                        "Events", "Donations" -> selectedTab = 2
                                        "People", "Prayer Time" -> selectedTab = 3
                                    }
                                },
                                modifier = Modifier.padding(vertical = 2.dp),
                                colors = NavigationDrawerItemDefaults.colors(
                                    selectedContainerColor = Color(0xFFEFF6FF),
                                    selectedIconColor = MaterialTheme.colorScheme.primary,
                                    selectedTextColor = MaterialTheme.colorScheme.primary
                                )
                            )
                        }
                    }

                    HorizontalDivider(color = Color(0xFFF1F5F9))
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
                            tint = Color(0xFF64748B)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Sign Out", color = Color(0xFF64748B), fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = "Dashboard",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(imageVector = Icons.Default.Menu, contentDescription = "Open Drawer")
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
                                contentDescription = "Scan POS QR"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.White
                    )
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = Color.White,
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        icon = { Icon(Icons.Default.GridView, contentDescription = "Dashboard") },
                        label = { Text("Dashboard") }
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
                        icon = { Icon(Icons.Default.Event, contentDescription = "Events") },
                        label = { Text("Events") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 3,
                        onClick = {
                            selectedTab = 3
                            presenceViewModel.fetchCheckedInMembers()
                        },
                        icon = { Icon(Icons.Default.Schedule, contentDescription = "Prayer Time") },
                        label = { Text("Prayer Time") }
                    )
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFFF8FAFC))
                    .padding(paddingValues)
                    .padding(16.dp)
            ) {
                when (selectedTab) {
                    0 -> OverviewDashboardView(
                        userName = userName,
                        userEmail = userEmail,
                        activeOrg = activeOrg,
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
            TaskAlertItem("Pending Approval", "Review new donation...", "Awaiting", "Today"),
            TaskAlertItem("Pending Approval", "Finalize donation...", "Pending", "Today"),
            TaskAlertItem("Upcoming Event", "Finalize donation...", "Not Done", "Today"),
            TaskAlertItem("New Message", "Finalize donation...", "Now", "Tomorrow"),
            TaskAlertItem("System Setup", "Finalize donation...", "Awaiting", "This Week")
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
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Donations", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$12,867", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TrendingUp, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("8.2% Last Week", fontSize = 11.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Medium)
                        }
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Active Campaigns", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("18", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Zakat, Renovation, Education...", fontSize = 11.sp, color = Color.Gray, maxLines = 1)
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
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Upcoming Events", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("3", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Family Night", fontSize = 11.sp, color = Color.Gray)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Active Members", style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("1,867", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TrendingUp, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
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
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Fajar", fontSize = 11.sp, color = Color.Gray)
                            Text("5:32 AM", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Khateeb", fontSize = 11.sp, color = Color.Gray)
                            Text("Imam Kareem", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("12:30 PM", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                    Text("Next Salah", fontSize = 11.sp, color = Color.Gray)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        listOf("Fajar 5:32 AM", "Dhuhr 12:30 PM", "Asr 4:30 PM", "Magrib 6:42 PM", "Isha 8:30 PM").forEach { item ->
                            val parts = item.split(" ")
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(parts[0], fontSize = 10.sp, color = Color.Gray)
                                Text(parts[1] + " " + parts[2], fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("To-Do & Alerts", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
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
                        Text("Type", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.weight(1.2f))
                        Text("Title", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.weight(1.5f))
                        Text("Status", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.weight(1f))
                        Text("Due", fontSize = 11.sp, color = Color.Gray, modifier = Modifier.weight(0.8f))
                    }

                    HorizontalDivider(color = Color(0xFFF1F5F9))

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
                                        .background(Color.Gray)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(task.type, fontSize = 11.sp, maxLines = 1)
                            }

                            Text(task.title, fontSize = 11.sp, modifier = Modifier.weight(1.5f), maxLines = 1)

                            Box(modifier = Modifier.weight(1f)) {
                                val statusColor = when (task.status) {
                                    "Awaiting" -> Color(0xFF3B82F6)
                                    "Pending" -> Color(0xFFF59E0B)
                                    "Not Done" -> Color(0xFF64748B)
                                    "Now" -> Color(0xFF10B981)
                                    else -> Color.Gray
                                }
                                Text(
                                    text = "• " + task.status,
                                    fontSize = 11.sp,
                                    color = statusColor,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Text(task.due, fontSize = 11.sp, color = Color.Gray, modifier = Modifier.weight(0.8f))
                        }
                        HorizontalDivider(color = Color(0xFFF8FAFC))
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Organization Branches (${branches.size})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
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
                        branches.take(3).forEach { branch ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onSelectBranch(branch.id) }
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(branch.name, fontWeight = FontWeight.Medium, fontSize = 13.sp)
                                Text(
                                    if (branch.id == selectedBranchId) "Selected" else "View",
                                    color = MaterialTheme.colorScheme.primary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
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
        containerColor = Color.White
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
                    tint = Color.White,
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("Welcome Scryme AI", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(
                "Streamline tasks, automate workflows, and grow your organization intelligently.",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.padding(horizontal = 16.dp),
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(20.dp))
            Text("What's Next?", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
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
                    .background(Color(0xFFF1F5F9))
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
                    color = Color.Gray,
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
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun BranchesView(
    userName: String,
    userEmail: String,
    activeOrg: String,
    branches: List<LocationDto>,
    selectedBranchId: String?,
    branchSales: Double,
    memberSalesList: List<MemberSalesDto>,
    onSelectBranch: (String) -> Unit,
    onOpenQrScanner: () -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("User: $userName", style = MaterialTheme.typography.titleMedium)
                    Text("Email: $userEmail", style = MaterialTheme.typography.bodyMedium)
                    Text("Organization: $activeOrg", style = MaterialTheme.typography.bodyMedium)

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = onOpenQrScanner,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Authorize POS Terminal (Scan QR)")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("Organization Branches (${branches.size})", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))
        }

        if (branches.isEmpty()) {
            item {
                Text("No branches found or loaded.", style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            items(branches) { branch ->
                val isSelected = branch.id == selectedBranchId
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable { onSelectBranch(branch.id) },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(branch.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                            Text(if (branch.isActive) "Active Branch" else "Inactive", color = MaterialTheme.colorScheme.secondary)
                        }
                        if (isSelected) {
                            Text("Selected", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        if (selectedBranchId != null) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Branch Sales Inspector", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Total Sales: ${formatCurrency(branchSales, "USD")}", style = MaterialTheme.typography.bodyLarge)

                        if (memberSalesList.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("Sales Breakdown by Staff:", style = MaterialTheme.typography.labelLarge)
                            memberSalesList.forEach { mSales ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("${mSales.memberName} (${mSales.salesCount} sales)")
                                    Text(formatCurrency(mSales.totalAmount, "USD"), fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
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
        Text("Transactions Across Branches", style = MaterialTheme.typography.titleLarge)
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
                    Text("No transactions found.", style = MaterialTheme.typography.bodyMedium)
                } else {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(transactions) { tx ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("ID: ${tx.id.takeLast(8)}", fontWeight = FontWeight.Bold)
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
                                        Text("Status: ${tx.status ?: "COMPLETED"}", style = MaterialTheme.typography.bodySmall)
                                        Text(tx.createdAt ?: "", style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> Text(transactionsState.message, color = MaterialTheme.colorScheme.error)
            UiState.Idle -> Text("Select a filter to load transactions.")
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
            Text("Pending Administrative Approvals", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(12.dp))
            Text("Price Change Requests", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (priceChangeRequestsState) {
            is UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Success -> {
                val requests = priceChangeRequestsState.data
                if (requests.isEmpty()) {
                    item { Text("No pending price change requests.", style = MaterialTheme.typography.bodySmall) }
                } else {
                    items(requests) { req ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Variant ID: ${req.variantId}", fontWeight = FontWeight.Bold)
                                Text("Old Price: $${req.oldPrice} -> New Price: $${req.newPrice}")
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
            Text("Stock Adjustments", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (stockAdjustmentsState) {
            is UiState.Loading -> item { CircularProgressIndicator() }
            is UiState.Success -> {
                val adjustments = stockAdjustmentsState.data
                if (adjustments.isEmpty()) {
                    item { Text("No pending stock adjustments.", style = MaterialTheme.typography.bodySmall) }
                } else {
                    items(adjustments) { adj ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Adjustment: ${adj.reason}", fontWeight = FontWeight.Bold)
                                Text("Quantity: ${adj.quantity}")
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
            Text("Staff Presence & Active Roster", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(12.dp))
        }

        when (analyticsState) {
            is UiState.Success -> {
                val stats = analyticsState.data
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Total Checked In Now: ${stats.totalCheckedInNow}", fontWeight = FontWeight.Bold)
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
                    item { Text("No active staff online.", style = MaterialTheme.typography.bodyMedium) }
                } else {
                    items(members) { member ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(member.user.name ?: member.user.email, fontWeight = FontWeight.Bold)
                                    Text("Role: ${member.role}", style = MaterialTheme.typography.bodySmall)
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
