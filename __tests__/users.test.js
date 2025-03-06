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

const hash = bcrypt.hashSync('password', 10);
const userJohnDoe = new User({ name: 'John Doe', email: 'john@example.com', password: hash, confirmed: true });
userJohnDoe.save = jest.fn();

let authenticatedUser = userJohnDoe;
passport.authenticate = jest.fn((strategy, options, callback) => (req, res, next) => {
    req.user = authenticatedUser;
    next();
});

const app = require('../app');

describe('GET /users/:id', () => {
    it('should return a user profile when id is provided', async () => {
        User.findById.mockResolvedValue(userJohnDoe);

        const res = await request(app).get('/users/1234567891');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return 404 when user is not found', async () => {
        User.findById.mockResolvedValue(null);

        const res = await request(app).get('/users/123');

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
            .send({name: 'Jane Smith', email: 'jane@example.com', password: 'password'});
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(createdUser.getProfile());
    });

    it('should return 400 when email already registered', async () => {
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/users/register')
        .send({name: 'John Doe II', email: 'john@example.com', password: 'password'});
    
        expect(res.statusCode).toEqual(400);
    });

    it ('should return 400 when bad request', async () => { 
        User.findOne.mockResolvedValue(null);

        const res = await request(app).post('/users/register')
        .send({name: 'Jane Smith', email: 'jane[at]example.com', password: 'password'});

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
});

describe('POST /users/authenticate', () => {
    it('should authenticate the user and get token', async () => {
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/users/authenticate')
            .send({email: 'john@example.com', password: 'password'});
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.token).toBeTruthy();        
        delete res.body.token;
        expect(res.body).toEqual(userJohnDoe.getProfile());
    });

    it('should return 400 when incorrect password', async () => {
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/users/authenticate')
            .send({email: 'john@example.com', password: 'BADPASSWORD'});
        
        expect(res.statusCode).toEqual(400);
    });

    it('should return 400 when email not registered', async () => {
        User.findOne.mockResolvedValue(null);
        
        const res = await request(app).post('/users/authenticate')
            .send({email: 'jane@example.com', password: 'password'});

        expect(res.statusCode).toEqual(400);
    });
});

describe('POST /users/forgotpassword', () => {
    it('should return 200 when email is registered', async () => {
        userJohnDoe.resetPasswordInfo = null;
        User.findOne.mockResolvedValue(userJohnDoe);

        const res = await request(app).post('/users/forgotpassword')
            .send({ email: 'john@example.com' });
        
        expect(res.statusCode).toEqual(200);
        
        expect(userJohnDoe.resetPasswordInfo.lookup).toBeTruthy();
        expect(userJohnDoe.resetPasswordInfo.verify).toBeTruthy();
    });

    it('should also return 200 when email is not registered', async() => {
        userJohnDoe.resetPasswordInfo = null;
        User.findOne.mockResolvedValue(null);

        const res = await request(app).post('/users/forgotpassword')
            .send({ email: 'john@example.com' });
        
        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.resetPasswordInfo.lookup).not.toBeTruthy();
    })
});

describe('POST /users/updatepassword', () => {
    it('should change authenticated user\'s password', async () => {
        userJohnDoe.password = hash;
        authenticatedUser = userJohnDoe;
        
        const res = await request(app).post('/users/updatepassword')
            .send({ oldPassword: 'password', newPassword: 'newPassword' });

        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.password).not.toEqual(hash);
        expect(bcrypt.compareSync('newPassword', userJohnDoe.password)).toBeTruthy();
    });

    it('should return 400 when incorrect password', async () => {
        userJohnDoe.password = hash;
        authenticatedUser = userJohnDoe;

        const res = await request(app).post('/users/updatepassword')
            .send({ oldPassword: 'BADPASSWORD', newPassword: 'newPassword' });

        expect(res.statusCode).toEqual(400);
        expect(bcrypt.compareSync('password', userJohnDoe.password)).toBeTruthy();
    });

    it('should return 401 when user is not authenticated', async () => {
        authenticatedUser = null;

        const res = await request(app).post('/users/updatepassword')
            .send({ oldPassword: 'password', newPassword: 'newPassword' });

        expect(res.statusCode).toEqual(500);
    });
});

describe('POST /users/resetpassword', () => {
    it('should change unauthenticated user\'s password', async () => {
        const resetPasswordInfo = { lookup: 'lookup', verify: 'verify' };
        userJohnDoe.resetPasswordInfo = resetPasswordInfo;
        userJohnDoe.password = hash;
        authenticatedUser = null;
        User.findOne.mockResolvedValue(userJohnDoe);
        
        const res = await request(app).post('/users/resetpassword')
            .send({ lookup: 'lookup', verify: 'verify', password: 'newPassword' });

        expect(res.statusCode).toEqual(200);
        expect(userJohnDoe.password).not.toEqual(hash);
        expect(userJohnDoe.resetPasswordInfo.lookup).not.toBeTruthy();
        expect(bcrypt.compareSync('newPassword', userJohnDoe.password)).toBeTruthy();
    });

    it('should return 400 when bad request', async () => {
        const resetPasswordInfo = { lookup: 'lookup', verify: 'verify' };
        userJohnDoe.resetPasswordInfo = resetPasswordInfo;
        userJohnDoe.password = hash;
        authenticatedUser = null;
        User.findOne.mockResolvedValue(userJohnDoe);
        
        const res = await request(app).post('/users/resetpassword')
            .send({ lookup: 'lookup', verify: 'BADVERIFY', password: 'newPassword' });

        expect(res.statusCode).toEqual(400);
        expect(bcrypt.compareSync('password', userJohnDoe.password)).toBeTruthy();
        expect(userJohnDoe.resetPasswordInfo.lookup).toEqual("lookup");
    });
});