package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
            .background(ScrymeColors.InkBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 12.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Back navigation & title
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBackToHome,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(ScrymeColors.SteelDark.copy(alpha = 0.6f))
                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = ScrymeColors.SoftGray.copy(alpha = 0.85f),
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "SCRYME",
                    color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 2.dp)
                )
                Text(
                    text = "Branch & Settings",
                    color = ScrymeColors.Paper,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Branch registry management card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "BRANCH REGISTRY",
                    color = ScrymeColors.Brass,
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    modifier = Modifier.padding(bottom = 14.dp)
                )

                if (branches.isEmpty()) {
                    Text(
                        text = "No branches registered yet.",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                        fontSize = 13.sp
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        branches.forEach { branch ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(ScrymeColors.InkBg)
                                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(12.dp))
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = branch.name, color = ScrymeColors.Paper, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    Text(
                                        text = "ID: ${branch.id}",
                                        color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(top = 1.dp)
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = if (branch.isActive) "Active" else "Inactive",
                                        color = if (branch.isActive) ScrymeColors.GreenLogo else ScrymeColors.SoftGray.copy(alpha = 0.5f),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(end = 8.dp)
                                    )
                                    Switch(
                                        checked = branch.isActive,
                                        onCheckedChange = {
                                            presenceViewModel.toggleBranchStatus(branch.id)
                                            Toast.makeText(context, "${branch.name} status updated", Toast.LENGTH_SHORT).show()
                                        },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = ScrymeColors.Paper,
                                            checkedTrackColor = ScrymeColors.GreenLogo.copy(alpha = 0.5f),
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

        // Add branch form
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "REGISTER NEW BRANCH",
                    color = ScrymeColors.Brass,
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                OutlinedTextField(
                    value = newBranchName,
                    onValueChange = { newBranchName = it },
                    label = { Text("Branch name", color = ScrymeColors.SoftGray.copy(alpha = 0.7f)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.18f),
                        focusedLabelColor = ScrymeColors.Brass,
                        cursorColor = ScrymeColors.Brass,
                        focusedTextColor = ScrymeColors.Paper,
                        unfocusedTextColor = ScrymeColors.Paper
                    )
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = newBranchCode,
                    onValueChange = { newBranchCode = it },
                    label = { Text("Branch code (optional)", color = ScrymeColors.SoftGray.copy(alpha = 0.7f)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.18f),
                        focusedLabelColor = ScrymeColors.Brass,
                        cursorColor = ScrymeColors.Brass,
                        focusedTextColor = ScrymeColors.Paper,
                        unfocusedTextColor = ScrymeColors.Paper
                    )
                )

                Spacer(modifier = Modifier.height(18.dp))

                // Branch type selector
                Text(
                    text = "BRANCH TYPE",
                    color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Box {
                    OutlinedButton(
                        onClick = { showTypeDropdown = !showTypeDropdown },
                        modifier = Modifier.fillMaxWidth(),
                        border = BorderStroke(1.dp, ScrymeColors.SoftGray.copy(alpha = 0.18f)),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = ScrymeColors.InkBg,
                            contentColor = ScrymeColors.Paper
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 16.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = newBranchType, color = ScrymeColors.Paper, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            Text(text = if (showTypeDropdown) "▲" else "▼", color = ScrymeColors.SoftGray.copy(alpha = 0.6f), fontSize = 10.sp)
                        }
                    }

                    DropdownMenu(
                        expanded = showTypeDropdown,
                        onDismissRequest = { showTypeDropdown = false },
                        modifier = Modifier.background(ScrymeColors.SteelDark)
                    ) {
                        listOf("RETAIL_SHOP", "WAREHOUSE", "KITCHEN", "OFFICE").forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type, color = ScrymeColors.Paper, fontSize = 13.sp) },
                                onClick = {
                                    newBranchType = type
                                    showTypeDropdown = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (newBranchName.isNotBlank()) {
                            presenceViewModel.addBranch(newBranchName, newBranchCode.ifBlank { null }, newBranchType)
                            Toast.makeText(context, "$newBranchName successfully registered", Toast.LENGTH_SHORT).show()
                            newBranchName = ""
                            newBranchCode = ""
                        } else {
                            Toast.makeText(context, "Branch name is required", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Register branch", fontWeight = FontWeight.SemiBold, fontSize = 14.sp, letterSpacing = 0.3.sp)
                    }
                }
            }
        }
    }
}
