const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Nettoie toutes les données de démonstration d'une company
 * Modes d'exécution:
 * 1. API mode: DEMO_COMPANY_ID=19 (garde l'utilisateur, remet isDemo=false)
 * 2. CLI mode: sans variable d'env (supprime tout y compris la company)
 */
async function main() {
  console.log('🧹 Nettoyage des données démo...');

  try {
    const companyId = await getCompanyId();
    await validateDemoCompany(companyId);
    
    // Nettoyage dans l'ordre des dépendances FK
    await cleanRefreshTokens(companyId);
    const accountIds = await getAccountIds(companyId);
    await cleanTransactions(accountIds);
    await cleanPlanningItems(companyId);
    await cleanAccountPortfolios(accountIds);
    await cleanBudgets(companyId);
    await cleanPortfolios(companyId);
    await cleanAccounts(companyId);
    await cleanCategories(companyId);
    await resetUsersDemo(companyId);
    await resetCompanySettings(companyId);
    await finalizeCompany(companyId);

    console.log('\n✅ Nettoyage terminé avec succès!');
    if (!process.env.DEMO_COMPANY_ID) {
      console.log('💡 Vous pouvez maintenant lancer: npm run seed');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    throw error;
  }
}

/**
 * Récupère l'ID de la company à nettoyer selon le mode
 */
async function getCompanyId() {
  if (process.env.DEMO_COMPANY_ID) {
    const companyId = parseInt(process.env.DEMO_COMPANY_ID);
    console.log(`🔍 Mode API : Company ID ${companyId}`);
    return companyId;
  }

  // Mode CLI: chercher via l'utilisateur démo
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@quelyos.test' },
    select: { companyId: true }
  });

  if (!demoUser) {
    console.log('✅ Aucune donnée démo à nettoyer');
    process.exit(0);
  }

  console.log(`🔍 Mode CLI : Company ID ${demoUser.companyId}`);
  return demoUser.companyId;
}

/**
 * Valide que la company est bien marquée comme démo (sécurité)
 */
async function validateDemoCompany(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { isDemo: true, name: true }
  });

  if (!company) {
    throw new Error(`Company avec ID ${companyId} introuvable`);
  }

  if (!company.isDemo) {
    throw new Error(`SÉCURITÉ : La company ${companyId} (${company.name}) n'est pas marquée comme démo. Opération annulée.`);
  }
}

/**
 * Supprime les refresh tokens des utilisateurs démo
 */
async function cleanRefreshTokens(companyId) {
  console.log('⏳ Suppression des refresh tokens...');
  const users = await prisma.user.findMany({
    where: { companyId, isDemo: true },
    select: { id: true }
  });
  
  if (users.length > 0) {
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: users.map(u => u.id) } }
    });
  }
}

/**
 * Récupère les IDs des comptes de la company
 */
async function getAccountIds(companyId) {
  console.log('⏳ Récupération des comptes...');
  const accounts = await prisma.account.findMany({
    where: { companyId },
    select: { id: true }
  });
  return accounts.map(a => a.id);
}

/**
 * Supprime toutes les transactions liées aux comptes
 */
async function cleanTransactions(accountIds) {
  if (accountIds.length === 0) return;
  
  console.log('⏳ Suppression des transactions...');
  await prisma.transaction.deleteMany({
    where: { accountId: { in: accountIds } }
  });
}

/**
 * Supprime les éléments de planification
 */
async function cleanPlanningItems(companyId) {
  console.log('⏳ Suppression des planning items...');
  await prisma.planningItem.deleteMany({
    where: { companyId }
  });
}

/**
 * Supprime les associations compte-portefeuille
 */
async function cleanAccountPortfolios(accountIds) {
  if (accountIds.length === 0) return;
  
  console.log('⏳ Suppression des associations compte-portefeuille...');
  await prisma.accountPortfolio.deleteMany({
    where: { accountId: { in: accountIds } }
  });
}

/**
 * Supprime les budgets
 */
async function cleanBudgets(companyId) {
  console.log('⏳ Suppression des budgets...');
  await prisma.budgets.deleteMany({
    where: { companyId }
  });
}

/**
 * Supprime les portefeuilles
 */
async function cleanPortfolios(companyId) {
  console.log('⏳ Suppression des portefeuilles...');
  await prisma.portfolio.deleteMany({
    where: { companyId }
  });
}

/**
 * Supprime les comptes bancaires
 */
async function cleanAccounts(companyId) {
  console.log('⏳ Suppression des comptes...');
  await prisma.account.deleteMany({
    where: { companyId }
  });
}

/**
 * Supprime les catégories
 */
async function cleanCategories(companyId) {
  console.log('⏳ Suppression des catégories...');
  await prisma.category.deleteMany({
    where: { companyId }
  });
}

/**
 * Réinitialise le flag isDemo des utilisateurs (ne les supprime pas)
 */
async function resetUsersDemo(companyId) {
  console.log('⏳ Réinitialisation du flag isDemo des utilisateurs...');
  await prisma.user.updateMany({
    where: { companyId, isDemo: true },
    data: { isDemo: false }
  });
}

/**
 * Réinitialise les paramètres de la company
 */
async function resetCompanySettings(companyId) {
  console.log('⏳ Réinitialisation des paramètres company...');
  const settings = await prisma.companySettings.findUnique({
    where: { companyId }
  });
  
  if (settings) {
    await prisma.companySettings.update({
      where: { companyId },
      data: {
        vatActive: false,
        vatMode: 'TTC',
        vatDefaultRate: 0,
        vatRates: {}
      }
    });
  }
}

/**
 * Finalise le nettoyage de la company selon le mode
 */
async function finalizeCompany(companyId) {
  if (!process.env.DEMO_COMPANY_ID) {
    // Mode CLI: supprimer la company complètement
    console.log('⏳ Suppression de la company...');
    await prisma.company.delete({
      where: { id: companyId }
    });
  } else {
    // Mode API: retirer le flag isDemo uniquement
    console.log('⏳ Retrait du flag isDemo de la company...');
    await prisma.company.update({
      where: { id: companyId },
      data: { isDemo: false }
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
