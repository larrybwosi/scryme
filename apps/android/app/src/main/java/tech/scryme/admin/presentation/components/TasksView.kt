package tech.scryme.admin.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.data.model.LocationDto
import tech.scryme.admin.data.model.MemberResponseDto
import tech.scryme.admin.data.model.StaffTaskDto
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.TasksViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksView(
    tasksViewModel: TasksViewModel,
    presenceViewModel: PresenceViewModel,
    branches: List<LocationDto> = emptyList()
) {
    val tasksState by tasksViewModel.tasksState.collectAsState()
    val createTaskState by tasksViewModel.createTaskState.collectAsState()
    val updateTaskState by tasksViewModel.updateTaskState.collectAsState()
    val notifyTaskState by tasksViewModel.notifyTaskState.collectAsState()

    val presenceState by presenceViewModel.presenceState.collectAsState()
    val members = (presenceState as? UiState.Success)?.data ?: emptyList()

    val selectedStatus by tasksViewModel.selectedStatus.collectAsState()
    val selectedPriority by tasksViewModel.selectedPriority.collectAsState()
    val selectedMemberId by tasksViewModel.selectedMemberId.collectAsState()

    var showCreateDialog by remember { mutableStateOf(false) }
    var selectedTaskForDetail by remember { mutableStateOf<StaffTaskDto?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        tasksViewModel.loadTasks()
        presenceViewModel.fetchCheckedInMembers()
    }

    LaunchedEffect(createTaskState, updateTaskState, notifyTaskState) {
        when {
            createTaskState is UiState.Success -> {
                snackbarHostState.showSnackbar("Task successfully created & notification sent!")
                tasksViewModel.resetActionStates()
                showCreateDialog = false
            }
            updateTaskState is UiState.Success -> {
                snackbarHostState.showSnackbar("Task status updated.")
                tasksViewModel.resetActionStates()
                selectedTaskForDetail = null
            }
            notifyTaskState is UiState.Success -> {
                snackbarHostState.showSnackbar("Scryme Chat notification sent to member.")
                tasksViewModel.resetActionStates()
            }
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showCreateDialog = true },
                icon = { Icon(Icons.Default.Add, contentDescription = "Create Task") },
                text = { Text("New Task") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Task Analytics Summary Header Cards
            if (tasksState is UiState.Success) {
                val tasksList = (tasksState as UiState.Success<List<StaffTaskDto>>).data
                TaskSummaryHeader(tasksList)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Filtering Bar
            TaskFilterChipsBar(
                selectedStatus = selectedStatus,
                selectedPriority = selectedPriority,
                selectedMemberId = selectedMemberId,
                members = members,
                onStatusSelected = { tasksViewModel.setStatusFilter(it) },
                onPrioritySelected = { tasksViewModel.setPriorityFilter(it) },
                onMemberSelected = { tasksViewModel.setMemberFilter(it) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Tasks Content
            when (tasksState) {
                is UiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is UiState.Error -> {
                    val msg = (tasksState as UiState.Error).message
                    ErrorComponent(
                        message = msg,
                        onRetry = { tasksViewModel.loadTasks() }
                    )
                }
                is UiState.Success -> {
                    val tasksList = (tasksState as UiState.Success<List<StaffTaskDto>>).data
                    if (tasksList.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.Task,
                                    contentDescription = null,
                                    modifier = Modifier.size(64.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "No operational tasks found",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            contentPadding = PaddingValues(bottom = 80.dp)
                        ) {
                            items(tasksList, key = { it.id }) { task ->
                                TaskCardItem(
                                    task = task,
                                    onTaskClick = { selectedTaskForDetail = task },
                                    onNotifyClick = { tasksViewModel.notifyTaskAssigned(task) },
                                    onStatusChange = { newStatus ->
                                        tasksViewModel.updateTaskStatus(task.id, newStatus)
                                    }
                                )
                            }
                        }
                    }
                }
                UiState.Idle -> {}
            }
        }
    }

    if (showCreateDialog) {
        CreateTaskDialog(
            members = members,
            branches = branches,
            isSubmitting = createTaskState is UiState.Loading,
            onDismiss = { showCreateDialog = false },
            onCreate = { title, desc, memberId, priority, due, notifyChat ->
                tasksViewModel.createTask(
                    title = title,
                    description = desc,
                    assignedMemberId = memberId,
                    priority = priority,
                    dueDate = due,
                    notifyViaScrymeChat = notifyChat
                )
            }
        )
    }

    selectedTaskForDetail?.let { task ->
        TaskDetailDialog(
            task = task,
            onDismiss = { selectedTaskForDetail = null },
            onStatusChange = { newStatus ->
                tasksViewModel.updateTaskStatus(task.id, newStatus)
            },
            onNotifyMember = {
                tasksViewModel.notifyTaskAssigned(task)
            }
        )
    }
}

@Composable
fun TaskSummaryHeader(tasks: List<StaffTaskDto>) {
    val total = tasks.size
    val pending = tasks.count { it.status.uppercase() == "PENDING" }
    val inProgress = tasks.count { it.status.uppercase() == "IN_PROGRESS" }
    val completed = tasks.count { it.status.uppercase() == "COMPLETED" }

    Row(
        modifier = Modifier
            .fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        SummaryCard(title = "Total", count = total.toString(), color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.weight(1f))
        SummaryCard(title = "Pending", count = pending.toString(), color = Color(0xFFFFF3E0), modifier = Modifier.weight(1f))
        SummaryCard(title = "In Progress", count = inProgress.toString(), color = Color(0xFFE3F2FD), modifier = Modifier.weight(1f))
        SummaryCard(title = "Done", count = completed.toString(), color = Color(0xFFE8F5E9), modifier = Modifier.weight(1f))
    }
}

@Composable
fun SummaryCard(title: String, count: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = color),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = count, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
            Text(text = title, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun TaskFilterChipsBar(
    selectedStatus: String?,
    selectedPriority: String?,
    selectedMemberId: String?,
    members: List<MemberResponseDto>,
    onStatusSelected: (String?) -> Unit,
    onPrioritySelected: (String?) -> Unit,
    onMemberSelected: (String?) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = selectedStatus == null,
                    onClick = { onStatusSelected("ALL") },
                    label = { Text("All Status") }
                )
            }
            listOf("PENDING", "IN_PROGRESS", "COMPLETED").forEach { st ->
                item {
                    FilterChip(
                        selected = selectedStatus == st,
                        onClick = { onStatusSelected(st) },
                        label = { Text(st.replace("_", " ")) }
                    )
                }
            }
        }

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            item {
                FilterChip(
                    selected = selectedPriority == null,
                    onClick = { onPrioritySelected("ALL") },
                    label = { Text("All Priorities") }
                )
            }
            listOf("LOW", "MEDIUM", "HIGH", "URGENT").forEach { pr ->
                item {
                    FilterChip(
                        selected = selectedPriority == pr,
                        onClick = { onPrioritySelected(pr) },
                        label = { Text(pr) }
                    )
                }
            }
        }
    }
}

