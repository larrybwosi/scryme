package tech.scryme.app.data.api

import retrofit2.Response
import retrofit2.http.*
import tech.scryme.app.data.dto.*

interface MemberApiService {

    @GET("{orgSlug}/members")
    suspend fun getMembers(
        @Path("orgSlug") orgSlug: String,
        @Query("search") search: String? = null,
        @Query("role") role: String? = null
    ): Response<V3ApiResponse<List<MemberDto>>>

    @GET("{orgSlug}/members/{id}")
    suspend fun getMember(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String
    ): Response<V3ApiResponse<MemberDto>>

    @PATCH("{orgSlug}/members/{id}")
    suspend fun updateMember(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: UpdateMemberDto
    ): Response<V3ApiResponse<MemberDto>>

    @PATCH("{orgSlug}/members/{id}/status")
    suspend fun updateStatus(
        @Path("orgSlug") orgSlug: String,
        @Path("id") id: String,
        @Body dto: UpdateMemberStatusDto
    ): Response<V3ApiResponse<MemberDto>>
}
