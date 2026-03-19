# Health Platform - Phase 1 Implementation Guide

## Overview
This is a GDPR and German TISAX-compliant healthcare platform built with NestJS (backend), Next.js (frontend), PostgreSQL (database), and comprehensive security infrastructure.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 21+
- npm or yarn

### Environment Setup

1. **Copy environment file:**
```bash
cp packages/server/.env.example packages/server/.env
```

2. **Update .env with your settings:**
```bash
JWT_SECRET=your-secure-random-string-here
DATABASE_PASSWORD=your-secure-db-password
```

### Start Development Environment

```bash
# Start all services (API, databases, frontends)
docker-compose up -d

# Services will be available at:
# - API: http://localhost:3003
# - Main Web: http://localhost:3000
# - Dashboard: http://localhost:3001
# - Patient Portal: http://localhost:3002
# - PgAdmin: http://localhost:5050
```

### Install Dependencies (for local development)

```bash
# From root directory
npm install

# Or in each package
cd packages/server && npm install
cd packages/web && npm install
cd packages/web-dashboard && npm install
cd packages/web-patient && npm install
cd packages/web-shared && npm install
```

### Database Setup

Migrations are automatically applied when the API starts (TypeORM synchronize is enabled in development).

For production, use proper TypeORM migrations:
```bash
cd packages/server
npm run migration:generate -- src/migrations/InitialSchema
npm run migration:run
```

## Project Structure

```
.
├── docker-compose.yml           # Development orchestration
├── packages/
│   ├── server/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/            # Authentication module (JWT, MFA, DPA)
│   │   │   ├── entities/        # TypeORM entities (GDPR-compliant models)
│   │   │   ├── modules/         # Feature modules (patients, appointments, dashboard)
│   │   │   ├── common/          # Shared services (encryption, audit, consent)
│   │   │   ├── config/          # Configuration files
│   │   │   └── main.ts          # Application entry point
│   │   └── Dockerfile
│   ├── web/                     # Main Next.js web app
│   ├── web-dashboard/           # Admin/Provider dashboard
│   ├── web-patient/             # Patient portal
│   └── web-shared/              # Shared UI components & hooks
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/          # shadcn/ui components
│       │   │   └── ...Compliance components (ConsentBanner, AuditTrailViewer, etc.)
│       │   ├── hooks/           # Custom React hooks (useAuth, useAppointments, etc.)
│       │   └── index.ts         # Barrel exports
│       └── package.json
└── scripts/
    └── init-db.sql              # Database initialization
```

## Key Features Implemented

### Phase 1 Deliverables

#### 1. Authentication & Authorization
- ✅ JWT-based authentication with 15-min access token + 7-day refresh token
- ✅ MFA (TOTP) support, mandatory for providers
- ✅ Role-based access control (patient, provider, admin)
- ✅ Password hashing with argon2 (NIST-approved)
- ✅ DPA acceptance tracking with versioning

#### 2. Patient Records Management
- ✅ CRUD operations with role-based access control
- ✅ AES-256-GCM encryption at rest
- ✅ TLS 1.3 encryption in transit
- ✅ Soft-delete with audit trail preservation
- ✅ GDPR right to data portability (export as encrypted JSON/XML)

#### 3. Appointment Scheduling
- ✅ Telemedicine & in-person appointment management
- ✅ Per-appointment consent recording (GDPR Article 7)
- ✅ Recording consent with 90-day auto-deletion
- ✅ Appointment status tracking (scheduled, completed, cancelled)

#### 4. Compliance & Audit
- ✅ Immutable audit logging (all data access/modifications)
- ✅ Consent versioning with hash verification
- ✅ Aggregated, anonymized dashboard metrics
- ✅ Security incident logging and breach notification framework

#### 5. Frontend Components
- ✅ Shared UI component library (shadcn/ui)
- ✅ Compliance components (ConsentBanner, AppointmentConsentForm, AuditTrailViewer)
- ✅ Authentication hooks (useAuth, useAppointments, usePatientRecords)
- ✅ Responsive, accessible, dark-mode ready

