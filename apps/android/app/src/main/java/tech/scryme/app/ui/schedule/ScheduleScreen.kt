package tech.scryme.app.ui.schedule

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

@Composable
fun ScheduleScreen(
    viewModel: ScheduleViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var showTradeDialog by remember { mutableStateOf<StaffShift?>(null) }
    var showBreakDialog by remember { mutableStateOf<StaffShift?>(null) }
    var showCreateShiftDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadSchedule()
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
                text = "Work Schedule",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            )

            if (uiState is ScheduleUiState.Success && (uiState as ScheduleUiState.Success).selectedTab == 1) {
                Button(
                    onClick = { showCreateShiftDialog = true },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("+ Add Shift", fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (val state = uiState) {
            is ScheduleUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is ScheduleUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { viewModel.loadSchedule() }) {
                            Text("Retry")
                        }
                    }
                }
            }
            is ScheduleUiState.Success -> {
                var showCheckInDialog by remember { mutableStateOf(false) }

                AttendanceStatusCard(
                    status = state.attendanceStatus,
                    onCheckInClick = { showCheckInDialog = true },
                    onCheckOutClick = {
                        viewModel.checkOutAttendance(locationId = state.attendanceStatus?.currentCheckInLocationId)
                    }
                )

                if (showCheckInDialog) {
                    CheckInAttendanceDialog(
                        locations = state.locations,
                        onDismiss = { showCheckInDialog = false },
                        onSubmit = { locId, code, lat, lng ->
                            viewModel.checkInAttendance(
                                locationId = locId,
                                branchCode = code,
                                latitude = lat,
                                longitude = lng
                            )
                            showCheckInDialog = false
                        }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                TabRow(selectedTabIndex = state.selectedTab) {
                    Tab(
                        selected = state.selectedTab == 0,
                        onClick = { viewModel.selectTab(0) },
                        text = { Text("My Schedule") }
                    )
                    Tab(
                        selected = state.selectedTab == 1,
                        onClick = { viewModel.selectTab(1) },
                        text = { Text("Team Roster") }
                    )
                    Tab(
                        selected = state.selectedTab == 2,
                        onClick = { viewModel.selectTab(2) },
                        text = { Text("Trades (${state.trades.size})") }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                when (state.selectedTab) {
                    0 -> MyShiftsList(
                        shifts = state.myShifts,
                        onRequestTrade = { showTradeDialog = it },
                        onAddBreak = { showBreakDialog = it }
                    )
                    1 -> TeamRosterList(
                        shifts = state.teamShifts
                    )
                    2 -> ShiftTradesList(
                        trades = state.trades,
                        onProcessTrade = { tradeId, action ->
                            viewModel.processShiftTrade(tradeId, action)
                        }
                    )
                }
            }
        }
    }

    showTradeDialog?.let { shift ->
        RequestTradeDialog(
            shift = shift,
            onDismiss = { showTradeDialog = null },
            onSubmit = { reason ->
                viewModel.requestShiftTrade(shift.id, targetMemberId = null, reason = reason)
                showTradeDialog = null
            }
        )
    }

    showBreakDialog?.let { shift ->
        AddBreakDialog(
            shift = shift,
            onDismiss = { showBreakDialog = null },
            onSubmit = { startTime, endTime, description ->
                viewModel.addShiftBreak(shift.id, startTime, endTime, description)
                showBreakDialog = null
            }
        )
    }

    if (showCreateShiftDialog) {
        CreateShiftDialog(
            onDismiss = { showCreateShiftDialog = false },
            onSubmit = { memberId, dayOfWeek, startTime, endTime ->
                viewModel.createStaffShift(memberId, dayOfWeek, startTime, endTime)
                showCreateShiftDialog = false
            }
        )
    }
}

@Composable
fun MyShiftsList(
    shifts: List<StaffShift>,
    onRequestTrade: (StaffShift) -> Unit,
    onAddBreak: (StaffShift) -> Unit
) {
    if (shifts.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No assigned shifts found", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    } else {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(shifts, key = { it.id }) { shift ->
                ShiftCard(
                    shift = shift,
                    onRequestTrade = { onRequestTrade(shift) },
                    onAddBreak = { onAddBreak(shift) }
                )
            }
        }
    }
}

@Composable
fun TeamRosterList(shifts: List<StaffShift>) {
    if (shifts.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No team shifts found", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    } else {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(shifts, key = { it.id }) { shift ->
                TeamShiftCard(shift = shift)
            }
        }
    }
}

