package tech.scryme.admin.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import tech.scryme.admin.data.session.SessionManagerImpl
import tech.scryme.admin.presentation.viewmodel.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboard(
    userName: String,
    userEmail: String,
    activeOrgName: String,
    activeOrgSlug: String,
    presenceViewModel: PresenceViewModel,
    approvalsViewModel: ApprovalsViewModel,
    analyticsViewModel: AnalyticsViewModel,
    announcementViewModel: AnnouncementViewModel,
    expenseViewModel: ExpenseViewModel,
    shiftsViewModel: ShiftsViewModel? = null,
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
    val orgDetailsState by presenceViewModel.organizationDetails.collectAsState()

    val orgTransactionsState by presenceViewModel.organizationTransactions.collectAsState()

    val priceChangeRequestsState by approvalsViewModel.priceChanges.collectAsState()
    val stockAdjustmentsState by approvalsViewModel.stockAdjustments.collectAsState()

    val analyticsState by analyticsViewModel.analyticsState.collectAsState()
    val expensesState by expenseViewModel.expensesState.collectAsState()
    val categoriesState by expenseViewModel.categoriesState.collectAsState()

    val activeOrgId by sessionManager.activeOrgId.collectAsState()

    LaunchedEffect(Unit) {
        presenceViewModel.fetchOrganizationDetails()
        presenceViewModel.fetchBranches()
        presenceViewModel.fetchCheckedInMembers()
        presenceViewModel.fetchOrganizationTransactions()
        approvalsViewModel.loadPriceChangeRequests()
        approvalsViewModel.loadStockAdjustments()
        analyticsViewModel.loadDashboardAnalytics()
        expenseViewModel.loadExpenses()
        expenseViewModel.loadCategories()
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            AdminDrawerContent(
                activeOrgName = activeOrgName,
                activeOrgSlug = activeOrgSlug,
                userName = userName,
                userEmail = userEmail,
                selectedTab = selectedTab,
                onSelectTab = { selectedTab = it },
                onCloseDrawer = { scope.launch { drawerState.close() } },
                onSignOut = onSignOut
            )
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
                                    7 -> "Shifts & Staff Roster"
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
                                contentDescription = "Open Navigation Drawer",
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
                        selected = selectedTab == 7,
                        onClick = {
                            selectedTab = 7
                            shiftsViewModel?.loadShifts()
                        },
                        icon = { Icon(Icons.Default.Schedule, contentDescription = "Shifts") },
                        label = { Text("Shifts") }
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
                        branches = branches,
                        orgDetailsState = orgDetailsState,
                        transactionsState = orgTransactionsState,
                        priceChangeRequestsState = priceChangeRequestsState,
                        stockAdjustmentsState = stockAdjustmentsState,
                        presenceState = presenceState,
                        selectedBranchId = selectedBranchId,
                        onSelectBranch = { branchId -> presenceViewModel.selectBranchForDetail(branchId) },
                        onOpenQrScanner = { showQrScanner = true }
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
                        orgDetailsState = orgDetailsState,
                        sessionManager = sessionManager,
                        onSignOut = onSignOut
                    )
                    7 -> {
                        if (shiftsViewModel != null) {
                            ShiftsView(
                                shiftsViewModel = shiftsViewModel,
                                presenceViewModel = presenceViewModel
                            )
                        } else {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("Shifts module unavailable")
                            }
                        }
                    }
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
                deviceAuthViewModel.onQrCodeScanned(qr, selectedBranchId)
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
