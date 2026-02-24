const passportJwt = require('passport-jwt');
const User = require('../models/User');
const jwtStrategy = require('../utils/jwtStrategy');

jest.mock('../models/User', () => {
    const User = jest.requireActual('../models/User');
    User.findById = jest.fn();
    return User;
});

describe('JWT Strategy', () => {
    let mockPayload;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockPayload = { sub: 'user123' };
        mockNext = jest.fn();
    });

    describe('Strategy Configuration', () => {
        it('should be a valid JWT strategy instance', () => {
            expect(jwtStrategy).toBeDefined();
            expect(jwtStrategy.name).toBe('jwt');
        });

        it('should have JWT verification function', () => {
            expect(jwtStrategy._verify).toBeDefined();
            expect(typeof jwtStrategy._verify).toBe('function');
        });
    });

    describe('JWT Verification', () => {
        it('should successfully authenticate when user is found', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'John Doe',
                email: 'john@example.com',
                confirmed: true
            };

            User.findById.mockResolvedValue(mockUser);

            await jwtStrategy._verify(mockPayload, mockNext);

            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalledWith(null, mockUser);
        });

        it('should return false when user is not found', async () => {
            User.findById.mockResolvedValue(null);

            await jwtStrategy._verify(mockPayload, mockNext);

            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalledWith(null, false);
        });

        it('should handle database errors gracefully', async () => {
            const mockError = new Error('Database connection error');
            User.findById.mockRejectedValue(mockError);

            await jwtStrategy._verify(mockPayload, mockNext);

            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });

        it('should handle different user IDs from payload', async () => {
            const mockUser1 = { _id: 'user456', name: 'Jane Doe' };
            const mockUser2 = { _id: 'user789', name: 'Bob Smith' };

            User.findById.mockResolvedValueOnce(mockUser1);
            await jwtStrategy._verify({ sub: 'user456' }, mockNext);
            expect(mockNext).toHaveBeenCalledWith(null, mockUser1);

            mockNext.mockClear();
            User.findById.mockResolvedValueOnce(mockUser2);
            await jwtStrategy._verify({ sub: 'user789' }, mockNext);
            expect(mockNext).toHaveBeenCalledWith(null, mockUser2);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid payload gracefully', async () => {
            User.findById.mockResolvedValue(null);

            await jwtStrategy._verify({ sub: null }, mockNext);

            expect(mockNext).toHaveBeenCalledWith(null, false);
        });

        it('should handle missing sub in payload', async () => {
            User.findById.mockResolvedValue(null);

            await jwtStrategy._verify({}, mockNext);

            expect(mockNext).toHaveBeenCalledWith(null, false);
        });

        it('should propagate mongoose errors', async () => {
            const mongooseError = new Error('Cast to ObjectId failed');
            mongooseError.name = 'CastError';
            User.findById.mockRejectedValue(mongooseError);

            await jwtStrategy._verify(mockPayload, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mongooseError);
        });
    });
});
