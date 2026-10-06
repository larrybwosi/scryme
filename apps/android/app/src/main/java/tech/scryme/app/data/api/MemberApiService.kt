package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.app.data.dto.*

interface MemberApiService {

    @GET("v3/android/members")
    suspend fun getMembers(
        @Query("search") search: String? = null,
        @Query("role") role: String? = null
    ): Response<V3ApiResponse<List<MemberDto>>>

    @GET("v3/android/members/{id}")
    suspend fun getMember(
        @Path("id") id: String
    ): Response<V3ApiResponse<MemberDto>>

    @PATCH("v3/android/members/{id}")
    suspend fun updateMember(
        @Path("id") id: String,
        @Body dto: UpdateMemberDto
    ): Response<V3ApiResponse<MemberDto>>

    @PATCH("v3/android/members/{id}/status")
    suspend fun updateStatus(
        @Path("id") id: String,
        @Body dto: UpdateMemberStatusDto
    ): Response<V3ApiResponse<MemberDto>>
}
