package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun BroadcastView(
    announcementViewModel: AnnouncementViewModel,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val broadcastState by announcementViewModel.broadcastState.collectAsState()

    var broadcastTitle by remember { mutableStateOf("") }
    var broadcastMsg by remember { mutableStateOf("") }
    var severity by remember { mutableStateOf("INFO") }
    var showSeverityDropdown by remember { mutableStateOf(false) }

    LaunchedEffect(broadcastState) {
        if (broadcastState is UiState.Success) {
            Toast.makeText(context, "Announcement broadcast successfully!", Toast.LENGTH_SHORT).show()
            broadcastTitle = ""
            broadcastMsg = ""
            announcementViewModel.resetBroadcastState()
        } else if (broadcastState is UiState.Error) {
            Toast.makeText(context, (broadcastState as UiState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Back Navigation & Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBackToHome) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = ScrymeColors.Brass)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "BRANCH BROADCAST",
                    color = ScrymeColors.Brass,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Send announcements to system nodes",
                    color = ScrymeColors.SoftGray,
                    fontSize = 12.sp
                )
            }
        }

        // Broadcast Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "BROADCAST MESSAGE DETAILS",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                OutlinedTextField(
                    value = broadcastTitle,
                    onValueChange = { broadcastTitle = it },
                    label = { Text("Announcement Title", color = ScrymeColors.SoftGray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                        cursorColor = ScrymeColors.Brass
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = broadcastMsg,
                    onValueChange = { broadcastMsg = it },
                    label = { Text("Broadcast Message", color = ScrymeColors.SoftGray) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                        cursorColor = ScrymeColors.Brass
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Severity Selection Row
                Text(text = "Announcement Severity:", color = ScrymeColors.SoftGray, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Box {
                    Button(
                        onClick = { showSeverityDropdown = !showSeverityDropdown },
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.InkBg),
                        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(text = severity, color = ScrymeColors.Paper, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    DropdownMenu(
                        expanded = showSeverityDropdown,
                        onDismissRequest = { showSeverityDropdown = false },
                        modifier = Modifier.background(ScrymeColors.SteelDark)
                    ) {
                        listOf("INFO", "WARNING", "URGENT").forEach { level ->
                            DropdownMenuItem(
                                text = { Text(level, color = ScrymeColors.Paper) },
                                onClick = {
                                    severity = level
                                    showSeverityDropdown = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (broadcastTitle.isNotBlank() && broadcastMsg.isNotBlank()) {
                            announcementViewModel.broadcast(broadcastTitle, broadcastMsg, severity = severity)
                        } else {
                            Toast.makeText(context, "Title and Message are required", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                    shape = RoundedCornerShape(6.dp),
                    enabled = broadcastState !is UiState.Loading
                ) {
                    if (broadcastState is UiState.Loading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = ScrymeColors.InkBg)
                    } else {
                        Text("SEND SYSTEM BROADCAST", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }
        }
    }
}
