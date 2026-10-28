package tech.scryme.app

import android.location.Location
import io.mockk.*
import org.junit.Assert.*
import org.junit.Test
import tech.scryme.app.util.LocationHelper
import tech.scryme.app.util.LocationValidationResult

class LocationHelperTest {

    @Test
    fun isMockLocation_returnsTrueWhenMockFlagIsSet() {
        val location = mockk<Location>(relaxed = true)
        every { location.isMock } returns true
        every { location.isFromMockProvider } returns true

        val isMock = LocationHelper.isMockLocation(location)
        assertTrue(isMock)
    }

    @Test
    fun validateCheckInLocation_mockLocation_returnsMockLocationDetected() {
        val location = mockk<Location>(relaxed = true)
        every { location.isMock } returns true
        every { location.isFromMockProvider } returns true

        val result = LocationHelper.validateCheckInLocation(
            deviceLocation = location,
            targetLat = -1.286389,
            targetLng = 36.817223,
            maxRadiusMeters = 50.0
        )

        assertTrue(result is LocationValidationResult.MockLocationDetected)
    }

    @Test
    fun validateCheckInLocation_noTargetCoordinates_returnsSuccess() {
        val location = mockk<Location>(relaxed = true)
        every { location.isMock } returns false
        every { location.isFromMockProvider } returns false

        val result = LocationHelper.validateCheckInLocation(
            deviceLocation = location,
            targetLat = null,
            targetLng = null
        )

        assertTrue(result is LocationValidationResult.Success)
        assertEquals(0f, (result as LocationValidationResult.Success).distanceMeters, 0.01f)
    }
}
