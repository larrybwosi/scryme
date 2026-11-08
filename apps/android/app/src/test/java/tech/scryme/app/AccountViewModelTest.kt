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
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.MemberUserDto
import tech.scryme.app.data.dto.OrganizationDetailDto
import tech.scryme.app.data.dto.PasskeyItemDto
import tech.scryme.app.data.dto.UserDetailDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.ui.account.AccountUiState
import tech.scryme.app.ui.account.AccountViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class AccountViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val profileRepository = mockk<ProfileRepository>()
    private val authRepository = mockk<AuthRepository>()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private lateinit var viewModel: AccountViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)

        every { sessionManager.userNameFlow } returns flowOf("John Scryme")
        every { sessionManager.userEmailFlow } returns flowOf("john@scryme.tech")
        every { sessionManager.userAvatarUrlFlow } returns flowOf("https://example.com/avatar.png")
        every { sessionManager.dutyStatusFlow } returns flowOf("ONLINE")

        coEvery { sessionManager.getOrgSlug() } returns "scryme-corp"
        coEvery { sessionManager.getMemberId() } returns "mem-123"

        val sampleProfile = UserProfile(
            id = "mem-123",
            organizationId = "scryme-corp",
            userId = "usr-456",
            name = "John Scryme",
            email = "john@scryme.tech",
            phone = "+254700000000",
            role = "ADMIN",
            status = "ONLINE",
            isActive = true,
            avatarUrl = "https://example.com/avatar.png"
        )
        coEvery { profileRepository.getMemberProfile("scryme-corp", "mem-123") } returns Result.success(sampleProfile)
        coEvery { authRepository.listUserPasskeys() } returns Result.success(
            listOf(PasskeyItemDto(id = "pk-1", name = "Pixel 8", createdAt = "2026-01-01"))
        )

        viewModel = AccountViewModel(profileRepository, authRepository, sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadAccountData_success_populatesProfileAndPasskeys() = runTest {
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is AccountUiState.Success)
        val success = state as AccountUiState.Success
        assertEquals("John Scryme", success.profile.name)
        assertEquals("john@scryme.tech", success.profile.email)
        assertEquals(1, success.passkeys.size)
        assertEquals("Pixel 8", success.passkeys[0].name)
    }

    @Test
    fun updateProfileInfo_success_updatesStateAndSession() = runTest {
        testScheduler.advanceUntilIdle()

        val updated = UserProfile(
            id = "mem-123",
            organizationId = "scryme-corp",
            userId = "usr-456",
            name = "Johnny Updated",
            email = "johnny@scryme.tech",
            phone = "+254711111111",
            role = "ADMIN",
            status = "ONLINE",
            isActive = true,
            avatarUrl = "https://example.com/avatar.png"
        )
        coEvery {
            profileRepository.updateMemberProfile(
                orgSlug = "scryme-corp",
                memberId = "mem-123",
                name = "Johnny Updated",
                email = "johnny@scryme.tech",
                phone = "+254711111111",
                avatarUrl = "https://example.com/avatar.png"
            )
        } returns Result.success(updated)

        viewModel.updateProfileInfo("Johnny Updated", "johnny@scryme.tech", "+254711111111")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as AccountUiState.Success
        assertEquals("Johnny Updated", state.profile.name)
        assertEquals("johnny@scryme.tech", state.profile.email)
        assertFalse(state.isEditing)
        assertEquals("Account details updated successfully!", state.actionSuccessMessage)
        coVerify { sessionManager.updateUserProfile("Johnny Updated", "johnny@scryme.tech", "https://example.com/avatar.png") }
    }

    @Test
    fun updateDutyStatus_updatesSessionAndRepository() = runTest {
        testScheduler.advanceUntilIdle()

        val busyProfile = UserProfile(
            id = "mem-123",
            organizationId = "scryme-corp",
            userId = "usr-456",
            name = "John Scryme",
            email = "john@scryme.tech",
            phone = "+254700000000",
            role = "ADMIN",
            status = "BUSY",
            isActive = true,
            avatarUrl = "https://example.com/avatar.png"
        )
        coEvery { profileRepository.updateMemberStatus("scryme-corp", "mem-123", "BUSY") } returns Result.success(busyProfile)

        viewModel.updateDutyStatus("BUSY")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as AccountUiState.Success
        assertEquals("BUSY", state.profile.status)
        coVerify { sessionManager.updateDutyStatus("BUSY") }
    }

    @Test
    fun deletePasskey_success_refreshesPasskeyList() = runTest {
        testScheduler.advanceUntilIdle()

        coEvery { authRepository.deletePasskey("pk-1") } returns Result.success(Unit)
        coEvery { authRepository.listUserPasskeys() } returns Result.success(emptyList())

        viewModel.deletePasskey("pk-1")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value as AccountUiState.Success
        assertTrue(state.passkeys.isEmpty())
        assertEquals("Passkey removed", state.actionSuccessMessage)
    }
}
