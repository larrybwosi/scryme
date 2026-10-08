package tech.scryme.app.ui.sales

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SalesScreen(
    viewModel: SalesViewModel,
    onNavigateHome: (() -> Unit)? = null,
    onNavigateSettings: (() -> Unit)? = null,
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
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Access Restricted",
                    fontSize = 20.sp,
                    color = MaterialTheme.colorScheme.error
                )
                Text(
                    text = "Sales analytics are only visible to Admins and Owners.",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        return
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = false,
                    onClick = { onNavigateHome?.invoke() },
                    icon = { Icon(imageVector = Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == SalesTab.ORDERS,
                    onClick = { viewModel.selectTab(SalesTab.ORDERS) },
                    icon = { Icon(imageVector = Icons.Default.ReceiptLong, contentDescription = "Orders") },
                    label = { Text("Orders", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = uiState.selectedTab == SalesTab.ANALYTICS,
                    onClick = { viewModel.selectTab(SalesTab.ANALYTICS) },
                    icon = { Icon(imageVector = Icons.Default.BarChart, contentDescription = "Analytics") },
                    label = { Text("Analytics", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = { onNavigateSettings?.invoke() },
                    icon = { Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings", fontSize = 11.sp) }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            if (uiState.isLoading) {
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
                            AnalyticsScreen(analytics = analytics)
                        } ?: Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No analytics available")
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