@Composable
fun TaskCardItem(
    task: StaffTaskDto,
    onTaskClick: () -> Unit,
    onNotifyClick: () -> Unit,
    onStatusChange: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onTaskClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f)
                )
                PriorityBadge(priority = task.priority)
            }

            if (!task.description.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = task.description,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val assignedName = task.assignedMember?.user?.name ?: "Unassigned"
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = assignedName,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                StatusChip(status = task.status)
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (!task.dueDate.isNullOrBlank()) "Due: ${task.dueDate}" else "No due date",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onNotifyClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Notify Scryme Chat",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    if (task.status.uppercase() != "COMPLETED") {
                        IconButton(onClick = { onStatusChange("COMPLETED") }) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Mark Complete",
                                tint = Color(0xFF2E7D32),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PriorityBadge(priority: String) {
    val (bg, fg) = when (priority.uppercase()) {
        "URGENT" -> Color(0xFFFFEBEE) to Color(0xFFC62828)
        "HIGH" -> Color(0xFFFFF3E0) to Color(0xFFE65100)
        "MEDIUM" -> Color(0xFFE8EAF6) to Color(0xFF283593)
        else -> Color(0xFFE8F5E9) to Color(0xFF2E7D32)
    }

    Surface(
        color = bg,
        contentColor = fg,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = priority.uppercase(),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun StatusChip(status: String) {
    val (bg, fg) = when (status.uppercase()) {
        "COMPLETED" -> Color(0xFFE8F5E9) to Color(0xFF2E7D32)
        "IN_PROGRESS" -> Color(0xFFE3F2FD) to Color(0xFF1565C0)
        "CANCELLED" -> Color(0xFFFFEBEE) to Color(0xFFC62828)
        else -> Color(0xFFFFF3E0) to Color(0xFFEF6C00) // PENDING
    }

    Surface(
        color = bg,
        contentColor = fg,
        shape = CircleShape
    ) {
        Text(
            text = status.replace("_", " "),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateTaskDialog(
    members: List<MemberResponseDto>,
    branches: List<LocationDto>,
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onCreate: (title: String, desc: String?, memberId: String?, priority: String, due: String?, notifyChat: Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedMemberId by remember { mutableStateOf<String?>(null) }
    var selectedPriority by remember { mutableStateOf("MEDIUM") }
    var dueDate by remember { mutableStateOf("") }
    var notifyViaScrymeChat by remember { mutableStateOf(true) }

    var expandedMemberDropdown by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Operational Task", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )

                // Member Selection Dropdown
                ExposedDropdownMenuBox(
                    expanded = expandedMemberDropdown,
                    onExpandedChange = { expandedMemberDropdown = !expandedMemberDropdown }
                ) {
                    val currentMemberName = members.find { it.id == selectedMemberId }?.user?.name ?: "Assign Member"
                    OutlinedTextField(
                        value = currentMemberName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Assigned Staff Member") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedMemberDropdown) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )
                    ExposedDropdownMenu(
                        expanded = expandedMemberDropdown,
                        onDismissRequest = { expandedMemberDropdown = false }
                    ) {
                        members.forEach { m ->
                            DropdownMenuItem(
                                text = { Text(m.user?.name ?: m.id) },
                                onClick = {
                                    selectedMemberId = m.id
                                    expandedMemberDropdown = false
                                }
                            )
                        }
                    }
                }

                // Priority Selection
                Text("Priority Level:", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("LOW", "MEDIUM", "HIGH", "URGENT").forEach { p ->
                        FilterChip(
                            selected = selectedPriority == p,
                            onClick = { selectedPriority = p },
                            label = { Text(p, fontSize = 11.sp) }
                        )
                    }
                }

                OutlinedTextField(
                    value = dueDate,
                    onValueChange = { dueDate = it },
                    label = { Text("Due Date (e.g. 2025-03-30)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { notifyViaScrymeChat = !notifyViaScrymeChat }
                ) {
                    Checkbox(
                        checked = notifyViaScrymeChat,
                        onCheckedChange = { notifyViaScrymeChat = it }
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Notify via Scryme Chat", fontSize = 13.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onCreate(title, description.ifBlank { null }, selectedMemberId, selectedPriority, dueDate.ifBlank { null }, notifyViaScrymeChat)
                    }
                },
                enabled = title.isNotBlank() && !isSubmitting
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Create Task")
                }
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
fun TaskDetailDialog(
    task: StaffTaskDto,
    onDismiss: () -> Unit,
    onStatusChange: (String) -> Unit,
    onNotifyMember: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(task.title, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                PriorityBadge(priority = task.priority)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (!task.description.isNullOrBlank()) {
                    Text(task.description, style = MaterialTheme.typography.bodyMedium)
                }

                HorizontalDivider()

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Status:", fontWeight = FontWeight.Medium)
                    StatusChip(status = task.status)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Assigned To:", fontWeight = FontWeight.Medium)
                    Text(task.assignedMember?.user?.name ?: "Unassigned")
                }

                if (!task.dueDate.isNullOrBlank()) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Due Date:", fontWeight = FontWeight.Medium)
                        Text(task.dueDate)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text("Update Task Status:", fontWeight = FontWeight.Bold, fontSize = 13.sp)

                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    listOf("PENDING", "IN_PROGRESS", "COMPLETED").forEach { st ->
                        OutlinedButton(
                            onClick = { onStatusChange(st) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(st.replace("_", " "), fontSize = 10.sp)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onNotifyMember) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Send Chat Prompt")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}
