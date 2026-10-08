package tech.scryme.app.ui.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel,
    onSignUpSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current

    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var agreeTerms by remember { mutableStateOf(false) }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onSignUpSuccess()
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AuthBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        AuthTopBar(onBackClick = onBackClick)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
                .padding(bottom = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                ScrymeBrandHeader(
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                )

                Text(
                    text = "Create Your Account",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF0F172A),
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "The All-In-One Enterprise Platform\nFor Operations & Workflow Management.",
                    fontSize = 14.sp,
                    color = SubtitleText,
                    textAlign = TextAlign.Center,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)
                )

                AuthTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = "Full Name*",
                    placeholder = "Enter Full Name",
                    leadingIcon = Icons.Outlined.Person,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                AuthTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email Address*",
                    placeholder = "Enter Your Email",
                    leadingIcon = Icons.Outlined.Email,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                AuthTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password*",
                    placeholder = "Enter Your Password",
                    leadingIcon = Icons.Outlined.Lock,
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Outlined.Visibility else Icons.Outlined.VisibilityOff,
                                contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Password,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            viewModel.signUp(fullName, email, password, agreeTerms)
                        }
                    ),
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Terms agreement checkbox row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = agreeTerms,
                        onClick = { agreeTerms = !agreeTerms },
                        colors = RadioButtonDefaults.colors(selectedColor = PurpleAccent)
                    )
                    Text(
                        text = "I agree with the ",
                        fontSize = 13.sp,
                        color = Color(0xFF475569)
                    )
                    Text(
                        text = "Terms and Conditions",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PurpleAccent,
                        modifier = Modifier.clickable {
                            Toast.makeText(context, "Terms & Conditions details", Toast.LENGTH_SHORT).show()
                        }
                    )
                }

                if (uiState is AuthUiState.Error) {
                    Text(
                        text = (uiState as AuthUiState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp)
                    )
                }

                AuthPrimaryButton(
                    text = "Sign Up",
                    onClick = {
                        focusManager.clearFocus()
                        viewModel.signUp(fullName, email, password, agreeTerms)
                    },
                    isLoading = uiState is AuthUiState.Loading,
                    enabled = fullName.isNotBlank() && email.isNotBlank() && password.isNotBlank()
                )

                OrDivider()

                SocialAuthButtons()
            }

            // Bottom Navigation Link
            Row(
                modifier = Modifier
                    .padding(top = 28.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Have an account? ",
                    fontSize = 14.sp,
                    color = SubtitleText
                )
                Text(
                    text = "Log in",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = PurpleAccent,
                    modifier = Modifier.clickable { onNavigateToLogin() }
                )
            }
        }
    }
}
