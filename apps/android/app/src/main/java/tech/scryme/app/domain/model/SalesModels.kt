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
    val transactionCode: String
)

data class OrderItem(
    val id: String,
    val title: String,
    val itemCountText: String,
    val timeText: String,
    val status: OrderStatus,
    val orderCode: String,
    val groupDate: String
)

enum class OrderStatus(val label: String) {
    CONFIRMED("Confirmed"),
    SHIPPED("Shipped"),
    FULFILLED("Fulfilled")
}
