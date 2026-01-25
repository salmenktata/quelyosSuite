const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Vérifier si un superadmin existe déjà
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    });

    if (existingSuperAdmin) {
      console.log('✅ SuperAdmin existe déjà:', existingSuperAdmin.email);
      return;
    }

    // Récupérer la company démo
    const company = await prisma.company.findFirst({
      where: { isDemo: true }
    });

    if (!company) {
      throw new Error('Company démo non trouvée');
    }

    // Créer le superadmin
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@quelyos.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        isDemo: true,
        companyId: company.id,
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true
      }
    });

    console.log('\n✅ SuperAdmin créé avec succès!\n');
    console.log('📋 CREDENTIALS SUPERADMIN:');
    console.log('   Email: superadmin@quelyos.com');
    console.log('   Password: superadmin123');
    console.log('   Role: SUPERADMIN');
    console.log('   Company ID:', company.id);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
