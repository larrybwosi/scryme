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
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.ScanViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun ScanView(
    scanViewModel: ScanViewModel,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val scanState by scanViewModel.scanState.collectAsState()

    var cardInput by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        scanViewModel.resetScan()
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
                    text = "CARD SCAN SIMULATOR",
                    color = ScrymeColors.Brass,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "NFC / Card ID Resolver simulator",
                    color = ScrymeColors.SoftGray,
                    fontSize = 12.sp
                )
            }
        }

        // Simulator card options
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "SIMULATE CARD SCAN",
                    color = ScrymeColors.Brass,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                OutlinedTextField(
                    value = cardInput,
                    onValueChange = { cardInput = it },
                    label = { Text("Enter Card ID / Tap Code", color = ScrymeColors.SoftGray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = ScrymeColors.Brass,
                        unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                        cursorColor = ScrymeColors.Brass
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Shortcuts for quick simulation
                Text(text = "Quick Mock Cards:", color = ScrymeColors.SoftGray, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("CARD_123", "CARD_999", "CARD_ERR").forEach { mockId ->
                        SuggestionChip(
                            onClick = { cardInput = mockId },
                            label = { Text(mockId) },
                            colors = SuggestionChipDefaults.suggestionChipColors(
                                labelColor = ScrymeColors.Paper,
                                containerColor = ScrymeColors.InkBg
                            ),
                            border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.3f))
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (cardInput.isNotBlank()) {
                            scanViewModel.processCardScan(cardInput.trim())
                        } else {
                            Toast.makeText(context, "Please type or select a Card ID first", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                    shape = RoundedCornerShape(6.dp),
                    enabled = scanState !is UiState.Loading
                ) {
                    if (scanState is UiState.Loading) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = ScrymeColors.InkBg)
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("PROCESS SIMULATED SCAN", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                    }
                }
            }
        }

        // Result Container
        when (val state = scanState) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = ScrymeColors.Brass)
                }
            }
            is UiState.Success -> {
                val member = state.data
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                    border = BorderStroke(1.dp, Color.Green.copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(Color.Green.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = member.user.name.take(1).uppercase(),
                                color = Color.Green,
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = member.user.name,
                            color = ScrymeColors.Paper,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )

                        Text(
                            text = member.user.email,
                            color = ScrymeColors.SoftGray,
                            fontSize = 13.sp
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(ScrymeColors.Brass.copy(alpha = 0.2f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "${member.role} • ${member.status.name}",
                                color = ScrymeColors.Brass,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = { scanViewModel.resetScan() },
                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.InkBg, contentColor = ScrymeColors.Paper),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("SCAN ANOTHER CARD", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
            is UiState.Error -> {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                    border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "SCAN FAILURE",
                            color = ScrymeColors.Crimson,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        Text(
                            text = state.message,
                            color = ScrymeColors.Paper,
                            fontSize = 13.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = { scanViewModel.resetScan() },
                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.InkBg),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text("TRY AGAIN", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            UiState.Idle -> {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Awaiting card swipe or input...",
                        color = ScrymeColors.SoftGray,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}
