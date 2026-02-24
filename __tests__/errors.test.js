const errors = require('../utils/errors');
const createError = require('http-errors');

describe('Errors Utility', () => {
    describe('Error Objects', () => {
        it('should have BAD_REQUEST error with correct properties', () => {
            expect(errors.BAD_REQUEST.status).toBe(400);
            expect(errors.BAD_REQUEST.code).toBe('BAD_REQUEST');
        });

        it('should have NOT_FOUND error with correct properties', () => {
            expect(errors.NOT_FOUND.status).toBe(404);
            expect(errors.NOT_FOUND.code).toBe('NOT_FOUND');
        });

        it('should have UNAUTHORIZED error with correct properties', () => {
            expect(errors.UNAUTHORIZED.status).toBe(403);
            expect(errors.UNAUTHORIZED.code).toBe('UNAUTHORIZED');
        });

        it('should have LINK_EXPIRED error with correct properties', () => {
            expect(errors.LINK_EXPIRED.status).toBe(410);
            expect(errors.LINK_EXPIRED.code).toBe('LINK_EXPIRED');
        });

        it('should have EMAIL_ALREADY_REGISTERED error with correct properties', () => {
            expect(errors.EMAIL_ALREADY_REGISTERED.status).toBe(400);
            expect(errors.EMAIL_ALREADY_REGISTERED.code).toBe('EMAIL_ALREADY_REGISTERED');
        });

        it('should have EMAIL_NOT_REGISTERED error with correct properties', () => {
            expect(errors.EMAIL_NOT_REGISTERED.status).toBe(400);
            expect(errors.EMAIL_NOT_REGISTERED.code).toBe('EMAIL_NOT_REGISTERED');
        });

        it('should have INCORRECT_PASSWORD error with correct properties', () => {
            expect(errors.INCORRECT_PASSWORD.status).toBe(400);
            expect(errors.INCORRECT_PASSWORD.code).toBe('INCORRECT_PASSWORD');
        });
    });

    describe('error404 middleware', () => {
        let mockReq, mockRes, mockNext;

        beforeEach(() => {
            mockReq = {
                method: 'GET',
                url: '/nonexistent/path'
            };
            mockRes = {};
            mockNext = jest.fn();
        });

        it('should call next with 404 error', () => {
            errors.error404(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
            const error = mockNext.mock.calls[0][0];
            expect(error.status).toBe(404);
            expect(error.message).toContain('GET');
            expect(error.message).toContain('/nonexistent/path');
        });

        it('should include request method and URL in error message', () => {
            mockReq.method = 'POST';
            mockReq.url = '/api/missing';

            errors.error404(mockReq, mockRes, mockNext);

            const error = mockNext.mock.calls[0][0];
            expect(error.message).toContain('POST');
            expect(error.message).toContain('/api/missing');
        });
    });

    describe('handler middleware', () => {
        let mockReq, mockRes, mockNext;

        beforeEach(() => {
            mockReq = {};
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            mockNext = jest.fn();
        });

        it('should respond with error status and code', () => {
            const error = createError(404, 'Not Found', { code: 'NOT_FOUND' });

            errors.handler(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                code: 'NOT_FOUND',
                message: 'Not Found'
            });
        });

        it('should default to status 500 for errors without status', () => {
            const error = new Error('Internal error');

            errors.handler(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });

        it('should use INTERNAL_SERVER_ERROR code for errors without code', () => {
            const error = new Error('Server error');
            error.status = 500;

            errors.handler(error, mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Server error'
            });
        });

        it('should hide error message in production environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const error = createError(500, 'Sensitive error details', { code: 'SERVER_ERROR' });

            errors.handler(error, mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                code: 'SERVER_ERROR',
                message: undefined
            });

            process.env.NODE_ENV = originalEnv;
        });

        it('should show error message in non-production environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const error = createError(400, 'Detailed error message', { code: 'BAD_REQUEST' });

            errors.handler(error, mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                code: 'BAD_REQUEST',
                message: 'Detailed error message'
            });

            process.env.NODE_ENV = originalEnv;
        });

        it('should handle errors with custom codes', () => {
            const error = createError(422, 'Validation failed', { code: 'VALIDATION_ERROR' });

            errors.handler(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(422);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'VALIDATION_ERROR' })
            );
        });
    });
});
