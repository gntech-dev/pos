# POS System API Documentation

## Overview

The POS System provides a RESTful API for managing point-of-sale operations.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API requests require authentication via JWT tokens obtained through the login endpoint.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Response Format

All responses follow this structure:

```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "error": object | null
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

## Endpoints

### Authentication

- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Products

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Sales

- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/{id}` - Get sale details

### And more...

## SDKs and Libraries

- JavaScript/TypeScript client library (planned)
- Postman collection available in `docs/api/`

## Versioning

API versioning follows semantic versioning. Current version: v1.0.0

## Changelog

See `CHANGELOG.md` for API changes and updates.
