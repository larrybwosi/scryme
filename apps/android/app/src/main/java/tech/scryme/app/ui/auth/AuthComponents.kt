package tech.scryme.app.ui.auth

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val AuthBackground = Color(0xFFF8FAFC)
val PrimaryDarkButton = Color(0xFF0F172A)
val PurpleAccent = Color(0xFF7C3AED)
val FieldBackground = Color(0xFFFFFFFF)
val FieldBorder = Color(0xFFE2E8F0)
val LabelText = Color(0xFF334155)
val SubtitleText = Color(0xFF64748B)

@Composable
fun ScrymeBrandHeader(
    modifier: Modifier = Modifier
) {
    Surface(
        color = PurpleAccent.copy(alpha = 0.1f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, PurpleAccent.copy(alpha = 0.2f)),
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(PurpleAccent)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Scryme Enterprise",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = PurpleAccent,
                letterSpacing = 0.5.sp
            )
        }
    }
}

@Composable
fun AuthTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .shadow(2.dp, CircleShape)
                .clip(CircleShape)
                .background(Color.White)
                .clickable { onBackClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = Color(0xFF1E293B),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
fun AuthPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false
) {
    Button(
        onClick = onClick,
        enabled = enabled && !isLoading,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        shape = RoundedCornerShape(27.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = PrimaryDarkButton,
            contentColor = Color.White,
            disabledContainerColor = PrimaryDarkButton.copy(alpha = 0.5f),
            disabledContentColor = Color.White.copy(alpha = 0.5f)
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 4.dp,
            pressedElevation = 2.dp
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                color = Color.White,
                strokeWidth = 2.5.dp
            )
        } else {
            Text(
                text = text,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun AuthSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp),
        shape = RoundedCornerShape(27.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = PrimaryDarkButton
        ),
        border = BorderStroke(1.5.dp, PrimaryDarkButton)
    ) {
        Text(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun AuthTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    leadingIcon: ImageVector,
    modifier: Modifier = Modifier,
    trailingIcon: @Composable (() -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    isError: Boolean = false,
    errorMessage: String? = null
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = LabelText,
            modifier = Modifier.padding(bottom = 6.dp, start = 4.dp)
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = {
                Text(
                    text = placeholder,
                    color = Color(0xFF94A3B8),
                    fontSize = 14.sp
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    tint = Color(0xFF94A3B8),
                    modifier = Modifier.size(20.dp)
                )
            },
            trailingIcon = trailingIcon,
            visualTransformation = visualTransformation,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            singleLine = true,
            isError = isError,
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = FieldBackground,
                unfocusedContainerColor = FieldBackground,
                disabledContainerColor = FieldBackground,
                focusedBorderColor = PurpleAccent,
                unfocusedBorderColor = FieldBorder,
                errorBorderColor = MaterialTheme.colorScheme.error,
                focusedTextColor = Color(0xFF0F172A),
                unfocusedTextColor = Color(0xFF0F172A)
            ),
            modifier = Modifier
                .fillMaxWidth()
                .shadow(1.dp, RoundedCornerShape(16.dp))
        )
        if (isError && !errorMessage.isNullOrEmpty()) {
            Text(
                text = errorMessage,
                color = MaterialTheme.colorScheme.error,
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 4.dp, top = 4.dp)
            )
        }
    }
}

@Composable
fun OrDivider(
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = Color(0xFFE2E8F0)
        )
        Text(
            text = "Or Continue With",
            fontSize = 12.sp,
            color = Color(0xFF94A3B8),
            modifier = Modifier.padding(horizontal = 12.dp)
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = Color(0xFFE2E8F0)
        )
    }
}

@Composable
fun SocialAuthButtons(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Google Button
        OutlinedButton(
            onClick = {
                Toast.makeText(context, "Google sign-in is not configured", Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier
                .weight(1f)
                .height(50.dp),
            shape = RoundedCornerShape(25.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color.White
            ),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                GoogleIcon(modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Google",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1E293B)
                )
            }
        }

        // Apple Button
        OutlinedButton(
            onClick = {
                Toast.makeText(context, "Apple sign-in is not configured", Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier
                .weight(1f)
                .height(50.dp),
            shape = RoundedCornerShape(25.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color.White
            ),
            border = BorderStroke(1.dp, Color(0xFFE2E8F0))
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                AppleIcon(modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Apple",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1E293B)
                )
            }
        }
    }
}

@Composable
fun GoogleIcon(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        drawCircle(color = Color(0xFF4285F4), radius = w * 0.45f, center = Offset(w / 2, h / 2), style = Stroke(width = w * 0.18f))
        drawRect(color = Color.White, topLeft = Offset(w * 0.2f, h * 0.25f), size = Size(w * 0.35f, h * 0.5f))
        drawRect(color = Color(0xFF4285F4), topLeft = Offset(w * 0.45f, h * 0.42f), size = Size(w * 0.45f, h * 0.16f))
    }
}

