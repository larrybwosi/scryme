package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.AnnouncementViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun OperationsView(
    approvalsViewModel: ApprovalsViewModel,
    announcementViewModel: AnnouncementViewModel
) {
    val context = LocalContext.current
    val priceChanges by approvalsViewModel.priceChanges.collectAsState()
    val actionState by approvalsViewModel.actionState.collectAsState()
    val broadcastState by announcementViewModel.broadcastState.collectAsState()

    var broadcastTitle by remember { mutableStateOf("") }
    var broadcastMsg by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        approvalsViewModel.loadPriceChangeRequests()
    }

    LaunchedEffect(actionState) {
        if (actionState is UiState.Success) {
            Toast.makeText(context, "Price change request successfully reviewed!", Toast.LENGTH_SHORT).show()
        } else if (actionState is UiState.Error) {
            Toast.makeText(context, (actionState as UiState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

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
        // Title Block
        Column {
            Text(
                text = "LEDGER OPERATIONS",
                color = ScrymeColors.Brass,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Text(
                text = "Pending Price approvals & Branch Broadcasts",
                color = ScrymeColors.SoftGray,
                fontSize = 12.sp
            )
        }

        // 1. Price Change Approvals Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "PRICE CHANGE APPROVALS",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                val requestsList = (priceChanges as? UiState.Success)?.data ?: emptyList()

                if (requestsList.isEmpty()) {
                    Text(
                        text = "No pending price change requests",
                        color = ScrymeColors.SoftGray,
                        fontSize = 13.sp
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        requestsList.forEach { req ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(ScrymeColors.InkBg)
                                    .padding(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Variant: ${req.variantId.take(8)}...",
                                        color = ScrymeColors.Paper,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp
                                    )
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(ScrymeColors.Brass.copy(alpha = 0.15f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = req.status,
                                            color = ScrymeColors.Brass,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "$${req.oldPrice} -> $${req.newPrice}",
                                        color = ScrymeColors.Paper,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                    Text(
                                        text = "By: ${req.requestedBy.take(8)}...",
                                        color = ScrymeColors.SoftGray,
                                        fontSize = 11.sp
                                    )
                                }

                                if (req.status == "PENDING") {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = { approvalsViewModel.reviewPriceChange(req.id, approve = true) },
                                            modifier = Modifier.weight(1f),
                                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(vertical = 4.dp)
                                        ) {
                                            Text("Approve", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }

                                        OutlinedButton(
                                            onClick = { approvalsViewModel.reviewPriceChange(req.id, approve = false, "Rejected by Admin") },
                                            modifier = Modifier.weight(1f),
                                            border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.5f)),
                                            shape = RoundedCornerShape(4.dp),
                                            contentPadding = PaddingValues(vertical = 4.dp)
                                        ) {
                                            Text("Reject", color = ScrymeColors.Crimson, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Broadcast Announcements Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "BROADCAST TO BRANCHES",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
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

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (broadcastTitle.isNotBlank() && broadcastMsg.isNotBlank()) {
                            announcementViewModel.broadcast(broadcastTitle, broadcastMsg)
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
                        Text("SEND BROADCAST", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }
        }
    }
}
