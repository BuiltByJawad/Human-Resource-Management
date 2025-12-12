# API Documentation

## Accessing Documentation

Once the server is running, visit:
- **Development:** http://localhost:5000/api-docs
- **Staging:** https://api-staging.hrm.com/api-docs
- **Production:** https://api.hrm.com/api-docs

## Features

- **Interactive API Explorer** - Try out API calls directly from browser
- **Authentication Testing** - Test endpoints with JWT tokens
- **Request/Response Examples** - See example payloads
- **Schema Validation** - View all data models
- **Complete Coverage** - All 13 modules documented

## Quick Start

### 1. Authenticate

```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Copy the `accessToken` from the response.

### 2. Click "Authorize" button in Swagger UI

Paste the token and click "Authorize".

### 3. Try any endpoint

All authenticated endpoints will now work!

## Example Requests

### Get All Employees

```bash
curl -X GET "http://localhost:5000/api/employees?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Employee

```bash
curl -X POST "http://localhost:5000/api/employees" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "departmentId": "uuid-here",
    "roleId": "uuid-here",
    "hireDate": "2025-01-01",
    "salary": 50000
  }'
```

## Module Coverage

✅ **Auth Module**
- Login/Logout
- Register
- Password Reset
- User Invites
- Profile Management

✅ **Employee Module**
- CRUD operations
- Advanced search
- Pagination
- Status management

✅ **Department Module**  
- Department management
- Employee assignment

✅ **Leave Module** (Legacy routes)
- Coming soon

✅ **Attendance Module** (Legacy routes)
- Coming soon

... and 8 more modules!

## Response Formats

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Validation errors if applicable
  ]
}
```

### Paginated Response

```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## Adding Documentation

When creating new endpoints, add Swagger annotations:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Endpoint description
 *     tags: [ModuleName]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/your-endpoint', controller.action);
```

## Next Steps

- Add Swagger docs to remaining modules
- Document all DTOs
- Add more request/response examples
- Export as OpenAPI 3.0 spec for API clients
