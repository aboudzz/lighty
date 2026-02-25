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

The server runs on `http://localhost:3000` by default. An admin user is automatically created on first startup using the email from `config/default.json` and the `ADMIN_PASSWORD` env variable.

## Configuration

Configuration is split between environment variables for secrets and JSON files for settings:

- **`.env`** — Secrets only: `JWT_SECRET` (min 32 chars), `ADMIN_PASSWORD`, `MAIL_SENDER_PASSWORD`
- **`config/default.json`** — MongoDB URI, CORS origins, rate limits, mail server, admin email, Swagger settings
- **`config/test.json`** — Overrides for test (separate `lighty_test` database)
- **`config/production.json`** — Overrides for production (binds `0.0.0.0:8080`, disables Swagger)

Config files reference env variable **names** (e.g., `"secret_env": "JWT_SECRET"`), and application code reads the actual value via `process.env[config.get('jwt.secret_env')]`.

## Available Scripts

```bash
# Server
npm run start:development  # Start dev server with nodemon and debug logging
npm run start:production   # Start production server with pm2
npm run stop:production    # Stop production server

# Database
npm run mongo:deploy       # Deploy MongoDB in Docker (first time)
npm run mongo:start        # Start existing MongoDB container
npm run mongo:stop         # Stop MongoDB container

# Mail server
npm run mailserver:up      # Start Docker mail server
npm run mailserver:setup   # Add sender email account
npm run mailserver:down    # Stop mail server

# Quality
npm test                           # Run full suite with coverage
npm run lint                       # Run ESLint
npm run generate:openapi           # Generate OpenAPI spec file
npx jest __tests__/users.test.js   # Run a single test file
npx jest -t "should authenticate"  # Run tests matching a name pattern
```

## API Endpoints

All endpoints are available under `/api/v1` (legacy mounts at the root are deprecated).

### Public

| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| GET    | `/ping`                     | Simple ping/pong             |
| GET    | `/health`                   | Health check with DB status  |
| POST   | `/api/v1/users/register`    | Register a new user          |
| GET    | `/api/v1/users/confirm`     | Confirm email (via link)     |

### Auth (rate-limited: 10 req/15min)

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| POST   | `/api/v1/auth/login`              | Login, returns JWT token |
| POST   | `/api/v1/auth/forgot-password`    | Request password reset   |
| POST   | `/api/v1/auth/reset-password`     | Reset password via token |
| POST   | `/api/v1/auth/update-password`    | Change own password (JWT required) |

Legacy auth routes (`/users/authenticate`, `/users/forgotpassword`, etc.) still work but are deprecated.

### Authenticated (Bearer token)

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/v1/users/:id`        | Get user profile         |

### Admin only (Bearer token + admin role)

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/v1/admin/users`       | List users (with search, sort, pagination) |
| GET    | `/api/v1/admin/users/:id`   | Get user by ID           |
| PUT    | `/api/v1/admin/users/:id`   | Update user              |
| DELETE | `/api/v1/admin/users/:id`   | Delete user              |

### API Documentation

Swagger UI is available at `/swagger` in non-production environments. OpenAPI annotations are defined inline in route and model files.

## Project Structure

```
├── bin/www              # HTTP server entrypoint
├── bin/generate-openapi.js  # OpenAPI spec generator script
├── app.js               # Express app setup (middleware, routes, DB connection)
├── config/              # Environment-specific JSON config (default, test, production)
├── routes/              # Route definitions and OpenAPI annotations
├── controllers/         # Request handlers (validation, DB queries, responses)
├── models/              # Mongoose schemas
├── services/            # External integrations (email)
├── utils/               # Shared utilities (errors, validation, JWT strategy, auth)
├── resources/emails/    # EJS email templates (text + HTML)
├── __tests__/           # Jest test files
├── Dockerfile           # Multi-stage production Docker build
└── eslint.config.js     # ESLint flat config
```

## Features

- **Authentication** — JWT via Passport with registration, email confirmation, and password reset flows
- **Role-based access** — `admin` and `user` roles; admin routes enforce role checks at the router level
- **Email integration** — Nodemailer with EJS templates (text + HTML) for confirmation and password reset emails
- **Security** — Helmet, CORS, global + auth-specific rate limiting, request body size limits, input validation and sanitization, bcrypt password hashing
- **API versioning** — Routes mounted under `/api/v1` with deprecated legacy mounts
- **API documentation** — Swagger UI auto-generated from inline OpenAPI annotations
- **Docker** — Multi-stage Dockerfile for production builds
- **Linting** — ESLint with flat config

## License

ISC
