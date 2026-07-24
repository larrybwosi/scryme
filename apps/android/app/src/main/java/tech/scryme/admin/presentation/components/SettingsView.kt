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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun SettingsView(
    presenceViewModel: PresenceViewModel,
    activeOrg: String,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val branches by presenceViewModel.branches.collectAsState()

    var newBranchName by remember { mutableStateOf("") }
    var newBranchCode by remember { mutableStateOf("") }
    var newBranchType by remember { mutableStateOf("RETAIL_SHOP") }
    var showTypeDropdown by remember { mutableStateOf(false) }

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
                    text = "BRANCH & SETTINGS",
                    color = ScrymeColors.Brass,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Configure branches and node variables",
                    color = ScrymeColors.SoftGray,
                    fontSize = 12.sp
                )
            }
        }

        // Branch Registry Management Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "BRANCH REGISTRY",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                if (branches.isEmpty()) {
                    Text(text = "No branches registered.", color = ScrymeColors.SoftGray, fontSize = 13.sp)
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        branches.forEach { branch ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(ScrymeColors.InkBg)
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = branch.name, color = ScrymeColors.Paper, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(text = "ID: ${branch.id}", color = ScrymeColors.SoftGray, fontSize = 11.sp)
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = if (branch.isActive) "Active" else "Inactive",
                                        color = if (branch.isActive) Color.Green else ScrymeColors.Crimson,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(end = 8.dp)
                                    )
                                    Switch(
                                        checked = branch.isActive,
                                        onCheckedChange = {
                                            presenceViewModel.toggleBranchStatus(branch.id)
                                            Toast.makeText(context, "${branch.name} status updated!", Toast.LENGTH_SHORT).show()
                                        },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Color.Green,
                                            checkedTrackColor = Color.Green.copy(alpha = 0.3f),
                                            uncheckedThumbColor = ScrymeColors.SoftGray,
                                            uncheckedTrackColor = ScrymeColors.InkBg
                                        ),
                                        modifier = Modifier.scale(0.8f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add Branch Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "REGISTER NEW BRANCH",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                OutlinedTextField(
                    value = newBranchName,
                    onValueChange = { newBranchName = it },
                    label = { Text("Branch Name", color = ScrymeColors.SoftGray) },
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
                    value = newBranchCode,
                    onValueChange = { newBranchCode = it },
                    label = { Text("Branch Code (Optional)", color = ScrymeColors.SoftGray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                        cursorColor = ScrymeColors.Brass
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Location Type Dropdown
                Text(text = "Branch Type:", color = ScrymeColors.SoftGray, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Box {
                    Button(
                        onClick = { showTypeDropdown = !showTypeDropdown },
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.InkBg),
                        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(text = newBranchType, color = ScrymeColors.Paper, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    DropdownMenu(
                        expanded = showTypeDropdown,
                        onDismissRequest = { showTypeDropdown = false },
                        modifier = Modifier.background(ScrymeColors.SteelDark)
                    ) {
                        listOf("RETAIL_SHOP", "WAREHOUSE", "KITCHEN", "OFFICE").forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type, color = ScrymeColors.Paper) },
                                onClick = {
                                    newBranchType = type
                                    showTypeDropdown = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (newBranchName.isNotBlank()) {
                            presenceViewModel.addBranch(newBranchName, newBranchCode.ifBlank { null }, newBranchType)
                            Toast.makeText(context, "$newBranchName successfully registered!", Toast.LENGTH_SHORT).show()
                            newBranchName = ""
                            newBranchCode = ""
                        } else {
                            Toast.makeText(context, "Branch Name is required", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("REGISTER BRANCH", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
