const mongoose = require('mongoose');
const User = require('../models/User');

// Mock mongoose connection events
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    
    // Create a mock connection with event emitter capabilities
    const mockConnection = {
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn(),
        readyState: 1
    };
    
    return {
        ...actualMongoose,
        connection: mockConnection,
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn().mockResolvedValue(true)
    };
});

describe('User Model', () => {
    describe('Schema Definition', () => {
        it('should have required fields defined', () => {
            const requiredFields = User.schema.requiredPaths();
            expect(requiredFields).toContain('name');
            expect(requiredFields).toContain('email');
            expect(requiredFields).toContain('password');
        });

        it('should have correct field types', () => {
            const paths = User.schema.paths;
            expect(paths.name.instance).toBe('String');
            expect(paths.email.instance).toBe('String');
            expect(paths.password.instance).toBe('String');
            expect(paths.confirmed.instance).toBe('Boolean');
            expect(paths.role.instance).toBe('String');
        });

        it('should have email field with unique constraint', () => {
            const emailPath = User.schema.paths.email;
            expect(emailPath.options.unique).toBe(true);
        });

        it('should have trim enabled for name and email', () => {
            const namePath = User.schema.paths.name;
            const emailPath = User.schema.paths.email;
            expect(namePath.options.trim).toBe(true);
            expect(emailPath.options.trim).toBe(true);
        });

        it('should have confirmed field with default value false', () => {
            const confirmedPath = User.schema.paths.confirmed;
            expect(confirmedPath.options.default).toBe(false);
        });

        it('should have role field with enum values', () => {
            const rolePath = User.schema.paths.role;
            expect(rolePath.options.enum).toEqual(['admin', 'user']);
            expect(rolePath.options.default).toBe('user');
        });

        it('should have confirmationInfo nested object structure', () => {
            const user = new User({
                name: 'Test',
                email: 'test@example.com',
                password: 'password',
                confirmationInfo: {
                    lookup: 'test',
                    verify: 'test'
                }
            });
            expect(user.confirmationInfo).toBeDefined();
        });

        it('should have resetPasswordInfo nested object structure', () => {
            const user = new User({
                name: 'Test',
                email: 'test@example.com',
                password: 'password',
                resetPasswordInfo: {
                    lookup: 'test',
                    verify: 'test'
                }
            });
            expect(user.resetPasswordInfo).toBeDefined();
        });
    });

    describe('User Instance Creation', () => {
        it('should create a user with required fields', () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123'
            };

            const user = new User(userData);
            
            expect(user.name).toBe('John Doe');
            expect(user.email).toBe('john@example.com');
            expect(user.password).toBe('hashedPassword123');
            expect(user.confirmed).toBe(false);
            expect(user.role).toBe('user');
        });

        it('should create a user with confirmed status', () => {
            const userData = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'hashedPassword456',
                confirmed: true
            };

            const user = new User(userData);
            
            expect(user.confirmed).toBe(true);
        });

        it('should create a user with admin role', () => {
            const userData = {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'hashedPassword789',
                role: 'admin'
            };

            const user = new User(userData);
            
            expect(user.role).toBe('admin');
        });

        it('should create a user with confirmationInfo', () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword',
                confirmationInfo: {
                    lookup: 'lookup123',
                    verify: 'verify456',
                    URL: 'http://example.com/confirm'
                }
            };

            const user = new User(userData);
            
            expect(user.confirmationInfo.lookup).toBe('lookup123');
            expect(user.confirmationInfo.verify).toBe('verify456');
            expect(user.confirmationInfo.URL).toBe('http://example.com/confirm');
        });

        it('should create a user with resetPasswordInfo', () => {
            const expireDate = new Date();
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword',
                resetPasswordInfo: {
                    lookup: 'reset123',
                    verify: 'reset456',
                    expire: expireDate,
                    URL: 'http://example.com/reset'
                }
            };

            const user = new User(userData);
            
            expect(user.resetPasswordInfo.lookup).toBe('reset123');
            expect(user.resetPasswordInfo.verify).toBe('reset456');
            expect(user.resetPasswordInfo.expire).toEqual(expireDate);
            expect(user.resetPasswordInfo.URL).toBe('http://example.com/reset');
        });

        it('should trim whitespace from name and email', () => {
            const userData = {
                name: '  John Doe  ',
                email: '  john@example.com  ',
                password: 'hashedPassword'
            };

            const user = new User(userData);
            
            expect(user.name).toBe('John Doe');
            expect(user.email).toBe('john@example.com');
        });
    });

    describe('getProfile method', () => {
        it('should return user profile without sensitive fields', () => {
            const user = new User({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashedPassword123',
                confirmed: true,
                role: 'user'
            });

            // Mock _id
            user._id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

            const profile = user.getProfile();

            expect(profile._id).toBe('507f1f77bcf86cd799439011');
            expect(profile.name).toBe('John Doe');
            expect(profile.email).toBe('john@example.com');
            expect(profile.confirmed).toBe(true);
            expect(profile.role).toBe('user');
            expect(profile.password).toBeUndefined();
            expect(profile.confirmationInfo).toBeUndefined();
            expect(profile.resetPasswordInfo).toBeUndefined();
        });

        it('should exclude confirmationInfo from profile', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword',
                confirmationInfo: {
                    lookup: 'lookup123',
                    verify: 'verify456',
                    URL: 'http://example.com/confirm'
                }
            });

            user._id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');

            const profile = user.getProfile();

            expect(profile.confirmationInfo).toBeUndefined();
        });

        it('should exclude resetPasswordInfo from profile', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword',
                resetPasswordInfo: {
                    lookup: 'reset123',
                    verify: 'reset456',
                    expire: new Date(),
                    URL: 'http://example.com/reset'
                }
            });

            user._id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439013');

            const profile = user.getProfile();

            expect(profile.resetPasswordInfo).toBeUndefined();
        });

        it('should convert ObjectId to string', () => {
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword'
            });

            const objectId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439014');
            user._id = objectId;

            const profile = user.getProfile();

            expect(typeof profile._id).toBe('string');
            expect(profile._id).toBe('507f1f77bcf86cd799439014');
        });

        it('should return all non-sensitive fields for admin user', () => {
            const user = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'hashedAdminPassword',
                confirmed: true,
                role: 'admin'
            });

            user._id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439015');

            const profile = user.getProfile();

            expect(profile._id).toBe('507f1f77bcf86cd799439015');
            expect(profile.name).toBe('Admin User');
            expect(profile.email).toBe('admin@example.com');
            expect(profile.role).toBe('admin');
            expect(profile.confirmed).toBe(true);
            expect(profile.password).toBeUndefined();
        });

        it('should handle user with all fields populated', () => {
            const user = new User({
                name: 'Complete User',
                email: 'complete@example.com',
                password: 'hashedPassword',
                confirmed: false,
                role: 'user',
                confirmationInfo: {
                    lookup: 'lookup123',
                    verify: 'verify456',
                    URL: 'http://example.com/confirm'
                },
                resetPasswordInfo: {
                    lookup: 'reset123',
                    verify: 'reset456',
                    expire: new Date(),
                    URL: 'http://example.com/reset'
                }
            });

            user._id = new mongoose.Types.ObjectId('507f1f77bcf86cd799439016');

            const profile = user.getProfile();

            expect(profile._id).toBe('507f1f77bcf86cd799439016');
            expect(profile.name).toBe('Complete User');
            expect(profile.email).toBe('complete@example.com');
            expect(profile.confirmed).toBe(false);
            expect(profile.role).toBe('user');
            expect(profile.password).toBeUndefined();
            expect(profile.confirmationInfo).toBeUndefined();
            expect(profile.resetPasswordInfo).toBeUndefined();
        });
    });

    describe('Model name', () => {
        it('should have correct model name', () => {
            expect(User.modelName).toBe('User');
        });
    });

    describe('Role validation', () => {
        it('should accept valid role values', () => {
            const user1 = new User({
                name: 'User One',
                email: 'user1@example.com',
                password: 'password',
                role: 'user'
            });

            const user2 = new User({
                name: 'Admin One',
                email: 'admin1@example.com',
                password: 'password',
                role: 'admin'
            });

            expect(user1.role).toBe('user');
            expect(user2.role).toBe('admin');
        });
    });

    describe('Schema structure', () => {
        it('should create a document with proper structure', () => {
            const user = new User({
                name: 'Test',
                email: 'test@example.com',
                password: 'password'
            });

            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('password');
            expect(user).toHaveProperty('confirmed');
            expect(user).toHaveProperty('role');
        });
    });
});
