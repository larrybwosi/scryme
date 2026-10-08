package tech.scryme.app.data.repository

import tech.scryme.app.data.api.SalesApiService
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.MetricItem
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.OrderStatus
import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.repository.SalesRepository
import tech.scryme.app.domain.model.TransactionSummary
import tech.scryme.app.util.CurrencyUtils
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SalesRepositoryImpl @Inject constructor(
    private val salesApiService: SalesApiService,
    private val sessionManager: SessionManager
) : SalesRepository {

    override suspend fun getSalesAnalytics(): Result<SalesAnalytics> {
        return try {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            val response = salesApiService.getAnalytics()
            if (response.isSuccessful && response.body()?.data != null) {
                val data = response.body()!!.data!!
                val formattedBalance = CurrencyUtils.formatAmountString(data.totalBalance, currencyCode, currencySymbol)
                Result.success(data.copy(totalBalance = formattedBalance))
            } else {
                Result.success(getMockAnalytics(currencyCode, currencySymbol))
            }
        } catch (e: Exception) {
            val currencyCode = sessionManager.getOrgCurrency()
            val currencySymbol = sessionManager.getOrgCurrencySymbol()
            Result.success(getMockAnalytics(currencyCode, currencySymbol))
        }
    }

    override suspend fun getOrders(query: String?): Result<List<OrderItem>> {
        return try {
            val response = salesApiService.getOrders(query)
            if (response.isSuccessful && response.body()?.data != null) {
                val orders = response.body()!!.data!!
                if (!query.isNullOrBlank()) {
                    Result.success(orders.filter { it.title.contains(query, ignoreCase = true) || it.orderCode.contains(query, ignoreCase = true) })
                } else {
                    Result.success(orders)
                }
            } else {
                Result.success(filterMockOrders(query))
            }
        } catch (e: Exception) {
            Result.success(filterMockOrders(query))
        }
    }

    private fun getMockAnalytics(currencyCode: String, currencySymbol: String): SalesAnalytics {
        val rawAmount = 150841.93
        val formattedBalance = CurrencyUtils.formatAmount(rawAmount, currencyCode, currencySymbol)
        return SalesAnalytics(
            userName = "Jonathan",
            totalBalance = formattedBalance,
            metrics = listOf(
                MetricItem(title = "Customer", value = "24,139", trend = "27%", isUp = true),
                MetricItem(title = "Product", value = "53,401", trend = "8%", isUp = true),
                MetricItem(title = "Revenue", value = CurrencyUtils.formatAmount(78942.0, currencyCode, currencySymbol), trend = "15%", isUp = true),
                MetricItem(title = "Expense", value = CurrencyUtils.formatAmount(12318.0, currencyCode, currencySymbol), trend = "10%", isUp = false)
            ),
            recentTransactions = listOf(
                TransactionSummary(
                    id = "1",
                    productName = "EchoVibe Earbuds",
                    dateText = "22 Sept 2024",
                    status = OrderStatus.FULFILLED,
                    transactionCode = "#TXN_10005"
                ),
                TransactionSummary(
                    id = "2",
                    productName = "GlowNest Desk Lamp",
                    dateText = "22 Sept 2024",
                    status = OrderStatus.FULFILLED,
                    transactionCode = "#TXN_10006"
                ),
                TransactionSummary(
                    id = "3",
                    productName = "VertuoPlus Coffee Maker",
                    dateText = "21 Sept 2024",
                    status = OrderStatus.FULFILLED,
                    transactionCode = "#TXN_10007"
                ),
                TransactionSummary(
                    id = "4",
                    productName = "PulseWave Bluetooth Speaker",
                    dateText = "20 Sept 2024",
                    status = OrderStatus.FULFILLED,
                    transactionCode = "#TXN_10008"
                )
            )
        )
    }

    private fun filterMockOrders(query: String?): List<OrderItem> {
        val allOrders = listOf(
            OrderItem(
                id = "101",
                title = "TimeSync Smart Watch",
                itemCountText = "2 Item",
                timeText = "10:45 AM",
                status = OrderStatus.CONFIRMED,
                orderCode = "#TXN_10018",
                groupDate = "Today"
            ),
            OrderItem(
                id = "102",
                title = "DustBot Robot Vacuum",
                itemCountText = "1 Item",
                timeText = "8:45 AM",
                status = OrderStatus.CONFIRMED,
                orderCode = "#TXN_10012",
                groupDate = "Today"
            ),
            OrderItem(
                id = "103",
                title = "GlobalLink Travel Adapter",
                itemCountText = "3 Item",
                timeText = "8:20 AM",
                status = OrderStatus.SHIPPED,
                orderCode = "#TXN_10015",
                groupDate = "Today"
            ),
            OrderItem(
                id = "104",
                title = "CraftedFold Leather Wallet",
                itemCountText = "1 Item",
                timeText = "10:05 PM",
                status = OrderStatus.SHIPPED,
                orderCode = "#TXN_10024",
                groupDate = "Yesterday"
            ),
            OrderItem(
                id = "105",
                title = "ShieldFlex Phone Case",
                itemCountText = "4 Item",
                timeText = "3:24 PM",
                status = OrderStatus.FULFILLED,
                orderCode = "#TXN_10045",
                groupDate = "Yesterday"
            ),
            OrderItem(
                id = "106",
                title = "UrbanTrail Backpack",
                itemCountText = "2 Item",
                timeText = "4:15 PM",
                status = OrderStatus.FULFILLED,
                orderCode = "#TXN_10029",
                groupDate = "Yesterday"
            ),
            OrderItem(
                id = "107",
                title = "Dark Brown Leather Armchair",
                itemCountText = "1 Item",
                timeText = "3:02 PM",
                status = OrderStatus.FULFILLED,
                orderCode = "#TXN_10021",
                groupDate = "20 September"
            )
        )

        if (query.isNullOrBlank()) return allOrders
        return allOrders.filter {
            it.title.contains(query, ignoreCase = true) || it.orderCode.contains(query, ignoreCase = true)
        }
    }
}
