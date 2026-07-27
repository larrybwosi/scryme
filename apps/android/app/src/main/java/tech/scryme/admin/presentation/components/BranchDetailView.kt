package tech.scryme.admin.presentation.components

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
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.data.model.AttendanceLogDto
import tech.scryme.admin.data.model.PettyCashTransactionDto
import tech.scryme.admin.presentation.theme.ScrymeColors
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

@Composable
fun BranchDetailView(
    presenceViewModel: PresenceViewModel,
    onBackToHome: () -> Unit
) {
    val branches by presenceViewModel.branches.collectAsState()
    val selectedBranchId by presenceViewModel.selectedBranchId.collectAsState()
    val branchSales by presenceViewModel.branchSales.collectAsState()
    val memberSalesList by presenceViewModel.memberSalesList.collectAsState()
    val pettyCashTransactions by presenceViewModel.pettyCashTransactions.collectAsState()
    val branchAttendanceLogs by presenceViewModel.branchAttendanceLogs.collectAsState()

    var branchIdInput by remember { mutableStateOf("") }
    var branchDropdownExpanded by remember { mutableStateOf(false) }
    var activeTab by remember { mutableStateOf(0) } // 0 = Petty Cash, 1 = Staff Logs, 2 = Member Sales

    // Automatically select the first active branch if none selected yet
    LaunchedEffect(Unit) {
        if (selectedBranchId == null && branches.isNotEmpty()) {
            val firstBranch = branches.firstOrNull { it.isActive } ?: branches.first()
            presenceViewModel.selectBranchForDetail(firstBranch.id)
            branchIdInput = firstBranch.id
        } else if (selectedBranchId != null) {
            branchIdInput = selectedBranchId!!
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ScrymeColors.InkBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 16.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Back Navigation & Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = {
                    presenceViewModel.selectBranchForDetail(null)
                    onBackToHome()
                },
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
                    text = "BRANCH PERFORMANCE",
                    color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 2.dp)
                )
                Text(
                    text = "Branch ID Inspector",
                    color = ScrymeColors.Paper,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Branch Selection & Search Box Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "SELECT OR ENTER BRANCH ID",
                    color = ScrymeColors.Brass,
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Outlined Text Field for Branch ID Input
                    OutlinedTextField(
                        value = branchIdInput,
                        onValueChange = {
                            branchIdInput = it
                            if (it.isNotBlank()) {
                                presenceViewModel.selectBranchForDetail(it)
                            }
                        },
                        label = { Text("Branch ID", color = ScrymeColors.SoftGray) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = ScrymeColors.Brass,
                            unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.18f),
                            focusedLabelColor = ScrymeColors.Brass,
                            cursorColor = ScrymeColors.Brass,
                            focusedTextColor = ScrymeColors.Paper,
                            unfocusedTextColor = ScrymeColors.Paper
                        )
                    )

                    // Branch Quick Selector Dropdown Button
                    Box {
                        Button(
                            onClick = { branchDropdownExpanded = !branchDropdownExpanded },
                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.InkBg),
                            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.height(56.dp)
                        ) {
                            Icon(Icons.Default.Home, contentDescription = "Dropdown", tint = ScrymeColors.Brass)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Branches", color = ScrymeColors.Paper, fontSize = 13.sp)
                        }

                        DropdownMenu(
                            expanded = branchDropdownExpanded,
                            onDismissRequest = { branchDropdownExpanded = false },
                            modifier = Modifier.background(ScrymeColors.SteelDark)
                        ) {
                            branches.forEach { branch ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = "${branch.name} (${branch.id})",
                                            color = if (branch.id == selectedBranchId) ScrymeColors.Brass else ScrymeColors.Paper,
                                            fontWeight = if (branch.id == selectedBranchId) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    onClick = {
                                        branchIdInput = branch.id
                                        presenceViewModel.selectBranchForDetail(branch.id)
                                        branchDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                val currentBranchName = branches.firstOrNull { it.id == selectedBranchId }?.name ?: "Unknown Branch"
                Text(
                    text = "Inspecting: $currentBranchName",
                    color = ScrymeColors.Brass,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(top = 10.dp)
                )
            }
        }

        if (selectedBranchId.isNullOrBlank()) {
            // Placeholder view when no branch is entered/selected
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Please enter or select a valid Branch ID.",
                    color = ScrymeColors.SoftGray,
                    fontSize = 14.sp
                )
            }
        } else {
            // KPI Summary Dashboard Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Card 1: Total Sales
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
                    border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(13.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("DAILY SALES", color = ScrymeColors.SoftGray.copy(alpha = 0.7f), fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "$${String.format("%.2f", branchSales)}",
                            color = ScrymeColors.Paper,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Today's ledger",
                            color = ScrymeColors.GreenLogo,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Card 2: Petty Cash
                val pcList = when (val state = pettyCashTransactions) {
                    is UiState.Success -> state.data
                    else -> emptyList()
                }
                val totalPCDisbursed = pcList.filter { it.type == "EXPENSE" }.sumOf { it.amount }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
                    border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(13.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("PETTY CASH", color = ScrymeColors.SoftGray.copy(alpha = 0.7f), fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "$${String.format("%.2f", totalPCDisbursed)}",
                            color = ScrymeColors.Paper,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${pcList.filter { it.type == "EXPENSE" }.size} usages today",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.8f),
                            fontSize = 10.sp
                        )
                    }
                }

                // Card 3: Active Presence
                val logsList = when (val state = branchAttendanceLogs) {
                    is UiState.Success -> state.data
                    else -> emptyList()
                }
                val activeStaffCount = logsList.count { it.checkOutTime == null }
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark.copy(alpha = 0.9f)),
                    border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(13.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("ACTIVE STAFF", color = ScrymeColors.SoftGray.copy(alpha = 0.7f), fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "$activeStaffCount checked",
                            color = ScrymeColors.Paper,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Currently on floor",
                            color = if (activeStaffCount > 0) ScrymeColors.GreenLogo else ScrymeColors.SoftGray.copy(alpha = 0.6f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            // Segmented Tabs Control for Tabulated Details
            TabRow(
                selectedTabIndex = activeTab,
                containerColor = ScrymeColors.SteelDark,
                contentColor = ScrymeColors.Brass,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[activeTab]),
                        color = ScrymeColors.Brass
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
            ) {
                Tab(
                    selected = activeTab == 0,
                    onClick = { activeTab = 0 },
                    text = { Text("PETTY CASH", fontWeight = FontWeight.Bold, fontSize = 11.sp) }
                )
                Tab(
                    selected = activeTab == 1,
                    onClick = { activeTab = 1 },
                    text = { Text("STAFF LOGS", fontWeight = FontWeight.Bold, fontSize = 11.sp) }
                )
                Tab(
                    selected = activeTab == 2,
                    onClick = { activeTab = 2 },
                    text = { Text("MEMBER SALES", fontWeight = FontWeight.Bold, fontSize = 11.sp) }
                )
            }

            // Tab Content rendering
            when (activeTab) {
                0 -> {
                    // TAB: Petty Cash Transactions
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "PETTY CASH USAGES IN THE BRANCH",
                            color = ScrymeColors.Brass,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.sp
                        )

                        when (val state = pettyCashTransactions) {
                            is UiState.Loading -> {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = ScrymeColors.Brass)
                                }
                            }
                            is UiState.Success -> {
                                val list = state.data
                                if (list.isEmpty()) {
                                    Text("No petty cash usages recorded.", color = ScrymeColors.SoftGray, fontSize = 13.sp)
                                } else {
                                    list.forEach { txn ->
                                        PettyCashRow(txn)
                                    }
                                }
                            }
                            is UiState.Error -> {
                                Text("Error: ${state.message}", color = ScrymeColors.Crimson, fontSize = 13.sp)
                            }
                            else -> {}
                        }
                    }
                }
                1 -> {
                    // TAB: Staff Timeline Logs (Checked in/out)
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "MEMBER CHECK-IN & CHECK-OUT LOGS",
                            color = ScrymeColors.Brass,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.sp
                        )

                        when (val state = branchAttendanceLogs) {
                            is UiState.Loading -> {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = ScrymeColors.Brass)
                                }
                            }
                            is UiState.Success -> {
                                val list = state.data
                                if (list.isEmpty()) {
                                    Text("No check-in or checkout logs recorded.", color = ScrymeColors.SoftGray, fontSize = 13.sp)
                                } else {
                                    list.forEach { log ->
                                        AttendanceLogTimelineRow(log)
                                    }
                                }
                            }
                            is UiState.Error -> {
                                Text("Error: ${state.message}", color = ScrymeColors.Crimson, fontSize = 13.sp)
                            }
                            else -> {}
                        }
                    }
                }
                2 -> {
                    // TAB: Sales Per Member Breakdown
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "SALES COMPLETED BY STAFF MEMBERS",
                            color = ScrymeColors.Brass,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.sp
                        )

                        if (memberSalesList.isEmpty()) {
                            Text("No member sales data recorded today.", color = ScrymeColors.SoftGray, fontSize = 13.sp)
                        } else {
                            val maxSalesTotal = memberSalesList.maxOfOrNull { it.totalAmount }?.coerceAtLeast(1.0) ?: 1.0

                            memberSalesList.forEach { memberSale ->
                                val progress = (memberSale.totalAmount / maxSalesTotal).toFloat()

                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                                    border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.04f))
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(24.dp)
                                                        .clip(CircleShape)
                                                        .background(ScrymeColors.Brass.copy(alpha = 0.15f)),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(
                                                        text = memberSale.memberName.take(1).uppercase(),
                                                        color = ScrymeColors.Brass,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 11.sp
                                                    )
                                                }
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = memberSale.memberName,
                                                    color = ScrymeColors.Paper,
                                                    fontWeight = FontWeight.SemiBold,
                                                    fontSize = 14.sp
                                                )
                                            }

                                            Column(horizontalAlignment = Alignment.End) {
                                                Text(
                                                    text = "$${String.format("%.2f", memberSale.totalAmount)}",
                                                    color = ScrymeColors.Paper,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 14.sp
                                                )
                                                Text(
                                                    text = "${memberSale.salesCount} sales",
                                                    color = ScrymeColors.SoftGray,
                                                    fontSize = 11.sp
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(10.dp))

                                        // Horizontal Sleek Progress Bar Representing Proportion of Sales
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(6.dp)
                                                .clip(RoundedCornerShape(3.dp))
                                                .background(ScrymeColors.InkBg)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth(progress)
                                                    .fillMaxHeight()
                                                    .clip(RoundedCornerShape(3.dp))
                                                    .background(ScrymeColors.Brass)
                                            )
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

