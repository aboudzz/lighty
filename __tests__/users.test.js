const request = require('supertest');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

jest.mock('passport');
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));
jest.mock('../models/User', () => {
    const User = jest.requireActual('../models/User');
    User.findById = jest.fn();
    User.findOne = jest.fn();
    User.create = jest.fn();
    return User;
});

const validPassword = 'Password123';  // Strong password for testing
const hash = bcrypt.hashSync(validPassword, 10);
const userJohnDoe = new User({ name: 'John Doe', email: 'john@example.com', password: hash, confirmed: true });
userJohnDoe.save = jest.fn();

let authenticatedUser = userJohnDoe;
passport.authenticate = jest.fn((_strategy, _options, _callback) => (req, res, next) => {
    req.user = authenticatedUser;
    next();
});

const app = require('../app');

describe('GET /users/:id', () => {
    it('should return a user profile when id is provided', async () => {
        User.findById.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/507f1f77bcf86cd799439011');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return 404 when user is not found', async () => {
        User.findById.mockResolvedValue(null);

        const res = await request(app).get('/users/507f1f77bcf86cd799439012');

        expect(res.status).toBe(404);
    });
});

describe('POST /users/register', () => {
    it('should return the created user', async () => {
        let createdUser = null;
        User.findOne.mockResolvedValue(null);
        User.create.mockImplementation(user => {
            createdUser  = new User({ name: user.name, email: user.email, password: user.password })
            return createdUser;
        });

        const res = await request(app).post('/users/register')
            .send({name: 'Jane Smith', email: 'jane@example.com', password: 'StrongPass123'});
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual(createdUser.getProfile());
    });

    it('should return 400 when email already registered', async () => {
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/users/register')
        .send({name: 'John Doe II', email: 'john@example.com', password: 'StrongPass123'});
    
        expect(res.statusCode).toEqual(400);
    });

    it ('should return 400 when bad request', async () => { 
        User.findOne.mockResolvedValue(null);

        const res = await request(app).post('/users/register')
        .send({name: 'Jane Smith', email: 'jane[at]example.com', password: 'StrongPass123'});

        expect(res.statusCode).toEqual(400);
    });
});

describe('GET /users/confirm', () => {
    it('should return the confirmed user', async () => {
        const confirmationInfo = { lookup: 'lookup', verify: 'verify' };
        userJohnDoe.confirmed = false;
        userJohnDoe.confirmationInfo = confirmationInfo;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/confirm?l=lookup&v=verify');

        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.confirmed).toEqual(true);
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return 400 when bad request', async () => {
        const confirmationInfo = { lookup: 'lookup', verify: 'verify' };
        userJohnDoe.confirmed = false;
        userJohnDoe.confirmationInfo = confirmationInfo;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/confirm?l=lookup&v=BADVERIFY');

        expect(res.statusCode).toEqual(400);
        expect(userJohnDoe.confirmed).toEqual(false);
    });

    it('should return 400 when user has no confirmationInfo verify', async () => {
        const confirmationInfo = { lookup: 'lookup', verify: undefined };
        userJohnDoe.confirmationInfo = confirmationInfo;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/confirm?l=lookup&v=verify');
        expect(res.statusCode).toEqual(400);
    });

    it('should return 400 when verification token length differs', async () => {
        const confirmationInfo = { lookup: 'lookup', verify: 'ab' };
        userJohnDoe.confirmationInfo = confirmationInfo;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/confirm?l=lookup&v=abcdef');
        expect(res.statusCode).toEqual(400);
    });

    it('should return 410 when confirmation link is expired', async () => {
        const confirmationInfo = { lookup: 'lookup', verify: 'verify', expire: Date.now() - 1000 };
        userJohnDoe.confirmed = false;
        userJohnDoe.confirmationInfo = confirmationInfo;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/confirm?l=lookup&v=verify');

        expect(res.statusCode).toEqual(410);
        expect(userJohnDoe.confirmed).toEqual(false);
    });
});

