# Scryme Android Architecture & UI Implementation Guidance

This document outlines the architectural specifications, state management guidelines, and UI implementation scope for expanding the Scryme Android application.

---

## 1. Clean Architecture Layers

```
      +--------------------------------------------------+
      |                   UI Layer                       |
      |   (Jetpack Compose, Material 3, ViewModels)     |
      +-------------------------+------------------------+
                                |
                                v
      +--------------------------------------------------+
      |                 Domain Layer                     |
      |      (Domain Models, Repository Interfaces)      |
      +-------------------------+------------------------+
                                |
                                v
      +--------------------------------------------------+
      |                  Data Layer                      |
      |   (Retrofit Services, DTOs, SessionManager,      |
      |           Repository Implementations)            |
      +--------------------------------------------------+
```

---

## 2. V3 API Network Communication & Headers

All network requests target `https://api.scryme.tech/v3/`.
The `HeaderInterceptor` (`tech.scryme.app.data.interceptor.HeaderInterceptor`) automatically decorates requests with:

- `Authorization: Bearer <accessToken>`
- `x-member-token: <memberToken>`
- `x-org-slug: <organizationSlug>`
- `x-location-id: <activeLocationId>`
- `Accept: application.json`

Response envelopes are formatted as:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-03-31T00:00:00.000Z"
}
```

---

## 3. Recommended ViewModel & UI State Pattern

ViewModels should expose immutable StateFlows representing UI State sealed interfaces or data classes.

### Example ViewModel Contract
```kotlin
sealed interface ScheduleUiState {
    object Loading : ScheduleUiState
    data class Success(
        val shifts: List<StaffShift>,
        val trades: List<ShiftTrade>,
        val tasks: List<StaffTask>
    ) : ScheduleUiState
    data class Error(val message: String) : ScheduleUiState
}

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val scheduleRepository: ScheduleRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<ScheduleUiState>(ScheduleUiState.Loading)
    val uiState: StateFlow<ScheduleUiState> = _uiState.asStateFlow()

    fun loadSchedule() {
        viewModelScope.launch {
            _uiState.value = ScheduleUiState.Loading
            val orgSlug = sessionManager.getOrgSlug() ?: return@launch
            val result = scheduleRepository.getCurrentMemberShifts(orgSlug)
            result.fold(
                onSuccess = { shifts ->
                    _uiState.value = ScheduleUiState.Success(shifts = shifts, trades = emptyList(), tasks = emptyList())
                },
                onFailure = { error ->
                    _uiState.value = ScheduleUiState.Error(error.message ?: "Failed to load schedule")
                }
            )
        }
    }
}
```

---

## 4. UI Screen Implementation Scope

### A. Schedules Screen (`tech.scryme.app.ui.schedule`)
- **Key Views**:
  - `ScheduleCalendarView`: Daily and weekly timeline for current member shifts and working hours.
  - `ShiftTradeCard`: Displays active shift swap/trade requests with `APPROVE`, `REJECT`, or `CANCEL` actions.
  - `TaskListSection`: Displays operational staff tasks with status toggle (`TODO` -> `COMPLETED`).
- **Repositories Used**: `ScheduleRepository`

### B. Profile Customization Screen (`tech.scryme.app.ui.profile`)
- **Key Views**:
  - `ProfileHeader`: Displays member avatar, name, email, role badge, and active status indicator.
  - `DutyStatusPicker`: Dropdown or segmented button to switch status (`ONLINE`, `BUSY`, `OFFLINE`).
  - `EditProfileForm`: Text fields to edit member name, phone number, and avatar URL.
- **Repositories Used**: `ProfileRepository`

### C. Branch / Location Management Screen (`tech.scryme.app.ui.branch`)
- **Key Views**:
  - `BranchList`: Card list displaying organization branches with address, code, and default location badge.
  - `ActiveBranchBanner`: Shows currently selected active branch context (`x-location-id`).
  - `BranchSwitcherButton`: Switches active branch across app session via `BranchRepository.switchActiveBranch(locationId)`.
- **Repositories Used**: `BranchRepository`
