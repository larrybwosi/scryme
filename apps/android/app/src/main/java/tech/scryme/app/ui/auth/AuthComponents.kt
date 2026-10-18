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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val AuthBackground @Composable get() = MaterialTheme.colorScheme.background
val FieldBackground @Composable get() = MaterialTheme.colorScheme.surface
val FieldBorder @Composable get() = MaterialTheme.colorScheme.outline
val LabelText @Composable get() = MaterialTheme.colorScheme.onBackground
val SubtitleText @Composable get() = MaterialTheme.colorScheme.onSurfaceVariant

val PrimaryDarkButton = Color(0xFF0F172A)
val PurpleAccent = Color(0xFF6366F1)

@Composable
fun SmokyBackgroundCanvas(
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height

        // Base obsidian dark backdrop
        drawRect(color = Color(0xFF070A10))

        // Large top-right indigo smoky nebula
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    Color(0x406366F1), // Indigo glow
                    Color(0x1C4F46E5),
                    Color.Transparent
                ),
                center = Offset(w * 0.85f, h * 0.18f),
                radius = w * 0.75f
            ),
            center = Offset(w * 0.85f, h * 0.18f),
            radius = w * 0.75f
        )

        // Mid-left cyan smoky cloud
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    Color(0x3006B6D4), // Cyan glow
                    Color(0x120284C7),
                    Color.Transparent
                ),
                center = Offset(w * 0.15f, h * 0.45f),
                radius = w * 0.65f
            ),
            center = Offset(w * 0.15f, h * 0.45f),
            radius = w * 0.65f
        )

        // Center-bottom purple smoky ambient pulse
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    Color(0x388B5CF6), // Purple glow
                    Color(0x146D28D9),
                    Color.Transparent
                ),
                center = Offset(w * 0.5f, h * 0.8f),
                radius = w * 0.8f
            ),
            center = Offset(w * 0.5f, h * 0.8f),
            radius = w * 0.8f
        )

        // Subtle floating ambient smoke nodes
        val smokeNodes = listOf(
            Offset(w * 0.25f, h * 0.25f) to 40.dp.toPx(),
            Offset(w * 0.7f, h * 0.4f) to 60.dp.toPx(),
            Offset(w * 0.4f, h * 0.65f) to 50.dp.toPx(),
            Offset(w * 0.8f, h * 0.75f) to 45.dp.toPx()
        )

        smokeNodes.forEach { (pos, r) ->
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color(0x1AFFFFFF),
                        Color.Transparent
                    ),
                    center = pos,
                    radius = r
                ),
                center = pos,
                radius = r
            )
        }
    }
}

@Composable
fun ScrymeWordArt(
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        // Enterprise Badge
        Surface(
            color = Color(0x256366F1),
            shape = RoundedCornerShape(20.dp),
            border = BorderStroke(1.dp, Color(0x456366F1)),
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF06B6D4))
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "NEXT-GEN ENTERPRISE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF38BDF8),
                    letterSpacing = 1.5.sp
                )
            }
        }

        // SCRYME Word Art Heading
        Text(
            text = "SCRYME",
            fontSize = 48.sp,
            fontWeight = FontWeight.ExtraBold,
            style = TextStyle(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF818CF8), // Light Indigo
                        Color(0xFF38BDF8), // Bright Cyan
                        Color(0xFFC084FC)  // Soft Violet
                    )
                )
            ),
            letterSpacing = 6.sp,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(6.dp))

        // Subtitle Word Art Line
        Text(
            text = "ENTERPRISE OPERATIONS CORE",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF94A3B8),
            letterSpacing = 3.sp,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ScrymeBrandHeader(
    modifier: Modifier = Modifier
) {
    Surface(
        color = PurpleAccent.copy(alpha = 0.15f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, PurpleAccent.copy(alpha = 0.3f)),
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
                    .background(Color(0xFF06B6D4))
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
                .background(MaterialTheme.colorScheme.surface)
                .clickable { onBackClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = MaterialTheme.colorScheme.onSurface,
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
            containerColor = PurpleAccent,
            contentColor = Color.White,
            disabledContainerColor = PurpleAccent.copy(alpha = 0.5f),
            disabledContentColor = Color.White.copy(alpha = 0.5f)
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 6.dp,
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
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
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
            contentColor = Color.White
        ),
        border = BorderStroke(1.5.dp, Color(0xFF38BDF8).copy(alpha = 0.8f))
    ) {
        Text(
            text = text,
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.5.sp
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
                    color = SubtitleText,
                    fontSize = 14.sp
                )
            },
            leadingIcon = {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    tint = SubtitleText,
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
                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
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
            color = FieldBorder
        )
        Text(
            text = "Or Continue With",
            fontSize = 12.sp,
            color = SubtitleText,
            modifier = Modifier.padding(horizontal = 12.dp)
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = FieldBorder
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
                containerColor = FieldBackground
            ),
            border = BorderStroke(1.dp, FieldBorder)
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
                    color = MaterialTheme.colorScheme.onSurface
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
                containerColor = FieldBackground
            ),
            border = BorderStroke(1.dp, FieldBorder)
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
                    color = MaterialTheme.colorScheme.onSurface
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
    val color = MaterialTheme.colorScheme.onSurface
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
        drawPath(path = path, color = color)
    }
}
