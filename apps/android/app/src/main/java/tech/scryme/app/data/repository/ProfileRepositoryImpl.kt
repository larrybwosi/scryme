package tech.scryme.app.data.repository

import tech.scryme.app.data.api.MemberApiService
import tech.scryme.app.data.dto.MemberDto
import tech.scryme.app.data.dto.UpdateMemberDto
import tech.scryme.app.data.dto.UpdateMemberStatusDto
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.ProfileRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    private val memberApiService: MemberApiService
) : ProfileRepository {

    override suspend fun getMembers(
        orgSlug: String,
        search: String?,
        role: String?
    ): Result<List<UserProfile>> {
        return try {
            val res = memberApiService.getMembers(search, role)
            if (res.isSuccessful && res.body()?.success == true) {
                val list = res.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(list)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getMemberProfile(orgSlug: String, memberId: String): Result<UserProfile> {
        return try {
            val res = memberApiService.getMember(memberId)
            if (res.isSuccessful && res.body()?.success == true) {
                val profile = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null profile response"))
                Result.success(profile)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateMemberProfile(
        orgSlug: String,
        memberId: String,
        name: String?,
        phone: String?,
        email: String?,
        avatarUrl: String?
    ): Result<UserProfile> {
        return try {
            val dto = UpdateMemberDto(name, phone, email, avatarUrl)
            val res = memberApiService.updateMember(memberId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val profile = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null profile response"))
                Result.success(profile)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateMemberStatus(
        orgSlug: String,
        memberId: String,
        status: String
    ): Result<UserProfile> {
        return try {
            val dto = UpdateMemberStatusDto(status)
            val res = memberApiService.updateStatus(memberId, dto)
            if (res.isSuccessful && res.body()?.success == true) {
                val profile = res.body()?.data?.toDomain() ?: return Result.failure(Exception("Null profile response"))
                Result.success(profile)
            } else {
                Result.failure(Exception(res.body()?.error?.message ?: res.message()))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun MemberDto.toDomain() = UserProfile(
        id = id,
        organizationId = organizationId,
        userId = userId,
        name = name,
        email = email,
        phone = phone,
        role = role,
        status = status ?: "ONLINE",
        isActive = isActive,
        avatarUrl = avatarUrl
    )
}
