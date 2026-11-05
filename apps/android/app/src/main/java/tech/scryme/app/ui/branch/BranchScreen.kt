package tech.scryme.app.ui.branch

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MoreVert
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.ui.theme.Emerald500

private const val DEFAULT_RADIUS_METERS = 100
private val LOCATION_TYPES = listOf("STORE", "WAREHOUSE", "OFFICE", "OTHER")

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchScreen(
    viewModel: BranchViewModel,
    onNavigateToBranchDetails: ((branchId: String) -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showCreateDialog by remember { mutableStateOf(false) }
    var locationToEdit by remember { mutableStateOf<BranchLocation?>(null) }
    var locationToEditGeofence by remember { mutableStateOf<BranchLocation?>(null) }
    var locationToDelete by remember { mutableStateOf<BranchLocation?>(null) }

    LaunchedEffect(Unit) { viewModel.loadBranches() }

    // Surface action feedback as a proper snackbar instead of an inline block.
    val feedback = (uiState as? BranchUiState.Success)?.let { it.actionSuccessMessage ?: it.message }
    LaunchedEffect(feedback) {
        if (!feedback.isNullOrEmpty()) snackbarHostState.showSnackbar(feedback)
    }

    val isAdmin = (uiState as? BranchUiState.Success)?.isAdmin == true

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            if (isAdmin) {
                ExtendedFloatingActionButton(
                    onClick = { showCreateDialog = true },
                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                    text = { Text("New location") },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            ScreenHeader(
                count = (uiState as? BranchUiState.Success)?.branches?.size
            )

            when (val state = uiState) {
                is BranchUiState.Loading -> CenteredBox { CircularProgressIndicator() }

                is BranchUiState.Error -> CenteredBox {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(40.dp)
                        )
                        Text(
                            text = state.message,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        FilledTonalButton(onClick = { viewModel.loadBranches() }) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Try again")
                        }
                    }
                }

                is BranchUiState.Success -> {
                    if (state.branches.isEmpty()) {
                        EmptyState(isAdmin = state.isAdmin)
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 96.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.branches, key = { it.id }) { branch ->
                                BranchItemCard(
                                    branch = branch,
                                    isActive = branch.id == state.activeLocationId,
                                    isAdmin = state.isAdmin,
                                    onCardClick = { onNavigateToBranchDetails?.invoke(branch.id) },
                                    onSelect = { viewModel.switchBranch(branch.id) },
                                    onEdit = { locationToEdit = branch },
                                    onEditGeofence = { locationToEditGeofence = branch },
                                    onDelete = { locationToDelete = branch }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Create
    if (showCreateDialog) {
        LocationFormDialog(
            title = "New location",
            onDismiss = { showCreateDialog = false },
            onSubmit = { name, code, address, phone, type, lat, lng, radius ->
                viewModel.createBranch(
                    name = name,
                    code = code,
                    address = address,
                    phone = phone,
                    locationType = type,
                    latitude = lat,
                    longitude = lng,
                    geofenceRadiusMeters = radius
                )
                showCreateDialog = false
            }
        )
    }

    // Edit
    locationToEdit?.let { branch ->
        LocationFormDialog(
            title = "Edit location",
            initialBranch = branch,
            onDismiss = { locationToEdit = null },
            onSubmit = { name, code, address, phone, type, lat, lng, radius ->
                viewModel.updateBranch(
                    locationId = branch.id,
                    name = name,
                    code = code,
                    address = address,
                    phone = phone,
                    locationType = type,
                    latitude = lat,
                    longitude = lng,
                    geofenceRadiusMeters = radius
                )
                locationToEdit = null
            }
        )
    }

    // Geofence
    locationToEditGeofence?.let { branch ->
        GeofenceFormDialog(
            branch = branch,
            onDismiss = { locationToEditGeofence = null },
            onSubmit = { lat, lng, radius ->
                viewModel.updateBranch(
                    locationId = branch.id,
                    latitude = lat,
                    longitude = lng,
                    geofenceRadiusMeters = radius
                )
                locationToEditGeofence = null
            }
        )
    }

    // Delete
    locationToDelete?.let { branch ->
        AlertDialog(
            onDismissRequest = { locationToDelete = null },
            icon = {
                Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error)
            },
            title = { Text("Delete ${branch.name}?") },
            text = {
                Text(
                    "This location will be removed permanently. This can't be undone.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteBranch(branch.id)
                        locationToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error,
                        contentColor = MaterialTheme.colorScheme.onError
                    )
                ) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { locationToDelete = null }) { Text("Cancel") }
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Screen-level pieces
// ---------------------------------------------------------------------------

@Composable
private fun ScreenHeader(count: Int?) {
    Column(modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 16.dp)) {
        Text(
            text = "Locations",
            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onBackground
        )
        if (count != null) {
            Spacer(Modifier.height(2.dp))
            Text(
                text = if (count == 1) "1 branch" else "$count branches",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CenteredBox(content: @Composable BoxScope.() -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center, content = content)
}

@Composable
private fun EmptyState(isAdmin: Boolean) {
    CenteredBox {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(horizontal = 40.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Place,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(Modifier.height(4.dp))
            Text(
                "No locations yet",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
            )
            Text(
                text = if (isAdmin) "Add your first branch to start tracking staff check-ins."
                else "Ask an administrator to add a branch.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Branch card
// ---------------------------------------------------------------------------

@Composable
fun BranchItemCard(
    branch: BranchLocation,
    isActive: Boolean,
    isAdmin: Boolean,
    onCardClick: () -> Unit,
    onSelect: () -> Unit,
    onEdit: () -> Unit,
    onEditGeofence: () -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    val colors = MaterialTheme.colorScheme
    val isPinned = branch.latitude != null && branch.longitude != null

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isActive) 2.dp else 0.dp),
        border = BorderStroke(
            width = if (isActive) 1.5.dp else 1.dp,
            color = if (isActive) colors.primary else colors.outlineVariant
        )
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {

            // ---- Header: tappable area (name, type, contact, geofence) ----
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onCardClick() }
                    .padding(start = 16.dp, top = 16.dp, end = 4.dp, bottom = 12.dp),
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = branch.name,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = colors.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                        Tag(
                            text = branch.locationType.lowercase().replaceFirstChar { it.uppercase() },
                            container = colors.surfaceVariant,
                            content = colors.onSurfaceVariant
                        )
                        if (isActive) {
                            Tag(text = "Active", container = Emerald500.copy(alpha = 0.14f), content = Emerald500)
                        }
                    }

                    if (!branch.address.isNullOrEmpty()) {
                        InfoRow(icon = Icons.Default.Place, text = branch.address)
                    }
                    if (!branch.phone.isNullOrEmpty()) {
                        InfoRow(icon = Icons.Default.Phone, text = branch.phone)
                    }

                    GeofenceStatus(
                        isPinned = isPinned,
                        text = if (isPinned) {
                            "%.5f, %.5f".format(branch.latitude, branch.longitude) +
                                "  •  ${branch.geofenceRadiusMeters?.toInt() ?: DEFAULT_RADIUS_METERS} m radius"
                        } else {
                            "Location not pinned"
                        }
                    )
                }

                if (isAdmin) {
                    Box {
                        IconButton(onClick = { showMenu = true }) {
                            Icon(
                                Icons.Default.MoreVert,
                                contentDescription = "More actions",
                                tint = colors.onSurfaceVariant
                            )
                        }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            DropdownMenuItem(
                                text = { Text("View details") },
                                leadingIcon = { Icon(Icons.Default.KeyboardArrowRight, contentDescription = null) },
                                onClick = { showMenu = false; onCardClick() }
                            )
                            DropdownMenuItem(
                                text = { Text("Edit details") },
                                leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                                onClick = { showMenu = false; onEdit() }
                            )
                            DropdownMenuItem(
                                text = { Text("Edit geofence") },
                                leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                                onClick = { showMenu = false; onEditGeofence() }
                            )
                            HorizontalDivider()
                            DropdownMenuItem(
                                text = { Text("Delete", color = colors.error) },
                                leadingIcon = {
                                    Icon(Icons.Default.Delete, contentDescription = null, tint = colors.error)
                                },
                                onClick = { showMenu = false; onDelete() }
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = colors.outlineVariant)

            // ---- Footer actions ----
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.End
            ) {
                if (isActive) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Emerald500,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            "Current branch",
                            style = MaterialTheme.typography.labelLarge,
                            color = Emerald500
                        )
                    }
                } else {
                    FilledTonalButton(
                        onClick = onSelect,
                        shape = RoundedCornerShape(10.dp)
                    ) { Text("Switch to this branch") }
                }
            }
        }
    }
}

@Composable
private fun Tag(text: String, container: Color, content: Color) {
    Surface(shape = RoundedCornerShape(6.dp), color = container) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
            color = content,
            maxLines = 1,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
private fun InfoRow(icon: ImageVector, text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun GeofenceStatus(isPinned: Boolean, text: String) {
    val accent = if (isPinned) Emerald500 else MaterialTheme.colorScheme.error
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = accent.copy(alpha = 0.10f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = if (isPinned) Icons.Default.LocationOn else Icons.Default.Warning,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = accent
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
        color = MaterialTheme.colorScheme.primary
    )
}

/** Validates a numeric field. Blank is allowed (treated as "not set"). */
private fun String.isValidNumber(min: Double, max: Double): Boolean {
    if (isBlank()) return true
    val v = toDoubleOrNull() ?: return false
    return v in min..max
}

@Composable
fun LocationFormDialog(
    title: String,
    initialBranch: BranchLocation? = null,
    onDismiss: () -> Unit,
    onSubmit: (
        name: String,
        code: String?,
        address: String?,
        phone: String?,
        locationType: String,
        latitude: Double?,
        longitude: Double?,
        geofenceRadiusMeters: Double?
    ) -> Unit
) {
    var name by remember { mutableStateOf(initialBranch?.name ?: "") }
    var code by remember { mutableStateOf(initialBranch?.code ?: "") }
    var address by remember { mutableStateOf(initialBranch?.address ?: "") }
    var phone by remember { mutableStateOf(initialBranch?.phone ?: "") }
    var locationType by remember { mutableStateOf(initialBranch?.locationType ?: "STORE") }
    var latitudeStr by remember { mutableStateOf(initialBranch?.latitude?.toString() ?: "") }
    var longitudeStr by remember { mutableStateOf(initialBranch?.longitude?.toString() ?: "") }
    var radiusStr by remember {
        mutableStateOf(initialBranch?.geofenceRadiusMeters?.toInt()?.toString() ?: DEFAULT_RADIUS_METERS.toString())
    }

    val typeOptions = remember(initialBranch) {
        (LOCATION_TYPES + listOfNotNull(initialBranch?.locationType)).distinct()
    }
    val latValid = latitudeStr.isValidNumber(-90.0, 90.0)
    val lngValid = longitudeStr.isValidNumber(-180.0, 180.0)
    val radiusValid = radiusStr.isValidNumber(10.0, 10_000.0)
    val canSave = name.isNotBlank() && latValid && lngValid && radiusValid

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.SemiBold) },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SectionLabel("Basic information")
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    supportingText = { Text("Required") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it },
                    label = { Text("Code") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    "Type",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    typeOptions.forEach { option ->
                        FilterChip(
                            selected = locationType == option,
                            onClick = { locationType = option },
                            label = { Text(option.lowercase().replaceFirstChar { it.uppercase() }) }
                        )
                    }
                }

                Spacer(Modifier.height(4.dp))
                SectionLabel("Contact")
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Address") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone number") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(4.dp))
                SectionLabel("Geofence")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = latitudeStr,
                        onValueChange = { latitudeStr = it },
                        label = { Text("Latitude") },
                        isError = !latValid,
                        supportingText = if (!latValid) {{ Text("-90 to 90") }} else null,
                        // Decimal (not Number) so the minus sign is available for southern latitudes.
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = longitudeStr,
                        onValueChange = { longitudeStr = it },
                        label = { Text("Longitude") },
                        isError = !lngValid,
                        supportingText = if (!lngValid) {{ Text("-180 to 180") }} else null,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = radiusStr,
                    onValueChange = { radiusStr = it },
                    label = { Text("Radius (meters)") },
                    isError = !radiusValid,
                    supportingText = {
                        Text(if (radiusValid) "Staff must be within this distance to check in" else "Use 10 to 10,000")
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                enabled = canSave,
                onClick = {
                    onSubmit(
                        name.trim(),
                        code.ifBlank { null },
                        address.ifBlank { null },
                        phone.ifBlank { null },
                        locationType.ifBlank { "STORE" },
                        latitudeStr.toDoubleOrNull(),
                        longitudeStr.toDoubleOrNull(),
                        radiusStr.toDoubleOrNull()
                    )
                }
            ) { Text("Save changes") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
fun GeofenceFormDialog(
    branch: BranchLocation,
    onDismiss: () -> Unit,
    onSubmit: (latitude: Double?, longitude: Double?, geofenceRadiusMeters: Double?) -> Unit
) {
    var latitudeStr by remember { mutableStateOf(branch.latitude?.toString() ?: "") }
    var longitudeStr by remember { mutableStateOf(branch.longitude?.toString() ?: "") }
    var radiusStr by remember {
        mutableStateOf(branch.geofenceRadiusMeters?.toInt()?.toString() ?: DEFAULT_RADIUS_METERS.toString())
    }

    val latValid = latitudeStr.isValidNumber(-90.0, 90.0)
    val lngValid = longitudeStr.isValidNumber(-180.0, 180.0)
    val radiusValid = radiusStr.isValidNumber(10.0, 10_000.0)

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Icon(Icons.Default.LocationOn, contentDescription = null, tint = Emerald500) },
        title = { Text("Edit geofence", fontWeight = FontWeight.SemiBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Set where ${branch.name} is and how close staff must be to check in.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = latitudeStr,
                    onValueChange = { latitudeStr = it },
                    label = { Text("Latitude") },
                    placeholder = { Text("-1.286389") },
                    isError = !latValid,
                    supportingText = if (!latValid) {{ Text("Enter a value from -90 to 90") }} else null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = longitudeStr,
                    onValueChange = { longitudeStr = it },
                    label = { Text("Longitude") },
                    placeholder = { Text("36.817223") },
                    isError = !lngValid,
                    supportingText = if (!lngValid) {{ Text("Enter a value from -180 to 180") }} else null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = radiusStr,
                    onValueChange = { radiusStr = it },
                    label = { Text("Radius (meters)") },
                    isError = !radiusValid,
                    supportingText = if (!radiusValid) {{ Text("Use 10 to 10,000") }} else null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                enabled = latValid && lngValid && radiusValid,
                onClick = {
                    onSubmit(
                        latitudeStr.toDoubleOrNull(),
                        longitudeStr.toDoubleOrNull(),
                        radiusStr.toDoubleOrNull()
                    )
                }
            ) { Text("Save geofence") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}