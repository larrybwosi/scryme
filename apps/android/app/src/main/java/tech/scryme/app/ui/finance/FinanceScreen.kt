package tech.scryme.app.ui.finance

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.*
import tech.scryme.app.ui.theme.Amber500
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

@Composable
fun FinanceScreen(
    viewModel: FinanceViewModel,
    onNavigateBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    if (!uiState.isAuthorized) {
        AccessRestricted(onNavigateBack = onNavigateBack, modifier = modifier)
        return
    }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.actionMessage) {
        uiState.actionMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearActionMessage()
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            FinanceHeader(
                selectedTab = uiState.selectedTab,
                isRefreshing = uiState.isRefreshing,
                onTabSelected = viewModel::selectTab,
                onRefresh = viewModel::refresh,
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedVisibility(
                visible = uiState.error != null,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = uiState.error.orEmpty(),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(onClick = viewModel::refresh) {
                            Text("Retry", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Crossfade(
                targetState = uiState.selectedTab,
                label = "finance-tab",
                modifier = Modifier.weight(1f)
            ) { tab ->
                when (tab) {
                    FinanceTab.EXPENSES -> ExpensesTabContent(
                        uiState = uiState,
                        onDatePresetSelected = viewModel::selectDatePreset,
                        onCustomDateRangeSelected = viewModel::setCustomDateRange,
                        onStatusSelected = viewModel::setStatusFilter,
                        onSearchChanged = viewModel::setSearchQuery,
                        onExpenseClick = viewModel::selectExpenseForDetails,
                        onRefresh = viewModel::refresh
                    )

                    FinanceTab.PETTY_CASH -> PettyCashTabContent(
                        funds = uiState.pettyCashFunds,
                        onFundClick = viewModel::selectFundForDetails,
                        onRefresh = viewModel::refresh
                    )

                    FinanceTab.UTILITIES -> UtilitiesTabContent(
                        utilities = uiState.utilityAccounts,
                        onUtilityClick = viewModel::selectUtilityForDetails,
                        onRefresh = viewModel::refresh
                    )
                }
            }
        }
    }

    // Detail Bottom Sheets
    uiState.selectedExpenseForDetails?.let { expense ->
        ExpenseDetailsBottomSheet(
            expense = expense,
            onDismiss = { viewModel.selectExpenseForDetails(null) },
            onApprove = { id -> viewModel.approveExpense(id) },
            onReject = { id, reason -> viewModel.rejectExpense(id, reason) }
        )
    }

    uiState.selectedFundForDetails?.let { fund ->
        PettyCashDetailsBottomSheet(
            fund = fund,
            transactions = uiState.selectedFundTransactions,
            isLoadingTransactions = uiState.isLoadingTransactions,
            onDismiss = { viewModel.selectFundForDetails(null) },
            onTopUp = { fundId, amount, desc -> viewModel.topUpPettyCash(fundId, amount, desc) }
        )
    }

    uiState.selectedUtilityForDetails?.let { utility ->
        UtilityDetailsBottomSheet(
            utility = utility,
            onDismiss = { viewModel.selectUtilityForDetails(null) },
            onExpenseClick = { exp ->
                viewModel.selectUtilityForDetails(null)
                viewModel.selectExpenseForDetails(exp)
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Header & Tab Navigation
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FinanceHeader(
    selectedTab: FinanceTab,
    isRefreshing: Boolean,
    onTabSelected: (FinanceTab) -> Unit,
    onRefresh: () -> Unit,
    onNavigateBack: (() -> Unit)?,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp
    ) {
        Column {
            TopAppBar(
                title = {
                    Text(
                        text = "Finance & Expenses",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    if (onNavigateBack != null) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh, enabled = !isRefreshing) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                    actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )

            TabRow(
                selectedTabIndex = selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary,
                divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) }
            ) {
                FinanceTab.values().forEach { tab ->
                    val selected = selectedTab == tab
                    Tab(
                        selected = selected,
                        onClick = { onTabSelected(tab) },
                        selectedContentColor = MaterialTheme.colorScheme.primary,
                        unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        text = {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = tab.icon(),
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = tab.title,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium
                                )
                            }
                        }
                    )
                }
            }

            Box(modifier = Modifier.fillMaxWidth().height(2.dp)) {
                if (isRefreshing) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
            }
        }
    }
}

private fun FinanceTab.icon(): ImageVector = when (this) {
    FinanceTab.EXPENSES -> Icons.Default.Receipt
    FinanceTab.PETTY_CASH -> Icons.Default.AccountBalanceWallet
    FinanceTab.UTILITIES -> Icons.Default.Bolt
}

// ---------------------------------------------------------------------------
// Expenses Tab Content
// ---------------------------------------------------------------------------

@Composable
private fun ExpensesTabContent(
    uiState: FinanceUiState,
    onDatePresetSelected: (DateRangePreset) -> Unit,
    onCustomDateRangeSelected: (String?, String?) -> Unit,
    onStatusSelected: (String?) -> Unit,
    onSearchChanged: (String) -> Unit,
    onExpenseClick: (ExpenseItem) -> Unit,
    onRefresh: () -> Unit
) {
    var showCustomDateDialog by remember { mutableStateOf(false) }
    var customStartInput by remember(uiState.customStartDate) { mutableStateOf(uiState.customStartDate ?: "") }
    var customEndInput by remember(uiState.customEndDate) { mutableStateOf(uiState.customEndDate ?: "") }
    val query = uiState.searchQuery.trim()
    val filteredExpenses = remember(uiState.expenses, query) {
        if (query.isBlank()) {
            uiState.expenses
        } else {
            uiState.expenses.filter {
                it.description.contains(query, ignoreCase = true) ||
                it.expenseNumber.contains(query, ignoreCase = true) ||
                it.categoryName.contains(query, ignoreCase = true) ||
                (it.requesterName != null && it.requesterName.contains(query, ignoreCase = true)) ||
                (it.notes != null && it.notes.contains(query, ignoreCase = true)) ||
                (it.locationName != null && it.locationName.contains(query, ignoreCase = true)) ||
                it.amount.contains(query, ignoreCase = true)
            }
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Date Presets row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DateRangePreset.values().forEach { preset ->
                    FilterChip(
                        selected = uiState.selectedDatePreset == preset,
                        onClick = {
                            if (preset == DateRangePreset.CUSTOM) {
                                showCustomDateDialog = true
                            } else {
                                onDatePresetSelected(preset)
                            }
                        },
                        label = {
                            Text(
                                text = if (preset == DateRangePreset.CUSTOM && uiState.customStartDate != null && uiState.customEndDate != null) {
                                    "${uiState.customStartDate} - ${uiState.customEndDate}"
                                } else {
                                    preset.label
                                },
                                fontSize = 12.sp
                            )
                        },
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
        }

        // Summary KPI Metrics
        uiState.expenseSummary?.let { summary ->
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Total Spend",
                            value = summary.totalAmount,
                            icon = Icons.Default.TrendingDown,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Pending Approvals",
                            value = summary.totalPending,
                            icon = Icons.Default.Schedule,
                            color = Amber500,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        MetricCard(
                            title = "Approved Spend",
                            value = summary.totalApproved,
                            icon = Icons.Default.CheckCircle,
                            color = Emerald500,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Rejected",
                            value = summary.totalRejected,
                            icon = Icons.Default.Cancel,
                            color = Rose500,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Category breakdown chips if available
            if (summary.categoryBreakdown.isNotEmpty()) {
                item {
                    Text(
                        text = "TOP CATEGORIES",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        summary.categoryBreakdown.take(5).forEach { cat ->
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = cat.name,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = cat.total,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Search & Status filters
        item {
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = onSearchChanged,
                placeholder = {
                    Text(
                        text = "Search expenses by description, number, category, notes…",
                        fontSize = 13.sp,
                        maxLines = 1
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                trailingIcon = {
                    if (uiState.searchQuery.isNotBlank()) {
                        IconButton(
                            onClick = { onSearchChanged("") },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Clear,
                                contentDescription = "Clear search",
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                ),
                textStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 44.dp, max = 50.dp),
                singleLine = true
            )
        }

        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(null to "ALL", "PENDING" to "PENDING", "APPROVED" to "APPROVED", "REJECTED" to "REJECTED").forEach { (code, label) ->
                    FilterChip(
                        selected = uiState.statusFilter == code,
                        onClick = { onStatusSelected(code) },
                        label = { Text(label, fontSize = 11.sp) },
                        shape = RoundedCornerShape(6.dp)
                    )
                }
            }
        }

        if (uiState.isLoading && filteredExpenses.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(modifier = Modifier.size(32.dp))
                }
            }
        } else if (filteredExpenses.isEmpty()) {
            item {
                EmptyStateView(
                    icon = Icons.Default.Receipt,
                    title = "No expenses found",
                    message = "There are no recorded expenses matching your current filters."
                )
            }
        } else {
            items(filteredExpenses, key = { it.id }) { expense ->
                ExpenseCardItem(expense = expense, onClick = { onExpenseClick(expense) })
            }
        }
    }

    if (showCustomDateDialog) {
        AlertDialog(
            onDismissRequest = { showCustomDateDialog = false },
            title = {
                Text(
                    text = "Select Custom Date Range",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Specify start and end dates (YYYY-MM-DD):",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = customStartInput,
                        onValueChange = { customStartInput = it },
                        label = { Text("Start Date") },
                        placeholder = { Text("YYYY-MM-DD") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = customEndInput,
                        onValueChange = { customEndInput = it },
                        label = { Text("End Date") },
                        placeholder = { Text("YYYY-MM-DD") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val s = customStartInput.trim().ifBlank { null }
                        val e = customEndInput.trim().ifBlank { null }
                        onCustomDateRangeSelected(s, e)
                        showCustomDateDialog = false
                    }
                ) {
                    Text("Apply Range")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCustomDateDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ExpenseCardItem(expense: ExpenseItem, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = expense.description,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1
                    )
                    Text(
                        text = "${expense.expenseNumber}  ·  ${expense.categoryName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                StatusBadge(status = expense.status)
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = expense.expenseDate.ifBlank { "Recorded recently" },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = expense.amount,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Petty Cash Tab Content
// ---------------------------------------------------------------------------

@Composable
private fun PettyCashTabContent(
    funds: List<PettyCashFund>,
    onFundClick: (PettyCashFund) -> Unit,
    onRefresh: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (funds.isEmpty()) {
            item {
                EmptyStateView(
                    icon = Icons.Default.AccountBalanceWallet,
                    title = "No petty cash funds",
                    message = "No petty cash float accounts are registered for this organization."
                )
            }
        } else {
            // Aggregate Float Summary
            item {
                val totalBalance = funds.sumOf { it.rawCurrentBalance }
                val totalFloat = funds.sumOf { it.rawFloatAmount }
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Total Cash on Hand",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${funds.firstOrNull()?.currencyCode ?: "USD"} ${"%.2f".format(totalBalance)}",
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "Total Float Limit",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${funds.firstOrNull()?.currencyCode ?: "USD"} ${"%.2f".format(totalFloat)}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            item {
                Text(
                    text = "REGISTERED FUNDS (${funds.size})",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            items(funds, key = { it.id }) { fund ->
                PettyCashFundCard(fund = fund, onClick = { onFundClick(fund) })
            }
        }
    }
}

@Composable
fun PettyCashFundCard(fund: PettyCashFund, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = fund.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (!fund.responsibleMemberName.isNullOrBlank()) {
                        Text(
                            text = "Manager: ${fund.responsibleMemberName}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Text(
                    text = fund.currentBalance,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            LinearProgressIndicator(
                progress = { fund.utilizationPercent },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp),
                color = if (fund.utilizationPercent < 0.25f) Rose500 else MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.outlineVariant
            )
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Float Limit: ${fund.floatAmount}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "${(fund.utilizationPercent * 100).toInt()}% Remaining",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (fund.utilizationPercent < 0.25f) Rose500 else Emerald500
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Utilities Tab Content
// ---------------------------------------------------------------------------

@Composable
private fun UtilitiesTabContent(
    utilities: List<UtilityAccount>,
    onUtilityClick: (UtilityAccount) -> Unit,
    onRefresh: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (utilities.isEmpty()) {
            item {
                EmptyStateView(
                    icon = Icons.Default.Bolt,
                    title = "No utility accounts",
                    message = "No power, water, or telecom utility accounts are configured yet."
                )
            }
        } else {
            item {
                Text(
                    text = "ACTIVE UTILITY ACCOUNTS (${utilities.size})",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            items(utilities, key = { it.id }) { utility ->
                UtilityAccountCard(utility = utility, onClick = { onUtilityClick(utility) })
            }
        }
    }
}

@Composable
fun UtilityAccountCard(utility: UtilityAccount, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(
                            MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.6f),
                            RoundedCornerShape(8.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = utilityTypeIcon(utility.type),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column {
                    Text(
                        text = utility.name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Acc: ${utility.accountNumber} ${utility.meterNumber?.let { "· Meter: $it" } ?: ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = utility.totalSpent,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${utility.recentExpenses.size} bills",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers & Reusable Widgets
// ---------------------------------------------------------------------------

@Composable
fun MetricCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

@Composable
fun EmptyStateView(
    icon: ImageVector,
    title: String,
    message: String
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .background(MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.size(28.dp)
            )
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = message,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun AccessRestricted(
    onNavigateBack: (() -> Unit)?,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(48.dp)
            )
            Text(
                text = "Access Restricted",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Finance, petty cash, and utility analytics are only accessible to Admins and Owners.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            if (onNavigateBack != null) {
                Button(onClick = onNavigateBack) {
                    Text("Go Back")
                }
            }
        }
    }
}
