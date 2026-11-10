package tech.scryme.app.ui.production

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.*
import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.MemberAvatar
import tech.scryme.app.ui.theme.*

private val CardShape = RoundedCornerShape(8.dp)
private val ChipShape = RoundedCornerShape(4.dp)
private val BadgeShape = RoundedCornerShape(12.dp)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductionScreen(
    viewModel: ProductionViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadProductionData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Production Management",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Batches, staging, runs & quality controls",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
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
                    IconButton(onClick = { viewModel.loadProductionData() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (val state = uiState) {
                is ProductionUiState.Loading -> {
                    Column(modifier = Modifier.padding(16.dp)) {
                        ListSkeleton(count = 5)
                    }
                }
                is ProductionUiState.Error -> {
                    ErrorMessageCard(
                        message = state.message,
                        onRetry = { viewModel.loadProductionData() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is ProductionUiState.Success -> {
                    ProductionContent(
                        state = state,
                        onSelectTab = { viewModel.selectTab(it) },
                        onFilterStatus = { viewModel.setStatusFilter(it) },
                        onSelectBatch = { viewModel.selectBatch(it) }
                    )

                    // Detail bottom sheet / dialog if a batch is selected
                    state.selectedBatch?.let { batch ->
                        BatchDetailsBottomSheet(
                            batch = batch,
                            onDismiss = { viewModel.selectBatch(null) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ProductionContent(
    state: ProductionUiState.Success,
    onSelectTab: (ProductionTab) -> Unit,
    onFilterStatus: (String) -> Unit,
    onSelectBatch: (ProductionBatch) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Production Overview Metric Highlights
        ProductionOverviewRow(overview = state.overview)

        // Tab Navigation
        ScrollableTabRow(
            selectedTabIndex = state.selectedTab.ordinal,
            edgePadding = 16.dp,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) }
        ) {
            ProductionTab.values().forEach { tab ->
                Tab(
                    selected = state.selectedTab == tab,
                    onClick = { onSelectTab(tab) },
                    text = {
                        Text(
                            text = tab.title,
                            fontWeight = if (state.selectedTab == tab) FontWeight.Bold else FontWeight.Medium,
                            style = MaterialTheme.typography.labelLarge
                        )
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Tab Body Content
        when (state.selectedTab) {
            ProductionTab.BATCHES -> {
                BatchesTabContent(
                    batches = state.batches,
                    currentFilter = state.statusFilter,
                    onFilterStatus = onFilterStatus,
                    onSelectBatch = onSelectBatch
                )
            }
            ProductionTab.STAGING -> {
                StagingTabContent(stagedBatches = state.stagedBatches)
            }
            ProductionTab.INCIDENTS -> {
                IncidentsTabContent(incidents = state.qualityIncidents)
            }
            ProductionTab.OPERATORS -> {
                OperatorsTabContent(operators = state.operators)
            }
            ProductionTab.SETTINGS -> {
                SettingsTabContent(settings = state.settings)
            }
        }
    }
}

@Composable
fun ProductionOverviewRow(overview: ProductionOverview) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        MetricTile(
            label = "Active Runs",
            value = overview.activeBatchesCount.toString(),
            color = Indigo500,
            modifier = Modifier.weight(1f)
        )
        MetricTile(
            label = "Completed",
            value = overview.completedTodayCount.toString(),
            color = Emerald500,
            modifier = Modifier.weight(1f)
        )
        MetricTile(
            label = "Staged",
            value = overview.stagedBatchesCount.toString(),
            color = Amber500,
            modifier = Modifier.weight(1f)
        )
        MetricTile(
            label = "Incidents",
            value = overview.openIncidentsCount.toString(),
            color = Rose500,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun MetricTile(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun BatchesTabContent(
    batches: List<ProductionBatch>,
    currentFilter: String,
    onFilterStatus: (String) -> Unit,
    onSelectBatch: (ProductionBatch) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Filter Chips Row
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val filters = listOf("ALL", "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED")
            items(filters) { filter ->
                FilterChip(
                    selected = currentFilter == filter,
                    onClick = { onFilterStatus(filter) },
                    label = {
                        Text(
                            text = if (filter == "ALL") "All Batches" else filter.replace("_", " "),
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                )
            }
        }

        if (batches.isEmpty()) {
            EmptyStateCard(
                title = "No Production Batches",
                description = "No batches found for the selected filter.",
                icon = Icons.Default.PrecisionManufacturing,
                modifier = Modifier.padding(16.dp)
            )
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(batches) { batch ->
                    BatchItemCard(batch = batch, onClick = { onSelectBatch(batch) })
                }
            }
        }
    }
}

@Composable
fun BatchItemCard(
    batch: ProductionBatch,
    onClick: () -> Unit
) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "#${batch.batchNumber}",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    StatusBadge(text = batch.runType, color = Indigo500)
                }
                BatchStatusBadge(status = batch.status)
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = batch.recipeName,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Yield: ${batch.actualQuantity ?: batch.plannedQuantity} ${batch.unit ?: "units"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    batch.leadOperatorName?.let {
                        Text(
                            text = "Lead: $it",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                batch.stagingStatus?.let { staging ->
                    if (staging != "NOT_STAGED") {
                        StatusBadge(text = staging.replace("_", " "), color = Amber500)
                    }
                }
            }
        }
    }
}

@Composable
fun StagingTabContent(stagedBatches: List<StagedBatch>) {
    if (stagedBatches.isEmpty()) {
        EmptyStateCard(
            title = "No Staged Batches",
            description = "No production batches are currently awaiting front office or dispatch staging.",
            icon = Icons.Default.Inventory2,
            modifier = Modifier.padding(16.dp)
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(stagedBatches) { staged ->
                Surface(
                    shape = CardShape,
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
                            Text(
                                text = "#${staged.batchNumber}",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            StatusBadge(text = staged.stagingStatus.replace("_", " "), color = Amber500)
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = staged.recipeName,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold
                        )

                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Staged: ${staged.stagedQuantity}  |  Remaining: ${staged.remainingQuantity}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            staged.outputLocationName?.let { loc ->
                                Text(
                                    text = loc,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun IncidentsTabContent(incidents: List<QualityIncident>) {
    if (incidents.isEmpty()) {
        EmptyStateCard(
            title = "Zero Quality Incidents",
            description = "Great job! There are no open or recorded quality incidents.",
            icon = Icons.Default.VerifiedUser,
            modifier = Modifier.padding(16.dp)
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(incidents) { incident ->
                Surface(
                    shape = CardShape,
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                SeverityBadge(severity = incident.severity)
                                Text(
                                    text = incident.title,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            StatusBadge(
                                text = incident.status,
                                color = if (incident.status == "OPEN") Rose500 else Emerald500
                            )
                        }

                        incident.description?.let { desc ->
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = desc,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            incident.batchNumber?.let { bNum ->
                                Text(
                                    text = "Batch: #$bNum",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            incident.reporterName?.let { reporter ->
                                Text(
                                    text = "Reported by: $reporter",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OperatorsTabContent(operators: List<ProductionOperator>) {
    if (operators.isEmpty()) {
        EmptyStateCard(
            title = "No Production Operators",
            description = "No team members are configured as production operators yet.",
            icon = Icons.Default.Engineering,
            modifier = Modifier.padding(16.dp)
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(operators) { op ->
                Surface(
                    shape = CardShape,
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        MemberAvatar(
                            avatarUrl = op.avatarUrl,
                            name = op.name,
                            modifier = Modifier.size(40.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = op.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold
                                )
                                if (op.isDefault) {
                                    StatusBadge(text = "Default", color = Indigo500)
                                }
                            }
                            op.role?.let { role ->
                                Text(
                                    text = role,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (op.specialties.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Specialties: ${op.specialties.joinToString(", ")}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        StatusBadge(
                            text = if (op.isActive) "Active" else "Inactive",
                            color = if (op.isActive) Emerald500 else Slate400
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsTabContent(settings: ProductionSettings?) {
    if (settings == null) {
        EmptyStateCard(
            title = "Settings Not Configured",
            description = "Unable to retrieve production configuration rules.",
            icon = Icons.Default.Settings,
            modifier = Modifier.padding(16.dp)
        )
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        SettingSectionHeader(title = "Batch Numbering")
        SettingRow(label = "Batch Prefix", value = settings.batchPrefix)
        SettingRow(label = "Separator", value = settings.batchSeparator)
        SettingRow(label = "Date Format", value = settings.batchDateFormat)
        SettingRow(label = "Sequence Digits", value = settings.batchSequence)
        SettingRow(label = "Generation Type", value = settings.batchGenerationType)

        Spacer(modifier = Modifier.height(8.dp))
        SettingSectionHeader(title = "Operational Rules")
        SettingToggleRow(label = "Enable Production Staging", enabled = settings.enableProductionStaging)
        SettingToggleRow(label = "Auto Approve Batches", enabled = settings.autoApproveBatches)
        SettingToggleRow(label = "Low Stock Alerts", enabled = settings.lowStockAlerts)
        SettingRow(label = "Expiry Warning Days", value = "${settings.expiryWarningDays} days")
        SettingRow(label = "Timezone", value = settings.timezone)

        Spacer(modifier = Modifier.height(8.dp))
        SettingSectionHeader(title = "Automated Reports")
        SettingToggleRow(label = "Production Reports Active", enabled = settings.scrymeReportEnabled)
        if (settings.scrymeReportEnabled) {
            SettingRow(label = "Scheduled Day", value = "Day ${settings.scrymeReportDay} of week")
            SettingRow(label = "Scheduled Time", value = settings.scrymeReportTime)
        }
    }
}

@Composable
fun SettingSectionHeader(title: String) {
    Text(
        text = title.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.8.sp,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(vertical = 4.dp)
    )
}

@Composable
fun SettingRow(label: String, value: String) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
fun SettingToggleRow(label: String, enabled: Boolean) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            StatusBadge(
                text = if (enabled) "Enabled" else "Disabled",
                color = if (enabled) Emerald500 else Slate400
            )
        }
    }
}

@Composable
fun StatusBadge(text: String, color: Color) {
    Surface(
        shape = ChipShape,
        color = color.copy(alpha = 0.12f)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = color,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
fun BatchStatusBadge(status: String) {
    val color = when (status) {
        "PLANNED" -> Indigo500
        "IN_PROGRESS" -> Amber500
        "COMPLETED" -> Emerald500
        "CANCELLED" -> Rose500
        else -> Slate400
    }
    StatusBadge(text = status.replace("_", " "), color = color)
}

@Composable
fun SeverityBadge(severity: String) {
    val color = when (severity.lowercase()) {
        "critical" -> Rose600
        "high" -> Rose500
        "medium" -> Amber500
        "low" -> Emerald500
        else -> Slate500
    }
    Surface(
        shape = BadgeShape,
        color = color,
        modifier = Modifier.size(8.dp)
    ) {}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BatchDetailsBottomSheet(
    batch: ProductionBatch,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Batch #${batch.batchNumber}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                BatchStatusBadge(status = batch.status)
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            DetailItem(label = "Recipe", value = batch.recipeName)
            DetailItem(label = "Run Type", value = batch.runType)
            DetailItem(
                label = "Planned Quantity",
                value = "${batch.plannedQuantity} ${batch.unit ?: "units"}"
            )
            batch.actualQuantity?.let {
                DetailItem(label = "Actual Produced", value = "$it ${batch.unit ?: "units"}")
            }
            batch.leadOperatorName?.let {
                DetailItem(label = "Lead Operator", value = it)
            }
            DetailItem(label = "Scheduled Start", value = batch.scheduledStartAt)
            batch.startedAt?.let { DetailItem(label = "Started At", value = it) }
            batch.completedAt?.let { DetailItem(label = "Completed At", value = it) }
            batch.notes?.let { DetailItem(label = "Notes", value = it) }

            batch.wasteQuantity?.let { waste ->
                if (waste > 0) {
                    DetailItem(
                        label = "Waste Quantity",
                        value = "$waste (${batch.wasteReason ?: "Unspecified"})"
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun DetailItem(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
