#!/usr/bin/env node
/**
 * Script de monitoring des erreurs console en temps réel
 * Surveille les logs des 3 frontends + backend
 *
 * Usage: node scripts/dev-monitor.js
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const SERVICES = {
  vitrine: { name: 'Vitrine', port: 3000, color: COLORS.cyan },
  ecommerce: { name: 'E-commerce', port: 3001, color: COLORS.green },
  backoffice: { name: 'Backoffice', port: 5175, color: COLORS.magenta },
};

// Compteurs d'erreurs
const errorCounts = {
  vitrine: { errors: 0, warnings: 0 },
  ecommerce: { errors: 0, warnings: 0 },
  backoffice: { errors: 0, warnings: 0 },
};

// Buffer pour les dernières erreurs
const errorBuffer = {
  vitrine: [],
  ecommerce: [],
  backoffice: [],
};

const MAX_BUFFER_SIZE = 10;

/**
 * Vérifier si un service est actif
 */
async function checkServiceHealth(port) {
  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);

    return response?.ok || false;
  } catch {
    return false;
  }
}

/**
 * Monitorer les logs d'un service
 */
function monitorService(serviceKey, logCommand) {
  const service = SERVICES[serviceKey];
  const proc = spawn('sh', ['-c', logCommand], { stdio: 'pipe' });

  const rl = createInterface({
    input: proc.stdout,
    crlfDelay: Infinity,
  });

  rl.on('line', (line) => {
    const lowerLine = line.toLowerCase();

    // Détection erreurs
    if (lowerLine.includes('error') || lowerLine.includes('exception')) {
      errorCounts[serviceKey].errors++;
      errorBuffer[serviceKey].push({
        type: 'error',
        message: line,
        timestamp: new Date().toISOString(),
      });

      if (errorBuffer[serviceKey].length > MAX_BUFFER_SIZE) {
        errorBuffer[serviceKey].shift();
      }

      console.log(
        `${service.color}[${service.name} ERROR]${COLORS.reset} ${COLORS.red}${line}${COLORS.reset}`
      );

      // Bip sonore sur erreur
      process.stdout.write('\x07');
    }
    // Détection warnings
    else if (lowerLine.includes('warn') || lowerLine.includes('warning')) {
      errorCounts[serviceKey].warnings++;
      console.log(
        `${service.color}[${service.name} WARN]${COLORS.reset} ${COLORS.yellow}${line}${COLORS.reset}`
      );
    }
  });

  proc.stderr.on('data', (data) => {
    console.error(`${service.color}[${service.name} STDERR]${COLORS.reset} ${data}`);
  });

  return proc;
}

/**
 * Afficher le dashboard d'erreurs
 */
function displayDashboard() {
  console.clear();
  console.log(`${COLORS.cyan}═══════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.cyan}   🔍 MONITEUR D'ERREURS - Mode Développement${COLORS.reset}`);
  console.log(`${COLORS.cyan}═══════════════════════════════════════════════════${COLORS.reset}\n`);

  Object.entries(SERVICES).forEach(([key, service]) => {
    const stats = errorCounts[key];
    const errorColor = stats.errors > 0 ? COLORS.red : COLORS.green;
    const warnColor = stats.warnings > 0 ? COLORS.yellow : COLORS.green;

    console.log(`${service.color}▶ ${service.name} (Port ${service.port})${COLORS.reset}`);
    console.log(`  ${errorColor}Erreurs: ${stats.errors}${COLORS.reset}`);
    console.log(`  ${warnColor}Warnings: ${stats.warnings}${COLORS.reset}\n`);
  });

  console.log(`${COLORS.cyan}─────────────────────────────────────────────────${COLORS.reset}`);
  console.log('Dernières erreurs capturées:\n');

  let hasErrors = false;
  Object.entries(errorBuffer).forEach(([key, errors]) => {
    if (errors.length > 0) {
      hasErrors = true;
      console.log(`${SERVICES[key].color}${SERVICES[key].name}:${COLORS.reset}`);
      errors.slice(-3).forEach((err) => {
        const time = new Date(err.timestamp).toLocaleTimeString();
        console.log(`  ${COLORS.red}[${time}]${COLORS.reset} ${err.message.substring(0, 100)}`);
      });
      console.log('');
    }
  });

  if (!hasErrors) {
    console.log(`  ${COLORS.green}✓ Aucune erreur détectée${COLORS.reset}\n`);
  }

  console.log(`${COLORS.cyan}═══════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.yellow}Appuyez sur Ctrl+C pour quitter${COLORS.reset}\n`);
}

/**
 * Vérifier le health check de tous les services
 */
async function checkAllServices() {
  const results = await Promise.all(
    Object.entries(SERVICES).map(async ([key, service]) => {
      const isHealthy = await checkServiceHealth(service.port);
      return { key, service, isHealthy };
    })
  );

  console.log(`\n${COLORS.cyan}🏥 Vérification des services:${COLORS.reset}`);
  results.forEach(({ service, isHealthy }) => {
    const status = isHealthy ? `${COLORS.green}✓ UP` : `${COLORS.red}✗ DOWN`;
    console.log(`  ${service.name}: ${status}${COLORS.reset}`);
  });
  console.log('');
}

/**
 * Main
 */
async function main() {
  console.log(`${COLORS.cyan}🚀 Démarrage du moniteur d'erreurs...${COLORS.reset}\n`);

  // Vérifier les services
  await checkAllServices();

  // Note: Pour un vrai monitoring, il faudrait parser les logs des processus en cours
  // Pour l'instant, on affiche juste le dashboard statique
  displayDashboard();

  // Rafraîchir le dashboard toutes les 5 secondes
  setInterval(displayDashboard, 5000);

  // Gestion de l'arrêt propre
  process.on('SIGINT', () => {
    console.log(`\n\n${COLORS.yellow}⚠️  Arrêt du moniteur...${COLORS.reset}`);
    console.log('\nRésumé final:');
    Object.entries(SERVICES).forEach(([key, service]) => {
      const stats = errorCounts[key];
      console.log(
        `  ${service.name}: ${COLORS.red}${stats.errors} erreurs${COLORS.reset}, ${COLORS.yellow}${stats.warnings} warnings${COLORS.reset}`
      );
    });
    console.log('');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(`${COLORS.red}Erreur fatale:${COLORS.reset}`, err);
  process.exit(1);
});
