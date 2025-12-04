const { 
    validatePassword, 
    validateEmail, 
    validateName, 
    validateRole,
    validateConfirmed,
    PASSWORD_MIN_LENGTH 
} = require('../utils/validation');
const errors = require('../utils/errors');

describe('Validation Utils', () => {
    describe('validatePassword', () => {
        it('should accept a strong password', () => {
            expect(validatePassword('StrongPass123')).toBe(true);
            expect(validatePassword('MyP@ssw0rd')).toBe(true);
            expect(validatePassword('TestUser123')).toBe(true);
        });

        it('should throw BAD_REQUEST for null or undefined password', () => {
            expect(() => validatePassword(null)).toThrow(errors.BAD_REQUEST);
            expect(() => validatePassword(undefined)).toThrow(errors.BAD_REQUEST);
            expect(() => validatePassword('')).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for non-string password', () => {
            expect(() => validatePassword(12345678)).toThrow(errors.BAD_REQUEST);
            expect(() => validatePassword({})).toThrow(errors.BAD_REQUEST);
            expect(() => validatePassword([])).toThrow(errors.BAD_REQUEST);
        });

        it('should throw WEAK_PASSWORD error for password shorter than minimum length', () => {
            try {
                validatePassword('Short1');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.status).toBe(400);
                expect(error.code).toBe('WEAK_PASSWORD');
                expect(error.message).toContain(`at least ${PASSWORD_MIN_LENGTH} characters`);
            }
        });

        it('should throw WEAK_PASSWORD error for password without uppercase letter', () => {
            try {
                validatePassword('password123');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.status).toBe(400);
                expect(error.code).toBe('WEAK_PASSWORD');
                expect(error.message).toContain('uppercase letter');
            }
        });

        it('should throw WEAK_PASSWORD error for password without lowercase letter', () => {
            try {
                validatePassword('PASSWORD123');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.status).toBe(400);
                expect(error.code).toBe('WEAK_PASSWORD');
                expect(error.message).toContain('lowercase letter');
            }
        });

        it('should throw WEAK_PASSWORD error for password without number', () => {
            try {
                validatePassword('PasswordOnly');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error.status).toBe(400);
                expect(error.code).toBe('WEAK_PASSWORD');
                expect(error.message).toContain('one number');
            }
        });
    });

    describe('validateEmail', () => {
        it('should accept valid email addresses', () => {
            expect(validateEmail('test@example.com')).toBe('test@example.com');
            expect(validateEmail('user.name+tag@example.co.uk')).toBe('user.name+tag@example.co.uk');
            expect(validateEmail('email@subdomain.example.com')).toBe('email@subdomain.example.com');
        });

        it('should throw BAD_REQUEST for null or undefined email', () => {
            expect(() => validateEmail(null)).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail(undefined)).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail('')).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for non-string email', () => {
            expect(() => validateEmail(123)).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail({})).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail([])).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for invalid email format', () => {
            expect(() => validateEmail('notanemail')).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail('missing@domain')).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail('@example.com')).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail('user@')).toThrow(errors.BAD_REQUEST);
            expect(() => validateEmail('user name@example.com')).toThrow(errors.BAD_REQUEST);
        });
    });

    describe('validateName', () => {
        it('should accept and sanitize valid names', () => {
            expect(validateName('John Doe')).toBe('John Doe');
            expect(validateName('  Alice  ')).toBe('Alice');
            expect(validateName('Bob Smith-Jones')).toBe('Bob Smith-Jones');
        });

        it('should escape special characters', () => {
            expect(validateName('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
            expect(validateName('Name & Co.')).toContain('&amp;');
        });

        it('should throw BAD_REQUEST for null or undefined name', () => {
            expect(() => validateName(null)).toThrow(errors.BAD_REQUEST);
            expect(() => validateName(undefined)).toThrow(errors.BAD_REQUEST);
            expect(() => validateName('')).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for non-string name', () => {
            expect(() => validateName(123)).toThrow(errors.BAD_REQUEST);
            expect(() => validateName({})).toThrow(errors.BAD_REQUEST);
            expect(() => validateName([])).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for empty name after trimming', () => {
            expect(() => validateName('   ')).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for name longer than 100 characters', () => {
            const longName = 'a'.repeat(101);
            expect(() => validateName(longName)).toThrow(errors.BAD_REQUEST);
        });

        it('should accept name with exactly 100 characters', () => {
            const maxName = 'a'.repeat(100);
            expect(validateName(maxName)).toBe(maxName);
        });
    });

    describe('validateRole', () => {
        it('should accept and sanitize valid roles', () => {
            expect(validateRole('admin')).toBe('admin');
            expect(validateRole('  user  ')).toBe('user');
            expect(validateRole('moderator')).toBe('moderator');
        });

        it('should escape special characters in role', () => {
            expect(validateRole('<script>admin</script>')).toBe('&lt;script&gt;admin&lt;&#x2F;script&gt;');
            expect(validateRole('role & permission')).toContain('&amp;');
        });

        it('should throw BAD_REQUEST for null or undefined role', () => {
            expect(() => validateRole(null)).toThrow(errors.BAD_REQUEST);
            expect(() => validateRole(undefined)).toThrow(errors.BAD_REQUEST);
            expect(() => validateRole('')).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for non-string role', () => {
            expect(() => validateRole(123)).toThrow(errors.BAD_REQUEST);
            expect(() => validateRole({})).toThrow(errors.BAD_REQUEST);
            expect(() => validateRole([])).toThrow(errors.BAD_REQUEST);
        });
    });

    describe('validateConfirmed', () => {
        it('should accept boolean true', () => {
            expect(validateConfirmed(true)).toBe(true);
        });

        it('should accept boolean false', () => {
            expect(validateConfirmed(false)).toBe(false);
        });

        it('should accept and convert string "true" (case-sensitive)', () => {
            expect(validateConfirmed('true')).toBe(true);
        });

        it('should accept and convert string "false" (case-sensitive)', () => {
            expect(validateConfirmed('false')).toBe(false);
        });

        it('should throw BAD_REQUEST for case-insensitive boolean strings', () => {
            expect(() => validateConfirmed('True')).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed('TRUE')).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed('False')).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed('FALSE')).toThrow(errors.BAD_REQUEST);
        });

        it('should accept string "1" and "0"', () => {
            expect(validateConfirmed('1')).toBe(true);
            expect(validateConfirmed('0')).toBe(false);
        });

        it('should throw BAD_REQUEST for invalid boolean strings', () => {
            expect(() => validateConfirmed('yes')).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed('no')).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed('maybe')).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed('2')).toThrow(errors.BAD_REQUEST);
        });

        it('should throw BAD_REQUEST for non-boolean, non-string types', () => {
            expect(() => validateConfirmed(null)).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed(undefined)).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed(1)).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed(0)).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed({})).toThrow(errors.BAD_REQUEST);
            expect(() => validateConfirmed([])).toThrow(errors.BAD_REQUEST);
        });
    });

    describe('PASSWORD_MIN_LENGTH', () => {
        it('should export the correct minimum password length', () => {
            expect(PASSWORD_MIN_LENGTH).toBe(8);
        });
    });
});
