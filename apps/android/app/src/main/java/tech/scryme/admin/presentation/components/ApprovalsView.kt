package tech.scryme.admin.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import tech.scryme.admin.data.model.PriceChangeRequestDto
import tech.scryme.admin.data.model.StockAdjustmentResponseDto
import tech.scryme.admin.presentation.viewmodel.UiState

@Composable
fun ApprovalsView(
    priceChangeRequestsState: UiState<List<PriceChangeRequestDto>>,
    stockAdjustmentsState: UiState<List<StockAdjustmentResponseDto>>,
    onReviewPrice: (String, Boolean, String?) -> Unit,
    onReviewStock: (String, Boolean, String?) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Pending Administrative Approvals",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                "Price Change Requests",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        when (priceChangeRequestsState) {
            is UiState.Loading -> item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is UiState.Success -> {
                val requests = priceChangeRequestsState.data
                if (requests.isEmpty()) {
                    item {
                        Text(
                            "No pending price change requests.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    items(requests) { req ->
                        val variantObj = req.effectiveVariant()
                        val productName = variantObj?.product?.name ?: variantObj?.name ?: req.variantId?.takeLast(8)?.let { "Variant $it" } ?: "Request #${req.id.takeLast(8)}"
                        val skuText = variantObj?.sku?.let { " (SKU: $it)" } ?: ""

                        ElevatedCard(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "$productName$skuText",
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = when (req.status.uppercase()) {
                                            "APPROVED" -> MaterialTheme.colorScheme.primaryContainer
                                            "REJECTED" -> MaterialTheme.colorScheme.errorContainer
                                            else -> MaterialTheme.colorScheme.secondaryContainer
                                        }
                                    ) {
                                        Text(
                                            text = req.status,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "Price Adjustment: $${req.oldPrice} ➔ $${req.newPrice}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                req.requestedAt?.let { date ->
                                    Text(
                                        "Requested: $date",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                if (req.status.equals("PENDING", ignoreCase = true)) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        OutlinedButton(onClick = { onReviewPrice(req.id, false, "Rejected by Admin") }) {
                                            Text("Reject")
                                        }
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Button(onClick = { onReviewPrice(req.id, true, null) }) {
                                            Text("Approve")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> item {
                ErrorComponent(
                    message = priceChangeRequestsState.message
                )
            }
            UiState.Idle -> {}
        }

        item {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Stock Adjustments",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        when (stockAdjustmentsState) {
            is UiState.Loading -> item {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is UiState.Success -> {
                val adjustments = stockAdjustmentsState.data
                if (adjustments.isEmpty()) {
                    item {
                        Text(
                            "No pending stock adjustments.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    items(adjustments) { adj ->
                        val productName = adj.variant?.product?.name ?: adj.variant?.name ?: "Variant ${adj.variantId.takeLast(8)}"
                        val locationName = adj.location?.name ?: "Location ${adj.locationId.takeLast(6)}"

                        ElevatedCard(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        productName,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = when (adj.status.uppercase()) {
                                            "APPROVED" -> MaterialTheme.colorScheme.primaryContainer
                                            "REJECTED" -> MaterialTheme.colorScheme.errorContainer
                                            else -> MaterialTheme.colorScheme.secondaryContainer
                                        }
                                    ) {
                                        Text(
                                            text = adj.status,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    "Location: $locationName • Quantity: ${if (adj.quantity > 0) "+${adj.quantity}" else "${adj.quantity}"}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    "Reason: ${adj.reason}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (adj.status.equals("PENDING", ignoreCase = true)) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        OutlinedButton(onClick = { onReviewStock(adj.id, false, "Rejected by Admin") }) {
                                            Text("Reject")
                                        }
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Button(onClick = { onReviewStock(adj.id, true, null) }) {
                                            Text("Approve")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            is UiState.Error -> item {
                ErrorComponent(
                    message = stockAdjustmentsState.message
                )
            }
            UiState.Idle -> {}
        }
    }
}
