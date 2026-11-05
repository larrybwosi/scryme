package tech.scryme.app.domain.repository

import tech.scryme.app.data.dto.UpdateCustomerRequestDto
import tech.scryme.app.domain.model.CustomerItem
import tech.scryme.app.domain.model.CustomerTransactionItem

interface CustomerRepository {
    suspend fun getCustomers(search: String? = null, limit: Int = 50, offset: Int = 0): Result<List<CustomerItem>>
    suspend fun getCustomerDetails(customerId: String): Result<CustomerItem>
    suspend fun getCustomerTransactions(customerId: String, limit: Int = 20): Result<List<CustomerTransactionItem>>
    suspend fun updateCustomer(customerId: String, request: UpdateCustomerRequestDto): Result<CustomerItem>
}
