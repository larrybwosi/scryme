package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.app.data.dto.*

interface ScheduleApiService {

    @GET("v3/android/shifts/me")
    suspend fun getCurrentMemberShifts(): Response<V3ApiResponse<List<StaffShiftDto>>>

    @GET("v3/android/shifts")
    suspend fun getOrganizationShifts(
        @Query("memberId") memberId: String? = null,
        @Query("locationId") locationId: String? = null
    ): Response<V3ApiResponse<List<StaffShiftDto>>>

    @POST("v3/android/shifts/staff/{memberId}/shifts")
    suspend fun createStaffShift(
        @Path("memberId") memberId: String,
        @Body dto: CreateShiftDto
    ): Response<V3ApiResponse<StaffShiftDto>>

    @POST("v3/android/shifts/{shiftId}/breaks")
    suspend fun addShiftBreak(
        @Path("shiftId") shiftId: String,
        @Body dto: ShiftBreakDto
    ): Response<V3ApiResponse<StaffShiftDto>>

    @GET("v3/android/shifts/trades")
    suspend fun getShiftTrades(
        @Query("memberId") memberId: String? = null,
        @Query("status") status: String? = null
    ): Response<V3ApiResponse<List<ShiftTradeDto>>>

    @POST("v3/android/shifts/trades")
    suspend fun requestShiftTrade(
        @Body dto: RequestShiftTradeDto
    ): Response<V3ApiResponse<ShiftTradeDto>>

    @POST("v3/android/shifts/trades/{id}/process")
    suspend fun processShiftTrade(
        @Path("id") id: String,
        @Body dto: ProcessShiftTradeDto
    ): Response<V3ApiResponse<ShiftTradeDto>>

    @GET("v3/android/shifts/tasks")
    suspend fun getStaffTasks(
        @Query("memberId") memberId: String? = null,
        @Query("status") status: String? = null
    ): Response<V3ApiResponse<List<StaffTaskDto>>>

    @POST("v3/android/shifts/tasks")
    suspend fun createStaffTask(
        @Body dto: CreateStaffTaskDto
    ): Response<V3ApiResponse<StaffTaskDto>>

    @PATCH("v3/android/shifts/tasks/{id}")
    suspend fun updateStaffTask(
        @Path("id") id: String,
        @Body dto: UpdateStaffTaskDto
    ): Response<V3ApiResponse<StaffTaskDto>>
}
