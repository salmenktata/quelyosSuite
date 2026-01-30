# 🚀 Guide Configuration Brevo - Étape par Étape

**Objectif** : Configurer Brevo (ex-Sendinblue) pour les notifications email Quelyos

**Temps estimé** : 10 minutes

**Prérequis** :
- Accès super admin Quelyos : http://localhost:5176
- Email valide pour créer compte Brevo

---

## 📋 Étape 1 : Créer un Compte Brevo (Gratuit)

### 1.1. Inscription

1. Aller sur **https://www.brevo.com**
2. Cliquer sur **"Sign up free"** (en haut à droite)
3. Remplir le formulaire :
   - **Email** : Votre email professionnel
   - **Password** : Choisir un mot de passe fort
4. Cocher "I agree to the Terms of Service"
5. Cliquer **"Get started"**

### 1.2. Vérification Email

1. Ouvrir votre boîte mail
2. Chercher email de Brevo : **"Please confirm your email address"**
3. Cliquer sur le lien de confirmation
4. Vous serez redirigé vers le dashboard Brevo

### 1.3. Compléter le Profil (Optionnel)

Brevo peut demander quelques informations :
- **Company name** : Quelyos ou votre nom d'entreprise
- **Industry** : SaaS / Technology
- **Country** : Votre pays
- **Phone** : Optionnel

Cliquer **"Continue"** pour accéder au dashboard.

---

## 🔑 Étape 2 : Obtenir la SMTP Key

### 2.1. Accéder aux Paramètres SMTP

1. Dans le dashboard Brevo, cliquer sur votre **nom** (en haut à droite)
2. Sélectionner **"SMTP & API"** dans le menu déroulant

   **OU**

   Aller directement sur : https://app.brevo.com/settings/keys/smtp

### 2.2. Générer une SMTP Key

1. Scroller jusqu'à la section **"SMTP"**
2. Cliquer sur **"Generate a new SMTP key"**
3. Une fenêtre s'ouvre avec votre clé SMTP

**Important** :
- ✅ **Copier immédiatement** la clé SMTP (format: `xsmtpsib-xxxxx...`)
- ✅ La sauvegarder dans un endroit sûr (gestionnaire mots de passe)
- ⚠️ Vous ne pourrez **plus la voir** après avoir fermé la fenêtre

**Exemple de SMTP Key** :
```
xsmtpsib-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

4. Cliquer **"OK, I saved my SMTP key"**

### 2.3. Vérifier les Informations SMTP

Sur la même page, vous verrez :
```
SMTP Server: smtp-relay.brevo.com
Port: 587
```

**Note** : Ces valeurs sont déjà pré-remplies dans le preset Quelyos.

---

## ⚙️ Étape 3 : Configurer Brevo dans Quelyos

### 3.1. Accéder à la Page Email Settings

1. Ouvrir Quelyos Super Admin : **http://localhost:5176**
2. Se connecter avec le compte admin
3. Dans le menu latéral, cliquer sur **"Email (SMTP)"**

### 3.2. Créer le Serveur SMTP Brevo

1. Cliquer sur **"+ Nouveau Serveur"** (bouton en haut à droite)
2. Dans **"Utiliser un preset"**, sélectionner :
   ```
   Brevo (Sendinblue) - Service professionnel d'emailing transactionnel
   ```

**Le formulaire se remplit automatiquement** :
- Nom : `Brevo (Sendinblue)`
- SMTP Host : `smtp-relay.brevo.com`
- Port : `587`
- Encryption : `STARTTLS`

### 3.3. Remplir les Credentials

1. **Username** : Entrer votre **email Brevo** (celui utilisé pour l'inscription)
   ```
   Exemple : admin@quelyos.com
   ```

2. **Password** : Coller la **SMTP Key** copiée à l'étape 2.2
   ```
   Exemple : xsmtpsib-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   ```

3. Laisser les autres champs par défaut

### 3.4. Sauvegarder

1. Cliquer sur **"Sauvegarder"**
2. Vous devriez voir :
   - ✅ Toast vert : **"Serveur créé"**
   - ✅ Carte serveur apparaît avec badge **🟢 Actif**

---

## 📨 Étape 4 : Tester l'Envoi d'Email

### 4.1. Lancer le Test

1. Cliquer sur **"Tester Email"** (bouton en haut à droite)
2. Entrer votre email dans le champ **"Email destinataire"**
   ```
   Exemple : votre-email@gmail.com
   ```
3. Cliquer sur **"Envoyer"**

### 4.2. Vérifier l'Envoi

**Si succès** :
- ✅ Toast vert : **"Email de test envoyé à votre-email@gmail.com"**
- ✅ Loader disparaît
- ✅ Modal se ferme

**Si échec** :
- ❌ Toast rouge : **"Échec envoi email"** + message d'erreur
- Voir section [Troubleshooting](#troubleshooting)

### 4.3. Vérifier Réception

1. Ouvrir votre boîte mail (attendre 30 secondes)
2. Chercher email avec sujet : **"[Quelyos] Test Email SMTP"**
3. **Si absent** : Vérifier dossier **Spam** / **Promotions**

**Contenu de l'email de test** :
```
Bonjour,

