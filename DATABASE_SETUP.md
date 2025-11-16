# HRM System - Database Setup Instructions

## PostgreSQL Setup

### 1. Install PostgreSQL

**Windows:**
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember your postgres user password
4. Default port: 5432

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE hrm_db;

-- Create user with strong password
CREATE USER hrm_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hrm_db TO hrm_user;

-- Connect to the new database
\c hrm_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Exit
\q
```

### 3. Configure Database Connection

**Update backend/.env file:**
```
DATABASE_URL="postgresql://hrm_user:279173@localhost:5432/hrm_db"
```

### 4. Run Database Migrations

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5. Verify Database Setup

**Test connection:**
```bash
npm run dev
```

**Check database tables:**
```sql
-- Connect to database
psql -U hrm_user -d hrm_db

-- List tables
\dt

-- Check if seed data was created
SELECT * FROM users LIMIT 5;
SELECT * FROM employees LIMIT 5;
SELECT * FROM departments LIMIT 5;
```

## Redis Setup

### 1. Install Redis

**Windows:**
1. Download Redis for Windows from https://github.com/microsoftarchive/redis/releases
2. Install and run Redis service
3. Default port: 6379

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### 3. Configure Redis Connection

**Update backend/.env file:**
```
REDIS_URL=redis://localhost:6379
```

## Security Configuration

### 1. Generate Strong Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Update Environment Variables

**backend/.env:**
```
JWT_SECRET=your-generated-jwt-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
ENCRYPTION_KEY=your-generated-encryption-key
```

## Database Backup and Recovery

### Backup Database
```bash
# Create backup
pg_dump -U hrm_user -d hrm_db -f hrm_backup.sql

# Backup with compression
pg_dump -U hrm_user -d hrm_db | gzip > hrm_backup.sql.gz
```

### Restore Database
```bash
# Restore from backup
psql -U hrm_user -d hrm_db -f hrm_backup.sql

# Restore from compressed backup
gunzip -c hrm_backup.sql.gz | psql -U hrm_user -d hrm_db
```

## Performance Optimization

### 1. Database Indexes
The Prisma schema includes optimized indexes for:
- User authentication (email, role)
- Employee searches (department, manager, status)
- Attendance records (employee, date)
- Leave requests (employee, status)

### 2. Connection Pooling
PostgreSQL connection pooling is configured in the application for optimal performance.

### 3. Query Optimization
- Use Prisma's query optimization features
- Implement pagination for large datasets
- Cache frequently accessed data in Redis

## Troubleshooting

### Common Issues

**Connection refused:**
- Check PostgreSQL service status
- Verify port 5432 is open
- Check firewall settings

**Authentication failed:**
- Verify username and password
- Check pg_hba.conf configuration
- Ensure user has proper privileges

**Redis connection issues:**
- Check Redis service status
- Verify port 6379 is open
- Check Redis configuration

### Logs and Monitoring
- Application logs: `backend/logs/`
- Database logs: PostgreSQL logs location varies by OS
- Redis logs: Usually in `/var/log/redis/`

For additional support, check the main README.md file or create an issue in the repository.