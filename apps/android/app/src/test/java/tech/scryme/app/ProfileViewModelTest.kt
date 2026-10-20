package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.dto.*
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.ui.profile.ProfileUiState
import tech.scryme.app.ui.profile.ProfileViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val profileRepository = mockk<ProfileRepository>()
    private val authRepository = mockk<AuthRepository>()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private lateinit var viewModel: ProfileViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)

        every { sessionManager.themeModeFlow } returns flowOf("DARK")
        every { sessionManager.notificationsEnabledFlow } returns flowOf(true)
        every { sessionManager.shiftNotificationsFlow } returns flowOf(true)
        every { sessionManager.taskNotificationsFlow } returns flowOf(true)
        every { sessionManager.dutyStatusFlow } returns flowOf("ONLINE")
        every { sessionManager.userNameFlow } returns flowOf("Test User")
        every { sessionManager.userEmailFlow } returns flowOf("user@scryme.tech")
        every { sessionManager.userAvatarUrlFlow } returns flowOf(null)

        viewModel = ProfileViewModel(profileRepository, authRepository, sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadProfile_success_updatesUiStateToSuccess() = runTest {
        val meData = AndroidMeResponseDto(
            user = UserDetailDto(id = "usr_1", email = "user@scryme.tech", name = "Test User"),
            member = MemberUserDto(id = "mem_1", role = "ADMIN"),
            activeOrganization = OrganizationDetailDto(id = "org_1", slug = "org-one", name = "Org One"),
            memberships = listOf(
                MembershipDto(organizationId = "org_1", name = "Org One", slug = "org-one", role = "ADMIN"),
                MembershipDto(organizationId = "org_2", name = "Org Two", slug = "org-two", role = "MEMBER")
            )
        )

        val fetchedProfile = UserProfile(
            id = "mem_1",
            organizationId = "org_1",
            userId = "usr_1",
            name = "Test User",
            email = "user@scryme.tech",
            phone = "+123456789",
            role = "ADMIN",
            status = "ONLINE",
            isActive = true,
            avatarUrl = null
        )

        coEvery { authRepository.validateSession() } returns Result.success(meData)
        coEvery { sessionManager.getOrgSlug() } returns "org-one"
        coEvery { sessionManager.getMemberId() } returns "mem_1"
        coEvery { profileRepository.getMemberProfile("org-one", "mem_1") } returns Result.success(fetchedProfile)
        coEvery { authRepository.listUserPasskeys() } returns Result.success(emptyList())

        viewModel.loadProfile()
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is ProfileUiState.Success)
        val state = viewModel.uiState.value as ProfileUiState.Success
        assertEquals("Test User", state.profile.name)
        assertEquals("Org One", state.activeOrganization?.name)
        assertEquals(2, state.memberships.size)
    }

    @Test
    fun switchOrganization_success_reloadsProfile() = runTest {
        val initialMeData = AndroidMeResponseDto(
            user = UserDetailDto(id = "usr_1", email = "user@scryme.tech", name = "Test User"),
            member = MemberUserDto(id = "mem_1", role = "ADMIN"),
            activeOrganization = OrganizationDetailDto(id = "org_1", slug = "org-one", name = "Org One"),
            memberships = listOf(
                MembershipDto(organizationId = "org_1", name = "Org One", slug = "org-one", role = "ADMIN"),
                MembershipDto(organizationId = "org_2", name = "Org Two", slug = "org-two", role = "MEMBER")
            )
        )

        val switchedMeData = AndroidMeResponseDto(
            user = UserDetailDto(id = "usr_1", email = "user@scryme.tech", name = "Test User"),
            member = MemberUserDto(id = "mem_2", role = "MEMBER"),
            activeOrganization = OrganizationDetailDto(id = "org_2", slug = "org-two", name = "Org Two"),
            memberships = listOf(
                MembershipDto(organizationId = "org_1", name = "Org One", slug = "org-one", role = "ADMIN"),
                MembershipDto(organizationId = "org_2", name = "Org Two", slug = "org-two", role = "MEMBER")
            )
        )

        val profile1 = UserProfile("mem_1", "org_1", "usr_1", "Test User", "user@scryme.tech", null, "ADMIN", "ONLINE", true, null)
        val profile2 = UserProfile("mem_2", "org_2", "usr_1", "Test User", "user@scryme.tech", null, "MEMBER", "ONLINE", true, null)

        coEvery { authRepository.validateSession() } returnsMany listOf(Result.success(initialMeData), Result.success(switchedMeData))
        coEvery { sessionManager.getOrgSlug() } returnsMany listOf("org-one", "org-two")
        coEvery { sessionManager.getMemberId() } returnsMany listOf("mem_1", "mem_2")
        coEvery { profileRepository.getMemberProfile("org-one", "mem_1") } returns Result.success(profile1)
        coEvery { profileRepository.getMemberProfile("org-two", "mem_2") } returns Result.success(profile2)
        coEvery { authRepository.listUserPasskeys() } returns Result.success(emptyList())
        coEvery { authRepository.switchOrganization("org_2") } returns Result.success(switchedMeData)

        viewModel.loadProfile()
        testScheduler.advanceUntilIdle()

        viewModel.switchOrganization("org_2")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is ProfileUiState.Success)
        val state = viewModel.uiState.value as ProfileUiState.Success
        assertEquals("Org Two", state.activeOrganization?.name)
        assertEquals("org-two", state.activeOrganization?.slug)
    }

    @Test
    fun updateProfile_success_updatesLocalProfileAndState() = runTest {
        val meData = AndroidMeResponseDto(
            user = UserDetailDto(id = "usr_1", email = "user@scryme.tech", name = "Test User"),
            member = MemberUserDto(id = "mem_1", role = "ADMIN"),
            activeOrganization = OrganizationDetailDto(id = "org_1", slug = "org-one", name = "Org One")
        )
        val initialProfile = UserProfile("mem_1", "org_1", "usr_1", "Test User", "user@scryme.tech", null, "ADMIN", "ONLINE", true, null)
        val updatedProfile = UserProfile("mem_1", "org_1", "usr_1", "Updated User Name", "updated@scryme.tech", "+123456", "ADMIN", "ONLINE", true, null)

        coEvery { authRepository.validateSession() } returns Result.success(meData)
        coEvery { sessionManager.getOrgSlug() } returns "org-one"
        coEvery { sessionManager.getMemberId() } returns "mem_1"
        coEvery { profileRepository.getMemberProfile("org-one", "mem_1") } returns Result.success(initialProfile)
        coEvery { authRepository.listUserPasskeys() } returns Result.success(emptyList())

        viewModel.loadProfile()
        testScheduler.advanceUntilIdle()

        coEvery {
            profileRepository.updateMemberProfile("org-one", "mem_1", "Updated User Name", "+123456", "updated@scryme.tech", null)
        } returns Result.success(updatedProfile)

        viewModel.updateProfile(name = "Updated User Name", email = "updated@scryme.tech", phone = "+123456")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is ProfileUiState.Success)
        val state = viewModel.uiState.value as ProfileUiState.Success
        assertEquals("Updated User Name", state.profile.name)
        assertEquals("updated@scryme.tech", state.profile.email)
        coVerify { sessionManager.updateUserProfile("Updated User Name", "updated@scryme.tech", null) }
    }

    @Test
    fun updateDutyStatus_success_updatesDutyStatus() = runTest {
        val meData = AndroidMeResponseDto(
            user = UserDetailDto(id = "usr_1", email = "user@scryme.tech", name = "Test User"),
            member = MemberUserDto(id = "mem_1", role = "ADMIN"),
            activeOrganization = OrganizationDetailDto(id = "org_1", slug = "org-one", name = "Org One")
        )
        val initialProfile = UserProfile("mem_1", "org_1", "usr_1", "Test User", "user@scryme.tech", null, "ADMIN", "ONLINE", true, null)
        val busyProfile = UserProfile("mem_1", "org_1", "usr_1", "Test User", "user@scryme.tech", null, "ADMIN", "BUSY", true, null)

        coEvery { authRepository.validateSession() } returns Result.success(meData)
        coEvery { sessionManager.getOrgSlug() } returns "org-one"
        coEvery { sessionManager.getMemberId() } returns "mem_1"
        coEvery { profileRepository.getMemberProfile("org-one", "mem_1") } returns Result.success(initialProfile)
        coEvery { authRepository.listUserPasskeys() } returns Result.success(emptyList())

        viewModel.loadProfile()
        testScheduler.advanceUntilIdle()

        coEvery { profileRepository.updateMemberStatus("org-one", "mem_1", "BUSY") } returns Result.success(busyProfile)

        viewModel.updateDutyStatus("BUSY")
        testScheduler.advanceUntilIdle()

        coVerify { sessionManager.updateDutyStatus("BUSY") }
    }
}
