package tech.scryme.admin.data.model

import com.google.gson.annotations.SerializedName

// --- Authentication & Session Models ---

data class UserSummaryDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String,
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
    @SerializedName("name") val name: String,
    @SerializedName("role") val role: String? = null,
    @SerializedName("activeOrganizationId") val activeOrganizationId: String? = null
)

data class SessionDto(
    @SerializedName("id") val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("token") val token: String,
    @SerializedName("expiresAt") val expiresAt: String,
    @SerializedName("activeOrganizationId") val activeOrganizationId: String? = null
)

data class BetterAuthSessionResponse(
    @SerializedName("user") val user: SessionUser,
    @SerializedName("session") val session: SessionDto
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
    @SerializedName("organizationId") val organizationId: String
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

// --- Approvals & Catalog Models ---

data class PriceChangeRequestDto(
    @SerializedName("id") val id: String,
    @SerializedName("variantId") val variantId: String,
    @SerializedName("requestedBy") val requestedBy: String,
    @SerializedName("oldPrice") val oldPrice: Double,
    @SerializedName("newPrice") val newPrice: Double,
    @SerializedName("status") val status: String, // PENDING, APPROVED, REJECTED
    @SerializedName("rejectionReason") val rejectionReason: String? = null,
    @SerializedName("createdAt") val createdAt: String
)

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

// --- Broadcast Announcements ---

data class AnnouncementDto(
    @SerializedName("title") val title: String,
    @SerializedName("message") val message: String,
    @SerializedName("targetBranchId") val targetBranchId: String? = null, // null for all
    @SerializedName("severity") val severity: String = "INFO" // INFO, WARNING, URGENT
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
