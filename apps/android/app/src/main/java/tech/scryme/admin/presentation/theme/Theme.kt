package tech.scryme.admin.presentation.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// --- Scryme Design Tokens ---
object ScrymeColors {
    val InkBg = Color(0xFF0B1220)       // Deep Navy
    val Paper = Color(0xFFF1E9D8)       // Warm Ivory
    val Brass = Color(0xFFC89A4B)       // Primary Gold Accent
    val SteelDark = Color(0xFF161F30)   // Dark Card Background
    val GreenLogo = Color(0xFF34A853)   // Rounded S Logo Green
    val Crimson = Color(0xFFD32F2F)     // Error text color
    val SoftGray = Color(0x80F1E9D8)    // Soft ivory placeholder/text
}

@Composable
fun ScrymeTheme(content: @Composable () -> Unit) {
    val scrymeColorScheme = darkColorScheme(
        primary = ScrymeColors.Brass,
        background = ScrymeColors.InkBg,
        surface = ScrymeColors.SteelDark,
        onPrimary = ScrymeColors.InkBg,
        onBackground = ScrymeColors.Paper,
        onSurface = ScrymeColors.Paper
    )
    MaterialTheme(
        colorScheme = scrymeColorScheme,
        content = content
    )
}
