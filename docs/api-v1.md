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

### `PATCH /api/v1/organization`
Updates organization business profile details.

- **Authentication**: Required (`Owner` or `Admin` role)

---

## 3. Customer Management Endpoints

### `GET /api/v1/customers`
Returns a paginated list of active organization customers with search and filter support.

- **Authentication**: Required
- **Query Parameters**:
  - `search` (optional): Filter by name, customer number, email, or phone.
  - `is_active` (optional, default `true`): Filter active or inactive customers.
  - `page` (optional, default `1`): Page number.
  - `pageSize` (optional, default `25`, max `100`): Items per page.
  - `sortField` (optional, default `created_at`): `display_name`, `customer_number`, `created_at`, `updated_at`.
  - `sortOrder` (optional, default `desc`): `asc` or `desc`.

### `POST /api/v1/customers`
Creates a new customer. Automatically generates organization-scoped customer numbers (`CUS-00001`).

- **Authentication**: Required (`Owner`, `Admin`, `Accountant`, or `Staff` role)
- **Request Body**: `CustomerCreateInput`

### `GET /api/v1/customers/:id`
Retrieves a specific customer by ID within the authenticated organization.

### `PATCH /api/v1/customers/:id`
Updates customer details.

### `DELETE /api/v1/customers/:id`
Soft deletes / archives a customer (`is_active = false`).

---

## 4. Item Management Endpoints

### `GET /api/v1/items`
Returns a paginated list of active organization inventory items & services.

- **Authentication**: Required
- **Query Parameters**:
  - `search` (optional): Filter by item name, item code, SKU, category, or HSN/SAC code.
  - `category` (optional): Filter by item category.
  - `is_active` (optional, default `true`): Filter active or inactive items.
  - `page` (optional, default `1`): Page number.
  - `pageSize` (optional, default `25`, max `100`): Items per page.

### `POST /api/v1/items`
Creates a new item or service. Automatically generates organization-scoped item codes (`ITEM-00001`).

- **Authentication**: Required (`Owner`, `Admin`, `Accountant`, or `Staff` role)

### `GET /api/v1/items/:id`
Retrieves a specific item by ID.

### `PATCH /api/v1/items/:id`
Updates item details.

### `DELETE /api/v1/items/:id`
Soft deletes / archives an item (`is_active = false`).
