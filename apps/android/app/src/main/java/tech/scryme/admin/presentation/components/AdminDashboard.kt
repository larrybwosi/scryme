package tech.scryme.admin.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
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
    var showQrScanner by remember { mutableStateOf(false) }
    val deviceAuthState = deviceAuthViewModel?.uiState?.collectAsState()?.value
    val branches by presenceViewModel.branches.collectAsState()
    val presenceState by presenceViewModel.presenceState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scryme Admin Dashboard") },
                actions = {
                    IconButton(onClick = { showQrScanner = true }) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = "Scan POS QR"
                        )
                    }
                    TextButton(onClick = onSignOut) {
                        Text("Sign Out")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("User: $userName", style = MaterialTheme.typography.titleMedium)
                    Text("Email: $userEmail", style = MaterialTheme.typography.bodyMedium)
                    Text("Organization: $activeOrg", style = MaterialTheme.typography.bodyMedium)

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { showQrScanner = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCodeScanner,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Authorize POS Device (Scan QR)")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("Branches (${branches.size})", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            if (branches.isEmpty()) {
                Text("No branches found or loaded.", style = MaterialTheme.typography.bodyMedium)
            } else {
                branches.forEach { branch ->
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
                            Text(branch.name, style = MaterialTheme.typography.bodyLarge)
                            Text(if (branch.isActive) "Active" else "Inactive", color = MaterialTheme.colorScheme.secondary)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("Presence Status", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))

            when (presenceState) {
                is UiState.Loading -> CircularProgressIndicator()
                is UiState.Success -> {
                    val members = (presenceState as UiState.Success).data
                    Text("Online Members: ${members.size}", style = MaterialTheme.typography.bodyMedium)
                }
                is UiState.Error -> Text((presenceState as UiState.Error).message, color = MaterialTheme.colorScheme.error)
                else -> Text("Presence idle", style = MaterialTheme.typography.bodyMedium)
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
                    title = { Text("Authorizing Device") },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(16.dp))
                            Text("Provisioning POS terminal with organization...")
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
                            "Device ${state.data.device?.deviceName ?: "Terminal"} has been successfully authorized and added to your organization."
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
