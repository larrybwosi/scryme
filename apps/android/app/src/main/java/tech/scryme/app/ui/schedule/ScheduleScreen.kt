package tech.scryme.app.ui.schedule

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.MemberAvatar
import tech.scryme.app.ui.components.MemberDropdown
import tech.scryme.app.ui.components.QrScannerDialog
import tech.scryme.app.ui.components.StyledFormDialog
import tech.scryme.app.ui.components.TimePickerTextField
import tech.scryme.app.ui.components.WeekdayDropdown
import tech.scryme.app.ui.theme.Amber500
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

// ---------------------------------------------------------------------------
// Shared design tokens
// ---------------------------------------------------------------------------

private val CardShape = RoundedCornerShape(8.dp)
private val ControlShape = RoundedCornerShape(6.dp)
private val ChipShape = RoundedCornerShape(4.dp)
private val CompactButtonPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = MaterialTheme.colorScheme.outline
)

/** Flat, bordered container used across the screen for a consistent enterprise look. */
@Composable
private fun OutlinedSurface(
    modifier: Modifier = Modifier,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    content: @Composable () -> Unit
) {
    Surface(
        shape = CardShape,
        color = containerColor,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        tonalElevation = 0.dp,
        shadowElevation = 0.dp,
        modifier = modifier.fillMaxWidth(),
        content = content
    )
}

@Composable
private fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.8.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier
    )
}

