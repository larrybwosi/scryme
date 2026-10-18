# Firebase Cloud Messaging (FCM) & Notification Channels Guide

This guide provides step-by-step instructions for configuring Google Firebase Cloud Messaging (FCM) for the Scryme Android Application, including Firebase Console setup, `google-services.json` placement, backend API integration, Android notification channel specifications, and testing verification.

---

## 1. Firebase Console Setup

1. **Create / Access Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Click **Add Project** (or select an existing Scryme Firebase project).
   - Enter your Project Name (e.g., `Scryme Mobile App`).

2. **Register Android App**:
   - In the Firebase Project Overview, click the **Android** icon (`+ Add app`).
   - Enter the Android Package Name: `tech.scryme.app` (must match `applicationId` in `app/build.gradle.kts`).
   - App Nickname: `Scryme Android` (optional).
   - Debug signing certificate SHA-1 (optional, required for Google Sign-In or Phone Auth):
     ```bash
     ./gradlew signingReport
     ```

3. **Download `google-services.json`**:
   - Download the generated `google-services.json` configuration file.
   - Place the file in the `apps/android/app/` directory:
     ```
     apps/android/app/google-services.json
     ```

4. **Enable Firebase Cloud Messaging**:
   - Navigate to **Project Settings** (gear icon) > **Cloud Messaging**.
   - Enable **Firebase Cloud Messaging API (V1)**.
   - Generate a Private Key under **Project Settings** > **Service accounts** > **Generate new private key** if configuring server-side FCM dispatch.

---

## 2. Notification Channels Overview

The Scryme Android App automatically creates and manages **6 Notification Channels** upon startup (compatible with Android 8.0 Oreo+ / API 26+):

| Channel Name | Channel ID | Importance | Description | Payload Keyword Match |
| :--- | :--- | :--- | :--- | :--- |
| **Schedule & Shift Updates** | `schedule_updates_channel` | `IMPORTANCE_HIGH` | Roster changes, shift assignments, and trades | `SHIFT`, `SCHEDULE`, `ROSTER` |
| **Task Assignments & Updates** | `tasks_updates_channel` | `IMPORTANCE_HIGH` | New task assignments, updates, and deadlines | `TASK` |
| **Daily Shifts & Roster Summary** | `daily_shifts_channel` | `IMPORTANCE_DEFAULT` | Daily shift reminders and scheduled task summaries | `DAILY`, `ROSTER_SUMMARY` |
| **POS & System Alerts** | `pos_alerts_channel` | `IMPORTANCE_HIGH` | POS pairing, system alerts, and terminal status | `POS`, `PAIR`, `SYSTEM`, `SALE` |
| **Company Announcements** | `announcements_channel` | `IMPORTANCE_HIGH` | Important broadcasts and organization updates | `ANNOUNCEMENT`, `BROADCAST` |
| **Attendance & Geofencing Alerts** | `attendance_alerts_channel` | `IMPORTANCE_HIGH` | Clock-in reminders, geofence warnings, and attendance alerts | `ATTENDANCE`, `CLOCK`, `GEOFENCE` |

---

## 3. Backend FCM Token Sync Architecture

1. **Token Refresh Hook (`onNewToken`)**:
   - Whenever Firebase generates or refreshes a registration token, `ScrymeFirebaseMessagingService.onNewToken(token)` receives the callback.
   - The token is persisted to local Encrypted DataStore preferences via `SessionManager.saveFcmToken(token)`.
   - If an active session exists, `AuthRepository.registerDeviceToken(token)` calls the backend endpoint:
     ```http
     POST /v3/android/register-device
     Content-Type: application/json
     Authorization: Bearer <token>

     {
       "deviceId": "android_device_pixel_8",
       "modelName": "Google Pixel 8",
       "appVersion": "10.2.0",
       "osVersion": "Android 14",
       "pushToken": "fcm_token_string_here"
     }
     ```

2. **Session Login / Restoration Sync**:
   - Token sync is also triggered upon successful user email login, OAuth authentication, member PIN login, POS pairing, and session validation (`validateSession()`).

---

## 4. Foreground & Background Handling

- **Background / Terminated State**: Standard system notifications are delivered directly to the Android notification drawer under the specified channel.
- **Foreground State**: When the app is open:
  1. A system notification is posted to the notification shade.
  2. A local broadcast (`ACTION_FOREGROUND_NOTIFICATION`) is dispatched to `MainActivity`.
  3. `MainActivity` displays an in-app Jetpack Compose **Snackbar** banner instantly.

---

## 5. Testing Push Notifications

### Option A: Using Firebase Console Notification Composer
1. Go to **Firebase Console** > **Messaging** > **Create your first campaign** > **Firebase Notification messages**.
2. Enter Title and Notification Text.
3. Target: Select package `tech.scryme.app`.
4. Additional options > Custom data:
   - Key: `type`, Value: `TASK` (or `ANNOUNCEMENT`, `ATTENDANCE`, `POS`, `DAILY`, `SCHEDULE`).
5. Click **Send Test Message** and paste your FCM Registration Token.

### Option B: Using cURL / HTTP V1 API
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/<YOUR_PROJECT_ID>/messages:send \
  -H "Authorization: Bearer <FCM_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "<TARGET_FCM_TOKEN>",
      "notification": {
        "title": "Shift Updated",
        "body": "Your shift for tomorrow has been updated to 09:00 AM."
      },
      "data": {
        "type": "SCHEDULE",
        "orgSlug": "demo-org"
      }
    }
  }'
```
