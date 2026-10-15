package tech.scryme.app.ui.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Operational Tasks",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            )

            Button(
                onClick = { showCreateTaskDialog = true },
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("+ Add Task", fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        FilterChipRow(
            selectedFilter = (uiState as? TasksUiState.Success)?.selectedFilter ?: "ALL",
            onSelectFilter = { filter ->
                viewModel.loadTasks(filter)
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

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
                        verticalArrangement = Arrangement.spacedBy(12.dp)
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

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
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
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(priorityColor)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = task.title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    if (!task.description.isNullOrEmpty()) {
                        Text(
                            text = task.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    if (!task.dueDate.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Due: ${task.dueDate}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                Button(
                    onClick = {
                        val nextStatus = when (task.status) {
                            "TODO" -> "IN_PROGRESS"
                            "IN_PROGRESS" -> "COMPLETED"
                            else -> "TODO"
                        }
                        onToggleStatus(nextStatus)
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isCompleted) Emerald500 else MaterialTheme.colorScheme.primary
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = when (task.status) {
                            "TODO" -> "Start"
                            "IN_PROGRESS" -> "Complete"
                            else -> "Done ✓"
                        },
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(10.dp))

            // Task Assessment Banner / Action Row
            val assessment = task.assessment
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (assessment != null) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Assessment: ",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            repeat(5) { index ->
                                Icon(
                                    imageVector = if (index < assessment.qualityScore) Icons.Filled.Star else Icons.Outlined.Star,
                                    contentDescription = null,
                                    tint = Amber500,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                        Text(
                            text = "Risk: ${assessment.riskLevel} · Complexity: ${assessment.complexity}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    Text(
                        text = "No formal assessment recorded yet",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                OutlinedButton(
                    onClick = onAssessTask,
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (assessment != null) "Edit Assessment" else "Assess Task",
                        fontSize = 11.sp
                    )
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
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        filters.forEach { filter ->
            val isSelected = filter == selectedFilter
            FilterChip(
                selected = isSelected,
                onClick = { onSelectFilter(filter) },
                label = { Text(filter) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    }
}

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
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline
            ),
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline
            ),
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
            Text(
                text = "Priority",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("LOW", "MEDIUM", "HIGH").forEach { p ->
                    FilterChip(
                        selected = priority == p,
                        onClick = { priority = p },
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

        // Quality Score Rating
        Text("Quality Score:", style = MaterialTheme.typography.labelMedium)
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
            Text("$qualityScore / 5 Stars", style = MaterialTheme.typography.bodySmall)
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Complexity
        Text("Complexity Level:", style = MaterialTheme.typography.labelMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("LOW", "MEDIUM", "HIGH").forEach { level ->
                FilterChip(
                    selected = complexity == level,
                    onClick = { complexity = level },
                    label = { Text(level, fontSize = 11.sp) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Risk Level
        Text("Risk Level:", style = MaterialTheme.typography.labelMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("LOW", "MEDIUM", "HIGH").forEach { level ->
                FilterChip(
                    selected = riskLevel == level,
                    onClick = { riskLevel = level },
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
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                ),
                modifier = Modifier.weight(1f)
            )

            OutlinedTextField(
                value = actualHoursText,
                onValueChange = { actualHoursText = it },
                label = { Text("Actual Hours") },
                placeholder = { Text("e.g. 3.5") },
                shape = RoundedCornerShape(10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                ),
                modifier = Modifier.weight(1f)
            )
        }

        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("Assessment Notes & Retrospective") },
            placeholder = { Text("e.g. Delivered on schedule, high code quality.") },
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline
            ),
            modifier = Modifier.fillMaxWidth()
        )
    }
}