@Composable
fun PettyCashRow(txn: PettyCashTransactionDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.05f))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = txn.description ?: "No description provided",
                    color = ScrymeColors.Paper,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.5.sp
                )
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(
                                if (txn.type == "EXPENSE") ScrymeColors.Crimson.copy(alpha = 0.15f)
                                else ScrymeColors.GreenLogo.copy(alpha = 0.15f)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = txn.type,
                            color = if (txn.type == "EXPENSE") ScrymeColors.Crimson else ScrymeColors.GreenLogo,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "by ${txn.member?.user?.name ?: "Staff"}",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.7f),
                        fontSize = 11.5.sp
                    )
                }
            }

            Text(
                text = "${if (txn.type == "EXPENSE") "-" else "+"}$${String.format("%.2f", txn.amount)}",
                color = if (txn.type == "EXPENSE") ScrymeColors.Crimson else ScrymeColors.GreenLogo,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 15.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

@Composable
fun AttendanceLogTimelineRow(log: AttendanceLogDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.05f))
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = log.member?.user?.name ?: "Unknown Staff",
                    color = ScrymeColors.Paper,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(if (log.checkOutTime == null) ScrymeColors.GreenLogo else ScrymeColors.SoftGray)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "In: ${log.checkInTime.take(16).replace("T", " ")}",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.8f),
                        fontSize = 11.sp
                    )
                }

                if (log.checkOutTime != null) {
                    Text(
                        text = "Out: ${log.checkOutTime.take(16).replace("T", " ")}",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.55f),
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                if (!log.notes.isNullOrBlank()) {
                    Text(
                        text = "Note: ${log.notes}",
                        color = ScrymeColors.Brass.copy(alpha = 0.8f),
                        fontSize = 11.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(ScrymeColors.InkBg)
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (log.checkOutTime == null) "ACTIVE" else "${log.durationMinutes ?: 480} min",
                    color = if (log.checkOutTime == null) ScrymeColors.GreenLogo else ScrymeColors.Paper,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
            }
        }
    }
}
