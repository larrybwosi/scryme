package tech.scryme.app.domain.model

data class MetricItem(
    val title: String,
    val value: String,
    val trend: String,
    val isUp: Boolean
)

data class SalesAnalytics(
    val userName: String,
    val totalBalance: String,
    val metrics: List<MetricItem>,
    val recentTransactions: List<TransactionSummary>
)

data class TransactionSummary(
    val id: String,
    val productName: String,
    val dateText: String,
    val status: OrderStatus,
    val transactionCode: String,
    val orderDetails: OrderItem? = null
)

data class OrderLineItem(
    val id: String? = null,
    val name: String,
    val quantity: Int,
    val unitPrice: String,
    val totalPrice: String,
    val sku: String? = null,
    val notes: String? = null
)

data class OrderItem(
    val id: String,
    val title: String,
    val itemCountText: String,
    val timeText: String,
    val status: OrderStatus,
    val orderCode: String,
    val groupDate: String,
    val lineItems: List<OrderLineItem> = emptyList(),
    val customOrderNotes: String? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerEmail: String? = null,
    val fulfillmentStatus: String? = null,
    val paymentMethod: String? = null,
    val paymentStatus: String? = null,
    val subtotal: String? = null,
    val tax: String? = null,
    val discount: String? = null,
    val totalAmount: String? = null,
    val deliveryAddress: String? = null
)

enum class OrderStatus(val label: String) {
    CONFIRMED("Confirmed"),
    SHIPPED("Shipped"),
    FULFILLED("Fulfilled")
}
