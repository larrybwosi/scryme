package tech.scryme.app.ui.customer

import tech.scryme.app.util.CurrencyUtils

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.scryme.app.domain.model.CustomerItem
import tech.scryme.app.domain.model.CustomerTransactionItem
import tech.scryme.app.ui.components.EmptyStateCard
import tech.scryme.app.ui.components.ErrorMessageCard
import tech.scryme.app.ui.components.ListSkeleton
import tech.scryme.app.ui.components.StyledFormDialog
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Rose500

private val CardShape = RoundedCornerShape(16.dp)
private val TileShape = RoundedCornerShape(12.dp)
private val IconTileShape = RoundedCornerShape(10.dp)
private val ControlShape = RoundedCornerShape(10.dp)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerDetailsScreen(
    viewModel: CustomerDetailsViewModel,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showEditDialog by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState) {
        if (uiState is CustomerDetailsUiState.Success) {
            val msg = (uiState as CustomerDetailsUiState.Success).actionSuccessMessage
            if (msg != null) {
                snackbarHostState.showSnackbar(msg)
                viewModel.clearActionMessage()
            }
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Customer details",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    if (uiState is CustomerDetailsUiState.Success) {
                        IconButton(onClick = { showEditDialog = true }) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit customer"
                            )
                        }
                    }
                    IconButton(onClick = { viewModel.loadCustomerDetails() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                    actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is CustomerDetailsUiState.Loading -> {
                    ListSkeleton(modifier = Modifier.padding(16.dp))
                }

                is CustomerDetailsUiState.Error -> {
                    ErrorMessageCard(
                        message = state.message,
                        onRetry = { viewModel.loadCustomerDetails() },
                        modifier = Modifier.padding(16.dp)
                    )
                }

                is CustomerDetailsUiState.Success -> {
                    LazyColumn(
                        contentPadding = PaddingValues(
                            start = 16.dp,
                            end = 16.dp,
                            top = 8.dp,
                            bottom = 24.dp
                        ),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        item(key = "profile") {
                            CustomerProfileCard(
                                customer = state.customer,
                                orderCount = state.transactions.size
                            )
                        }

                        item(key = "transactions-header") {
                            TransactionsHeader(
                                count = state.transactions.size,
                                modifier = Modifier.padding(top = 14.dp, bottom = 2.dp)
                            )
                        }

                        when {
                            state.isTransactionsLoading -> item(key = "transactions-loading") {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(28.dp),
                                        strokeWidth = 3.dp
                                    )
                                }
                            }

                            state.transactions.isEmpty() -> item(key = "transactions-empty") {
                                EmptyStateCard(
                                    title = "No transactions yet",
                                    description = "Orders and purchases made by this customer will appear here.",
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }

                            else -> items(state.transactions, key = { it.id }) { tx ->
                                CustomerTransactionRow(transaction = tx)
                            }
                        }
                    }

                    if (showEditDialog) {
                        EditCustomerDialog(
                            customer = state.customer,
                            onDismiss = { showEditDialog = false },
                            onSubmit = { name, email, phone, company, isActive ->
                                viewModel.updateCustomer(name, email, phone, company, isActive)
                                showEditDialog = false
                            }
                        )
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

@Composable
fun CustomerProfileCard(
    customer: CustomerItem,
    orderCount: Int,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp)) {

            // Identity
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = customer.name.take(1).uppercase(),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = customer.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = customer.customerType,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                CustomerStatusChip(isActive = customer.isActive)
            }

            Spacer(Modifier.height(20.dp))

            // Key figures
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatTile(
                    icon = Icons.Default.Stars,
                    value = "${customer.loyaltyPoints}",
                    label = "Loyalty points",
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )
                StatTile(
                    icon = Icons.AutoMirrored.Filled.ReceiptLong,
                    value = "$orderCount",
                    label = if (orderCount == 1) "Order" else "Orders",
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )
            }

            Spacer(Modifier.height(20.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(Modifier.height(16.dp))

            // Contact details
            val hasCompany = !customer.company.isNullOrBlank()
            val hasEmail = !customer.email.isNullOrBlank()
            val hasPhone = !customer.phone.isNullOrBlank()

            if (hasCompany || hasEmail || hasPhone) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    if (hasCompany) {
                        ContactRow(Icons.Default.Business, "Company", customer.company!!)
                    }
                    if (hasEmail) {
                        ContactRow(Icons.Default.Email, "Email", customer.email!!)
                    }
                    if (hasPhone) {
                        ContactRow(Icons.Default.Phone, "Phone", customer.phone!!)
                    }
                }
            } else {
                Text(
                    text = "No contact details added. Use Edit to add an email or phone number.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun StatTile(
    icon: ImageVector,
    value: String,
    label: String,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = TileShape,
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ContactRow(icon: ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(IconTileShape)
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(18.dp)
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

@Composable
private fun TransactionsHeader(count: Int, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Transactions",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = if (count == 1) "1 record" else "$count records",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun CustomerTransactionRow(transaction: CustomerTransactionItem) {
    Surface(
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(IconTileShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ReceiptLong,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = "Order #${transaction.transactionNumber}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Cashier: ${transaction.cashierName ?: "Direct"}${if (transaction.items.isNotEmpty()) " • ${transaction.items.size} items" else ""}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = CurrencyUtils.formatAmount(transaction.totalAmount, transaction.currencyCode),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    TransactionStatusPill(status = transaction.status)
                }
            }

            if (transaction.items.isNotEmpty()) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    transaction.items.forEach { item ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.name,
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Unit Price: ${CurrencyUtils.formatAmount(item.unitPrice, transaction.currencyCode)} (Qty: ${item.quantity})",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Text(
                                text = CurrencyUtils.formatAmount(item.totalPrice, transaction.currencyCode),
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TransactionStatusPill(status: String) {
    val tone = statusTone(status)
    Surface(
        shape = CircleShape,
        color = tone.copy(alpha = 0.12f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(tone)
            )
            Text(
                text = status.lowercase().replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Medium,
                color = tone
            )
        }
    }
}

@Composable
private fun statusTone(status: String): Color {
    val s = status.lowercase()
    return when {
        "complete" in s || "paid" in s || "success" in s -> Emerald500
        "cancel" in s || "void" in s || "refund" in s || "fail" in s -> Rose500
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
}

// ---------------------------------------------------------------------------
// Edit dialog
// ---------------------------------------------------------------------------

@Composable
fun EditCustomerDialog(
    customer: CustomerItem,
    onDismiss: () -> Unit,
    onSubmit: (name: String, email: String?, phone: String?, company: String?, isActive: Boolean) -> Unit
) {
    var name by remember { mutableStateOf(customer.name) }
    var email by remember { mutableStateOf(customer.email ?: "") }
    var phone by remember { mutableStateOf(customer.phone ?: "") }
    var company by remember { mutableStateOf(customer.company ?: "") }
    var isActive by remember { mutableStateOf(customer.isActive) }

    StyledFormDialog(
        title = "Edit customer",
        onDismissRequest = onDismiss,
        confirmButtonText = "Save changes",
        onConfirm = {
            onSubmit(
                name.trim(),
                email.trim().ifBlank { null },
                phone.trim().ifBlank { null },
                company.trim().ifBlank { null },
                isActive
            )
        },
        confirmEnabled = name.isNotBlank()
    ) {
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name *") },
            singleLine = true,
            shape = ControlShape,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            shape = ControlShape,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Phone") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            shape = ControlShape,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = company,
            onValueChange = { company = it },
            label = { Text("Company") },
            singleLine = true,
            shape = ControlShape,
            modifier = Modifier.fillMaxWidth()
        )

        Surface(
            shape = ControlShape,
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 14.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Active customer",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = if (isActive) "Can make purchases and earn points"
                        else "Account is paused",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Switch(
                    checked = isActive,
                    onCheckedChange = { isActive = it }
                )
            }
        }
    }
}