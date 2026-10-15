package tech.scryme.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonOff
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import coil.compose.AsyncImage
import tech.scryme.app.domain.model.UserProfile
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.Button
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone



/**
 * Reusable Form DatePicker field with a calendar selector for enhanced UX.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DatePickerTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String = "YYYY-MM-DD",
    enabled: Boolean = true
) {
    var showDatePicker by remember { mutableStateOf(false) }

    Box(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            readOnly = true,
            enabled = enabled,
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            trailingIcon = {
                IconButton(onClick = { if (enabled) showDatePicker = true }) {
                    Icon(
                        imageVector = Icons.Default.DateRange,
                        contentDescription = "Select Date",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        )

        // Overlay click capture box to trigger calendar modal easily on field tap
        Box(
            modifier = Modifier
                .matchParentSize()
                .clickable(
                    enabled = enabled,
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = { showDatePicker = true }
                )
        )
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                                timeZone = TimeZone.getTimeZone("UTC")
                            }
                            val formattedDate = formatter.format(Date(millis))
                            onValueChange(formattedDate)
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

/**
 * Standard Dialog Layout Container with optimized compact padding, rounded corners, and cleaner typography.
 */
@Composable
fun StyledFormDialog(
    title: String,
    onDismissRequest: () -> Unit,
    confirmButtonText: String,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier,
    confirmEnabled: Boolean = true,
    dismissButtonText: String = "Cancel",
    content: @Composable ColumnScope.() -> Unit
) {
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = modifier
                .fillMaxWidth(0.92f)
                .padding(vertical = 16.dp),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 18.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(14.dp))

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    content()
                }

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = onDismissRequest,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(dismissButtonText)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = onConfirm,
                        enabled = confirmEnabled,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(confirmButtonText)
                    }
                }
            }
        }
    }
}


/**
 * Avatar image helper for member list items and selected field icon.
 */
@Composable
fun MemberAvatar(
    avatarUrl: String?,
    name: String,
    modifier: Modifier = Modifier
) {
    if (!avatarUrl.isNullOrBlank()) {
        AsyncImage(
            model = avatarUrl,
            contentDescription = name,
            modifier = modifier.clip(CircleShape),
            contentScale = ContentScale.Crop
        )
    } else {
        Box(
            modifier = modifier
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = name,
                tint = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.fillMaxSize(0.7f)
            )
        }
    }
}

/**
 * Reusable Member Dropdown selection field displaying member user icons and roles.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberDropdown(
    selectedMemberId: String?,
    onMemberSelected: (String) -> Unit,
    members: List<UserProfile>,
    label: String,
    modifier: Modifier = Modifier,
    allowUnassigned: Boolean = false,
    placeholder: String = "Select member"
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedMember = remember(selectedMemberId, members) {
        members.find { it.id == selectedMemberId }
    }

    val displayText = when {
        selectedMember != null -> {
            if (!selectedMember.role.isNullOrBlank()) {
                "${selectedMember.name} (${selectedMember.role})"
            } else {
                selectedMember.name
            }
        }
        allowUnassigned && selectedMemberId.isNullOrEmpty() -> "Unassigned"
        else -> selectedMemberId ?: ""
    }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = displayText,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            leadingIcon = {
                MemberAvatar(
                    avatarUrl = selectedMember?.avatarUrl,
                    name = selectedMember?.name ?: "",
                    modifier = Modifier.size(24.dp)
                )
            },
            trailingIcon = {
                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline
            ),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor()
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            modifier = Modifier.heightIn(max = 280.dp)
        ) {
            if (allowUnassigned) {
                DropdownMenuItem(
                    text = {
                        Text(
                            text = "Unassigned",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.PersonOff,
                            contentDescription = "Unassigned",
                            modifier = Modifier.size(24.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    onClick = {
                        onMemberSelected("")
                        expanded = false
                    }
                )
            }

            members.forEach { member ->
                DropdownMenuItem(
                    text = {
                        Column {
                            Text(
                                text = member.name,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            if (!member.role.isNullOrBlank()) {
                                Text(
                                    text = member.role,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    leadingIcon = {
                        MemberAvatar(
                            avatarUrl = member.avatarUrl,
                            name = member.name,
                            modifier = Modifier.size(28.dp)
                        )
                    },
                    onClick = {
                        onMemberSelected(member.id)
                        expanded = false
                    }
                )
            }
        }
    }
}
