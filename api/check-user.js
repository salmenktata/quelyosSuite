const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@quelyos.com' },
    include: { Company: true }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Company ID:', user.companyId);
  console.log('  Company:', user.Company?.name);
  console.log('  Password hash:', user.password.substring(0, 20) + '...');

  // Test password
  const isValid = await bcrypt.compare('demo123456', user.password);
  console.log('  Password valid:', isValid);

  await prisma.$disconnect();
}

checkUser();
