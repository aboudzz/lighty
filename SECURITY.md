# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |
| < 0.0   | :x:                |

## Security Features

This application includes the following security features:

- **Helmet.js Security Headers**: Content Security Policy, HSTS, XSS protection, and more
- **JWT Authentication**: Secure token-based authentication
- **Password Strength Validation**: Enforces strong passwords (8+ chars, uppercase, lowercase, numbers)
- **Global Rate Limiting**: Protection against brute force attacks
- **Input Validation & Sanitization**: Protection against injection attacks
- **Environment-based Configuration**: All secrets managed via environment variables
- **Bcrypt Password Hashing**: Industry-standard password encryption

## Security Best Practices

### Required for Production Deployment

1. **Environment Variables**: All sensitive credentials must be set via environment variables
   - Generate strong JWT secret: `openssl rand -base64 32`
   - Never commit `.env` files to version control
   - Use `.env.example` as a template

2. **Required Environment Variables**:
   - `JWT_SECRET` - Minimum 32 characters, randomly generated
   - `ADMIN_PASSWORD` - Strong password meeting validation requirements
   - `MAIL_PASSWORD` - Your mail server password
   - `APP_URL` - Your production HTTPS URL
   - `NODE_ENV=production`

3. **HTTPS**: Always use HTTPS in production environments

4. **Database Security**: Ensure MongoDB has authentication enabled and properly configured

5. **Dependencies**: Regularly update dependencies with `npm audit` and `npm update`

6. **Rate Limiting**: Configure appropriate rate limits based on your use case via:
   - `RATE_LIMIT_WINDOW_MS` (default: 600000ms = 10 minutes)
   - `RATE_LIMIT_MAX_REQUESTS` (default: 100 requests)

### Production Deployment Checklist

Before deploying to production, ensure:

- [ ] `.env` file created with all required variables
- [ ] `JWT_SECRET` is strong and unique (minimum 32 characters)
- [ ] `ADMIN_PASSWORD` meets password requirements (8+ chars, mixed case, numbers)
- [ ] `APP_URL` points to HTTPS domain
- [ ] MongoDB has authentication enabled
- [ ] All dependencies updated (`npm audit` shows 0 vulnerabilities)
- [ ] HTTPS/TLS configured on server
- [ ] `.env` file is NOT committed to git (verify `.gitignore`)
- [ ] Production environment has `NODE_ENV=production`

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
