/*
 * Script de peuplement de données de démonstration.
 * Usage :
 *   cd apps/api && DATABASE_URL=... node scripts/seed-demo.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  const existingCompany = await prisma.company.findFirst({ where: { name: "Quelyos Démo" } });
  const company = existingCompany
    ? await prisma.company.update({ where: { id: existingCompany.id }, data: { name: "Quelyos Démo" } })
    : await prisma.company.create({ data: { name: "Quelyos Démo" } });

  const existingUser = await prisma.user.findUnique({ where: { email: "demo@quelyos.test" } });
  const alreadyHashed = existingUser?.password?.startsWith("$2");
  const demoPassword = alreadyHashed ? existingUser.password : await bcrypt.hash("changeme", 10);

  const user = existingUser
    ? await prisma.user.update({
        where: { email: "demo@quelyos.test" },
        data: { companyId: company.id, role: "ADMIN", password: demoPassword },
      })
    : await prisma.user.create({
        data: {
          email: "demo@quelyos.test",
          password: demoPassword,
          role: "ADMIN",
          companyId: company.id,
        },
      });

  // Créer les portefeuilles
  const portfolioPrincipal = await prisma.portfolio.upsert({
    where: { id: 1001 },
    update: { name: "Portefeuille principal", companyId: company.id },
    create: {
      id: 1001,
      name: "Portefeuille principal",
      description: "Comptes principaux d'exploitation",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const portfolioEpargne = await prisma.portfolio.upsert({
    where: { id: 1002 },
    update: { name: "Épargne et placements", companyId: company.id },
    create: {
      id: 1002,
      name: "Épargne et placements",
      description: "Comptes d'épargne et investissements",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const compteCourant = await prisma.account.upsert({
    where: { id: 1001 },
    update: {
      companyId: company.id,
      name: "Compte courant démo",
      portfolioId: portfolioPrincipal.id,
    },
    create: {
      id: 1001,
      name: "Compte courant démo",
      companyId: company.id,
      portfolioId: portfolioPrincipal.id,
      balance: 5000,
      type: "banque",
    },
  });

  const cartePro = await prisma.account.upsert({
    where: { id: 1002 },
    update: {
      companyId: company.id,
      name: "Carte pro démo",
      portfolioId: portfolioPrincipal.id,
    },
    create: {
      id: 1002,
      name: "Carte pro démo",
      companyId: company.id,
      portfolioId: portfolioPrincipal.id,
      balance: 0,
      type: "carte",
    },
  });

  const compteEpargne = await prisma.account.upsert({
    where: { id: 1003 },
    update: {
      companyId: company.id,
      name: "Compte épargne",
      portfolioId: portfolioEpargne.id,
    },
    create: {
      id: 1003,
      name: "Compte épargne",
      companyId: company.id,
      portfolioId: portfolioEpargne.id,
      balance: 25000,
      type: "epargne",
    },
  });

  // Créer les flux de paiement
  const fluxVirement = await prisma.paymentFlow.upsert({
    where: { id: 1001 },
    update: { accountId: compteCourant.id, name: "Virement bancaire" },
    create: {
      id: 1001,
      accountId: compteCourant.id,
      type: "TRANSFER",
      name: "Virement bancaire",
      isActive: true,
      isDefault: true,
      color: "#6366f1",
    },
  });

  const fluxCarte = await prisma.paymentFlow.upsert({
    where: { id: 1002 },
    update: { accountId: cartePro.id, name: "CB Visa Pro" },
    create: {
      id: 1002,
      accountId: cartePro.id,
      type: "CARD",
      name: "CB Visa Pro",
      reference: "4532********1234",
      isActive: true,
      isDefault: true,
      limitAmount: 5000,
      color: "#10b981",
    },
  });

  const fluxCheque = await prisma.paymentFlow.upsert({
    where: { id: 1003 },
    update: { accountId: compteCourant.id, name: "Chéquier 001" },
    create: {
      id: 1003,
      accountId: compteCourant.id,
      type: "CHECK",
      name: "Chéquier 001",
      reference: "CHQ-001",
      isActive: true,
      color: "#f59e0b",
    },
  });

  const fluxPrelevement = await prisma.paymentFlow.upsert({
    where: { id: 1004 },
    update: { accountId: compteCourant.id, name: "Prélèvement auto" },
    create: {
      id: 1004,
      accountId: compteCourant.id,
      type: "DIRECT_DEBIT",
      name: "Prélèvement auto",
      isActive: true,
      color: "#06b6d4",
    },
  });

  const fluxEspeces = await prisma.paymentFlow.upsert({
    where: { id: 1005 },
    update: { accountId: compteCourant.id, name: "Espèces" },
    create: {
      id: 1005,
      accountId: compteCourant.id,
      type: "CASH",
      name: "Espèces",
      isActive: true,
      color: "#84cc16",
    },
  });

  const existing = await prisma.transaction.count({
    where: { account: { companyId: company.id } },
  });

  if (existing > 0) {
    console.log("Transactions déjà présentes pour la société démo, rien à créer.");
    return;
  }

  const now = new Date();
  const today = new Date(now.toISOString().slice(0, 10));

  const samples = [
    {
      amount: 3200,
      type: "credit",
      accountId: compteCourant.id,
      paymentFlowId: fluxVirement.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Facture client ACME",
    },
    {
      amount: 1250,
      type: "credit",
      accountId: compteCourant.id,
      paymentFlowId: fluxVirement.id,
      occurredAt: today,
      scheduledFor: today,
      status: "PLANNED",
      description: "Acompte projet Orion",
    },
    {
      amount: 890,
      type: "debit",
      accountId: compteCourant.id,
      paymentFlowId: fluxPrelevement.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Loyer bureau",
    },
    {
      amount: 210,
      type: "debit",
      accountId: cartePro.id,
      paymentFlowId: fluxCarte.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Restaurant équipe",
    },
    {
      amount: 140,
      type: "debit",
      accountId: cartePro.id,
      paymentFlowId: fluxCarte.id,
      scheduledFor: today,
      status: "SCHEDULED",
      description: "Abonnement logiciel",
    },
    {
      amount: 450,
      type: "credit",
      accountId: cartePro.id,
      paymentFlowId: fluxCarte.id,
      occurredAt: today,
      status: "CANCELED",
      description: "Remboursement annulé (exemple)",
    },
    {
      amount: 520,
      type: "debit",
      accountId: compteCourant.id,
      paymentFlowId: fluxCheque.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Fournisseur matériel",
    },
    {
      amount: 95,
      type: "debit",
      accountId: compteCourant.id,
      paymentFlowId: fluxEspeces.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Fournitures bureau",
    },
    {
      amount: 1500,
      type: "credit",
      accountId: compteCourant.id,
      paymentFlowId: fluxVirement.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Vente produits",
    },
    {
      amount: 380,
      type: "debit",
      accountId: cartePro.id,
      paymentFlowId: fluxCarte.id,
      occurredAt: today,
      status: "CONFIRMED",
      description: "Marketing en ligne",
    },
  ];

  await prisma.transaction.createMany({ data: samples });

  console.log("Société démo :", company);
  console.log("Utilisateur démo :", user.email);
  console.log("Portefeuilles :", [portfolioPrincipal.name, portfolioEpargne.name]);
  console.log("Comptes :", [compteCourant.name, cartePro.name, compteEpargne.name]);
  console.log("Flux de paiement créés : 5");
  console.log(`Transactions insérées : ${samples.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