@Composable
private fun StatusChip(text: String, color: Color) {
    Surface(
        shape = ChipShape,
        color = color.copy(alpha = 0.12f)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = color,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
private fun CenteredMessage(text: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@Composable
fun ScheduleScreen(
    viewModel: ScheduleViewModel
) {
    val uiState by viewModel.uiState.collectAsState()
    var showTradeDialog by remember { mutableStateOf<StaffShift?>(null) }
    var showBreakDialog by remember { mutableStateOf<StaffShift?>(null) }
    var showCreateShiftDialog by remember { mutableStateOf(false) }
    var shiftToAssess by remember { mutableStateOf<StaffShift?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadSchedule()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Work Schedule",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            )

            if (uiState is ScheduleUiState.Success && (uiState as ScheduleUiState.Success).selectedTab == 1) {
                Button(
                    onClick = { showCreateShiftDialog = true },
                    shape = ControlShape,
                    contentPadding = PaddingValues(start = 10.dp, end = 14.dp, top = 6.dp, bottom = 6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Add,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Add Shift",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        when (val state = uiState) {
            is ScheduleUiState.Loading -> {
                ListSkeleton(count = 4)
            }
            is ScheduleUiState.Error -> {
                ErrorMessageCard(
                    title = "Unable to load schedule",
                    message = state.message,
                    onRetry = { viewModel.loadSchedule() }
                )
            }
            is ScheduleUiState.Success -> {
                var showCheckInDialog by remember { mutableStateOf(false) }

                if (!state.errorMessage.isNullOrEmpty()) {
                    ErrorMessageCard(
                        title = "Check-In Blocked",
                        message = state.errorMessage,
                        onRetry = { viewModel.clearError() }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

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

                Spacer(modifier = Modifier.height(12.dp))

                TabRow(
                    selectedTabIndex = state.selectedTab,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    Tab(
                        selected = state.selectedTab == 0,
                        onClick = { viewModel.selectTab(0) },
                        text = { Text("My Schedule", style = MaterialTheme.typography.labelLarge) }
                    )
                    Tab(
                        selected = state.selectedTab == 1,
                        onClick = { viewModel.selectTab(1) },
                        text = { Text("Team Roster", style = MaterialTheme.typography.labelLarge) }
                    )
                    Tab(
                        selected = state.selectedTab == 2,
                        onClick = { viewModel.selectTab(2) },
                        text = { Text("Trades (${state.trades.size})", style = MaterialTheme.typography.labelLarge) }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                when (state.selectedTab) {
                    0 -> MyShiftsList(
                        shifts = state.myShifts,
                        onRequestTrade = { showTradeDialog = it },
                        onAddBreak = { showBreakDialog = it },
                        onAssessShift = { shiftToAssess = it }
                    )
                    1 -> TeamRosterList(
                        shifts = state.teamShifts,
                        members = state.members,
                        onAssessShift = { shiftToAssess = it }
                    )
                    2 -> ShiftTradesList(
                        trades = state.trades,
                        members = state.members,
                        shifts = state.teamShifts.ifEmpty { state.myShifts },
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
            members = (uiState as? ScheduleUiState.Success)?.members ?: emptyList(),
            onDismiss = { showTradeDialog = null },
            onSubmit = { targetMemberId, reason ->
                viewModel.requestShiftTrade(shift.id, targetMemberId = targetMemberId, reason = reason)
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
            members = (uiState as? ScheduleUiState.Success)?.members ?: emptyList(),
            onDismiss = { showCreateShiftDialog = false },
            onSubmit = { memberId, dayOfWeek, startTime, endTime ->
                viewModel.createStaffShift(memberId, dayOfWeek, startTime, endTime)
                showCreateShiftDialog = false
            }
        )
    }

    shiftToAssess?.let { shift ->
        ShiftAssessmentDialog(
            shift = shift,
            onDismiss = { shiftToAssess = null },
            onSubmit = { rating, punctuality, notes ->
                viewModel.saveShiftAssessment(
                    shiftId = shift.id,
                    ratingScore = rating,
                    attendancePunctuality = punctuality,
                    shiftNotes = notes.ifBlank { null },
                    onSuccess = {
                        shiftToAssess = null
                    }
                )
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

@Composable
fun MyShiftsList(
    shifts: List<StaffShift>,
    onRequestTrade: (StaffShift) -> Unit,
    onAddBreak: (StaffShift) -> Unit,
    onAssessShift: (StaffShift) -> Unit
) {
    if (shifts.isEmpty()) {
        CenteredMessage("No assigned shifts found")
    } else {
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            items(shifts, key = { it.id }) { shift ->
                ShiftCard(
                    shift = shift,
                    onRequestTrade = { onRequestTrade(shift) },
                    onAddBreak = { onAddBreak(shift) },
                    onAssessShift = { onAssessShift(shift) }
                )
            }
        }
    }
}

@Composable
fun TeamRosterList(
    shifts: List<StaffShift>,
    members: List<UserProfile> = emptyList(),
    onAssessShift: (StaffShift) -> Unit
) {
    if (shifts.isEmpty()) {
        CenteredMessage("No team shifts found")
    } else {
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            items(shifts, key = { it.id }) { shift ->
                val member = members.find { it.id == shift.memberId }
                TeamShiftCard(shift = shift, member = member, onAssessShift = { onAssessShift(shift) })
            }
        }
    }
}

@Composable
fun ShiftTradesList(
    trades: List<ShiftTrade>,
    members: List<UserProfile> = emptyList(),
    shifts: List<StaffShift> = emptyList(),
    onProcessTrade: (tradeId: String, action: String) -> Unit
) {
    if (trades.isEmpty()) {
        CenteredMessage("No shift trade requests")
    } else {
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            items(trades, key = { it.id }) { trade ->
                val requestingMember = members.find { it.id == trade.requestingMemberId }
                val targetMember = members.find { it.id == trade.targetMemberId }
                val shift = shifts.find { it.id == trade.shiftId }

                TradeCard(
                    trade = trade,
                    requestingMember = requestingMember,
                    targetMember = targetMember,
                    shift = shift,
                    onProcessTrade = onProcessTrade
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

@Composable
fun ShiftCard(
    shift: StaffShift,
    onRequestTrade: () -> Unit,
    onAddBreak: () -> Unit,
    onAssessShift: () -> Unit
) {
    val dayName = getDayName(shift.dayOfWeek)
    val assessment = shift.assessment

    OutlinedSurface {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = dayName,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Schedule,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${shift.startTime} - ${shift.endTime}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onAddBreak,
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text("+ Break", style = MaterialTheme.typography.labelMedium)
                    }

                    Button(
                        onClick = onRequestTrade,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text("Trade / Swap", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }

            if (shift.breaks.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                SectionLabel("Breaks")
                Spacer(modifier = Modifier.height(4.dp))
                shift.breaks.forEach { b ->
                    Text(
                        text = "${b.startTime} - ${b.endTime}${if (!b.description.isNullOrEmpty()) "  ·  ${b.description}" else ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(10.dp))

            // Shift assessment row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (assessment != null) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            repeat(5) { index ->
                                Icon(
                                    imageVector = if (index < assessment.ratingScore) Icons.Filled.Star else Icons.Outlined.Star,
                                    contentDescription = null,
                                    tint = Amber500,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Punctuality: ${assessment.attendancePunctuality}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    Text(
                        text = "No assessment recorded",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedButton(
                    onClick = onAssessShift,
                    shape = ControlShape,
                    contentPadding = CompactButtonPadding
                ) {
                    Text(
                        text = if (assessment != null) "Edit Review" else "Assess Shift",
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }
        }
    }
}

@Composable
fun TeamShiftCard(
    shift: StaffShift,
    member: UserProfile? = null,
    onAssessShift: () -> Unit
) {
    val dayName = getDayName(shift.dayOfWeek)
    val assessment = shift.assessment
    val memberName = member?.name ?: "Member: ${shift.memberId.take(8)}..."

    OutlinedSurface {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                MemberAvatar(
                    avatarUrl = member?.avatarUrl,
                    name = member?.name ?: "",
                    modifier = Modifier.size(36.dp)
                )
                Column {
                    Text(
                        text = memberName,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (!member?.role.isNullOrBlank()) {
                        Text(
                            text = member!!.role!!,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Text(
                        text = "$dayName  ·  ${shift.startTime} - ${shift.endTime}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            OutlinedButton(
                onClick = onAssessShift,
                shape = ControlShape,
                contentPadding = CompactButtonPadding
            ) {
                Text(
                    text = if (assessment != null) "Rating: ${assessment.ratingScore}★" else "Assess",
                    style = MaterialTheme.typography.labelMedium
                )
            }
        }
    }
}

@Composable
fun TradeCard(
    trade: ShiftTrade,
    requestingMember: UserProfile? = null,
    targetMember: UserProfile? = null,
    shift: StaffShift? = null,
    onProcessTrade: (tradeId: String, action: String) -> Unit
) {
    val statusColor = when (trade.status.uppercase()) {
        "PENDING" -> Amber500
        "APPROVED" -> Emerald500
        "REJECTED" -> Rose500
        "CANCELLED" -> MaterialTheme.colorScheme.onSurfaceVariant
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    val shiftDetails = if (shift != null) {
        "${getDayName(shift.dayOfWeek)}  ·  ${shift.startTime} - ${shift.endTime}"
    } else {
        "Shift ID: ${trade.shiftId.take(8)}..."
    }

    val requesterName = requestingMember?.name ?: "Member ${trade.requestingMemberId.take(6)}"
    val targetName = targetMember?.name ?: "Open Trade (Any Member)"

    OutlinedSurface {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    MemberAvatar(
                        avatarUrl = requestingMember?.avatarUrl,
                        name = requesterName,
                        modifier = Modifier.size(36.dp)
                    )
                    Column {
                        Text(
                            text = requesterName,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Target: $targetName",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                StatusChip(text = trade.status.uppercase(), color = statusColor)
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(10.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Filled.Schedule,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = shiftDetails,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            if (!trade.reason.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Reason: ${trade.reason}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (trade.status.uppercase() == "PENDING") {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = { onProcessTrade(trade.id, "CANCEL") },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.onSurfaceVariant),
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text("Cancel", style = MaterialTheme.typography.labelMedium)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    OutlinedButton(
                        onClick = { onProcessTrade(trade.id, "REJECT") },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose500),
                        border = BorderStroke(1.dp, Rose500.copy(alpha = 0.6f)),
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text("Reject", style = MaterialTheme.typography.labelMedium)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Button(
                        onClick = { onProcessTrade(trade.id, "APPROVE") },
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text("Approve", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }
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
    val accent = if (isCheckedIn) Emerald500 else Rose500

    OutlinedSurface {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
        ) {
            // Status accent bar
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .background(accent)
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        SectionLabel("Attendance status")
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(accent)
                            )
                            Text(
                                text = if (isCheckedIn) "Checked In" else "Not Checked In",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    if (isCheckedIn) {
                        OutlinedButton(
                            onClick = onCheckOutClick,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose500),
                            border = BorderStroke(1.dp, Rose500.copy(alpha = 0.6f)),
                            shape = ControlShape,
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = "Check Out",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    } else {
                        Button(
                            onClick = onCheckInClick,
                            shape = ControlShape,
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = "Check In",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                if (isCheckedIn && activeLog != null) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(10.dp))

                    val locationName = activeLog.checkInLocation?.name ?: "Branch Location"
                    Text(
                        text = "Location: $locationName",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    val verificationLabel = when {
                        activeLog.isLocationVerified && activeLog.verificationMethod == "QR_SCAN" -> "QR code verified"
                        activeLog.isLocationVerified && activeLog.verificationMethod == "GPS_GEOFENCE" -> "GPS geofence verified"
                        activeLog.isLocationVerified -> "Location verified"
                        else -> "Location unverified"
                    }
                    val verificationColor = if (activeLog.isLocationVerified) Emerald500 else Rose500

                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (activeLog.isLocationVerified) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                            contentDescription = null,
                            tint = verificationColor,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = verificationLabel,
                            style = MaterialTheme.typography.bodySmall,
                            color = verificationColor
                        )
                    }
                } else if (!isCheckedIn) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Verify your attendance via GPS location geofence or by scanning the branch QR code.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

@Composable
fun RequestTradeDialog(
    shift: StaffShift,
    members: List<UserProfile> = emptyList(),
    onDismiss: () -> Unit,
    onSubmit: (targetMemberId: String?, reason: String) -> Unit
) {
    var targetMemberId by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }

    StyledFormDialog(
        title = "Request Shift Swap",
        onDismissRequest = onDismiss,
        confirmButtonText = "Submit Request",
        onConfirm = { onSubmit(targetMemberId.ifBlank { null }, reason) },
        confirmEnabled = reason.isNotBlank()
    ) {
        Text(
            text = "Requesting trade for shift on ${getDayName(shift.dayOfWeek)} (${shift.startTime} - ${shift.endTime})",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        MemberDropdown(
            selectedMemberId = targetMemberId,
            onMemberSelected = { targetMemberId = it },
            members = members,
            label = "Swap Target Member (Optional)",
            allowUnassigned = true,
            placeholder = "Open Trade (Any Team Member)"
        )

        OutlinedTextField(
            value = reason,
            onValueChange = { reason = it },
            label = { Text("Reason for trade *") },
            placeholder = { Text("e.g. Schedule conflict or personal emergency") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun AddBreakDialog(
    shift: StaffShift,
    onDismiss: () -> Unit,
    onSubmit: (startTime: String, endTime: String, description: String?) -> Unit
) {
    var startTime by remember { mutableStateOf(shift.startTime.ifBlank { "12:00" }) }
    var endTime by remember { mutableStateOf(shift.endTime.ifBlank { "12:30" }) }
    var description by remember { mutableStateOf("Meal break") }

    StyledFormDialog(
        title = "Add Break (${getDayName(shift.dayOfWeek)})",
        onDismissRequest = onDismiss,
        confirmButtonText = "Add Break",
        onConfirm = { onSubmit(startTime, endTime, description.ifBlank { null }) },
        confirmEnabled = startTime.isNotBlank() && endTime.isNotBlank()
    ) {
        TimePickerTextField(
            value = startTime,
            onValueChange = { startTime = it },
            label = "Start Time *"
        )
        TimePickerTextField(
            value = endTime,
            onValueChange = { endTime = it },
            label = "End Time *"
        )
        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun CreateShiftDialog(
    members: List<UserProfile>,
    onDismiss: () -> Unit,
    onSubmit: (memberId: String, dayOfWeek: Int, startTime: String, endTime: String) -> Unit
) {
    var memberId by remember { mutableStateOf("") }
    var dayOfWeek by remember { mutableStateOf(1) }
    var startTime by remember { mutableStateOf("09:00") }
    var endTime by remember { mutableStateOf("17:00") }

    StyledFormDialog(
        title = "Create Staff Shift",
        onDismissRequest = onDismiss,
        confirmButtonText = "Create Shift",
        onConfirm = {
            onSubmit(memberId, dayOfWeek, startTime, endTime)
        },
        confirmEnabled = memberId.isNotBlank() && startTime.isNotBlank() && endTime.isNotBlank()
    ) {
        MemberDropdown(
            selectedMemberId = memberId,
            onMemberSelected = { memberId = it },
            members = members,
            label = "Staff Member *"
        )
        WeekdayDropdown(
            selectedDayOfWeek = dayOfWeek,
            onDaySelected = { dayOfWeek = it },
            label = "Day of Week *"
        )
        TimePickerTextField(
            value = startTime,
            onValueChange = { startTime = it },
            label = "Start Time *"
        )
        TimePickerTextField(
            value = endTime,
            onValueChange = { endTime = it },
            label = "End Time *"
        )
    }
}

@Composable
fun ShiftAssessmentDialog(
    shift: StaffShift,
    onDismiss: () -> Unit,
    onSubmit: (
        ratingScore: Int,
        attendancePunctuality: String,
        notes: String
    ) -> Unit
) {
    val existing = shift.assessment
    var ratingScore by remember { mutableStateOf(existing?.ratingScore ?: 5) }
    var attendancePunctuality by remember { mutableStateOf(existing?.attendancePunctuality ?: "ON_TIME") }
    var shiftNotes by remember { mutableStateOf(existing?.shiftNotes ?: "") }

    StyledFormDialog(
        title = "Shift Assessment & Performance Review",
        onDismissRequest = onDismiss,
        confirmButtonText = "Save Shift Assessment",
        onConfirm = {
            onSubmit(ratingScore, attendancePunctuality, shiftNotes)
        }
    ) {
        Text(
            text = "Shift on ${getDayName(shift.dayOfWeek)} (${shift.startTime} - ${shift.endTime})",
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(8.dp))

        SectionLabel("Performance rating")
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            (1..5).forEach { star ->
                Icon(
                    imageVector = if (star <= ratingScore) Icons.Filled.Star else Icons.Outlined.Star,
                    contentDescription = "Star $star",
                    tint = Amber500,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .clickable { ratingScore = star }
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "$ratingScore / 5",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        SectionLabel("Attendance & punctuality")
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            listOf("ON_TIME", "LATE", "EARLY_LEAVE", "ABSENT").forEach { status ->
                FilterChip(
                    selected = attendancePunctuality == status,
                    onClick = { attendancePunctuality = status },
                    shape = ControlShape,
                    label = { Text(status.replace("_", " "), fontSize = 10.sp) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = shiftNotes,
            onValueChange = { shiftNotes = it },
            label = { Text("Shift Performance Notes & Audit Feedback") },
            placeholder = { Text("e.g. Excellent teamwork, completed all store duties.") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
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
    var latitudeText by remember { mutableStateOf("") }
    var longitudeText by remember { mutableStateOf("") }
    var showQrScanner by remember { mutableStateOf(false) }

    StyledFormDialog(
        title = "Member Check-In",
        onDismissRequest = onDismiss,
        confirmButtonText = "Check In",
        onConfirm = {
            if (checkInMode == 0) {
                val lat = latitudeText.toDoubleOrNull()
                val lng = longitudeText.toDoubleOrNull()
                onSubmit(selectedLocationId.ifBlank { null }, null, lat, lng)
            } else {
                onSubmit(selectedLocationId.ifBlank { null }, branchCode.ifBlank { null }, null, null)
            }
        }
    ) {
        TabRow(
            selectedTabIndex = checkInMode,
            containerColor = Color.Transparent,
            contentColor = MaterialTheme.colorScheme.primary
        ) {
            Tab(
                selected = checkInMode == 0,
                onClick = { checkInMode = 0 },
                text = { Text("GPS Location", style = MaterialTheme.typography.labelMedium) }
            )
            Tab(
                selected = checkInMode == 1,
                onClick = { checkInMode = 1 },
                text = { Text("QR Scan / Code", style = MaterialTheme.typography.labelMedium) }
            )
        }

        if (checkInMode == 0) {
            SectionLabel("Branch location")

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
                        Column {
                            Text(text = loc.name, style = MaterialTheme.typography.bodyMedium)
                            if (loc.latitude != null && loc.longitude != null) {
                                Text(
                                    text = "📍 Pinned (${"%.4f".format(loc.latitude)}, ${"%.4f".format(loc.longitude)})",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Emerald500
                                )
                            }
                        }
                    }
                }
            } else {
                OutlinedTextField(
                    value = selectedLocationId,
                    onValueChange = { selectedLocationId = it },
                    label = { Text("Location ID") },
                    shape = ControlShape,
                    colors = fieldColors(),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "GPS coordinates will automatically be acquired during check-in to verify you are within 50m of the pinned branch.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            SectionLabel("Branch location (optional)")

            if (locations.isNotEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp)
                ) {
                    RadioButton(
                        selected = selectedLocationId.isBlank(),
                        onClick = { selectedLocationId = "" }
                    )
                    Text(text = "Auto-detect from QR / None", style = MaterialTheme.typography.bodySmall)
                }
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
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = { showQrScanner = true },
                modifier = Modifier.fillMaxWidth(),
                shape = ControlShape
            ) {
                Icon(
                    imageVector = Icons.Filled.QrCodeScanner,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Launch QR Scanner",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Or enter the branch code manually:",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            OutlinedTextField(
                value = branchCode,
                onValueChange = { branchCode = it },
                label = { Text("Branch Code (e.g. BR-CENTRAL)") },
                shape = ControlShape,
                colors = fieldColors(),
                modifier = Modifier.fillMaxWidth()
            )
        }
    }

    if (showQrScanner) {
        QrScannerDialog(
            onDismissRequest = { showQrScanner = false },
            onQrCodeScanned = { scannedCode ->
                branchCode = scannedCode
                showQrScanner = false
            }
        )
    }
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
