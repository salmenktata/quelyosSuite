// Charger les variables d'environnement de test
require('dotenv').config({ path: '.env.test' });

// Protection contre l'exécution des tests sur la base de production
if (process.env.NODE_ENV !== 'test') {
  console.error('\n❌ ERREUR: Les tests doivent être exécutés avec NODE_ENV=test');
  console.error('   Utilisez: NODE_ENV=test npm test');
  console.error('   Cela évite de supprimer les données de développement\n');
  process.exit(1);
}

// Vérifier que TEST_DATABASE_URL est défini
if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL?.includes('test')) {
  console.error('\n❌ ERREUR: TEST_DATABASE_URL doit être défini pour les tests');
  console.error('   Ajoutez TEST_DATABASE_URL à votre .env.test');
  console.error('   Exemple: TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/quelyos_test"\n');
  process.exit(1);
}

// Configurer l'environnement de test
process.env.JWT_SECRET = process.env.JWT_SECRET_TEST || 'test-secret-key-do-not-use-in-production';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

console.log('✅ Configuration des tests OK');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   DATABASE: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
