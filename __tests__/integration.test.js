const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

jest.mock('../models/User', () => {
    const User = jest.requireActual('../models/User');
    User.findById = jest.fn();
    User.findOne = jest.fn();
    User.create = jest.fn();
    User.deleteOne = jest.fn();
    return User;
});

const app = require('../app');

describe('Integration Tests - User Workflows', () => {
    let testUser;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup test user
        const hash = bcrypt.hashSync('TestPassword123', 10);
        testUser = new User({
            _id: '507f1f77bcf86cd799439011',
            name: 'Integration Test User',
            email: 'integration@example.com',
            password: hash,
            confirmed: false,
            role: 'user'
        });
        testUser.save = jest.fn().mockResolvedValue(testUser);
    });

    describe('User Registration and Confirmation Flow', () => {
        it('should complete full registration and confirmation workflow', async () => {
            // Step 1: Register new user
            let createdUser = null;
            User.findOne.mockResolvedValue(null);
            User.create.mockImplementation(userData => {
                createdUser = new User({
                    _id: '507f1f77bcf86cd799439012',
                    name: userData.name,
                    email: userData.email,
                    password: userData.password,
                    confirmed: false,
                    confirmationInfo: userData.confirmationInfo
                });
                createdUser.save = jest.fn().mockResolvedValue(createdUser);
                return Promise.resolve(createdUser);
            });

            const registerResponse = await request(app)
                .post('/api/v1/users/register')
                .send({
                    name: 'New User',
                    email: 'newuser@example.com',
                    password: 'SecurePass123'
                });

            expect(registerResponse.status).toBe(201);
            expect(registerResponse.body.email).toBe('newuser@example.com');
            expect(registerResponse.body.confirmed).toBe(false);
            expect(createdUser.confirmationInfo).toBeDefined();

            // Step 2: Confirm email
            const lookup = createdUser.confirmationInfo.lookup;
            const verify = createdUser.confirmationInfo.verify;

            User.findOne.mockResolvedValue(createdUser);

            const confirmResponse = await request(app)
                .get(`/api/v1/users/confirm?l=${lookup}&v=${verify}`);

            expect(confirmResponse.status).toBe(200);
            expect(createdUser.confirmed).toBe(true);
            // confirmationInfo is set to undefined in the confirm middleware
        });

        it('should reject registration with weak password', async () => {
            User.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/v1/users/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'weak'
                });

            expect(response.status).toBe(400);
        });

        it('should reject duplicate email registration', async () => {
            User.findOne.mockResolvedValue(testUser);

            const response = await request(app)
                .post('/api/v1/users/register')
                .send({
                    name: 'Another User',
                    email: 'integration@example.com',
                    password: 'SecurePass123'
                });

            expect(response.status).toBe(400);
            expect(response.body.code).toBe('EMAIL_ALREADY_REGISTERED');
        });
    });

    describe('Authentication and Password Management Flow', () => {
        beforeEach(() => {
            testUser.confirmed = true;
        });

        it('should complete authentication workflow', async () => {
            User.findOne.mockResolvedValue(testUser);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'integration@example.com',
                    password: 'TestPassword123'
                });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            expect(response.body.email).toBe('integration@example.com');
        });

        it('should complete forgot password and reset workflow', async () => {
            // Step 1: Request password reset
            User.findOne.mockResolvedValue(testUser);

            const forgotResponse = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'integration@example.com' });

            expect(forgotResponse.status).toBe(200);
            expect(testUser.resetPasswordInfo).toBeDefined();

            // Step 2: Reset password with token
            const lookup = testUser.resetPasswordInfo.lookup;
            const verify = testUser.resetPasswordInfo.verify;

            User.findOne.mockResolvedValue(testUser);

            const resetResponse = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({
                    lookup: lookup,
                    verify: verify,
                    password: 'NewSecurePass123'
                });

            expect(resetResponse.status).toBe(200);
            // resetPasswordInfo is set to undefined in the resetPassword middleware
        });

        it('should update password when authenticated', async () => {
            const authenticatedUser = {
                _id: '507f1f77bcf86cd799439011',
                name: 'Integration Test User',
                email: 'integration@example.com',
                password: bcrypt.hashSync('TestPassword123', 10),
                confirmed: true,
                role: 'user',
                save: jest.fn().mockResolvedValue(true)
            };

            // Mock User.findById to return our test user for JWT authentication
            User.findById.mockResolvedValue(authenticatedUser);

            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ userId: authenticatedUser._id }, process.env.JWT_SECRET || 'test-secret');

            const response = await request(app)
                .post('/api/v1/auth/update-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'TestPassword123',
                    newPassword: 'NewTestPass123'
                });

            expect(response.status).toBe(200);
            expect(authenticatedUser.save).toHaveBeenCalled();
            expect(authenticatedUser.password).toBe('NewTestPass123');
        });

        it('should reject password update with incorrect old password', async () => {
            const authenticatedUser = {
                _id: '507f1f77bcf86cd799439011',
                name: 'Integration Test User',
                email: 'integration@example.com',
                password: bcrypt.hashSync('TestPassword123', 10),
                confirmed: true,
                role: 'user',
                save: jest.fn().mockResolvedValue(true)
            };

            // Mock User.findById to return our test user for JWT authentication
            User.findById.mockResolvedValue(authenticatedUser);

            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ userId: authenticatedUser._id }, process.env.JWT_SECRET || 'test-secret');

            const response = await request(app)
                .post('/api/v1/auth/update-password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'WrongPassword123',
                    newPassword: 'NewTestPass123'
                });

            expect(response.status).toBe(400);
            expect(response.body.code).toBe('INCORRECT_PASSWORD');
            expect(authenticatedUser.save).not.toHaveBeenCalled();
        });
    });

    describe('API Versioning', () => {
        it('should access routes via /api/v1 prefix', async () => {
            const response = await request(app).get('/api/v1/ping');
            expect(response.status).toBe(404); // ping is not under api/v1
        });

        it('should maintain backward compatibility with legacy routes', async () => {
            User.findById.mockResolvedValue(testUser);

            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ sub: testUser._id }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only-min-32-chars');

            const response = await request(app)
                .get('/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
        });

        it('should work with new versioned routes', async () => {
            User.findById.mockResolvedValue(testUser);

            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ sub: testUser._id }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only-min-32-chars');

            const response = await request(app)
                .get('/api/v1/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
        });
    });

    describe('Error Handling and Validation', () => {
        it('should handle malformed email addresses', async () => {
            User.findOne.mockResolvedValue(null);
            
            const response = await request(app)
                .post('/api/v1/users/register')
                .send({
                    name: 'Test User',
                    email: 'not-an-email',
                    password: 'SecurePass123'
                });

            expect(response.status).toBe(400);
        });

        it('should handle missing required fields', async () => {
            const response = await request(app)
                .post('/api/v1/users/register')
                .send({
                    name: 'Test User'
                    // missing email and password
                });

            expect(response.status).toBe(400);
        });

        it('should return 404 for non-existent user', async () => {
            // Return testUser for passport auth, then null for the actual lookup
            User.findById
                .mockResolvedValueOnce(testUser)
                .mockResolvedValueOnce(null);

            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ sub: testUser._id }, process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only-min-32-chars');

            const response = await request(app)
                .get('/api/v1/users/507f1f77bcf86cd799439099')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
        });
    });

    describe('JWT Token Expiry', () => {
        it('should reject an expired JWT token', async () => {
            const jwt = require('jsonwebtoken');
            const expiredToken = jwt.sign(
                { sub: '507f1f77bcf86cd799439011' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '0s' }
            );

            const response = await request(app)
                .post('/api/v1/auth/update-password')
                .set('Authorization', `Bearer ${expiredToken}`)
                .send({ oldPassword: 'Old123', newPassword: 'New123' });

            expect(response.status).toBe(401);
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limiting to requests', async () => {
            const response = await request(app).get('/');
            
            expect(response.headers['ratelimit-limit']).toBeDefined();
            expect(response.headers['ratelimit-remaining']).toBeDefined();
        });

        it('should return 429 when rate limit is exceeded', async () => {
            const config = require('config');
            const max = config.get('rateLimit.max');
            // Send requests sequentially so the rate limiter counts accurately
            for (let i = 0; i < max; i++) {
                await request(app).get('/ping');
            }
            const response = await request(app).get('/ping');
            expect(response.status).toBe(429);
        });
    });
});
