-- 1. Create Roles
-- Note: 'permissions' column does not exist on Role table (it's a separate table).
-- We will just create the Roles themselves so you can login.

INSERT INTO "Role" ("id", "name", "description", "isSystem", "updatedAt")
VALUES 
  ('role-admin', 'Admin', 'Administrator with full access', true, NOW()),
  ('role-hr', 'HR', 'Human Resources Manager', true, NOW()),
  ('role-employee', 'Employee', 'Regular Employee', true, NOW()),
  ('role-manager', 'Manager', 'Department Manager', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 2. Create Users (Password is 'password123')
-- Hash: $2b$10$EpRnTzVlqHNP0zQx.Zuxz.kjl043e22.A.12345/ABCDE
INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "roleId", "status", "verified", "createdAt", "updatedAt")
VALUES
  -- Admin
  ('user-admin', 'admin@hrm.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4hZ1.WFGe.', 'Admin', 'User', 'role-admin', 'active', true, NOW(), NOW()),
  
  -- HR
  ('user-hr', 'hr@hrm.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4hZ1.WFGe.', 'HR', 'Manager', 'role-hr', 'active', true, NOW(), NOW()),

  -- Employee
  ('user-employee', 'employee@hrm.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4hZ1.WFGe.', 'John', 'Doe', 'role-employee', 'active', true, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
