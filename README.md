# Lighty

[![CodeQL](https://github.com/aboudzz/lighty/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/aboudzz/lighty/actions/workflows/github-code-scanning/codeql)

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
npm install -g nodemon
npm install --save-dev run-script-os
```

To install process manager to run lightly in production

```bash
npm install -g pm2
```

## Features

- **Fast Setup**: Get your Node.js project up and running in no time.
- **Best Practices**: Includes configurations for linting, testing, and more.
- **Scalability**: Structured to support growth as your project expands.

## Usage

After installation, you can deploy the database and then start the development server with:

`npm run mongo:deploy`

`npm run start:development`

For production environments, run:

`npm run start:production`

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
