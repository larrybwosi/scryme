package tech.scryme.app

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Test
import tech.scryme.app.ui.theme.*

class ThemeTest {

    @Test
    fun testObsidianDarkThemeTokens() {
        assertEquals("Obsidian Void background should be #121314", Color(0xFF121314), DarkBackground)
        assertEquals("Obsidian Void surface should be #18191B", Color(0xFF18191B), DarkSurface)
        assertEquals("Obsidian Void surfaceVariant should be #1F2023", Color(0xFF1F2023), DarkSurfaceVariant)
        assertEquals("Obsidian Void surfaceElevated should be #24282E", Color(0xFF24282E), DarkSurfaceElevated)
        assertEquals("Obsidian Void card border should be #292A2B", Color(0xFF292A2B), DarkCardBorder)
        assertEquals("Obsidian Void card border light should be #343538", Color(0xFF343538), DarkCardBorderLight)
        assertEquals("Obsidian Void text primary should be #E3E2E3", Color(0xFFE3E2E3), DarkTextPrimary)
        assertEquals("Obsidian Void text secondary should be #C5C9AE", Color(0xFFC5C9AE), DarkTextSecondary)
        assertEquals("Obsidian Void text muted should be #6B7280", Color(0xFF6B7280), DarkTextMuted)
    }

    @Test
    fun testDarkColorSchemeMapping() {
        assertEquals(DarkBackground, DarkColorScheme.background)
        assertEquals(DarkSurface, DarkColorScheme.surface)
        assertEquals(DarkSurfaceVariant, DarkColorScheme.surfaceVariant)
        assertEquals(DarkTextPrimary, DarkColorScheme.onBackground)
        assertEquals(DarkTextPrimary, DarkColorScheme.onSurface)
        assertEquals(DarkTextSecondary, DarkColorScheme.onSurfaceVariant)
        assertEquals(DarkCardBorderLight, DarkColorScheme.outline)
        assertEquals(DarkCardBorder, DarkColorScheme.outlineVariant)
        assertEquals(Indigo500, DarkColorScheme.primary)
        assertEquals(DarkBackground, DarkColorScheme.onSecondary)
        assertEquals(DarkBackground, DarkColorScheme.onTertiary)
    }
}
