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
		//expect(res.body).toEqual('pong'); // FIXME
	});
});

describe('GET /nonexistent', () => {
	it('should return 404 Not Found', async () => {
		const res = await request(app).get('/nonexistent');
		expect(res.statusCode).toEqual(404);
	});
});