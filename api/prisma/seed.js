const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with rich demo data...');

  let company;
  let user;

  // Mode 1 : Utiliser une company existante (appelé depuis l'API)
  if (process.env.DEMO_COMPANY_ID) {
    const companyId = parseInt(process.env.DEMO_COMPANY_ID);
    company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error(`Company avec ID ${companyId} introuvable`);
    }

    // Vérifier qu'elle est bien marquée comme démo
    if (!company.isDemo) {
      throw new Error(`SÉCURITÉ : La company ${companyId} n'est pas marquée comme démo. Opération annulée.`);
    }

    // Récupérer l'utilisateur admin de cette company (n'importe quel admin)
    user = await prisma.user.findFirst({
      where: { companyId: company.id, role: 'ADMIN' }
    });

    if (!user) {
      throw new Error(`Aucun utilisateur ADMIN trouvé pour la company ${companyId}`);
    }

    // Marquer l'utilisateur comme démo pour cohérence
    if (!user.isDemo) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isDemo: true }
      });
      console.log('✅ Utilisateur marqué comme démo:', user.email);
    }

    console.log('✅ Mode intégré : Utilisation de la company existante:', company.name);
  } 
  // Mode 2 : Créer une nouvelle company démo (mode CLI classique)
  else {
    // Vérifier si l'utilisateur demo existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@quelyos.test' }
    });

    if (existingUser) {
      console.log('✅ Utilisateur demo existe déjà');
      return;
    }

    // 1. Créer la company
    company = await prisma.company.create({
      data: {
        name: 'Quelyos Demo SAS',
        isDemo: true,
      },
    });
    console.log('✅ Company créée:', company.name);

    // 2. Créer l'utilisateur demo
    const hashedPassword = await bcrypt.hash('changeme', 10);
    user = await prisma.user.create({
      data: {
        email: 'demo@quelyos.test',
        password: hashedPassword,
        role: 'ADMIN',
        isDemo: true,
        companyId: company.id,
      },
    });
    console.log('✅ Utilisateur créé:', user.email);
  }

  // 3. Créer ou mettre à jour CompanySettings avec configuration démo optimale
  const existingSettings = await prisma.companySettings.findUnique({
    where: { companyId: company.id }
  });

  const demoSettings = {
    vatActive: true,
    vatMode: 'HT',
    vatDefaultRate: 20.0,
    vatRates: { standard: 20.0, reduced: 10.0, intermediate: 5.5 },
  };

  await prisma.companySettings.upsert({
    where: { companyId: company.id },
    update: demoSettings,
    create: {
      companyId: company.id,
      ...demoSettings,
    },
  });

  const settingsUpdated = existingSettings ? 
    'CompanySettings mis à jour (TVA activée, mode HT, taux 20%)' : 
    'CompanySettings créés';
  console.log(`✅ ${settingsUpdated}`);

  // 4. Créer des catégories figées et complètes (revenus + dépenses)
  console.log('⏳ Création des catégories...');
  const categoriesData = [
    // === CATÉGORIES DE REVENUS (5) ===
    { 
      name: 'Ventes Produits', 
      kind: 'INCOME',
      description: 'Ventes de produits physiques ou numériques'
    },
    { 
      name: 'Prestations de Services', 
      kind: 'INCOME',
      description: 'Services professionnels facturés aux clients'
    },
    { 
      name: 'Abonnements', 
      kind: 'INCOME',
      description: 'Revenus récurrents mensuels ou annuels'
    },
    { 
      name: 'Consulting', 
      kind: 'INCOME',
      description: 'Missions de conseil et audit'
    },
    { 
      name: 'Licences & Royalties', 
      kind: 'INCOME',
      description: 'Ventes de licences logicielles et droits d\'usage'
    },
    
    // === CATÉGORIES DE DÉPENSES (10) ===
    { 
      name: 'Salaires & Charges', 
      kind: 'EXPENSE',
      description: 'Salaires nets + charges sociales patronales'
    },
    { 
      name: 'Loyer & Charges Locatives', 
      kind: 'EXPENSE',
      description: 'Loyer bureaux, charges copropriété, entretien'
    },
    { 
      name: 'Marketing & Publicité', 
      kind: 'EXPENSE',
      description: 'Campagnes publicitaires online/offline'
    },
    { 
      name: 'Informatique & Logiciels', 
      kind: 'EXPENSE',
      description: 'Abonnements SaaS, licences, cloud computing'
    },
    { 
      name: 'Fournitures & Matériel', 
      kind: 'EXPENSE',
      description: 'Matériel bureau, équipement informatique'
    },
    { 
      name: 'Déplacements & Transport', 
      kind: 'EXPENSE',
      description: 'Frais déplacements professionnels, carburant'
    },
    { 
      name: 'Télécommunications', 
      kind: 'EXPENSE',
      description: 'Téléphonie mobile, internet, fibre optique'
    },
    { 
      name: 'Assurances', 
      kind: 'EXPENSE',
      description: 'RC Pro, cyber-risques, multirisque professionnelle'
    },
    { 
      name: 'Frais Bancaires', 
      kind: 'EXPENSE',
      description: 'Commissions, frais tenue compte, cartes bancaires'
    },
    { 
      name: 'Formation & Développement', 
      kind: 'EXPENSE',
      description: 'Formations professionnelles, conférences, certifications'
    },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        kind: cat.kind,
        companyId: company.id,
      },
    });
    categories[cat.name] = created;
  }
  console.log(`✅ ${categoriesData.length} catégories créées (${categoriesData.filter(c => c.kind === 'INCOME').length} revenus, ${categoriesData.filter(c => c.kind === 'EXPENSE').length} dépenses)`);

  // 5. Créer des comptes bancaires figés et complets (TND - Dinar Tunisien)
  console.log('⏳ Création des comptes bancaires...');
  console.log('💡 Devise configurée : TND (Dinar Tunisien)');
  
  const accountsData = [
    { 
      name: 'Compte Courant Principal', 
      type: 'banque', 
      balance: 375000, 
      currency: 'TND', 
      institution: 'Banque de Tunisie',
      notes: 'Compte principal pour opérations courantes - RIB: TN59 1000 6035 0123 4567 8901',
      isShared: false,
      status: 'ACTIVE'
    },
    { 
      name: 'Compte Épargne Professionnelle', 
      type: 'banque', 
      balance: 255000, 
      currency: 'TND', 
      institution: 'Attijari Bank',
      notes: 'Compte épargne rémunéré 2.5% - Réserves entreprise',
      isShared: false,
      status: 'ACTIVE'
    },
    { 
      name: 'Compte PayPal Business', 
      type: 'banque', 
      balance: 37500, 
      currency: 'TND', 
      institution: 'PayPal',
      notes: 'Paiements en ligne clients internationaux - ID: demo@quelyos.biz',
      isShared: true,
      status: 'ACTIVE'
    },
    { 
      name: 'Caisse Espèces Bureau', 
      type: 'cash', 
      balance: 3600, 
      currency: 'TND', 
      institution: null,
      notes: 'Petite caisse pour dépenses quotidiennes et frais divers',
      isShared: false,
      status: 'ACTIVE'
    },
    { 
      name: 'Compte Stripe Paiements', 
      type: 'banque', 
      balance: 26100, 
      currency: 'TND', 
      institution: 'Stripe',
      notes: 'Plateforme paiements SaaS et abonnements - ID: acct_quelyos_demo',
      isShared: true,
      status: 'ACTIVE'
    },
  ];

  const accounts = [];
  for (const acc of accountsData) {
    const created = await prisma.account.create({
      data: {
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        balance: acc.balance,
        institution: acc.institution,
        notes: acc.notes,
        isShared: acc.isShared,
        status: acc.status,
        companyId: company.id,
      },
    });
    accounts.push(created);
  }
  
  const totalBalance = accountsData.reduce((sum, acc) => sum + acc.balance, 0);
  console.log(`✅ ${accounts.length} comptes créés (Total: ${totalBalance.toLocaleString()} TND)`);

  // 6. Créer des portefeuilles figés et complets
  console.log('⏳ Création des portefeuilles...');
  const portfoliosData = [
    { 
      name: 'Opérations France', 
      description: 'Gestion des comptes bancaires traditionnels et flux de trésorerie principaux liés aux opérations françaises. Inclut le compte courant principal et la caisse espèces.',
      status: 'ACTIVE'
    },
    { 
      name: 'Digital & E-commerce', 
      description: 'Plateforme de paiements en ligne, abonnements SaaS et revenus digitaux. Regroupe PayPal et Stripe pour suivi des transactions e-commerce.',
      status: 'ACTIVE'
    },
    { 
      name: 'Épargne & Réserves', 
      description: 'Fonds de réserve et comptes épargne rémunérés. Sécurisation de la trésorerie à moyen terme avec taux d\'intérêt de 2.5% annuel.',
      status: 'ACTIVE'
    },
  ];

  const portfolios = [];
  for (const port of portfoliosData) {
    const created = await prisma.portfolio.create({
      data: {
        name: port.name,
        description: port.description,
        status: port.status,
        companyId: company.id,
      },
    });
    portfolios.push(created);
  }
  console.log(`✅ ${portfolios.length} portefeuilles créés`);

  // 7. Associer comptes aux portefeuilles
  await prisma.accountPortfolio.createMany({
    data: [
      { accountId: accounts[0].id, portfolioId: portfolios[0].id }, // Compte Principal -> Opérations France
      { accountId: accounts[1].id, portfolioId: portfolios[2].id }, // Épargne -> Épargne & Réserves
      { accountId: accounts[2].id, portfolioId: portfolios[1].id }, // PayPal -> Digital
      { accountId: accounts[3].id, portfolioId: portfolios[0].id }, // Caisse -> Opérations France
      { accountId: accounts[4].id, portfolioId: portfolios[1].id }, // Stripe -> Digital
    ],
  });
  console.log('✅ Comptes associés aux portefeuilles');

  // 7b. Créer des flux de paiement pour les comptes
  console.log('⏳ Création des flux de paiement...');
  const paymentFlowsData = [
    // Compte Courant Principal - plusieurs flux
    { accountIndex: 0, type: 'CARD', name: 'CB Visa Business', reference: '**** 4521', isDefault: true, color: '#3b82f6' },
    { accountIndex: 0, type: 'CHECK', name: 'Chéquier Principal', reference: 'CHQ-2024-001', isDefault: false, color: '#f59e0b' },
    { accountIndex: 0, type: 'TRANSFER', name: 'Virements SEPA', reference: null, isDefault: false, color: '#8b5cf6' },
    { accountIndex: 0, type: 'DIRECT_DEBIT', name: 'Prélèvements', reference: null, isDefault: false, color: '#ec4899' },
    { accountIndex: 0, type: 'BILL_OF_EXCHANGE', name: 'Traites LCR', reference: 'LCR-2024', isDefault: false, color: '#06b6d4' },
    
    // Compte Épargne - peu de flux
    { accountIndex: 1, type: 'TRANSFER', name: 'Virements Épargne', reference: null, isDefault: true, color: '#8b5cf6' },
    
    // PayPal
    { accountIndex: 2, type: 'TRANSFER', name: 'PayPal Transferts', reference: 'demo@quelyos.biz', isDefault: true, color: '#8b5cf6' },
    
    // Caisse Espèces
    { accountIndex: 3, type: 'CASH', name: 'Espèces Bureau', reference: null, isDefault: true, color: '#22c55e' },
    
    // Stripe
    { accountIndex: 4, type: 'CARD', name: 'Paiements Stripe', reference: 'acct_quelyos_demo', isDefault: true, color: '#3b82f6' },
    { accountIndex: 4, type: 'TRANSFER', name: 'Virements Stripe', reference: null, isDefault: false, color: '#8b5cf6' },
  ];

  const paymentFlows = [];
  for (const flow of paymentFlowsData) {
    const created = await prisma.paymentFlow.create({
      data: {
        accountId: accounts[flow.accountIndex].id,
        type: flow.type,
        name: flow.name,
        reference: flow.reference,
        isDefault: flow.isDefault,
        color: flow.color,
        isActive: true,
      },
    });
    paymentFlows.push(created);
  }
  console.log(`✅ ${paymentFlows.length} flux de paiement créés`);

  // 8. Créer des budgets figés et complets (Modèle "Budgets")
  console.log('⏳ Création des budgets prévisionnels...');
  const budgetsData = [
    { 
      name: 'Budget Marketing Digital Q4 2025',
      description: 'Campagnes Google Ads, Facebook/Instagram, LinkedIn - Acquisition clients B2B',
      targetAmount: 15000,
      period: 'quarterly'
    },
    { 
      name: 'Budget Infrastructure IT 2025',
      description: 'Serveurs cloud AWS, licences Microsoft 365, outils DevOps, sécurité',
      targetAmount: 48000,
      period: 'annual'
    },
    { 
      name: 'Budget Formation Équipe T4 2025',
      description: 'Formations techniques (Kubernetes, CI/CD), certifications professionnelles',
      targetAmount: 8000,
      period: 'quarterly'
    },
    { 
      name: 'Budget Déplacements Pro 2025',
      description: 'Missions clients, salons professionnels, conférences tech',
      targetAmount: 12000,
      period: 'annual'
    },
    { 
      name: 'Budget Recrutement Q1 2026',
      description: 'Onboarding nouveaux collaborateurs, équipement, formation initiale',
      targetAmount: 25000,
      period: 'quarterly'
    },
  ];

  for (const budget of budgetsData) {
    await prisma.budgets.create({
      data: {
        name: budget.name,
        companyId: company.id,
      },
    });
  }
  console.log(`✅ ${budgetsData.length} budgets créés`);

  // 9. Créer des transactions figées et complètes (tous les champs remplis)
  console.log('⏳ Génération des transactions démo...');
  
  // Fonction helper pour calculer la TVA
  const calculateVAT = (amountHT, vatRate = 20) => ({
    amountHT: Math.round(amountHT * 100) / 100,
    vatRate: vatRate,
    amountTTC: Math.round(amountHT * (1 + vatRate / 100) * 100) / 100,
  });

  const transactions = [
    // === REVENUS CONFIRMÉS (Juin-Novembre 2025) ===
    {
      description: 'Vente Licence Entreprise Premium - ACME Corp',
      ...calculateVAT(12000),
      amount: 14400, // TTC
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-15T10:30:00'),
      scheduledFor: null,
      categoryId: categories['Licences & Royalties'].id,
      accountId: accounts[0].id, // Compte Principal
    },
    {
      description: 'Abonnement Annuel SaaS - TechStart Solutions',
      ...calculateVAT(8400),
      amount: 10080,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-20T14:15:00'),
      scheduledFor: null,
      categoryId: categories['Abonnements'].id,
      accountId: accounts[4].id, // Stripe
    },
    {
      description: 'Mission Consulting Digital - Ministère Finance',
      ...calculateVAT(15000),
      amount: 18000,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-05T09:00:00'),
      scheduledFor: null,
      categoryId: categories['Consulting'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Vente Pack Formation Pro - 15 licences',
      ...calculateVAT(4500),
      amount: 5400,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-12T16:45:00'),
      scheduledFor: null,
      categoryId: categories['Ventes Produits'].id,
      accountId: accounts[2].id, // PayPal
    },
    {
      description: 'Maintenance Annuelle Client - DataCorp',
      ...calculateVAT(6000),
      amount: 7200,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-08-01T11:20:00'),
      scheduledFor: null,
      categoryId: categories['Prestations de Services'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Abonnement Mensuel Premium x12 - Innovation Labs',
      ...calculateVAT(599),
      amount: 718.80,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-08-15T13:30:00'),
      scheduledFor: null,
      categoryId: categories['Abonnements'].id,
      accountId: accounts[4].id,
    },
    {
      description: 'Prestation Audit Sécurité - BankTech',
      ...calculateVAT(9500),
      amount: 11400,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-10T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Consulting'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Vente Solution Cloud Entreprise - MegaCorp',
      ...calculateVAT(18000),
      amount: 21600,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-25T15:10:00'),
      scheduledFor: null,
      categoryId: categories['Licences & Royalties'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Services Développement Custom - StartupX',
      ...calculateVAT(7800),
      amount: 9360,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-05T09:30:00'),
      scheduledFor: null,
      categoryId: categories['Prestations de Services'].id,
      accountId: accounts[2].id,
    },
    {
      description: 'Renouvellement Licences Trimestrielles - GroupeAlpha',
      ...calculateVAT(5400),
      amount: 6480,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-20T14:00:00'),
      scheduledFor: null,
      categoryId: categories['Licences & Royalties'].id,
      accountId: accounts[4].id,
    },
    {
      description: 'Formation Équipe (3 jours) - InnovTech',
      ...calculateVAT(4200),
      amount: 5040,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-11-08T10:15:00'),
      scheduledFor: null,
      categoryId: categories['Ventes Produits'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Abonnement Enterprise x24 - GlobalServices',
      ...calculateVAT(899),
      amount: 1078.80,
      type: 'credit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-11-22T11:45:00'),
      scheduledFor: null,
      categoryId: categories['Abonnements'].id,
      accountId: accounts[4].id,
    },

    // === REVENUS PLANIFIÉS (Décembre 2025 - Janvier 2026) ===
    {
      description: 'Vente Licence Premium Q1 2026 - Future Client',
      ...calculateVAT(11000),
      amount: 13200,
      type: 'credit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2025-12-15T10:00:00'),
      categoryId: categories['Licences & Royalties'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Renouvellement Abonnements Annuels - Multi-Clients',
      ...calculateVAT(15600),
      amount: 18720,
      type: 'credit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2026-01-02T09:00:00'),
      categoryId: categories['Abonnements'].id,
      accountId: accounts[4].id,
    },
    {
      description: 'Mission Consulting Stratégie 2026 - GrandGroupe',
      ...calculateVAT(22000),
      amount: 26400,
      type: 'credit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2026-01-15T09:00:00'),
      categoryId: categories['Consulting'].id,
      accountId: accounts[0].id,
    },

    // === DÉPENSES CONFIRMÉES (Juin-Novembre 2025) ===
    {
      description: 'Salaires & Charges Sociales - Juin 2025',
      ...calculateVAT(12000, 0), // Salaires exonérés de TVA
      amount: 12000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-30T18:00:00'),
      scheduledFor: null,
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Juin 2025 (120m² Centre-Ville)',
      ...calculateVAT(2000, 0), // Loyers souvent exonérés
      amount: 2000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-05T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Campagne Google Ads - Acquisition Juin',
      ...calculateVAT(2400),
      amount: 2880,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-10T14:30:00'),
      scheduledFor: null,
      categoryId: categories['Marketing & Publicité'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Abonnement Microsoft 365 Entreprise (25 licences)',
      ...calculateVAT(375),
      amount: 450,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-15T09:15:00'),
      scheduledFor: null,
      categoryId: categories['Informatique & Logiciels'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Fournitures Bureau & Matériel Informatique',
      ...calculateVAT(850),
      amount: 1020,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-06-20T11:00:00'),
      scheduledFor: null,
      categoryId: categories['Fournitures & Matériel'].id,
      accountId: accounts[3].id, // Caisse
    },
    {
      description: 'Déplacement Paris-Lyon Client BankTech (Train+Hôtel)',
      ...calculateVAT(420),
      amount: 504,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-08T16:45:00'),
      scheduledFor: null,
      categoryId: categories['Déplacements & Transport'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Salaires & Charges Sociales - Juillet 2025',
      ...calculateVAT(12500, 0),
      amount: 12500,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-31T18:00:00'),
      scheduledFor: null,
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Juillet 2025',
      ...calculateVAT(2000, 0),
      amount: 2000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-05T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Campagne Facebook/Instagram Ads - Juillet',
      ...calculateVAT(1800),
      amount: 2160,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-15T13:20:00'),
      scheduledFor: null,
      categoryId: categories['Marketing & Publicité'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Abonnements SaaS (Slack, GitHub, AWS, Notion)',
      ...calculateVAT(680),
      amount: 816,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-18T10:30:00'),
      scheduledFor: null,
      categoryId: categories['Informatique & Logiciels'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Téléphonie Mobile Entreprise (8 lignes)',
      ...calculateVAT(240),
      amount: 288,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-07-25T09:00:00'),
      scheduledFor: null,
      categoryId: categories['Télécommunications'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Assurance RC Pro & Cyber-risques - Trimestre Q3',
      ...calculateVAT(1200, 0), // Assurances exonérées
      amount: 1200,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-08-02T14:15:00'),
      scheduledFor: null,
      categoryId: categories['Assurances'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Salaires & Charges Sociales - Août 2025',
      ...calculateVAT(12800, 0),
      amount: 12800,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-08-31T18:00:00'),
      scheduledFor: null,
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Août 2025',
      ...calculateVAT(2000, 0),
      amount: 2000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-08-05T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Frais Bancaires & Commissions Cartes - Août',
      ...calculateVAT(125, 0), // Souvent exonérés
      amount: 125,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-08-28T16:00:00'),
      scheduledFor: null,
      categoryId: categories['Frais Bancaires'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Formation Équipe DevOps - Kubernetes & CI/CD (2j)',
      ...calculateVAT(1800),
      amount: 2160,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-12T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Formation & Développement'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Salaires & Charges Sociales - Septembre 2025',
      ...calculateVAT(13200, 0),
      amount: 13200,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-30T18:00:00'),
      scheduledFor: null,
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Septembre 2025',
      ...calculateVAT(2000, 0),
      amount: 2000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-05T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Campagne LinkedIn Ads B2B - Septembre',
      ...calculateVAT(3200),
      amount: 3840,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-18T14:00:00'),
      scheduledFor: null,
      categoryId: categories['Marketing & Publicité'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Serveurs Cloud AWS - Infrastructure Production',
      ...calculateVAT(950),
      amount: 1140,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-09-22T11:30:00'),
      scheduledFor: null,
      categoryId: categories['Informatique & Logiciels'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Déplacement Salon Tech Paris - Stand & Transport',
      ...calculateVAT(2800),
      amount: 3360,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-03T15:45:00'),
      scheduledFor: null,
      categoryId: categories['Déplacements & Transport'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Salaires & Charges Sociales - Octobre 2025',
      ...calculateVAT(13500, 0),
      amount: 13500,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-31T18:00:00'),
      scheduledFor: null,
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Octobre 2025',
      ...calculateVAT(2000, 0),
      amount: 2000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-05T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Achat Matériel Informatique (3 MacBook Pro M3)',
      ...calculateVAT(7500),
      amount: 9000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-15T13:00:00'),
      scheduledFor: null,
      categoryId: categories['Fournitures & Matériel'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Téléphonie & Internet Fibre Pro - Octobre',
      ...calculateVAT(280),
      amount: 336,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-10-25T09:15:00'),
      scheduledFor: null,
      categoryId: categories['Télécommunications'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Salaires & Charges Sociales - Novembre 2025',
      ...calculateVAT(14000, 0),
      amount: 14000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-11-30T18:00:00'),
      scheduledFor: null,
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Novembre 2025',
      ...calculateVAT(2000, 0),
      amount: 2000,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-11-05T10:00:00'),
      scheduledFor: null,
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Campagne Retargeting Q4 - Multi-Canal',
      ...calculateVAT(2600),
      amount: 3120,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-11-18T14:30:00'),
      scheduledFor: null,
      categoryId: categories['Marketing & Publicité'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Frais Bancaires & Commissions - Novembre',
      ...calculateVAT(145, 0),
      amount: 145,
      type: 'debit',
      status: 'CONFIRMED',
      occurredAt: new Date('2025-11-28T16:00:00'),
      scheduledFor: null,
      categoryId: categories['Frais Bancaires'].id,
      accountId: accounts[0].id,
    },

    // === DÉPENSES PLANIFIÉES (Décembre 2025) ===
    {
      description: 'Salaires & Charges Sociales - Décembre 2025',
      ...calculateVAT(14500, 0),
      amount: 14500,
      type: 'debit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2025-12-31T18:00:00'),
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Loyer Bureaux - Décembre 2025',
      ...calculateVAT(2000, 0),
      amount: 2000,
      type: 'debit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2025-12-05T10:00:00'),
      categoryId: categories['Loyer & Charges Locatives'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Prime Fin Année Équipe',
      ...calculateVAT(6000, 0),
      amount: 6000,
      type: 'debit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2025-12-20T18:00:00'),
      categoryId: categories['Salaires & Charges'].id,
      accountId: accounts[0].id,
    },
    {
      description: 'Assurance RC Pro & Cyber - Renouvellement Annuel 2026',
      ...calculateVAT(4800, 0),
      amount: 4800,
      type: 'debit',
      status: 'PLANNED',
      occurredAt: new Date('2025-12-01T00:00:00'),
      scheduledFor: new Date('2026-01-05T10:00:00'),
      categoryId: categories['Assurances'].id,
      accountId: accounts[0].id,
    },
  ];

  // Insérer toutes les transactions
  await prisma.transaction.createMany({ data: transactions });
  console.log(`✅ ${transactions.length} transactions créées (figées et complètes)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // F92 - SUPPLIER MANAGEMENT SEED DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Créer des fournisseurs de test
  const suppliersData = [
    {
      name: 'AWS Europe',
      email: 'billing@aws.amazon.com',
      phone: '+33 1 76 54 00 00',
      website: 'https://aws.amazon.com',
      iban: 'FR7630006000011234567890189',
      bic: 'BNPAFRPP',
      category: 'STRATEGIC',
      importance: 'CRITICAL',
      defaultPaymentDelay: 30,
      latePaymentPenalty: 0.5, // 0.5% par jour
      notes: 'Fournisseur cloud principal - paiement prioritaire',
      tags: ['IT', 'Cloud', 'Infrastructure'],
      companyId: company.id,
      createdBy: user.id,
    },
    {
      name: 'Office Depot France',
      email: 'factures@officedepot.fr',
      phone: '+33 1 70 37 39 00',
      website: 'https://www.officedepot.fr',
      iban: 'FR7612345678901234567890123',
      category: 'REGULAR',
      importance: 'NORMAL',
      defaultPaymentDelay: 45,
      earlyPaymentDiscount: 2.0, // 2% si paiement anticipé
      notes: 'Fournitures de bureau mensuelles',
      tags: ['Fournitures', 'Bureau'],
      companyId: company.id,
      createdBy: user.id,
    },
    {
      name: 'Freelance Design - Sophie Martin',
      email: 'sophie.martin@design.fr',
      phone: '+33 6 12 34 56 78',
      category: 'OCCASIONAL',
      importance: 'NORMAL',
      defaultPaymentDelay: 15,
      notes: 'Designer freelance pour projets ponctuels',
      tags: ['Design', 'Freelance', 'Marketing'],
      companyId: company.id,
      createdBy: user.id,
    },
    {
      name: 'Orange Business Services',
      email: 'facturation@orange-business.com',
      phone: '+33 9 69 39 00 00',
      website: 'https://www.orange-business.com',
      iban: 'FR7630004000031234567890143',
      category: 'STRATEGIC',
      importance: 'HIGH',
      defaultPaymentDelay: 30,
      latePaymentPenalty: 0.3,
      notes: 'Téléphonie et internet entreprise',
      tags: ['Télécom', 'IT'],
      companyId: company.id,
      createdBy: user.id,
    },
    {
      name: 'AXA Assurances Pro',
      email: 'pro@axa.fr',
      phone: '+33 1 55 92 30 00',
      website: 'https://www.axa.fr',
      category: 'REGULAR',
      importance: 'HIGH',
      defaultPaymentDelay: 60,
      notes: 'Assurance RC Pro et Cyber',
      tags: ['Assurance', 'Juridique'],
      companyId: company.id,
      createdBy: user.id,
    },
  ];

  const suppliers = await Promise.all(
    suppliersData.map((data) => prisma.supplier.create({ data }))
  );
  console.log(`✅ ${suppliers.length} fournisseurs créés`);

  // Créer des factures fournisseurs
  const today = new Date();
  const supplierInvoicesData = [
    {
      supplierId: suppliers[0].id, // AWS
      companyId: company.id,
      invoiceNumber: 'AWS-2025-001',
      invoiceDate: new Date('2025-12-01'),
      dueDate: new Date('2025-12-31'),
      amount: 1250.50,
      currency: 'EUR',
      description: 'Services cloud AWS - Décembre 2025',
      category: 'IT',
      status: 'PENDING',
      paymentDelay: 30,
    },
    {
      supplierId: suppliers[0].id, // AWS
      companyId: company.id,
      invoiceNumber: 'AWS-2026-001',
      invoiceDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
      amount: 1380.75,
      currency: 'EUR',
      description: 'Services cloud AWS - Janvier 2026',
      category: 'IT',
      status: 'PENDING',
      paymentDelay: 30,
    },
    {
      supplierId: suppliers[1].id, // Office Depot
      companyId: company.id,
      invoiceNumber: 'OD-2025-122',
      invoiceDate: new Date('2025-11-15'),
      dueDate: new Date('2025-12-30'),
      amount: 450.00,
      currency: 'EUR',
      description: 'Fournitures de bureau - Novembre 2025',
      category: 'Office supplies',
      status: 'PENDING',
      paymentDelay: 45,
    },
    {
      supplierId: suppliers[2].id, // Freelance Design
      companyId: company.id,
      invoiceNumber: 'SM-2025-042',
      invoiceDate: new Date('2025-12-10'),
      dueDate: new Date('2025-12-25'),
      amount: 1800.00,
      currency: 'EUR',
      description: 'Design logo et charte graphique',
      category: 'Marketing',
      status: 'PENDING',
      paymentDelay: 15,
    },
    {
      supplierId: suppliers[3].id, // Orange
      companyId: company.id,
      invoiceNumber: 'OBS-2025-1201',
      invoiceDate: new Date('2025-12-01'),
      dueDate: new Date('2025-12-31'),
      amount: 320.00,
      currency: 'EUR',
      description: 'Forfait entreprise - Décembre 2025',
      category: 'IT',
      status: 'PENDING',
      paymentDelay: 30,
    },
    {
      supplierId: suppliers[4].id, // AXA
      companyId: company.id,
      invoiceNumber: 'AXA-2025-RC-001',
      invoiceDate: new Date('2025-11-01'),
      dueDate: new Date('2026-01-05'),
      amount: 4800.00,
      currency: 'EUR',
      description: 'Assurance RC Pro & Cyber - Annuelle 2026',
      category: 'Assurances',
      status: 'PENDING',
      paymentDelay: 60,
    },
    {
      supplierId: suppliers[0].id, // AWS - facture en retard
      companyId: company.id,
      invoiceNumber: 'AWS-2025-000',
      invoiceDate: new Date('2025-11-01'),
      dueDate: new Date('2025-11-30'),
      amount: 1150.00,
      currency: 'EUR',
      description: 'Services cloud AWS - Novembre 2025',
      category: 'IT',
      status: 'OVERDUE',
      paymentDelay: 30,
      daysOverdue: Math.floor((today - new Date('2025-11-30')) / (1000 * 60 * 60 * 24)),
      penaltyAmount: 1150.00 * 0.005 * Math.floor((today - new Date('2025-11-30')) / (1000 * 60 * 60 * 24)),
    },
    {
      supplierId: suppliers[1].id, // Office Depot - déjà payée
      companyId: company.id,
      invoiceNumber: 'OD-2025-121',
      invoiceDate: new Date('2025-10-15'),
      dueDate: new Date('2025-11-29'),
      amount: 380.00,
      currency: 'EUR',
      description: 'Fournitures de bureau - Octobre 2025',
      category: 'Office supplies',
      status: 'PAID',
      paidAt: new Date('2025-11-25'),
      paidAmount: 380.00,
      paymentDelay: 45,
    },
  ];

  const supplierInvoices = await Promise.all(
    supplierInvoicesData.map((data) => prisma.supplierInvoice.create({ data }))
  );
  console.log(`✅ ${supplierInvoices.length} factures fournisseurs créées`);

  console.log('\n🎉 Seed terminé avec succès!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 DONNÉES DÉMO FIGÉES ET COMPLÈTES:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   🏢 Entreprise: ${company.name}`);
  console.log(`   👤 Utilisateur admin: 1`);
  console.log('   ');
  console.log(`   📂 Catégories: ${categoriesData.length} (${categoriesData.filter(c => c.kind === 'INCOME').length} revenus, ${categoriesData.filter(c => c.kind === 'EXPENSE').length} dépenses)`);
  console.log(`      → Tous les champs remplis: name, kind, description`);
  console.log('   ');
  console.log(`   💳 Comptes bancaires: ${accounts.length} (Total: ${totalBalance.toLocaleString()} TND)`);
  console.log(`      → Tous les champs remplis: name, type, balance, currency, institution, notes, isShared, status`);
  console.log('   ');
  console.log(`   📊 Portefeuilles: ${portfolios.length}`);
  console.log(`      → Tous les champs remplis: name, description, status`);
  console.log(`      → ${portfolios.length} associations compte-portefeuille créées`);
  console.log('   ');
  console.log(`   💰 Budgets prévisionnels: ${budgetsData.length}`);
  console.log(`      → Données figées avec descriptions complètes`);
  console.log('   ');
  console.log(`   💸 Transactions: ${transactions.length} (${transactions.filter(t => t.type === 'credit').length} revenus, ${transactions.filter(t => t.type === 'debit').length} dépenses)`);
  console.log(`      → Période: Juin 2025 → Janvier 2026`);
  console.log(`      → Statuts: ${transactions.filter(t => t.status === 'CONFIRMED').length} CONFIRMED, ${transactions.filter(t => t.status === 'PLANNED').length} PLANNED`);
  console.log(`      → TVA calculée: amountHT, amountTTC, vatRate (20% ou 0%)`);
  console.log(`      → Dates figées + scheduledFor pour PLANNED`);
  console.log('   ');
  console.log(`   🏭 Fournisseurs (F92): ${suppliers.length}`);
  console.log(`      → Catégories: ${suppliers.filter(s => s.category === 'STRATEGIC').length} stratégiques, ${suppliers.filter(s => s.category === 'REGULAR').length} réguliers, ${suppliers.filter(s => s.category === 'OCCASIONAL').length} occasionnels`);
  console.log(`   📄 Factures fournisseurs: ${supplierInvoices.length}`);
  console.log(`      → Statuts: ${supplierInvoices.filter(i => i.status === 'PENDING').length} PENDING, ${supplierInvoices.filter(i => i.status === 'OVERDUE').length} OVERDUE, ${supplierInvoices.filter(i => i.status === 'PAID').length} PAID`);
  console.log(`      → Total à payer: ${supplierInvoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0).toLocaleString()} EUR`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 IDENTIFIANTS DE CONNEXION:');
  console.log('   📧 Email: demo@quelyos.test');
  console.log('   🔑 Password: changeme');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ Toutes les données sont FIGÉES et COMPLÈTES (identiques à chaque seed)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
