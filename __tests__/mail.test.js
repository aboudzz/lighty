const mailService = require('../services/mail');
const ejs = require('ejs');
const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        verify: jest.fn((cb) => cb(null, true)),
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        close: jest.fn().mockResolvedValue(undefined)
    })
}));
jest.mock('ejs');

describe('Mail Service', () => {
    let mockTransporter;
    let mockSendMail;
    let mockClose;
    let consoleErrorSpy;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Suppress console.error for expected errors in tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Setup nodemailer mock
        mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
        mockClose = jest.fn().mockResolvedValue(undefined);
        mockTransporter = {
            sendMail: mockSendMail,
            close: mockClose
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        // Setup EJS mock
        ejs.renderFile.mockImplementation((file, data, callback) => {
            if (callback) {
                callback(null, `Email content for ${data.name}`);
            }
            return Promise.resolve(`Email content for ${data.name}`);
        });
    });

    afterEach(() => {
        // Restore console.error
        consoleErrorSpy.mockRestore();
    });

    describe('sendConfirmation', () => {
        it('should send confirmation email with correct parameters', async () => {
            const user = {
                email: 'test@example.com',
                name: 'Test User',
                confirmationInfo: {
                    lookup: 'test-lookup',
                    verify: 'test-verify',
                    URL: 'http://localhost:3000/users/confirm'
                }
            };

            await mailService.sendConfirmation(user);

            expect(ejs.renderFile).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@example.com',
                    subject: 'Confirmation Email',
                    text: expect.any(String)
                })
            );
            expect(mockClose).toHaveBeenCalled();
        });

        it('should generate correct confirmation link', async () => {
            const user = {
                email: 'test@example.com',
                name: 'Test User',
                confirmationInfo: {
                    lookup: 'abc123',
                    verify: 'xyz789',
                    URL: 'http://localhost:3000/users/confirm'
                }
            };

            await mailService.sendConfirmation(user);

            const renderCall = ejs.renderFile.mock.calls[0];
            expect(renderCall[1].link).toBe('http://localhost:3000/users/confirm?l=abc123&v=xyz789');
        });

        it('should handle email rendering errors', async () => {
            ejs.renderFile.mockRejectedValue(new Error('Template error'));

            const user = {
                email: 'test@example.com',
                name: 'Test User',
                confirmationInfo: {
                    lookup: 'test-lookup',
                    verify: 'test-verify',
                    URL: 'http://localhost:3000/users/confirm'
                }
            };

            await expect(mailService.sendConfirmation(user)).rejects.toThrow('Template error');
            
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to render or send confirmation email:',
                'Template error'
            );
        });
    });

    describe('sendResetPassword', () => {
        it('should send reset password email with correct parameters', async () => {
            const user = {
                email: 'test@example.com',
                name: 'Test User',
                resetPasswordInfo: {
                    lookup: 'reset-lookup',
                    verify: 'reset-verify',
                    URL: 'http://localhost:3000/users/resetPassword'
                }
            };

            await mailService.sendResetPassword(user);

            expect(ejs.renderFile).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@example.com',
                    subject: 'Reset Password',
                    text: expect.any(String)
                })
            );
            expect(mockClose).toHaveBeenCalled();
        });

        it('should generate correct reset password link', async () => {
            const user = {
                email: 'test@example.com',
                name: 'Test User',
                resetPasswordInfo: {
                    lookup: 'reset123',
                    verify: 'verify789',
                    URL: 'http://localhost:3000/users/resetPassword'
                }
            };

            await mailService.sendResetPassword(user);

            const renderCall = ejs.renderFile.mock.calls[0];
            expect(renderCall[1].link).toBe('http://localhost:3000/users/resetPassword?l=reset123&v=verify789');
        });

        it('should handle sending errors gracefully', async () => {
            mockSendMail.mockRejectedValue(new Error('SMTP error'));

            const user = {
                email: 'test@example.com',
                name: 'Test User',
                resetPasswordInfo: {
                    lookup: 'reset-lookup',
                    verify: 'reset-verify',
                    URL: 'http://localhost:3000/users/resetPassword'
                }
            };

            await expect(mailService.sendResetPassword(user)).rejects.toThrow('SMTP error');
            
            // Verify transporter was closed even after error
            expect(mockClose).toHaveBeenCalled();
            
            // Verify errors were logged
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send email:', 'SMTP error');
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to render or send reset password email:',
                'SMTP error'
            );
        });
    });

    describe('Mail configuration', () => {
        it('should throw error when MAIL_SENDER_PASSWORD is not configured', async () => {
            // Temporarily unset MAIL_SENDER_PASSWORD
            const originalPassword = process.env.MAIL_SENDER_PASSWORD;
            delete process.env.MAIL_SENDER_PASSWORD;

            // Reload the module to pick up the change
            jest.resetModules();
            
            // Re-setup mocks after module reset
            jest.doMock('ejs', () => ({
                renderFile: jest.fn().mockResolvedValue('Email content')
            }));
            
            jest.doMock('nodemailer', () => ({
                createTransport: jest.fn().mockReturnValue({
                    verify: jest.fn((cb) => cb(null, true)),
                    sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
                    close: jest.fn()
                })
            }));
            
            const mailServiceNoPass = require('../services/mail');

            const user = {
                email: 'test@example.com',
                name: 'Test User',
                confirmationInfo: {
                    lookup: 'test-lookup',
                    verify: 'test-verify',
                    URL: 'http://localhost:3000/users/confirm'
                }
            };

            // Should throw error when trying to send without password configured
            await expect(mailServiceNoPass.sendConfirmation(user))
                .rejects
                .toThrow('MAIL_SENDER_PASSWORD not configured');

            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to render or send confirmation email:',
                'MAIL_SENDER_PASSWORD not configured. Cannot send email.'
            );

            // Restore
            if (originalPassword) {
                process.env.MAIL_SENDER_PASSWORD = originalPassword;
            }
            jest.resetModules();
        });
    });
});
