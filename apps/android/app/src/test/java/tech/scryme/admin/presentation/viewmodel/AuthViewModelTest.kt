package tech.scryme.admin.presentation.viewmodel

import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import tech.scryme.admin.data.model.*
import tech.scryme.admin.domain.repository.AuthRepository
import tech.scryme.admin.domain.session.SessionManager

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val repository = mockk<AuthRepository>()
    private val sessionManager = mockk<SessionManager>(relaxed = true)
    private val testDispatcher = StandardTestDispatcher()

    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { sessionManager.token } returns MutableStateFlow("token")
        viewModel = AuthViewModel(repository, sessionManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `login success transitions state to Success`() = runTest(testDispatcher) {
        val email = "admin@scryme.tech"
        val password = "password"
        val mockResponse = BetterAuthSessionResponse(
            user = SessionUser("id", email, "Admin Name", "ADMIN", "org_id_123"),
            session = SessionDto("sess_id", "id", "token_xyz", "", "org_id_123")
        )

        coEvery { repository.signInWithEmail(email, password) } coAnswers {
            delay(100)
            Result.success(mockResponse)
        }

        viewModel.login(email, password)

        // Run until Loading state is set (first suspension point)
        runCurrent()
        assertEquals(UiState.Loading, viewModel.loginState.value)

        // Fast forward delay
        advanceTimeBy(150)

        assertTrue(viewModel.loginState.value is UiState.Success)
        assertEquals(mockResponse, (viewModel.loginState.value as UiState.Success).data)
    }

    @Test
    fun `login failure transitions state to Error`() = runTest(testDispatcher) {
        val email = "admin@scryme.tech"
        val password = "wrong_password"

        coEvery { repository.signInWithEmail(email, password) } coAnswers {
            delay(100)
            Result.failure(Exception("Unauthorized"))
        }

        viewModel.login(email, password)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.loginState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.loginState.value is UiState.Error)
        assertEquals("Unauthorized", (viewModel.loginState.value as UiState.Error).message)
    }

    @Test
    fun `login with Google success transitions state to Success`() = runTest(testDispatcher) {
        val idToken = "google_token_123"
        val mockResponse = BetterAuthSessionResponse(
            user = SessionUser("id", "google_user@scryme.tech", "Google Name", "MEMBER", "org_id_456"),
            session = SessionDto("sess_id", "id", "token_google_xyz", "", "org_id_456")
        )

        coEvery { repository.signInWithGoogle(idToken) } coAnswers {
            delay(100)
            Result.success(mockResponse)
        }

        viewModel.loginWithGoogle(idToken)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.loginState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.loginState.value is UiState.Success)
        assertEquals(mockResponse, (viewModel.loginState.value as UiState.Success).data)
    }

    @Test
    fun `login with Google failure transitions state to Error`() = runTest(testDispatcher) {
        val idToken = "invalid_google_token"

        coEvery { repository.signInWithGoogle(idToken) } coAnswers {
            delay(100)
            Result.failure(Exception("Google Token Invalid"))
        }

        viewModel.loginWithGoogle(idToken)

        runCurrent()
        assertEquals(UiState.Loading, viewModel.loginState.value)

        advanceTimeBy(150)

        assertTrue(viewModel.loginState.value is UiState.Error)
        assertEquals("Google Token Invalid", (viewModel.loginState.value as UiState.Error).message)
    }
}
