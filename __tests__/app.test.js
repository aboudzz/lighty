const request = require('supertest');

const app = require('../app');

describe('GET /', () => {
	it('should return 200 OK', async () => {
		const res = await request(app).get('/');
		expect(res.statusCode).toEqual(200);
	});
});

describe('GET /ping', () => {
	it('should return pong', async () => {
		const res = await request(app).get('/ping');
		expect(res.statusCode).toEqual(200);
		expect(res.text).toEqual('pong');
	});
});

describe('GET /health', () => {
	it('should return health status with db field', async () => {
		const res = await request(app).get('/health');
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('status');
		expect(res.body).toHaveProperty('db');
	});
});

describe('GET /nonexistent', () => {
	it('should return 404 Not Found', async () => {
		const res = await request(app).get('/nonexistent');
		expect(res.statusCode).toEqual(404);
	});
});
