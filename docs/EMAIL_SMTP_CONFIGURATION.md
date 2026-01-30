# 📧 Configuration Email SMTP - Guide Super Admin

**Version** : 1.0
**Date** : Janvier 2026
**Public** : Super Administrateurs Quelyos

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Accès à la fonctionnalité](#accès-à-la-fonctionnalité)
3. [Providers supportés](#providers-supportés)
4. [Configuration SMTP](#configuration-smtp)
5. [Tester l'envoi](#tester-lenvoi)
6. [Cas d'usage](#cas-dusage)
7. [FAQ](#faq)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le système de **Configuration Email SMTP** permet de :

✅ **Configurer** un ou plusieurs serveurs SMTP pour les notifications système
✅ **Utiliser** Brevo, Gmail, Outlook, SendGrid ou SMTP personnalisé
✅ **Tester** l'envoi d'emails avant activation
✅ **Gérer** plusieurs serveurs SMTP avec priorités
✅ **Sécuriser** les credentials (passwords masqués)

### Notifications Concernées

Les serveurs SMTP configurés ici sont utilisés pour :

- 📦 **Backups automatiques** : Notifications succès/échec
- 🚨 **Alertes système** : Monitoring, sécurité, erreurs
- 📊 **Rapports** : Statistiques quotidiennes/hebdomadaires
- 🎫 **Support** : Notifications tickets clients

---

## 🔐 Accès à la Fonctionnalité

### Prérequis

- **Rôle** : Super Administrateur
- **Authentification** : Compte admin Odoo
- **URL** : `http://localhost:5176` (ou votre domaine)

### Navigation

1. **Connexion** : Se connecter avec le compte admin
2. **Menu** : Cliquer sur **"Email (SMTP)"** dans le menu latéral gauche
3. **Page** : Accéder à la page de configuration SMTP

---

## 🌐 Providers Supportés

### 1. Brevo (Recommandé pour Production)

**Avantages** :
- ✅ Service professionnel d'emailing transactionnel
- ✅ 100 emails/jour gratuit (limite généreuse)
- ✅ Dashboard statistiques inclus
- ✅ Support technique

**Configuration** :
```yaml
Provider: Brevo
Host: smtp-relay.brevo.com
Port: 587
Encryption: STARTTLS
Username: Votre email Brevo
Password: Votre SMTP Key (trouvable dans Settings > SMTP & API)
```

**Obtenir une SMTP Key Brevo** :
1. Créer compte sur [brevo.com](https://www.brevo.com)
2. Aller dans **Settings** > **SMTP & API**
3. Cliquer sur **Generate a new SMTP key**
4. Copier la clé (format: `xsmtpsib-...`)

### 2. Gmail

**Avantages** :
- ✅ Gratuit
- ✅ Configuration simple

**Inconvénients** :
- ⚠️ Limite stricte : 500 emails/jour
- ⚠️ Nécessite App Password (pas le mot de passe Gmail)

**Configuration** :
```yaml
Provider: Gmail
Host: smtp.gmail.com
Port: 587
Encryption: STARTTLS
Username: votre-email@gmail.com
Password: App Password (16 caractères)
```

**Obtenir un App Password Gmail** :
1. Activer la validation en 2 étapes sur votre compte Google
2. Aller dans [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Générer un App Password pour "Mail"
4. Copier le code 16 caractères (ex: `abcd efgh ijkl mnop`)

### 3. Outlook / Office 365

**Configuration** :
```yaml
Provider: Outlook
Host: smtp.office365.com
Port: 587
Encryption: STARTTLS
Username: votre-email@outlook.com ou @votredomaine.com
Password: Votre mot de passe Outlook
```

**Note** : Compatible avec comptes Business et Personnel.

### 4. SendGrid

**Avantages** :
- ✅ Service cloud de Twilio
- ✅ 100 emails/jour gratuit
- ✅ API REST alternative disponible

**Configuration** :
```yaml
Provider: SendGrid
Host: smtp.sendgrid.net
Port: 587
Encryption: STARTTLS
Username: apikey (littéralement "apikey")
Password: Votre API Key SendGrid
```

### 5. SMTP Personnalisé

Si vous avez votre propre serveur SMTP :

```yaml
Provider: Custom
Host: smtp.votredomaine.com
Port: 587 ou 465 ou 25
Encryption: STARTTLS | SSL | None
Username: votre-user
Password: votre-password
```

---

## ⚙️ Configuration SMTP

### Étape 1 : Créer un Serveur SMTP

1. Cliquer sur **"+ Nouveau Serveur"**
2. Sélectionner un preset ou "Configuration personnalisée"
3. Remplir le formulaire :

#### Champs Obligatoires

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Nom** | Nom lisible du serveur | "Brevo Production" |
| **SMTP Host** | Adresse serveur SMTP | `smtp-relay.brevo.com` |
| **Port** | Port SMTP | `587` (STARTTLS) |
| **Encryption** | Type de chiffrement | STARTTLS (recommandé) |

#### Champs Optionnels

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Username** | Identifiant SMTP | `admin@quelyos.com` |
| **Password** | Mot de passe SMTP | `xsmtpsib-abc123...` |

**Note** : Le password est masqué (••••••) après sauvegarde.

### Étape 2 : Sauvegarder

Cliquer sur **"Sauvegarder"**.

Le serveur apparaît dans la liste avec un badge :
- 🟢 **Actif** : Le serveur sera utilisé
- ⚪ **Inactif** : Le serveur est désactivé

### Étape 3 : Éditer / Supprimer

**Éditer** :
1. Cliquer sur l'icône **Éditer** (serveur)
2. Modifier les champs souhaités
3. Laisser le password vide pour conserver l'ancien
4. Sauvegarder

**Supprimer** :
1. Cliquer sur l'icône **Supprimer** (poubelle)
2. Confirmer la suppression

⚠️ **Attention** : Si vous supprimez tous les serveurs SMTP, les emails ne pourront plus être envoyés.

---

## 📨 Tester l'Envoi

### Pourquoi Tester ?

Avant d'activer un serveur SMTP en production, il est crucial de vérifier :
- ✅ Les credentials sont corrects
- ✅ Le serveur SMTP est accessible
- ✅ Les emails arrivent bien (pas en spam)

### Procédure de Test

1. Cliquer sur **"Tester Email"** (bouton en haut à droite)
2. Entrer un email destinataire (le vôtre pour vérifier)
3. Cliquer sur **"Envoyer"**
4. Attendre la notification (succès ou échec)

### Email de Test

**Sujet** : `[Quelyos] Test Email SMTP`

**Corps** :
```
Bonjour,

Ceci est un email de test pour valider la configuration SMTP de votre plateforme Quelyos.

Date: 2026-01-30 17:30:00

Si vous recevez cet email, la configuration est correcte ✅

Cordialement,
Système Quelyos
```

### Vérifier Réception

1. Attendre 30 secondes (délai SMTP)
2. Vérifier boîte de réception
3. **Si absent** : Vérifier dossier **Spam**

---

## 📊 Cas d'Usage

### Cas 1 : Production avec Brevo

**Objectif** : Service professionnel fiable

**Configuration** :
```yaml
Nom: Brevo Production
Host: smtp-relay.brevo.com
Port: 587
Encryption: STARTTLS
Username: admin@quelyos.com
Password: xsmtpsib-abc123... (SMTP Key Brevo)
Active: Oui
Sequence: 10
```

**Volume** : 100 emails/jour gratuit, ~10,000 avec plan payant

### Cas 2 : Développement avec Gmail

**Objectif** : Tests en local

**Configuration** :
```yaml
Nom: Gmail Dev
Host: smtp.gmail.com
Port: 587
Encryption: STARTTLS
Username: dev@votredomaine.com
Password: abcd efgh ijkl mnop (App Password)
Active: Oui
Sequence: 10
```

**Volume** : Max 500 emails/jour

### Cas 3 : Multi-Serveurs avec Failover

**Objectif** : Haute disponibilité

**Serveur Primaire** :
```yaml
Nom: Brevo Primary
Sequence: 10  ← Plus petite séquence = priorité haute
Active: Oui
```

**Serveur Secondaire (backup)** :
```yaml
Nom: SendGrid Backup
Sequence: 20  ← Utilisé si Brevo échoue
Active: Oui
```

Odoo essaiera automatiquement le serveur avec la plus petite séquence, puis le suivant en cas d'échec.

---

## ❓ FAQ

### Quel provider choisir ?

**Pour production** : **Brevo** (fiable, gratuit jusqu'à 100/jour)
**Pour dev/test** : **Gmail** (simple, 500/jour)
**Pour volume élevé** : **SendGrid** ou **Brevo payant**

### Combien de serveurs SMTP puis-je configurer ?

**Illimité**. Vous pouvez ajouter autant de serveurs que nécessaire.

### Comment fonctionne la priorité ?

Le champ **Sequence** définit l'ordre d'utilisation :
- Sequence = 10 → Utilisé en premier
- Sequence = 20 → Utilisé si le premier échoue
- Sequence = 30 → Utilisé si les deux premiers échouent

### Le password est-il sécurisé ?

✅ **Oui**. Le password est :
- Stocké chiffré dans la base de données Odoo
- **Jamais affiché** dans l'API (masqué : ••••••)
- Accessible uniquement aux super admins

### Pourquoi mon email est en spam ?

**Causes possibles** :
1. **Domaine non vérifié** : Configurer SPF/DKIM sur votre domaine
2. **Réputation serveur** : Utiliser un service professionnel (Brevo)
3. **Contenu suspect** : Éviter mots-clés spam dans le sujet

**Solution** :
- Utiliser **Brevo** (domaine vérifié automatiquement)
- Configurer SPF/DKIM pour votre domaine

### Puis-je utiliser le port 25 ?

⚠️ **Non recommandé**. La plupart des FAI bloquent le port 25 (anti-spam).

**Utiliser** :
- Port **587** avec STARTTLS (recommandé)
- Port **465** avec SSL/TLS

### Les emails sont-ils loggés ?

✅ **Oui**. Tous les envois sont loggés dans :
- Table `mail.mail` (Odoo)
- Logs Odoo : `docker logs quelyos-odoo | grep -i "mail"`

**Audit logs super admin** : Toutes opérations SMTP sont auditées.

---

## 🔧 Troubleshooting

### Problème : "Erreur serveur" lors de la sauvegarde

**Causes possibles** :
- Champs requis manquants (nom, host, port)
- Format port invalide (doit être un nombre)

**Solutions** :
1. Vérifier que tous les champs obligatoires sont remplis
2. Vérifier que le port est un nombre (ex: 587)

### Problème : Test email échoue

**Erreur** : `Authentication failed`

**Causes** :
- ❌ Username/Password incorrects
- ❌ App Password Gmail non généré
- ❌ Brevo SMTP Key expirée

**Solutions** :
1. Vérifier credentials dans le dashboard du provider
2. Gmail : Régénérer App Password
3. Brevo : Vérifier SMTP Key dans Settings > SMTP & API

**Erreur** : `Connection timeout`

**Causes** :
- ❌ Host SMTP incorrect
- ❌ Port bloqué par firewall
- ❌ Serveur SMTP inaccessible

**Solutions** :
1. Vérifier host : `smtp-relay.brevo.com` (pas `mail.brevo.com`)
2. Tester connectivité : `telnet smtp-relay.brevo.com 587`
3. Vérifier firewall sortant (port 587 ouvert)

### Problème : Email reçu mais en spam

**Causes** :
- Domaine expéditeur non vérifié
- Pas de SPF/DKIM

**Solutions** :
1. Utiliser **Brevo** (domaine vérifié automatiquement)
2. Configurer SPF/DKIM pour votre domaine :
   ```
   SPF: v=spf1 include:spf.brevo.com ~all
   DKIM: Disponible dans Settings Brevo
   ```

### Problème : Serveur supprimé par erreur

**Solution** :
- Recréer le serveur avec les mêmes paramètres
- Utiliser les credentials sauvegardés dans votre gestionnaire de mots de passe

⚠️ **Recommandation** : Toujours garder une copie des credentials SMTP en lieu sûr.

---

## 🛡️ Bonnes Pratiques

### Sécurité

1. ✅ **Utiliser App Passwords** (Gmail) - Jamais le mot de passe principal
2. ✅ **Révoquer clés inutilisées** (Brevo, SendGrid)
3. ✅ **Limiter accès** : Seuls super admins peuvent configurer
4. ✅ **Audit logs** : Vérifier régulièrement les opérations SMTP

### Performance

1. ✅ **Utiliser Brevo en production** (infrastruc