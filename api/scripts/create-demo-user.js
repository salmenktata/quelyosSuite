const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Vérifier si company existe
    let company = await prisma.company.findFirst({ where: { name: 'Demo Company' } });
    
    if (!company) {
      console.log('Création de Demo Company...');
      company = await prisma.company.create({
        data: { name: 'Demo Company' }
      });
      console.log('✅ Company créée (ID: ' + company.id + ')');
    } else {
      console.log('✅ Company existe déjà (ID: ' + company.id + ')');
    }
    
    // Vérifier si user existe
    const existing = await prisma.user.findUnique({
      where: { email: 'demo@quelyos.test' }
    });
    
    if (existing) {
      console.log('✅ Utilisateur demo@quelyos.test existe déjà (ID: ' + existing.id + ')');
      console.log('   Role: ' + existing.role);
    } else {
      const hashedPassword = await bcrypt.hash('changeme', 10);
      const user = await prisma.user.create({
        data: {
          email: 'demo@quelyos.test',
          password: hashedPassword,
          role: 'ADMIN',
          companyId: company.id
        }
      });
      console.log('✅ Utilisateur créé avec succès !');
      console.log('   Email: demo@quelyos.test');
      console.log('   Password: changeme');
      console.log('   Role: ADMIN');
      console.log('   CompanyId: ' + company.id);
      console.log('   ID: ' + user.id);
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Erreur:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
