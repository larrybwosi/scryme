package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.theme.ScrymeColors
import tech.scryme.admin.domain.session.SessionManager

private val CardRadius = 18.dp
private val ControlRadius = 12.dp
private val CardPadding = 22.dp

@Composable
private fun SectionCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .shadow(
                elevation = 10.dp,
                shape = RoundedCornerShape(CardRadius),
                ambientColor = Color.Black.copy(alpha = 0.35f),
                spotColor = Color.Black.copy(alpha = 0.35f)
            ),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
        shape = RoundedCornerShape(CardRadius),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(CardPadding), content = content)
    }
}

@Composable
private fun SectionHeader(title: String, icon: ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 18.dp)) {
        Box(
            modifier = Modifier
                .size(30.dp)
                .clip(RoundedCornerShape(9.dp))
                .background(
                    Brush.linearGradient(
                        listOf(
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.22f),
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(15.dp)
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = title,
            color = MaterialTheme.colorScheme.primary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.4.sp
        )
    }
}

@Composable
private fun PremiumFieldLabel(text: String) {
    Text(
        text = text,
        color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
        fontSize = 10.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 1.1.sp,
        modifier = Modifier.padding(bottom = 8.dp)
    )
}

@Composable
private fun PremiumDropdownField(
    icon: ImageVector,
    valueText: String,
    expanded: Boolean,
    onToggle: () -> Unit,
    onDismiss: () -> Unit,
    items: List<String>,
    onSelect: (String) -> Unit
) {
    Box(modifier = Modifier.fillMaxWidth()) {
        OutlinedButton(
            onClick = onToggle,
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(1.dp, ScrymeColors.SoftGray.copy(alpha = 0.16f)),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = ScrymeColors.Paper
            ),
            shape = RoundedCornerShape(ControlRadius),
            contentPadding = PaddingValues(vertical = 14.dp, horizontal = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(text = valueText, color = ScrymeColors.Paper, fontSize = 13.5.sp, fontWeight = FontWeight.Medium)
                }
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        DropdownMenu(
            expanded = expanded,
            onDismissRequest = onDismiss,
            modifier = Modifier
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(10.dp))
        ) {
            items.forEach { item ->
                DropdownMenuItem(
                    text = { Text(item, color = ScrymeColors.Paper, fontSize = 13.sp) },
                    onClick = { onSelect(item) }
                )
            }
        }
    }
}

@Composable
private fun PremiumToggleRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.background)
                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(16.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f, fill = false)) {
                Text(title, color = ScrymeColors.Paper, fontSize = 13.5.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    subtitle,
                    color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                    fontSize = 10.5.sp,
                    modifier = Modifier.padding(top = 1.dp)
                )
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = ScrymeColors.Paper,
                checkedTrackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.55f),
                uncheckedThumbColor = ScrymeColors.SoftGray,
                uncheckedTrackColor = MaterialTheme.colorScheme.background
            ),
            modifier = Modifier.scale(0.82f)
        )
    }
}

