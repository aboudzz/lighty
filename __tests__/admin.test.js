const request = require('supertest');
const passport = require('passport');
const User = require('../models/User');

// Set test environment before importing app
process.env.NODE_ENV = 'test';

// Mock mongoose connection to avoid database issues
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

jest.mock('passport');
jest.mock('../models/User', () => {
    const User = jest.requireActual('../models/User');
    User.find = jest.fn();
    User.findById = jest.fn();
    User.findByIdAndUpdate = jest.fn();
    User.deleteOne = jest.fn();
    return User;
});

const userAdmin = new User({ name: 'admin', email: 'admin', confirmed: true, role: 'admin' });

// Mock the passport middleware to simulate an authenticated admin user
passport.authenticate = jest.fn((strategy, options, callback) => (req, res, next) => {
    req.user = userAdmin;
    next();
});

const app = require('../app');

describe('GET /admin/users', () => {
    it('should return a user profile when id is provided', async () => {
        let userJohnDoe = new User({ name: 'John Doe', email: 'john@example.com' });
        User.findById.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/admin/users/1234567891');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return a list of users when no id is provided', async () => {
        let userJohnDoe = new User({ name: 'John Doe', email: 'john@example.com' });
        let userJaneSmith = new User({ name: 'Jane Smith', email: 'jane@example.com' });
        User.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            countDocuments: jest.fn().mockResolvedValue(2),
            exec: jest.fn().mockResolvedValue([userJohnDoe, userJaneSmith]),
        });

        const res = await request(app).get('/admin/users');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            data: [ userJohnDoe.getProfile(), userJaneSmith.getProfile() ],
            count: 2,
        });
    });

    it('should return 404 when user is not found', async () => {
        User.findById.mockResolvedValue(null);

        const res = await request(app).get('/admin/users/123');

        expect(res.status).toBe(404);
    });
});

describe('PUT /admin/users/:id', () => {
    it('should update a user profile when valid data is provided', async () => {
        let userJohnDoe = new User({ name: 'John Doe', email: 'john@example.com' });
        User.findByIdAndUpdate.mockImplementation((id, data) => {
            userJohnDoe.name = data.name;
            userJohnDoe.email = data.email;
            userJohnDoe.confirmed = data.confirmed;
            userJohnDoe.role = data.role;
            return userJohnDoe;
        });

        const res = await request(app).put('/admin/users/1234567891')
            .send({ name: 'John Johanson Doe', email: 'john.doe@example.com', confirmed: 'true', role: 'user' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return 400 bad request when invalid data is provided', async () => {
        const res = await request(app).put('/admin/users/1234567891')
            .send({ name: 'John Doe', email: 'john.doe@example.com', confirmed: 'true', role: 'user', password: 'trying to change it' });

        expect(res.status).toBe(400);
    })

    it('should return 404 when user is not found', async () => {
        User.findByIdAndUpdate.mockResolvedValue(null);

        const res = await request(app).put('/admin/users/123');

        expect(res.status).toBe(404);
    });
});

describe('DELETE /admin/users/:id', () => {
    it('should delete a user when id is provided', async () => {
        User.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });

        const res = await request(app).delete('/admin/users/1234567891');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ acknowledged: true, deletedCount: 1 });
    });
});
