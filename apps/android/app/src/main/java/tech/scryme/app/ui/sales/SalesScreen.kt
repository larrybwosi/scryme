package tech.scryme.app.ui.sales

import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.model.OrderItem
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LeadingIconTab
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

// region Screen

@Composable
fun SalesScreen(
    viewModel: SalesViewModel,
    onNavigateBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    if (!uiState.isAuthorized) {
        AccessRestricted(onNavigateBack = onNavigateBack, modifier = modifier)
        return
    }

    val hasContent = uiState.analytics != null || uiState.orders.isNotEmpty()
    val isInitialLoading = uiState.isLoading && !hasContent
    val isRefreshing = uiState.isLoading && hasContent

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            SalesHeader(
                selectedTab = uiState.selectedTab,
                isRefreshing = isRefreshing,
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
            ErrorSection(
                error = uiState.error,
                onRetry = viewModel::refresh
            )

            SalesContent(
                isInitialLoading = isInitialLoading,
                selectedTab = uiState.selectedTab,
                analytics = uiState.analytics,
                orders = uiState.orders,
                searchQuery = uiState.searchQuery,
                onRefresh = viewModel::refresh,
                onSearchQueryChange = viewModel::onSearchQueryChanged,
                onOrderClick = viewModel::selectOrderForDetails
            )
        }
    }

    uiState.selectedOrderForDetails?.let { selectedOrder ->
        OrderDetailsBottomSheet(
            order = selectedOrder,
            onDismiss = { viewModel.selectOrderForDetails(null) }
        )
    }
}

// endregion

// region Header

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SalesHeader(
    selectedTab: SalesTab,
    isRefreshing: Boolean,
    onTabSelected: (SalesTab) -> Unit,
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
                        text = "Sales & Orders",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    if (onNavigateBack != null) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Navigate back"
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh, enabled = !isRefreshing) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                    actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )

            SalesTabRow(selectedTab = selectedTab, onTabSelected = onTabSelected)

            // Fixed-height slot so the layout never jumps when refreshing starts/stops.
            Box(modifier = Modifier.fillMaxWidth().height(2.dp)) {
                if (isRefreshing) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
            }
        }
    }
}

@Composable
private fun SalesTabRow(
    selectedTab: SalesTab,
    onTabSelected: (SalesTab) -> Unit,
    modifier: Modifier = Modifier
) {
    TabRow(
        selectedTabIndex = selectedTab.ordinal,
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.primary,
        divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) }
    ) {
        SalesTab.values().forEach { tab ->
            val selected = selectedTab == tab
            LeadingIconTab(
                selected = selected,
                onClick = { onTabSelected(tab) },
                selectedContentColor = MaterialTheme.colorScheme.primary,
                unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                text = {
                    Text(
                        text = tab.title,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium
                    )
                },
                icon = {
                    Icon(
                        imageVector = tab.icon(),
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                }
            )
        }
    }
}

private fun SalesTab.icon(): ImageVector = when (this) {
    SalesTab.ANALYTICS -> Icons.Default.BarChart
    SalesTab.ORDERS -> Icons.AutoMirrored.Filled.ReceiptLong
}

// endregion

// region Content

@Composable
private fun ColumnScope.SalesContent(
    isInitialLoading: Boolean,
    selectedTab: SalesTab,
    analytics: SalesAnalytics?,
    orders: List<OrderItem>,
    searchQuery: String,
    onRefresh: () -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onOrderClick: (OrderItem) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
    ) {
        if (isInitialLoading) {
            LoadingState(message = "Loading sales data…")
            return@Box
        }

        Crossfade(targetState = selectedTab, label = "sales-tab") { tab ->
            when (tab) {
                SalesTab.ANALYTICS -> {
                    if (analytics != null) {
                        AnalyticsScreen(
                            analytics = analytics,
                            onRefresh = onRefresh,
                            onTransactionClick = onOrderClick
                        )
                    } else {
                        StateMessage(
                            icon = Icons.Default.BarChart,
                            title = "No analytics yet",
                            message = "Load your sales analytics to see revenue and order trends.",
                            actionLabel = "Load analytics",
                            onAction = onRefresh
                        )
                    }
                }

                SalesTab.ORDERS -> OrdersScreen(
                    orders = orders,
                    searchQuery = searchQuery,
                    onSearchQueryChange = onSearchQueryChange,
                    onOrderClick = onOrderClick
                )
            }
        }
    }
}

@Composable
private fun ErrorSection(
    error: String?,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = error != null,
        modifier = modifier,
        enter = fadeIn() + expandVertically(),
        exit = fadeOut() + shrinkVertically()
    ) {
        ErrorBanner(message = error.orEmpty(), onRetry = onRetry)
    }
}

// endregion

// region States

@Composable
private fun LoadingState(
    message: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun AccessRestricted(
    onNavigateBack: (() -> Unit)?,
    modifier: Modifier = Modifier
) {
    StateMessage(
        icon = Icons.Default.Lock,
        title = "Access restricted",
        message = "Sales analytics and orders are only visible to Admins and Owners.",
        actionLabel = if (onNavigateBack != null) "Go back" else null,
        onAction = onNavigateBack,
        modifier = modifier
    )
}

@Composable
private fun StateMessage(
    icon: ImageVector,
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .widthIn(max = 360.dp)
                .padding(32.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(MaterialTheme.colorScheme.secondaryContainer, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSecondaryContainer,
                    modifier = Modifier.size(32.dp)
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            if (actionLabel != null && onAction != null) {
                Spacer(Modifier.height(12.dp))
                Button(onClick = onAction, shape = RoundedCornerShape(12.dp)) {
                    Text(actionLabel)
                }
            }
        }
    }
}

@Composable
private fun ErrorBanner(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        contentColor = MaterialTheme.colorScheme.onErrorContainer,
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .semantics { contentDescription = "Error: $message" }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 14.dp, end = 6.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.weight(1f)
            )
            TextButton(
                onClick = onRetry,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = MaterialTheme.colorScheme.onErrorContainer
                )
            ) {
                Text("Retry", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
