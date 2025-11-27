# Permissions & Branding Implementation Plan

This document describes the exact changes that will be made to:

- Wire **real permissions** from the backend into the frontend (so Settings and other modules are actually gated).
- Finalize **branding uploads** (logo + favicon) so they work end-to-end and can optionally be persisted in the database.
- Make the **Settings page back button** consistent with other modules (Performance, Assets, etc.).

No code below has been applied yet. This is the plan for your review.

---

## 1. Backend: Real Permissions

### 1.1. Seed Permissions and Roles

Create or extend a Prisma seed script to:

1. **Create permissions** that match the frontend `PERMISSIONS` constant, using `resource.action` pairs, for example:
   - `auth.update_own_profile`
   - `auth.change_own_password`
   - `notifications.update_own_notifications`
   - `settings.manage_notifications`
   - `settings.manage_system_settings`
   - `employees.view_employees`, `employees.manage_employees`
   - `attendance.view_attendance`
   - `payroll.view_payroll`
   - `reports.view_reports`
   - `compliance.view_compliance`

2. **Create roles**:
   - `Super Admin` (system role, full access).
   - `HR Manager` (HR + system configuration, but not everything).
   - `Employee` (own data only).

3. **Assign permissions to roles** via `RolePermission`:
   - `Super Admin`: gets **all permissions**.
   - `HR Manager`: gets HR-related and system settings permissions.
   - `Employee`: gets only own-profile, own-password, own-notifications permissions.

4. Expose / document a command, e.g.:

   ```bash
   npx prisma db seed
   # or: npm run seed
   ```

### 1.2. Ensure Login Returns Permissions

The `login` and `getProfile` handlers already flatten permissions to strings like `"settings.manage_system_settings"`. After seeding:

- Verify that `permissions` in the login response contains the seeded permissions.
- Confirm that `authenticate` middleware (`auth.ts`) loads the same permissions into `req.user.permissions`.

No major code change is expected here, mostly verification.

---

## 2. Frontend: Use Real Permissions

### 2.1. Remove Temporary Fallback in `useAuthStore`

Update `frontend/src/store/useAuthStore.ts`:

- In `hasPermission`, `hasAnyPermission`, and `hasAllPermissions`, **remove** the fallback that currently returns `true` when `user.permissions` is empty.
- After change, these helpers will only return `true` when the required permission string is actually present.

This will make:

- Settings admin sections show only for users with the right permissions.
- "My notifications" and "Security" sections gated by their own permissions.
- Sidebar items gated correctly (Payroll, Compliance, Analytics, etc.).

### 2.2. Quick Validation in UI

- Log in as **Super Admin** → should see all Settings admin cards and all sidebar items.
- Log in as **Employee** → should see only personal sections (e.g., Security, My notifications) and a reduced sidebar.

---

## 3. Branding Uploads (Logo + Favicon)

Backend routes and controllers are already created:

- `POST /api/org/branding/logo`
- `POST /api/org/branding/favicon`

with Cloudinary-based uploads and URLs returned in `data.logoUrl` / `data.faviconUrl`.

### 3.1. Verify and Adjust Permissions

- These routes currently use `protect` + `checkPermission('settings', 'manage_system_settings')`.
- After seeding, confirm that your Super Admin / HR Admin roles have this permission, or relax it to a different permission if desired.

### 3.2. Optional: Persist Branding in DB

If you want branding to be stored server-side (not just in localStorage):

1. **Extend Prisma schema** (`CompanySettings` model):

   ```prisma
   model CompanySettings {
     id               String   @id @default(uuid())
     companyName      String   @default("NovaHR Company")
     officeLatitude   Decimal  @db.Decimal(10, 8) @default(23.8103)
     officeLongitude  Decimal  @db.Decimal(11, 8) @default(90.4125)
     maxClockInRadius Int      @default(200)

     logoUrl          String?
     faviconUrl       String?

     createdAt        DateTime @default(now())
     updatedAt        DateTime @updatedAt
   }
   ```

2. **Run migration**:

   ```bash
   npx prisma migrate dev --name add_companysettings_branding
   ```

3. **Update `orgController`** to upsert into `CompanySettings` instead of just returning the URL:

   - On upload, `upsert` a singleton settings row and update `logoUrl` / `faviconUrl`.
   - Optionally add a `GET /api/org/branding` endpoint to read the current branding.

4. **Frontend**: optional enhancement to load branding from backend on app start and sync into `useOrgStore`.

---

## 4. Settings Page Back Button

Make the Settings page back button look and behave like the back buttons used in Performance and Assets modules.

### 4.1. Inspect Existing Back Button

- Locate the back-button implementation used in modules such as:
  - `frontend/src/app/performance/...`
  - `frontend/src/app/assets/...`
- Identify the shared pattern:
  - Likely an `ArrowLeftIcon` button at the top-left.
  - Uses `useRouter` and `router.back()` or navigates to a known route.
  - Tailwind classes for padding, hover, and rounding.

### 4.2. Apply to Settings Page

- Update `frontend/src/app/settings/page.tsx` to include the same header/back button block at the top as other modules, for example:
  - A small circular button with an arrow icon.
  - Positioned above the `Settings` heading.
  - Uses identical classes so it feels consistent.

If those modules use a shared component (e.g., `PageHeader` / `BackButton`), reuse that component instead of duplicating markup.

---

## 5. Order of Operations

1. **Backend**
   - Add/extend seed script for `Role`, `Permission`, and `RolePermission`.
   - Run `prisma migrate` if schema is extended for branding.
   - Run `prisma db seed` (or your seed command).

2. **Frontend**
   - Remove fallback in `useAuthStore` permission helpers.
   - Add/adjust Settings back button to match other modules.

3. **Verification**
   - Log in with different roles and verify:
     - Branding uploads (logo + favicon) succeed and display correct toasts.
     - Only users with `settings.manage_system_settings` can change branding.
     - Settings sections and sidebar items show/hide according to permissions.

Once you approve this plan, I will implement these steps directly in the codebase.
