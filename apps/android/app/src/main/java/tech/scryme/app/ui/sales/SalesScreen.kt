package tech.scryme.app.ui.sales

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesScreen(
    viewModel: SalesViewModel,
    onNavigateBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    if (!uiState.isAuthorized) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = "Access Restricted",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
                Text(
                    text = "Sales analytics and orders are only visible to Admins and Owners.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                onNavigateBack?.let { goBack ->
                    Button(
                        onClick = goBack,
                        modifier = Modifier.padding(top = 16.dp)
                    ) {
                        Text("Go Back")
                    }
                }
            }
        }
        return
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Sales & Orders",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    onNavigateBack?.let { goBack ->
                        IconButton(onClick = goBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Top Tab Row for switching between Analytics and Orders
            TabRow(
                selectedTabIndex = uiState.selectedTab.ordinal,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                SalesTab.values().forEach { tab ->
                    val selected = uiState.selectedTab == tab
                    Tab(
                        selected = selected,
                        onClick = { viewModel.selectTab(tab) },
                        text = {
                            Text(
                                text = tab.title,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        },
                        icon = {
                            val iconVector = when (tab) {
                                SalesTab.ANALYTICS -> Icons.Default.BarChart
                                SalesTab.ORDERS -> Icons.AutoMirrored.Filled.ReceiptLong
                            }
                            Icon(
                                imageVector = iconVector,
                                contentDescription = tab.title
                            )
                        }
                    )
                }
            }

            // Error Banner / Card if error exists
            uiState.error?.let { errorMsg ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = errorMsg,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.weight(1f),
                            fontSize = 13.sp
                        )
                        TextButton(onClick = { viewModel.refresh() }) {
                            Text("Retry", color = MaterialTheme.colorScheme.onErrorContainer)
                        }
                    }
                }
            }

            // Main Content Area
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
            ) {
                if (uiState.isLoading && uiState.analytics == null && uiState.orders.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    when (uiState.selectedTab) {
                        SalesTab.ANALYTICS -> {
                            uiState.analytics?.let { analytics ->
                                AnalyticsScreen(
                                    analytics = analytics,
                                    onRefresh = { viewModel.refresh() }
                                )
                            } ?: Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "No analytics data available",
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Button(
                                        onClick = { viewModel.refresh() },
                                        modifier = Modifier.padding(top = 12.dp)
                                    ) {
                                        Text("Load Sales Analytics")
                                    }
                                }
                            }
                        }
                        SalesTab.ORDERS -> {
                            OrdersScreen(
                                orders = uiState.orders,
                                searchQuery = uiState.searchQuery,
                                onSearchQueryChange = { viewModel.onSearchQueryChanged(it) }
                            )
                        }
                    }
                }
            }
        }
    }
}