@Composable
fun ShiftTradesList(
    trades: List<ShiftTrade>,
    onProcessTrade: (tradeId: String, action: String) -> Unit
) {
    if (trades.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No shift trade requests", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    } else {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(trades, key = { it.id }) { trade ->
                TradeCard(trade = trade, onProcessTrade = onProcessTrade)
            }
        }
    }
}

@Composable
fun ShiftCard(
    shift: StaffShift,
    onRequestTrade: () -> Unit,
    onAddBreak: () -> Unit
) {
    val dayName = getDayName(shift.dayOfWeek)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
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
                Text(
                    text = dayName,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onAddBreak,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("+ Break", fontSize = 11.sp)
                    }

                    Button(
                        onClick = onRequestTrade,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Trade / Swap", fontSize = 11.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Hours: ${shift.startTime} - ${shift.endTime}",
                style = MaterialTheme.typography.bodyMedium
            )

            if (shift.breaks.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Breaks:",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold)
                )
                shift.breaks.forEach { b ->
                    Text(
                        text = "• ${b.startTime} - ${b.endTime}${if (!b.description.isNullOrEmpty()) " (${b.description})" else ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun TeamShiftCard(shift: StaffShift) {
    val dayName = getDayName(shift.dayOfWeek)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = "Member: ${shift.memberId.take(8)}... - $dayName",
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Shift Time: ${shift.startTime} - ${shift.endTime}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun TradeCard(
    trade: ShiftTrade,
    onProcessTrade: (tradeId: String, action: String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Status: ${trade.status}",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                )

                if (trade.status.uppercase() == "PENDING") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { onProcessTrade(trade.id, "APPROVE") },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("Approve", fontSize = 11.sp)
                        }

                        Button(
                            onClick = { onProcessTrade(trade.id, "REJECT") },
                            colors = ButtonDefaults.buttonColors(containerColor = Rose500),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("Reject", fontSize = 11.sp)
                        }
                    }
                }
            }

            if (!trade.reason.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Reason: ${trade.reason}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun RequestTradeDialog(
    shift: StaffShift,
    onDismiss: () -> Unit,
    onSubmit: (String) -> Unit
) {
    var reason by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Shift Swap") },
        text = {
            Column {
                Text("Requesting trade for shift on ${getDayName(shift.dayOfWeek)} (${shift.startTime} - ${shift.endTime})")
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason for trade") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(reason) }) {
                Text("Submit Request")
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
fun AddBreakDialog(
    shift: StaffShift,
    onDismiss: () -> Unit,
    onSubmit: (startTime: String, endTime: String, description: String?) -> Unit
) {
    var startTime by remember { mutableStateOf("12:00") }
    var endTime by remember { mutableStateOf("12:30") }
    var description by remember { mutableStateOf("Meal break") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Break (${getDayName(shift.dayOfWeek)})") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = startTime,
                    onValueChange = { startTime = it },
                    label = { Text("Start Time (e.g. 12:00)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = endTime,
                    onValueChange = { endTime = it },
                    label = { Text("End Time (e.g. 12:30)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(startTime, endTime, description.ifBlank { null }) },
                enabled = startTime.isNotBlank() && endTime.isNotBlank()
            ) {
                Text("Add Break")
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
                OutlinedTextField(
                    value = memberId,
                    onValueChange = { memberId = it },
                    label = { Text("Staff Member ID") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = dayOfWeek,
                    onValueChange = { dayOfWeek = it },
                    label = { Text("Day of Week (1-7, Mon-Sun)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = startTime,
                    onValueChange = { startTime = it },
                    label = { Text("Start Time (09:00)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = endTime,
                    onValueChange = { endTime = it },
                    label = { Text("End Time (17:00)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val dayInt = dayOfWeek.toIntOrNull() ?: 1
                    onSubmit(memberId, dayInt, startTime, endTime)
                },
                enabled = memberId.isNotBlank() && startTime.isNotBlank() && endTime.isNotBlank()
            ) {
                Text("Create Shift")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun getDayName(dayOfWeek: Int): String {
    return when (dayOfWeek) {
        1 -> "Monday"
        2 -> "Tuesday"
        3 -> "Wednesday"
        4 -> "Thursday"
        5 -> "Friday"
        6 -> "Saturday"
        7 -> "Sunday"
        else -> "Day $dayOfWeek"
    }
}


@Composable
fun AttendanceStatusCard(
    status: tech.scryme.app.data.dto.AttendanceStatusDto?,
    onCheckInClick: () -> Unit,
    onCheckOutClick: () -> Unit
) {
    val isCheckedIn = status?.isCheckedIn == true
    val activeLog = status?.currentAttendanceLog

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(
            containerColor = if (isCheckedIn) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
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
                Column {
                    Text(
                        text = "Attendance Status",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (isCheckedIn) "✓ CHECKED IN" else "NOT CHECKED IN",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = if (isCheckedIn) Emerald500 else MaterialTheme.colorScheme.onSurface
                    )
                }

                if (isCheckedIn) {
                    Button(
                        onClick = onCheckOutClick,
                        colors = ButtonDefaults.buttonColors(containerColor = Rose500),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Check Out", fontSize = 12.sp)
                    }
                } else {
                    Button(
                        onClick = onCheckInClick,
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Check In", fontSize = 12.sp)
                    }
                }
            }

            if (isCheckedIn && activeLog != null) {
                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(10.dp))

                val locationName = activeLog.checkInLocation?.name ?: "Branch Location"
                Text(
                    text = "Location: $locationName",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                )

                val verificationLabel = when {
                    activeLog.isLocationVerified && activeLog.verificationMethod == "QR_SCAN" -> "✓ QR Code Verified"
                    activeLog.isLocationVerified && activeLog.verificationMethod == "GPS_GEOFENCE" -> "✓ GPS Geofence Verified"
                    activeLog.isLocationVerified -> "✓ Location Verified"
                    else -> "⚠ Location Unverified"
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = verificationLabel,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (activeLog.isLocationVerified) Emerald500 else Rose500
                )
            } else if (!isCheckedIn) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Verify your attendance via GPS location geofence or scanning the branch QR code.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun CheckInAttendanceDialog(
    locations: List<tech.scryme.app.domain.model.BranchLocation>,
    onDismiss: () -> Unit,
    onSubmit: (locationId: String?, branchCode: String?, latitude: Double?, longitude: Double?) -> Unit
) {
    var checkInMode by remember { mutableStateOf(0) }
    var selectedLocationId by remember { mutableStateOf(locations.firstOrNull()?.id ?: "") }
    var branchCode by remember { mutableStateOf("") }
    var latitudeText by remember { mutableStateOf("40.7128") }
    var longitudeText by remember { mutableStateOf("-74.0060") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Member Check-In") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                TabRow(selectedTabIndex = checkInMode) {
                    Tab(
                        selected = checkInMode == 0,
                        onClick = { checkInMode = 0 },
                        text = { Text("GPS Location", fontSize = 11.sp) }
                    )
                    Tab(
                        selected = checkInMode == 1,
                        onClick = { checkInMode = 1 },
                        text = { Text("QR Scan / Code", fontSize = 11.sp) }
                    )
                }

                if (checkInMode == 0) {
                    Text("Select Branch Location:", style = MaterialTheme.typography.labelSmall)

                    if (locations.isNotEmpty()) {
                        locations.forEach { loc ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp)
                            ) {
                                RadioButton(
                                    selected = selectedLocationId == loc.id,
                                    onClick = { selectedLocationId = loc.id }
                                )
                                Text(text = loc.name, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    } else {
                        OutlinedTextField(
                            value = selectedLocationId,
                            onValueChange = { selectedLocationId = it },
                            label = { Text("Location ID") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Coordinates (GPS Geofence):", style = MaterialTheme.typography.labelSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = latitudeText,
                            onValueChange = { latitudeText = it },
                            label = { Text("Latitude") },
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = longitudeText,
                            onValueChange = { longitudeText = it },
                            label = { Text("Latitude") },
                            modifier = Modifier.weight(1f)
                        )
                    }
                } else {
                    Text(
                        text = "Scan or enter the branch code from the store display QR code:",
                        style = MaterialTheme.typography.bodySmall
                    )

                    OutlinedTextField(
                        value = branchCode,
                        onValueChange = { branchCode = it },
                        label = { Text("Branch Code (e.g. BR-CENTRAL)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (checkInMode == 0) {
                        val lat = latitudeText.toDoubleOrNull()
                        val lng = longitudeText.toDoubleOrNull()
                        onSubmit(selectedLocationId.ifBlank { null }, null, lat, lng)
                    } else {
                        onSubmit(null, branchCode.ifBlank { null }, null, null)
                    }
                },
                enabled = if (checkInMode == 0) selectedLocationId.isNotBlank() else branchCode.isNotBlank()
            ) {
                Text("Confirm Check-In")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
