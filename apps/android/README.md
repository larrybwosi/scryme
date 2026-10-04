# Scryme Android Mobile Application

The Scryme Android application is built using modern Android development practices, Kotlin, Jetpack Compose, Clean Architecture, Hilt dependency injection, and Retrofit HTTP client to interface with the Scryme V3 API.

## Minimum System Requirements

- **Minimum Android Version**: Android 8.0 Oreo (API Level 26 or higher)
- **Target Android Version**: Android 14 (API Level 34)
- **Java Compatibility**: Java 17

## Project Structure

```
apps/android/
├── app/
│   ├── build.gradle.kts
│   ├── release.jks
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── java/tech/scryme/app/
│           ├── data/          # Retrofit API services, DTOs, OkHttp Interceptors, Repositories
│           ├── domain/        # Domain Models & Repository Interfaces
│           ├── di/            # Hilt Modules (NetworkModule, RepositoryModule)
│           └── ui/            # Jetpack Compose Screens, ViewModels, & UI Components
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── keystore.properties.example
├── README.md
└── GUIDANCE.md
```

## Key Features

1. **User Schedules & Staff Roster (`ScheduleRepository`)**:
   - View staff member's own assigned shifts (`GET /:orgSlug/services/shifts/me`).
   - View team roster across branches (`GET /:orgSlug/services/shifts`).
   - Create staff shifts & add non-working breaks (`POST /:orgSlug/services/staff/:memberId/shifts`).
   - Shift Trade & Swap requests (`GET/POST /:orgSlug/services/shifts/trades`).
   - Operational Staff Tasks (`GET/POST/PATCH /:orgSlug/services/tasks`).

2. **Profile Customization (`ProfileRepository`)**:
   - View and manage member profile details (`GET/PATCH /:orgSlug/members/:id`).
   - Update real-time duty status (`ONLINE`, `BUSY`, `OFFLINE`) (`PATCH /:orgSlug/members/:id/status`).

3. **Branch & Location Management (`BranchRepository`)**:
   - View active organization branches (`GET /:orgSlug/pos/locations`).
   - Switch active branch context dynamically, updating `x-location-id` headers on API requests.

## Building & Signing

To build a signed release APK ready for device installation:

```bash
cd apps/android
./gradlew assembleRelease
```

The signed APK will be generated at `app/build/outputs/apk/release/app-release.apk`.

### Custom Signing Configurations
By default, release builds are signed using the bundled `apps/android/app/release.jks`. You can supply custom keystore properties by creating a `keystore.properties` file in `apps/android/` (see `keystore.properties.example`), or by setting environment variables:

- `KEYSTORE_FILE`: Path to your `.jks` or `.keystore` file
- `KEYSTORE_PASSWORD`: Keystore password
- `KEY_ALIAS`: Key alias
- `KEY_PASSWORD`: Key password

## Architecture

The project adheres strictly to **Android Clean Architecture**:
- **Data Layer**: Retrofit Service Interfaces, DTOs, OkHttp Header/Auth Interceptors, DataStore Session Management, and Repository Implementations.
- **Domain Layer**: Core Business Entities (Domain Models) and Repository Interfaces.
- **UI Layer**: Jetpack Compose Composables, Material 3 components, and StateFlow-based ViewModels (`@HiltViewModel`).

For detailed implementation guidelines, state flow contracts, and UI screen integration specs, refer to [GUIDANCE.md](./GUIDANCE.md).
