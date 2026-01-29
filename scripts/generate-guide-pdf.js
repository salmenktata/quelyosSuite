const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const outputPath = path.join(__dirname, "..", "docs", "Guide_Practique_Quelyos.pdf");

const doc = new PDFDocument({
  size: "A4",
  margin: 50,
});

doc.pipe(fs.createWriteStream(outputPath));

const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

function title(text) {
  doc.font("Helvetica-Bold").fontSize(24).text(text);
  doc.moveDown(0.2);
}

function subtitle(text) {
  doc.font("Helvetica").fontSize(12).fillColor("#333333").text(text);
  doc.moveDown(0.6);
  doc.fillColor("#000000");
}

function section(text) {
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(14).text(text);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(11);
}

function paragraph(text) {
  doc.font("Helvetica").fontSize(11).text(text, { align: "left" });
  doc.moveDown(0.4);
}

function bullets(items) {
  doc.font("Helvetica").fontSize(11);
  items.forEach((item) => {
    doc.text(`• ${item}`, { indent: 12 });
  });
  doc.moveDown(0.4);
}

function table(rows, colWidths) {
  const startX = doc.page.margins.left;
  let y = doc.y;
  const rowHeight = 18;

  rows.forEach((row, rowIndex) => {
    let x = startX;
    row.forEach((cell, colIndex) => {
      const w = colWidths[colIndex];
      if (rowIndex === 0) {
        doc.font("Helvetica-Bold");
      } else {
        doc.font("Helvetica");
      }
      doc.fontSize(10).text(cell, x, y, { width: w, lineBreak: false });
      x += w;
    });
    y += rowHeight;
  });
  doc.moveDown(0.8);
}

function drawBox(x, y, w, h, label) {
  doc.rect(x, y, w, h).stroke();
  doc.font("Helvetica").fontSize(9).text(label, x + 4, y + 6, {
    width: w - 8,
    align: "center",
  });
}

function line(x1, y1, x2, y2) {
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
}

// --- PAGE 1 ---
title("Quelyos Suite — Guide pratique");
subtitle("Aperçu technique & architectural (simplifié, basé sur le code du repo)");

section("Public cible");
paragraph("Informaticien non-expert souhaitant comprendre l’architecture globale et les grands blocs du projet.");

section("Résumé en 5 points");
bullets([
  "Quelyos Suite est centré sur Odoo 19 (backend) et des applications web dédiées (frontends + backoffices).",
  "Les interfaces web consomment l’API Odoo via des routes /api.",
  "Nginx sert de porte d’entrée en production (reverse proxy + routage).",
  "PostgreSQL et Redis sont les dépendances principales du backend.",
  "Une stack de monitoring optionnelle est disponible (Prometheus, Grafana, Loki).",
]);

section("Applications incluses (code réel)");
bullets([
  "vitrine-quelyos/ (Next.js) : site vitrine + pages marketing/finance/superadmin.",
  "vitrine-client/ (Next.js) : boutique e-commerce (multi-tenant).",
  "dashboard-client/ (React + Vite) : backoffice principal.",
  "super-admin-client/ (React + Vite) : backoffice SaaS (tenants, abonnements).",
  "odoo-backend/ : Odoo 19 + modules quelyos_* (API, stock, finance, SMS…).",
]);

// --- PAGE 2 ---
doc.addPage();
section("Schéma global (production — vue simplifiée)");

const cx = doc.page.margins.left + pageWidth / 2;

const userW = 120;
const nginxW = 150;
const appW = 200;
const appH = 38;
const odooW = 200;
const dbW = 130;

const y0 = 90;
drawBox(cx - userW / 2, y0, userW, 28, "Utilisateurs");
drawBox(cx - nginxW / 2, y0 + 50, nginxW, 28, "Nginx (reverse proxy)");

const row1Y = y0 + 110;
const row2Y = row1Y + 55;
const leftX = doc.page.margins.left + 20;
const rightX = leftX + appW + 30;

drawBox(leftX, row1Y, appW, appH, "vitrine-quelyos");
drawBox(rightX, row1Y, appW, appH, "vitrine-client");
drawBox(leftX, row2Y, appW, appH, "dashboard-client");
drawBox(rightX, row2Y, appW, appH, "super-admin-client");

