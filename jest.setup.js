const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';

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