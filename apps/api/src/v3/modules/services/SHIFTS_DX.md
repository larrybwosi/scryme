# V3 Staff Shifts API Developer Guide (DX)

This developer guide provides connected applications and custom integrations with complete documentation for querying staff shifts and break schedules in Scryme V3.

Shifts are fundamental to managing staff availability, validating booking slot ranges, and synchronizing external scheduling systems (such as Cal.com or internal calendar workflows).

---

## 🔒 Authentication & Tenancy Context

All V3 APIs require authenticating via a Bearer token matching a configured **V3 API Client** (for connected apps) or a **V3 Hybrid Session**.

* **Authentication Header**: `Authorization: Bearer <your_v3_token>`
* **Tenancy Headers**: Endpoints accept the `:orgSlug` parameter in the URL route. Alternatively, the client context can be passed via the `x-org-slug` custom header.

---

## 📅 Endpoints

### 1. Get Current Member's Shifts
Retrieves the recurring shifts and break windows assigned to the currently authenticated user/member.

* **Endpoint**: `GET /v3/:orgSlug/services/shifts/me`
* **Permission required**: `services:read`
* **Response** (200 OK):
  ```json
  [
    {
      "id": "shift_clm987abc",
      "memberId": "member_user123",
      "organizationId": "org_xyz987",
      "dayOfWeek": 1, // Monday (0 = Sunday, 6 = Saturday)
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true,
      "createdAt": "2026-07-24T09:00:00.000Z",
      "updatedAt": "2026-07-24T09:00:00.000Z",
      "breaks": [
        {
          "id": "break_clm111xyz",
          "shiftId": "shift_clm987abc",
          "startTime": "12:00",
          "endTime": "13:00",
          "description": "Lunch Break"
        }
      ]
    }
  ]
  ```

---

### 2. Get All Staff Shifts (Multi-Member Query)
Designed specifically for connected apps and dashboard modules to retrieve shifts and breaks for **all members** or a filtered subset of members within the active organization.

* **Endpoint**: `GET /v3/:orgSlug/services/shifts`
* **Permission required**: `services:read`
* **Query Parameters**:
  - `memberId` (string, optional): Filter shifts for a specific staff member.
  - `dayOfWeek` (number, optional, `0` - `6`): Filter shifts by day of the week (e.g. `1` for Monday).
  - `isActive` (boolean, optional): Filter shifts by active status (`true`/`false`).

#### Real-world Request Example (Filtering Mondays for active shifts):
```http
GET /v3/acme-corp/services/shifts?dayOfWeek=1&isActive=true HTTP/1.1
Host: api.scryme.tech
Authorization: Bearer scryme_v3_tok_abc123
```

#### High-Fidelity Response Payload (200 OK):
Returns a rich, flat array of shifts. To maximize developer experience (DX) and minimize secondary API calls, each shift object includes populated break lists and detailed member/user identity cards:

```json
[
  {
    "id": "shift_clm987abc",
    "memberId": "member_user123",
    "organizationId": "org_xyz987",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true,
    "createdAt": "2026-07-24T09:00:00.000Z",
    "updatedAt": "2026-07-24T09:00:00.000Z",
    "breaks": [
      {
        "id": "break_clm111xyz",
        "shiftId": "shift_clm987abc",
        "startTime": "12:00",
        "endTime": "13:00",
        "description": "Lunch Break"
      }
    ],
    "member": {
      "id": "member_user123",
      "role": "ADMIN",
      "user": {
        "id": "user_john_doe",
        "name": "John Doe",
        "email": "john.doe@scryme.tech"
      }
    }
  }
]
```

---

## ⚠️ Error Responses

If query parameters are malformed, or if credentials are invalid, the API returns standardized validation error payloads:

### Bad Request (400) - Invalid Day of Week
```json
{
  "statusCode": 400,
  "message": [
    "dayOfWeek must not be greater than 6",
    "dayOfWeek must be an integer number"
  ],
  "error": "Bad Request"
}
```

### Unauthorized (401) - Missing or Expired Token
```json
{
  "statusCode": 401,
  "message": "Missing or invalid authorization header",
  "error": "Unauthorized"
}
```

### Forbidden (403) - Missing Permissions
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```
