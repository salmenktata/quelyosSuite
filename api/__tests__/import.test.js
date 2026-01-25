const request = require('supertest');
const app = require('./import.app');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ...existing code...

// Préparer des fixtures en mémoire
function getFixtureBuffer(filename) {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename));
}

describe('POST /company/import/transactions', () => {
  let testCompany;
  
  beforeEach(async () => {
    // Nettoie et recrée company, compte et catégorie
    await prisma.transaction.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.company.deleteMany({});
    
    testCompany = await prisma.company.create({ 
      data: { name: 'Import Test Company' } 
    });
    
    await prisma.account.create({ 
      data: { 
        name: 'CompteTest', 
        type: 'CHECKING',
        currency: 'EUR',
        balance: 0,
        companyId: testCompany.id 
      } 
    });
    await prisma.category.create({ 
      data: { 
        name: 'CatégorieTest',
        kind: 'EXPENSE',
        companyId: testCompany.id 
      } 
    });
  });
  afterAll(async () => {
    // Suppression complète
    await prisma.transaction.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.$disconnect();
  });

  test('import CSV valide (succès)', async () => {
    const res = await request(app)
      .post('/company/import/transactions')
      .set('X-Test-CompanyId', testCompany.id.toString())
      .attach('file', getFixtureBuffer('valid.csv'), 'valid.csv');
    if (res.status !== 200) {
      console.log('Réponse JSON:', res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.imported).toBeGreaterThan(0);
    expect(res.body.failed).toBe(0);
    expect(res.body.errors.length).toBe(0);
  });

  test('import CSV avec erreurs de schéma', async () => {
    const res = await request(app)
      .post('/company/import/transactions')
      .set('X-Test-CompanyId', testCompany.id.toString())
      .attach('file', getFixtureBuffer('invalid_schema.csv'), 'invalid_schema.csv');
    expect(res.status).toBe(200);
    expect(res.body.failed).toBeGreaterThan(0);
    expect(res.body.errors.length).toBe(res.body.failed);
  });

  test('import CSV avec doublons', async () => {
    // Import une première fois
    await request(app)
      .post('/company/import/transactions')
      .set('X-Test-CompanyId', testCompany.id.toString())
      .attach('file', getFixtureBuffer('valid.csv'), 'valid.csv');
    // Réimporte le même fichier
    const res = await request(app)
      .post('/company/import/transactions')
      .set('X-Test-CompanyId', testCompany.id.toString())
      .attach('file', getFixtureBuffer('valid.csv'), 'valid.csv');
    expect(res.status).toBe(200);
    expect(res.body.duplicates).toBeGreaterThan(0);
  });

  test('import XLSX valide', async () => {
    const res = await request(app)
      .post('/company/import/transactions')
      .set('X-Test-CompanyId', testCompany.id.toString())
      .attach('file', getFixtureBuffer('valid.xlsx'), 'valid.xlsx');
    expect(res.status).toBe(200);
    expect(res.body.imported).toBeGreaterThan(0);
  });

  test('fichier trop volumineux', async () => {
    // Génère un buffer >10 Mo
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
    const res = await request(app)
      .post('/company/import/transactions')
      .attach('file', bigBuffer, 'big.csv');
    expect(res.status).toBe(413);
  });

  test('MIME non supporté', async () => {
    const res = await request(app)
      .post('/company/import/transactions')
      .attach('file', Buffer.from('test'), 'test.txt');
    expect(res.status).toBe(415);
  });
});
