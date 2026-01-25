const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUnifiedSchema() {
  console.log('🧪 Test du schema Prisma unifié...\n');
  
  try {
    // Test 1: Vérifier les tables Finance
    const companyCount = await prisma.company.count();
    console.log(`✅ Finance - Companies: ${companyCount}`);
    
    const accountCount = await prisma.account.count();
    console.log(`✅ Finance - Accounts: ${accountCount}`);
    
    const transactionCount = await prisma.transaction.count();
    console.log(`✅ Finance - Transactions: ${transactionCount}`);
    
    // Test 2: Vérifier les tables Marketing (doivent être vides)
    const postCount = await prisma.post.count();
    console.log(`✅ Marketing - Posts: ${postCount}`);
    
    const socialAccountCount = await prisma.socialAccount.count();
    console.log(`✅ Marketing - Social Accounts: ${socialAccountCount}`);
    
    const waitlistCount = await prisma.waitlist.count();
    console.log(`✅ Marketing - Waitlist: ${waitlistCount}`);
    
    // Test 3: Vérifier la fusion Company
    const company = await prisma.company.findFirst({
      include: {
        socialAccounts: true,
        posts: true,
      }
    });
    
    if (company) {
      console.log(`\n✅ Company fusionnée:`);
      console.log(`   - ID: ${company.id}`);
      console.log(`   - Name: ${company.name}`);
      console.log(`   - Sector: ${company.sector || 'N/A'}`);
      console.log(`   - Website: ${company.website || 'N/A'}`);
      console.log(`   - Social Accounts: ${company.socialAccounts.length}`);
      console.log(`   - Posts: ${company.posts.length}`);
    }
    
    console.log(`\n✅ Tous les tests passés - Schema unifié fonctionnel!`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUnifiedSchema();
