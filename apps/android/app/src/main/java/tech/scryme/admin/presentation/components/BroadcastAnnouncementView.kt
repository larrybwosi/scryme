package tech.scryme.admin.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PriorityHigh
import androidx.compose.material.icons.filled.Warning
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
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

private val StatusBlue = Color(0xFF3B82F6)
private val StatusAmber = Color(0xFFF59E0B)
private val StatusRed = Color(0xFFEF4444)
private val StatusGreen = Color(0xFF10B981)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BroadcastAnnouncementView(
    branches: List<LocationDto>,
    announcementViewModel: AnnouncementViewModel
) {
    var title by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var selectedBranchId by remember { mutableStateOf<String?>(null) }
    var severity by remember { mutableStateOf("INFO") }

    val announcementState by announcementViewModel.announcementState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(9.dp))
                    .background(StatusBlue.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Campaign, contentDescription = null, tint = StatusBlue, modifier = Modifier.size(18.dp))
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    "Broadcast Announcement",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    "Notify staff across one or all locations",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
            tonalElevation = 0.dp,
            shadowElevation = 0.dp
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    FieldLabel("TITLE")
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        placeholder = { Text("e.g. Scheduled maintenance tonight") },
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    FieldLabel("MESSAGE")
                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        placeholder = { Text("Write the announcement details…") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        minLines = 3
                    )
                }

                var selectedChannelSlug by remember { mutableStateOf("announcements") }

                Text(
                    "Target Channel",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("announcements" to "Announcements", "general" to "General", "shifts" to "Shifts Roster").forEach { (slug, label) ->
                        FilterChip(
                            selected = selectedChannelSlug == slug,
                            onClick = { selectedChannelSlug = slug },
                            label = { Text(label) }
                        )
                    }
                }

                if (branches.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        FieldLabel("TARGET BRANCH · OPTIONAL")
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = selectedBranchId == null,
                                onClick = { selectedBranchId = null },
                                label = { Text("All Locations", fontSize = 12.sp) },
                                shape = RoundedCornerShape(8.dp)
                            )
                            branches.take(2).forEach { branch ->
                                FilterChip(
                                    selected = selectedBranchId == branch.id,
                                    onClick = { selectedBranchId = branch.id },
                                    label = { Text(branch.name, fontSize = 12.sp) },
                                    shape = RoundedCornerShape(8.dp)
                                )
                            }
                        }
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    FieldLabel("SEVERITY LEVEL")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        SeverityOption(
                            label = "INFO",
                            icon = Icons.Default.Info,
                            color = StatusBlue,
                            selected = severity == "INFO",
                            modifier = Modifier.weight(1f)
                        ) { severity = "INFO" }
                        SeverityOption(
                            label = "WARNING",
                            icon = Icons.Default.Warning,
                            color = StatusAmber,
                            selected = severity == "WARNING",
                            modifier = Modifier.weight(1f)
                        ) { severity = "WARNING" }
                        SeverityOption(
                            label = "URGENT",
                            icon = Icons.Default.PriorityHigh,
                            color = StatusRed,
                            selected = severity == "URGENT",
                            modifier = Modifier.weight(1f)
                        ) { severity = "URGENT" }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                Button(
                    onClick = {
                        if (title.isNotBlank() && message.isNotBlank()) {
                            announcementViewModel.broadcastAnnouncement(
                                title = title,
                                message = message,
                                targetBranchId = selectedBranchId,
                                channelSlug = selectedChannelSlug,
                                severity = severity
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    enabled = announcementState !is UiState.Loading
                ) {
                    if (announcementState is UiState.Loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(Icons.Default.Campaign, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Send Announcement", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                }

                if (announcementState is UiState.Success) {
                    SuccessBanner("Announcement successfully broadcasted")
                } else if (announcementState is UiState.Error) {
                    ErrorComponent(
                        message = (announcementState as UiState.Error).message,
                        onRetry = {
                            if (title.isNotBlank() && message.isNotBlank()) {
                                announcementViewModel.broadcastAnnouncement(
                                    title = title,
                                    message = message,
                                    targetBranchId = selectedBranchId,
                                    channelSlug = selectedChannelSlug,
                                    severity = severity
                                )
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.6.sp),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontWeight = FontWeight.Medium
    )
}

@Composable
private fun SeverityOption(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier,
        onClick = onClick,
        shape = RoundedCornerShape(8.dp),
        color = if (selected) color.copy(alpha = 0.12f) else Color.Transparent,
        border = BorderStroke(
            width = 1.dp,
            color = if (selected) color.copy(alpha = 0.5f) else MaterialTheme.colorScheme.outlineVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (selected) color else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                label,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.4.sp,
                color = if (selected) color else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SuccessBanner(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(StatusGreen.copy(alpha = 0.10f))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = StatusGreen,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            message,
            color = StatusGreen,
            fontWeight = FontWeight.Medium,
            fontSize = 13.sp
        )
    }
}
