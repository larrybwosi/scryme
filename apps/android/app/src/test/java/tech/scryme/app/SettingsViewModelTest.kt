package tech.scryme.app

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.ui.settings.SettingsViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private val profileRepository = mockk<ProfileRepository>()
    private val authRepository = mockk<AuthRepository>()
    private val branchRepository = mockk<BranchRepository>()
    private lateinit var viewModel: SettingsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)

        every { sessionManager.themeModeFlow } returns flowOf("DARK")
        every { sessionManager.dutyStatusFlow } returns flowOf("ONLINE")
        every { sessionManager.notificationsEnabledFlow } returns flowOf(true)
        every { sessionManager.shiftNotificationsFlow } returns flowOf(true)
        every { sessionManager.taskNotificationsFlow } returns flowOf(true)
        every { sessionManager.userNameFlow } returns flowOf("John Doe")
        every { sessionManager.userEmailFlow } returns flowOf("john@scryme.tech")
        every { sessionManager.locationIdFlow } returns flowOf("loc-primary")
        every { sessionManager.orgSlugFlow } returns flowOf("test-org")
        every { sessionManager.orgNameFlow } returns flowOf("Test Organization")
        every { sessionManager.orgCurrencyFlow } returns flowOf("KES")
        every { sessionManager.orgCurrencySymbolFlow } returns flowOf("KSh")

        coEvery { sessionManager.getOrgSlug() } returns "test-org"
        coEvery { sessionManager.getLocationId() } returns "loc-primary"

        val sampleBranches = listOf(
            BranchLocation(
                id = "loc-primary",
                name = "Headquarters",
                code = "HQ",
                address = "123 Main St",
                phone = "123-456",
                locationType = "PHYSICAL",
                geofenceRadiusMeters = 50.0,
                isDefault = true,
                isActive = true
            ),
            BranchLocation(
                id = "loc-west",
                name = "West Branch",
                code = "WB",
                address = "456 West Ave",
                phone = "789-012",
                locationType = "PHYSICAL",
                geofenceRadiusMeters = 50.0,
                isDefault = false,
                isActive = true
            )
        )
        coEvery { branchRepository.getBranchLocations("test-org") } returns Result.success(sampleBranches)

        viewModel = SettingsViewModel(sessionManager, profileRepository, authRepository, branchRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun init_loadsBranchLocations() = runTest {
        val collectJob = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(2, state.locations.size)
        assertEquals("Headquarters", state.locations[0].name)
        assertEquals("West Branch", state.locations[1].name)
        collectJob.cancel()
    }

    @Test
    fun pairPosDevice_withManualCodeAndSelectedLocation_callsRepository() = runTest {
        val collectJob = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }

        coEvery {
            authRepository.pairPosDevice("MANUAL_CODE_99", "loc-west")
        } returns Result.success("POS Device paired successfully")

        viewModel.pairPosDevice("MANUAL_CODE_99", "loc-west")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals("POS Device paired successfully", state.posPairingMessage)
        assertFalse(state.isPairingPos)
        coVerify { authRepository.pairPosDevice("MANUAL_CODE_99", "loc-west") }
        collectJob.cancel()
    }
}
