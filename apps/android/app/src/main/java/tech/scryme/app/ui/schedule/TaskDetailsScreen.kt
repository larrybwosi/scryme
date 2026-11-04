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
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.SubtaskGroup
import tech.scryme.app.domain.model.SubtaskItem
import tech.scryme.app.ui.components.DatePickerTextField
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.StyledFormDialog
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

private val PrimaryPurple = Color(0xFF8B5CF6)
private val PrimaryIndigo = Color(0xFF6366F1)
private val TextMutedColor = Color(0xFF94A3B8)

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
            TopAppBar(
                title = { Text("Task Details", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)) },
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
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                    navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
                    actionIconContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
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
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TaskDetailsContent(
    task: StaffTask,
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

    Column(
        modifier = modifier
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        if (isSaving) {
            LinearProgressIndicator(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                color = PrimaryIndigo
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

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val catText = task.category ?: "UI/UX Design"
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = PrimaryPurple.copy(alpha = 0.15f)
            ) {
                Text(
                    text = catText,
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    ),
                    color = PrimaryPurple,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }

            Surface(
                shape = RoundedCornerShape(8.dp),
                color = MaterialTheme.colorScheme.surfaceVariant
            ) {
                Text(
                    text = "Priority: ${task.priority ?: "MEDIUM"}",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = task.title,
            style = MaterialTheme.typography.headlineSmall.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            ),
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = PrimaryIndigo,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Due Date",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMutedColor
                        )
                        Text(
                            text = task.dueDate ?: "No due date",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = PrimaryIndigo,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Time",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMutedColor
                        )
                        Text(
                            text = task.dueTime ?: "All Day",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        Text(
            text = "STATUS",
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            ),
            color = TextMutedColor
        )

        Spacer(modifier = Modifier.height(8.dp))

        StatusSegmentedControl(
            currentStatus = task.status,
            onStatusSelected = onStatusChange
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "DESCRIPTION",
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            ),
            color = TextMutedColor
        )

        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = if (!task.description.isNullOrBlank()) task.description else "No description provided for this task.",
                style = MaterialTheme.typography.bodyMedium.copy(lineHeight = 22.sp),
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(14.dp)
            )
        }

        Spacer(modifier = Modifier.height(22.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "BREAKDOWN TASK",
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                ),
                color = TextMutedColor
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                val totalSubtasks = task.subtaskGroups.sumOf { it.items.size }
                val completedSubtasks = task.subtaskGroups.sumOf { g -> g.items.count { it.isCompleted } }
                if (totalSubtasks > 0) {
                    Text(
                        text = "$completedSubtasks of $totalSubtasks completed",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = PrimaryIndigo
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                }
                TextButton(
                    onClick = onAddGroup,
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Group", style = MaterialTheme.typography.labelSmall)
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        if (task.subtaskGroups.isEmpty()) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "No breakdown subtasks created.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMutedColor
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(onClick = onAddGroup) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Subtask Group")
                    }
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                task.subtaskGroups.forEach { group ->
                    SubtaskGroupCard(
                        group = group,
                        onToggleItem = { itemId -> onToggleSubtask(group.id, itemId) },
                        onAddItem = { onAddItem(group.id) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun EditTaskDialog(
    task: StaffTask,
    onDismiss: () -> Unit,
    onSubmit: (title: String, description: String, priority: String, category: String, dueDate: String, dueTime: String) -> Unit
) {
    var title by remember { mutableStateOf(task.title) }
    var description by remember { mutableStateOf(task.description ?: "") }
    var priority by remember { mutableStateOf(task.priority ?: "MEDIUM") }
    var category by remember { mutableStateOf(task.category ?: "UI/UX Design") }
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
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            minLines = 3,
            maxLines = 5,
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = category,
            onValueChange = { category = it },
            label = { Text("Category") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("LOW", "MEDIUM", "HIGH").forEach { p ->
                val selected = priority.equals(p, ignoreCase = true)
                FilterChip(
                    selected = selected,
                    onClick = { priority = p },
                    label = { Text(p) },
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
            modifier = Modifier.fillMaxWidth()
        )
    }
}

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
        shape = RoundedCornerShape(10.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            statuses.forEach { (code, label) ->
                val isSelected = currentStatus.equals(code, ignoreCase = true) ||
                        (code == "COMPLETED" && currentStatus.equals("DONE", ignoreCase = true))

                val bgColor = if (isSelected) PrimaryIndigo else Color.Transparent
                val textColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(bgColor)
                        .clickable { onStatusSelected(code) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 12.sp
                        ),
                        color = textColor
                    )
                }
            }
        }
    }
}

@Composable
fun SubtaskGroupCard(
    group: SubtaskGroup,
    onToggleItem: (String) -> Unit,
    onAddItem: () -> Unit
) {
    var isExpanded by remember { mutableStateOf(true) }

    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded }
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = group.title,
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onAddItem,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Add Item",
                            tint = PrimaryIndigo,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null,
                        tint = TextMutedColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 14.dp, end = 14.dp, bottom = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
                    Spacer(modifier = Modifier.height(2.dp))

                    if (group.items.isEmpty()) {
                        Text(
                            text = "No items in this group. Tap + to add one.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMutedColor,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    } else {
                        group.items.forEach { item ->
                            SubtaskChecklistItem(
                                item = item,
                                onToggle = { onToggleItem(item.id) }
                            )
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
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .clickable { onToggle() }
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CircleShape)
                .border(
                    width = 1.5.dp,
                    color = if (item.isCompleted) Emerald500 else TextMutedColor,
                    shape = CircleShape
                )
                .background(if (item.isCompleted) Emerald500 else Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
            if (item.isCompleted) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Completed",
                    tint = Color.White,
                    modifier = Modifier.size(12.dp)
                )
            }
        }

        Spacer(modifier = Modifier.width(10.dp))

        Text(
            text = item.title,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontSize = 13.sp,
                textDecoration = if (item.isCompleted) TextDecoration.LineThrough else TextDecoration.None
            ),
            color = if (item.isCompleted) TextMutedColor else MaterialTheme.colorScheme.onSurface
        )
    }
}
