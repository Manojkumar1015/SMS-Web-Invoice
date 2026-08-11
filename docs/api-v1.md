# SMS Web Invoice SaaS — Production API Documentation (v1)

Base URL: `/api/v1`

---

## 1. Health Check Endpoint

### `GET /api/v1/health`
Returns current API operational status.

- **Authentication**: None (Public)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "SMS Web Invoice SaaS API",
    "version": "v1",
    "timestamp": "2026-08-11T12:00:00.000Z"
  }
}
```

---

## 2. Organization Business Profile Endpoints

### `GET /api/v1/organization`
Retrieves the authenticated user's active organization business profile.

- **Authentication**: Required (Supabase Auth Cookie / Bearer)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "companyName": "Acme Systems Ltd",
    "legalName": "Acme Systems Private Limited",
    "email": "contact@acme.com",
    "phone": "+91 9876543210",
    "website": "https://acme.com",
    "address": "Suite 404, Tech Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India",
    "gstin": "27AAAAA0000A1Z5",
    "pan": "AAAAA0000A",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "dateFormat": "DD/MM/YYYY"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: User is unauthenticated.
  - `403 Forbidden`: User does not belong to an active organization.

---

### `PATCH /api/v1/organization`
Updates organization business profile details.

- **Authentication**: Required
- **Authorization**: Required (`Owner` or `Admin` role)
- **Request Body** (JSON):
```json
{
  "companyName": "Acme Global Systems Ltd",
  "phone": "+91 9876543211",
  "gstin": "27AAAAA0000A1Z6"
}
```
- **Response `200 OK`**: Returns updated `BusinessSettings` object.
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: User role is `Accountant`, `Staff`, or `Viewer`.
  - `422 Unprocessable Entity`: Zod payload validation failure.
