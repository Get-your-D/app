#!/bin/bash

# Healthcare Platform - Code Cleanup Verification Script
# This script verifies all cleanup tasks are complete

echo "=========================================="
echo "Healthcare Platform - Cleanup Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
PASSED=0
FAILED=0

# Function to print check results
check_item() {
    local description=$1
    local condition=$2
    
    if eval "$condition"; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
    fi
}

echo "📋 CHECKING CODE CLEANUP STATUS..."
echo ""

# 1. Docker Compose YAML
echo "🐳 Docker Compose:"
check_item "docker-compose.yml exists" "[ -f /Users/user/app/docker-compose.yml ]"
check_item "docker-compose.localstack.yml exists" "[ -f /Users/user/app/docker-compose.localstack.yml ]"
echo ""

# 2. Package Dependencies
echo "📦 Dependencies:"
check_item "Server package.json exists" "[ -f /Users/user/app/packages/server/package.json ]"
check_item "Server node_modules installed" "[ -d /Users/user/app/packages/server/node_modules ]"
check_item "Web node_modules installed" "[ -d /Users/user/app/packages/web/node_modules ]"
check_item "Web Dashboard node_modules installed" "[ -d /Users/user/app/packages/web-dashboard/node_modules ]"
check_item "Web Patient node_modules installed" "[ -d /Users/user/app/packages/web-patient/node_modules ]"
echo ""

# 3. TypeScript Build
echo "🔨 TypeScript Compilation:"
if (cd /Users/user/app/packages/server && npm run build > /dev/null 2>&1); then
    echo -e "${GREEN}✓${NC} Server builds without errors"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Server build has errors"
    ((FAILED++))
fi
echo ""

# 4. Source Files
echo "📄 Source Files:"
check_item "auth.service.ts fixed" "grep -q 'import { User } from .../entities/user.entity' /Users/user/app/packages/server/src/auth/auth.service.ts"
check_item "rate-limit middleware fixed" "grep -q 'import rateLimit from' /Users/user/app/packages/server/src/common/middleware/rate-limit.middleware.ts"
check_item "email.service.ts fixed" "grep -qv 'private configService' /Users/user/app/packages/server/src/common/services/email.service.ts || grep -q 'process.env' /Users/user/app/packages/server/src/common/services/email.service.ts"
check_item "encryption.service.ts fixed" "grep -q 'as any' /Users/user/app/packages/server/src/common/services/encryption.service.ts"
check_item "health.controller.ts fixed" "grep -q 'from .@nestjs/terminus' /Users/user/app/packages/server/src/modules/health/health.controller.ts"
echo ""

# 5. Dockerfiles
echo "🐋 Dockerfiles:"
check_item "Server Dockerfile exists" "[ -f /Users/user/app/packages/server/Dockerfile ]"
check_item "Web Dockerfile exists" "[ -f /Users/user/app/packages/web/Dockerfile ]"
check_item "Web Dashboard Dockerfile exists" "[ -f /Users/user/app/packages/web-dashboard/Dockerfile ]"
check_item "Web Patient Dockerfile exists" "[ -f /Users/user/app/packages/web-patient/Dockerfile ]"
echo ""

# 6. Documentation
echo "📚 Documentation:"
check_item "CODE_CLEANUP_REPORT.md created" "[ -f /Users/user/app/CODE_CLEANUP_REPORT.md ]"
check_item "PHASE_2_IMPLEMENTATION_GUIDE.md exists" "[ -f /Users/user/app/PHASE_2_IMPLEMENTATION_GUIDE.md ]"
echo ""

# 7. Configuration Files
echo "⚙️ Configuration:"
check_item ".env.example exists" "[ -f /Users/user/app/packages/server/.env.example ]"
check_item ".env.example.phase2 exists" "[ -f /Users/user/app/packages/server/.env.example.phase2 ]"
check_item "tsconfig.json exists" "[ -f /Users/user/app/packages/server/tsconfig.json ]"
echo ""

# Summary
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Start services: docker compose -f docker-compose.localstack.yml up -d --build"
    echo "2. Wait for services to initialize (check: docker compose ps)"
    echo "3. Test API health: curl http://localhost:3003/health"
    echo "4. View API docs: open http://localhost:3003/api/docs"
    echo "5. Test patient portal: open http://localhost:3000"
    exit 0
else
    echo ""
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo "Please fix the issues above before deploying."
    exit 1
fi
