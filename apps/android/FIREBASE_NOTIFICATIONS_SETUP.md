# Firebase Cloud Messaging (FCM) & Notification Channels Setup Guide

This guide provides step-by-step instructions for configuring Firebase Cloud Messaging (FCM), notification channels, and sending test notifications for the **Scryme Android App**.

---

## Table of Contents

1. [Firebase Console Configuration](#1-firebase-console-configuration)
2. [Android Project Setup (`google-services.json`)](#2-android-project-setup-google-servicesjson)
3. [SHA-1 / SHA-256 Fingerprint Registration](#3-sha-1--sha-256-fingerprint-registration)
4. [Notification Channels Reference](#4-notification-channels-reference)
5. [In-App Foreground & Tap Deep-Linking Behavior](#5-in-app-foreground--tap-deep-linking-behavior)
6. [Testing Push Notifications (Firebase Console & cURL)](#6-testing-push-notifications-firebase-console--curl)

---

## 1. Firebase Console Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase project (or click **Add project** to create `Scryme-Mobile`).
3. Click the **Android** icon (`+ Add app`) to add an Android application to your project.
4. Enter the Android package name:
   `tech.scryme.app`
5. Enter the App nickname:
   `Scryme Android`
6. Click **Register app**.

---

## 2. Android Project Setup (`google-services.json`)

1. In the Firebase Console setup flow, download the `google-services.json` file.
2. Place the downloaded `google-services.json` in the app directory:
   ```
   apps/android/app/google-services.json
   ```
3. Ensure `google-services.json` is added to `.gitignore` (sensitive credentials should not be committed).

---

## 3. SHA-1 / SHA-256 Fingerprint Registration

To support OAuth2 auto-login deep linking, Google Sign-In, and FCM App Verification:

1. Generate SHA-1 fingerprint locally using Gradle:
   ```bash
   cd apps/android
   ./gradlew signingReport
   ```
2. Copy the `SHA1` and `SHA256` key fingerprints from the output for `debug` and `release` variants.
3. Open **Project Settings** in the Firebase Console (Gear icon in top left).
4. Scroll down to **Your apps** -> **Scryme Android (`tech.scryme.app`)**.
5. Click **Add fingerprint** and paste your SHA-1 and SHA-256 keys.

---

## 4. Notification Channels Reference

The Android app automatically creates and configures 6 distinct notification channels upon application startup:

| Channel ID | Display Name | Importance | Description | Default Screen Target |
|---|---|---|---|---|
| `schedule_updates_channel` | Schedule & Shift Updates | `HIGH` | Roster changes, shift assignments, and trades | `schedule` |
| `tasks_updates_channel` | Task Assignments & Updates | `HIGH` | Task assignments, updates, and deadlines | `tasks` |
| `daily_shifts_channel` | Daily Shifts & Roster Summary | `DEFAULT` | Daily shift reminders and summaries | `schedule` |
| `pos_alerts_channel` | POS & Pairing Alerts | `DEFAULT` | POS device pairing and operational alerts | `admin` |
| `announcements_channel` | General Announcements | `DEFAULT` | Company-wide broadcasts and announcements | `admin` |
| `attendance_alerts_channel` | Attendance Alerts | `HIGH` | Geofence check-ins, late alerts, and attendance updates | `schedule` |

### Default FCM Manifest Metadata
In `apps/android/app/src/main/AndroidManifest.xml`, default FCM parameters are configured:
```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="announcements_channel" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@mipmap/ic_launcher" />
```

---

## 5. In-App Foreground & Tap Deep-Linking Behavior

- **Foreground State (App Active)**: When a push notification arrives while the user is actively using the app, the notification is posted to the system tray **AND** broadcasted in-app to display an interactive Compose Snackbar banner with a **"View"** action button.
- **Background State / Notification Tap**: Tapping a notification in the notification shade launches `MainActivity` with intent extras:
  - `extra_target_screen`: Routes navigation automatically to `tasks`, `schedule`, `admin`, `sales`, or `profile`.

---

## 6. Testing Push Notifications (Firebase Console & cURL)

### Method A: Testing via Firebase Messaging Console
1. Navigate to **Engage** -> **Messaging** (or **Cloud Messaging**) in the Firebase Console.
2. Click **Create your first campaign** -> **Firebase Notification messages**.
3. Fill in **Notification title** and **Notification text**.
4. Click **Send test message**, enter your FCM Registration Token (logged in Logcat under `ScrymeFCM`), and click **Test**.

### Method B: Testing via FCM HTTP v1 API (cURL)

Send an HTTP POST request to FCM API v1 using your service account OAuth2 token:

```bash
curl -X POST \
  https://fcm.googleapis.com/v1/projects/<YOUR_PROJECT_ID>/messages:send \
  -H "Authorization: Bearer <YOUR_OAUTH2_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "<DEVICE_FCM_TOKEN>",
      "notification": {
        "title": "New Task Assigned",
        "body": "You have been assigned to Stock Audit by Manager."
      },
      "data": {
        "type": "TASK_ASSIGNED",
        "targetScreen": "tasks"
      },
      "android": {
        "notification": {
          "channel_id": "tasks_updates_channel"
        }
      }
    }
  }'
```

#### Sample Payload 1: Attendance Alert
```json
{
  "message": {
    "token": "<DEVICE_FCM_TOKEN>",
    "notification": {
      "title": "Geofence Check-in Reminder",
      "body": "You arrived at Main Branch. Please tap to check in for your shift."
    },
    "data": {
      "type": "ATTENDANCE_CHECKIN",
      "targetScreen": "schedule"
    },
    "android": {
      "notification": {
        "channel_id": "attendance_alerts_channel"
      }
    }
  }
}
```

#### Sample Payload 2: General Announcement
```json
{
  "message": {
    "token": "<DEVICE_FCM_TOKEN>",
    "notification": {
      "title": "Company Update",
      "body": "Quarterly All-Hands Meeting starts at 3:00 PM today."
    },
    "data": {
      "type": "ANNOUNCEMENT",
      "targetScreen": "admin"
    },
    "android": {
      "notification": {
        "channel_id": "announcements_channel"
      }
    }
  }
}
```
