# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |
| < 0.0   | :x:                |

## Security Features

This application includes the following security features:

- **Helmet.js Security Headers**: Content Security Policy, HSTS, XSS protection, and more
- **JWT Authentication**: Secure token-based authentication with Passport.js
- **Password Strength Validation**: Enforces strong passwords (8+ chars, uppercase, lowercase, numbers)
- **Global Rate Limiting**: Protection against brute force attacks (configurable in config files)
- **CORS Configuration**: Cross-Origin Resource Sharing with configurable origins
- **Input Validation & Sanitization**: Protection against injection attacks using validator.js
- **Hybrid Configuration**: Secrets in .env, settings in config/*.json files
- **Bcrypt Password Hashing**: Industry-standard password encryption (cost factor 10)

## Security Best Practices

### Required for Production Deployment

1. **Environment Variables**: Only secrets should be in `.env` file
   - Generate strong JWT secret: `openssl rand -base64 32`
   - Never commit `.env` files to version control
   - Use `.env.example` as a template

2. **Required Environment Variables** (in `.env` file):
   - `JWT_SECRET` - Minimum 32 characters, randomly generated
   - `ADMIN_PASSWORD` - Strong password meeting validation requirements
   - `MAIL_SENDER_PASSWORD` - Your mail server password

3. **Configuration Files** (`config/*.json`):
   - Non-sensitive settings like MongoDB URI, CORS origins, rate limits, etc.
   - `config/default.json` - Development defaults
   - `config/production.json` - Production overrides (APP_URL, server host/port, etc.)
   - `config/test.json` - Test database settings

4. **HTTPS**: Always use HTTPS in production environments

5. **Database Security**: Ensure MongoDB has authentication enabled and properly configured

6. **Dependencies**: Regularly update dependencies with `npm audit` and `npm update`

7. **Rate Limiting**: Configure appropriate rate limits in `config/default.json` or `config/production.json`:
   - `rateLimit.windowMs` (default: 600000ms = 10 minutes)
   - `rateLimit.max` (default: 100 requests per window)

### Production Deployment Checklist

Before deploying to production, ensure:

- [ ] `.env` file created with required secrets (JWT_SECRET, ADMIN_PASSWORD, MAIL_SENDER_PASSWORD)
- [ ] `JWT_SECRET` is strong and unique (minimum 32 characters)
- [ ] `ADMIN_PASSWORD` meets password requirements (8+ chars, mixed case, numbers)
- [ ] `config/production.json` configured with production settings (app.url with HTTPS, CORS origins, server host/port)
- [ ] MongoDB has authentication enabled and URI is correct in config
- [ ] All dependencies updated (`npm audit` shows 0 vulnerabilities)
- [ ] HTTPS/TLS configured on server
- [ ] `.env` file is NOT committed to git (verify `.gitignore`)
- [ ] `NODE_ENV=production` set in deployment environment

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities by opening a GitHub Security Advisory at:
[https://github.com/aboudzz/lighty/security/advisories/new](https://github.com/aboudzz/lighty/security/advisories/new)

Alternatively, you can email security concerns to: **[aboudzakaria@outlook.com]**

You will receive a response from us within 48 hours. After the initial reply, we will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

Remember to use a sensible disclosure policy when reporting any vulnerabilities. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

## Disclosure Policy

Let us know as soon as possible upon discovery of a potential security issue, and we'll make every effort to quickly resolve the issue. Provide us a reasonable amount of time to resolve the issue before any disclosure to the public or a third-party.

We aim to be as transparent as possible about the resolution process. Once the issue is resolved, we may publish a post detailing the vulnerability and the steps we took to address it.

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request.
