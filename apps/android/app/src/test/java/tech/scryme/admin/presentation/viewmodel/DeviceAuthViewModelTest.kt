package tech.scryme.admin.presentation.viewmodel

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.DeviceProvisionResponseDto
import tech.scryme.admin.data.model.DeviceSummaryDto
import tech.scryme.admin.domain.repository.DeviceRepository

@OptIn(ExperimentalCoroutinesApi::class)
class DeviceAuthViewModelTest {

    private val repository = mockk<DeviceRepository>()
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var viewModel: DeviceAuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = DeviceAuthViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `parseSetupToken and parsePairingSessionId handle payloads correctly`() {
        val rawToken = "setup_token_abc_123"
        assertEquals(rawToken, viewModel.parseSetupToken(rawToken))

        val jsonPosProvision = """{"type":"POS_PROVISION","token":"setup_token_xyz_456"}"""
        assertEquals("setup_token_xyz_456", viewModel.parseSetupToken(jsonPosProvision))

        val jsonSetupTokenKey = """{"setupToken":"setup_token_789"}"""
        assertEquals("setup_token_789", viewModel.parseSetupToken(jsonSetupTokenKey))

        val jsonPairingSession = """{"type":"POS_PAIRING","sessionId":"pair_session_999"}"""
        assertEquals("pair_session_999", viewModel.parsePairingSessionId(jsonPairingSession))

        val rawPairingId = "pair_session_888"
        assertEquals("pair_session_888", viewModel.parsePairingSessionId(rawPairingId))
    }

    @Test
    fun `onQrCodeScanned with POS_PAIRING JSON triggers session authorization successfully`() = runTest(testDispatcher) {
        val qrContent = """{"type":"POS_PAIRING","sessionId":"pair_session_123"}"""
        val mockResponse = DeviceProvisionResponseDto(
            apiKey = "dealio_pk_live_key_pairing",
            deviceRegistryId = "dev_pair_123",
            device = DeviceSummaryDto(
                deviceName = "POS Terminal 1",
                deviceType = "MAIN_HUB",
                locationId = "loc_hq"
            )
        )

        coEvery { repository.authorizePairingSession("pair_session_123", "loc_branch_1") } coAnswers {
            delay(100)
            Result.success(mockResponse)
        }

        viewModel.onQrCodeScanned(qrContent, "loc_branch_1")

        runCurrent()
        assertEquals(UiState.Loading, viewModel.uiState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.uiState.value is UiState.Success)
        assertEquals(mockResponse, (viewModel.uiState.value as UiState.Success).data)
    }

    @Test
    fun `authorizeDevice success transitions state to Success`() = runTest(testDispatcher) {
        val token = "setup_token_valid"
        val mockResponse = DeviceProvisionResponseDto(
            apiKey = "dealio_pk_live_key",
            deviceRegistryId = "dev_123",
            device = DeviceSummaryDto(
                deviceName = "Front Desk Terminal",
                deviceType = "POS_TERMINAL",
                locationId = "loc_hq"
            )
        )

        coEvery { repository.provisionDevice(token) } coAnswers {
            delay(100)
            Result.success(mockResponse)
        }

        viewModel.authorizeDevice(token)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.uiState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.uiState.value is UiState.Success)
        assertEquals(mockResponse, (viewModel.uiState.value as UiState.Success).data)
    }

    @Test
    fun `authorizeDevice failure transitions state to Error`() = runTest(testDispatcher) {
        val token = "setup_token_invalid"

        coEvery { repository.provisionDevice(token) } coAnswers {
            delay(100)
            Result.failure(Exception("Setup token has expired"))
        }

        viewModel.authorizeDevice(token)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.uiState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.uiState.value is UiState.Error)
        assertEquals("Setup token has expired", (viewModel.uiState.value as UiState.Error).message)
    }

    @Test
    fun `onQrCodeScanned with valid JSON triggers authorization successfully`() = runTest(testDispatcher) {
        val qrContent = """{"type":"POS_PROVISION","token":"setup_token_from_qr"}"""
        val mockResponse = DeviceProvisionResponseDto(
            apiKey = "dealio_pk_live_key_qr",
            deviceRegistryId = "dev_qr_123",
            device = DeviceSummaryDto(
                deviceName = "KDS Kitchen 1",
                deviceType = "KDS",
                locationId = "loc_kitchen"
            )
        )

        coEvery { repository.provisionDevice("setup_token_from_qr") } coAnswers {
            delay(100)
            Result.success(mockResponse)
        }

        viewModel.onQrCodeScanned(qrContent)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.uiState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.uiState.value is UiState.Success)
        assertEquals(mockResponse, (viewModel.uiState.value as UiState.Success).data)
    }

    @Test
    fun `onQrCodeScanned with blank token sets Error state`() = runTest(testDispatcher) {
        viewModel.onQrCodeScanned("   ")
        assertTrue(viewModel.uiState.value is UiState.Error)
        assertEquals("Invalid QR Code payload. Could not extract setup token.", (viewModel.uiState.value as UiState.Error).message)
    }

    @Test
    fun `resetState resets uiState back to Idle`() = runTest(testDispatcher) {
        viewModel.onQrCodeScanned("   ")
        assertTrue(viewModel.uiState.value is UiState.Error)

        viewModel.resetState()
        assertEquals(UiState.Idle, viewModel.uiState.value)
    }
}
