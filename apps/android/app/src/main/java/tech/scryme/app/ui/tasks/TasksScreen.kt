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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
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
// Design tokens
// ---------------------------------------------------------------------------

private val CardShape = RoundedCornerShape(10.dp)
private val ControlShape = RoundedCornerShape(8.dp)
private val ChipShape = RoundedCornerShape(6.dp)
private val CompactButtonPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)

private val ScreenHorizontalPadding = 16.dp

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant,
    errorBorderColor = Rose500
)

/** Flat, hairline-bordered container used for every card on the screen. */
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

/** Small uppercase caption used above form groups and metadata. */
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

/** Tinted pill with an optional leading dot, used for status / priority / risk. */
@Composable
private fun StatusChip(text: String, color: Color, showDot: Boolean = true) {
    Surface(
        shape = ChipShape,
        color = color.copy(alpha = 0.12f)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        ) {
            if (showDot) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(color)
                )
                Spacer(modifier = Modifier.width(6.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = color
            )
        }
    }
}

private fun prettyLabel(value: String): String =
    value.replace("_", " ").lowercase().split(" ")
        .joinToString(" ") { word -> word.replaceFirstChar { it.uppercase() } }

/** Maps LOW / MEDIUM / HIGH (and URGENT) onto the semantic palette. */
private fun levelColor(level: String?): Color = when (level?.uppercase()) {
    "HIGH", "URGENT" -> Rose500
    "MEDIUM" -> Amber500
    else -> Emerald500
}

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
    var searchQuery by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = ScreenHorizontalPadding, vertical = 16.dp)
    ) {
        // ---- Header ----
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Operational Tasks",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                )
                Text(
                    text = "Assign, track and review staff work",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Button(
                onClick = { showCreateTaskDialog = true },
                shape = ControlShape,
                contentPadding = PaddingValues(start = 12.dp, end = 16.dp, top = 8.dp, bottom = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "New Task",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // ---- Search ----
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search tasks") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Filled.Search,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "Clear search",
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            },
            singleLine = true,
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        // ---- Filters ----
        FilterChipRow(
            selectedFilter = (uiState as? TasksUiState.Success)?.selectedFilter ?: "ALL",
            onSelectFilter = { filter ->
                viewModel.loadTasks(filter)
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        // ---- Content ----
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
                val query = searchQuery.trim()
                val visibleTasks = if (query.isEmpty()) {
                    state.tasks
                } else {
                    state.tasks.filter { task ->
                        task.title.contains(query, ignoreCase = true) ||
                            (task.description?.contains(query, ignoreCase = true) == true)
                    }
                }

                when {
                    state.tasks.isEmpty() -> {
                        EmptyStateCard(
                            title = "No Tasks Found",
                            description = "There are no operational tasks assigned for the selected filter.",
                            actionText = "+ New Task",
                            onAction = { showCreateTaskDialog = true }
                        )
                    }
                    visibleTasks.isEmpty() -> {
                        EmptyStateCard(
                            title = "No Matching Tasks",
                            description = "No tasks match \"$query\". Try a different search term.",
                            actionText = "Clear Search",
                            onAction = { searchQuery = "" }
                        )
                    }
                    else -> {
                        SectionLabel(
                            text = if (visibleTasks.size == 1) "1 task" else "${visibleTasks.size} tasks"
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            contentPadding = PaddingValues(bottom = 16.dp)
                        ) {
                            items(visibleTasks, key = { it.id }) { task ->
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
    val priorityColor = levelColor(task.priority)
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
    val description = task.description
    val priority = task.priority
    val dueDate = task.dueDate

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
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                // ---- Title + primary action ----
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
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            color = if (isCompleted) MaterialTheme.colorScheme.onSurfaceVariant
                            else MaterialTheme.colorScheme.onSurface
                        )

                        if (!description.isNullOrEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = description,
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    when {
                        isCompleted -> OutlinedButton(
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
                        task.status == "IN_PROGRESS" -> Button(
                            onClick = { onToggleStatus(nextStatus) },
                            shape = ControlShape,
                            contentPadding = CompactButtonPadding
                        ) {
                            Text("Complete", style = MaterialTheme.typography.labelMedium)
                        }
                        else -> FilledTonalButton(
                            onClick = { onToggleStatus(nextStatus) },
                            shape = ControlShape,
                            contentPadding = CompactButtonPadding
                        ) {
                            Text("Start", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // ---- Meta row: status, priority, due date ----
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusChip(text = prettyLabel(task.status ?: "TODO"), color = statusColor)

                    if (!priority.isNullOrEmpty()) {
                        StatusChip(text = prettyLabel(priority), color = priorityColor, showDot = false)
                    }

                    if (!dueDate.isNullOrEmpty()) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Filled.CalendarMonth,
                                contentDescription = "Due date",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = dueDate,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Spacer(modifier = Modifier.height(12.dp))

                // ---- Assessment footer ----
                val assessment = task.assessment
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (assessment != null) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.semantics {
                                    contentDescription = "Quality ${assessment.qualityScore} out of 5"
                                }
                            ) {
                                repeat(5) { index ->
                                    Icon(
                                        imageVector = if (index < assessment.qualityScore) Icons.Filled.Star else Icons.Outlined.Star,
                                        contentDescription = null,
                                        tint = Amber500,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "${assessment.qualityScore}/5",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                StatusChip(
                                    text = "Risk ${prettyLabel(assessment.riskLevel)}",
                                    color = levelColor(assessment.riskLevel),
                                    showDot = false
                                )
                                StatusChip(
                                    text = "Complexity ${prettyLabel(assessment.complexity)}",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    showDot = false
                                )
                            }
                        }
                    } else {
                        Text(
                            text = "No assessment recorded",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    OutlinedButton(
                        onClick = onAssessTask,
                        shape = ControlShape,
                        contentPadding = CompactButtonPadding
                    ) {
                        Text(
                            text = if (assessment != null) "Edit Assessment" else "Assess",
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
                leadingIcon = if (isSelected) {
                    {
                        Icon(
                            imageVector = Icons.Filled.Check,
                            contentDescription = null,
                            modifier = Modifier.size(FilterChipDefaults.IconSize)
                        )
                    }
                } else null,
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = isSelected,
                    borderColor = MaterialTheme.colorScheme.outlineVariant,
                    selectedBorderColor = MaterialTheme.colorScheme.primary
                ),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                    selectedLeadingIconColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Dialog building blocks
// ---------------------------------------------------------------------------

/** Labelled LOW / MEDIUM / HIGH selector that stretches chips evenly across the row. */
@Composable
private fun LevelSelector(
    label: String,
    selected: String,
    onSelect: (String) -> Unit,
    options: List<String> = listOf("LOW", "MEDIUM", "HIGH")
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionLabel(label)
        Spacer(modifier = Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            options.forEach { option ->
                val isSelected = selected == option
                FilterChip(
                    selected = isSelected,
                    onClick = { onSelect(option) },
                    shape = ControlShape,
                    label = {
                        Text(
                            text = prettyLabel(option),
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 1
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = levelColor(option).copy(alpha = 0.16f),
                        selectedLabelColor = levelColor(option)
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = isSelected,
                        borderColor = MaterialTheme.colorScheme.outlineVariant,
                        selectedBorderColor = levelColor(option)
                    ),
                    modifier = Modifier.weight(1f)
                )
            }
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
                onSubmit(title.trim(), description.trim(), assignedMemberId, priority, dueDate)
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

        MemberDropdown(
            selectedMemberId = assignedMemberId,
            onMemberSelected = { assignedMemberId = it },
            members = members,
            label = "Assigned Member (Optional)",
            allowUnassigned = true
        )

        LevelSelector(
            label = "Priority",
            selected = priority,
            onSelect = { priority = it }
        )

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

    // Blank is allowed (optional); anything non-blank must parse as a non-negative number.
    fun isValidHours(text: String): Boolean {
        if (text.isBlank()) return true
        val value = text.toDoubleOrNull() ?: return false
        return value >= 0.0
    }
    val estimatedInvalid = !isValidHours(estimatedHoursText)
    val actualInvalid = !isValidHours(actualHoursText)

    StyledFormDialog(
        title = "Task Assessment & Review",
        onDismissRequest = onDismiss,
        confirmButtonText = "Save Assessment",
        onConfirm = {
            if (!estimatedInvalid && !actualInvalid) {
                onSubmit(
                    qualityScore,
                    complexity,
                    riskLevel,
                    estimatedHoursText.toDoubleOrNull(),
                    actualHoursText.toDoubleOrNull(),
                    notes.trim()
                )
            }
        },
        confirmEnabled = !estimatedInvalid && !actualInvalid
    ) {
        // Task context banner
        Surface(
            shape = ControlShape,
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                SectionLabel("Task")
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // Quality score rating
        Column {
            SectionLabel("Quality score")
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                (1..5).forEach { star ->
                    Icon(
                        imageVector = if (star <= qualityScore) Icons.Filled.Star else Icons.Outlined.Star,
                        contentDescription = "Rate $star out of 5",
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
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        LevelSelector(
            label = "Complexity level",
            selected = complexity,
            onSelect = { complexity = it }
        )

        LevelSelector(
            label = "Risk level",
            selected = riskLevel,
            onSelect = { riskLevel = it }
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = estimatedHoursText,
                onValueChange = { estimatedHoursText = it },
                label = { Text("Est. Hours") },
                placeholder = { Text("e.g. 4.0") },
                isError = estimatedInvalid,
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = ControlShape,
                colors = fieldColors(),
                modifier = Modifier.weight(1f)
            )

            OutlinedTextField(
                value = actualHoursText,
                onValueChange = { actualHoursText = it },
                label = { Text("Actual Hours") },
                placeholder = { Text("e.g. 3.5") },
                isError = actualInvalid,
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                shape = ControlShape,
                colors = fieldColors(),
                modifier = Modifier.weight(1f)
            )
        }

        if (estimatedInvalid || actualInvalid) {
            Text(
                text = "Hours must be a positive number, for example 4 or 3.5.",
                style = MaterialTheme.typography.bodySmall,
                color = Rose500
            )
        }

        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("Assessment Notes & Retrospective") },
            placeholder = { Text("e.g. Delivered on schedule, high code quality.") },
            minLines = 3,
            maxLines = 6,
            shape = ControlShape,
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth()
        )
    }
}