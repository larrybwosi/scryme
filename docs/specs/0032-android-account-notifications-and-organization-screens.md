# 0032. Android Account, Notifications, and Organization Screens UX Architecture

**Date**: 2026-11-08
**Status**: Accepted

## Summary

This specification defines the modern architectural layout and UX restructuring for the Scryme Android application. It introduces:
1. A dedicated **Account Screen** for viewing and updating personal user info (Name, Email, Phone, Avatar photo, and Duty status) along with security passkeys and session authorizations.
2. A dedicated **Notification Screen** managing all 6 communication and alert channels (Schedule & Shifts, Task Assignments, Daily Shift Summary, POS & Hardware Alerts, Company Announcements, and Attendance Geofencing) using an expressive Material 3 switcher design with descriptive subtitles and visual icon indicators.
3. A dedicated **Organization Screen** consolidating organization details (Name, Slug, Currency, Active Branch / Location ID, Multi-org switching) and POS & Hardware management (QR camera scanner pairing, manual pairing code entry, and target terminal branch selection).
4. Refactoring **Profile** into a clean, modern hub that routes directly to Account, Organization, Notifications, and App Preferences, simplifying navigation and delivering standard-setting enterprise mobile UX.

## Context

Previously, the Android settings and profile features were distributed across overloaded screens: `SettingsScreen` bundled raw JSON-like info rows with POS pairing dialogs, while `ProfileScreen` combined basic profile cards, theme preferences, and partial notification toggles. Notification management only accounted for 2 toggles despite the backend and `NotificationHelper` supporting 6 notification channels. Furthermore, updating user details was hidden within small dialogs. 

Splitting these concerns into specialized screens ensures clean separation of concerns, rich editing workflows, expressive toggle controls, and seamless multi-tenant organization and hardware administration.

## Requirements

**User stories**:
- As a user, I want a dedicated Account screen where I can see and update my name, email, phone number, avatar, and duty status in one place.
- As a user, I want a dedicated Notifications screen that lets me configure alerts for each of the 6 notification channels with an expressive, modern toggle interface.
- As a store manager or administrator, I want a dedicated Organization & Hardware screen to view company details, switch active organizations, and pair POS devices via QR or manual code.
- As a mobile user, I want a streamlined Profile/Settings hub that provides quick, intuitive entry points into Account, Organization, Notifications, and Appearance settings.

**Acceptance criteria**:
- **AC-1**: Navigation graph (`Screen.kt` and `AppNavGraph.kt`) registers new routes: `Screen.Account` (`"account"`), `Screen.Notifications` (`"notifications"`), and `Screen.Organization` (`"organization"`).
- **AC-2**: `AccountScreen` displays user profile information with direct editing capabilities for Full Name, Email, Phone Number, Avatar photo (image picker), Duty Status selector, and Passkey security controls.
- **AC-3**: `NotificationScreen` provides an overarching notification toggle and expressive Material 3 switches with icons and subtitles for all 6 channels: Schedule & Shift Updates, Task Assignments, Daily Shift Summaries, POS & System Alerts, Company Announcements, and Attendance & Geofencing Alerts.
- **AC-4**: `OrganizationScreen` provides organization metadata display, multi-organization switching, active branch selection, and POS terminal hardware pairing (both inline manual code input and QR scanner dialog).
- **AC-5**: `ProfileScreen` and `SettingsScreen` are refactored into a cohesive enterprise hub with clear visual cards navigating to Account, Organization, Notifications, Theme Preferences, and Session Logout.
- **AC-6**: Unit tests in `apps/android/app/src/test/java` cover the new ViewModels, repository integrations, and navigation routes.

## Decision

Implement dedicated Jetpack Compose screens for Account, Notifications, and Organization, backed by Hilt ViewModels and SessionManager/DataStore preferences, adhering strictly to Android Material 3 design guidelines.
