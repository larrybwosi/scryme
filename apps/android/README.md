# Scryme Admin Android Application

**Scryme Admin** is a Kotlin-based native Android application that serves as the mobile control center for branch managers and executives. Designed with an MVVM architecture, Jetpack Compose UI, and robust offline capability, it enables real-time branch oversight from anywhere.

## 🚀 Key Features

- **Enterprise Bottom Navigation**:
  - **Dashboard**: Aggregates active session details, secure tokens, and live tenant/branch occupancy breakdowns.
  - **Presence & Check-Ins**: Polled state-flow rosters detailing currently active staff, check-in details, and administrative check-out triggers.
  - **Operations**: Hub for managing and approving remote price adjustments and broadcasting organization-wide urgent notifications.
- **Branch Inspector (`BranchDetailView`)**: In-depth statistics per branch, including daily sales, petty cash floats, attendance sheets, and sales progress charts.
- **Dynamic API Server Rewriting**: Includes a login-screen configuration with a `DynamicBaseUrlInterceptor` and `SessionManager` storage allowing on-the-fly redirection to local emulators, staging servers, or production.
- **Secure Persistence**: Employs Android's `EncryptedSharedPreferences` to secure session credentials and enable auto-login upon launch.
- **Code Style Alignment**: Formatted and enforced style rules via the `ktlint` Gradle plugin. Composable functions are annotated with `@Suppress("ktlint:standard:function-naming")` where appropriate to align with Jetpack Compose standard patterns.

---

## 🛠️ Tech Stack

- **Language**: Kotlin
- **Minimum SDK**: 24 (Android 7.0 Nougat)
- **Target SDK**: 35 (Android 15)
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with StateFlow polling, Coroutines, and ViewModel
- **Networking**: Retrofit 2 & OkHttp 3 with dynamic URL switching
- **Security**: EncryptedSharedPreferences
- **Formatting**: Ktlint

---

## 🏁 Getting Started

### Prerequisites

- **Android Studio** (Koala or newer recommended)
- **JDK 21**
- **Gradle 8.8+**

### Local Setup & Compilation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/larrybwosi/scryme.git
   cd scryme
   ```

2. **Open the Project**
   Open the `apps/android` directory in Android Studio.

3. **Build the Debug APK**
   From the command line (or via Android Studio's Gradle pane):
   ```bash
   ./gradlew -p apps/android assembleDebug
   ```

4. **Run Unit Tests**
   Run the Kotlin JUnit and MockK mock suite using:
   ```bash
   ./gradlew -p apps/android testDebugUnitTest
   ```

5. **Linting and Style Verification**
   Verify standard code format compliance:
   ```bash
   ./gradlew -p apps/android ktlintCheck
   ```

---

## 🚢 CI/CD & Release Signing

The project includes a robust GitHub Actions workflow at `.github/workflows/android.yml`.
On production branches, release builds require the following environment variables for keystore signing:

- `RELEASE_KEYSTORE_FILE`: Path to the signing `.jks` file.
- `RELEASE_KEYSTORE_PASSWORD`: Keystore decryption password.
- `RELEASE_KEY_ALIAS`: Key pair entry alias.
- `RELEASE_KEY_PASSWORD`: Key private password.

If these variables are missing during a local build, a graceful fallback disables signing rather than failing compile processes.
