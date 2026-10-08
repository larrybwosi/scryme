package tech.scryme.app

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import io.mockk.mockk
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import tech.scryme.app.ui.auth.LoginScreen
import tech.scryme.app.ui.auth.AuthViewModel
import tech.scryme.app.ui.theme.ScrymeTheme

@RunWith(AndroidJUnit4::class)
class LoginScreenE2ETest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun loginScreen_displaysElementsAndAcceptsInput() {
        val viewModel = mockk<AuthViewModel>(relaxed = true)

        composeTestRule.setContent {
            ScrymeTheme {
                LoginScreen(
                    viewModel = viewModel,
                    onLoginSuccess = {},
                    onNavigateToSignUp = {},
                    onBackClick = {}
                )
            }
        }

        composeTestRule.onNodeWithText("Welcome Back").assertIsDisplayed()
        composeTestRule.onNodeWithText("Email Address").assertIsDisplayed()
        composeTestRule.onNodeWithText("Enter Your Email").assertIsDisplayed().performTextInput("user@scryme.tech")
        composeTestRule.onNodeWithText("Password").assertIsDisplayed()
        composeTestRule.onNodeWithText("Enter Your Password").assertIsDisplayed().performTextInput("pass123")
        composeTestRule.onNodeWithText("Log In").assertIsDisplayed().performClick()
    }
}
