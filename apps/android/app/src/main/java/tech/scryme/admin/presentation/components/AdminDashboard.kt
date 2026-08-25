package tech.scryme.admin.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.scryme.admin.data.model.*
import tech.scryme.admin.data.session.SessionManagerImpl
import tech.scryme.admin.presentation.viewmodel.*

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
    var selectedTab by remember { mutableIntStateOf(0) }
    var showQrScanner by remember { mutableStateOf(false) }

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

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scryme Admin") },
                actions = {
                    IconButton(onClick = { showQrScanner = true }) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = "Scan POS QR"
                        )
                    }
                    IconButton(onClick = onSignOut) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Sign Out"
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Store, contentDescription = "Branches") },
                    label = { Text("Branches") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = {
                        selectedTab = 1
                        presenceViewModel.fetchOrganizationTransactions()
                    },
                    icon = { Icon(Icons.Default.Receipt, contentDescription = "Transactions") },
                    label = { Text("Sales") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = {
                        selectedTab = 2
                        approvalsViewModel.loadPriceChangeRequests()
                        approvalsViewModel.loadStockAdjustments()
                    },
                    icon = { Icon(Icons.Default.Approval, contentDescription = "Approvals") },
                    label = { Text("Approvals") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = {
                        selectedTab = 3
                        presenceViewModel.fetchCheckedInMembers()
                    },
                    icon = { Icon(Icons.Default.People, contentDescription = "Presence") },
                    label = { Text("Presence") }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            when (selectedTab) {
                0 -> BranchesView(
                    userName = userName,
                    userEmail = userEmail,
                    activeOrg = activeOrg,
                    branches = branches,
                    selectedBranchId = selectedBranchId,
                    branchSales = branchSales,
                    memberSalesList = memberSalesList,
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
            }
        }
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
