package tech.scryme.app.ui.schedule

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.ui.components.DatePickerTextField
import tech.scryme.app.ui.components.MemberDropdown
import tech.scryme.app.ui.components.StyledFormDialog
import tech.scryme.app.ui.components.TimePickerTextField

@Composable
fun CreateScheduleTaskDialog(
    initialDate: String,
    members: List<UserProfile>,
    onDismiss: () -> Unit,
    onSubmit: (title: String, description: String?, priority: String, assignedMemberId: String?, dueDate: String, dueTime: String?, category: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("MEDIUM") }
    var category by remember { mutableStateOf("UI/UX Design") }
    var dueDate by remember { mutableStateOf(initialDate) }
    var dueTime by remember { mutableStateOf("09:00 AM") }
    var assignedMemberId by remember { mutableStateOf<String?>(null) }

    StyledFormDialog(
        title = "New Task",
        onDismissRequest = onDismiss,
        confirmButtonText = "Create Task",
        confirmEnabled = title.isNotBlank(),
        onConfirm = {
            onSubmit(
                title.trim(),
                description.trim().ifBlank { null },
                priority,
                assignedMemberId,
                dueDate,
                dueTime.trim().ifBlank { null },
                category.trim().ifBlank { null }
            )
        }
    ) {
        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Task Title *") },
            shape = RoundedCornerShape(6.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            shape = RoundedCornerShape(6.dp),
            modifier = Modifier.fillMaxWidth(),
            minLines = 2
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = category,
            onValueChange = { category = it },
            label = { Text("Category (e.g. UI/UX Design)") },
            shape = RoundedCornerShape(6.dp),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(modifier = Modifier.weight(1f)) {
                DatePickerTextField(
                    label = "Due Date",
                    value = dueDate,
                    onValueChange = { dueDate = it }
                )
            }
            Box(modifier = Modifier.weight(1f)) {
                TimePickerTextField(
                    label = "Due Time",
                    value = dueTime,
                    onValueChange = { dueTime = it }
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        MemberDropdown(
            label = "Assignee",
            members = members,
            selectedMemberId = assignedMemberId,
            onMemberSelected = { assignedMemberId = it }
        )
    }
}
