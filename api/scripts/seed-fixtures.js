/*
 * Script de fixtures (dépenses et revenus) pour tests réels et prévisionnels.
 * Usage :
 *   cd apps/api && DATABASE_URL=postgres://... node scripts/seed-fixtures.js
 *
 * Le script :
 * - crée/relie une société "Quelyos Fixtures" et deux comptes (courant, carte).
 * - nettoie les transactions existantes de ces comptes.
 * - insère des revenus/dépenses confirmés (réel) et planifiés/programmé (prévisionnel).
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: 9999 },
    update: { name: "Quelyos Fixtures" },
    create: { id: 9999, name: "Quelyos Fixtures" },
  });

  const accountCourant = await prisma.account.upsert({
    where: { id: 909001 },
    update: { name: "Compte courant tests", companyId: company.id, balance: 5000 },
    create: {
      id: 909001,
      name: "Compte courant tests",
      companyId: company.id,
      balance: 5000,
      type: "banque",
    },
  });

  const accountCarte = await prisma.account.upsert({
    where: { id: 909002 },
    update: { name: "Carte pro tests", companyId: company.id, balance: 0 },
    create: {
      id: 909002,
      name: "Carte pro tests",
      companyId: company.id,
      balance: 0,
      type: "carte",
    },
  });

  const accountIds = [accountCourant.id, accountCarte.id];

  await prisma.transaction.deleteMany({ where: { accountId: { in: accountIds } } });

  const today = new Date();
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  const fixtures = [
    // Réel (confirmé)
    { amount: 3200, type: "credit", accountId: accountCourant.id, status: "CONFIRMED", occurredAt: new Date(day(-7)), description: "Facture client Semaine -1" },
    { amount: 780, type: "debit", accountId: accountCourant.id, status: "CONFIRMED", occurredAt: new Date(day(-6)), description: "Loyer bureau" },
    { amount: 210, type: "debit", accountId: accountCarte.id, status: "CONFIRMED", occurredAt: new Date(day(-5)), description: "Repas équipe" },
    { amount: 500, type: "credit", accountId: accountCarte.id, status: "CONFIRMED", occurredAt: new Date(day(-3)), description: "Remboursement client" },

    // Prévisionnel (planifié/programmé) – utilise scheduledFor pour les calculs forecast
    { amount: 1500, type: "credit", accountId: accountCourant.id, status: "PLANNED", scheduledFor: new Date(day(3)), description: "Acompte projet X" },
    { amount: 950, type: "debit", accountId: accountCourant.id, status: "PLANNED", scheduledFor: new Date(day(5)), description: "Prestataire design" },
    { amount: 120, type: "debit", accountId: accountCarte.id, status: "SCHEDULED", scheduledFor: new Date(day(4)), description: "Abonnement logiciel" },
    { amount: 2600, type: "credit", accountId: accountCourant.id, status: "SCHEDULED", scheduledFor: new Date(day(10)), description: "Facture client Semaine +1" },
  ];

  await prisma.transaction.createMany({ data: fixtures });

  console.log("Fixtures insérées :", fixtures.length);
  console.log("Company:", company.id, company.name);
  console.log("Accounts:", accountIds);
  console.log("Rappels: statut PLANNED/SCHEDULED -> date planifiée prise en compte dans forecast.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
