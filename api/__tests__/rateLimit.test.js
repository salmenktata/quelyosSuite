const request = require('supertest');

// On fixe les limites avant de charger l'app pour que le middleware lise ces valeurs.
process.env.RATE_LIMIT_LOGIN = '2';
process.env.RATE_LIMIT_LOGIN_WINDOW = '60';

const app = require('../server');

describe('Rate limiting login', () => {
  it('retourne 429 après dépassement du quota login', async () => {
    const payload = { email: 'unknown@example.com', password: 'bad' };

    const first = await request(app).post('/auth/login').send(payload);
    expect([400, 401, 429]).toContain(first.status); // selon validation ou user inexistant

    const second = await request(app).post('/auth/login').send(payload);
    expect([400, 401, 429]).toContain(second.status);

    const third = await request(app).post('/auth/login').send(payload);
    expect(third.status).toBe(429);
  });
});