#### 6. Security Infrastructure
- ✅ Helmet.js for HTTP security headers
- ✅ CORS configuration (EU-only by default)
- ✅ Rate limiting configuration (ready for implementation)
- ✅ Single sign-on architecture
- ✅ Non-root Docker containers

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register              # Register new user
POST   /api/v1/auth/login                 # Login with email/password
POST   /api/v1/auth/refresh               # Refresh JWT access token
GET    /api/v1/auth/me                    # Get current user profile
POST   /api/v1/auth/logout                # Logout & invalidate session
POST   /api/v1/auth/mfa/setup             # Initialize MFA (get QR code)
POST   /api/v1/auth/mfa/confirm           # Confirm MFA setup with TOTP
```

### Patient Records
```
GET    /api/v1/patients/:id                # Get patient profile
POST   /api/v1/patients/:id/records        # List patient's clinical records
POST   /api/v1/records                     # Create new clinical record
GET    /api/v1/records/:id                 # Read clinical record
PATCH  /api/v1/records/:id                 # Update clinical record
DELETE /api/v1/records/:id                 # Delete clinical record
GET    /api/v1/patients/:id/export         # Export patient data (GDPR Article 20)
POST   /api/v1/patients/:id/erasure        # Request account & data deletion (GDPR Article 17)
```

### Appointments
```
POST   /api/v1/appointments                # Create appointment
GET    /api/v1/appointments                # List appointments (filtered by role)
GET    /api/v1/appointments/:id            # Get appointment details
PATCH  /api/v1/appointments/:id            # Update appointment
DELETE /api/v1/appointments/:id            # Cancel appointment
POST   /api/v1/appointments/:id/consent    # Record consent (data + recording)
```

### Dashboard
```
GET    /api/v1/dashboard/metrics           # Admin metrics (anonymized)
GET    /api/v1/dashboard/compliance        # Compliance metrics
GET    /api/v1/dashboard/appointments      # Provider/patient appointments
```

## GDPR & TISAX Compliance

### Implemented Controls
1. **Data Protection by Design**
   - Encryption: AES-256 at rest, TLS 1.3 in transit
   - Minimum data collection (data minimization)
   - Role-based access control (principle of least privilege)

2. **User Rights**
   - Right to access (Article 15): `/api/v1/patients/:id/export`
   - Right to rectification (Article 16): Update endpoints
   - Right to erasure (Article 17): `/api/v1/patients/:id/erasure`
   - Right to data portability (Article 20): Export endpoint
   - Right to object (Article 21): Consent withdrawal

3. **Accountability**
   - Immutable audit logging of all data access
   - Consent version tracking
   - Data Processing Agreement (DPA) acceptance
   - Breach incident logging

4. **Data Residency**
   - Database: EU-only (configure for Germany by default)
   - No third-party US cloud processors without Privacy Shield
   - TISAX C3 compliant infrastructure

### Future Compliance Tasks (Phase 2)
- [ ] Implement data subprocessor list and notification system
- [ ] Deploy intrusion detection system (IDS)
- [ ] Configure automated backup & disaster recovery testing
- [ ] Implement advanced threat protection (WAF, DDOS mitigation)
- [ ] Set up SOAR (Security Orchestration & Response) platform
- [ ] Privacy Impact Assessment (DPIA) documentation automation
- [ ] Regulatory audit logging & reporting (for authorities)

## Development Workflow

### Adding a New Feature

1. **Backend (NestJS)**
```bash
cd packages/server

# Create new module
nest g module features/my-feature
nest g service features/my-feature
nest g controller features/my-feature

# Update app.module.ts to import MyFeatureModule
```

2. **Frontend (Next.js)**
```bash
cd packages/web

# Create new page
mkdir -p src/app/my-feature
touch src/app/my-feature/page.tsx

# Create custom hook in web-shared
touch ../web-shared/src/hooks/use-my-feature.ts
```

3. **Shared Components**
```bash
cd packages/web-shared

# Add new UI component
touch src/components/ui/my-component.tsx
touch src/components/MyComponent.tsx   # Business logic wrapper
```

## Debugging

### View API Logs
```bash
docker-compose logs api -f
```

### View Database
```bash
# PgAdmin at http://localhost:5050
# Login with credentials from docker-compose.yml
```

### Test Authentication
```bash
curl -X POST http://localhost:3003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  }'
```

## Security Best Practices

1. **Never commit secrets** - Use `.env` files (in `.gitignore`)
2. **Rotate JWT secrets** quarterly - Use AWS Secrets Manager in production
3. **Enable MFA** for all provider accounts
4. **Regular security audits** - Use OWASP Top 10 as checklist
5. **Dependency scanning** - `npm audit` before deployment
6. **Database backups** - Daily encrypted backups with retention policy
7. **Log monitoring** - Use ELK stack or equivalent in production

## Deployment (Production Checklist)

- [ ] Database: PostgreSQL on managed service (AWS RDS, Azure Database)
- [ ] KMS: AWS KMS or HashiCorp Vault for key management
- [ ] Secrets: AWS Secrets Manager for credentials rotation
- [ ] Container Registry: AWS ECR for Docker image management
- [ ] Orchestration: ECS/EKS or Kubernetes for container orchestration
- [ ] Load Balancing: AWS ALB/NLB for high availability
- [ ] CDN: CloudFront for static assets
- [ ] Monitoring: CloudWatch, Prometheus, Grafana
- [ ] Logging: CloudWatch Logs, ELK Stack
- [ ] WAF: AWS WAF + AWS Shield for DDoS protection
- [ ] Compliance: Enable VPC Flow Logs, CloudTrail, Config
- [ ] Backup: Daily snapshots, tested restore procedures
- [ ] Disaster Recovery: Multi-AZ setup, 4-hour RTO target

## Support & License

For issues or questions, contact: dpo@yourcompany.de

This project is proprietary and confidential.
