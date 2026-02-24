# Copilot Instructions for Lighty

## Build & Test

```bash
npm test                          # Run full test suite with coverage
npx jest __tests__/users.test.js  # Run a single test file
npx jest -t "should authenticate" # Run tests matching a name pattern
npm run start:development         # Start dev server (requires MongoDB running)
```

Tests use Jest with `supertest` for HTTP assertions. Mongoose and nodemailer are globally mocked in `jest.setup.js` — tests never hit a real database or SMTP server.

## Architecture

This is an Express 5 REST API with MongoDB (Mongoose) and JWT authentication (Passport).

**Request flow:** `routes/` → `middlewares/` → `models/` / `services/`

- **`routes/`** — Define endpoints and wire up Passport auth. Route handlers are thin; they delegate to middleware functions. Routes are mounted under `/api/v1/` with legacy mounts at the root for backward compatibility.
- **`middlewares/`** — Contain the actual request-handling logic (validation, DB queries, response building). Despite the name, these are effectively controllers.
- **`models/`** — Mongoose schemas. `User.js` also auto-creates an admin user on DB connection using config values.
- **`services/`** — External integrations (email via nodemailer with EJS templates from `resources/emails/`).
- **`utils/`** — Shared utilities: centralized error objects (`errors.js`), input validation (`validation.js`), JWT strategy (`jwtStrategy.js`).

**Configuration** uses the `config` npm package with `config/default.json`, `config/test.json`, and `config/production.json`. Secrets are never stored in config — config files reference environment variable names (e.g., `jwt.secret_env: "JWT_SECRET"`), and the code reads `process.env[config.get('jwt.secret_env')]`.

**Error handling:** `utils/errors.js` exports named error constants (e.g., `errors.NOT_FOUND`, `errors.BAD_REQUEST`) created with `http-errors`. Middleware functions call `next(errors.SOME_ERROR)` to propagate errors to the centralized error handler.

## Conventions

- **CommonJS modules** (`require`/`module.exports`) throughout — no ES modules.
- **Roles:** `admin` and `user`. Admin routes (`routes/admin.js`) apply `jwtAuth()` + `isAdmin` check at the router level.
- **Validation:** All input validation goes through `utils/validation.js` using the `validator` npm package. Validation functions throw error objects directly (not return booleans).
- **User profiles:** Call `user.getProfile()` to strip sensitive fields (password, confirmationInfo, resetPasswordInfo) before sending responses.
- **Test structure:** Each test file mocks `User` model methods (`findById`, `findOne`, `create`) and `passport.authenticate`. Tests use `supertest` against the Express app, not direct function calls.
- **OpenAPI docs:** Route files contain `@openapi` JSDoc annotations. Swagger UI is available at `/api-docs` in non-production environments.