const odooY = row2Y + 70;
drawBox(cx - odooW / 2, odooY, odooW, 40, "odoo-backend (Odoo 19)");

const dbY = odooY + 70;
drawBox(cx - dbW - 20, dbY, dbW, 30, "PostgreSQL");
drawBox(cx + 20, dbY, dbW, 30, "Redis");

// Lines
line(cx, y0 + 28, cx, y0 + 50);
line(cx, y0 + 78, cx, row1Y - 6);
line(cx, row1Y - 6, leftX + appW / 2, row1Y);
line(cx, row1Y - 6, rightX + appW / 2, row1Y);
line(cx, row1Y - 6, leftX + appW / 2, row2Y);
line(cx, row1Y - 6, rightX + appW / 2, row2Y);
line(leftX + appW / 2, row2Y + appH, cx, odooY);
line(rightX + appW / 2, row2Y + appH, cx, odooY);
line(cx, odooY + 40, cx - dbW / 2 - 20, dbY);
line(cx, odooY + 40, cx + dbW / 2 + 20, dbY);

doc.moveDown(10);
paragraph("En production, Nginx route les requêtes vers les apps web et l’API Odoo. "
  + "Les apps consomment ensuite les endpoints Odoo (/api/ecommerce/*, /api/super-admin/*, etc.).");

// --- PAGE 3 ---
doc.addPage();
section("Composants & rôles (simplifié)");

table(
  [
    ["Composant", "Rôle principal", "Tech"],
    ["odoo-backend", "API métier + logique ERP", "Odoo 19 + modules quelyos_*"],
    ["vitrine-quelyos", "Site vitrine / marketing", "Next.js"],
    ["vitrine-client", "Boutique e-commerce", "Next.js + multi-tenant"],
    ["dashboard-client", "Backoffice principal", "React + Vite"],
    ["super-admin-client", "Admin SaaS (tenants, billing)", "React + Vite"],
    ["nginx", "Reverse proxy + sécurité", "Nginx"],
    ["postgresql", "Base de données", "PostgreSQL"],
    ["redis", "Cache / sessions / rate-limit", "Redis"],
  ],
  [120, 230, 120]
);

section("Ports de développement");
table(
  [
    ["Service", "Port"],
    ["vitrine-quelyos", "3000"],
    ["vitrine-client", "3001"],
    ["dashboard-client", "5175"],
    ["super-admin-client", "5176"],
    ["odoo-backend", "8069"],
    ["PostgreSQL", "5432"],
    ["Redis", "6379"],
  ],
  [200, 120]
);

section("Multi-tenant (principe)");
bullets([
  "Le tenant est détecté par domaine côté frontend (vitrine-client).",
  "Nginx peut injecter un header X-Tenant-Code (template multi-tenant).",
  "Odoo expose des endpoints dédiés pour la configuration tenant.",
]);

// --- PAGE 4 ---
doc.addPage();
section("Flux principaux (simplifiés)");
bullets([
  "Visiteur → Nginx → vitrine-client → /api/ecommerce/* → Odoo → PostgreSQL/Redis.",
  "Administrateur → Nginx → dashboard-client → /api/admin/* → Odoo.",
  "Super-admin → super-admin-client → /api/super-admin/* → Odoo.",
]);

section("Optionnels (selon besoins)");
bullets([
  "Stack monitoring: Prometheus, Grafana, Loki (docker-compose.monitoring.yml).",
  "API Node.js séparée (dossier api/) : non branchée par défaut en prod.",
]);

section("Repères utiles");
bullets([
  "Nginx prod: nginx/nginx.conf (routage /, /admin, /api, /web).",
  "Modules Odoo: odoo-backend/addons/quelyos_*.",
  "Super-admin endpoints: odoo-backend/addons/quelyos_api/controllers/super_admin.py.",
]);

doc.moveDown(1);
paragraph("Ce guide est volontairement simple et précis pour une lecture rapide. "
  + "Il reflète l’état du code présent dans ce dépôt.");

doc.end();

console.log(`PDF généré: ${outputPath}`);
