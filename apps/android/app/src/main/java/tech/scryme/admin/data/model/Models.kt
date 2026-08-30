package tech.scryme.admin.data.model

import com.google.gson.annotations.SerializedName

// --- Authentication & Session Models ---

data class UserSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("image") val image: String? = null
)

enum class MemberRole {
    OWNER, ADMIN, MANAGER, EMPLOYEE, CASHIER, REPORTER, CUSTOMER, GUEST
}

enum class MembershipStatus {
    ACTIVE, PENDING_APPROVAL, SUSPENDED, REJECTED
}

enum class PresenceStatus {
    ONLINE, OFFLINE
}

data class MemberResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("user") val user: UserSummaryDto,
    @SerializedName("role") val role: MemberRole,
    @SerializedName("membershipStatus") val membershipStatus: MembershipStatus,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("status") val status: PresenceStatus,
    @SerializedName("isCheckedIn") val isCheckedIn: Boolean? = null,
    @SerializedName("cardId") val cardId: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String
)

data class TerminalLoginDto(
    @SerializedName("cardId") val cardId: String,
    @SerializedName("pin") val pin: String
)

data class TerminalLoginResponseDto(
    @SerializedName("token") val token: String,
    @SerializedName("member") val member: MemberResponseDto,
    @SerializedName("restoredSession") val restoredSession: Boolean? = null
)

data class SessionUser(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("role") val role: String? = null,
    @SerializedName("activeOrganizationId") val activeOrganizationId: String? = null,
    @SerializedName("activeOrganizationSlug") val activeOrganizationSlug: String? = null,
    @SerializedName("activeOrganizationName") val activeOrganizationName: String? = null
)

data class SessionDto(
    @SerializedName("id") val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("token") val token: String,
    @SerializedName("expiresAt") val expiresAt: String,
    @SerializedName("activeOrganizationId") val activeOrganizationId: String? = null
)

data class BetterAuthSessionResponse(
    @SerializedName("user") val user: SessionUser? = null,
    @SerializedName("token") val token: String? = null
)

// --- Presence & Attendance Models ---

data class CheckInDto(
    @SerializedName("locationId") val locationId: String,
    @SerializedName("notes") val notes: String? = null
)

data class CheckOutDto(
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("isAutoCheckout") val isAutoCheckout: Boolean? = null
)

data class LocationDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("organizationId") val organizationId: String,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class AttendanceLogDto(
    @SerializedName("id") val id: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("checkInTime") val checkInTime: String,
    @SerializedName("checkOutTime") val checkOutTime: String? = null,
    @SerializedName("checkInLocationId") val checkInLocationId: String,
    @SerializedName("checkOutLocationId") val checkOutLocationId: String? = null,
    @SerializedName("durationMinutes") val durationMinutes: Int? = null,
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("isAutoCheckout") val isAutoCheckout: Boolean? = null,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String,
    @SerializedName("member") val member: MemberResponseSummary? = null,
    @SerializedName("checkInLocation") val checkInLocation: LocationSummary? = null,
    @SerializedName("checkOutLocation") val checkOutLocation: LocationSummary? = null
)

data class MemberResponseSummary(
    @SerializedName("id") val id: String,
    @SerializedName("user") val user: UserSummaryNameOnly
)

data class UserSummaryNameOnly(
    @SerializedName("name") val name: String
)

data class LocationSummary(
    @SerializedName("name") val name: String
)

data class AttendanceLogsResponse(
    @SerializedName("items") val items: List<AttendanceLogDto>,
    @SerializedName("meta") val meta: PaginationMeta
)

data class PaginationMeta(
    @SerializedName("total") val total: Int,
    @SerializedName("page") val page: Int,
    @SerializedName("limit") val limit: Int,
    @SerializedName("totalPages") val totalPages: Int
)

// --- Organization Models ---

data class OrganizationDetailsDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("slug") val slug: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("taxId") val taxId: String? = null,
    @SerializedName("registrationNumber") val registrationNumber: String? = null,
    @SerializedName("logo") val logo: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("currencyCode") val currencyCode: String = "USD",
    @SerializedName("locationsCount") val locationsCount: Int = 0,
    @SerializedName("membersCount") val membersCount: Int = 0
)

// --- Approvals & Catalog Models ---

data class PriceListItemDto(
    @SerializedName("variant") val variant: StockAdjustmentVariantDto? = null
)

