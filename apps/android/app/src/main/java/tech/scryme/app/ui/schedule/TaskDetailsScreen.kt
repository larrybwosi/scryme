package tech.scryme.app.ui.schedule

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Timelapse
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.SubtaskGroup
import tech.scryme.app.domain.model.SubtaskItem
import tech.scryme.app.ui.components.DatePickerTextField
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.StyledFormDialog
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
    content: @Composable () -> Unit
) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
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
private fun StatusChip(text: String, color: Color, showDot: Boolean = false) {
    Surface(
        shape = ChipShape,
        color = color.copy(alpha = 0.12f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (showDot) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(color)
                )
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.6.sp,
                color = color
            )
        }
    }
}

@Composable
private fun priorityColor(priority: String): Color = when (priority.uppercase()) {
    "HIGH" -> Rose500
    "LOW" -> Emerald500
    else -> Amber500
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailsScreen(
    viewModel: TaskDetailsViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showOptionsMenu by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }
    var showAddGroupDialog by remember { mutableStateOf(false) }
    var groupToAddItemTo by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Text(
                            "Task Details",
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
                        Box {
                            IconButton(onClick = { showOptionsMenu = true }) {
                                Icon(
                                    imageVector = Icons.Default.MoreVert,
                                    contentDescription = "Options"
                                )
                            }
                            DropdownMenu(
                                expanded = showOptionsMenu,
                                onDismissRequest = { showOptionsMenu = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Edit Task") },
                                    leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null) },
                                    onClick = {
                                        showOptionsMenu = false
                                        showEditDialog = true
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Add Subtask Group") },
                                    leadingIcon = { Icon(Icons.Default.Add, contentDescription = null) },
                                    onClick = {
                                        showOptionsMenu = false
                                        showAddGroupDialog = true
                                    }
                                )
                                HorizontalDivider()
                                DropdownMenuItem(
                                    text = { Text("Delete Task", color = Rose500) },
                                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Rose500) },
                                    onClick = {
                                        showOptionsMenu = false
                                        showDeleteConfirmDialog = true
                                    }
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                        actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        when (val state = uiState) {
            is TaskDetailsUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp)
                ) {
                    ListSkeleton(count = 5)
                }
            }
            is TaskDetailsUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp)
                ) {
                    ErrorMessageCard(
                        title = "Unable to load task",
                        message = state.message,
                        onRetry = { viewModel.loadTaskDetails() }
                    )
                }
            }
            is TaskDetailsUiState.Success -> {
                TaskDetailsContent(
                    task = state.task,
                    members = state.members,
                    isSaving = state.isSaving,
                    errorMessage = state.errorMessage,
                    onStatusChange = { newStatus -> viewModel.updateStatus(newStatus) },
                    onToggleSubtask = { groupId, itemId -> viewModel.toggleSubtask(groupId, itemId) },
                    onAddItem = { groupId -> groupToAddItemTo = groupId },
                    onAddGroup = { showAddGroupDialog = true },
                    onClearError = { viewModel.clearError() },
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                )

                if (showEditDialog) {
                    EditTaskDialog(
                        task = state.task,
                        onDismiss = { showEditDialog = false },
                        onSubmit = { title, desc, priority, category, dueDate, dueTime ->
                            viewModel.updateTaskDetails(
                                title = title,
                                description = desc,
                                priority = priority,
                                category = category,
                                dueDate = dueDate,
                                dueTime = dueTime,
                                onSuccess = { showEditDialog = false }
                            )
                        }
                    )
                }

                if (showDeleteConfirmDialog) {
                    AlertDialog(
                        onDismissRequest = { showDeleteConfirmDialog = false },
                        title = { Text("Delete Task") },
                        text = { Text("Are you sure you want to permanently delete '${state.task.title}'? This action cannot be undone.") },
                        confirmButton = {
                            Button(
                                onClick = {
                                    showDeleteConfirmDialog = false
                                    viewModel.deleteTask(onSuccess = onNavigateBack)
                                },
                                shape = ControlShape,
                                colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                            ) {
                                Text("Delete", color = Color.White)
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showDeleteConfirmDialog = false }) {
                                Text("Cancel")
                            }
                        }
                    )
                }

                if (showAddGroupDialog) {
                    var groupTitle by remember { mutableStateOf("") }
                    StyledFormDialog(
                        title = "Add Subtask Group",
                        onDismissRequest = { showAddGroupDialog = false },
                        confirmButtonText = "Add Group",
                        onConfirm = {
                            if (groupTitle.isNotBlank()) {
                                viewModel.addSubtaskGroup(groupTitle.trim())
                                showAddGroupDialog = false
                            }
                        },
                        confirmEnabled = groupTitle.isNotBlank()
                    ) {
                        OutlinedTextField(
                            value = groupTitle,
                            onValueChange = { groupTitle = it },
                            label = { Text("Group Title") },
                            placeholder = { Text("e.g. Design System, Quality Checks") },
                            singleLine = true,
                            shape = ControlShape,
                            colors = fieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                groupToAddItemTo?.let { groupId ->
                    var itemTitle by remember { mutableStateOf("") }
                    StyledFormDialog(
                        title = "Add Checklist Item",
                        onDismissRequest = { groupToAddItemTo = null },
                        confirmButtonText = "Add Item",
                        onConfirm = {
                            if (itemTitle.isNotBlank()) {
                                viewModel.addSubtaskItem(groupId, itemTitle.trim())
                                groupToAddItemTo = null
                            }
                        },
                        confirmEnabled = itemTitle.isNotBlank()
                    ) {
                        OutlinedTextField(
                            value = itemTitle,
                            onValueChange = { itemTitle = it },
                            label = { Text("Item Title") },
                            placeholder = { Text("e.g. Check temperature, Update logs") },
                            singleLine = true,
                            shape = ControlShape,
                            colors = fieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

@Composable
fun TaskDetailsContent(
    task: StaffTask,
    members: List<UserProfile> = emptyList(),
    isSaving: Boolean,
    errorMessage: String?,
    onStatusChange: (String) -> Unit,
    onToggleSubtask: (String, String) -> Unit,
    onAddItem: (String) -> Unit,
    onAddGroup: () -> Unit,
    onClearError: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val priority = task.priority ?: "MEDIUM"

    Column(
        modifier = modifier
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        if (isSaving) {
            LinearProgressIndicator(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                color = MaterialTheme.colorScheme.primary
            )
        }

        if (!errorMessage.isNullOrBlank()) {
            ErrorMessageCard(
                title = "Update failed",
                message = errorMessage,
                onRetry = onClearError
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        // Header card: category + priority, title
        OutlinedSurface {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusChip(
                        text = (task.category?.takeIf { it.isNotBlank() } ?: "Uncategorized").uppercase(),
                        color = MaterialTheme.colorScheme.primary
                    )
                    StatusChip(
                        text = "${priority.uppercase()} PRIORITY",
                        color = priorityColor(priority),
                        showDot = true
                    )
                }

                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Due date / time
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(IntrinsicSize.Min),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    MetaItem(
                        icon = Icons.Default.CalendarMonth,
                        label = "Due Date",
                        value = task.dueDate ?: "No due date",
                        modifier = Modifier.weight(1f)
                    )
                    VerticalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    MetaItem(
                        icon = Icons.Default.Schedule,
                        label = "Time",
                        value = task.dueTime ?: "All Day",
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 16.dp)
                    )
                }

                val assignedMember = members.find { it.id == task.assignedMemberId }
                val assigneeName = assignedMember?.name ?: if (!task.assignedMemberId.isNullOrBlank()) "Staff Assigned" else "Unassigned"
                val hoursText = when {
                    task.estimatedHours != null && task.actualHours != null -> "${task.actualHours}h / ${task.estimatedHours}h"
                    task.estimatedHours != null -> "Est: ${task.estimatedHours}h"
                    task.actualHours != null -> "Act: ${task.actualHours}h"
                    else -> "No hours logged"
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                // Assignee / Hours
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(IntrinsicSize.Min),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    MetaItem(
                        icon = Icons.Default.Person,
                        label = "Assignee",
                        value = assigneeName,
                        modifier = Modifier.weight(1f)
                    )
                    VerticalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    MetaItem(
                        icon = Icons.Default.Timelapse,
                        label = "Hours",
                        value = hoursText,
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 16.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        SectionLabel("Status")
        Spacer(modifier = Modifier.height(8.dp))
        StatusSegmentedControl(
            currentStatus = task.status,
            onStatusSelected = onStatusChange
        )

        Spacer(modifier = Modifier.height(20.dp))

        SectionLabel("Description")
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedSurface {
            val hasDescription = !task.description.isNullOrBlank()
            Text(
                text = if (hasDescription) task.description!! else "No description provided for this task.",
                style = MaterialTheme.typography.bodyMedium.copy(lineHeight = 22.sp),
                color = if (hasDescription) MaterialTheme.colorScheme.onSurface
                else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(14.dp)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Breakdown header with progress
        val totalSubtasks = task.subtaskGroups.sumOf { it.items.size }
        val completedSubtasks = task.subtaskGroups.sumOf { g -> g.items.count { it.isCompleted } }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            SectionLabel("Breakdown")
            OutlinedButton(
                onClick = onAddGroup,
                shape = ControlShape,
                contentPadding = CompactButtonPadding
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Group", style = MaterialTheme.typography.labelMedium)
            }
        }

        if (totalSubtasks > 0) {
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                LinearProgressIndicator(
                    progress = { completedSubtasks.toFloat() / totalSubtasks },
                    modifier = Modifier
                        .weight(1f)
                        .height(6.dp)
                        .clip(ChipShape),
                    color = Emerald500,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
                Text(
                    text = "$completedSubtasks / $totalSubtasks",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (task.subtaskGroups.isEmpty()) {
            OutlinedSurface {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "No breakdown subtasks created.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = onAddGroup,
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Subtask Group", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                task.subtaskGroups.forEach { group ->
                    SubtaskGroupCard(
                        group = group,
                        onToggleItem = { itemId -> onToggleSubtask(group.id, itemId) },
                        onAddItem = { onAddItem(group.id) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun MetaItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(ControlShape)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(16.dp)
            )
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

@Composable
fun EditTaskDialog(
    task: StaffTask,
    onDismiss: () -> Unit,
    onSubmit: (title: String, description: String, priority: String, category: String, dueDate: String, dueTime: String) -> Unit
) {
    var title by remember { mutableStateOf(task.title) }
    var description by remember { mutableStateOf(task.description ?: "") }
    var priority by remember { mutableStateOf(task.priority ?: "MEDIUM") }
    var category by remember { mutableStateOf(task.category ?: "") }
    var dueDate by remember { mutableStateOf(task.dueDate ?: "") }
    var dueTime by remember { mutableStateOf(task.dueTime ?: "") }

    StyledFormDialog(
        title = "Edit Task Details",
        onDismissRequest = onDismiss,
        confirmButtonText = "Save Changes",
        onConfirm = {
            if (title.isNotBlank()) {
                onSubmit(title.trim(), description.trim(), priority, category.trim(), dueDate, dueTime.trim())
            }
        },
        confirmEnabled = title.isNotBlank()
    ) {
        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Task Title *") },
            singleLine = true,
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            minLines = 3,
            maxLines = 5,
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = category,
            onValueChange = { category = it },
            label = { Text("Category") },
            singleLine = true,
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )

        SectionLabel("Priority")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("LOW", "MEDIUM", "HIGH").forEach { p ->
                val selected = priority.equals(p, ignoreCase = true)
                FilterChip(
                    selected = selected,
                    onClick = { priority = p },
                    shape = ControlShape,
                    label = { Text(p, style = MaterialTheme.typography.labelMedium) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        DatePickerTextField(
            value = dueDate,
            onValueChange = { dueDate = it },
            label = "Due Date",
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = dueTime,
            onValueChange = { dueTime = it },
            label = { Text("Due Time (e.g. 10:00 AM)") },
            singleLine = true,
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
    }
}

// ---------------------------------------------------------------------------
// Status control
// ---------------------------------------------------------------------------

@Composable
fun StatusSegmentedControl(
    currentStatus: String,
    onStatusSelected: (String) -> Unit
) {
    val statuses = listOf(
        "TODO" to "To Do",
        "IN_PROGRESS" to "In Progress",
        "COMPLETED" to "Completed"
    )

    Surface(
        shape = ControlShape,
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(3.dp),
            horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            statuses.forEach { (code, label) ->
                val isSelected = currentStatus.equals(code, ignoreCase = true) ||
                        (code == "COMPLETED" && currentStatus.equals("DONE", ignoreCase = true))

                val bgColor = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                val textColor = if (isSelected) MaterialTheme.colorScheme.onPrimary
                else MaterialTheme.colorScheme.onSurfaceVariant

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(4.dp))
                        .background(bgColor)
                        .clickable { onStatusSelected(code) }
                        .padding(vertical = 9.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                        color = textColor
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------

@Composable
fun SubtaskGroupCard(
    group: SubtaskGroup,
    onToggleItem: (String) -> Unit,
    onAddItem: () -> Unit
) {
    var isExpanded by remember { mutableStateOf(true) }
    val done = group.items.count { it.isCompleted }

    OutlinedSurface {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded }
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = group.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    if (group.items.isNotEmpty()) {
                        StatusChip(
                            text = "$done/${group.items.size}",
                            color = if (done == group.items.size) Emerald500
                            else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onAddItem,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Add Item",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isExpanded) "Collapse" else "Expand",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

                    if (group.items.isEmpty()) {
                        Text(
                            text = "No items in this group. Tap + to add one.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(14.dp)
                        )
                    } else {
                        group.items.forEachIndexed { index, item ->
                            SubtaskChecklistItem(
                                item = item,
                                onToggle = { onToggleItem(item.id) }
                            )
                            if (index < group.items.lastIndex) {
                                HorizontalDivider(
                                    modifier = Modifier.padding(start = 44.dp),
                                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SubtaskChecklistItem(
    item: SubtaskItem,
    onToggle: () -> Unit
) {
    val checkShape = RoundedCornerShape(4.dp)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .padding(horizontal = 14.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(checkShape)
                .background(if (item.isCompleted) Emerald500 else Color.Transparent)
                .border(
                    width = 1.5.dp,
                    color = if (item.isCompleted) Emerald500 else MaterialTheme.colorScheme.outline,
                    shape = checkShape
                ),
            contentAlignment = Alignment.Center
        ) {
            if (item.isCompleted) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Completed",
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Text(
            text = item.title,
            style = MaterialTheme.typography.bodyMedium.copy(
                textDecoration = if (item.isCompleted) TextDecoration.LineThrough else TextDecoration.None
            ),
            color = if (item.isCompleted) MaterialTheme.colorScheme.onSurfaceVariant
            else MaterialTheme.colorScheme.onSurface
        )
    }
}