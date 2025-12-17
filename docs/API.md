# API Documentation

This document provides detailed information about the POS System API endpoints.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints require authentication except for `/login` and `/logout`. Authentication is handled via session cookies.

## Rate Limiting
The API implements rate limiting and brute force protection on authentication endpoints.

## Endpoints

### Authentication

#### POST /login
Authenticate a user and create a session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "number",
    "username": "string",
    "role": "string"
  }
}
```

**Error Responses:**
- 400: Missing username or password
- 401: Invalid credentials
- 429: Too many login attempts

#### POST /logout
Destroy the current session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Users

#### GET /users
Get all users (Admin only).

**Response (200):**
```json
[
  {
    "id": "number",
    "username": "string",
    "role": "string",
    "createdAt": "string"
  }
]
```

#### POST /users
Create a new user (Admin only).

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "string"
}
```

### Products

#### GET /products
Get all products.

**Query Parameters:**
- `search`: Search term
- `category`: Filter by category
- `page`: Page number
- `limit`: Items per page

**Response (200):**
```json
{
  "products": [
    {
      "id": "number",
      "name": "string",
      "price": "number",
      "stock": "number",
      "category": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

#### POST /products
Create a new product.

**Request Body:**
```json
{
  "name": "string",
  "price": "number",
  "stock": "number",
  "category": "string",
  "description": "string"
}
```

#### GET /products/[id]
Get a specific product.

**Response (200):**
```json
{
  "id": "number",
  "name": "string",
  "price": "number",
  "stock": "number",
  "category": "string",
  "description": "string"
}
```

#### PUT /products/[id]
Update a product.

#### DELETE /products/[id]
Delete a product.

### Sales

#### GET /sales
Get all sales transactions.

#### POST /sales
Create a new sale.

**Request Body:**
```json
{
  "customerId": "number",
  "items": [
    {
      "productId": "number",
      "quantity": "number",
      "price": "number"
    }
  ],
  "paymentMethod": "string",
  "total": "number"
}
```

#### GET /sales/[id]
Get a specific sale.

#### PUT /sales/[id]
Update a sale.

#### DELETE /sales/[id]
Cancel a sale.

### Customers

#### GET /customers
Get all customers.

#### POST /customers
Create a new customer.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "rnc": "string",
  "cedula": "string"
}
```

#### GET /customers/search
Search customers.

**Query Parameters:**
- `q`: Search query

#### GET /customers/validate-cedula/[cedula]
Validate a Dominican ID number.

#### GET /customers/validate-rnc/[rnc]
Validate a Dominican RNC.

### Quotations

#### GET /quotations
Get all quotations.

#### POST /quotations
Create a new quotation.

#### GET /quotations/[id]
Get a specific quotation.

#### PUT /quotations/[id]
Update a quotation.

#### DELETE /quotations/[id]
Delete a quotation.

#### POST /quotations/email
Send quotation via email.

### Reports

#### GET /reports/sales
Get sales reports.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

#### GET /reports/inventory
Get inventory reports.

#### GET /reports/customers
Get customer reports.

#### GET /reports/dgii
Get DGII compliance reports.

### Settings

#### GET /settings/email
Get email settings.

#### PUT /settings/email
Update email settings.

#### GET /settings/ncf
Get NCF settings.

#### PUT /settings/ncf
Update NCF settings.

### Backup & Restore

#### GET /backup/list
List available backups.

#### POST /backup/create
Create a new backup.

#### GET /backup/[id]/download
Download a backup file.

#### POST /backup/upload
Upload a backup file.

#### GET /restore/list
List available restore points.

#### POST /restore/create
Create a restore point.

### NCF Management

#### GET /ncf/alerts
Get NCF expiration alerts.

#### GET /ncf/monitor
Monitor NCF sequences.

#### GET /ncf/expiration/[ncf]
Check NCF expiration.

### Dashboard

#### GET /dashboard/stats
Get dashboard statistics.

**Response (200):**
```json
{
  "totalSales": "number",
  "totalRevenue": "number",
  "totalCustomers": "number",
  "lowStockItems": "number",
  "recentSales": [...],
  "topProducts": [...]
}
```

### RNC Sync

#### GET /rnc/search
Search RNC database.

#### POST /rnc/sync
Sync RNC data.

#### POST /rnc/sync/cancel
Cancel RNC sync.

### Email

#### POST /email/test
Send test email.

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

- Login endpoint: 5 attempts per minute per IP
- Other endpoints: 100 requests per minute per user
- Brute force protection: Account lockout after multiple failures