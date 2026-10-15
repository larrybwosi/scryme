package tech.scryme.app.data.repository

import tech.scryme.app.data.api.SalesApiService
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.OrderItem
import tech.scryme.app.domain.model.SalesAnalytics
import tech.scryme.app.domain.repository.SalesRepository
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
                val errorMsg = response.message().ifBlank { "Unable to load sales analytics" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
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
                val errorMsg = response.message().ifBlank { "Unable to load sales orders" }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
