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
import tech.scryme.app.analytics.OpenPanelTracker
import tech.scryme.app.data.dto.AndroidMeResponseDto
import tech.scryme.app.data.dto.MemberUserDto
import tech.scryme.app.data.dto.MembershipDto
import tech.scryme.app.data.dto.OrganizationDetailDto
import tech.scryme.app.data.dto.UserDetailDto
import tech.scryme.app.data.interceptor.SessionManager
import tech.scryme.app.domain.model.BranchLocation
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.ui.organization.OrganizationViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class OrganizationViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private val authRepository = mockk<AuthRepository>()
    private val branchRepository = mockk<BranchRepository>()
    private val openPanelTracker = mockk<OpenPanelTracker>(relaxed = true)
    private lateinit var viewModel: OrganizationViewModel

    private val sampleBranches = listOf(
        BranchLocation(
            id = "loc-hq",
            name = "Headquarters",
            code = "HQ",
            address = "Nairobi CBD",
            phone = "+254700000",
            locationType = "PHYSICAL",
            geofenceRadiusMeters = 100.0,
            isDefault = true,
            isActive = true
        ),
        BranchLocation(
            id = "loc-west",
            name = "Westlands Hub",
            code = "WEST",
            address = "Westlands",
            phone = "+254711111",
            locationType = "PHYSICAL",
            geofenceRadiusMeters = 80.0,
            isDefault = false,
            isActive = true
        )
    )

    private val sampleMe = AndroidMeResponseDto(
        user = UserDetailDto(id = "usr-1", email = "test@scryme.tech", name = "Test User"),
        member = MemberUserDto(id = "mem-1", role = "ADMIN"),
        activeOrganization = OrganizationDetailDto(
            id = "org-1",
            slug = "scryme-retail",
            name = "Scryme Retail Ltd",
            currency = "KES",
            currencySymbol = "KSh"
        ),
        memberships = listOf(
            MembershipDto(organizationId = "org-1", name = "Scryme Retail Ltd", slug = "scryme-retail", role = "ADMIN"),
            MembershipDto(organizationId = "org-2", name = "Scryme Logistics", slug = "scryme-logistics", role = "MANAGER")
        )
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)

        every { sessionManager.orgSlugFlow } returns flowOf("scryme-retail")
        every { sessionManager.orgNameFlow } returns flowOf("Scryme Retail Ltd")
        every { sessionManager.orgLogoFlow } returns flowOf("https://example.com/logo.png")
        every { sessionManager.orgCurrencyFlow } returns flowOf("KES")
        every { sessionManager.orgCurrencySymbolFlow } returns flowOf("KSh")
        every { sessionManager.locationIdFlow } returns flowOf("loc-hq")

        coEvery { sessionManager.getOrgSlug() } returns "scryme-retail"
        coEvery { sessionManager.getLocationId() } returns "loc-hq"
        coEvery { authRepository.validateSession() } returns Result.success(sampleMe)
        coEvery { branchRepository.getBranchLocations("scryme-retail") } returns Result.success(sampleBranches)

        viewModel = OrganizationViewModel(sessionManager, authRepository, branchRepository, openPanelTracker)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadOrganizationData_success_populatesLocationsAndMemberships() = runTest {
        val collectJob = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals("Scryme Retail Ltd", state.orgName)
        assertEquals("scryme-retail", state.orgSlug)
        assertEquals("KES", state.orgCurrency)
        assertEquals("KSh", state.orgCurrencySymbol)
        assertEquals(2, state.locations.size)
        assertEquals(2, state.memberships.size)
        collectJob.cancel()
    }

    @Test
    fun switchOrganization_callsAuthRepositoryAndReloads() = runTest {
        val collectJob = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }

        val switchedMe = sampleMe.copy(
            activeOrganization = OrganizationDetailDto(
                id = "org-2",
                slug = "scryme-logistics",
                name = "Scryme Logistics"
            )
        )
        coEvery { authRepository.switchOrganization("org-2") } returns Result.success(switchedMe)
        coEvery { branchRepository.getBranchLocations("scryme-logistics") } returns Result.success(emptyList())

        viewModel.switchOrganization("org-2")
        testScheduler.advanceUntilIdle()

        coVerify { authRepository.switchOrganization("org-2") }
        val state = viewModel.uiState.value
        assertFalse(state.isSwitchingOrg)
        assertEquals("Switched to Scryme Logistics", state.actionSuccessMessage)
        collectJob.cancel()
    }

    @Test
    fun pairPosDevice_callsAuthRepository() = runTest {
        val collectJob = backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }

        coEvery { authRepository.pairPosDevice("TERMINAL_QR_99", "loc-west") } returns Result.success("Paired with Terminal 99")

        viewModel.pairPosDevice("TERMINAL_QR_99", "loc-west")
        testScheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals("Paired with Terminal 99", state.posPairingMessage)
        assertEquals("POS Terminal paired successfully!", state.actionSuccessMessage)
        coVerify { authRepository.pairPosDevice("TERMINAL_QR_99", "loc-west") }
        collectJob.cancel()
    }
}
