package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.app.data.dto.*

interface ScheduleApiService {

    @GET("{orgSlug}/services/shifts/me")
    suspend fun getCurrentMemberShifts(
        @Path("orgSlug") orgSlug: String
    ): Response<V3ApiResponse<List<StaffShiftDto>>>

    @GET("{orgSlug}/services/shifts")
    suspend fun getOrganizationShifts(
        @Path("orgSlug") orgSlug: String,
        @Query("memberId") memberId: String? = null,
        @Query("locationId") locationId: String? = null
    ): Response<V3ApiResponse<List<StaffShiftDto>>>

    @POST("{orgSlug}/services/staff/{memberId}/shifts")
    suspend fun createStaffShift(
        @Path("orgSlug") orgSlug: String,
        @Path("memberId") memberId: String,
        @Body dto: CreateShiftDto
    ): Response<V3ApiResponse<StaffShiftDto>>

    @POST("{orgSlug}/services/shifts/{shiftId}/breaks")
    suspend fun addShiftBreak(
        @Path("orgSlug") orgSlug: String,
        @Path("shiftId") shiftId: String,
        @Body dto: ShiftBreakDto
    ): Response<V3ApiResponse<StaffShiftDto>>

    @GET("{orgSlug}/services/shifts/trades")
    suspend fun getShiftTrades(
        @Path("orgSlug") orgSlug: String,
        @Query("memberId") memberId: String? = null,
        @Query("status") status: String? = null
    ): Response<V3ApiResponse<List<ShiftTradeDto>>>

    @POST("{orgSlug}/services/shifts/trades")
    suspend fun requestShiftTrade(
        @Path("orgSlug") orgSlug: String,
        @Body dto: RequestShiftTradeDto
    ): Response<V3ApiResponse<ShiftTradeDto>>

    @POST("{orgSlug}/services/shifts/trades/{id}/process")
    suspend fun processShiftTrade(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: ProcessShiftTradeDto
    ): Response<V3ApiResponse<ShiftTradeDto>>

    @GET("{orgSlug}/services/tasks")
    suspend fun getStaffTasks(
        @Path("orgSlug") orgSlug: String,
        @Query("memberId") memberId: String? = null,
        @Query("status") status: String? = null
    ): Response<V3ApiResponse<List<StaffTaskDto>>>

    @POST("{orgSlug}/services/tasks")
    suspend fun createStaffTask(
        @Path("orgSlug") orgSlug: String,
        @Body dto: CreateStaffTaskDto
    ): Response<V3ApiResponse<StaffTaskDto>>

    @PATCH("{orgSlug}/services/tasks/{id}")
    suspend fun updateStaffTask(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: UpdateStaffTaskDto
    ): Response<V3ApiResponse<StaffTaskDto>>
}
