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
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.ui.auth.AuthUiState
import tech.scryme.app.ui.auth.AuthViewModel

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val authRepository = mockk<AuthRepository>()
    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { authRepository.isLoggedIn() } returns flowOf(false)
        viewModel = AuthViewModel(authRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loginWithEmail_blankEmail_setsErrorState() = runTest {
        viewModel.loginWithEmail("", "password123")
        assertTrue(viewModel.uiState.value is AuthUiState.Error)
        assertEquals("Email is required", (viewModel.uiState.value as AuthUiState.Error).message)
    }

    @Test
    fun loginWithEmail_success_setsSuccessState() = runTest {
        coEvery { authRepository.loginWithEmail("user@scryme.tech", "password123") } returns Result.success(Unit)

        viewModel.loginWithEmail("user@scryme.tech", "password123")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is AuthUiState.Success)
    }

    @Test
    fun loginWithEmail_failure_setsErrorState() = runTest {
        coEvery { authRepository.loginWithEmail("user@scryme.tech", "wrongpass") } returns Result.failure(Exception("Invalid credentials"))

        viewModel.loginWithEmail("user@scryme.tech", "wrongpass")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is AuthUiState.Error)
        assertEquals("Invalid credentials", (viewModel.uiState.value as AuthUiState.Error).message)
    }

    @Test
    fun signUp_blankFullName_setsErrorState() = runTest {
        viewModel.signUp("", "user@scryme.tech", "pass123", true)
        assertTrue(viewModel.uiState.value is AuthUiState.Error)
        assertEquals("Full Name is required", (viewModel.uiState.value as AuthUiState.Error).message)
    }

    @Test
    fun signUp_termsNotAgreed_setsErrorState() = runTest {
        viewModel.signUp("John Doe", "user@scryme.tech", "pass123", false)
        assertTrue(viewModel.uiState.value is AuthUiState.Error)
        assertEquals("You must agree to the Terms and Conditions", (viewModel.uiState.value as AuthUiState.Error).message)
    }

    @Test
    fun signUp_success_setsSuccessState() = runTest {
        coEvery { authRepository.loginWithEmail("user@scryme.tech", "pass123") } returns Result.success(Unit)

        viewModel.signUp("John Doe", "user@scryme.tech", "pass123", true)
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is AuthUiState.Success)
    }

    @Test
    fun logout_resetsStateToIdle() = runTest {
        coEvery { authRepository.logout() } just Runs

        viewModel.logout()
        testScheduler.advanceUntilIdle()

        assertEquals(AuthUiState.Idle, viewModel.uiState.value)
    }
}
