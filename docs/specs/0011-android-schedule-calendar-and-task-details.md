# 0011: Android Schedule, Calendar, and Task Details Screens

**Status**: In Progress

## Summary
Implements the modern Schedule and Calendar timeline view and the Task Details breakdown screen in the Android app matching the Archivr-style design language while integrating with existing attendance check-in, shift management, and staff tasks.

## Proposed Stack & UI Design
- Jetpack Compose with Material 3 styling adapted to Obsidian / Slate & Teal palette matching reference design.
- Horizontal date selector (7-day strip) with selected day indicator and quick scroll/selection.
- Month selector header with expandable/modal full-month calendar grid dialog to jump to any date across years/months.
- Timeline with vertical dashed indicator lines and time slots (e.g. 08:00, 10:00, 12:00) containing task cards and shift cards.
- Quick create action via `+` button in the header.
- Status completion checkbox toggle with immediate feedback and backend synchronization.
- Task Details Screen (Screen 3 in design) showing category tags, title, due date & time, priority pill, segmented status selector (To Do, In Progress, Completed), rich description, and subtask breakdown checklists with toggleable items.
- Attendance Check-In (geofence & QR) and shift tools preserved via accessible action buttons / banner in Schedule.
