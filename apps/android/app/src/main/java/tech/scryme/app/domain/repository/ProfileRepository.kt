package tech.scryme.app.domain.repository

import tech.scryme.app.domain.model.UserProfile

interface ProfileRepository {
    suspend fun getMembers(orgSlug: String, search: String? = null, role: String? = null): Result<List<UserProfile>>
    suspend fun getMemberProfile(orgSlug: String, memberId: String): Result<UserProfile>
    suspend fun updateMemberProfile(orgSlug: String, memberId: String, name: String? = null, phone: String? = null, email: String? = null, avatarUrl: String? = null): Result<UserProfile>
    suspend fun updateMemberStatus(orgSlug: String, memberId: String, status: String): Result<UserProfile>
}
