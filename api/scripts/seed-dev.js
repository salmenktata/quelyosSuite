/**
 * Script de seed automatique pour l'environnement de développement/staging
 * 
 * CREDENTIALS UNIFIÉS (local + VPS) :
 * - Email: demo@quelyos.com
 * - Password: demo123456
 * - Role: ADMIN
 * 
 * Ce script s'exécute automatiquement au démarrage de l'API si SEED_ON_START=true
 * ou peut être lancé manuellement : node scripts/seed-dev.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================
// CREDENTIALS DE DÉVELOPPEMENT - NE PAS MODIFIER
// ============================================
const DEV_CREDENTIALS = {
  email: 'demo@quelyos.com',
  password: 'demo123456',
  role: 'ADMIN',
  companyName: 'Quelyos Demo'
};

async function seedDevUser() {
  console.log('🌱 Seed Dev: Vérification utilisateur démo...');
  
  try {
    // 1. Vérifier/créer la company démo
    let company = await prisma.company.findFirst({
      where: { isDemo: true }
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: DEV_CREDENTIALS.companyName,
          isDemo: true
        }
      });
      console.log('✅ Company démo créée:', company.id);
    } else {
      console.log('✅ Company démo existante:', company.id);
    }
    
    // 2. Vérifier/créer l'utilisateur démo
    const existingUser = await prisma.user.findUnique({
      where: { email: DEV_CREDENTIALS.email }
    });
    
    const hashedPassword = await bcrypt.hash(DEV_CREDENTIALS.password, 10);
    
    if (existingUser) {
      // Mettre à jour le mot de passe pour s'assurer qu'il est correct
      await prisma.user.update({
        where: { email: DEV_CREDENTIALS.email },
        data: { 
          password: hashedPassword,
          companyId: company.id,
          role: DEV_CREDENTIALS.role,
          isDemo: true
        }
      });
      console.log('✅ User démo mis à jour:', DEV_CREDENTIALS.email);
    } else {
      await prisma.user.create({
        data: {
          email: DEV_CREDENTIALS.email,
          password: hashedPassword,
          role: DEV_CREDENTIALS.role,
          companyId: company.id,
          isDemo: true
        }
      });
      console.log('✅ User démo créé:', DEV_CREDENTIALS.email);
    }
    
    // 3. Créer les settings de la company si nécessaires
    const existingSettings = await prisma.companySettings.findUnique({
      where: { companyId: company.id }
    });
    
    if (!existingSettings) {
      await prisma.companySettings.create({
        data: {
          companyId: company.id,
          vatActive: true,
          vatMode: 'HT',
          vatDefaultRate: 20.0,
        }
      });
      console.log('✅ Settings démo créés');
    }
    
    // 4. Créer un compte bancaire par défaut si nécessaire
    const existingAccount = await prisma.account.findFirst({
      where: { companyId: company.id }
    });
    
    if (!existingAccount) {
      await prisma.account.create({
        data: {
          name: 'Compte Principal',
          type: 'banque',
          currency: 'EUR',
          balance: 50000.00,
          isShared: true,
          companyId: company.id,
        }
      });
      console.log('✅ Compte bancaire démo créé');
    }
    
    console.log('\n📋 CREDENTIALS DE CONNEXION:');
    console.log('   Email:', DEV_CREDENTIALS.email);
    console.log('   Password:', DEV_CREDENTIALS.password);
    console.log('   Role:', DEV_CREDENTIALS.role);
    console.log('');
    
    return { success: true, user: DEV_CREDENTIALS.email };
    
  } catch (error) {
    console.error('❌ Erreur seed:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    await seedDevUser();
  } finally {
    await prisma.$disconnect();
  }
}

// Si exécuté directement (node scripts/seed-dev.js)
if (require.main === module) {
  main();
}

// Export pour utilisation dans server.js
module.exports = { seedDevUser, DEV_CREDENTIALS };
