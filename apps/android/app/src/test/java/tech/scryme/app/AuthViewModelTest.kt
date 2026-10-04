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
    fun login_blankOrgSlug_setsErrorState() = runTest {
        viewModel.login("", "1234")
        assertTrue(viewModel.uiState.value is AuthUiState.Error)
        assertEquals("Organization Slug is required", (viewModel.uiState.value as AuthUiState.Error).message)
    }

    @Test
    fun login_success_setsSuccessState() = runTest {
        coEvery { authRepository.loginMember("scryme-demo", "1234", null) } returns Result.success(Unit)

        viewModel.login("scryme-demo", "1234")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is AuthUiState.Success)
    }

    @Test
    fun login_failure_setsErrorState() = runTest {
        coEvery { authRepository.loginMember("scryme-demo", "9999", null) } returns Result.failure(Exception("Unauthorized PIN"))

        viewModel.login("scryme-demo", "9999")
        testScheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is AuthUiState.Error)
        assertEquals("Unauthorized PIN", (viewModel.uiState.value as AuthUiState.Error).message)
    }

    @Test
    fun logout_resetsStateToIdle() = runTest {
        coEvery { authRepository.logout() } just Runs

        viewModel.logout()
        testScheduler.advanceUntilIdle()

        assertEquals(AuthUiState.Idle, viewModel.uiState.value)
    }
}
