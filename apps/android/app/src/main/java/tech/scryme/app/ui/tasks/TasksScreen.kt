package tech.scryme.app.ui.tasks

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
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
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.ui.components.DatePickerTextField
import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.MemberDropdown
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

private fun prettyLabel(value: String): String =
    value.replace("_", " ").lowercase().split(" ")
        .joinToString(" ") { word -> word.replaceFirstChar { it.uppercase() } }

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@Composable
fun TasksScreen(
    viewModel: TasksViewModel
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadTasks()
    }

    var showCreateTaskDialog by remember { mutableStateOf(false) }
    var taskToAssess by remember { mutableStateOf<StaffTask?>(null) }

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
                text = "Operational Tasks",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            )

            Button(
                onClick = { showCreateTaskDialog = true },
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
                    text = "Add Task",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        FilterChipRow(
            selectedFilter = (uiState as? TasksUiState.Success)?.selectedFilter ?: "ALL",
            onSelectFilter = { filter ->
                viewModel.loadTasks(filter)
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        when (val state = uiState) {
            is TasksUiState.Loading -> {
                ListSkeleton(count = 5)
            }
            is TasksUiState.Error -> {
                ErrorMessageCard(
                    title = "Unable to load tasks",
                    message = state.message,
                    onRetry = { viewModel.loadTasks() }
                )
            }
            is TasksUiState.Success -> {
                if (state.tasks.isEmpty()) {
                    EmptyStateCard(
                        title = "No Tasks Found",
                        description = "There are no operational tasks assigned for the selected filter.",
                        actionText = "+ Add Task",
                        onAction = { showCreateTaskDialog = true }
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(bottom = 16.dp)
                    ) {
                        items(state.tasks, key = { it.id }) { task ->
                            TaskItemCard(
                                task = task,
                                onToggleStatus = { newStatus ->
                                    viewModel.updateTaskStatus(task, newStatus)
                                },
                                onAssessTask = {
                                    taskToAssess = task
                                }
                            )
                        }
                    }
                }
            }
        }

        if (showCreateTaskDialog) {
            CreateTaskDialog(
                members = (uiState as? TasksUiState.Success)?.members ?: emptyList(),
                onDismiss = { showCreateTaskDialog = false },
                onSubmit = { title, desc, assignedMemberId, priority, dueDate ->
                    viewModel.createStaffTask(
                        title = title,
                        description = desc.ifBlank { null },
                        assignedMemberId = assignedMemberId.ifBlank { null },
                        priority = priority,
                        dueDate = dueDate.ifBlank { null },
                        onSuccess = {
                            showCreateTaskDialog = false
                        }
                    )
                }
            )
        }

        taskToAssess?.let { task ->
            TaskAssessmentDialog(
                task = task,
                onDismiss = { taskToAssess = null },
                onSubmit = { quality, complexity, risk, estHours, actHours, notes ->
                    viewModel.saveTaskAssessment(
                        taskId = task.id,
                        qualityScore = quality,
                        complexity = complexity,
                        riskLevel = risk,
                        estimatedHours = estHours,
                        actualHours = actHours,
                        notes = notes.ifBlank { null },
                        onSuccess = {
                            taskToAssess = null
                        }
                    )
                }
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

@Composable
fun TaskItemCard(
    task: StaffTask,
    onToggleStatus: (String) -> Unit,
    onAssessTask: () -> Unit
) {
    val isCompleted = task.status == "COMPLETED"
    val priorityColor = when (task.priority?.uppercase()) {
        "HIGH", "URGENT" -> Rose500
        "MEDIUM" -> Amber500
        else -> Emerald500
    }
    val statusColor = when (task.status) {
        "IN_PROGRESS" -> MaterialTheme.colorScheme.primary
        "COMPLETED" -> Emerald500
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    val nextStatus = when (task.status) {
        "TODO" -> "IN_PROGRESS"
        "IN_PROGRESS" -> "COMPLETED"
        else -> "TODO"
    }

    OutlinedSurface {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
        ) {
            // Priority accent bar
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .background(priorityColor)
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = task.title,
                            style = MaterialTheme.typography.titleSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None
                            ),
                            color = if (isCompleted) MaterialTheme.colorScheme.onSurfaceVariant
                            else MaterialTheme.colorScheme.onSurface
                        )

                        if (!task.description.isNullOrEmpty()) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = task.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    if (isCompleted) {
                        OutlinedButton(
                            onClick = { onToggleStatus(nextStatus) },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Emerald500),
                            border = BorderStroke(1.dp, Emerald500.copy(alpha = 0.6f)),
                            shape = ControlShape,
                            contentPadding = CompactButtonPadding
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Check,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Done", style = MaterialTheme.typography.labelMedium)
                        }
                    } else {
                        Button(
                            onClick = { onToggleStatus(nextStatus) },
                            shape = ControlShape,
                            contentPadding = CompactButtonPadding
                        ) {
                            Text(
                                text = if (task.status == "IN_PROGRESS") "Complete" else "Start",
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Meta row: status, priority, due date
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusChip(text = prettyLabel(task.status ?: "TODO"), color = statusColor)

                    if (!task.priority.isNullOrEmpty()) {
                        StatusChip(text = prettyLabel(task.priority), color = priorityColor)
                    }

                    if (!task.dueDate.isNullOrEmpty()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Filled.CalendarMonth,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = task.dueDate,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Spacer(modifier = Modifier.height(10.dp))

                // Assessment row
                val assessment = task.assessment
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
                                        imageVector = if (index < assessment.qualityScore) Icons.Filled.Star else Icons.Outlined.Star,
                                        contentDescription = null,
                                        tint = Amber500,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Risk: ${assessment.riskLevel}  ·  Complexity: ${assessment.complexity}",
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
                        onClick = onAssessTask,
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text(
                            text = if (assessment != null) "Edit Assessment" else "Assess Task",
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun FilterChipRow(
    selectedFilter: String,
    onSelectFilter: (String) -> Unit
) {
    val filters = listOf("ALL", "TODO", "IN_PROGRESS", "COMPLETED")
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        filters.forEach { filter ->
            val isSelected = filter == selectedFilter
            FilterChip(
                selected = isSelected,
                onClick = { onSelectFilter(filter) },
                shape = ControlShape,
                label = {
                    Text(
                        text = if (filter == "ALL") "All" else prettyLabel(filter),
                        style = MaterialTheme.typography.labelMedium
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

@Composable
fun CreateTaskDialog(
    members: List<UserProfile>,
    onDismiss: () -> Unit,
    onSubmit: (title: String, description: String, assignedMemberId: String, priority: String, dueDate: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var assignedMemberId by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("MEDIUM") }
    var dueDate by remember { mutableStateOf("") }

    StyledFormDialog(
        title = "Assign New Task",
        onDismissRequest = onDismiss,
        confirmButtonText = "Assign Task",
        onConfirm = {
            if (title.isNotBlank()) {
                onSubmit(title, description, assignedMemberId, priority, dueDate)
            }
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
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )

        MemberDropdown(
            selectedMemberId = assignedMemberId,
            onMemberSelected = { assignedMemberId = it },
            members = members,
            label = "Assigned Member (Optional)",
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
fun TaskAssessmentDialog(
    task: StaffTask,
    onDismiss: () -> Unit,
    onSubmit: (
        qualityScore: Int,
        complexity: String,
        riskLevel: String,
        estimatedHours: Double?,
        actualHours: Double?,
        notes: String
    ) -> Unit
) {
    val existing = task.assessment
    var qualityScore by remember { mutableStateOf(existing?.qualityScore ?: 5) }
    var complexity by remember { mutableStateOf(existing?.complexity ?: "MEDIUM") }
    var riskLevel by remember { mutableStateOf(existing?.riskLevel ?: "LOW") }
    var estimatedHoursText by remember { mutableStateOf(existing?.estimatedHours?.toString() ?: "") }
    var actualHoursText by remember { mutableStateOf(existing?.actualHours?.toString() ?: "") }
    var notes by remember { mutableStateOf(existing?.notes ?: "") }

    StyledFormDialog(
        title = "Task Assessment & Review",
        onDismissRequest = onDismiss,
        confirmButtonText = "Save Assessment",
        onConfirm = {
            val estHours = estimatedHoursText.toDoubleOrNull()
            val actHours = actualHoursText.toDoubleOrNull()
            onSubmit(qualityScore, complexity, riskLevel, estHours, actHours, notes)
        }
    ) {
        Text(
            text = "Task: ${task.title}",
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Quality score rating
        SectionLabel("Quality score")
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            (1..5).forEach { star ->
                Icon(
                    imageVector = if (star <= qualityScore) Icons.Filled.Star else Icons.Outlined.Star,
                    contentDescription = "Star $star",
                    tint = Amber500,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .clickable { qualityScore = star }
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "$qualityScore / 5",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Complexity
        SectionLabel("Complexity level")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("LOW", "MEDIUM", "HIGH").forEach { level ->
                FilterChip(
                    selected = complexity == level,
                    onClick = { complexity = level },
                    shape = ControlShape,
                    label = { Text(level, fontSize = 11.sp) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Risk level
        SectionLabel("Risk level")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("LOW", "MEDIUM", "HIGH").forEach { level ->
                FilterChip(
                    selected = riskLevel == level,
                    onClick = { riskLevel = level },
                    shape = ControlShape,
                    label = { Text(level, fontSize = 11.sp) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = estimatedHoursText,
                onValueChange = { estimatedHoursText = it },
                label = { Text("Est. Hours") },
                placeholder = { Text("e.g. 4.0") },
                shape = ControlShape,
                colors = fieldColors(),
                modifier = Modifier.weight(1f)
            )

            OutlinedTextField(
                value = actualHoursText,
                onValueChange = { actualHoursText = it },
                label = { Text("Actual Hours") },
                placeholder = { Text("e.g. 3.5") },
                shape = ControlShape,
                colors = fieldColors(),
                modifier = Modifier.weight(1f)
            )
        }

        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("Assessment Notes & Retrospective") },
            placeholder = { Text("e.g. Delivered on schedule, high code quality.") },
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
    }
}