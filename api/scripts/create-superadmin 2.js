/*
 * Création d'un compte SUPERADMIN pour les tests.
 * Usage :
 *   cd apps/api && DATABASE_URL=postgres://... node scripts/create-superadmin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email = "superadmin@quelyos.test";
  const password = "SuperAdmin#2025";

  // Société support
  const company = await prisma.company.upsert({
    where: { id: 9999 },
    update: { name: "Quelyos Fixtures" },
    create: { id: 9999, name: "Quelyos Fixtures" },
  });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: "SUPERADMIN", companyId: company.id },
    create: {
      email,
      password: hashed,
      role: "SUPERADMIN",
      companyId: company.id,
    },
  });

  console.log("SUPERADMIN créé/mis à jour :", user.email);
  console.log("Mot de passe :", password);
  console.log("CompanyId :", company.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