@Composable
fun SettingsView(
    presenceViewModel: PresenceViewModel,
    sessionManager: SessionManager,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val branches by presenceViewModel.branches.collectAsState()

    val themePref by sessionManager.themePreference.collectAsState()
    val syncIntervalPref by sessionManager.syncIntervalSeconds.collectAsState()
    val notificationsPref by sessionManager.notificationsEnabled.collectAsState()
    val autoLoginPref by sessionManager.autoLoginEnabled.collectAsState()
    val currentBaseUrl by sessionManager.baseUrl.collectAsState()

    var newBranchName by remember { mutableStateOf("") }
    var newBranchCode by remember { mutableStateOf("") }
    var newBranchType by remember { mutableStateOf("RETAIL_SHOP") }
    var showTypeDropdown by remember { mutableStateOf(false) }

    var showThemeDropdown by remember { mutableStateOf(false) }
    var showSyncDropdown by remember { mutableStateOf(false) }
    var customUrlInput by remember { mutableStateOf(currentBaseUrl ?: "https://api.scryme.tech") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 12.dp, bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // ---------- Header ----------
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBackToHome,
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f), RoundedCornerShape(11.dp))
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = ScrymeColors.SoftGray.copy(alpha = 0.9f),
                    modifier = Modifier.size(17.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text(
                    text = "SCRYME ADMIN",
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.85f),
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.2.sp,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
                Text(
                    text = "Settings",
                    color = ScrymeColors.Paper,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.3).sp
                )
            }
        }

        // ---------- Preferences & Customization ----------
        SectionCard {
            SectionHeader("PREFERENCES & CUSTOMIZATION", Icons.Default.Tune)

            PremiumFieldLabel("APP THEME")
            PremiumDropdownField(
                icon = Icons.Default.Palette,
                valueText = themePref,
                expanded = showThemeDropdown,
                onToggle = { showThemeDropdown = !showThemeDropdown },
                onDismiss = { showThemeDropdown = false },
                items = listOf("Deep Navy", "Amoled Black", "Forest Dark"),
                onSelect = {
                    sessionManager.saveThemePreference(it)
                    showThemeDropdown = false
                    Toast.makeText(context, "Theme updated to: $it", Toast.LENGTH_SHORT).show()
                }
            )

            Spacer(modifier = Modifier.height(18.dp))

            PremiumFieldLabel("SYNC INTERVAL")
            PremiumDropdownField(
                icon = Icons.Default.Refresh,
                valueText = "Every $syncIntervalPref seconds",
                expanded = showSyncDropdown,
                onToggle = { showSyncDropdown = !showSyncDropdown },
                onDismiss = { showSyncDropdown = false },
                items = listOf(5, 10, 30, 60).map { "$it seconds" },
                onSelect = { label ->
                    val seconds = label.substringBefore(" ").toInt()
                    sessionManager.saveSyncInterval(seconds)
                    showSyncDropdown = false
                    Toast.makeText(context, "Refresh interval configured to: $seconds seconds", Toast.LENGTH_SHORT).show()
                }
            )

            Spacer(modifier = Modifier.height(20.dp))
            HorizontalDivider(color = ScrymeColors.Paper.copy(alpha = 0.06f))
            Spacer(modifier = Modifier.height(20.dp))

            PremiumToggleRow(
                icon = Icons.Default.NotificationsNone,
                title = "Approval Notifications",
                subtitle = "Alerts for price & stock approvals",
                checked = notificationsPref,
                onCheckedChange = {
                    sessionManager.saveNotificationsEnabled(it)
                    Toast.makeText(context, if (it) "Notifications enabled" else "Notifications muted", Toast.LENGTH_SHORT).show()
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            PremiumToggleRow(
                icon = Icons.Default.Lock,
                title = "Remember Credentials",
                subtitle = "Store secure login for auto sign-in",
                checked = autoLoginPref,
                onCheckedChange = {
                    sessionManager.saveAutoLoginEnabled(it)
                    Toast.makeText(context, if (it) "Remember login active" else "Credentials won't be saved", Toast.LENGTH_SHORT).show()
                }
            )

            Spacer(modifier = Modifier.height(20.dp))
            HorizontalDivider(color = ScrymeColors.Paper.copy(alpha = 0.06f))
            Spacer(modifier = Modifier.height(20.dp))

            PremiumFieldLabel("ACTIVE SERVER ENDPOINT")

            OutlinedTextField(
                value = customUrlInput,
                onValueChange = { customUrlInput = it },
                placeholder = { Text("https://api.scryme.tech", color = ScrymeColors.SoftGray.copy(alpha = 0.4f)) },
                leadingIcon = {
                    Icon(Icons.Default.Dns, contentDescription = null, tint = ScrymeColors.SoftGray.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(ControlRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.16f),
                    focusedLabelColor = MaterialTheme.colorScheme.primary,
                    cursorColor = MaterialTheme.colorScheme.primary,
                    focusedTextColor = ScrymeColors.Paper,
                    unfocusedTextColor = ScrymeColors.Paper
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        customUrlInput = "https://api.scryme.tech"
                        sessionManager.saveBaseUrl("https://api.scryme.tech")
                        Toast.makeText(context, "Cloud Server configured", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, ScrymeColors.SoftGray.copy(alpha = 0.14f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        contentColor = ScrymeColors.Paper
                    ),
                    contentPadding = PaddingValues(vertical = 11.dp)
                ) {
                    Text("Cloud", fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                }

                OutlinedButton(
                    onClick = {
                        customUrlInput = "http://10.0.2.2:3002"
                        sessionManager.saveBaseUrl("http://10.0.2.2:3002")
                        Toast.makeText(context, "Local Emulator configured", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, ScrymeColors.SoftGray.copy(alpha = 0.14f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        contentColor = ScrymeColors.Paper
                    ),
                    contentPadding = PaddingValues(vertical = 11.dp)
                ) {
                    Text("Emulator", fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                }

                Button(
                    onClick = {
                        val cleaned = customUrlInput.trim().removeSuffix("/")
                        sessionManager.saveBaseUrl(cleaned)
                        Toast.makeText(context, "Node updated: $cleaned", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.background
                    ),
                    contentPadding = PaddingValues(vertical = 11.dp)
                ) {
                    Text("Apply", fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // ---------- Branch Registry ----------
        SectionCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                SectionHeader("BRANCH REGISTRY", Icons.Default.Storefront)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(MaterialTheme.colorScheme.background)
                        .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        "${branches.size} total",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (branches.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Storefront,
                        contentDescription = null,
                        tint = ScrymeColors.SoftGray.copy(alpha = 0.25f),
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No branches registered yet",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                        fontSize = 13.sp
                    )
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    branches.forEach { branch ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(MaterialTheme.colorScheme.background)
                                .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(if (branch.isActive) ScrymeColors.GreenLogo else ScrymeColors.SoftGray.copy(alpha = 0.35f))
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(text = branch.name, color = ScrymeColors.Paper, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    Text(
                                        text = "ID · ${branch.id}",
                                        color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(top = 1.dp)
                                    )
                                }
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = if (branch.isActive) "Active" else "Inactive",
                                    color = if (branch.isActive) ScrymeColors.GreenLogo else ScrymeColors.SoftGray.copy(alpha = 0.5f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.padding(end = 10.dp)
                                )
                                Switch(
                                    checked = branch.isActive,
                                    onCheckedChange = {
                                        presenceViewModel.toggleBranchStatus(branch.id)
                                        Toast.makeText(context, "${branch.name} status updated", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = ScrymeColors.Paper,
                                        checkedTrackColor = ScrymeColors.GreenLogo.copy(alpha = 0.5f),
                                        uncheckedThumbColor = ScrymeColors.SoftGray,
                                        uncheckedTrackColor = MaterialTheme.colorScheme.background
                                    ),
                                    modifier = Modifier.scale(0.8f)
                                )
                            }
                        }
                    }
                }
            }
        }

        // ---------- Register New Branch ----------
        SectionCard {
            SectionHeader("REGISTER NEW BRANCH", Icons.Default.AddBusiness)

            OutlinedTextField(
                value = newBranchName,
                onValueChange = { newBranchName = it },
                label = { Text("Branch name", color = ScrymeColors.SoftGray.copy(alpha = 0.65f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(ControlRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.16f),
                    focusedLabelColor = MaterialTheme.colorScheme.primary,
                    cursorColor = MaterialTheme.colorScheme.primary,
                    focusedTextColor = ScrymeColors.Paper,
                    unfocusedTextColor = ScrymeColors.Paper
                )
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = newBranchCode,
                onValueChange = { newBranchCode = it },
                label = { Text("Branch code (optional)", color = ScrymeColors.SoftGray.copy(alpha = 0.65f)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(ControlRadius),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.16f),
                    focusedLabelColor = MaterialTheme.colorScheme.primary,
                    cursorColor = MaterialTheme.colorScheme.primary,
                    focusedTextColor = ScrymeColors.Paper,
                    unfocusedTextColor = ScrymeColors.Paper
                )
            )

            Spacer(modifier = Modifier.height(18.dp))

            PremiumFieldLabel("BRANCH TYPE")
            PremiumDropdownField(
                icon = Icons.Default.Category,
                valueText = newBranchType,
                expanded = showTypeDropdown,
                onToggle = { showTypeDropdown = !showTypeDropdown },
                onDismiss = { showTypeDropdown = false },
                items = listOf("RETAIL_SHOP", "WAREHOUSE", "KITCHEN", "OFFICE"),
                onSelect = {
                    newBranchType = it
                    showTypeDropdown = false
                }
            )

            Spacer(modifier = Modifier.height(22.dp))

            Button(
                onClick = {
                    if (newBranchName.isNotBlank()) {
                        presenceViewModel.addBranch(newBranchName, newBranchCode.ifBlank { null }, newBranchType)
                        Toast.makeText(context, "$newBranchName successfully registered", Toast.LENGTH_SHORT).show()
                        newBranchName = ""
                        newBranchCode = ""
                    } else {
                        Toast.makeText(context, "Branch name is required", Toast.LENGTH_SHORT).show()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .shadow(8.dp, RoundedCornerShape(ControlRadius), spotColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.background
                ),
                shape = RoundedCornerShape(ControlRadius)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Register branch", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, letterSpacing = 0.3.sp)
                }
            }
        }
    }
}