Ceci est un email de test pour valider la configuration SMTP
de votre plateforme Quelyos.

Date: 2026-01-30 17:30:00

Si vous recevez cet email, la configuration est correcte ✅

Cordialement,
Système Quelyos
```

---

## 🎉 Étape 5 : Configuration Terminée !

**Félicitations !** Votre serveur SMTP Brevo est configuré et fonctionnel.

### Prochaines Notifications

Les notifications suivantes utiliseront automatiquement Brevo :

📦 **Backups Automatiques**
- Email de succès après chaque backup planifié
- Email d'erreur si le backup échoue

🚨 **Alertes Système**
- Monitoring dégradation santé
- Sécurité : tentatives connexion suspectes

📊 **Rapports**
- Statistiques quotidiennes/hebdomadaires (si configurés)

---

## 🔧 Troubleshooting

### Problème : "Authentication failed"

**Causes possibles** :
1. ❌ Username incorrect (doit être votre email Brevo)
2. ❌ SMTP Key invalide ou expirée
3. ❌ Espaces dans la SMTP Key (copié avec espaces)

**Solutions** :
1. Vérifier que l'username est bien votre **email Brevo** (pas un autre email)
2. Régénérer une nouvelle SMTP Key :
   - Aller sur https://app.brevo.com/settings/keys/smtp
   - Cliquer **"Generate a new SMTP key"**
   - Copier la nouvelle clé
   - Éditer le serveur dans Quelyos et remplacer le password
3. Vérifier qu'il n'y a **pas d'espaces** avant/après la SMTP Key

### Problème : "Connection timeout"

**Causes possibles** :
1. ❌ Firewall bloque le port 587
2. ❌ Réseau instable

**Solutions** :
1. Tester connectivité :
   ```bash
   telnet smtp-relay.brevo.com 587
   ```
   Résultat attendu : `220 smtp-relay.brevo.com ESMTP`

2. Vérifier firewall sortant (autoriser port 587)

3. Essayer avec une autre connexion internet

### Problème : "Sender address rejected"

**Cause** :
- Brevo rejette l'adresse expéditeur (non vérifiée)

**Solution** :
1. Aller sur https://app.brevo.com/settings/senders
2. Cliquer **"Add a new sender"**
3. Entrer votre email : `backups@votredomaine.com`
4. Vérifier le domaine (SPF/DKIM)

**Note** : Pour les tests, Brevo accepte généralement n'importe quel expéditeur avec le plan gratuit.

### Problème : Email reçu mais en spam

**Causes** :
- Domaine expéditeur non vérifié
- Contenu suspect

**Solutions** :
1. **Vérifier domaine dans Brevo** :
   - Aller sur https://app.brevo.com/settings/senders
   - Ajouter votre domaine
   - Configurer SPF/DKIM (instructions fournies par Brevo)

2. **Marquer comme "Non spam"** dans votre boîte mail
   - Les futurs emails arriveront en boîte de réception

---

## 📊 Statistiques et Monitoring Brevo

### Voir les Emails Envoyés

1. Dashboard Brevo : https://app.brevo.com
2. Aller dans **"Statistics"** > **"Email"**
3. Vous verrez :
   - 📊 Nombre d'emails envoyés
   - ✅ Taux de délivrabilité
   - 📂 Taux d'ouverture (si tracking activé)

### Limites Plan Gratuit

**Brevo Free** :
- ✅ **100 emails/jour** (largement suffisant pour notifications système)
- ✅ Envoi illimité de contacts (pas de limite destinataires)
- ✅ Support SMTP inclus
- ⚠️ Logo Brevo dans footer (peut être retiré avec plan payant)

**Upgrade si besoin** :
- Plan Lite : 5,000 emails/mois (~€25/mois)
- Plan Premium : 20,000 emails/mois (~€65/mois)

---

## 🔐 Sécurité et Bonnes Pratiques

### 1. Protéger la SMTP Key

✅ **À faire** :
- Sauvegarder la SMTP Key dans un gestionnaire de mots de passe
- Ne **jamais** la partager par email ou chat
- Révoquer les clés inutilisées

❌ **À ne pas faire** :
- Committer la SMTP Key dans Git
- La partager avec des tiers
- L'exposer dans des logs

### 2. Révoquer une SMTP Key

Si la clé est compromise :
1. Aller sur https://app.brevo.com/settings/keys/smtp
2. Cliquer sur **"Delete"** à côté de la clé compromise
3. Générer une nouvelle clé
4. Mettre à jour dans Quelyos

### 3. Monitoring

**Vérifier régulièrement** :
- Dashboard Brevo : Taux de délivrabilité > 95%
- Emails non délivrés (bounces) : < 5%
- Pas de pic d'envois suspect (signe de spam)

---

## 🎯 Cas d'Usage Quelyos

### 1. Notifications Backups Automatiques

**Exemple d'email envoyé** :
```
Sujet : [Quelyos] Backup automatique réussi - Boutique Sport
De : backups@quelyos.com
À : admin@quelyos.com

