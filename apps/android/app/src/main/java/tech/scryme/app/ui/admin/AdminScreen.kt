package tech.scryme.app.ui.admin

import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.MemberAvatar
import tech.scryme.app.ui.components.MemberDropdown
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.ui.components.StyledFormDialog
import tech.scryme.app.ui.components.TimePickerTextField
import tech.scryme.app.ui.components.WeekdayDropdown
import tech.scryme.app.ui.components.DatePickerTextField
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.ShiftTrade
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.ui.theme.Amber500
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

// ---------------------------------------------------------------------------
// Shared design tokens
// ---------------------------------------------------------------------------

private val CardShape = RoundedCornerShape(8.dp)
private val ControlShape = RoundedCornerShape(6.dp)
private val TileShape = RoundedCornerShape(6.dp)
private val ChipShape = RoundedCornerShape(4.dp)
private val CompactButtonPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = MaterialTheme.colorScheme.outline
)

/** Flat, bordered container. Pass [onClick] to make the whole surface tappable. */
@Composable
private fun OutlinedSurface(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit
) {
    val border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    if (onClick != null) {
        Surface(
            onClick = onClick,
            shape = CardShape,
            color = MaterialTheme.colorScheme.surface,
            border = border,
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            modifier = modifier.fillMaxWidth(),
            content = content
        )
    } else {
        Surface(
            shape = CardShape,
            color = MaterialTheme.colorScheme.surface,
            border = border,
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            modifier = modifier.fillMaxWidth(),
            content = content
        )
    }
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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@Composable
fun AdminScreen(
    viewModel: AdminViewModel,
    onNavigateToSales: (() -> Unit)? = null,
    onNavigateToBranches: (() -> Unit)? = null
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
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        Text(
            text = "Admin Management Hub",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Sales & analytics entry point
        OutlinedSurface(onClick = { onNavigateToSales?.invoke() }) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                                TileShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.BarChart,
                            contentDescription = "Sales Analytics",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Sales & Analytics Dashboard",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Revenue, balance and recent orders",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Branch management entry point
        OutlinedSurface(onClick = { onNavigateToBranches?.invoke() }) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.7f),
                                TileShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Storefront,
                            contentDescription = "Manage Branches",
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Manage Branches & Locations",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "View, create and inspect branch operations",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
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
                shape = ControlShape
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Create Shift",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }

            OutlinedButton(
                onClick = { showCreateTaskDialog = true },
                modifier = Modifier.weight(1f),
                shape = ControlShape
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Create Task",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (val state = uiState) {
            is AdminUiState.Loading -> {
                ListSkeleton(count = 4)
            }
            is AdminUiState.Error -> {
                ErrorMessageCard(
                    title = "Admin Portal Error",
                    message = state.message,
                    onRetry = { viewModel.loadAdminData() }
                )
            }
            is AdminUiState.Success -> {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    if (state.pendingTrades.isNotEmpty()) {
                        item {
                            SectionLabel("Pending shift trade approvals (${state.pendingTrades.size})")
                        }

                        items(state.pendingTrades, key = { it.id }) { trade ->
                            val member = state.members.find { it.id == trade.requestingMemberId }
                            PendingTradeItem(
                                trade = trade,
                                member = member,
                                onApprove = { viewModel.processTrade(trade.id, "APPROVED") },
                                onReject = { viewModel.processTrade(trade.id, "REJECTED") }
                            )
                        }

                        item { Spacer(modifier = Modifier.height(4.dp)) }
                    }

                    item {
                        SectionLabel("All staff shifts")
                    }

                    items(state.allShifts, key = { it.id }) { shift ->
                        val member = state.members.find { it.id == shift.memberId }
                        AdminShiftCard(
                            shift = shift,
                            member = member,
                            onAddBreak = { selectedShiftForBreak = shift }
                        )
                    }
                }
            }
        }
    }

    if (showCreateShiftDialog) {
        CreateShiftDialog(
            members = (uiState as? AdminUiState.Success)?.members ?: emptyList(),
            onDismiss = { showCreateShiftDialog = false },
            onSubmit = { memberId, dayOfWeek, startTime, endTime ->
                viewModel.createShift(memberId, dayOfWeek, startTime, endTime)
                showCreateShiftDialog = false
            }
        )
    }

    if (showCreateTaskDialog) {
        CreateTaskDialog(
            members = (uiState as? AdminUiState.Success)?.members ?: emptyList(),
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

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

@Composable
fun PendingTradeItem(
    trade: ShiftTrade,
    member: UserProfile? = null,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    val memberName = member?.name ?: trade.requestingMemberId

    OutlinedSurface {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Shift ${trade.shiftId}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                StatusChip(text = "PENDING", color = Amber500)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                MemberAvatar(
                    avatarUrl = member?.avatarUrl,
                    name = member?.name ?: "",
                    modifier = Modifier.size(24.dp)
                )
                Column {
                    Text(
                        text = memberName,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Requesting member",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (!trade.reason.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Reason: ${trade.reason}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(12.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onReject,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose500),
                    border = BorderStroke(1.dp, Rose500.copy(alpha = 0.6f)),
                    shape = ControlShape,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Reject", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                }
                Button(
                    onClick = onApprove,
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                    shape = ControlShape,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Approve", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun AdminShiftCard(
    shift: StaffShift,
    member: UserProfile? = null,
    onAddBreak: () -> Unit
) {
    val memberName = member?.name ?: shift.memberId

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
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    val role = member?.role
                    if (!role.isNullOrBlank()) {
                        Text(
                            text = role,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${getDayName(shift.dayOfWeek)}  ·  ${shift.startTime} - ${shift.endTime}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            OutlinedButton(
                onClick = onAddBreak,
                shape = ControlShape,
                contentPadding = CompactButtonPadding
            ) {
                Text("+ Break", style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

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
fun CreateTaskDialog(
    members: List<UserProfile>,
    onDismiss: () -> Unit,
    onSubmit: (title: String, desc: String?, memberId: String?, priority: String, dueDate: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var memberId by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("MEDIUM") }
    var dueDate by remember { mutableStateOf("") }

    StyledFormDialog(
        title = "Create Operational Task",
        onDismissRequest = onDismiss,
        confirmButtonText = "Assign Task",
        onConfirm = {
            onSubmit(
                title,
                desc.ifBlank { null },
                memberId.ifBlank { null },
                priority,
                dueDate.ifBlank { null }
            )
        },
        confirmEnabled = title.isNotBlank()
    ) {
        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Task Title *") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = desc,
            onValueChange = { desc = it },
            label = { Text("Description") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
        MemberDropdown(
            selectedMemberId = memberId,
            onMemberSelected = { memberId = it },
            members = members,
            label = "Assign Member (Optional)",
            allowUnassigned = true
        )
        Column {
            SectionLabel("Priority")
            Spacer(modifier = Modifier.height(6.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("LOW", "MEDIUM", "HIGH").forEach { p ->
                    FilterChip(
                        selected = priority == p,
                        onClick = { priority = p },
                        shape = ControlShape,
                        label = { Text(p, fontSize = 11.sp) }
                    )
                }
            }
        }
        DatePickerTextField(
            value = dueDate,
            onValueChange = { dueDate = it },
            label = "Due Date",
            placeholder = "Select due date",
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
    var desc by remember { mutableStateOf("Lunch Break") }

    StyledFormDialog(
        title = "Add Break to Shift",
        onDismissRequest = onDismiss,
        confirmButtonText = "Add Break",
        onConfirm = { onSubmit(startTime, endTime, desc.ifBlank { null }) },
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
            value = desc,
            onValueChange = { desc = it },
            label = { Text("Description") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
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
