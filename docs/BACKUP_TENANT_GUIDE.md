# 📦 Guide Utilisateur - Backups Automatiques par Tenant

**Version** : 1.0
**Date** : Janvier 2026
**Public** : Super Administrateurs Quelyos

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Accès à la fonctionnalité](#accès-à-la-fonctionnalité)
3. [Créer une planification](#créer-une-planification)
4. [Gérer les planifications](#gérer-les-planifications)
5. [Backup manuel](#backup-manuel)
6. [Restauration](#restauration)
7. [FAQ](#faq)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le système de **Backups Automatiques par Tenant** permet de :

✅ **Sauvegarder** automatiquement les données d'un tenant spécifique
✅ **Planifier** des backups quotidiens, hebdomadaires ou mensuels
✅ **Restaurer** les données d'un tenant sans affecter les autres
✅ **Gérer** la rétention automatique des anciens backups
✅ **Recevoir** des notifications email (succès/échec)

### Isolation Multi-Tenant

**Important** : Les backups sont **strictement isolés par tenant**. La restauration d'un tenant n'affecte **jamais** les données des autres tenants.

---

## 🔐 Accès à la Fonctionnalité

### Prérequis

- **Rôle** : Super Administrateur
- **Authentification** : Compte admin Odoo
- **URL** : `http://localhost:5176` (ou votre domaine)

### Navigation

1. **Connexion** : Se connecter avec le compte admin
2. **Menu** : Cliquer sur **"Backups"** dans le menu latéral gauche
3. **Planifications** : Cliquer sur **"Planifications Auto"** en haut à droite

---

## ➕ Créer une Planification

### Étape par Étape

#### 1. Accéder à la Page

`Menu > Backups > Planifications Auto`

#### 2. Créer une Nouvelle Planification

Cliquer sur **"+ Nouvelle Planification"**

#### 3. Remplir le Formulaire

**Champs obligatoires** :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Tenant** | Sélectionner le tenant à sauvegarder | "Boutique Sport" |
| **Fréquence** | Quotidien / Hebdomadaire / Mensuel | "Quotidien" |
| **Heure** | Heure d'exécution (00-23) | "02" (2h du matin) |
| **Minute** | Minutes (00-59) | "00" |
| **Rétention** | Nombre de backups à conserver | "7" (7 jours) |

**Champs optionnels** :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Email** | Email de notification | "admin@votredomaine.com" |
| **Jour de la semaine** | Si hebdomadaire (Lun-Dim) | "Dimanche" |
| **Jour du mois** | Si mensuel (1-28) | "1" (1er du mois) |

#### 4. Valider

Cliquer sur **"Créer"**

### Exemples de Configuration

#### Backup Quotidien

```yaml
Tenant: Boutique Sport
Fréquence: Quotidien
Heure: 02:00
Rétention: 7 backups (1 semaine)
Email: sport@quelyos.com
```

**Résultat** : Backup chaque jour à 2h du matin, conservation de 7 jours

#### Backup Hebdomadaire

```yaml
Tenant: Marque Mode
Fréquence: Hebdomadaire
Jour: Dimanche
Heure: 03:00
Rétention: 4 backups (4 semaines)
Email: mode@quelyos.com
```

**Résultat** : Backup chaque dimanche à 3h, conservation de 4 semaines

#### Backup Mensuel

```yaml
Tenant: Admin Quelyos
Fréquence: Mensuel
Jour du mois: 1
Heure: 04:00
Rétention: 12 backups (1 an)
Email: admin@quelyos.com
```

**Résultat** : Backup le 1er de chaque mois à 4h, conservation de 12 mois

---

## ⚙️ Gérer les Planifications

### Vue d'Ensemble

La page **Planifications Auto** affiche un tableau avec :

| Colonne | Description |
|---------|-------------|
| **Statut** | Activé / Désactivé (toggle) |
| **Tenant** | Nom du tenant |
| **Fréquence** | daily / weekly / monthly |
| **Heure** | HH:MM d'exécution |
| **Rétention** | Nombre de backups conservés |
| **Prochain Run** | Date/heure du prochain backup |
| **Dernier Statut** | Succès (vert) / Échec (rouge) |
| **Actions** | ▶ Exécuter / ✏️ Éditer / 🗑️ Supprimer |

### Actions Disponibles

#### ▶️ Exécuter Maintenant

**Usage** : Forcer l'exécution immédiate d'un backup (sans attendre le cron)

1. Cliquer sur **"▶ Exécuter Maintenant"**
2. Le backup démarre immédiatement
3. Le statut passe à "En cours..."
4. Notification reçue par email (si configuré)

#### 🔄 Activer / Désactiver

**Usage** : Mettre en pause une planification sans la supprimer

- **Toggle Activé (vert)** : Le backup s'exécutera automatiquement
- **Toggle Désactivé (gris)** : Le backup est suspendu

#### ✏️ Éditer

**Usage** : Modifier une planification existante

1. Cliquer sur l'icône **Éditer**
2. Modifier les champs souhaités
3. Sauvegarder

#### 🗑️ Supprimer

**Usage** : Supprimer définitivement une planification

1. Cliquer sur **Supprimer**
2. Confirmer l'action
3. ⚠️ **Attention** : Les backups déjà créés ne sont pas supprimés

---

## 💾 Backup Manuel

### Créer un Backup Immédiat

Si vous avez besoin d'un backup en dehors des planifications :

1. **Aller à** : `Menu > Backups`
2. **Filtrer** : Sélectionner le tenant dans le dropdown
3. **Cliquer** : Bouton **"Backup Tenant"**
4. **Attendre** : Le statut passe de "En attente" → "Terminé" (~2-5 secondes)

### Télécharger un Backup

1. Dans la liste des backups
2. Cliquer sur **"Télécharger"** (icône ⬇️)
3. Un fichier ZIP est téléchargé : `backup_[tenant]_[date].zip`

### Contenu du ZIP

```
backup_sport_20260130_164220.zip
├── metadata.json         # Informations tenant, date, version
├── data.json            # Données exportées (17 modèles)
└── filestore/           # Images et fichiers attachés
    ├── product_images/
    └── attachments/
```

---

## 🔄 Restauration

### ⚠️ Avertissement

La restauration **remplace** les données actuelles du tenant par celles du backup.

**Recommandation** : Toujours créer un backup manuel avant de restaurer.

### Procédure

1. **Aller à** : `Menu > Backups`
2. **Localiser** : Le backup à restaurer dans la liste
3. **Cliquer** : Bouton **"Restaurer"** (icône 🔄)
4. **Confirmer** : Lire l'avertissement et confirmer
5. **Attendre** : La restauration s'exécute (~5-10 secondes)
6. **Vérifier** : Les données du tenant sont restaurées

### Mode UPSERT

La restauration utilise le **mode UPSERT** :

- ✅ Si un enregistrement existe → **Mise à jour**
- ✅ Si un enregistrement n'existe pas → **Création**
- ✅ Les enregistrements non présents dans le backup → **Conservés**

### Isolation

**Garantie** : La restauration d'un tenant **n'affecte jamais** les autres tenants.

---

## ❓ FAQ

### Quelle est la fréquence du cron ?

Le cron s'exécute **toutes les 15 minutes** et vérifie si des planifications doivent être exécutées.

### Combien de temps prend un backup ?

- **Petit tenant** (< 100 records) : ~2 secondes
- **Moyen tenant** (100-500 records) : ~5 secondes
- **Gros tenant** (> 1000 records) : ~10-30 secondes

### Quelle taille font les backups ?

- **Compression** : ZIP avec ~80% de compression
- **Exemple** : 142 records = 0.01 MB (~10 KB)
- **Estimation** : ~100 KB par 1000 records

### Le backup bloque-t-il Odoo ?

**Non**. Les backups s'exécutent en **thread d'arrière-plan** et ne bloquent pas l'application.

### Combien de tenants puis-je sauvegarder ?

**Illimité**. Vous pouvez créer une planification pour chaque tenant.

### Les backups sont-ils chiffrés ?

**Non actuellement**. Les backups sont stockés en clair sur le serveur.
**Recommandation** : Utiliser un système de fichiers chiffré (LUKS, dm-crypt).

### Puis-je restaurer sur un autre tenant ?

**Non recommandé**. Les données contiennent des références au `company_id` original.
Pour migrer un tenant, il faut une procédure spécifique.

### Que se passe-t-il si la rétention est dépassée ?

Les **anciens backups sont automatiquement supprimés** lorsqu'un nouveau backup est créé.

---

## 🔧 Troubleshooting

### Problème : Backup reste en "En attente"

**Causes possibles** :
- Thread d'arrière-plan bloqué
- Erreur dans le code de backup

**Solutions** :
1. Vérifier les logs Odoo : `docker logs quelyos-odoo --tail 100`
2. Rechercher : `grep -i "backup\|error" logs`
3. Redémarrer Odoo : `docker-compose restart odoo`

### Problème : Email non reçu

**Causes possibles** :
- Serveur SMTP non configuré
- Email de notification manquant
- Email en spam

**Solutions** :
1. Vérifier config SMTP : `SELECT * FROM ir_mail_server;`
2. Vérifier queue : `SELECT * FROM mail_mail WHERE state = 'exception';`
3. Tester manuellement : Envoyer un email test depuis Odoo

### Problème : Restauration échoue

**Causes possibles** :
- Backup corrompu
- Contraintes d'intégrité

**Solutions** :
1. Vérifier le fichier ZIP : `unzip -t backup_file.zip`
2. Vérifier les logs : Rechercher "restore" et "error"
3. Réessayer avec un backup plus récent

### Problème : Cron ne s'exécute pas

**Vérification** :
```sql
SELECT cron_name, active, nextcall
FROM ir_cron
WHERE cron_name LIKE '%Backup%';
```

**Solutions** :
1. Vérifier que `active = true`
2. Vérifier que `nextcall` est dans le futur
3. Redémarrer Odoo

---

## 📊 Bonnes Pratiques

### Rétention Recommandée

| Type de Tenant | Rétention | Raison |
|----------------|-----------|--------|
| Production | 30 jours | Conformité RGPD |
| Développement | 7 jours | Économie d'espace |
| Staging | 14 jours | Tests de régression |

### Heures d'Exécution

**Recommandation** : Planifier les backups pendant les heures creuses (2h-5h du matin).

### Notifications

**Recommandation** : Toujours configurer un email pour être alerté des échecs.

### Tests Réguliers

**Recommandation** : Tester une restauration **une fois par mois** pour valider l'intégrité.

---

## 📞 Support

**Questions ?** Contacter l'équipe Quelyos :
- Email : support@quelyos.com
- Documentation : https://docs.quelyos.com
- GitHub : https://github.com/quelyos/quelyos-suite

---

**Dernière mise à jour** : Janvier 2026
**Version** : 1.0
