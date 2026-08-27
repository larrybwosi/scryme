package tech.scryme.admin.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.scryme.admin.data.model.LocationDto
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

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
        Text(
            "Broadcast Announcement",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Spacer(modifier = Modifier.height(14.dp))

        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("Announcement Message") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )

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
                    Text(
                        "Target Branch (Optional)",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = selectedBranchId == null,
                            onClick = { selectedBranchId = null },
                            label = { Text("All Locations") }
                        )
                        branches.take(2).forEach { branch ->
                            FilterChip(
                                selected = selectedBranchId == branch.id,
                                onClick = { selectedBranchId = branch.id },
                                label = { Text(branch.name) }
                            )
                        }
                    }
                }

                Text(
                    "Severity Level",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("INFO", "WARNING", "URGENT").forEach { level ->
                        FilterChip(
                            selected = severity == level,
                            onClick = { severity = level },
                            label = { Text(level) }
                        )
                    }
                }

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
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    enabled = announcementState !is UiState.Loading
                ) {
                    if (announcementState is UiState.Loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Icon(Icons.Default.Campaign, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Send Announcement", fontWeight = FontWeight.Bold)
                    }
                }

                if (announcementState is UiState.Success) {
                    Text(
                        "Announcement successfully broadcasted!",
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
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