data class PriceChangeRequestDto(
    @SerializedName("id") val id: String,
    @SerializedName("variantId") val variantId: String? = null,
    @SerializedName("requestedBy") val requestedBy: String? = null,
    @SerializedName("oldPrice") val oldPrice: Double,
    @SerializedName("newPrice") val newPrice: Double,
    @SerializedName("status") val status: String, // PENDING, APPROVED, REJECTED
    @SerializedName("rejectionReason") val rejectionReason: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("requestedAt") val requestedAt: String? = null,
    @SerializedName("variant") val variant: StockAdjustmentVariantDto? = null,
    @SerializedName("priceListItem") val priceListItem: PriceListItemDto? = null
) {
    fun effectiveVariant(): StockAdjustmentVariantDto? {
        return variant ?: priceListItem?.variant
    }
}

data class PriceChangeReviewDto(
    @SerializedName("status") val status: String, // APPROVED, REJECTED
    @SerializedName("rejectionReason") val rejectionReason: String? = null
)

data class InventoryAdjustmentDto(
    @SerializedName("id") val id: String,
    @SerializedName("variantId") val variantId: String,
    @SerializedName("locationId") val locationId: String,
    @SerializedName("requestedQuantity") val requestedQuantity: Double,
    @SerializedName("status") val status: String, // PENDING, APPROVED, REJECTED
    @SerializedName("requestedBy") val requestedBy: String,
    @SerializedName("createdAt") val createdAt: String
)

// --- Analytics Models ---

data class PeakHourDto(
    @SerializedName("hour") val hour: Int,
    @SerializedName("count") val count: Int
)

data class BranchStatsDto(
    @SerializedName("locationId") val locationId: String,
    @SerializedName("locationName") val locationName: String,
    @SerializedName("activePresenceCount") val activePresenceCount: Int,
    @SerializedName("averageDurationMinutes") val averageDurationMinutes: Double
)

data class DashboardAnalyticsDto(
    @SerializedName("totalCheckedInNow") val totalCheckedInNow: Int,
    @SerializedName("peakHours") val peakHours: List<PeakHourDto>,
    @SerializedName("branchStats") val branchStats: List<BranchStatsDto>
)

// --- Broadcast Announcements & Messaging ---

data class AnnouncementDto(
    @SerializedName("title") val title: String,
    @SerializedName("message") val message: String,
    @SerializedName("targetBranchId") val targetBranchId: String? = null, // null for all
    @SerializedName("targetMemberId") val targetMemberId: String? = null, // target member if direct
    @SerializedName("channelSlug") val channelSlug: String? = null, // e.g. "announcements", "shifts"
    @SerializedName("severity") val severity: String = "INFO" // INFO, WARNING, URGENT
)

data class DirectMessageDto(
    @SerializedName("memberId") val memberId: String,
    @SerializedName("title") val title: String,
    @SerializedName("message") val message: String,
    @SerializedName("type") val type: String = "DIRECT_MESSAGE" // DIRECT_MESSAGE, SHIFT_NOTIFICATION, ALERT
)

// --- Generic API Response Envelope ---

data class ApiEnvelope<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: T? = null,
    @SerializedName("error") val error: ApiError? = null
)

data class ApiError(
    @SerializedName("message") val message: String,
    @SerializedName("code") val code: String? = null
)

// --- Stock Adjustment Models ---

data class StockAdjustmentResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("variantId") val variantId: String,
    @SerializedName("locationId") val locationId: String,
    @SerializedName("quantity") val quantity: Double,
    @SerializedName("reason") val reason: String,
    @SerializedName("status") val status: String, // PENDING, APPROVED, REJECTED, CANCELLED
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("variant") val variant: StockAdjustmentVariantDto? = null,
    @SerializedName("location") val location: StockAdjustmentLocationDto? = null,
    @SerializedName("member") val member: StockAdjustmentMemberDto? = null
)

data class StockAdjustmentVariantDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("sku") val sku: String,
    @SerializedName("product") val product: StockAdjustmentProductDto? = null
)

data class StockAdjustmentProductDto(
    @SerializedName("name") val name: String
)

data class StockAdjustmentLocationDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String
)

// --- Staff Shift & Roster Models ---

data class StaffBreakDto(
    @SerializedName("id") val id: String,
    @SerializedName("shiftId") val shiftId: String,
    @SerializedName("startTime") val startTime: String, // "HH:mm"
    @SerializedName("endTime") val endTime: String,     // "HH:mm"
    @SerializedName("description") val description: String? = null
)

data class ShiftUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("email") val email: String? = null
)

data class ShiftMemberDto(
    @SerializedName("id") val id: String,
    @SerializedName("role") val role: String? = null,
    @SerializedName("user") val user: ShiftUserDto? = null
)

