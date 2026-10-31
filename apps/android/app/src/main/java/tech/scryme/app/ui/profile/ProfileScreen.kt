package tech.scryme.app.ui.profile

import android.net.Uri
import android.util.Patterns
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

private val AmberBusy = Color(0xFFD97706)
private val CardShape = RoundedCornerShape(16.dp)

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showAddPasskeyDialog by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }

    // Locally picked avatar, shown immediately while the upload runs.
    // rememberSaveable keeps it across rotation.
    var pendingAvatarUri by rememberSaveable { mutableStateOf<Uri?>(null) }

    // System photo picker: no storage permission needed. On devices without it,
    // AndroidX falls back to the document picker automatically.
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            pendingAvatarUri = uri
            viewModel.updateAvatarFromUri(context, uri)
        }
    }
    val launchImagePicker: () -> Unit = {
        imagePickerLauncher.launch(
            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
        )
    }

    LaunchedEffect(Unit) {
        viewModel.loadProfile()
    }

    val successState = uiState as? ProfileUiState.Success

    // Once the server returns a new avatar URL, drop the local preview.
    LaunchedEffect(successState?.profile?.avatarUrl) {
        pendingAvatarUri = null
    }
    // If the upload failed, fall back to the previous avatar.
    LaunchedEffect(successState?.updateError) {
        if (successState?.updateError != null) pendingAvatarUri = null
    }

    if (showAddPasskeyDialog) {
        AddPasskeyDialog(
            onDismiss = { showAddPasskeyDialog = false },
            onConfirm = { name ->
                showAddPasskeyDialog = false
                viewModel.registerPasskey(context, name)
            }
        )
    }

    // Rendered outside the list so it doesn't add an empty, spaced item.
    if (successState?.isEditing == true) {
        EditProfileDialog(
            initialName = successState.profile.name,
            initialEmail = successState.profile.email ?: "",
            initialPhone = successState.profile.phone ?: "",
            onDismiss = { viewModel.setEditing(false) },
            onConfirm = { name, email, phone ->
                viewModel.updateProfile(name = name, email = email, phone = phone)
            }
        )
    }

    if (showLogoutConfirm) {
        AlertDialog(
            onDismissRequest = { showLogoutConfirm = false },
            title = { Text("Log out?") },
            text = { Text("You'll need to sign in again to access your workspace.") },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutConfirm = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                ) { Text("Log out") }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutConfirm = false }) { Text("Cancel") }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "Profile",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        when (val state = uiState) {
            is ProfileUiState.Loading -> {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(240.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
            }

            is ProfileUiState.Error -> {
                item {
                    ErrorMessageCard(
                        title = "Unable to load profile",
                        message = state.message.ifBlank {
                            "Failed to load organization context & profile"
                        },
                        onRetry = { viewModel.loadProfile() }
                    )
                }
            }

            is ProfileUiState.Success -> {
                item {
                    ProfileHeaderCard(
                        state = state,
                        pendingAvatarUri = pendingAvatarUri,
                        onPickImage = launchImagePicker,
                        onEdit = { viewModel.setEditing(true) }
                    )
                }
                item { OrganizationCard(state = state, viewModel = viewModel) }
                item {
                    PasskeysCard(
                        state = state,
                        viewModel = viewModel,
                        onAddPasskey = { showAddPasskeyDialog = true }
                    )
                }
                item { DutyStatusCard(state = state, viewModel = viewModel) }
                item { PreferencesCard(state = state, viewModel = viewModel) }
                item { SettingsLinkCard(onClick = onNavigateToSettings) }
                item {
                    OutlinedButton(
                        onClick = { showLogoutConfirm = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Rose500.copy(alpha = 0.5f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose500)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Logout,
                            contentDescription = null,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text("Log out", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

// ───────────────────────── Shared building blocks ─────────────────────────

@Composable
private fun SectionCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            content = content
        )
    }
}

@Composable
private fun SectionTitle(
    icon: ImageVector,
    title: String,
    trailing: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
        trailing?.invoke()
    }
}

@Composable
private fun SubHeading(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

// ───────────────────────── Header + avatar picker ─────────────────────────

@Composable
private fun ProfileHeaderCard(
    state: ProfileUiState.Success,
    pendingAvatarUri: Uri?,
    onPickImage: () -> Unit,
    onEdit: () -> Unit
) {
    val profile = state.profile
    val isUploading = state.isUpdating && pendingAvatarUri != null

    SectionCard {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            // Avatar with camera badge
            Box(modifier = Modifier.size(104.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .clickable(
                            enabled = !isUploading,
                            onClickLabel = "Change profile photo",
                            role = Role.Button,
                            onClick = onPickImage
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    val model: Any? =
                        pendingAvatarUri ?: profile.avatarUrl?.takeIf { it.isNotBlank() }
                    if (model != null) {
                        AsyncImage(
                            model = model,
                            contentDescription = "Profile photo",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Text(
                            text = profile.name.take(1).uppercase().ifBlank { "?" },
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }

                    if (isUploading) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.45f)),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(32.dp),
                                color = Color.White,
                                strokeWidth = 3.dp
                            )
                        }
                    }
                }

                if (!isUploading) {
                    Surface(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .size(34.dp)
                            .clip(CircleShape)
                            .clickable(
                                onClickLabel = "Change profile photo",
                                role = Role.Button,
                                onClick = onPickImage
                            ),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary,
                        border = BorderStroke(2.dp, MaterialTheme.colorScheme.surface),
                        shadowElevation = 2.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = profile.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            profile.email?.takeIf { it.isNotBlank() }?.let { email ->
                ContactLine(icon = Icons.Default.Email, text = email)
            }
            profile.phone?.takeIf { it.isNotBlank() }?.let { phone ->
                ContactLine(icon = Icons.Default.Phone, text = phone)
            }

            Surface(
                modifier = Modifier.padding(top = 8.dp),
                color = MaterialTheme.colorScheme.secondaryContainer,
                shape = RoundedCornerShape(50)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                    Text(
                        text = profile.role ?: "Member",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick = onEdit,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier
                        .size(16.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text("Edit details")
            }
            OutlinedButton(
                onClick = onPickImage,
                enabled = !isUploading,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.CameraAlt,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text("Change photo")
            }
        }

        if (state.isUpdating && !isUploading) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)
            ) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                Text(
                    "Saving changes…",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        if (isUploading) {
            Text(
                text = "Uploading photo…",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }

        state.passkeyActionMessage?.let { msg ->
            Text(
                text = msg,
                style = MaterialTheme.typography.bodySmall,
                color = Emerald500,
                modifier = Modifier.fillMaxWidth(),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }

        state.updateError?.let { err ->
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                contentColor = MaterialTheme.colorScheme.onErrorContainer,
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = err,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }
    }
}

@Composable
private fun ContactLine(icon: ImageVector, text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

// ───────────────────────── Organization ─────────────────────────

@Composable
private fun OrganizationCard(
    state: ProfileUiState.Success,
    viewModel: ProfileViewModel
) {
    SectionCard {
        SectionTitle(
            icon = Icons.Default.Business,
            title = "Active organization",
            trailing = {
                if (state.isSwitchingOrg) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                }
            }
        )

        state.activeOrganization?.let { activeOrg ->
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = activeOrg.name ?: "Organization",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "Slug: ${activeOrg.slug ?: activeOrg.id ?: ""}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Active",
                        tint = Emerald500
                    )
                }
            }
        }

        if (state.memberships.isNotEmpty()) {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            SubHeading("Switch workspace")

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                state.memberships.forEach { membership ->
                    val isCurrent =
                        membership.organizationId == state.activeOrganization?.id ||
                            membership.slug == state.activeOrganization?.slug
                    val canSwitch = !isCurrent && !state.isSwitchingOrg

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable(enabled = canSwitch, role = Role.Button) {
                                membership.organizationId?.let { orgId ->
                                    viewModel.switchOrganization(orgId)
                                }
                            },
                        shape = RoundedCornerShape(12.dp),
                        color = if (isCurrent) {
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                        } else {
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = membership.name ?: "Workspace",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = if (isCurrent) FontWeight.SemiBold else FontWeight.Medium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Role: ${membership.role ?: "Member"}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (isCurrent) {
                                Text(
                                    text = "Current",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "Switch to this workspace",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ───────────────────────── Passkeys ─────────────────────────

@Composable
private fun PasskeysCard(
    state: ProfileUiState.Success,
    viewModel: ProfileViewModel,
    onAddPasskey: () -> Unit
) {
    SectionCard {
        SectionTitle(
            icon = Icons.Default.Fingerprint,
            title = "Passkeys & authentication",
            trailing = {
                IconButton(onClick = onAddPasskey) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add passkey",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        )

        Text(
            text = "Sign in without a password using your biometrics or screen lock passkey.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        SubHeading("Registered passkeys")

        if (state.passkeys.isEmpty()) {
            Text(
                text = "No passkeys registered on this account yet.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                state.passkeys.forEach { passkey ->
                    key(passkey.id) {
                        var confirmDelete by remember { mutableStateOf(false) }
                        val label = passkey.name ?: "Android device passkey"

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                    RoundedCornerShape(12.dp)
                                )
                                .padding(start = 12.dp, top = 4.dp, bottom = 4.dp, end = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Fingerprint,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                passkey.createdAt?.let { created ->
                                    Text(
                                        text = "Created: $created",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            IconButton(onClick = { confirmDelete = true }) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete passkey $label",
                                    tint = Rose500,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        if (confirmDelete) {
                            AlertDialog(
                                onDismissRequest = { confirmDelete = false },
                                title = { Text("Delete passkey?") },
                                text = {
                                    Text("\"$label\" will no longer work for signing in.")
                                },
                                confirmButton = {
                                    Button(
                                        onClick = {
                                            confirmDelete = false
                                            viewModel.deletePasskey(passkey.id)
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                                    ) { Text("Delete") }
                                },
                                dismissButton = {
                                    TextButton(onClick = { confirmDelete = false }) {
                                        Text("Cancel")
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

// ───────────────────────── Duty status ─────────────────────────

@Composable
private fun DutyStatusCard(
    state: ProfileUiState.Success,
    viewModel: ProfileViewModel
) {
    SectionCard {
        SectionTitle(icon = Icons.Default.CheckCircle, title = "Duty status")

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("ONLINE", "BUSY", "OFFLINE").forEach { status ->
                val tone = when (status) {
                    "ONLINE" -> Emerald500
                    "BUSY" -> AmberBusy
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
                FilterChip(
                    selected = state.profile.status == status,
                    onClick = { viewModel.updateDutyStatus(status) },
                    label = {
                        Text(
                            text = status.lowercase().replaceFirstChar { it.uppercase() },
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    },
                    leadingIcon = {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(tone, CircleShape)
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = tone.copy(alpha = 0.15f),
                        selectedLabelColor = MaterialTheme.colorScheme.onSurface
                    ),
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

// ───────────────────────── Preferences ─────────────────────────

@Composable
private fun PreferencesCard(
    state: ProfileUiState.Success,
    viewModel: ProfileViewModel
) {
    val preferences = state.preferences

    SectionCard {
        SectionTitle(icon = Icons.Default.Settings, title = "App preferences")

        SubHeading("Theme")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("SYSTEM" to "System", "LIGHT" to "Light", "DARK" to "Dark")
                .forEach { (mode, label) ->
                    FilterChip(
                        selected = preferences.themeMode == mode,
                        onClick = { viewModel.setThemeMode(mode) },
                        label = {
                            Text(
                                text = label,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        },
                        modifier = Modifier.weight(1f)
                    )
                }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        SubHeading("Notifications")

        SwitchRow(
            label = "Push notifications",
            checked = preferences.notificationsEnabled,
            enabled = true,
            onCheckedChange = { viewModel.setNotificationsEnabled(it) }
        )
        SwitchRow(
            label = "Shift & schedule alerts",
            checked = preferences.shiftNotifications && preferences.notificationsEnabled,
            enabled = preferences.notificationsEnabled,
            onCheckedChange = { viewModel.setShiftNotifications(it) }
        )
        SwitchRow(
            label = "Task assignment alerts",
            checked = preferences.taskNotifications && preferences.notificationsEnabled,
            enabled = preferences.notificationsEnabled,
            onCheckedChange = { viewModel.setTaskNotifications(it) }
        )
    }
}

@Composable
private fun SwitchRow(
    label: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .toggleable(
                value = checked,
                enabled = enabled,
                role = Role.Switch,
                onValueChange = onCheckedChange
            )
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = if (enabled) {
                MaterialTheme.colorScheme.onSurface
            } else {
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
            }
        )
        // Row handles the click, so the Switch itself is not independently interactive
        Switch(checked = checked, onCheckedChange = null, enabled = enabled)
    }
}

// ───────────────────────── Settings link ─────────────────────────

@Composable
private fun SettingsLinkCard(onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CardShape)
            .clickable(role = Role.Button, onClick = onClick),
        shape = CardShape,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Surface(
                color = MaterialTheme.colorScheme.primaryContainer,
                shape = CircleShape,
                modifier = Modifier.size(44.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Hardware & POS settings",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Terminal pairing & hardware configuration",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// ───────────────────────── Dialogs ─────────────────────────

@Composable
fun AddPasskeyDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String) -> Unit
) {
    var name by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Register passkey") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Give this passkey a label, such as “Pixel 8 Pro” or “Work phone”.",
                    style = MaterialTheme.typography.bodyMedium
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Passkey name") },
                    placeholder = { Text("Android Device Passkey") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(name.trim()) }) { Text("Continue") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun EditProfileDialog(
    initialName: String,
    initialEmail: String,
    initialPhone: String,
    onDismiss: () -> Unit,
    onConfirm: (name: String, email: String, phone: String) -> Unit
) {
    var name by remember { mutableStateOf(initialName) }
    var email by remember { mutableStateOf(initialEmail) }
    var phone by remember { mutableStateOf(initialPhone) }

    val nameValid = name.isNotBlank()
    val emailValid = email.isBlank() || Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()
    val changed = name != initialName || email != initialEmail || phone != initialPhone

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit profile") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full name") },
                    singleLine = true,
                    isError = !nameValid,
                    supportingText = { if (!nameValid) Text("Name can't be empty") },
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email address") },
                    singleLine = true,
                    isError = !emailValid,
                    supportingText = { if (!emailValid) Text("Enter a valid email address") },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone number") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Phone,
                        imeAction = ImeAction.Done
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(name.trim(), email.trim(), phone.trim()) },
                enabled = nameValid && emailValid && changed
            ) { Text("Save changes") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}