describe('POST /auth/login', () => {
    it('should authenticate the user and get token', async () => {
        userJohnDoe.confirmed = true;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/auth/login')
            .send({email: 'john@example.com', password: validPassword});
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.token).toBeTruthy();        
        delete res.body.token;
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return 401 when incorrect password', async () => {
        userJohnDoe.confirmed = true;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/auth/login')
            .send({email: 'john@example.com', password: 'WrongPass123'});
        
        expect(res.statusCode).toEqual(401);
    });

    it('should return 401 when email not registered', async () => {
        User.findOne.mockResolvedValue(null);
        
        const res = await request(app).post('/auth/login')
            .send({email: 'jane@example.com', password: validPassword});

        expect(res.statusCode).toEqual(401);
    });

    it('should return 401 when user is not confirmed', async () => {
        userJohnDoe.confirmed = false;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/auth/login')
            .send({email: 'john@example.com', password: validPassword});

        expect(res.statusCode).toEqual(401);
    });
});

describe('POST /auth/forgot-password', () => {
    it('should return 200 when email is registered', async () => {
        userJohnDoe.resetPasswordInfo = null;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/auth/forgot-password')
            .send({ email: 'john@example.com' });
        
        expect(res.statusCode).toEqual(200);
        
        expect(userJohnDoe.resetPasswordInfo.lookup).toBeTruthy();
        expect(userJohnDoe.resetPasswordInfo.verify).toBeTruthy();
    });

    it('should also return 200 when email is not registered', async() => {
        userJohnDoe.resetPasswordInfo = null;
        User.findOne.mockResolvedValue(null);

        const res = await request(app).post('/auth/forgot-password')
            .send({ email: 'john@example.com' });
        
        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.resetPasswordInfo.lookup).not.toBeTruthy();
    })
});

describe('POST /auth/update-password', () => {
    it('should change authenticated user\'s password', async () => {
        userJohnDoe.password = hash;
        authenticatedUser = userJohnDoe;
        
        const res = await request(app).post('/auth/update-password')
            .send({ oldPassword: validPassword, newPassword: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.password).toEqual('NewStrongPass123');
    });

    it('should return 400 when incorrect password', async () => {
        userJohnDoe.password = hash;
        authenticatedUser = userJohnDoe;

        const res = await request(app).post('/auth/update-password')
            .send({ oldPassword: 'WrongPass123', newPassword: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(400);
        expect(userJohnDoe.password).toEqual(hash);
    });

    it('should return 401 when user is not authenticated', async () => {
        authenticatedUser = null;

        const res = await request(app).post('/auth/update-password')
            .send({ oldPassword: validPassword, newPassword: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(401);
    });
});

describe('POST /auth/reset-password', () => {
    it('should change unauthenticated user\'s password', async () => {
        const resetPasswordInfo = { lookup: 'lookup', verify: 'verify' };
        userJohnDoe.resetPasswordInfo = resetPasswordInfo;
        userJohnDoe.password = hash;
        authenticatedUser = null;
        User.findOne.mockResolvedValue(userJohnDoe);
        
        const res = await request(app).post('/auth/reset-password')
            .send({ lookup: 'lookup', verify: 'verify', password: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.password).toEqual('NewStrongPass123');
        expect(userJohnDoe.resetPasswordInfo.lookup).not.toBeTruthy();
    });

    it('should return 400 when bad request', async () => {
        const resetPasswordInfo = { lookup: 'lookup', verify: 'verify' };
        userJohnDoe.resetPasswordInfo = resetPasswordInfo;
        userJohnDoe.password = hash;
        authenticatedUser = null;
        User.findOne.mockResolvedValue(userJohnDoe);
        
        const res = await request(app).post('/auth/reset-password')
            .send({ lookup: 'lookup', verify: 'BADVERIFY', password: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(400);
        expect(bcrypt.compareSync(validPassword, userJohnDoe.password)).toBeTruthy();
        expect(userJohnDoe.resetPasswordInfo.lookup).toEqual("lookup");
    });

    it('should return 410 when reset password link is expired', async () => {
        const resetPasswordInfo = { lookup: 'lookup', verify: 'verify', expire: Date.now() - 1000 };
        userJohnDoe.resetPasswordInfo = resetPasswordInfo;
        userJohnDoe.password = hash;
        authenticatedUser = null;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/auth/reset-password')
            .send({ lookup: 'lookup', verify: 'verify', password: 'NewStrongPass123' });

        expect(res.statusCode).toEqual(410);
    });
});
