# 0001. Android location pinning and check in verification

**Date**: 2025-05-20
**Status**: Proposed

## Summary

This decision defines how the Android app pins precise branch location coordinates and enforces geofence check in rules. Users can capture live GPS coordinates or enter lat long values to pin location coordinates accurately. During attendance check in, the app captures device GPS coordinates, screens for mock location providers, verifies the distance to the pinned branch location against a 50 meter radius, and strictly blocks non compliant check ins with clear error messages.

## Context

Employees require a reliable method to record attendance at designated branch locations. Currently, the Android app possesses UI placeholders for check in and location management but lacks live GPS capture, mock location detection, and client side geofence distance validation against pinned locations. Without strict location verification, check ins could occur far away from assigned store branches or via spoofed GPS coordinates, compromising shift tracking integrity.

## Requirements

**User stories**:
- As a branch manager, I want to pin accurate GPS coordinates for my branch location so that employee check ins are restricted to the physical site.
- As an employee, I want to record my attendance check in with my current location so that my presence is verified within the allowed branch radius.
- As an administrator, I want mock location attempts and out of radius check ins strictly blocked so that shift records remain trustworthy.

**Acceptance criteria**:
- **AC-1**: The Android app retrieves live device GPS coordinates using FusedLocationProviderClient when pinning branch location or performing attendance check in.
- **AC-2**: Branch managers can save updated latitude and longitude coordinates for branch locations via API call.
- **AC-3**: Attendance check in inspects the location object for mock provider flags (`isFromMockProvider` / `isMock`). If mock location is detected, the app strictly blocks check in and displays a mock location rejection message.
- **AC-4**: Attendance check in calculates the distance between the device GPS position and the assigned branch pinned location coordinates. If the distance exceeds 50 meters, the app strictly blocks check in and displays an out of radius error message specifying the measured distance.
- **AC-5**: Valid check in requests transmit latitude, longitude, accuracy, and mock location boolean flag in the API payload to backend attendance check in endpoint.

## Options considered

### Option 1: Native location services with client side distance and mock verification

Use Google Play Services FusedLocationProviderClient to obtain high accuracy current location. Perform client side mock provider detection (`location.isMock`) and distance calculation (`Location.distanceBetween` / `distanceTo`) against pinned coordinates (50m default radius) prior to submitting check in requests.

**Pros**:
- Instant user feedback on check in failure without unnecessary network round trips.
- Leverages native Android system location APIs for maximum position accuracy and mock detection.

**Cons**:
- Requires location runtime permission handling on Android devices.

### Option 2: Server only location evaluation

Send raw device GPS coordinates directly to the backend API without client side verification and let backend return validation errors.

**Pros**:
- Keeps location verification logic centralized on backend.

**Cons**:
- Poor user experience due to network latency delays before receiving distance or mock location error feedback.
- Lacks local mock provider metadata directly exposed by the Android Location framework.

## Decision

**Chosen option**: Option 1: Native location services with client side distance and mock verification

Implement native location capture using `FusedLocationProviderClient`, evaluate distance against pinned coordinates (50m radius threshold), detect fake GPS mock location, and strictly block invalid check ins directly in `ScheduleViewModel` and `BranchViewModel`.

## Rationale

Client side validation using native Android APIs provides immediate, offline resilient validation feedback for employees checking in. It ensures fake GPS tools are detected directly from Android Location framework metadata before making API calls, while maintaining strict security and auditability by sending position accuracy and mock flags in the check in request payload.

## Feature design

**Data model sketch**:
- `CheckInAttendanceRequestDto`: `locationId` (String?), `branchCode` (String?), `latitude` (Double?), `longitude` (Double?), `accuracy` (Float?), `isMock` (Boolean?), `verificationMethod` (String?), `notes` (String?)
- `UpdateBranchCoordinatesDto`: `latitude` (Double), `longitude` (Double)

**State transitions**:
Attendance Check-in state: `Idle` → `AcquiringLocation` → `Validating` → `CheckedIn` or `Blocked (Mock GPS / Out of Radius)`.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /{orgSlug}/members/attendance/check-in | POST | locationId: String, latitude: Double, longitude: Double, accuracy: Float, isMock: Boolean | AttendanceLogDto | Bearer | 400 Bad Request, 403 Out of Radius |
| android/branches/{locationId}/coordinates | PATCH | latitude: Double, longitude: Double | InventoryLocationDto | Bearer | 400 Bad Request, 404 Not Found |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Pin location | latitude, longitude | `FusedLocationProviderClient.getCurrentLocation` or manual input |
| Attendance check in | latitude, longitude, accuracy, isMock | `FusedLocationProviderClient.getCurrentLocation` |
| Geofence validation | distanceMeters | Calculated via `Location.distanceBetween(devLat, devLng, branchLat, branchLng)` |

**Key invariants**:
- Check in is blocked if `isMock == true`.
- Check in is blocked if calculated distance to pinned branch location > 50.0 meters.
- Location coordinates must be non null before check in submission.

**Security model**:
- Requires fine/coarse location permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`).
- Authenticated member session required for check in requests.

**Configuration required**:
- No new environment variables required. Uses existing Google Play Services location dependencies.

**Critical test scenarios**:
- Happy path: Valid GPS location within 50 meters of pinned location succeeds check in, verifies **AC-1**, **AC-5**.
- Mock location detection: Fake GPS provider triggers immediate check in rejection alert, verifies **AC-3**.
- Out of radius check in: Device position 75m away from pinned branch coordinate triggers distance rejection error message, verifies **AC-4**.
- Location pinning update: Saving new coordinates for branch updates branch location state, verifies **AC-2**.

## Build plan

1. Add `LocationHelper` utility class supporting FusedLocationProviderClient high accuracy location fetch, mock provider detection (`location.isMock`), and distance calculation (`Location.distanceBetween`), satisfies **AC-1**, **AC-3**, **AC-4**.
2. Update `CheckInAttendanceRequestDto` and `ScheduleApiService.checkInAttendance` payload to include `accuracy` and `isMockLocation` parameters, satisfies **AC-5**.
3. Implement location pinning and coordinate updates in `BranchApiService`, `BranchRepository`, and `BranchViewModel`, satisfies **AC-2**.
4. Wire check in validation logic in `ScheduleViewModel` and `ScheduleScreen` UI to acquire location, check mock status, enforce 50m geofence radius, display error messages on failure, and complete check in when valid, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**.
5. Add unit test suite `LocationHelperTest` and `ScheduleViewModelLocationTest` verifying location calculation, mock rejection, and geofence verification logic, satisfies **AC-1**, **AC-3**, **AC-4**.

## Consequences

**Positive**:
- Guarantees accurate location tracking for attendance check ins.
- Prevents fraud by detecting mock location providers and enforcing strict 50 meter geofences.
- Provides immediate and clear error feedback to users.

**Negative / tradeoffs**:
- Requires location permissions granted on user devices.