@Composable
fun AppleIcon(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val path = Path().apply {
            moveTo(w * 0.5f, h * 0.15f)
            cubicTo(w * 0.4f, h * 0.05f, w * 0.25f, h * 0.15f, w * 0.2f, h * 0.35f)
            cubicTo(w * 0.15f, h * 0.6f, w * 0.3f, h * 0.9f, w * 0.5f, h * 0.88f)
            cubicTo(w * 0.7f, h * 0.9f, w * 0.85f, h * 0.6f, w * 0.8f, h * 0.35f)
            cubicTo(w * 0.75f, h * 0.15f, w * 0.6f, h * 0.05f, w * 0.5f, h * 0.15f)
            close()
        }
        drawPath(path = path, color = Color(0xFF000000))
    }
}

@Composable
fun Wallet3DIllustration(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(260.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val cx = size.width / 2f
            val cy = size.height / 2f

            drawOval(
                color = Color(0x15000000),
                topLeft = Offset(cx - 110.dp.toPx(), cy + 70.dp.toPx()),
                size = Size(220.dp.toPx(), 20.dp.toPx())
            )

            val cardWidth = 140.dp.toPx()
            val cardHeight = 90.dp.toPx()
            drawRoundRect(
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFF8B5CF6), Color(0xFF6366F1)),
                    start = Offset(cx - 100.dp.toPx(), cy - 80.dp.toPx()),
                    end = Offset(cx + 40.dp.toPx(), cy + 10.dp.toPx())
                ),
                topLeft = Offset(cx - 85.dp.toPx(), cy - 75.dp.toPx()),
                size = Size(cardWidth, cardHeight),
                cornerRadius = CornerRadius(16.dp.toPx(), 16.dp.toPx())
            )

            val walletWidth = 160.dp.toPx()
            val walletHeight = 120.dp.toPx()
            drawRoundRect(
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFFE879F9), Color(0xFFD946EF)),
                    start = Offset(cx - 80.dp.toPx(), cy - 20.dp.toPx()),
                    end = Offset(cx + 80.dp.toPx(), cy + 80.dp.toPx())
                ),
                topLeft = Offset(cx - 90.dp.toPx(), cy - 25.dp.toPx()),
                size = Size(walletWidth, walletHeight),
                cornerRadius = CornerRadius(24.dp.toPx(), 24.dp.toPx())
            )

            drawCircle(
                color = Color(0xFFE2E8F0),
                radius = 14.dp.toPx(),
                center = Offset(cx - 30.dp.toPx(), cy + 35.dp.toPx())
            )
            drawCircle(
                color = Color(0xFF94A3B8),
                radius = 6.dp.toPx(),
                center = Offset(cx - 30.dp.toPx(), cy + 35.dp.toPx())
            )

            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFFDE047), Color(0xFFCA8A04)),
                    center = Offset(cx + 70.dp.toPx(), cy + 10.dp.toPx()),
                    radius = 22.dp.toPx()
                ),
                radius = 22.dp.toPx(),
                center = Offset(cx + 70.dp.toPx(), cy + 10.dp.toPx())
            )

            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFFEF08A), Color(0xFFEAB308)),
                    center = Offset(cx + 95.dp.toPx(), cy + 45.dp.toPx()),
                    radius = 18.dp.toPx()
                ),
                radius = 18.dp.toPx(),
                center = Offset(cx + 95.dp.toPx(), cy + 45.dp.toPx())
            )
        }
    }
}

@Composable
fun PageIndicatorDots(
    pageCount: Int = 4,
    selectedIndex: Int = 1,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(pageCount) { index ->
            if (index == selectedIndex) {
                Box(
                    modifier = Modifier
                        .width(28.dp)
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(PurpleAccent)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE2E8F0))
                )
            }
        }
    }
}
