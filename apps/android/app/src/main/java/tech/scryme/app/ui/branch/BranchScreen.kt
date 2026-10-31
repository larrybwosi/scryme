package tech.scryme.app.ui.branch

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.ui.theme.Emerald500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchScreen(
    viewModel: BranchViewModel,
    onNavigateToBranchDetails: ((branchId: String) -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showCreateDialog by remember { mutableStateOf(false) }
    var locationToEdit by remember { mutableStateOf<BranchLocation?>(null) }
    var locationToEditGeofence by remember { mutableStateOf<BranchLocation?>(null) }
    var locationToDelete by remember { mutableStateOf<BranchLocation?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadBranches()
    }

    Scaffold(
        floatingActionButton = {
            if ((uiState as? BranchUiState.Success)?.isAdmin == true) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Add Location")
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp)
        ) {
            Text(
                text = "Branch Locations",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            when (val state = uiState) {
                is BranchUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is BranchUiState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = { viewModel.loadBranches() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                is BranchUiState.Success -> {
                    val successMessage = state.actionSuccessMessage ?: state.message
                    if (!successMessage.isNullOrEmpty()) {
                        Snackbar(
                            modifier = Modifier.padding(bottom = 8.dp),
                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        ) {
                            Text(successMessage)
                        }
                    }

                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.branches, key = { it.id }) { branch ->
                            val isActive = branch.id == state.activeLocationId
                            BranchItemCard(
                                branch = branch,
                                isActive = isActive,
                                isAdmin = state.isAdmin,
                                onCardClick = { onNavigateToBranchDetails?.invoke(branch.id) },
                                onSelect = { viewModel.switchBranch(branch.id) },
                                onEdit = { locationToEdit = branch },
                                onEditGeofence = { locationToEditGeofence = branch },
                                onDelete = { locationToDelete = branch },
                                onPinCurrentLocation = { viewModel.pinCurrentLocation(context, branch.id) }
                            )
                        }
                    }
                }
            }
        }
    }

    // Create Location Dialog
    if (showCreateDialog) {
        LocationFormDialog(
            title = "Create New Location",
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

    // Edit Location Dialog
    locationToEdit?.let { branch ->
        LocationFormDialog(
            title = "Edit Location",
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

    // Edit Geofence / Coordinates Dialog
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

    // Delete / Deactivate Confirmation Dialog
    locationToDelete?.let { branch ->
        AlertDialog(
            onDismissRequest = { locationToDelete = null },
            title = { Text("Delete Location") },
            text = { Text("Are you sure you want to delete location '${branch.name}'? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteBranch(branch.id)
                        locationToDelete = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { locationToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun BranchItemCard(
    branch: BranchLocation,
    isActive: Boolean,
    isAdmin: Boolean,
    onCardClick: () -> Unit,
    onSelect: () -> Unit,
    onEdit: () -> Unit,
    onEditGeofence: () -> Unit,
    onDelete: () -> Unit,
    onPinCurrentLocation: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCardClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isActive) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = branch.name,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Text(
                                text = branch.locationType,
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    if (!branch.address.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Place,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = branch.address,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    if (!branch.phone.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = branch.phone,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    if (branch.latitude != null && branch.longitude != null) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = Emerald500
                            )
                            Text(
                                text = "📍 GPS: ${"%.4f".format(branch.latitude)}, ${"%.4f".format(branch.longitude)} (${branch.geofenceRadiusMeters?.toInt() ?: 100}m)",
                                style = MaterialTheme.typography.labelSmall,
                                color = Emerald500
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "📍 Location not pinned",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Button(
                        onClick = onSelect,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isActive) Emerald500 else MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (isActive) "Active ✓" else "Switch")
                    }

                    if (isAdmin) {
                        Box {
                            IconButton(onClick = { showMenu = true }) {
                                Icon(imageVector = Icons.Default.MoreVert, contentDescription = "Actions")
                            }
                            DropdownMenu(
                                expanded = showMenu,
                                onDismissRequest = { showMenu = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("View Branch Details") },
                                    leadingIcon = { Icon(Icons.Default.ChevronRight, contentDescription = null) },
                                    onClick = {
                                        showMenu = false
                                        onCardClick()
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Edit Details") },
                                    leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                                    onClick = {
                                        showMenu = false
                                        onEdit()
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Update Geofence") },
                                    leadingIcon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                                    onClick = {
                                        showMenu = false
                                        onEditGeofence()
                                    }
                                )
                                HorizontalDivider()
                                DropdownMenuItem(
                                    text = { Text("Delete Location", color = MaterialTheme.colorScheme.error) },
                                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                                    onClick = {
                                        showMenu = false
                                        onDelete()
                                    }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onPinCurrentLocation,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("📌 Pin Current GPS Location")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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
    var geofenceRadiusStr by remember { mutableStateOf(initialBranch?.geofenceRadiusMeters?.toString() ?: "100") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Location Name *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it },
                    label = { Text("Location Code") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Address") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = locationType,
                    onValueChange = { locationType = it },
                    label = { Text("Location Type (e.g. STORE, WAREHOUSE)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = latitudeStr,
                        onValueChange = { latitudeStr = it },
                        label = { Text("Latitude") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = longitudeStr,
                        onValueChange = { longitudeStr = it },
                        label = { Text("Longitude") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = geofenceRadiusStr,
                    onValueChange = { geofenceRadiusStr = it },
                    label = { Text("Geofence Radius (meters)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                enabled = name.isNotBlank(),
                onClick = {
                    onSubmit(
                        name.trim(),
                        code.ifBlank { null },
                        address.ifBlank { null },
                        phone.ifBlank { null },
                        locationType.ifBlank { "STORE" },
                        latitudeStr.toDoubleOrNull(),
                        longitudeStr.toDoubleOrNull(),
                        geofenceRadiusStr.toDoubleOrNull()
                    )
                }
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
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
    var radiusStr by remember { mutableStateOf(branch.geofenceRadiusMeters?.toString() ?: "100") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Geofence Coordinates") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Configure GPS coordinates and radius for staff check-in geofencing.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = latitudeStr,
                    onValueChange = { latitudeStr = it },
                    label = { Text("Latitude (e.g. -1.286389)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = longitudeStr,
                    onValueChange = { longitudeStr = it },
                    label = { Text("Longitude (e.g. 36.817223)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = radiusStr,
                    onValueChange = { radiusStr = it },
                    label = { Text("Geofence Radius (meters)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSubmit(
                        latitudeStr.toDoubleOrNull(),
                        longitudeStr.toDoubleOrNull(),
                        radiusStr.toDoubleOrNull()
                    )
                }
            ) {
                Text("Save Coordinates")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
