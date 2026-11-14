package tech.scryme.app.data.repository

import tech.scryme.app.data.api.MemberApiService
import tech.scryme.app.data.dto.MemberDto
import tech.scryme.app.data.dto.StaffActivityDto
import tech.scryme.app.data.dto.StaffCheckinDto
import tech.scryme.app.data.dto.StaffOverviewDto
import tech.scryme.app.data.dto.StaffTaskDto
import tech.scryme.app.data.dto.SubtaskGroupDto
import tech.scryme.app.data.dto.SubtaskItemDto
import tech.scryme.app.data.dto.TaskAssessmentDto
import tech.scryme.app.data.dto.UpdateMemberDto
import tech.scryme.app.data.dto.UpdateMemberStatusDto
import tech.scryme.app.domain.model.StaffActivity
import tech.scryme.app.domain.model.StaffCheckin
import tech.scryme.app.domain.model.StaffOverview
import tech.scryme.app.domain.model.StaffTask
import tech.scryme.app.domain.model.SubtaskGroup
import tech.scryme.app.domain.model.SubtaskItem
import tech.scryme.app.domain.model.TaskAssessment
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

    override suspend fun getMemberOverview(orgSlug: String, memberId: String): Result<StaffOverview> {
        return try {
            val res = memberApiService.getMemberOverview(memberId)
            if (res.isSuccessful && res.body()?.success == true) {
                val data = res.body()?.data ?: return Result.failure(Exception("Empty overview response"))
                val overview = StaffOverview(
                    member = data.member.toDomain(),
                    tasks = data.tasks?.map { it.toDomain() } ?: emptyList(),
                    checkins = data.checkins?.map { it.toDomain() } ?: emptyList(),
                    activity = data.activity?.map { it.toDomain() } ?: emptyList()
                )
                Result.success(overview)
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

    private fun StaffTaskDto.toDomain() = StaffTask(
        id = id,
        title = title,
        description = description,
        status = status,
        priority = priority ?: "MEDIUM",
        category = category ?: "General",
        assignedMemberId = assignedMemberId,
        dueDate = dueDate,
        dueTime = dueTime,
        estimatedHours = estimatedHours,
        actualHours = actualHours,
        assessment = assessment?.toDomain(),
        subtaskGroups = subtaskGroups?.map { it.toDomain() } ?: emptyList()
    )

    private fun SubtaskGroupDto.toDomain() = SubtaskGroup(
        id = id,
        title = title,
        items = items.map { it.toDomain() }
    )

    private fun SubtaskItemDto.toDomain() = SubtaskItem(
        id = id,
        title = title,
        isCompleted = isCompleted ?: false
    )

    private fun TaskAssessmentDto.toDomain() = TaskAssessment(
        id = id,
        taskId = taskId,
        qualityScore = qualityScore,
        complexity = complexity,
        riskLevel = riskLevel,
        estimatedHours = estimatedHours,
        actualHours = actualHours,
        notes = notes,
        createdAt = createdAt
    )

    private fun StaffCheckinDto.toDomain() = StaffCheckin(
        id = id,
        checkInTime = checkInTime,
        checkOutTime = checkOutTime,
        durationMinutes = durationMinutes,
        shiftStatus = shiftStatus,
        verificationMethod = verificationMethod,
        isLocationVerified = isLocationVerified,
        locationName = locationName,
        branchCode = branchCode
    )

    private fun StaffActivityDto.toDomain() = StaffActivity(
        id = id,
        action = action,
        entityType = entityType,
        entityId = entityId,
        description = description,
        status = status,
        timestamp = timestamp
    )
}
