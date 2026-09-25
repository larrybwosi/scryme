package tech.scryme.admin.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.scryme.admin.data.model.LocationDto
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.ShiftsViewModel
import tech.scryme.admin.presentation.viewmodel.TasksViewModel

@Composable
fun SchedulesAndTasksView(
    shiftsViewModel: ShiftsViewModel,
    tasksViewModel: TasksViewModel,
    presenceViewModel: PresenceViewModel,
    branches: List<LocationDto> = emptyList()
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
    ) {
        // Top Navigation Sub-Tabs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
                .clip(RoundedCornerShape(12.dp))
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = {
                    Text(
                        "Shifts Roster",
                        fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal
                    )
                },
                icon = { Icon(Icons.Default.Schedule, contentDescription = "Shifts") }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = {
                    selectedTab = 1
                    tasksViewModel.loadTasks()
                },
                text = {
                    Text(
                        "Staff Tasks",
                        fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal
                    )
                },
                icon = { Icon(Icons.Default.Assignment, contentDescription = "Tasks") }
            )
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when (selectedTab) {
                0 -> ShiftsView(
                    shiftsViewModel = shiftsViewModel,
                    presenceViewModel = presenceViewModel
                )
                1 -> TasksView(
                    tasksViewModel = tasksViewModel,
                    presenceViewModel = presenceViewModel,
                    branches = branches
                )
            }
        }
    }
}
