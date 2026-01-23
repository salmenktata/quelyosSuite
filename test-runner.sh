#!/bin/bash

# Test Runner Script for Quelyos ERP
# Runs all backend and frontend tests

set -e  # Exit on error

echo "=========================================="
echo "  Quelyos ERP - Test Runner"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Track test results
BACKEND_TESTS_PASSED=false
FRONTEND_UNIT_TESTS_PASSED=false
FRONTEND_E2E_TESTS_PASSED=false

# 1. Backend Tests (Odoo)
echo ""
print_info "Running Backend Tests (Odoo)..."
echo "=========================================="

if [ -d "backend" ]; then
    cd backend

    # Check if Odoo is running
    if docker-compose ps | grep -q "odoo.*Up"; then
        print_info "Odoo container is running"

        # Run Odoo tests
        if docker-compose exec -T odoo odoo -c /etc/odoo/odoo.conf \
            -d quelyos \
            -u quelyos_ecommerce \
            --test-enable \
            --stop-after-init \
            --log-level=test 2>&1 | tee /tmp/odoo_tests.log; then

            # Check if tests passed
            if grep -q "0 failed" /tmp/odoo_tests.log; then
                print_success "Backend tests passed"
                BACKEND_TESTS_PASSED=true
            else
                print_error "Backend tests failed"
                echo "Check /tmp/odoo_tests.log for details"
            fi
        else
            print_error "Failed to run backend tests"
        fi
    else
        print_error "Odoo container is not running. Start it with: docker-compose up -d"
    fi

    cd ..
else
    print_error "Backend directory not found"
fi

# 2. Frontend Unit Tests (Jest)
echo ""
print_info "Running Frontend Unit Tests (Jest)..."
echo "=========================================="

if [ -d "frontend" ]; then
    cd frontend

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi

    # Run Jest tests
    if npm run test -- --passWithNoTests 2>&1; then
        print_success "Frontend unit tests passed"
        FRONTEND_UNIT_TESTS_PASSED=true
    else
        print_error "Frontend unit tests failed"
    fi

    cd ..
else
    print_error "Frontend directory not found"
fi

# 3. Frontend E2E Tests (Playwright)
echo ""
print_info "Running Frontend E2E Tests (Playwright)..."
echo "=========================================="

if [ -d "frontend" ]; then
    cd frontend

    # Check if Next.js dev server is running
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_info "Next.js dev server is running"

        # Install Playwright browsers if needed
        if [ ! -d "$HOME/.cache/ms-playwright" ]; then
            print_info "Installing Playwright browsers..."
            npx playwright install
        fi

        # Run Playwright tests
        if npm run test:e2e 2>&1; then
            print_success "Frontend E2E tests passed"
            FRONTEND_E2E_TESTS_PASSED=true
        else
            print_error "Frontend E2E tests failed"
        fi
    else
        print_error "Next.js dev server is not running. Start it with: npm run dev"
        print_info "Skipping E2E tests..."
    fi

    cd ..
fi

# Summary
echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="

if [ "$BACKEND_TESTS_PASSED" = true ]; then
    print_success "Backend Tests: PASSED"
else
    print_error "Backend Tests: FAILED"
fi

if [ "$FRONTEND_UNIT_TESTS_PASSED" = true ]; then
    print_success "Frontend Unit Tests: PASSED"
else
    print_error "Frontend Unit Tests: FAILED"
fi

if [ "$FRONTEND_E2E_TESTS_PASSED" = true ]; then
    print_success "Frontend E2E Tests: PASSED"
else
    print_error "Frontend E2E Tests: FAILED or SKIPPED"
fi

echo ""

# Exit with error if any tests failed
if [ "$BACKEND_TESTS_PASSED" = true ] && \
   [ "$FRONTEND_UNIT_TESTS_PASSED" = true ] && \
   [ "$FRONTEND_E2E_TESTS_PASSED" = true ]; then
    print_success "All tests passed!"
    exit 0
else
    print_error "Some tests failed. Please check the output above."
    exit 1
fi
