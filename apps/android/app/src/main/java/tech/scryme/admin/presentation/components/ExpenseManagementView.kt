package tech.scryme.admin.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.scryme.admin.data.model.ExpenseCategoryDto
import tech.scryme.admin.data.model.ExpenseDto
import tech.scryme.admin.data.model.formatCurrency
import tech.scryme.admin.presentation.viewmodel.ExpenseViewModel
import tech.scryme.admin.presentation.viewmodel.UiState

@Composable
fun ExpenseManagementView(
    expensesState: UiState<List<ExpenseDto>>,
    categoriesState: UiState<List<ExpenseCategoryDto>>,
    expenseViewModel: ExpenseViewModel
) {
    var showCreateModal by remember { mutableStateOf(false) }
    var description by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    val selectedCategoryId by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf("CASH") }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Organization Expenses",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Button(onClick = { showCreateModal = true }) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Expense")
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        when (expensesState) {
            is UiState.Loading -> Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            is UiState.Success -> {
                val list = expensesState.data
                if (list.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No recorded expenses.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(list) { exp ->
                            ElevatedCard(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            exp.description,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            formatCurrency(exp.amount, "USD"),
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            "Category: ${exp.category?.name ?: "General"} • Status: ${exp.status}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        if (exp.status.equals("PENDING", ignoreCase = true)) {
                                            TextButton(onClick = { expenseViewModel.approveExpense(exp.id) }) {
                                                Text("Approve")
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                ErrorComponent(
                    message = expensesState.message,
                    onRetry = { expenseViewModel.loadExpenses() }
                )
            }
            UiState.Idle -> {}
        }
    }

    if (showCreateModal) {
        AlertDialog(
            onDismissRequest = { showCreateModal = false },
            title = { Text("Create Expense Request") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Description") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Amount ($)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = paymentMethod,
                        onValueChange = { paymentMethod = it },
                        label = { Text("Payment Method (CASH/MPESA/CARD)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = amountText.toDoubleOrNull() ?: 0.0
                        val catId = selectedCategoryId.ifEmpty {
                            if (categoriesState is UiState.Success && categoriesState.data.isNotEmpty()) {
                                categoriesState.data.first().id
                            } else "general"
                        }
                        expenseViewModel.createExpense(description, amount, catId, paymentMethod)
                        showCreateModal = false
                        description = ""
                        amountText = ""
                    }
                ) {
                    Text("Submit Expense")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateModal = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
