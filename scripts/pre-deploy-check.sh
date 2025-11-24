#!/bin/bash

# Pre-Deployment Checklist Script
# Verifies everything is ready for Railway deployment

set -e

echo "🚀 Agnes-21 Pre-Deployment Checklist"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((ERRORS++))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

echo "1. Checking Environment Configuration..."
echo "----------------------------------------"

# Check .env.local exists
if [ -f ".env.local" ]; then
  check_pass ".env.local file exists"

  # Check if it has GEMINI_API_KEY
  if grep -q "VITE_GEMINI_API_KEY=" .env.local; then
    check_pass "VITE_GEMINI_API_KEY is configured"
  else
    check_fail "VITE_GEMINI_API_KEY not found in .env.local"
  fi
else
  check_fail ".env.local file not found"
  echo "   Run: cp .env.example .env.local"
fi

# Check .env files are gitignored
if grep -q ".env.local" .gitignore; then
  check_pass ".env.local is in .gitignore"
else
  check_fail ".env.local is NOT in .gitignore (SECURITY RISK!)"
fi

echo ""
echo "2. Checking Dependencies..."
echo "----------------------------------------"

# Check node_modules exists
if [ -d "node_modules" ]; then
  check_pass "node_modules directory exists"
else
  check_fail "node_modules not found"
  echo "   Run: npm install"
fi

# Check package-lock.json exists
if [ -f "package-lock.json" ]; then
  check_pass "package-lock.json exists"
else
  check_warn "package-lock.json not found (recommended for consistent builds)"
fi

echo ""
echo "3. Checking PWA Assets..."
echo "----------------------------------------"

# Check manifest.json
if [ -f "public/manifest.json" ]; then
  check_pass "manifest.json exists"
else
  check_fail "manifest.json not found in public/"
fi

# Check service-worker.js
if [ -f "public/service-worker.js" ]; then
  check_pass "service-worker.js exists"
else
  check_fail "service-worker.js not found in public/"
fi

# Check icons directory
if [ -d "public/icons" ]; then
  ICON_COUNT=$(ls public/icons/*.svg 2>/dev/null | wc -l)
  if [ "$ICON_COUNT" -ge 8 ]; then
    check_pass "PWA icons present ($ICON_COUNT icons)"
  else
    check_warn "Only $ICON_COUNT icons found (expected 8+)"
  fi
else
  check_fail "public/icons directory not found"
fi

echo ""
echo "4. Checking Railway Configuration..."
echo "----------------------------------------"

# Check railway.json
if [ -f "railway.json" ]; then
  check_pass "railway.json exists"

  # Verify it has required fields
  if grep -q "buildCommand" railway.json && grep -q "startCommand" railway.json; then
    check_pass "railway.json has build and start commands"
  else
    check_fail "railway.json missing required commands"
  fi
else
  check_fail "railway.json not found"
fi

echo ""
echo "5. Running Production Build..."
echo "----------------------------------------"

# Clean dist directory
rm -rf dist/
check_pass "Cleaned dist directory"

# Run build
if npm run build > /dev/null 2>&1; then
  check_pass "Build completed successfully"
else
  check_fail "Build failed! Check errors above"
  exit 1
fi

# Check build output
if [ -f "dist/index.html" ]; then
  check_pass "index.html generated"
else
  check_fail "index.html not found in dist/"
fi

# Check PWA files were copied
if [ -f "dist/service-worker.js" ]; then
  check_pass "service-worker.js copied to dist/"
else
  check_fail "service-worker.js not found in dist/"
fi

if [ -f "dist/manifest.json" ]; then
  check_pass "manifest.json copied to dist/"
else
  check_fail "manifest.json not found in dist/"
fi

# Check build size
BUILD_SIZE=$(du -sh dist/ | cut -f1)
check_pass "Build size: $BUILD_SIZE"

echo ""
echo "6. Checking Git Status..."
echo "----------------------------------------"

# Check if git repo
if [ -d ".git" ]; then
  check_pass "Git repository initialized"

  # Check for uncommitted changes
  if git diff --quiet && git diff --cached --quiet; then
    check_pass "No uncommitted changes"
  else
    check_warn "You have uncommitted changes"
    echo "   Run: git status"
  fi

  # Check current branch
  BRANCH=$(git branch --show-current)
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    check_pass "On main branch ($BRANCH)"
  else
    check_warn "On branch: $BRANCH (Railway deploys from main by default)"
  fi
else
  check_fail "Not a git repository"
fi

echo ""
echo "===================================="
echo "📊 Summary"
echo "===================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "Your app is ready for deployment! 🚀"
  echo ""
  echo "Next steps:"
  echo "1. Commit and push your changes"
  echo "2. Go to https://railway.app"
  echo "3. Create new project from GitHub repo"
  echo "4. Add GEMINI_API_KEY to environment variables"
  echo "5. Deploy!"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ Checks passed with $WARNINGS warning(s)${NC}"
  echo ""
  echo "You can deploy, but consider fixing warnings first."
  exit 0
else
  echo -e "${RED}❌ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
  echo ""
  echo "Please fix errors before deploying."
  exit 1
fi
