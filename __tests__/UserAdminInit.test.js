const mongoose = require('mongoose');
const config = require('config');

// Mock User model before requiring initAdmin
jest.mock('../models/User', () => {
    const mockUser = {
        findOne: jest.fn(),
        create: jest.fn(),
    };
    return mockUser;
});

const User = require('../models/User');
const initAdmin = require('../utils/initAdmin');

describe('Admin Initialization', () => {
    let originalEnv;
    let consoleWarnSpy;
    let consoleErrorSpy;

    beforeAll(() => {
        originalEnv = process.env.ADMIN_PASSWORD;
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        consoleWarnSpy.mockClear();
        consoleErrorSpy.mockClear();
    });

    afterAll(() => {
        if (originalEnv) {
            process.env.ADMIN_PASSWORD = originalEnv;
        } else {
            delete process.env.ADMIN_PASSWORD;
        }
        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Admin user creation on database connection', () => {
        it('should be a callable function', () => {
            expect(typeof initAdmin).toBe('function');
        });

        it('should create admin user when admin does not exist and password is set', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({ email: adminEmail, role: 'admin' });

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(User.findOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(User.create).toHaveBeenCalledWith({
                name: 'Admin',
                email: adminEmail,
                password: 'TestAdminPass123',
                confirmed: true,
                role: 'admin'
            });
        });

        it('should not create admin user when admin already exists', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            User.findOne.mockResolvedValue({ 
                email: adminEmail, 
                role: 'admin',
                confirmed: true 
            });

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(User.findOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(User.create).not.toHaveBeenCalled();
        });

        it('should warn when admin password is not set', async () => {
            const adminEmail = config.get('admin.email');
            delete process.env.ADMIN_PASSWORD;
            
            User.findOne.mockResolvedValue(null);

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(User.findOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(consoleWarnSpy).toHaveBeenCalledWith('WARNING: ADMIN_PASSWORD environment variable not set. Admin user will not be created.');
            expect(consoleWarnSpy).toHaveBeenCalledWith('Set ADMIN_PASSWORD environment variable to create admin user on startup.');
            expect(User.create).not.toHaveBeenCalled();
        });

        it('should handle errors when creating admin user', async () => {
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            User.findOne.mockResolvedValue(null);
            User.create.mockRejectedValue(new Error('Database error'));

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(User.create).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create admin user:', 'Database error');
        });

        it('should handle errors when finding admin user', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            User.findOne.mockRejectedValue(new Error('Database connection error'));

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(User.findOne).toHaveBeenCalledWith({ email: adminEmail });
            expect(User.create).not.toHaveBeenCalled();
        });

        it('should use correct admin email from config', async () => {
            const adminEmail = config.get('admin.email');
            process.env.ADMIN_PASSWORD = 'TestAdminPass123';
            
            User.findOne.mockResolvedValue({ email: adminEmail });

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(User.findOne).toHaveBeenCalledWith({ email: adminEmail });
        });

        it('should reject weak admin passwords', async () => {
            process.env.ADMIN_PASSWORD = 'weak';
            
            User.findOne.mockResolvedValue(null);

            await initAdmin();
            await new Promise(resolve => setImmediate(resolve));

            expect(consoleErrorSpy).toHaveBeenCalledWith('Admin password does not meet strength requirements (8+ chars, uppercase, lowercase, number). Admin user will not be created.');
            expect(User.create).not.toHaveBeenCalled();
        });
    });
});
