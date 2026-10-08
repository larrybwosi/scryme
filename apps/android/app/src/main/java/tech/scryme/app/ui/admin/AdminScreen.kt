package tech.scryme.app.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

@Composable
fun AdminScreen(
    viewModel: AdminViewModel,
    onNavigateToSales: (() -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()

    var showCreateShiftDialog by remember { mutableStateOf(false) }
    var showCreateTaskDialog by remember { mutableStateOf(false) }
    var selectedShiftForBreak by remember { mutableStateOf<StaffShift?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadAdminData()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Admin Management Hub",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Sales & Analytics Quick Banner
        Card(
            onClick = { onNavigateToSales?.invoke() },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.BarChart,
                        contentDescription = "Sales Analytics",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Column {
                        Text(
                            text = "Sales & Analytics Dashboard",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "View revenue, balance, & recent orders",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )
                    }
                }
                Text("View >", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onPrimaryContainer)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { showCreateShiftDialog = true },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("+ Create Shift", fontSize = 13.sp)
            }

            Button(
                onClick = { showCreateTaskDialog = true },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("+ Create Task", fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (val state = uiState) {
            is AdminUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is AdminUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.loadAdminData() }) {
                            Text("Retry")
                        }
                    }
                }
            }
            is AdminUiState.Success -> {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (state.pendingTrades.isNotEmpty()) {
                        item {
                            Text(
                                text = "Pending Shift Trade Approvals",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        items(state.pendingTrades, key = { it.id }) { trade ->
                            PendingTradeItem(
                                trade = trade,
                                onApprove = { viewModel.processTrade(trade.id, "APPROVED") },
                                onReject = { viewModel.processTrade(trade.id, "REJECTED") }
                            )
                        }
                    }

                    item {
                        Text(
                            text = "All Staff Shifts",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }

                    items(state.allShifts, key = { it.id }) { shift ->
                        AdminShiftCard(
                            shift = shift,
                            onAddBreak = { selectedShiftForBreak = shift }
                        )
                    }
                }
            }
        }
    }

    if (showCreateShiftDialog) {
        CreateShiftDialog(
            onDismiss = { showCreateShiftDialog = false },
            onSubmit = { memberId, dayOfWeek, startTime, endTime ->
                viewModel.createShift(memberId, dayOfWeek, startTime, endTime)
                showCreateShiftDialog = false
            }
        )
    }

    if (showCreateTaskDialog) {
        CreateTaskDialog(
            onDismiss = { showCreateTaskDialog = false },
            onSubmit = { title, desc, memberId, priority, dueDate ->
                viewModel.createTask(title, desc, memberId, priority, dueDate)
                showCreateTaskDialog = false
            }
        )
    }

    selectedShiftForBreak?.let { shift ->
        AddBreakDialog(
            shift = shift,
            onDismiss = { selectedShiftForBreak = null },
            onSubmit = { startTime, endTime, desc ->
                viewModel.addShiftBreak(shift.id, startTime, endTime, desc)
                selectedShiftForBreak = null
            }
        )
    }
}

@Composable
fun PendingTradeItem(
    trade: ShiftTrade,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = "Trade Request for Shift: ${trade.shiftId}", fontWeight = FontWeight.Bold)
            Text(text = "Requesting Member: ${trade.requestingMemberId}", style = MaterialTheme.typography.bodySmall)
            if (!trade.reason.isNullOrEmpty()) {
                Text(text = "Reason: ${trade.reason}", style = MaterialTheme.typography.bodySmall)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onApprove,
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Approve")
                }
                Button(
                    onClick = onReject,
                    colors = ButtonDefaults.buttonColors(containerColor = Rose500),
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Reject")
                }
            }
        }
    }
}

@Composable
fun AdminShiftCard(
    shift: StaffShift,
    onAddBreak: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Member: ${shift.memberId}", fontWeight = FontWeight.Bold)
                TextButton(onClick = onAddBreak) {
                    Text("+ Add Break")
                }
            }
            Text("Day ${shift.dayOfWeek} (${shift.startTime} - ${shift.endTime})", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun CreateShiftDialog(
    onDismiss: () -> Unit,
    onSubmit: (memberId: String, dayOfWeek: Int, startTime: String, endTime: String) -> Unit
) {
    var memberId by remember { mutableStateOf("") }
    var dayOfWeek by remember { mutableStateOf("1") }
    var startTime by remember { mutableStateOf("09:00") }
    var endTime by remember { mutableStateOf("17:00") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Staff Shift") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = memberId, onValueChange = { memberId = it }, label = { Text("Staff Member ID") })
                OutlinedTextField(value = dayOfWeek, onValueChange = { dayOfWeek = it }, label = { Text("Day of Week (1-7)") })
                OutlinedTextField(value = startTime, onValueChange = { startTime = it }, label = { Text("Start Time (e.g. 09:00)") })
                OutlinedTextField(value = endTime, onValueChange = { endTime = it }, label = { Text("End Time (e.g. 17:00)") })
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(memberId, dayOfWeek.toIntOrNull() ?: 1, startTime, endTime) }) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun CreateTaskDialog(
    onDismiss: () -> Unit,
    onSubmit: (title: String, desc: String?, memberId: String?, priority: String, dueDate: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var memberId by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("MEDIUM") }
    var dueDate by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Operational Task") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Title") })
                OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Description") })
                OutlinedTextField(value = memberId, onValueChange = { memberId = it }, label = { Text("Assign Member ID (Optional)") })
                OutlinedTextField(value = priority, onValueChange = { priority = it }, label = { Text("Priority (HIGH, MEDIUM, LOW)") })
                OutlinedTextField(value = dueDate, onValueChange = { dueDate = it }, label = { Text("Due Date (YYYY-MM-DD)") })
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(title, desc.ifBlank { null }, memberId.ifBlank { null }, priority, dueDate.ifBlank { null }) }) {
                Text("Assign Task")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
fun AddBreakDialog(
    shift: StaffShift,
    onDismiss: () -> Unit,
    onSubmit: (startTime: String, endTime: String, description: String?) -> Unit
) {
    var startTime by remember { mutableStateOf("12:00") }
    var endTime by remember { mutableStateOf("12:30") }
    var desc by remember { mutableStateOf("Lunch Break") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Break to Shift") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = startTime, onValueChange = { startTime = it }, label = { Text("Start Time") })
                OutlinedTextField(value = endTime, onValueChange = { endTime = it }, label = { Text("End Time") })
                OutlinedTextField(value = desc, onValueChange = { desc = it }, label = { Text("Description") })
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(startTime, endTime, desc.ifBlank { null }) }) {
                Text("Add Break")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
