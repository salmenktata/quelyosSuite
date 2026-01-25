#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

/**
 * Script de création des utilisateurs Expert et Pro pour Quelyos Finance
 * Usage: node create-expert-pro-users.js
 */

async function main() {
  console.log('🚀 Création des utilisateurs Expert et Pro - Quelyos Finance\n');

  try {
    // 1. Récupérer ou créer une Company de test
    let company = await prisma.company.findFirst({
      where: { name: 'Quelyos Test SAS' }
    });

    if (!company) {
      console.log('📦 Création de la Company "Quelyos Test SAS"...');
      company = await prisma.company.create({
        data: {
          name: 'Quelyos Test SAS',
          isDemo: false
        }
      });
      console.log(`✅ Company créée: ID=${company.id}, name="${company.name}"\n`);
    } else {
      console.log(`✅ Company existante: ID=${company.id}, name="${company.name}"\n`);
    }

    // 2. Créer utilisateur Expert (ADMIN)
    const expertEmail = 'expert@quelyos.com';
    const expertPassword = 'Expert2025!Quelyos';

    let expertUser = await prisma.user.findUnique({ where: { email: expertEmail } });

    if (expertUser) {
      console.log(`⚠️  Utilisateur ${expertEmail} existe déjà (ID=${expertUser.id})`);
      console.log('   Mise à jour du mot de passe...');
      const hashedExpertPassword = await bcrypt.hash(expertPassword, 10);
      expertUser = await prisma.user.update({
        where: { email: expertEmail },
        data: {
          password: hashedExpertPassword,
          role: 'ADMIN',
          companyId: company.id
        }
      });
      console.log(`✅ Mot de passe mis à jour pour ${expertEmail}\n`);
    } else {
      const hashedExpertPassword = await bcrypt.hash(expertPassword, 10);
      expertUser = await prisma.user.create({
        data: {
          email: expertEmail,
          password: hashedExpertPassword,
          role: 'ADMIN',
          companyId: company.id,
          emailVerified: true
        }
      });
      console.log(`✅ Utilisateur Expert créé: ${expertEmail} (ID=${expertUser.id})\n`);
    }

    // 3. Créer utilisateur Pro (USER)
    const proEmail = 'pro@quelyos.com';
    const proPassword = 'Pro2025!Quelyos';

    let proUser = await prisma.user.findUnique({ where: { email: proEmail } });

    if (proUser) {
      console.log(`⚠️  Utilisateur ${proEmail} existe déjà (ID=${proUser.id})`);
      console.log('   Mise à jour du mot de passe...');
      const hashedProPassword = await bcrypt.hash(proPassword, 10);
      proUser = await prisma.user.update({
        where: { email: proEmail },
        data: {
          password: hashedProPassword,
          role: 'USER',
          companyId: company.id
        }
      });
      console.log(`✅ Mot de passe mis à jour pour ${proEmail}\n`);
    } else {
      const hashedProPassword = await bcrypt.hash(proPassword, 10);
      proUser = await prisma.user.create({
        data: {
          email: proEmail,
          password: hashedProPassword,
          role: 'USER',
          companyId: company.id,
          emailVerified: true
        }
      });
      console.log(`✅ Utilisateur Pro créé: ${proEmail} (ID=${proUser.id})\n`);
    }

    // 4. Créer un compte bancaire par défaut si nécessaire
    const existingAccount = await prisma.account.findFirst({
      where: { companyId: company.id }
    });

    if (!existingAccount) {
      const mainAccount = await prisma.account.create({
        data: {
          name: 'Compte Principal',
          companyId: company.id
        }
      });
      console.log(`✅ Compte bancaire créé: ${mainAccount.name} (ID=${mainAccount.id})\n`);
    } else {
      console.log(`✅ Compte bancaire existant: ${existingAccount.name} (ID=${existingAccount.id})\n`);
    }

    // 5. Afficher les credentials
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 SUCCÈS - Utilisateurs Quelyos Finance créés/mis à jour');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('👤 EXPERT (Admin Access)');
    console.log(`   📧 Email:    ${expertEmail}`);
    console.log(`   🔑 Password: ${expertPassword}`);
    console.log(`   🏢 Company:  ${company.name} (ID=${company.id})`);
    console.log(`   👔 Role:     ADMIN`);
    console.log('');
    console.log('👤 PRO (Normal Access)');
    console.log(`   📧 Email:    ${proEmail}`);
    console.log(`   🔑 Password: ${proPassword}`);
    console.log(`   🏢 Company:  ${company.name} (ID=${company.id})`);
    console.log(`   👔 Role:     USER`);
    console.log('');
    console.log('🌐 Test Login:');
    console.log('   Localhost: http://localhost:3002 (Finance Frontend)');
    console.log('   VPS:       https://finance.quelyos.com');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
