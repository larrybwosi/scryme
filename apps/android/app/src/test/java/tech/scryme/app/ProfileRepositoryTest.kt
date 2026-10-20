package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import tech.scryme.app.data.api.MemberApiService
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.repository.ProfileRepositoryImpl

class ProfileRepositoryTest {

    private val memberApiService = mockk<MemberApiService>()
    private lateinit var repository: ProfileRepositoryImpl

    @Before
    fun setUp() {
        repository = ProfileRepositoryImpl(memberApiService)
    }

    @Test
    fun getMemberProfile_success_returnsUserProfile() = runBlocking {
        val memberDto = MemberDto(
            id = "mem_1",
            organizationId = "org_1",
            userId = "usr_1",
            name = "Jane Developer",
            email = "jane@scryme.tech",
            phone = "+1234567890",
            role = "ADMIN",
            status = "ONLINE",
            isActive = true,
            avatarUrl = "https://avatar.url/jane.png"
        )

        coEvery {
            memberApiService.getMember("mem_1")
        } returns Response.success(V3ApiResponse(success = true, data = memberDto))

        val result = repository.getMemberProfile("scryme-hq", "mem_1")

        assertTrue(result.isSuccess)
        val profile = result.getOrNull()
        assertNotNull(profile)
        assertEquals("Jane Developer", profile?.name)
        assertEquals("jane@scryme.tech", profile?.email)
        assertEquals("ADMIN", profile?.role)
        assertEquals("ONLINE", profile?.status)
    }

    @Test
    fun updateMemberProfile_success_returnsUpdatedProfile() = runBlocking {
        val updatedMemberDto = MemberDto(
            id = "mem_1",
            organizationId = "org_1",
            userId = "usr_1",
            name = "Jane Doe",
            email = "janedoe@scryme.tech",
            phone = "+1987654321",
            role = "ADMIN",
            status = "ONLINE",
            isActive = true,
            avatarUrl = "https://avatar.url/new_jane.png"
        )

        coEvery {
            memberApiService.updateMember("mem_1", UpdateMemberDto("Jane Doe", "+1987654321", "janedoe@scryme.tech", "https://avatar.url/new_jane.png"))
        } returns Response.success(V3ApiResponse(success = true, data = updatedMemberDto))

        val result = repository.updateMemberProfile(
            orgSlug = "scryme-hq",
            memberId = "mem_1",
            name = "Jane Doe",
            email = "janedoe@scryme.tech",
            phone = "+1987654321",
            avatarUrl = "https://avatar.url/new_jane.png"
        )

        assertTrue(result.isSuccess)
        val profile = result.getOrNull()
        assertEquals("Jane Doe", profile?.name)
        assertEquals("janedoe@scryme.tech", profile?.email)
    }

    @Test
    fun updateMemberStatus_success_returnsUpdatedProfileWithStatus() = runBlocking {
        val updatedMemberDto = MemberDto(
            id = "mem_1",
            organizationId = "org_1",
            userId = "usr_1",
            name = "Jane Doe",
            email = "janedoe@scryme.tech",
            role = "ADMIN",
            status = "BUSY",
            isActive = true
        )

        coEvery {
            memberApiService.updateStatus("mem_1", UpdateMemberStatusDto("BUSY"))
        } returns Response.success(V3ApiResponse(success = true, data = updatedMemberDto))

        val result = repository.updateMemberStatus("scryme-hq", "mem_1", "BUSY")

        assertTrue(result.isSuccess)
        assertEquals("BUSY", result.getOrNull()?.status)
    }
}
