# Lighty

[![CodeQL](https://github.com/aboudzz/lighty/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/aboudzz/lighty/actions/workflows/github-code-scanning/codeql)
[![SonarCloud quality gate](https://sonarcloud.io/api/project_badges/measure?project=aboudzz_lighty&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aboudzz_lighty)

Lightweight Node.js REST API boilerplate with MongoDB, JWT authentication, and email integration.

## Quick Start

```bash
# Clone and install
git clone https://github.com/aboudzz/lighty.git
cd lighty
npm install

# Setup environment
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET, ADMIN_PASSWORD, MAIL_SENDER_PASSWORD)

# Start MongoDB
npm run mongo:deploy

# Start development server
npm run start:development
```

## Configuration

- **Secrets** (`.env`): JWT_SECRET, ADMIN_PASSWORD, MAIL_SENDER_PASSWORD
- **Settings** (`config/*.json`): MongoDB URI, CORS, rate limits, mail service, etc.

## Available Scripts

```bash
npm run start:development  # Start dev server
npm run start:production   # Start production server
npm test                   # Run tests
npm run mongo:deploy       # Deploy MongoDB
npm run mailserver:up      # Start mail server
```

## Features

- JWT authentication with Passport
- MongoDB with Mongoose
- Email integration (nodemailer)
- Security: Helmet, rate limiting, password validation
- API versioning
- Role-based access control

## License

ISC
