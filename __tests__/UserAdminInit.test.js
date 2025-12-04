const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('config');

// Store the actual connection.on
const actualConnectionOn = mongoose.connection.on.bind(mongoose.connection);
let capturedHandler = null;

// Replace connection.on to capture the handler
mongoose.connection.on = jest.fn((event, handler) => {
    if (event === 'connected') {
        capturedHandler = handler;
    }
    return actualConnectionOn(event, handler);
});

// Now require User model which will register the handler
const User = require('../models/User');

describe('User Model - Admin Initialization', () => {
    let mockFindOne;
    let mockCreate;
    let mockHash;
    let originalEnv;
    let consoleWarnSpy;
    let consoleErrorSpy;
    let debugSpy;

    beforeAll(() => {
        // Save original environment
        originalEnv = process.env.ADMIN_PASSWORD;
        
        // Spy on console methods
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        consoleWarnSpy.mockClear();
        consoleErrorSpy.mockClear();
        
        // Mock User model methods
        mockFindOne = jest.fn();
        mockCreate = jest.fn();
        mockHash = jest.fn();

        User.findOne = mockFindOne;
        User.create = mockCreate;

        // Mock bcrypt
        bcrypt.hash = mockHash;
    });

    afterAll(() => {
        // Restore environment
        if (originalEnv) {
            process.env.ADMIN_PASSWORD = originalEnv;
        } else {
            delete process.env.ADMIN_PASSWORD;
        }
        
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Admin user creation on database connection', () => {
        it('should register a connected event handler', () => {
            expect(capturedHandler).toBeDefined();
            expect(typeof capturedHandler).toBe('function');
        });

        it('should create admin user when admin does not exist and password is set', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            // Mock implementations
            mockFindOne.mockResolvedValue(null); // Admin doesn't exist
            mockHash.mockResolvedValue('hashedAdminPassword');
            mockCreate.mockResolvedValue({ email: adminEmail, role: 'admin' });

            // Trigger the connected event
            await capturedHandler();

            // Wait for promises to resolve
            await new Promise(resolve => setImmediate(resolve));

            expect(mockFindOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(mockHash).toHaveBeenCalledWith('TestAdminPass123', 10);
            expect(mockCreate).toHaveBeenCalledWith({
                name: 'Admin',
                email: adminEmail,
                password: 'hashedAdminPassword',
                confirmed: true,
                role: 'admin'
            });
        });

        it('should not create admin user when admin already exists', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            // Mock admin user already exists
            mockFindOne.mockResolvedValue({ 
                email: adminEmail, 
                role: 'admin',
                confirmed: true 
            });

            await capturedHandler();

            await new Promise(resolve => setImmediate(resolve));

            expect(mockFindOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(mockHash).not.toHaveBeenCalled();
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it('should warn when admin password is not set', async () => {
            const adminEmail = config.get('admin.email');
            delete process.env.ADMIN_PASSWORD;
            
            mockFindOne.mockResolvedValue(null); // Admin doesn't exist

            await capturedHandler();

            await new Promise(resolve => setImmediate(resolve));

            expect(mockFindOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(consoleWarnSpy).toHaveBeenCalledWith('WARNING: ADMIN_PASSWORD environment variable not set. Admin user will not be created.');
            expect(consoleWarnSpy).toHaveBeenCalledWith('Set ADMIN_PASSWORD environment variable to create admin user on startup.');
            expect(mockHash).not.toHaveBeenCalled();
            expect(mockCreate).not.toHaveBeenCalled();
        });

        it('should handle errors when creating admin user', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            const createError = new Error('Database error');
            mockFindOne.mockResolvedValue(null);
            mockHash.mockResolvedValue('hashedPassword');
            mockCreate.mockRejectedValue(createError);

            await capturedHandler();

            await new Promise(resolve => setImmediate(resolve));

            expect(mockCreate).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create admin user:', 'Database error');
        });

        it('should handle errors when finding admin user', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            const findError = new Error('Database connection error');
            mockFindOne.mockRejectedValue(findError);

            await capturedHandler();

            await new Promise(resolve => setImmediate(resolve));

            expect(mockFindOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(mockCreate).not.toHaveBeenCalled();
            // The error is caught and logged via debug, so we just verify findOne was called
        });

        it('should use correct admin email from config', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            mockFindOne.mockResolvedValue({ email: adminEmail });

            await capturedHandler();

            await new Promise(resolve => setImmediate(resolve));

            expect(mockFindOne).toHaveBeenCalledWith({ email: adminEmail });
        });

        it('should hash password with correct salt rounds', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            mockFindOne.mockResolvedValue(null);
            mockHash.mockResolvedValue('hashedPassword');
            mockCreate.mockResolvedValue({});

            await capturedHandler();

            await new Promise(resolve => setImmediate(resolve));

            expect(mockHash).toHaveBeenCalledWith('TestAdminPass123', 10);
        });
    });
});
