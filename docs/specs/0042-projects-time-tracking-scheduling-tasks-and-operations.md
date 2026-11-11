# 0042 · Projects Time Tracking Scheduling Tasks and Operations

**Status**: In Progress
**Date**: 2025-05-18
**Author**: Engineering Team

## Summary

Enhance the Projects workspace and NestJS V3 APIs to provide enterprise time tracking, intelligent staff scheduling, comprehensive user task management, and unified cross system operation workflows.

## Context and Motivation

The Projects workspace coordinates team delivery across engineering, operations, field services, and production. As teams scale, several functional opportunities arise across four critical pillars:

1. Time tracking requires robust stopwatch persistence across browser reloads, reliable background elapsed duration recovery, automatic billable ratio analytics, and approval locking to prevent unauthorized tampering with processed timesheets.
2. Scheduling requires real time shift conflict detection across days and hours, automated capacity threshold warnings, shift trade approval lifecycles, and synchronization with staff working hours.
3. User tasks benefit from subtask progress rollups, multi assignee hour allocations, variance calculations between estimates and actual logged time, and quick status actions.
4. Operation management links task workflows directly with customer service bookings, production batch runs, and scheduled work orders, ensuring team capacity is guarded before committing new operational workloads.

## Key Decisions

### 1. Robust Time Tracking and Timesheet Locking
- Enhance stopwatch persistence in local storage with timestamp delta reconciliation upon reload or tab re focus.
- Calculate task estimate versus actual hours variance and billable utilization percentages dynamically.
- Enforce immutable locking for approved timesheet entries in backend use cases so processed payroll logs cannot be deleted or modified.

### 2. Intelligent Scheduling and Shift Conflict Engine
- Provide proactive conflict checking when shifts overlap for the same staff member on identical days of the week.
- Compute cluster capacity dynamically based on active weekly shifts, falling back to standard 40 hour availability when no explicit shifts are configured.
- Support complete shift trade request and approval lifecycles between squad colleagues.

### 3. Task Management and Operational Linkages
- Calculate subtask completion progress rollups to give visibility into parent task progress.
- Support operational category tags for overhead, sync meetings, customer support, and production runs.
- Link service bookings and production batches directly with task items to ensure unified calendar visibility.

## Build Plan

1. Author build specification and update workspace scope.
2. Update NestJS V3 Tasks and Scheduling use cases to validate time entry locks, calculate timesheet metrics, and enforce shift constraints.
3. Update Projects workspace frontend hooks, time tracking interface, schedule views, and task modals.
4. Add comprehensive unit tests verifying timer math, capacity checks, conflict detection, and API client methods.
