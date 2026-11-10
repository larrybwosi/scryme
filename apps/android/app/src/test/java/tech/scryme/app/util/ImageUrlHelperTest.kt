package tech.scryme.app.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ImageUrlHelperTest {

    @Test
    fun testNullOrEmpty() {
        assertNull(ImageUrlHelper.resolve(null))
        assertNull(ImageUrlHelper.resolve(""))
        assertNull(ImageUrlHelper.resolve("   "))
    }

    @Test
    fun testAbsoluteUrls() {
        val httpUrl = "http://storage.scryme.tech/dealio-org-1/avatar.jpg"
        val httpsUrl = "https://storage.scryme.tech/dealio-org-1/avatar.jpg"
        assertEquals(httpUrl, ImageUrlHelper.resolve(httpUrl))
        assertEquals(httpsUrl, ImageUrlHelper.resolve(httpsUrl))
    }

    @Test
    fun testDataUri() {
        val dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        assertEquals(dataUri, ImageUrlHelper.resolve(dataUri))
    }

    @Test
    fun testRelativePaths() {
        val shortPath = "/s/abc12345"
        val resolvedShort = ImageUrlHelper.resolve(shortPath)
        assertEquals("https://api.scryme.tech/s/abc12345", resolvedShort)

        val imagePath = "/images/dealio-uuid123"
        val resolvedImage = ImageUrlHelper.resolve(imagePath)
        assertEquals("https://api.scryme.tech/images/dealio-uuid123", resolvedImage)

        val noLeadingSlash = "s/xyz987"
        val resolvedNoSlash = ImageUrlHelper.resolve(noLeadingSlash)
        assertEquals("https://api.scryme.tech/s/xyz987", resolvedNoSlash)
    }
}
