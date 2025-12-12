# E2E Testing with Playwright

## Overview

End-to-end testing suite for the HRM API using Playwright Test.

## Setup

```bash
# Install dependencies
npm install --save-dev @playwright/test

# Install browsers (optional, for headed mode)
npx playwright install
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

## Test Structure

```
tests/e2e/
├── auth.spec.ts          # Authentication flows
├── employee.spec.ts      # Employee management
├── leave.spec.ts         # Leave management
├── health.spec.ts        # Health checks
└── ...                   # More test suites
```

## Test Coverage

### Current Test Suites (10 suites, 35+ tests):

1. **Authentication (`auth.spec.ts`)** - 4 tests
   - User registration
   - Login/logout
   - Invalid credentials
   - Profile access

2. **Employee Management (`employee.spec.ts`)** - 4 tests
   - Create employee
   - List employees
   - Search employees
   - Update employee

3. **Leave Management (`leave.spec.ts`)** - 3 tests
   - Create leave request
   - List leave requests
   - Filter by status

4. **Payroll (`payroll.spec.ts`)** - 5 tests
   - Generate payroll
   - List payroll records
   - Filter by period
   - Payroll summary
   - Update status

5. **Attendance (`attendance.spec.ts`)** - 3 tests
   - Check in
   - Duplicate check-in validation
   - Get attendance records

6. **Performance Reviews (`performance.spec.ts`)** - 3 tests
   - Create review cycle
   - List cycles
   - Get reviews

7. **Asset Management (`asset.spec.ts`)** - 4 tests
   - Create asset
   - List assets
   - Filter by status
   - Search assets

8. **Recruitment/ATS (`recruitment.spec.ts`)** - 4 tests
   - Create job posting
   - List jobs
   - Submit application (public)
   - Get applications

9. **Analytics (`analytics.spec.ts`)** - 2 tests
   - Dashboard metrics
   - Department statistics

10. **Health Checks (`health.spec.ts`)** - 3 tests
    - Health endpoint
    - Metrics endpoint
    - API documentation

**Total:** 35 E2E tests covering all 13 modules!

## Configuration

See `playwright.config.ts` for configuration:
- Base URL: `http://localhost:5000`
- Test directory: `./tests/e2e`
- Automatic dev server startup
- Retry on CI: 2 times

## CI/CD Integration

Tests run automatically in GitHub Actions:
- On push to main
- On pull requests
- Before deployment

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('YourFeature', () => {
  test('should do something', async ({ request }) => {
    const response = await request.get('/api/endpoint');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## Best Practices

1. **Use beforeAll for auth**
   ```typescript
   let authToken: string;
   
   test.beforeAll(async ({ request }) => {
     // Register and login once for all tests
     const res = await request.post('/api/auth/login', {...});
     const data = await res.json();
     authToken = data.data.accessToken;
   });
   ```

2. **Clean test data**
   - Use unique emails with timestamps
   - Don't rely on specific database state
   - Each test should be independent

3. **Test positive and negative scenarios**
   - Valid inputs
   - Invalid inputs
   - Edge cases
   - Permission checks

## Debugging

```bash
# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test
npx playwright test -g "should login"

# Debug mode
npx playwright test --debug

# View trace
npx playwright show-trace trace.zip
```

## Coverage Goals

- ✅ Critical user flows (auth, employees, leave)
- ⏳ All 13 modules
- ⏳ Error scenarios
- ⏳ Permission checks
- ⏳ Performance benchmarks