Bonjour,

Le backup automatique de Boutique Sport a été exécuté avec succès.

Détails :
- Date : 2026-01-30 02:00:00
- Records sauvegardés : 142
- Taille : 0.01 MB
- Prochain backup : 2026-01-31 02:00:00

Fichier : backup_sport_20260130_020000.zip

Cordialement,
Système de Backup Quelyos
```

**Fréquence** : Selon planifications configurées (quotidien, hebdomadaire, mensuel)

### 2. Alertes Monitoring

**Exemple d'alerte** :
```
Sujet : [Quelyos] ⚠️ Dégradation santé application
De : alerts@quelyos.com
À : admin@quelyos.com

ATTENTION,

L'application "vitrine-client" a connu une dégradation de santé :
- Ancien taux : 100%
- Nouveau taux : 87.5%
- Baisse : 12.5%

Routes en erreur :
- /products → 500 Internal Server Error
- /cart → Timeout (> 5000ms)

Action requise : Vérifier les logs et redémarrer l'application.

Cordialement,
Système Monitoring Quelyos
```

---

## 📞 Support

### Support Brevo
- Documentation : https://help.brevo.com/
- Email : support@brevo.com
- Chat : Disponible dans le dashboard

### Support Quelyos
- Email : support@quelyos.com
- Documentation : https://docs.quelyos.com
- GitHub Issues : https://github.com/quelyos/quelyos-suite/issues

---

## ✅ Checklist Configuration Brevo

Avant de valider la configuration, vérifier :

- [ ] Compte Brevo créé et email vérifié
- [ ] SMTP Key générée et sauvegardée
- [ ] Serveur SMTP créé dans Quelyos avec preset Brevo
- [ ] Credentials renseignés (email + SMTP Key)
- [ ] Test email envoyé avec succès
- [ ] Email de test reçu (boîte de réception ou spam)
- [ ] Badge serveur : 🟢 Actif
- [ ] Backups automatiques configurés avec email de notification

**Si tous les items sont cochés** : ✅ **Configuration Brevo terminée !**

---

**Dernière mise à jour** : Janvier 2026
**Version** : 1.0
