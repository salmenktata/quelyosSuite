const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ 
    where: { name: 'Quelyos Demo SAS' } 
  });
  
  if (!company) {
    throw new Error('Company introuvable');
  }
  
  const hashedPassword = await bcrypt.hash('changeme', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@quelyos.test',
      password: hashedPassword,
      role: 'ADMIN',
      isDemo: false,
      companyId: company.id,
    },
  });
  
  console.log('✅ Utilisateur créé:', user.email);
  console.log('   Company ID:', company.id);
  console.log('   isDemo:', company.isDemo);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
