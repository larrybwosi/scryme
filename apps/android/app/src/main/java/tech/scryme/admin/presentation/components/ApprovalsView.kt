package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.presentation.viewmodel.ApprovalsViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors
import tech.scryme.admin.data.model.PriceChangeRequestDto
import tech.scryme.admin.data.model.StockAdjustmentResponseDto

enum class ApprovalTab {
    PRICE_CHANGES,
    STOCK_ADJUSTMENTS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApprovalsView(
    approvalsViewModel: ApprovalsViewModel,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val priceChanges by approvalsViewModel.priceChanges.collectAsState()
    val stockAdjustments by approvalsViewModel.stockAdjustments.collectAsState()
    val actionState by approvalsViewModel.actionState.collectAsState()

    var activeTab by remember { mutableStateOf(ApprovalTab.PRICE_CHANGES) }
    var statusFilter by remember { mutableStateOf("PENDING") } // PENDING, APPROVED, REJECTED, ALL

    // Rejection Dialog State
    var showRejectDialog by remember { mutableStateOf(false) }
    var targetRejectId by remember { mutableStateOf<String?>(null) }
    var rejectReason by remember { mutableStateOf("") }
    var isPriceChangeReject by remember { mutableStateOf(true) }

    // Load initial data and reload on filter/tab changes
    fun refreshData() {
        approvalsViewModel.loadPriceChangeRequests()
        approvalsViewModel.loadStockAdjustments(if (statusFilter == "ALL") null else statusFilter)
    }

    LaunchedEffect(statusFilter) {
        refreshData()
    }

    LaunchedEffect(actionState) {
        if (actionState is UiState.Success) {
            Toast.makeText(context, "Operation reviewed successfully!", Toast.LENGTH_SHORT).show()
            approvalsViewModel.resetActionState()
            refreshData()
        } else if (actionState is UiState.Error) {
            Toast.makeText(context, (actionState as UiState.Error).message, Toast.LENGTH_LONG).show()
            approvalsViewModel.resetActionState()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ScrymeColors.InkBg)
    ) {
        // TOP NAVIGATION HEADER
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(ScrymeColors.SteelDark)
                .padding(top = 16.dp, start = 16.dp, end = 16.dp, bottom = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBackToHome) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = ScrymeColors.Brass
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "APPROVALS CONTROL CENTER",
                        color = ScrymeColors.Brass,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "Review & process operation override requests",
                        color = ScrymeColors.SoftGray,
                        fontSize = 11.sp
                    )
                }
                IconButton(onClick = { refreshData() }) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = ScrymeColors.Brass
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // TAB SELECTOR
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(ScrymeColors.InkBg)
                    .padding(4.dp)
            ) {
                ApprovalTab.values().forEach { tab ->
                    val isSelected = activeTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) ScrymeColors.Brass else Color.Transparent)
                            .clickable { activeTab = tab }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (tab == ApprovalTab.PRICE_CHANGES) "PRICE CHANGES" else "STOCK ADJUSTMENTS",
                            color = if (isSelected) ScrymeColors.InkBg else ScrymeColors.SoftGray,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
        }

        // FILTER CHIPS & MAIN LIST PANEL
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // STATUS FILTER CHIPS
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf("PENDING", "APPROVED", "REJECTED", "ALL").forEach { status ->
                    val isSelected = statusFilter == status
                    StatusFilterChip(
                        text = status,
                        selected = isSelected,
                        onClick = { statusFilter = status }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // SCROLLABLE REQUESTS LIST
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (activeTab == ApprovalTab.PRICE_CHANGES) {
                    when (val state = priceChanges) {
                        is UiState.Loading -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = ScrymeColors.Brass)
                            }
                        }
                        is UiState.Error -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(state.message, color = ScrymeColors.Crimson, textAlign = TextAlign.Center)
                            }
                        }
                        is UiState.Success -> {
                            // Filter price change requests locally if "ALL" is selected, or let state reflect everything.
                            val list = state.data.filter {
                                statusFilter == "ALL" || it.status.uppercase() == statusFilter
                            }
                            if (list.isEmpty()) {
                                EmptyState(message = "No matching price change requests found")
                            } else {
                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .verticalScroll(rememberScrollState()),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    list.forEach { req ->
                                        PriceChangeCard(
                                            req = req,
                                            onApprove = {
                                                approvalsViewModel.reviewPriceChange(req.id, approve = true)
                                            },
                                            onReject = {
                                                targetRejectId = req.id
                                                isPriceChangeReject = true
                                                rejectReason = ""
                                                showRejectDialog = true
                                            }
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(24.dp))
                                }
                            }
                        }
                        else -> {}
                    }
                } else {
                    when (val state = stockAdjustments) {
                        is UiState.Loading -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = ScrymeColors.Brass)
                            }
                        }
                        is UiState.Error -> {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(state.message, color = ScrymeColors.Crimson, textAlign = TextAlign.Center)
                            }
                        }
                        is UiState.Success -> {
                            val list = state.data
                            if (list.isEmpty()) {
                                EmptyState(message = "No matching stock adjustment requests found")
                            } else {
                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .verticalScroll(rememberScrollState()),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    list.forEach { req ->
                                        StockAdjustmentCard(
                                            req = req,
                                            onApprove = {
                                                approvalsViewModel.reviewStockAdjustment(req.id, approve = true)
                                            },
                                            onReject = {
                                                targetRejectId = req.id
                                                isPriceChangeReject = false
                                                rejectReason = ""
                                                showRejectDialog = true
                                            }
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(24.dp))
                                }
                            }
                        }
                        else -> {}
                    }
                }
            }
        }
    }

    // INTERACTIVE REJECTION REASON DIALOG
    if (showRejectDialog) {
        AlertDialog(
            onDismissRequest = { showRejectDialog = false },
            title = {
                Text(
                    text = "SPECIFY REJECTION REASON",
                    color = ScrymeColors.Brass,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Provide a clean, descriptive feedback on why this request is being declined:",
                        color = ScrymeColors.SoftGray,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    OutlinedTextField(
                        value = rejectReason,
                        onValueChange = { rejectReason = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Reason for rejection...", color = ScrymeColors.SoftGray.copy(alpha = 0.5f)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                            focusedContainerColor = ScrymeColors.InkBg,
                            unfocusedContainerColor = ScrymeColors.InkBg,
                            focusedTextColor = ScrymeColors.Paper,
                            unfocusedTextColor = ScrymeColors.Paper
                        ),
                        singleLine = false,
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showRejectDialog = false
                        val finalId = targetRejectId
                        if (finalId != null) {
                            if (isPriceChangeReject) {
                                approvalsViewModel.reviewPriceChange(
                                    requestId = finalId,
                                    approve = false,
                                    rejectionReason = rejectReason.ifBlank { "Rejected by Administrator" }
                                )
                            } else {
                                approvalsViewModel.reviewStockAdjustment(
                                    requestId = finalId,
                                    approve = false,
                                    rejectionReason = rejectReason.ifBlank { "Rejected by Administrator" }
                                )
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Crimson, contentColor = Color.White),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text("Decline Request", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showRejectDialog = false },
                    border = BorderStroke(1.dp, ScrymeColors.SoftGray.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text("Cancel", color = ScrymeColors.SoftGray)
                }
            },
            containerColor = ScrymeColors.SteelDark,
            tonalElevation = 6.dp
        )
    }
}

@Composable
fun StatusFilterChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val bgColor = if (selected) ScrymeColors.Brass.copy(alpha = 0.2f) else ScrymeColors.SteelDark
    val textColor = if (selected) ScrymeColors.Brass else ScrymeColors.SoftGray
    val borderColor = if (selected) ScrymeColors.Brass else Color.Transparent

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .clickable { onClick() }
            .border(1.dp, borderColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun EmptyState(message: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(ScrymeColors.SteelDark),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Info,
                contentDescription = null,
                tint = ScrymeColors.Brass.copy(alpha = 0.4f),
                modifier = Modifier.size(32.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            color = ScrymeColors.SoftGray,
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun PriceChangeCard(
    req: PriceChangeRequestDto,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: ID & Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "REQUEST ID: ${req.id.take(8).uppercase()}",
                    color = ScrymeColors.Brass,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                StatusBadge(status = req.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Body Row: Pricing Shift & Requested By
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "PRICE SHIFT",
                        color = ScrymeColors.SoftGray,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "$${req.oldPrice} ➔ $${req.newPrice}",
                        color = ScrymeColors.Paper,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "REQUESTER",
                        color = ScrymeColors.SoftGray,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = req.requestedBy.take(8),
                        color = ScrymeColors.Paper,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            if (req.rejectionReason != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(4.dp))
                        .background(ScrymeColors.InkBg)
                        .padding(8.dp)
                ) {
                    Text(
                        text = "DECLINE FEEDBACK:",
                        color = ScrymeColors.Crimson,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = req.rejectionReason,
                        color = ScrymeColors.Paper,
                        fontSize = 11.sp
                    )
                }
            }

            // Action Buttons
            if (req.status.uppercase() == "PENDING") {
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                        shape = RoundedCornerShape(4.dp),
                        contentPadding = PaddingValues(vertical = 10.dp)
                    ) {
                        Text("Approve Override", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    OutlinedButton(
                        onClick = onReject,
                        modifier = Modifier.weight(1f),
                        border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(4.dp),
                        contentPadding = PaddingValues(vertical = 10.dp)
                    ) {
                        Text("Decline Request", color = ScrymeColors.Crimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun StockAdjustmentCard(
    req: StockAdjustmentResponseDto,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: ID and Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "ADJUST ID: ${req.id.take(8).uppercase()}",
                    color = ScrymeColors.Brass,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                StatusBadge(status = req.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Variant & Product Info
            val prodName = req.variant?.product?.name ?: "Unknown Product"
            val varName = req.variant?.name ?: ""
            val displayName = if (varName.isBlank() || varName == "null") prodName else "$prodName ($varName)"
            Text(
                text = displayName,
                color = ScrymeColors.Paper,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "SKU: ${req.variant?.sku ?: req.variantId.take(12)}",
                color = ScrymeColors.SoftGray,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Location & Quantity Changes
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "LOCATION",
                        color = ScrymeColors.SoftGray,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = req.location?.name ?: "All Branches",
                        color = ScrymeColors.Paper,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                val sign = if (req.quantity > 0) "+" else ""
                val qtyColor = if (req.quantity > 0) Color.Green else ScrymeColors.Crimson
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "STOCK SHIFT",
                        color = ScrymeColors.SoftGray,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "$sign${req.quantity}",
                        color = qtyColor,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Reason & Notes
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Reason: ",
                    color = ScrymeColors.SoftGray,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = req.reason.replace("_", " "),
                    color = ScrymeColors.Paper,
                    fontSize = 12.sp
                )
            }

            if (!req.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(4.dp))
                        .background(ScrymeColors.InkBg)
                        .padding(8.dp)
                ) {
                    Text(
                        text = "REASON & NOTES:",
                        color = ScrymeColors.Brass,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = req.notes,
                        color = ScrymeColors.Paper,
                        fontSize = 11.sp
                    )
                }
            }

            // Action Buttons
            if (req.status.uppercase() == "PENDING") {
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onApprove,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                        shape = RoundedCornerShape(4.dp),
                        contentPadding = PaddingValues(vertical = 10.dp)
                    ) {
                        Text("Approve Override", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    OutlinedButton(
                        onClick = onReject,
                        modifier = Modifier.weight(1f),
                        border = BorderStroke(1.dp, ScrymeColors.Crimson.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(4.dp),
                        contentPadding = PaddingValues(vertical = 10.dp)
                    ) {
                        Text("Decline Request", color = ScrymeColors.Crimson, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val upperStatus = status.uppercase()
    val bgColor = when (upperStatus) {
        "APPROVED" -> Color.Green.copy(alpha = 0.15f)
        "REJECTED" -> ScrymeColors.Crimson.copy(alpha = 0.15f)
        else -> ScrymeColors.Brass.copy(alpha = 0.15f)
    }
    val fgColor = when (upperStatus) {
        "APPROVED" -> Color.Green
        "REJECTED" -> ScrymeColors.Crimson
        else -> ScrymeColors.Brass
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = upperStatus,
            color = fgColor,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}