data class StaffShiftDto(
    @SerializedName("id") val id: String,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("organizationId") val organizationId: String,
    @SerializedName("dayOfWeek") val dayOfWeek: Int, // 0 (Sunday) to 6 (Saturday)
    @SerializedName("startTime") val startTime: String, // "HH:mm"
    @SerializedName("endTime") val endTime: String,     // "HH:mm"
    @SerializedName("isActive") val isActive: Boolean = true,
    @SerializedName("breaks") val breaks: List<StaffBreakDto> = emptyList(),
    @SerializedName("member") val member: ShiftMemberDto? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class CreateShiftRequestDto(
    @SerializedName("dayOfWeek") val dayOfWeek: Int,
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String
)

data class CreateBreakRequestDto(
    @SerializedName("startTime") val startTime: String,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("description") val description: String? = null
)

// --- Device Authorization & Provisioning Models ---

data class DeviceProvisionResponseDto(
    @SerializedName("apiKey") val apiKey: String? = null,
    @SerializedName("deviceRegistryId") val deviceRegistryId: String? = null,
    @SerializedName("organization") val organization: LocationSummary? = null,
    @SerializedName("device") val device: DeviceSummaryDto? = null
)

data class DeviceSummaryDto(
    @SerializedName("deviceName") val deviceName: String? = null,
    @SerializedName("deviceType") val deviceType: String? = null,
    @SerializedName("locationId") val locationId: String? = null
)

// --- Petty Cash & Transactions ---

data class PettyCashTransactionDto(
    @SerializedName("id") val id: String,
    @SerializedName("fundId") val fundId: String,
    @SerializedName("type") val type: String, // TOP_UP, EXPENSE, ADJUSTMENT
    @SerializedName("amount") val amount: Double,
    @SerializedName("description") val description: String? = null,
    @SerializedName("memberId") val memberId: String,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("member") val member: MemberResponseSummary? = null
)

data class CustomerSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String? = null
)

data class TransactionDto(
    @SerializedName("id") val id: String,
    @SerializedName("amount") val amount: Double? = null,
    @SerializedName("finalTotal") val finalTotal: Double? = null,
    @SerializedName("subtotal") val subtotal: Double? = null,
    @SerializedName("currencyCode") val currencyCode: String? = "USD",
    @SerializedName("type") val type: String? = null,
    @SerializedName("locationId") val locationId: String? = null,
    @SerializedName("locationName") val locationName: String? = null,
    @SerializedName("memberId") val memberId: String? = null,
    @SerializedName("customer") val customer: CustomerSummaryDto? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("items") val items: List<TransactionItemDto>? = null
) {
    fun effectiveAmount(): Double {
        return finalTotal ?: amount ?: subtotal ?: 0.0
    }
}

fun formatCurrency(amount: Double, currencyCode: String? = "USD"): String {
    val code = currencyCode?.uppercase() ?: "USD"
    val symbol = when (code) {
        "USD" -> "$"
        "KES" -> "KSh "
        "EUR" -> "€"
        "GBP" -> "£"
        else -> "$code "
    }
    return String.format("%s%.2f", symbol, amount)
}

data class TransactionItemDto(
    @SerializedName("id") val id: String,
    @SerializedName("productName") val productName: String,
    @SerializedName("unitPrice") val unitPrice: Double,
    @SerializedName("quantity") val quantity: Double,
    @SerializedName("lineTotal") val lineTotal: Double
)

data class MemberSalesDto(
    val memberId: String,
    val memberName: String,
    val salesCount: Int,
    val totalAmount: Double
)

data class StockAdjustmentMemberDto(
    @SerializedName("user") val user: StockAdjustmentUserDto? = null
)

data class StockAdjustmentUserDto(
    @SerializedName("name") val name: String
)

data class StockAdjustmentRejectDto(
    @SerializedName("reason") val reason: String? = null
)

// --- Expense Models ---

data class ExpenseCategoryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("isActive") val isActive: Boolean = true
)

data class CreateExpenseRequestDto(
    @SerializedName("description") val description: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("categoryId") val categoryId: String,
    @SerializedName("paymentMethod") val paymentMethod: String, // e.g. CASH, MPESA, CARD
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("autoApprove") val autoApprove: Boolean = true
)

data class ExpenseDto(
    @SerializedName("id") val id: String,
    @SerializedName("expenseNumber") val expenseNumber: String,
    @SerializedName("description") val description: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("status") val status: String,
    @SerializedName("paymentMethod") val paymentMethod: String,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("category") val category: ExpenseCategorySummaryDto? = null
)

data class ExpenseCategorySummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String
)
