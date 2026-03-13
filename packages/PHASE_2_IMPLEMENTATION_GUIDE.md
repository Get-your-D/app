# Phase 2 Implementation Guide

## Overview

Phase 2 extends the Phase 1 foundation with complete frontend pages, email notifications, production-grade deployment configurations, testing infrastructure, CI/CD pipelines, and monitoring systems. This guide provides setup and deployment instructions.

## Table of Contents

1. [Frontend Deployment](#frontend-deployment)
2. [Email Service Setup](#email-service-setup)
3. [Testing & CI/CD](#testing--cicd)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Security Hardening](#security-hardening)
7. [Disaster Recovery](#disaster-recovery)
8. [Compliance Checklist](#compliance-checklist)

---

## Frontend Deployment

### 3 Patient Portals Deployed

#### 1. **Patient Portal** (`web`)
Main patient-facing application with patient-centric features:
- Authentication (login/register with MFA)
- Dashboard with upcoming appointments
- Clinical records browser (view, download, export)
- Appointment management (schedule, reschedule, cancel)
- Settings (password change, data deletion request, consent withdrawal)
- GDPR compliance features (data export, right to be forgotten)

**Key Pages:**
- `/login` - Login with MFA support
- `/register` - Registration with consent agreements
- `/dashboard` - Patient home with upcoming appointments
- `/appointments` - Full appointment management
- `/records` - Clinical records viewer
- `/settings` - Account settings & GDPR requests

#### 2. **Provider Dashboard** (`web-dashboard`)
Admin and healthcare provider management portal:
- Role-based access control (ADMIN, COMPLIANCE_OFFICER)
- System-wide metrics (patient count, appointments, GDPR requests)
- Weekly activity charts (appointments, registrations)
- GDPR request management & processing
- Compliance status monitoring (GDPR, TISAX C3)
- Security incident tracking & investigation
- Immutable audit log browser

**Key Pages:**
- `/dashboard` - Main admin dashboard with metrics
- `/gdpr` - GDPR request processor
- `/compliance` - Compliance status & evidence
- `/security` - Incident response & investigation
- `/audit` - Audit log viewer

#### 3. **Patient Portal (Simplified)** (`web-patient`)
Mobile-optimized, simplified patient experience:
- Lightweight dashboard with appointment summary
- Quick appointment scheduling
- Basic health record access
- One-click emergency contact
- GDPR rights reminder
- Optimized for mobile devices

**Key Pages:**
- `/dashboard` - Simplified home with appointments
- `/appointments` - Quick appointment manager
- `/health-records` - Simple record viewer

### Frontend Deployment Steps

```bash
# 1. Install dependencies
yarn install

# 2. Build all frontend apps
yarn build:web
yarn build:web-dashboard
yarn build:web-patient

# 3. Deploy to Vercel/AWS Amplify/Netlify
# Each app has separate Next.js configuration
# Deploy with: next build && next export

# 4. Environment variables (production)
NEXT_PUBLIC_API_URL=https://api.healthcare.com/api/v1
NEXT_PUBLIC_APP_NAME=Healthcare Portal
NODE_ENV=production

# 5. CDN Configuration
# Use CloudFront for static assets
# Cache TTL: 3600s (1 hour) for app code
# Cache TTL: 86400s (24h) for assets (/public)
```

---

## Email Service Setup

### Email Provider Integration

The `EmailService` supports multiple providers:

#### AWS SES (Simple Email Service)
```bash
# Configure in .env
SMTP_HOST=ses
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
SMTP_FROM=noreply@healthcare.com
```

#### SMTP (Self-hosted, SendGrid, Gmail)
```bash
# Configure in .env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
SMTP_FROM=noreply@healthcare.com
```

### Email Templates

EmailService implements 5 GDPR-compliant templates:

#### 1. Password Reset Email
- Expiry: 24 hours
- Includes unsubscribe link
- Legal footer with DPO contact

#### 2. Appointment Confirmation
- Receipt with appointment details
- Meeting link (telemedicine) or location (in-person)
- Cancellation instructions

#### 3. Appointment Reminder
- Sent 24 hours before appointment
- Reschedule link
- Patient-friendly format

#### 4. Breach Notification Email
- Required under GDPR Article 34
- Incident details & timeline
- Remediation steps
- DPO contact for questions
- Plain text + HTML versions

#### 5. GDPR Data Export Email
- Download link (expires in 7 days)
- Data in CSV/JSON format
- Portability rights confirmation

### Email Service Usage

```typescript
import { EmailService } from './common/services/email.service';

// Inject into your controller
constructor(private emailService: EmailService) {}

// Send password reset
await this.emailService.sendPasswordResetEmail(
  patient.email,
  resetToken,
  24 // hours
);

// Send appointment confirmation
await this.emailService.sendAppointmentConfirmationEmail(patient.email, {
  patientName: 'Max Müller',
  providerName: 'Dr. Schmidt',
  appointmentDate: new Date('2024-03-20T10:00:00'),
  type: 'telemedicine',
  meetingUrl: 'https://meet.healthcare.com/apt-123',
});

// Send breach notification
await this.emailService.sendBreachNotificationEmail(admin.email, {
  incidentType: 'Unauthorized Access Attempt',
  affectedDataTypes: ['Names', 'Email Addresses'],
  discoveryDate: new Date(),
  estimatedAffectedCount: 150,
  dpoEmail: 'dpo@healthcare.com',
  remediationSteps: [
    'Patched authentication vulnerability',
    'Forced password reset for affected users',
    'Enhanced monitoring enabled',
  ],
});
```

### Email Queue (Optional)

For production reliability, implement Bull queues:

```typescript
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('emails')
    private emailQueue: Queue,
  ) {}

  async enqueuePasswordReset(email: string, resetToken: string) {
    await this.emailQueue.add(
      'password-reset',
      { email, resetToken },
      {
        delay: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }
}
```

---

## Testing & CI/CD

### Test Coverage Goals
- **Unit Tests**: 80%+ for services and utilities
- **E2E Tests**: Critical user flows (auth, appointments, GDPR)
- **Integration Tests**: Database, cache, email service

### Running Tests

```bash
# Unit tests
yarn test:unit

# E2E tests
yarn test:e2e

# Coverage report
yarn test:coverage

# Watch mode (development)
yarn test:watch
```

### CI/CD Pipeline (GitHub Actions)

**Trigger:** Push to `main` (production) or `develop` (staging)

**Stages:**
1. **Lint** (ESLint, Prettier, TypeScript compilation)
2. **Test** (Jest unit tests, Supertest e2e tests)
3. **Build** (Docker image build & push to registries)
4. **Security Scan** (Snyk vulnerability scanning)
5. **Deploy** (AWS ECS deployment with health checks)

**Configuration:** `.github/workflows/ci-cd.yml`

### Running CI/CD Locally

```bash
# Lint check
yarn lint

# Format check
yarn format:check

# Run full test suite
yarn test:full

# Build Docker image
docker build -t healthcare-api:latest .

# Security scan
snyk test
```

---

## Production Deployment

### Infrastructure as Code (Terraform)

**Files:**
- `terraform/main.tf` - Core infrastructure (VPC, RDS, Redis, KMS, Security Groups)
- `terraform/variables.tf` - Configuration variables

**Resources Managed:**
- **VPC** with 3 AZs, private/public/database subnets
- **RDS Aurora PostgreSQL** cluster with Multi-AZ & automated backups
- **ElastiCache Redis** cluster with encryption & AUTH token
- **KMS Keys** for RDS & Redis encryption
- **CloudWatch Alarms** for CPU, storage, error rates
- **SNS Topics** for incident alerts

### Terraform Deployment

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Plan deployment
terraform plan -var="environment=production" -out=tfplan

# 3. Apply changes
terraform apply tfplan

# 4. Output database & cache endpoints
terraform output rds_cluster_endpoint
terraform output redis_endpoint

# 5. Update .env.production with outputs
POSTGRES_HOST=<rds-endpoint>
REDIS_URL=redis://:<auth-token>@<redis-endpoint>:6379
```

### ECS Deployment

```dockerfile
# Dockerfile (multi-stage build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs ./dist ./dist

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/main.js"]
```

### Health Checks

**Endpoints:**
- `GET /health` - Kubernetes liveness probe
- `GET /health/ready` - Readiness (database + cache)
- `GET /health/live` - Basic uptime
- `GET /health/detailed` - Full system status & compliance

**Response Example:**
```json
{
  "status": "operational",
  "services": {
    "api": "operational",
    "database": "operational",
    "cache": "operational"
  },
  "compliance": {
    "gdpr": "compliant",
    "encryption": "AES-256-GCM",
    "auditLogging": "enabled"
  },
  "metrics": {
    "uptime": 86400,
    "memory": {
      "heapUsed": 256,
      "heapTotal": 512
    }
  }
}
```

---

## Monitoring & Alerting

### CloudWatch Metrics

**Collected Metrics:**
- **RDS:** CPU, Free Storage, Database Connections, Replication Lag
- **Redis:** CPU, Network Bytes In/Out, Evictions, Connection Count
- **API:** Request Count, 4xx/5xx Errors, Latency, Authorizations

### Alarms Configured

```terraform
# High RDS CPU (>80%)
aws_cloudwatch_metric_alarm.rds_cpu

# Low RDS Storage (<5GB)
aws_cloudwatch_metric_alarm.rds_storage

# High Error Rate (>5%)
aws_cloudwatch_metric_alarm.error_rate

# Slow Response Time (>500ms p99)
aws_cloudwatch_metric_alarm.latency
```

### Grafana Dashboards

**Dashboard 1: Infrastructure Health**
- RDS metrics (CPU, storage, connections)
- Redis metrics (connections, evictions)
- Network throughput & errors

**Dashboard 2: Application Performance**
- API request rate & latency
- Authentication success/failure rate
- GDPR request processing time

**Dashboard 3: Security Events**
- Failed login attempts (spike detection)
- Data export requests (anomaly detection)
- Breach incidents & notifications sent

**Dashboard 4: Compliance Status**
- Encryption audit (verify AES-256-GCM)
- Audit log entries (verify immutability)
- GDPR request completion rate

### Alerting (PagerDuty Integration)

```bash
# Send SLA-managed alerts to on-call team
# Rules:
# - High severity: RDS failure, auth service down
# - Medium severity: High error rate, slow API
# - Low severity: Storage warning, backup failure
```

---

## Security Hardening

### Rate Limiting Middleware

```typescript
// Applied to all endpoints
apiLimiter: 100 requests/minute per IP
authLimiter: 5 login attempts/15 minutes per IP
passwordResetLimiter: 3 resets/hour per IP
dataExportLimiter: 1 export/24 hours per user

// Rate limit headers returned:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1647345600
```

### Input Validation & Sanitization

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsEmail()
  email: string;

  // Sanitize before saving
  notes?: string; // sanitizeHtml(notes)
}
```

### CORS & Security Headers

```typescript
// Helmet.js configuration in server-setup.ts
app.use(helmet.default());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // For Next.js
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.healthcare.com'],
    frameAncestors: ["'none'"],
  },
}));

// CORS: Only accept medical.healthcare.com, dashboard.healthcare.com, patients.healthcare.com
app.enableCors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
});
```

### SSL/TLS Configuration

```bash
# AWS Certificate Manager (ACM)
# Set up automatic renewal for:
# - api.healthcare.com
# - dashboard.healthcare.com
# - patients.healthcare.com

# All traffic must use TLS 1.3
# Use only strong cipher suites
```

---

## Disaster Recovery

### Automated Backups

**RDS Aurora:**
- Continuous backup to S3
- Retention: 30 days
- Automatic snapshots every 6 hours
- Point-in-time recovery available

**ElastiCache Redis:**
- Automatic backup every 24 hours
- Retention: 7 days
- Encryption at rest & in transit

### Recovery Time Objective (RTO)

| Service | RTO | Method |
|---------|-----|--------|
| Database | 15 minutes | RDS failover + restore |
| Cache | 5 minutes | Recreate from template |
| API | 5 minutes | ECS task replacement |
| Frontend | 10 minutes | CloudFront invalidation + redeploy |

### Backup Testing

```bash
# Monthly test restore (required for compliance)
# 1. Create test RDS cluster from snapshot
# 2. Run migration scripts
# 3. Verify data integrity
# 4. Test application connection
# 5. Delete test cluster
```

### Data Retention Policy

```
Patient Records:
- Active patient: Keep 7 years after last contact
- Inactive patient: Keep 1 year post-deletion request
- Audit logs: Keep 3 years (GDPR Article 32)
- Backups: Keep 30 days (rolling window)

Medical Device Data (MDR/IVDR):
- Device events: Lifetime of device + 2 years
- Adverse events: 10 years
```

---

## Compliance Checklist

### GDPR (General Data Protection Regulation)

- [x] **Article 5:** Lawful basis, transparency, purpose limitation
  - Implemented: DPA consent version, policy transparency
- [x] **Article 12-14:** Right to access & be informed
  - Implemented: `/api/v1/gdpr/export` endpoint, welcome emails
- [x] **Article 15:** Right of access
  - Implemented: Patient portal "Download My Data"
- [x] **Article 17:** Right to be forgotten
  - Implemented: `/api/v1/gdpr/delete` with 30-day grace
- [x] **Article 20:** Data portability
  - Implemented: CSV/JSON export with encryption
- [x] **Article 32:** Security measures
  - Implemented: AES-256-GCM, TLS 1.3, audit logging
- [x] **Article 33:** Breach notification
  - Implemented: EmailService.sendBreachNotificationEmail()
- [x] **Article 34:** Affected subject notification
  - Implemented: Direct email within 72 hours

### TISAX C3 (German Medical Data)

- [x] Encryption: AES-256-GCM (>128-bit key)
- [x] Access control: Role-based (RBAC)
- [x] Audit trail: Immutable logging with retention
- [x] Data residency: EU/Germany only (`DATA_RESIDENCY_COUNTRY=DE`)
- [x] Key management: KMS rotation enabled
- [x] Backup encryption: All backups encrypted
- [x] PII handling: No logging of sensitive data

### MDR/IVDR (Medical Device Regulation)

- [x] Device traceability: Recorded in clinical records
- [x] Adverse event reporting: Integration ready
- [x] Supplier data: Versioned in consent records
- [x] Post-market surveillance: Metrics dashboard

### NIS2 Directive (Critical Infrastructure)

- [x] Incident response: PagerDuty integration
- [x] Vulnerability scanning: Snyk in CI/CD
- [x] Penetration testing: Quarterly planned
- [x] Security awareness: Tech team training

---

## Troubleshooting

### Common Issues

**1. Database Connection Timeout**
```bash
# Check RDS security group allows inbound on port 5432
# Verify RDS endpoint is in .env
# Check database subnet routing
# Increase pool size if many connections
```

**2. Email Service Failures**
```bash
# Verify SMTP credentials in Secrets Manager
# Check SES sending limit (default 1 email/second)
# Enable SES sandbox mode for testing
# Monitor CloudWatch logs for SMTP errors
```

**3. Rate Limiting Too Strict**
```bash
# Adjust limits in rate-limit.middleware.ts
# Whitelist trusted IPs: authLimiter.skip()
# Monitor X-RateLimit headers in production
```

### Support & Escalation

**For urgent issues:**
1. Check CloudWatch alarms
2. Review application logs
3. Contact PagerDuty on-call engineer
4. Escalate to Security team if GDPR-related

---

## Next Steps

1. **Test Phase 2** - Run full test suite & E2E tests
2. **Staging Deployment** - Deploy to staging environment first
3. **Compliance Audit** - Internal GDPR/TISAX audit
4. **Load Testing** - Verify 1000+ concurrent users
5. **Penetration Test** - Third-party security assessment
6. **Production Launch** - Monitor closely first 48h

---

**Document Version:** 2.0 (Phase 2)  
**Last Updated:** 13 March 2026  
**Maintainer:** Healthcare Platform Team  
**Compliance Officer:** DPO@healthcare.com
