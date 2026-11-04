package tech.scryme.app.data.dto

import com.google.gson.annotations.SerializedName
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.OrderLineItem
import tech.scryme.app.domain.model.OrderStatus
import tech.scryme.app.domain.model.MetricItem
import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.model.TransactionSummary

data class MetricItemDto(
    @SerializedName("title") val title: String? = null,
    @SerializedName("value") val value: String? = null,
    @SerializedName("trend") val trend: String? = null,
    @SerializedName("isUp") val isUp: Boolean? = true
) {
    fun toDomain() = MetricItem(
        title = title ?: "Metric",
        value = value ?: "0",
        trend = trend ?: "0%",
        isUp = isUp ?: true
    )
}

data class TransactionSummaryDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("productName") val productName: String? = null,
    @SerializedName("dateText") val dateText: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("transactionCode") val transactionCode: String? = null,
    @SerializedName("orderDetails") val orderDetails: OrderItemDto? = null
) {
    fun toDomain() = TransactionSummary(
        id = id ?: "txn_${System.currentTimeMillis()}",
        productName = productName ?: "Sale Transaction",
        dateText = dateText ?: "Today",
        status = parseOrderStatus(status),
        transactionCode = transactionCode ?: "#TXN",
        orderDetails = orderDetails?.toDomain()
    )
}

data class SalesAnalyticsDto(
    @SerializedName("userName") val userName: String? = null,
    @SerializedName("totalBalance") val totalBalance: String? = null,
    @SerializedName("metrics") val metrics: List<MetricItemDto>? = null,
    @SerializedName("recentTransactions") val recentTransactions: List<TransactionSummaryDto>? = null
) {
    fun toDomain() = SalesAnalytics(
        userName = userName ?: "Admin",
        totalBalance = totalBalance ?: "$0.00",
        metrics = metrics?.map { it.toDomain() } ?: emptyList(),
        recentTransactions = recentTransactions?.map { it.toDomain() } ?: emptyList()
    )
}

data class OrderLineItemDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("quantity") val quantity: Int? = 1,
    @SerializedName("unitPrice") val unitPrice: String? = null,
    @SerializedName("totalPrice") val totalPrice: String? = null,
    @SerializedName("sku") val sku: String? = null,
    @SerializedName("notes") val notes: String? = null
) {
    fun toDomain() = OrderLineItem(
        id = id,
        name = name ?: "Item",
        quantity = quantity ?: 1,
        unitPrice = unitPrice ?: "$0.00",
        totalPrice = totalPrice ?: "$0.00",
        sku = sku,
        notes = notes
    )
}

data class OrderItemDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("title") val title: String? = null,
    @SerializedName("itemCountText") val itemCountText: String? = null,
    @SerializedName("timeText") val timeText: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("orderCode") val orderCode: String? = null,
    @SerializedName("groupDate") val groupDate: String? = null,
    @SerializedName("lineItems") val lineItems: List<OrderLineItemDto>? = null,
    @SerializedName("customOrderNotes") val customOrderNotes: String? = null,
    @SerializedName("customerName") val customerName: String? = null,
    @SerializedName("customerPhone") val customerPhone: String? = null,
    @SerializedName("customerEmail") val customerEmail: String? = null,
    @SerializedName("fulfillmentStatus") val fulfillmentStatus: String? = null,
    @SerializedName("paymentMethod") val paymentMethod: String? = null,
    @SerializedName("paymentStatus") val paymentStatus: String? = null,
    @SerializedName("subtotal") val subtotal: String? = null,
    @SerializedName("tax") val tax: String? = null,
    @SerializedName("discount") val discount: String? = null,
    @SerializedName("totalAmount") val totalAmount: String? = null,
    @SerializedName("deliveryAddress") val deliveryAddress: String? = null
) {
    fun toDomain(): OrderItem {
        val parsedStatus = parseOrderStatus(status)
        val nonNullLineItems = lineItems?.map { it.toDomain() } ?: emptyList()
        return OrderItem(
            id = id ?: "ord_${System.currentTimeMillis()}",
            title = title ?: "Sale Order",
            itemCountText = itemCountText ?: "${nonNullLineItems.size} Items",
            timeText = timeText ?: "12:00 PM",
            status = parsedStatus,
            orderCode = orderCode ?: "#ORD",
            groupDate = groupDate ?: "Today",
            lineItems = nonNullLineItems,
            customOrderNotes = customOrderNotes,
            customerName = customerName,
            customerPhone = customerPhone,
            customerEmail = customerEmail,
            fulfillmentStatus = fulfillmentStatus,
            paymentMethod = paymentMethod,
            paymentStatus = paymentStatus,
            subtotal = subtotal,
            tax = tax,
            discount = discount,
            totalAmount = totalAmount,
            deliveryAddress = deliveryAddress
        )
    }
}

fun parseOrderStatus(statusStr: String?): OrderStatus {
    return when (statusStr?.uppercase()) {
        "FULFILLED", "COMPLETED", "DELIVERED", "PAID" -> OrderStatus.FULFILLED
        "SHIPPED", "DISPATCHED", "IN_TRANSIT" -> OrderStatus.SHIPPED
        else -> OrderStatus.CONFIRMED
    }
}
