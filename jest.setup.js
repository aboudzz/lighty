const mongoose = require('mongoose');
const config = require('config');

// Set test environment
process.env.NODE_ENV = 'test';

// Set test environment variables (sensitive values only)
// Read variable names from config to stay consistent
process.env[config.get('jwt.secret_env')] = 'test-jwt-secret-for-testing-only-min-32-chars';
process.env[config.get('admin.password_env')] = 'TestAdmin123';
process.env[config.get('mail.sender_password_env')] = 'test-mail-password';

// Mock mongoose connection to avoid database issues in tests
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    return {
        ...actualMongoose,
        connect: jest.fn().mockResolvedValue({}),
        connection: {
            on: jest.fn(),
            readyState: 1,
            close: jest.fn().mockResolvedValue({})
        }
    };
});

// Global setup
beforeAll(async () => {
    // Set a shorter timeout for database operations in tests
    jest.setTimeout(10000);
});

// Global teardown
afterAll(async () => {
    // Close mongoose connection if it exists
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});

// Clean up after each test
afterEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
});