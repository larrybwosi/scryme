package tech.scryme.admin.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DeepNavyDarkColorScheme = darkColorScheme(
    primary = Color(0xFF1E293B),
    secondary = Color(0xFF38BDF8),
    tertiary = Color(0xFF818CF8),
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF2563EB),
    secondary = Color(0xFF3B82F6),
    tertiary = Color(0xFF10B981),
    background = Color(0xFFF8FAFC),
    surface = Color.White,
    surfaceVariant = Color(0xFFF1F5F9),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF1E293B),
    onSurface = Color(0xFF0F172A),
    outline = Color(0xFFE2E8F0),
    outlineVariant = Color(0xFFF1F5F9)
)

@Composable
fun ScrymeTheme(
    themeName: String = "Deep Navy",
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        themeName.contains("Navy", ignoreCase = true) || darkTheme -> DeepNavyDarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
