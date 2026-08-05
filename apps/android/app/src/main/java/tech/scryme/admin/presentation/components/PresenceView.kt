package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.data.model.PresenceStatus
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun PresenceView(
    presenceViewModel: PresenceViewModel,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val activeMembers by presenceViewModel.activeMembers.collectAsState()
    val presenceState by presenceViewModel.presenceState.collectAsState()
    val selectedLocationId by presenceViewModel.selectedLocationId.collectAsState()
    val branches by presenceViewModel.branches.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var showBranchDropdown by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        presenceViewModel.fetchBranches()
    }

    LaunchedEffect(searchQuery, selectedLocationId) {
        presenceViewModel.fetchCheckedInMembers(search = searchQuery.ifBlank { null })
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Back Navigation & Title block
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
                    text = "PRESENCE MONITOR",
                    color = ScrymeColors.Brass,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "Real-time Checked-in Staff & Active Members",
                    color = ScrymeColors.SoftGray,
                    fontSize = 12.sp
                )
            }
        }

        // Search Bar & Filter Action Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search staff name / Card ID", color = ScrymeColors.SoftGray, fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = ScrymeColors.Brass) },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = ScrymeColors.Brass,
                    unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                    cursorColor = ScrymeColors.Brass
                )
            )

            // Branch filter Button
            Box {
                Button(
                    onClick = { showBranchDropdown = !showBranchDropdown },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (selectedLocationId != null) ScrymeColors.Brass else ScrymeColors.SteelDark
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = "Filter",
                        tint = if (selectedLocationId != null) ScrymeColors.InkBg else ScrymeColors.Brass,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (selectedLocationId != null) "Filtered" else "Branch",
                        color = if (selectedLocationId != null) ScrymeColors.InkBg else ScrymeColors.Paper,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                DropdownMenu(
                    expanded = showBranchDropdown,
                    onDismissRequest = { showBranchDropdown = false },
                    modifier = Modifier.background(ScrymeColors.SteelDark)
                ) {
                    DropdownMenuItem(
                        text = { Text("All Branches", color = ScrymeColors.Paper) },
                        onClick = {
                            presenceViewModel.filterByBranch(null)
                            showBranchDropdown = false
                        }
                    )
                    branches.filter { it.isActive }.forEach { branch ->
                        DropdownMenuItem(
                            text = { Text(branch.name, color = ScrymeColors.Paper) },
                            onClick = {
                                presenceViewModel.filterByBranch(branch.id)
                                showBranchDropdown = false
                            }
                        )
                    }
                }
            }
        }

        // Active Members list title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "ACTIVE STAFF MEMBERS",
                color = ScrymeColors.Brass,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(ScrymeColors.Brass.copy(alpha = 0.15f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "REALTIME",
                    color = ScrymeColors.Brass,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        // Members List Container
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
        ) {
            val membersList = when (val state = presenceState) {
                is UiState.Success -> state.data
                else -> activeMembers
            }

            if (membersList.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No active staff found",
                        color = ScrymeColors.SoftGray,
                        fontSize = 14.sp
                    )
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    membersList.forEach { member ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(ScrymeColors.Brass.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = (member.user.name ?: "Unknown").take(1).uppercase(),
                                            color = ScrymeColors.Brass,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column {
                                        Text(
                                            text = member.user.name ?: "Unknown",
                                            color = ScrymeColors.Paper,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp
                                        )
                                        Text(
                                            text = "${member.role} • ${member.user.email}",
                                            color = ScrymeColors.SoftGray,
                                            fontSize = 12.sp
                                        )
                                    }
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.padding(bottom = 6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(if (member.status == PresenceStatus.ONLINE) Color.Green else Color.Gray)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = member.status.name,
                                            color = if (member.status == PresenceStatus.ONLINE) Color.Green else ScrymeColors.SoftGray,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    if (member.status == PresenceStatus.ONLINE) {
                                        OutlinedButton(
                                            onClick = {
                                                presenceViewModel.forceCheckoutMember(member.id)
                                                Toast.makeText(context, "Force check-out sent for ${member.user.name ?: "Unknown"}", Toast.LENGTH_SHORT).show()
                                            },
                                            border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.5f)),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Text("CHECK-OUT", color = ScrymeColors.Crimson, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
