const request = require('supertest');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

jest.mock('passport');
jest.mock('../models/User', () => {
    const User = jest.requireActual('../models/User');
    User.findById = jest.fn();
    User.findOne = jest.fn();
    User.create = jest.fn();
    return User;
});

const validPassword = 'Password123';
const hash = bcrypt.hashSync(validPassword, 10);
const userJohnDoe = new User({ name: 'John Doe', email: 'john@example.com', password: hash, confirmed: true });
userJohnDoe.save = jest.fn();

let authenticatedUser = userJohnDoe;
passport.authenticate = jest.fn((_strategy, _options, _callback) => (req, res, next) => {
    req.user = authenticatedUser;
    next();
});

const app = require('../app');

describe('POST /api/v1/auth/login', () => {
    it('should authenticate the user and return a token', async () => {
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/api/v1/auth/login')
            .send({ email: 'john@example.com', password: validPassword });

        expect(res.statusCode).toEqual(200);
        expect(res.body.token).toBeTruthy();
    });
});

describe('POST /api/v1/auth/forgot-password', () => {
    it('should return 200 when email is provided', async () => {
        userJohnDoe.resetPasswordInfo = null;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/api/v1/auth/forgot-password')
            .send({ email: 'john@example.com' });

        expect(res.statusCode).toEqual(200);
    });
});

describe('POST /api/v1/auth/reset-password', () => {
    it('should reset the password successfully', async () => {
        const resetPasswordInfo = { lookup: 'lookup', verify: 'verify', expire: Date.now() + 3600000 };
        userJohnDoe.resetPasswordInfo = resetPasswordInfo;
        userJohnDoe.password = hash;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/api/v1/auth/reset-password')
            .send({ lookup: 'lookup', verify: 'verify', password: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(200);
    });
});

describe('POST /api/v1/auth/update-password', () => {
    it('should update the password when authenticated', async () => {
        userJohnDoe.password = hash;
        authenticatedUser = userJohnDoe;

        const res = await request(app).post('/api/v1/auth/update-password')
            .send({ oldPassword: validPassword, newPassword: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(200);
    });
});
