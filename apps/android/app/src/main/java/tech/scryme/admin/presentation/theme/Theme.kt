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

    // Amoled Black Presets
    val AmoledBg = Color(0xFF000000)
    val AmoledSurface = Color(0xFF121212)

    // Forest Dark Presets
    val ForestBg = Color(0xFF0C1612)
    val ForestSurface = Color(0xFF15221C)
    val ForestPrimary = Color(0xFF8CAF92)
}

@Composable
fun ScrymeTheme(themeName: String = "Deep Navy", content: @Composable () -> Unit) {
    val (background, surface, primary) = when (themeName) {
        "Amoled Black" -> Triple(ScrymeColors.AmoledBg, ScrymeColors.AmoledSurface, ScrymeColors.Brass)
        "Forest Dark" -> Triple(ScrymeColors.ForestBg, ScrymeColors.ForestSurface, ScrymeColors.ForestPrimary)
        else -> Triple(ScrymeColors.InkBg, ScrymeColors.SteelDark, ScrymeColors.Brass)
    }

    val scrymeColorScheme = darkColorScheme(
        primary = primary,
        background = background,
        surface = surface,
        onPrimary = background,
        onBackground = ScrymeColors.Paper,
        onSurface = ScrymeColors.Paper
    )
    MaterialTheme(
        colorScheme = scrymeColorScheme,
        content = content
    )
}
