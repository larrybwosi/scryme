package tech.scryme.admin.presentation.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import tech.scryme.admin.data.model.AttendanceLogDto
import tech.scryme.admin.data.model.PettyCashTransactionDto
import tech.scryme.admin.data.model.TransactionDto
import tech.scryme.admin.presentation.theme.ScrymeColors
import tech.scryme.admin.presentation.viewmodel.PresenceViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

// ---------- Shared design tokens ----------
private val CardRadius = 18.dp
private val RowRadius = 14.dp
private val ControlRadius = 12.dp

@Composable
private fun ElevatedSurface(
    modifier: Modifier = Modifier,
    radius: androidx.compose.ui.unit.Dp = CardRadius,
    elevationDp: androidx.compose.ui.unit.Dp = 8.dp,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier.shadow(
            elevation = elevationDp,
            shape = RoundedCornerShape(radius),
            ambientColor = Color.Black.copy(alpha = 0.35f),
            spotColor = Color.Black.copy(alpha = 0.35f)
        )
    ) {
        content()
    }
}

@Composable
private fun KpiCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    label: String,
    value: String,
    caption: String,
    captionColor: Color
) {
    ElevatedSurface(modifier = modifier, radius = 14.dp, elevationDp = 6.dp) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
            shape = RoundedCornerShape(14.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(RoundedCornerShape(7.dp))
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        ScrymeColors.Brass.copy(alpha = 0.25f),
                                        ScrymeColors.Brass.copy(alpha = 0.08f)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(icon, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(12.dp))
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(label, color = ScrymeColors.SoftGray.copy(alpha = 0.65f), fontSize = 9.5.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.6.sp)
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(text = value, color = ScrymeColors.Paper, fontSize = 19.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.2).sp)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = caption, color = captionColor, fontSize = 10.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        color = ScrymeColors.Brass,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.1.sp
    )
}

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
    val lastTransactions by presenceViewModel.lastTransactions.collectAsState()

    var branchIdInput by remember { mutableStateOf("") }
    var branchDropdownExpanded by remember { mutableStateOf(false) }
    var activeTab by remember { mutableStateOf(0) } // 0 = Petty Cash, 1 = Staff Logs, 2 = Member Sales, 3 = Last 5 Txns

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
            .padding(top = 16.dp, bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // ---------- Header ----------
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
                    .size(38.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(ScrymeColors.SteelDark)
                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f), RoundedCornerShape(11.dp))
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = ScrymeColors.SoftGray.copy(alpha = 0.9f),
                    modifier = Modifier.size(17.dp)
                )
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text(
                    text = "BRANCH PERFORMANCE",
                    color = ScrymeColors.Brass.copy(alpha = 0.85f),
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.2.sp,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
                Text(
                    text = "Branch Inspector",
                    color = ScrymeColors.Paper,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.3).sp
                )
            }
        }

        // ---------- Branch Selector ----------
        ElevatedSurface {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
                shape = RoundedCornerShape(CardRadius),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    SectionLabel("SELECT OR ENTER BRANCH ID")
                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = branchIdInput,
                            onValueChange = {
                                branchIdInput = it
                                if (it.isNotBlank()) {
                                    presenceViewModel.selectBranchForDetail(it)
                                }
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = null, tint = ScrymeColors.SoftGray.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
                            },
                            label = { Text("Branch ID", color = ScrymeColors.SoftGray.copy(alpha = 0.7f)) },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(ControlRadius),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ScrymeColors.Brass,
                                unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.16f),
                                focusedLabelColor = ScrymeColors.Brass,
                                cursorColor = ScrymeColors.Brass,
                                focusedTextColor = ScrymeColors.Paper,
                                unfocusedTextColor = ScrymeColors.Paper
                            )
                        )

                        Box {
                            Button(
                                onClick = { branchDropdownExpanded = !branchDropdownExpanded },
                                colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.InkBg),
                                border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.08f)),
                                shape = RoundedCornerShape(ControlRadius),
                                modifier = Modifier.height(56.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp)
                            ) {
                                Icon(Icons.Default.Home, contentDescription = null, tint = ScrymeColors.Brass, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Branches", color = ScrymeColors.Paper, fontSize = 12.5.sp, fontWeight = FontWeight.Medium)
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(Icons.Default.ExpandMore, contentDescription = null, tint = ScrymeColors.SoftGray.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
                            }

                            DropdownMenu(
                                expanded = branchDropdownExpanded,
                                onDismissRequest = { branchDropdownExpanded = false },
                                modifier = Modifier
                                    .background(ScrymeColors.SteelDark)
                                    .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f), RoundedCornerShape(10.dp))
                            ) {
                                branches.forEach { branch ->
                                    DropdownMenuItem(
                                        text = {
                                            Text(
                                                text = "${branch.name}  ·  ${branch.id}",
                                                color = if (branch.id == selectedBranchId) ScrymeColors.Brass else ScrymeColors.Paper,
                                                fontWeight = if (branch.id == selectedBranchId) FontWeight.Bold else FontWeight.Normal,
                                                fontSize = 13.sp
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
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(ScrymeColors.Brass.copy(alpha = 0.1f))
                            .padding(horizontal = 12.dp, vertical = 7.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(ScrymeColors.Brass)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Inspecting: $currentBranchName",
                            color = ScrymeColors.Brass,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        if (selectedBranchId.isNullOrBlank()) {
            ElevatedSurface(elevationDp = 4.dp) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                    border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.07f)),
                    shape = RoundedCornerShape(CardRadius)
                ) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = null,
                                tint = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                                modifier = Modifier.size(26.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Enter or select a valid Branch ID.",
                                color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                                fontSize = 13.5.sp
                            )
                        }
                    }
                }
            }
        } else {
            // ---------- KPI Summary ----------
            val pcList = when (val state = pettyCashTransactions) {
                is UiState.Success -> state.data
                else -> emptyList()
            }
            val totalPCDisbursed = pcList.filter { it.type == "EXPENSE" }.sumOf { it.amount }

            val logsList = when (val state = branchAttendanceLogs) {
                is UiState.Success -> state.data
                else -> emptyList()
            }
            val activeStaffCount = logsList.count { it.checkOutTime == null }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KpiCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.ShoppingCart,
                    label = "DAILY SALES",
                    value = "$${String.format("%.2f", branchSales)}",
                    caption = "Today's ledger",
                    captionColor = ScrymeColors.GreenLogo
                )
                KpiCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.Info,
                    label = "PETTY CASH",
                    value = "$${String.format("%.2f", totalPCDisbursed)}",
                    caption = "${pcList.count { it.type == "EXPENSE" }} usages today",
                    captionColor = ScrymeColors.SoftGray.copy(alpha = 0.75f)
                )
                KpiCard(
                    modifier = Modifier.weight(1f),
                    icon = Icons.Default.Person,
                    label = "ACTIVE STAFF",
                    value = "$activeStaffCount checked",
                    caption = "Currently on floor",
                    captionColor = if (activeStaffCount > 0) ScrymeColors.GreenLogo else ScrymeColors.SoftGray.copy(alpha = 0.55f)
                )
            }

            // ---------- Tabs ----------
            ElevatedSurface(radius = 14.dp, elevationDp = 4.dp) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(ScrymeColors.SteelDark)
                        .border(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
                ) {
                    TabRow(
                        selectedTabIndex = activeTab,
                        containerColor = Color.Transparent,
                        contentColor = ScrymeColors.Brass,
                        indicator = { tabPositions ->
                            TabRowDefaults.SecondaryIndicator(
                                modifier = Modifier.tabIndicatorOffset(tabPositions[activeTab]),
                                color = ScrymeColors.Brass,
                                height = 2.5.dp
                            )
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Tab(
                            selected = activeTab == 0,
                            onClick = { activeTab = 0 },
                            text = { Text("PETTY CASH", fontWeight = FontWeight.Bold, fontSize = 10.5.sp, letterSpacing = 0.4.sp) }
                        )
                        Tab(
                            selected = activeTab == 1,
                            onClick = { activeTab = 1 },
                            text = { Text("STAFF LOGS", fontWeight = FontWeight.Bold, fontSize = 10.5.sp, letterSpacing = 0.4.sp) }
                        )
                        Tab(
                            selected = activeTab == 2,
                            onClick = { activeTab = 2 },
                            text = { Text("MEMBER SALES", fontWeight = FontWeight.Bold, fontSize = 10.5.sp, letterSpacing = 0.4.sp) }
                        )
                        Tab(
                            selected = activeTab == 3,
                            onClick = { activeTab = 3 },
                            text = { Text("LAST 5 TXNS", fontWeight = FontWeight.Bold, fontSize = 10.5.sp, letterSpacing = 0.4.sp) }
                        )
                    }
                }
            }

            // ---------- Tab Content ----------
            when (activeTab) {
                0 -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        SectionLabel("PETTY CASH USAGES IN THE BRANCH")

                        when (val state = pettyCashTransactions) {
                            is UiState.Loading -> {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = ScrymeColors.Brass)
                                }
                            }
                            is UiState.Success -> {
                                val list = state.data
                                if (list.isEmpty()) {
                                    EmptyStateText("No petty cash usages recorded.")
                                } else {
                                    list.forEach { txn -> PettyCashRow(txn) }
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
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        SectionLabel("MEMBER CHECK-IN & CHECK-OUT LOGS")

                        when (val state = branchAttendanceLogs) {
                            is UiState.Loading -> {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = ScrymeColors.Brass)
                                }
                            }
                            is UiState.Success -> {
                                val list = state.data
                                if (list.isEmpty()) {
                                    EmptyStateText("No check-in or checkout logs recorded.")
                                } else {
                                    list.forEach { log -> AttendanceLogTimelineRow(log) }
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
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        SectionLabel("SALES COMPLETED BY STAFF MEMBERS")

                        if (memberSalesList.isEmpty()) {
                            EmptyStateText("No member sales data recorded today.")
                        } else {
                            val maxSalesTotal = memberSalesList.maxOfOrNull { it.totalAmount }?.coerceAtLeast(1.0) ?: 1.0

                            memberSalesList.forEach { memberSale ->
                                val progress = (memberSale.totalAmount / maxSalesTotal).toFloat()

                                ElevatedSurface(radius = RowRadius, elevationDp = 4.dp) {
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                                        border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
                                        shape = RoundedCornerShape(RowRadius),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(28.dp)
                                                            .clip(CircleShape)
                                                            .background(
                                                                Brush.linearGradient(
                                                                    listOf(
                                                                        ScrymeColors.Brass.copy(alpha = 0.28f),
                                                                        ScrymeColors.Brass.copy(alpha = 0.1f)
                                                                    )
                                                                )
                                                            ),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = memberSale.memberName.take(1).uppercase(),
                                                            color = ScrymeColors.Brass,
                                                            fontWeight = FontWeight.Bold,
                                                            fontSize = 12.sp
                                                        )
                                                    }
                                                    Spacer(modifier = Modifier.width(10.dp))
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
                                                        fontSize = 14.sp,
                                                        fontFamily = FontFamily.Monospace
                                                    )
                                                    Text(
                                                        text = "${memberSale.salesCount} sales",
                                                        color = ScrymeColors.SoftGray.copy(alpha = 0.65f),
                                                        fontSize = 11.sp
                                                    )
                                                }
                                            }

                                            Spacer(modifier = Modifier.height(12.dp))

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
                                                        .background(
                                                            Brush.horizontalGradient(
                                                                listOf(
                                                                    ScrymeColors.Brass.copy(alpha = 0.7f),
                                                                    ScrymeColors.Brass
                                                                )
                                                            )
                                                        )
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                3 -> {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        SectionLabel("LAST 5 COMPLETED TRANSACTIONS")

                        when (val state = lastTransactions) {
                            is UiState.Loading -> {
                                Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = ScrymeColors.Brass)
                                }
                            }
                            is UiState.Success -> {
                                val list = state.data.take(5)
                                if (list.isEmpty()) {
                                    EmptyStateText("No transactions recorded under this branch.")
                                } else {
                                    list.forEach { txn -> TransactionRow(txn) }
                                }
                            }
                            is UiState.Error -> {
                                Text("Error: ${state.message}", color = ScrymeColors.Crimson, fontSize = 13.sp)
                            }
                            else -> {}
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionRow(txn: TransactionDto) {
    var expanded by remember { mutableStateOf(false) }

    ElevatedSurface(radius = 14.dp, elevationDp = 4.dp) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = !expanded },
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
            shape = RoundedCornerShape(14.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "TX-${txn.id.take(8).uppercase()}",
                            color = ScrymeColors.Brass,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.5.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = txn.createdAt?.take(16)?.replace("T", " ") ?: "Unknown date",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.65f),
                            fontSize = 11.5.sp
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "$${String.format("%.2f", txn.amount ?: 0.0)}",
                            color = ScrymeColors.Paper,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            fontFamily = FontFamily.Monospace
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(
                                    if (txn.status?.uppercase() == "COMPLETED") ScrymeColors.GreenLogo.copy(alpha = 0.15f)
                                    else ScrymeColors.Brass.copy(alpha = 0.15f)
                                )
                                .padding(horizontal = 7.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = txn.status ?: "PENDING",
                                color = if (txn.status?.uppercase() == "COMPLETED") ScrymeColors.GreenLogo else ScrymeColors.Brass,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.4.sp
                            )
                        }
                    }
                }

                if (expanded && !txn.items.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider(color = ScrymeColors.Paper.copy(alpha = 0.06f))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "ITEMS LIST",
                        color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )

                    txn.items.forEach { item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = item.productName,
                                    color = ScrymeColors.Paper,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "${item.quantity} x $${String.format("%.2f", item.unitPrice)}",
                                    color = ScrymeColors.SoftGray.copy(alpha = 0.6f),
                                    fontSize = 11.sp
                                )
                            }
                            Text(
                                text = "$${String.format("%.2f", item.lineTotal)}",
                                color = ScrymeColors.Paper,
                                fontSize = 12.5.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyStateText(text: String) {
    Text(text, color = ScrymeColors.SoftGray.copy(alpha = 0.6f), fontSize = 13.sp)
}

@Composable
fun PettyCashRow(txn: PettyCashTransactionDto) {
    ElevatedSurface(radius = RowRadius, elevationDp = 4.dp) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
            shape = RoundedCornerShape(RowRadius),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
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
                    Spacer(modifier = Modifier.height(5.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(5.dp))
                                .background(
                                    if (txn.type == "EXPENSE") ScrymeColors.Crimson.copy(alpha = 0.15f)
                                    else ScrymeColors.GreenLogo.copy(alpha = 0.15f)
                                )
                                .padding(horizontal = 7.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = txn.type,
                                color = if (txn.type == "EXPENSE") ScrymeColors.Crimson else ScrymeColors.GreenLogo,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.4.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "by ${txn.member?.user?.name ?: "Staff"}",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.65f),
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
}

@Composable
fun AttendanceLogTimelineRow(log: AttendanceLogDto) {
    ElevatedSurface(radius = RowRadius, elevationDp = 4.dp) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
            border = BorderStroke(1.dp, ScrymeColors.Paper.copy(alpha = 0.06f)),
            shape = RoundedCornerShape(RowRadius),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
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
                    Spacer(modifier = Modifier.height(5.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(if (log.checkOutTime == null) ScrymeColors.GreenLogo else ScrymeColors.SoftGray.copy(alpha = 0.4f))
                        )
                        Spacer(modifier = Modifier.width(7.dp))
                        Text(
                            text = "In · ${log.checkInTime.take(16).replace("T", " ")}",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.8f),
                            fontSize = 11.sp
                        )
                    }

                    if (log.checkOutTime != null) {
                        Text(
                            text = "Out · ${log.checkOutTime.take(16).replace("T", " ")}",
                            color = ScrymeColors.SoftGray.copy(alpha = 0.5f),
                            fontSize = 11.sp,
                            modifier = Modifier.padding(top = 3.dp, start = 14.dp)
                        )
                    }

                    if (!log.notes.isNullOrBlank()) {
                        Text(
                            text = "Note: ${log.notes}",
                            color = ScrymeColors.Brass.copy(alpha = 0.85f),
                            fontSize = 11.sp,
                            modifier = Modifier.padding(top = 5.dp)
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (log.checkOutTime == null) ScrymeColors.GreenLogo.copy(alpha = 0.12f) else ScrymeColors.InkBg)
                        .border(
                            1.dp,
                            if (log.checkOutTime == null) ScrymeColors.GreenLogo.copy(alpha = 0.3f) else ScrymeColors.Paper.copy(alpha = 0.06f),
                            RoundedCornerShape(8.dp)
                        )
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
}
