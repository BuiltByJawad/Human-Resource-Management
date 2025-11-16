# 🏢 HRM System - Enterprise Human Resource Management

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/your-org/hrm/pulls)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![Security: OWASP](https://img.shields.io/badge/security-OWASP%20Compliant-brightgreen)](https://owasp.org/)

A comprehensive, enterprise-grade Human Resource Management system built with modern web technologies following professional development standards and ISO 27001 compliance.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js 20, TypeScript, Prisma ORM
- **Database**: PostgreSQL 15, Redis 7
- **Authentication**: JWT-based authentication
- **Security**: Helmet.js, rate limiting, input validation
- **Testing**: Jest, Supertest
- **Deployment**: Docker, Docker Compose

### Project Structure
```
hrm-system/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── shared/            # Shared types and utilities
├── docker/            # Docker configurations
├── docs/              # Documentation
└── scripts/           # Build and deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hrm-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

### Docker Setup

1. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@hrm.com`
- Password: `Admin123!`

**Sample Employee Accounts:**
- HR Admin: `jane.smith@company.com` / `Employee123!`
- Manager: `bob.johnson@company.com` / `Employee123!`
- Employee: `john.doe@company.com` / `Employee123!`

## 📋 Features

### Core Modules
- **Employee Management**: Complete employee lifecycle management
- **Department Management**: Organizational structure and hierarchy
- **Leave Management**: Request, approval, and tracking system
- **Attendance Tracking**: Time tracking and attendance reports
- **Payroll Management**: Salary processing and payslip generation
- **Performance Evaluation**: Review cycles and goal management
- **Document Management**: Secure document storage and version control
- **Reports & Analytics**: Comprehensive HR metrics and insights
- **System Settings**: Configuration and security management

### Security Features
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting and security headers
- Audit logging for all operations
- Data encryption at rest and in transit

### User Roles
- **Super Admin**: Full system access and configuration
- **HR Admin**: Employee management, payroll, and reports
- **Manager**: Team management and performance reviews
- **Employee**: Personal profile and leave requests

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

### Frontend Testing
```bash
cd frontend
npm run test              # Run unit tests
npm run test:e2e          # Run end-to-end tests
```

## 📊 API Documentation

The API documentation is available at `http://localhost:5000/api-docs` when running the backend server.

### Key Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/departments` - List departments
- `POST /api/leave` - Create leave request
- `GET /api/attendance` - Get attendance records
- `GET /api/reports/dashboard` - Dashboard metrics

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/hrm_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

### Database Configuration
- PostgreSQL connection with SSL support
- Redis for session management and caching
- Prisma ORM for type-safe database operations
- Automatic database migrations

## 📈 Performance & Scalability

### Backend Optimization
- Connection pooling for database
- Redis caching for frequently accessed data
- Query optimization with proper indexing
- Background job processing for heavy operations

### Frontend Optimization
- Next.js server-side rendering (SSR)
- Image optimization and lazy loading
- Code splitting and bundle optimization
- Progressive Web App (PWA) capabilities

## 🔒 Security Best Practices

### Authentication & Authorization
- JWT tokens with short expiration times
- Refresh token rotation
- Password hashing with bcrypt (12 salt rounds)
- Multi-factor authentication support

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection with CSP headers
- Rate limiting on all endpoints

### Compliance
- GDPR compliance for data privacy
- SOC 2 Type II certification readiness
- ISO 27001 information security standards
- Audit trail for all operations

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**
   - Set production environment variables
   - Configure SSL certificates
   - Setup monitoring and logging

2. **Database Setup**
   - Run database migrations
   - Configure backup strategies
   - Setup read replicas if needed

3. **Application Deployment**
   - Build production images
   - Deploy using Docker Compose or Kubernetes
   - Configure load balancing and auto-scaling

### Monitoring & Logging
- Application performance monitoring
- Error tracking and alerting
- Log aggregation and analysis
- Health checks and uptime monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the established coding standards
- Write comprehensive tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api-docs`

## 🏆 Acknowledgments

- Built with modern web technologies
- Following enterprise-grade development standards
- Designed for scalability and maintainability
- Compliant with industry security standards