package tech.scryme.app.ui.admin

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.MemberAvatar
import tech.scryme.app.ui.components.MemberDropdown
import tech.scryme.app.ui.components.StyledFormDialog
import tech.scryme.app.ui.components.DatePickerTextField
import tech.scryme.app.ui.theme.Amber500
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Indigo500
import tech.scryme.app.ui.theme.Rose500

private val CardShape = RoundedCornerShape(8.dp)
private val ChipShape = RoundedCornerShape(4.dp)
private val ControlShape = RoundedCornerShape(6.dp)

@Composable
fun AdminTasksScreen(
    viewModel: AdminTasksViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToTaskDetails: ((String) -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var taskToReassign by remember { mutableStateOf<StaffTask?>(null) }
    var taskToDelete by remember { mutableStateOf<StaffTask?>(null) }

    Scaffold(
        topBar = {
            AdminTasksTopBar(
                onNavigateBack = onNavigateBack,
                onRefresh = { viewModel.loadData() }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Task")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (val state = uiState) {
                is AdminTasksUiState.Loading -> {
                    ListSkeleton(count = 6)
                }
                is AdminTasksUiState.Error -> {
                    ErrorMessageCard(
                        title = "Could not load tasks",
                        message = state.message,
                        onRetry = { viewModel.loadData() },
                        modifier = Modifier.padding(16.dp)
                    )
                }
                is AdminTasksUiState.Success -> {
                    val filterTabs = listOf("ALL", "TODO", "IN_PROGRESS", "COMPLETED")

                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filterTabs) { tab ->
                            val isSelected = state.activeFilter == tab
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.setFilter(tab) },
                                label = {
                                    val count = state.tasks.count {
                                        if (tab == "ALL") true
                                        else it.status.uppercase() == tab
                                    }
                                    Text("${tab.replace('_', ' ')} ($count)", fontSize = 12.sp)
                                },
                                shape = ChipShape
                            )
                        }
                    }

                    val filteredTasks = state.tasks.filter {
                        if (state.activeFilter == "ALL") true
                        else it.status.uppercase() == state.activeFilter
                    }

                    if (filteredTasks.isEmpty()) {
                        EmptyStateCard(
                            title = "No tasks found",
                            description = "There are no tasks matching the selected filter '${state.activeFilter}'.",
                            modifier = Modifier.padding(16.dp)
                        )
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 80.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(filteredTasks, key = { it.id }) { task ->
                                val member = state.members.find { it.id == task.assignedMemberId }
                                AdminTaskItemCard(
                                    task = task,
                                    member = member,
                                    onClick = { onNavigateToTaskDetails?.invoke(task.id) },
                                    onUpdateStatus = { newStatus ->
                                        viewModel.updateTaskStatus(task.id, newStatus)
                                    },
                                    onReassign = {
                                        taskToReassign = task
                                    },
                                    onDelete = {
                                        taskToDelete = task
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        val members = (uiState as? AdminTasksUiState.Success)?.members ?: emptyList()
        CreateAdminTaskDialog(
            members = members,
            onDismiss = { showCreateDialog = false },
            onSubmit = { title, desc, memberId, priority, dueDate ->
                viewModel.createTask(title, desc, memberId, priority, dueDate)
                showCreateDialog = false
            }
        )
    }

    taskToReassign?.let { task ->
        val members = (uiState as? AdminTasksUiState.Success)?.members ?: emptyList()
        ReassignTaskDialog(
            task = task,
            members = members,
            onDismiss = { taskToReassign = null },
            onSubmit = { newMemberId ->
                viewModel.reassignTask(task.id, newMemberId)
                taskToReassign = null
            }
        )
    }

    taskToDelete?.let { task ->
        AlertDialog(
            onDismissRequest = { taskToDelete = null },
            title = { Text("Delete Task") },
            text = { Text("Are you sure you want to delete '${task.title}'? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteTask(task.id)
                        taskToDelete = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = Rose500)
                ) {
                    Text("Delete", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { taskToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminTasksTopBar(
    onNavigateBack: () -> Unit,
    onRefresh: () -> Unit
) {
    TopAppBar(
        title = {
            Text(
                text = "Task Management",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        },
        navigationIcon = {
            IconButton(onClick = onNavigateBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
        },
        actions = {
            IconButton(onClick = onRefresh) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Refresh"
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.background,
            titleContentColor = MaterialTheme.colorScheme.onSurface,
            navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
            actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
        )
    )
}

@Composable
fun AdminTaskItemCard(
    task: StaffTask,
    member: UserProfile?,
    onClick: () -> Unit,
    onUpdateStatus: (String) -> Unit,
    onReassign: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                PriorityBadge(priority = task.priority ?: "MEDIUM")
            }

            if (!task.description.isNullOrBlank()) {
                Text(
                    text = task.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MemberAvatar(
                        avatarUrl = member?.avatarUrl,
                        name = member?.name ?: "Unassigned",
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = member?.name ?: "Unassigned",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                StatusPill(status = task.status)
            }

            task.dueDate?.let { due ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarToday,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        text = "Due: ${due.take(10)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Status toggle
                when (task.status.uppercase()) {
                    "TODO" -> {
                        OutlinedButton(
                            onClick = { onUpdateStatus("IN_PROGRESS") },
                            shape = ControlShape,
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 4.dp)
                        ) {
                            Text("Start", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    "IN_PROGRESS" -> {
                        Button(
                            onClick = { onUpdateStatus("COMPLETED") },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                            shape = ControlShape,
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 4.dp)
                        ) {
                            Text("Complete", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    else -> {
                        OutlinedButton(
                            onClick = { onUpdateStatus("TODO") },
                            shape = ControlShape,
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 4.dp)
                        ) {
                            Text("Reopen", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }

                OutlinedButton(
                    onClick = onReassign,
                    shape = ControlShape,
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Reassign", style = MaterialTheme.typography.labelMedium)
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.DeleteOutline,
                        contentDescription = "Delete Task",
                        tint = Rose500,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun PriorityBadge(priority: String) {
    val tone = when (priority.uppercase()) {
        "HIGH", "URGENT" -> Rose500
        "LOW" -> Emerald500
        else -> Amber500
    }
    Surface(
        shape = ChipShape,
        color = tone.copy(alpha = 0.12f)
    ) {
        Text(
            text = priority.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = tone,
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
        )
    }
}

@Composable
private fun StatusPill(status: String) {
    val tone = when (status.uppercase()) {
        "COMPLETED" -> Emerald500
        "IN_PROGRESS" -> Indigo500
        else -> Amber500
    }
    Surface(
        shape = CircleShape,
        color = tone.copy(alpha = 0.12f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(tone)
            )
            Text(
                text = status.replace('_', ' ').lowercase().replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Medium,
                color = tone
            )
        }
    }
}

@Composable
fun ReassignTaskDialog(
    task: StaffTask,
    members: List<UserProfile>,
    onDismiss: () -> Unit,
    onSubmit: (newMemberId: String?) -> Unit
) {
    var selectedMemberId by remember { mutableStateOf(task.assignedMemberId ?: "") }

    StyledFormDialog(
        title = "Reassign Task",
        onDismissRequest = onDismiss,
        confirmButtonText = "Save Assignment",
        onConfirm = {
            onSubmit(selectedMemberId.ifBlank { null })
        }
    ) {
        Text(
            text = "Reassigning: ${task.title}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))
        MemberDropdown(
            selectedMemberId = selectedMemberId,
            onMemberSelected = { selectedMemberId = it },
            members = members,
            label = "Assign Member",
            allowUnassigned = true
        )
    }
}

@Composable
fun CreateAdminTaskDialog(
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
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = desc,
            onValueChange = { desc = it },
            label = { Text("Description") },
            shape = ControlShape,
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
            Text(
                text = "PRIORITY",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
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
