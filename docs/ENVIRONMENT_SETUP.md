# Environment Setup Guide

This document provides detailed instructions for configuring all environment variables and running JJ-Meet locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Development Guide](#local-development-guide)
4. [Environment Variables](#required-variables)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up JJ-Meet, ensure you have the following installed:

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| **Node.js** | 18.x or 20.x | [nodejs.org](https://nodejs.org) |
| **npm** | 9.x+ | Comes with Node.js |
| **PostgreSQL** | 14+ with PostGIS | [postgresql.org](https://postgresql.org) |
| **Redis** | 6+ | [redis.io](https://redis.io) or Docker |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### For Mobile Development

| Software | Version | Installation |
|----------|---------|--------------|
| **Expo CLI** | Latest | `npm install -g expo-cli` |
| **Expo Go App** | Latest | App Store / Play Store |
| **iOS Simulator** | (Mac only) | Xcode |
| **Android Emulator** | (optional) | Android Studio |

### Verify Installation

```bash
# Check versions
node --version    # Should be v18.x or v20.x
npm --version     # Should be 9.x+
psql --version    # Should be 14+
redis-cli --version  # Should be 6+
```

---

## Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/jj-meet.git
cd jj-meet

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### 2. Setup Environment Files

```bash
# Backend
cp backend/.env.example backend/.env

# Mobile
cp mobile/.env.example mobile/.env
```

### 3. Minimal Development Config

Edit `backend/.env` with these minimum values:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jjmeet_dev
JWT_SECRET=dev-secret-key-change-in-production-min-32-chars

REDIS_URL=redis://localhost:6379

# Disable external services for local dev
AWS_REKOGNITION_ENABLED=false
```

---

## Local Development Guide

### Option A: Backend Only

Use this when working on API/backend features.

#### Step 1: Start PostgreSQL

```bash
# Windows (if installed via installer)
# PostgreSQL should auto-start as a service

# Mac (Homebrew)
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Or use Docker
docker run -d --name jjmeet-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=jjmeet_dev \
  -p 5432:5432 \
  postgis/postgis:14-3.3
```

#### Step 2: Create Database & Enable PostGIS

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql:
CREATE DATABASE jjmeet_dev;
\c jjmeet_dev
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

#### Step 3: Start Redis

```bash
# Windows (WSL or Docker recommended)
docker run -d --name jjmeet-redis -p 6379:6379 redis:7-alpine

# Mac
brew services start redis

# Linux
sudo systemctl start redis
```

#### Step 4: Run Migrations

```bash
cd backend
npm run db:migrate
```

#### Step 5: Start Backend Server

```bash
cd backend
npm run dev

# You should see:
# 🚀 Server running on port 5000
# 📱 Environment: development
```

#### Step 6: Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Should return: {"status":"OK","timestamp":"..."}
```

---

### Option B: Mobile Only (with Mock/Existing Backend)

Use when working on UI without backend changes.

```bash
cd mobile

# If backend is running locally:
# Edit .env: EXPO_PUBLIC_API_URL=http://localhost:5000

# Start Expo
npx expo start

# Press:
#   i - Open iOS Simulator
#   a - Open Android Emulator
#   w - Open Web browser
#   Scan QR - Open on physical device with Expo Go
```

---

### Option C: Full Stack (Backend + Mobile Together)

Use for end-to-end development and testing.

#### Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

#### Terminal 2: Start Mobile

```bash
cd mobile
npx expo start
```

#### For Physical Device Testing

1. Find your computer's local IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. Update `mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
   EXPO_PUBLIC_SOCKET_URL=http://192.168.x.x:5000
   ```

3. Ensure your phone and computer are on the same WiFi network

4. Scan QR code with Expo Go app

---

### Option D: Using Docker (All Services)

```bash
# Start all services with Docker Compose
docker-compose up -d

# This starts:
# - PostgreSQL + PostGIS (port 5432)
# - Redis (port 6379)
# - Backend API (port 5000)
```

---

## Testing Your Setup

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Mobile Tests

```bash
cd mobile

# Run tests
npm test

# Run with watch mode
npm run test:watch
```

### Manual Testing Checklist

| Feature | How to Test |
|---------|-------------|
| **Health Check** | `curl http://localhost:5000/health` |
| **Register** | POST to `/api/auth/register` with email/password |
| **Login** | POST to `/api/auth/login` |
| **WebSocket** | Check console for "Socket connected" in mobile app |

---

## Required Variables

### Server Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS and email links | `http://localhost:3000` |

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/jjmeet` |

**Setup PostgreSQL with PostGIS:**
```bash
# Install PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# Run migrations
npm run migrate
```

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens (use a long random string) | `your-super-secret-key-min-32-chars` |
| `JWT_EXPIRE` | Access token expiration | `7d` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `30d` |

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Redis

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Full Redis connection URL | `redis://localhost:6379` |
| `REDIS_HOST` | Redis host (alternative to URL) | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (if required) | `your_password` |
| `REDIS_DB` | Redis database number | `0` |

**Redis is used for:**
- Real-time location caching
- Socket.io horizontal scaling (Redis adapter)
- Session management

---

## Feature-Specific Variables

### Cloudinary (Image Upload)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | API key | Cloudinary Dashboard → Settings → Access Keys |
| `CLOUDINARY_API_SECRET` | API secret | Same location as API key |

**Setup Steps:**
1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Copy Cloud Name, API Key, API Secret
3. Images are stored in `jjmeet/` folder automatically

### AWS Rekognition (Selfie Verification)

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REKOGNITION_ENABLED` | Enable/disable face verification | `true` or `false` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |

**Setup Steps:**
1. Create AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Go to IAM → Users → Create User
3. Attach policy: `AmazonRekognitionFullAccess`
4. Create access key → Copy credentials

**Cost Note:** AWS Rekognition costs ~$1 per 1000 face comparisons. Set `AWS_REKOGNITION_ENABLED=false` for development to use mock verification.

### SMTP Email Service

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS | `false` (for port 587) |
| `SMTP_USER` | Email address | `your-email@gmail.com` |
| `SMTP_PASS` | App password (NOT your regular password) | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Sender address | `noreply@jjmeet.app` |

**Gmail Setup:**
1. Enable 2-Factor Authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate new app password for "Mail"
4. Use the 16-character password as `SMTP_PASS`

**Alternative Providers:**
| Provider | Host | Port |
|----------|------|------|
| Gmail | `smtp.gmail.com` | `587` |
| Outlook | `smtp.office365.com` | `587` |
| SendGrid | `smtp.sendgrid.net` | `587` |
| Mailgun | `smtp.mailgun.org` | `587` |

### Google Maps (Optional)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GOOGLE_MAPS_API_KEY` | Maps API key | [Google Cloud Console](https://console.cloud.google.com) |

**Setup Steps:**
1. Create project in Google Cloud Console
2. Enable "Maps JavaScript API" and "Places API"
3. Create credentials → API Key
4. Restrict key to your domains for security

---

## Security Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

---

## Development vs Production

### Development (Minimal)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jjmeet_dev
JWT_SECRET=dev-secret-key-change-in-production

REDIS_URL=redis://localhost:6379

# Optional - use mocks
AWS_REKOGNITION_ENABLED=false
```

### Production (Full)
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

DATABASE_URL=postgresql://user:password@db-host:5432/jjmeet_prod
JWT_SECRET=<64-char-random-string>

REDIS_URL=redis://:password@redis-host:6379

CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

AWS_REKOGNITION_ENABLED=true
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@your-domain.com

BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=50
```

---

## Mobile App Configuration

The mobile app uses these environment variables in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

For production:
```env
EXPO_PUBLIC_API_URL=https://api.your-domain.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.your-domain.com
```

---

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check credentials in `DATABASE_URL`
- Verify PostGIS extension is installed

### Redis Connection Failed
- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_URL` format

### Email Not Sending
- For Gmail: ensure App Password is used, not regular password
- Check spam folder
- Verify SMTP credentials

### AWS Rekognition Errors
- Verify IAM user has `AmazonRekognitionFullAccess` policy
- Check AWS region matches your configuration
- Set `AWS_REKOGNITION_ENABLED=false` to use mock verification

### Cloudinary Upload Failed
- Verify cloud name, API key, and secret
- Check Cloudinary dashboard for usage limits

---

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use different secrets per environment** - Dev vs Production
3. **Rotate secrets regularly** - Especially JWT_SECRET
4. **Restrict API keys** - Use domain restrictions where possible
5. **Use environment-specific databases** - Never use prod DB for dev
