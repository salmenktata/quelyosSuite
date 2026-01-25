require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const alertNotifier = require('./src/services/alert-notifier.service');
const alertEvaluator = require('./src/services/alert-evaluator.service');
const logger = require('./logger');

const prisma = new PrismaClient();

async function testAlertCreation() {
  console.log('🧪 Test complet F93 - Alertes Trésorerie\n');

  try {
    // 1. Récupérer l'utilisateur démo
    const user = await prisma.user.findUnique({
      where: { email: 'demo@quelyos.com' },
      select: { id: true, companyId: true, email: true }
    });

    if (!user) {
      console.log('❌ Utilisateur demo@quelyos.com non trouvé');
      return;
    }

    console.log('1️⃣ Utilisateur trouvé:', user.email);
    console.log('   Company ID:', user.companyId);
    console.log('');

    // 2. Créer une alerte de test
    const alert = await prisma.cashAlert.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        name: 'Test Brevo - Seuil 10000€',
        type: 'THRESHOLD',
        thresholdAmount: 10000,
        compareOperator: 'lt',
        cooldownHours: 1,
        isActive: true,
        emailEnabled: true
      },
      include: {
        user: {
          select: { email: true }
        },
        triggers: true
      }
    });

    console.log('2️⃣ Alerte créée:', alert.name);
    console.log('   ID:', alert.id);
    console.log('   Type:', alert.type);
    console.log('   Seuil:', alert.thresholdAmount + '€');
    console.log('');

    // 3. Évaluer l'alerte
    console.log('3️⃣ Évaluation de l\'alerte...');
    const evaluation = await alertEvaluator.evaluate(alert);

    console.log('   Should trigger:', evaluation.shouldTrigger);
    console.log('   Reason:', evaluation.reason || 'condition évaluée');
    console.log('   Context:', JSON.stringify(evaluation.context, null, 2));
    console.log('');

    // 4. Si déclenchée, envoyer notification
    if (evaluation.shouldTrigger) {
      console.log('4️⃣ Envoi notification email...');
      const trigger = await alertNotifier.notify(evaluation);

      console.log('   ✅ Notification envoyée !');
      console.log('   Trigger ID:', trigger.id);
      console.log('   Email envoyé:', trigger.emailSent ? 'Oui' : 'Non');
      console.log('');

      console.log('📧 Vérifiez votre boîte mail:', user.email);
      console.log('📊 Dashboard Brevo: https://app.brevo.com/campaign/dashboard');
    } else {
      console.log('4️⃣ Alerte non déclenchée:', evaluation.reason || 'condition non remplie');
      console.log('   (Pour déclencher: ajouter des transactions qui font passer le solde sous 10000€)');
    }

    console.log('');
    console.log('✅ Test terminé avec succès !');
    console.log('');

    // Nettoyer
    await prisma.cashAlert.delete({ where: { id: alert.id } });
    console.log('🧹 Alerte de test supprimée');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAlertCreation();
