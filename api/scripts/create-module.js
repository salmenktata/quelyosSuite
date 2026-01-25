const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const moduleName = process.argv[2];

if (!moduleName) {
    console.error("❌ Missing module name. Usage: node scripts/create-module.js budgets");
    process.exit(1);
}

const Module = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

// --------------------------------------------------
// PATHS ABSOLUS (corrige toutes tes erreurs précédentes)
// --------------------------------------------------
const ROOT = path.join(__dirname, "..");

const prismaPath = path.join(ROOT, "prisma", "schema.prisma");
const routesDir = path.join(ROOT, "src", "routes");
const routePath = path.join(routesDir, `${moduleName}.js`);
const serverPath = path.join(ROOT, "server.js");

// --------------------------------------------------
// 1️⃣ GÉNÉRATION DU MODÈLE PRISMA
// --------------------------------------------------

let prismaSchema = fs.readFileSync(prismaPath, "utf8");

const prismaModel = `
model ${Module} {
  id        Int      @id @default(autoincrement())
  name      String
  companyId Int
  company   Company  @relation(fields: [companyId], references: [id])
  createdAt DateTime @default(now())
}
`;

if (!prismaSchema.includes(`model ${Module}`)) {
    prismaSchema += "\n" + prismaModel;
    fs.writeFileSync(prismaPath, prismaSchema);
    console.log("✔ Prisma model created:", Module);
} else {
    console.log("✔ Prisma model already exists");
}

// --------------------------------------------------
// 2️⃣ GÉNÉRATION DE LA ROUTE CRUD
// --------------------------------------------------

if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir);

const routeTemplate = `
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/tenant");

// CREATE
router.post("/", auth, async (req, res) => {
  try {
    const item = await prisma.${moduleName}.create({
      data: { ...req.body, companyId: req.companyId }
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Creation failed" });
  }
});

// LIST
router.get("/", auth, async (req, res) => {
  try {
    const items = await prisma.${moduleName}.findMany({
      where: { companyId: req.companyId }
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// GET ONE
router.get("/:id", auth, async (req, res) => {
  try {
    const item = await prisma.${moduleName}.findFirst({
      where: { id: Number(req.params.id), companyId: req.companyId }
    });

    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// UPDATE
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await prisma.${moduleName}.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    await prisma.${moduleName}.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: "${Module} deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
`;

fs.writeFileSync(routePath, routeTemplate);
console.log("✔ CRUD route created:", routePath);

// --------------------------------------------------
// 3️⃣ ACTIVER LA ROUTE DANS server.js
// --------------------------------------------------

let serverJS = fs.readFileSync(serverPath, "utf8");

const newLine = `app.use("/${moduleName}", require("./src/routes/${moduleName}"));`;

if (!serverJS.includes(newLine)) {
    serverJS = serverJS.replace(
        "// ------------ ROUTES PROTÉGÉES ------------",
        `// ------------ ROUTES PROTÉGÉES ------------\n${newLine}`
    );

    fs.writeFileSync(serverPath, serverJS);
    console.log("✔ server.js updated");
} else {
    console.log("✔ server.js already includes this route");
}

// --------------------------------------------------
// 4️⃣ REBUILD PRISMA & DB PUSH
// --------------------------------------------------

console.log("⏳ Applying Prisma migration...");
execSync("docker exec quelyos-api npx prisma generate", { stdio: "inherit" });
execSync("docker exec quelyos-api npx prisma db push", { stdio: "inherit" });

// --------------------------------------------------
// 5️⃣ RESTART API
// --------------------------------------------------

console.log("⏳ Restarting API...");
execSync("docker restart quelyos-api", { stdio: "inherit" });

console.log(`🎉 Module '${moduleName}' created successfully!`);
