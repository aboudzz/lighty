# Lighty

[![CodeQL](https://github.com/aboudzz/lighty/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/aboudzz/lighty/actions/workflows/github-code-scanning/codeql)
[![SonarCloud quality gate](https://sonarcloud.io/api/project_badges/measure?project=aboudzz_lighty&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=aboudzz_lighty)

Lighty is a lightweight, efficient boilerplate for Node.js applications, providing a solid starting point for building your Node.js projects with best practices in mind.

## Table of Contents

- Installation
- Features
- Usage
- Contributing
- License
- Acknowledgments

## Installation

To get started with Lighty, clone the repository and install the dependencies:

```bash
git clone https://github.com/aboudzz/lighty.git
cd lighty
npm install
npm install -g nodemon pm2
```

### Environment Configuration

**Important:** Before running the application, you must configure your environment variables:

1. Copy the example environment file:

```bash
cp .env.example .env
```

1. Edit `.env` and set the following **required** variables:

   ```bash
   # Generate a secure JWT secret (required)
   JWT_SECRET=$(openssl rand -base64 32)
   
   # Set admin password (required for admin user creation)
   ADMIN_PASSWORD=YourSecurePassword123
   
   # Set mail password (required for email functionality)
   MAIL_PASSWORD=YourMailPassword
   ```

1. For production, also set:
   - `NODE_ENV=production`
   - `APP_URL`: Your production domain URL (used in email links)
   - All other production-specific settings

**Security Warning:** Never commit your `.env` file to version control. It's already listed in `.gitignore`.

## Features

- **Fast Setup**: Get your Node.js project up and running in no time.
- **Security First**:
  - Helmet.js for security headers
  - JWT-based authentication
  - Password strength validation
  - Rate limiting protection
  - Environment-based configuration
  - Bcrypt password hashing
- **Best Practices**: Includes configurations for linting, testing, and more.
- **Email Integration**: User confirmation and password reset via email
- **Admin Panel**: Role-based access control
- **Scalability**: Structured to support growth as your project expands.

## Usage

After installation and environment configuration, you can deploy the database:

```bash
npm run mongo:deploy
```

Start a mailserver and setup info mail user:

```bash
npm run mailserver:up
npm run mailserver:setup
```

Then start the development server with:

```bash
npm run start:development
```

For production environments, ensure all environment variables are properly set, then run:

```bash
npm run start:production
```

### Testing

Run the test suite:

```bash
npm test
```

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b my-new-feature`.
3. Make your changes.
4. Commit your changes: `git commit -am 'Add some feature'`.
5. Push to the branch: `git push origin my-new-feature`.
6. Submit a pull request.

## License

This project is licensed under the ISC License - see the LICENSE.md file for details.

## Acknowledgments

- Thanks to all the contributors who invest their time into making Lighty better.
- Special thanks to the Node.js community for their continuous support.
- Thanks to ChatGPT for generating this README.md file.
