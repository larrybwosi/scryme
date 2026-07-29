package tech.scryme.admin.presentation.components

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.admin.data.model.ExpenseDto
import tech.scryme.admin.presentation.viewmodel.ExpenseViewModel
import tech.scryme.admin.presentation.viewmodel.UiState
import tech.scryme.admin.presentation.theme.ScrymeColors

@Composable
fun ExpensesView(
    expenseViewModel: ExpenseViewModel,
    onBackToHome: () -> Unit
) {
    val context = LocalContext.current
    val expensesState by expenseViewModel.expensesState.collectAsState()
    val categoriesState by expenseViewModel.categoriesState.collectAsState()
    val registerState by expenseViewModel.registerState.collectAsState()

    var activeTab by remember { mutableStateOf(0) } // 0 = View, 1 = Add

    // Form inputs
    var description by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf("") }
    var selectedCategoryName by remember { mutableStateOf("Select Category") }
    var selectedPaymentMethod by remember { mutableStateOf("CASH") }
    var notes by remember { mutableStateOf("") }

    var categoryDropdownExpanded by remember { mutableStateOf(false) }
    var paymentMethodDropdownExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        expenseViewModel.fetchExpenses()
        expenseViewModel.fetchCategories()
    }

    LaunchedEffect(registerState) {
        if (registerState is UiState.Success) {
            Toast.makeText(context, "Expense registered and approved!", Toast.LENGTH_SHORT).show()
            description = ""
            amountText = ""
            selectedCategoryId = ""
            selectedCategoryName = "Select Category"
            selectedPaymentMethod = "CASH"
            notes = ""
            expenseViewModel.resetRegisterState()
            activeTab = 0 // Switch back to View tab to see it
        } else if (registerState is UiState.Error) {
            Toast.makeText(context, (registerState as UiState.Error).message, Toast.LENGTH_LONG).show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Back Navigation & Header
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
            Column {
                Text(
                    text = "REGISTERED EXPENSES",
                    color = ScrymeColors.Brass,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "No-approval required multi-branch dispersals",
                    color = ScrymeColors.SoftGray,
                    fontSize = 11.sp
                )
            }
        }

        // Segmented Tab Controls
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
                text = { Text("HISTORY", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            )
            Tab(
                selected = activeTab == 1,
                onClick = { activeTab = 1 },
                text = { Text("REGISTER NEW", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            )
        }

        if (activeTab == 0) {
            // Expenses History List Tab
            Box(modifier = Modifier.weight(1f)) {
                when (val state = expensesState) {
                    is UiState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = ScrymeColors.Brass)
                        }
                    }
                    is UiState.Success -> {
                        val list = state.data
                        if (list.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Info, contentDescription = null, tint = ScrymeColors.SoftGray, modifier = Modifier.size(48.dp))
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("No registered expenses found", color = ScrymeColors.SoftGray, fontSize = 14.sp)
                                }
                            }
                        } else {
                            LazyColumn(
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(list) { expense ->
                                    ExpenseListItem(expense)
                                }
                            }
                        }
                    }
                    is UiState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(text = "Error: ${state.message}", color = ScrymeColors.Crimson, fontSize = 14.sp)
                        }
                    }
                    else -> {}
                }
            }
        } else {
            // Register New Expense Tab
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
                    border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.2f))
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "EXPENSE DISBURSAL ENTRY",
                            color = ScrymeColors.Brass,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )

                        // Description
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            label = { Text("Disbursal Description", color = ScrymeColors.SoftGray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ScrymeColors.Brass,
                                unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                                cursorColor = ScrymeColors.Brass,
                                focusedTextColor = ScrymeColors.Paper,
                                unfocusedTextColor = ScrymeColors.Paper
                            )
                        )

                        // Amount
                        OutlinedTextField(
                            value = amountText,
                            onValueChange = { amountText = it },
                            label = { Text("Amount (USD)", color = ScrymeColors.SoftGray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ScrymeColors.Brass,
                                unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                                cursorColor = ScrymeColors.Brass,
                                focusedTextColor = ScrymeColors.Paper,
                                unfocusedTextColor = ScrymeColors.Paper
                            )
                        )

                        // Category Dropdown Selection
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text("Category", color = ScrymeColors.SoftGray, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(modifier = Modifier.fillMaxWidth()) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(ScrymeColors.InkBg, shape = RoundedCornerShape(6.dp))
                                        .clickable { categoryDropdownExpanded = !categoryDropdownExpanded }
                                        .padding(horizontal = 16.dp, vertical = 14.dp)
                                ) {
                                    Text(text = selectedCategoryName, color = ScrymeColors.Paper, fontSize = 14.sp)
                                }

                                DropdownMenu(
                                    expanded = categoryDropdownExpanded,
                                    onDismissRequest = { categoryDropdownExpanded = false },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(ScrymeColors.SteelDark)
                                ) {
                                    when (val catState = categoriesState) {
                                        is UiState.Success -> {
                                            catState.data.forEach { category ->
                                                DropdownMenuItem(
                                                    text = { Text(category.name, color = ScrymeColors.Paper) },
                                                    onClick = {
                                                        selectedCategoryId = category.id
                                                        selectedCategoryName = category.name
                                                        categoryDropdownExpanded = false
                                                    }
                                                )
                                            }
                                        }
                                        is UiState.Loading -> {
                                            DropdownMenuItem(
                                                text = { Text("Loading categories...", color = ScrymeColors.SoftGray) },
                                                onClick = {},
                                                enabled = false
                                            )
                                        }
                                        else -> {
                                            DropdownMenuItem(
                                                text = { Text("Standard Operating Expense", color = ScrymeColors.Paper) },
                                                onClick = {
                                                    selectedCategoryId = "standard"
                                                    selectedCategoryName = "Standard Operating Expense"
                                                    categoryDropdownExpanded = false
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // Payment Method Dropdown
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text("Payment Method", color = ScrymeColors.SoftGray, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(modifier = Modifier.fillMaxWidth()) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(ScrymeColors.InkBg, shape = RoundedCornerShape(6.dp))
                                        .clickable { paymentMethodDropdownExpanded = !paymentMethodDropdownExpanded }
                                        .padding(horizontal = 16.dp, vertical = 14.dp)
                                ) {
                                    Text(text = selectedPaymentMethod, color = ScrymeColors.Paper, fontSize = 14.sp)
                                }

                                DropdownMenu(
                                    expanded = paymentMethodDropdownExpanded,
                                    onDismissRequest = { paymentMethodDropdownExpanded = false },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(ScrymeColors.SteelDark)
                                ) {
                                    listOf("CASH", "MPESA", "CARD", "BANK_TRANSFER").forEach { method ->
                                        DropdownMenuItem(
                                            text = { Text(method, color = ScrymeColors.Paper) },
                                            onClick = {
                                                selectedPaymentMethod = method
                                                paymentMethodDropdownExpanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        // Notes
                        OutlinedTextField(
                            value = notes,
                            onValueChange = { notes = it },
                            label = { Text("Optional Custom Notes", color = ScrymeColors.SoftGray) },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 2,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ScrymeColors.Brass,
                                unfocusedBorderColor = ScrymeColors.SoftGray.copy(alpha = 0.3f),
                                cursorColor = ScrymeColors.Brass,
                                focusedTextColor = ScrymeColors.Paper,
                                unfocusedTextColor = ScrymeColors.Paper
                            )
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Submit Button
                        Button(
                            onClick = {
                                val amount = amountText.toDoubleOrNull()
                                if (description.isBlank()) {
                                    Toast.makeText(context, "Please enter a disbursal description", Toast.LENGTH_SHORT).show()
                                } else if (amount == null || amount <= 0.0) {
                                    Toast.makeText(context, "Please enter a valid amount", Toast.LENGTH_SHORT).show()
                                } else if (selectedCategoryId.isBlank()) {
                                    Toast.makeText(context, "Please select an expense category", Toast.LENGTH_SHORT).show()
                                } else {
                                    expenseViewModel.registerExpense(
                                        description = description,
                                        amount = amount,
                                        categoryId = selectedCategoryId,
                                        paymentMethod = selectedPaymentMethod,
                                        notes = notes.takeIf { it.isNotBlank() }
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = ScrymeColors.Brass, contentColor = ScrymeColors.InkBg),
                            shape = RoundedCornerShape(6.dp),
                            enabled = registerState !is UiState.Loading
                        ) {
                            if (registerState is UiState.Loading) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = ScrymeColors.InkBg)
                            } else {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("DISBURSE & AUTO-APPROVE", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
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
fun ExpenseListItem(expense: ExpenseDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = ScrymeColors.SteelDark),
        border = BorderStroke(1.dp, ScrymeColors.Brass.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = expense.expenseNumber,
                        color = ScrymeColors.Brass,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = expense.description,
                        color = ScrymeColors.Paper,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                Text(
                    text = "$${expense.amount}",
                    color = ScrymeColors.Paper,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .background(ScrymeColors.InkBg, shape = RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = expense.category?.name ?: "Operational",
                            color = ScrymeColors.SoftGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .background(ScrymeColors.InkBg, shape = RoundedCornerShape(4.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = expense.paymentMethod,
                            color = ScrymeColors.SoftGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .background(
                            color = if (expense.status == "APPROVED") Color(0xFF2E7D32) else Color(0xFFEF6C00),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = expense.status,
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
