package tech.scryme.app.data.repository

import tech.scryme.app.data.api.CustomerApiService
import tech.scryme.app.data.dto.CustomerDto
import tech.scryme.app.data.dto.CustomerTransactionDto
import tech.scryme.app.data.dto.UpdateCustomerRequestDto
import tech.scryme.app.domain.model.CustomerItem
import tech.scryme.app.domain.model.CustomerTransactionItem
import tech.scryme.app.domain.repository.CustomerRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CustomerRepositoryImpl @Inject constructor(
    private val customerApiService: CustomerApiService
) : CustomerRepository {

    override suspend fun getCustomers(
        search: String?,
        limit: Int,
        offset: Int
    ): Result<List<CustomerItem>> {
        return try {
            val res = customerApiService.getCustomers(search, limit, offset)
            if (res.isSuccessful && res.body()?.success == true) {
                val customers = res.body()?.data?.customers?.map { it.toDomain() } ?: emptyList()
                Result.success(customers)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getCustomerDetails(customerId: String): Result<CustomerItem> {
        return try {
            val res = customerApiService.getCustomerDetails(customerId)
            if (res.isSuccessful && res.body()?.success == true) {
                val customer = res.body()?.data?.toDomain()
                    ?: return Result.failure(Exception("Customer not found"))
                Result.success(customer)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getCustomerTransactions(
        customerId: String,
        limit: Int
    ): Result<List<CustomerTransactionItem>> {
        return try {
            val res = customerApiService.getCustomerTransactions(customerId, limit)
            if (res.isSuccessful && res.body()?.success == true) {
                val transactions = res.body()?.data?.transactions?.map { it.toDomain() } ?: emptyList()
                Result.success(transactions)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateCustomer(
        customerId: String,
        request: UpdateCustomerRequestDto
    ): Result<CustomerItem> {
        return try {
            val res = customerApiService.updateCustomer(customerId, request)
            if (res.isSuccessful && res.body()?.success == true) {
                val customer = res.body()?.data?.toDomain()
                    ?: return Result.failure(Exception("Customer update returned null"))
                Result.success(customer)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun CustomerDto.toDomain() = CustomerItem(
        id = id,
        name = name,
        email = email,
        phone = phone,
        company = company,
        customerType = customerType ?: "INDIVIDUAL",
        loyaltyPoints = loyaltyPoints,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun CustomerTransactionDto.toDomain() = CustomerTransactionItem(
        id = id,
        transactionNumber = transactionNumber,
        totalAmount = totalAmount,
        currencyCode = currencyCode ?: "USD",
        status = status ?: "CONFIRMED",
        cashierName = cashierName,
        createdAt = createdAt
    )
}
