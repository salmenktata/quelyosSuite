const fs = require('fs');

// Lecture du fichier CSV de test
const buffer = fs.readFileSync(__dirname + '/__tests__/fixtures/valid.csv');
const content = buffer.toString('utf-8');

// Parsing CSV natif simple (pas de gestion des guillemets/échappements complexes)
const lines = content.split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  console.log('Aucune donnée à parser.');
  process.exit(1);
}
const headers = lines[0].split(',').map(h => h.trim());
const rows = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = (values[i] || '').trim();
  });
  return obj;
});

console.log('Résultat parsing CSV natif:', rows);
