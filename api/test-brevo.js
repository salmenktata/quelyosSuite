#!/usr/bin/env node

/**
 * Test rapide du service Brevo
 * Usage: node test-brevo.js [email-destinataire]
 */

require('dotenv').config();
const brevoService = require('./src/services/brevo.service');

const toEmail = process.argv[2] || 'demo@quelyos.com';

async function testBrevo() {
  console.log('🧪 Test d\'envoi d\'email via Brevo...\n');
  console.log(`📧 Destinataire: ${toEmail}\n`);

  try {
    const result = await brevoService.sendCashAlert({
      to: toEmail,
      userName: 'Test Utilisateur',
      alertName: 'Test Brevo - Seuil critique 5000€',
      message: 'Ceci est un email de test pour valider l\'intégration Brevo avec F93 - Alertes Trésorerie.',
      currentBalance: 3450,
      threshold: 5000,
      actionUrl: 'http://localhost:3007/dashboard/forecast'
    });

    if (result.success) {
      console.log('✅ Email envoyé avec succès !');
      console.log(`   Message ID: ${result.messageId}\n`);
      console.log('📊 Vérifiez dans votre dashboard Brevo:');
      console.log('   https://app.brevo.com/campaign/dashboard');
      console.log('   → Onglet "Transactional"\n');
    } else {
      console.error('❌ Échec d\'envoi:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

testBrevo();
