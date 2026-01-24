# Politique de Confidentialité
## Quelyos ERP - Protection des Données Personnelles (RGPD)

**Dernière mise à jour : [Date]**

---

## 1. Introduction

Quelyos accorde une grande importance à la protection de vos données personnelles et à votre vie privée.

La présente Politique de Confidentialité vous informe sur la manière dont nous collectons, utilisons, stockons et protégeons vos données personnelles conformément au **Règlement Général sur la Protection des Données (RGPD - UE 2016/679)** et à la **Loi Informatique et Libertés** modifiée.

---

## 2. Responsable du Traitement des Données

**Identité** : [Quelyos SAS]
**Adresse** : [À compléter]
**Email** : privacy@quelyos.com
**Téléphone** : [À compléter]

**Délégué à la Protection des Données (DPO)** :
- Nom : [Nom du DPO ou "Non applicable - société < 250 employés"]
- Email : dpo@quelyos.com

---

## 3. Données Personnelles Collectées

### 3.1 Données collectées lors de la création de compte

Lors de votre inscription sur Quelyos ERP, nous collectons :

| Donnée | Obligatoire | Finalité |
|--------|-------------|----------|
| Nom complet | Oui | Identification, facturation |
| Adresse email | Oui | Authentification, communication |
| Mot de passe | Oui | Sécurité du compte (stocké hashé) |
| Numéro de téléphone | Non | Support, authentification 2FA |
| Nom de la société | Non | Facturation B2B |
| Adresse postale | Non | Facturation, livraison |

### 3.2 Données de navigation et cookies

Lorsque vous utilisez notre site ou notre application, nous collectons automatiquement :

| Donnée | Type | Finalité |
|--------|------|----------|
| Adresse IP | Technique | Sécurité, géolocalisation |
| Navigateur et version | Technique | Compatibilité, support |
| Système d'exploitation | Technique | Support technique |
| Pages visitées | Analytique | Amélioration UX |
| Durée de session | Analytique | Statistiques usage |
| Appareil (desktop/mobile) | Technique | Responsive design |

Pour plus de détails : [Politique Cookies](./COOKIES.md)

### 3.3 Données liées à votre activité e-commerce

Si vous utilisez Quelyos pour gérer une boutique en ligne :

**Produits** :
- Nom, description, prix, images
- Catégories, stock, références SKU
- *(Propriété exclusive du client)*

**Commandes** :
- Numéro de commande, montant, date
- Produits achetés, quantités
- Statut de livraison

**Clients** (de votre boutique) :
- Nom, email, téléphone, adresse
- Historique d'achats
- *(Vous êtes responsable de traitement pour ces données)*

### 3.4 Données de paiement

Les données bancaires sont traitées exclusivement par notre prestataire de paiement **Stripe** (certifié PCI-DSS).

Nous ne stockons **jamais** de numéros de carte bancaire complets. Seuls sont conservés :
- Les 4 derniers chiffres de la carte (affichage)
- La date d'expiration
- Le type de carte (Visa, Mastercard, etc.)

### 3.5 Données de support

Lorsque vous contactez notre support :
- Contenu des messages
- Fichiers joints (captures d'écran, logs)
- Historique des échanges

---

## 4. Finalités et Bases Légales du Traitement

Conformément au RGPD, nous traitons vos données uniquement sur des bases légales :

| Finalité | Base légale | Données concernées | Durée |
|----------|-------------|-------------------|-------|
| **Gestion du compte utilisateur** | Exécution du contrat (art. 6.1.b RGPD) | Nom, email, mot de passe | Durée du contrat + 3 ans |
| **Facturation et comptabilité** | Obligation légale (art. 6.1.c RGPD) | Nom, adresse, société, montants | 10 ans (Code de commerce) |
| **Support client** | Intérêt légitime (art. 6.1.f RGPD) | Email, messages, logs techniques | 3 ans |
| **Amélioration du service (analytics)** | Consentement (art. 6.1.a RGPD) | IP, pages visitées, durée | 13 mois max |
| **Marketing et newsletters** | Consentement (art. 6.1.a RGPD) | Email | Jusqu'à désabonnement |
| **Sécurité et prévention fraude** | Intérêt légitime (art. 6.1.f RGPD) | IP, logs, activité suspecte | 6 mois |
| **Conformité RGPD** | Obligation légale (art. 6.1.c RGPD) | Registre des consentements | 3 ans |

---

## 5. Destinataires des Données

Vos données personnelles sont accessibles uniquement aux personnes suivantes :

### 5.1 Personnel autorisé de Quelyos

- Équipe technique (développement, infrastructure)
- Service client et support
- Service comptabilité et facturation
- *(Tous soumis à une clause de confidentialité)*

### 5.2 Sous-traitants et prestataires externes

Nous faisons appel à des sous-traitants conformes au RGPD :

| Sous-traitant | Service | Localisation données | Certification |
|---------------|---------|----------------------|---------------|
| **AWS / OVH** | Hébergement serveurs | France / UE | ISO 27001, RGPD |
| **Stripe** | Paiement en ligne | UE / USA (clauses contractuelles) | PCI-DSS niveau 1 |
| **Mailchimp** | Envoi emails (newsletters) | UE / USA (clauses contractuelles) | RGPD compliant |
| **Google Analytics** | Statistiques anonymes | USA (IP anonymisée) | Privacy Shield |
| **Sentry** | Monitoring erreurs | UE | ISO 27001 |
| **Intercom** | Chat support (optionnel) | UE / USA (clauses contractuelles) | RGPD compliant |

### 5.3 Transferts hors UE

Certains de nos sous-traitants peuvent stocker ou traiter des données hors de l'Union Européenne (États-Unis principalement).

Dans ce cas, nous garantissons un niveau de protection équivalent au RGPD via :
- **Clauses contractuelles types** de la Commission Européenne (CCT)
- **Certification Privacy Shield** (si applicable)
- **Hébergement en UE** (données sensibles uniquement)

### 5.4 Autorités et juridictions

Nous pouvons être amenés à communiquer vos données aux autorités compétentes :
- En cas de réquisition judiciaire
- Pour lutter contre la fraude
- Pour protéger nos droits légaux

---

## 6. Durée de Conservation des Données

Nous conservons vos données uniquement aussi longtemps que nécessaire :

| Type de donnée | Durée de conservation | Base légale |
|----------------|------------------------|-------------|
| **Compte actif** | Durée du contrat | Exécution contrat |
| **Compte inactif (non connecté)** | 3 ans | Prescription commerciale |
| **Compte supprimé** | 30 jours (backup) puis suppression définitive | Réversibilité |
| **Données comptables (factures)** | 10 ans | Obligation légale (Code commerce) |
| **Logs de sécurité** | 6 mois | Intérêt légitime |
| **Cookies analytics** | 13 mois maximum | Recommandation CNIL |
| **Consentements** | 3 ans | Preuve conformité RGPD |
| **Support (tickets)** | 3 ans après résolution | Amélioration service |
| **Newsletters (désinscrit)** | Suppression immédiate + blacklist email | Éviter renvoi |

À l'expiration, les données sont soit **supprimées définitivement**, soit **anonymisées** (statistiques agrégées sans lien avec une personne).

---

## 7. Sécurité des Données

Nous mettons en œuvre des mesures techniques et organisationnelles robustes pour protéger vos données :

### 7.1 Mesures techniques

✅ **Chiffrement** :
- HTTPS (TLS 1.3) pour toutes les communications
- Chiffrement AES-256 des sauvegardes
- Hachage bcrypt des mots de passe (jamais stockés en clair)

✅ **Infrastructure** :
- Pare-feu applicatif (WAF)
- Protection anti-DDoS
- Surveillance 24/7 des intrusions (IDS/IPS)
- Sauvegardes quotidiennes automatiques (rétention 30 jours)

✅ **Authentification** :
- Mots de passe robustes (min 8 caractères, complexité)
- Authentification à deux facteurs (2FA) disponible
- Sessions sécurisées (expiration automatique)

✅ **Accès** :
- Principe du moindre privilège (accès strictement nécessaire)
- Logs d'audit complets (qui a accédé à quoi, quand)

### 7.2 Mesures organisationnelles

✅ **Politique de sécurité interne** :
- Charte de confidentialité signée par tous les employés
- Formation annuelle RGPD de l'équipe
- Procédures de gestion des incidents

✅ **Analyses de risques** :
- Analyse d'impact (PIA) pour les traitements à risque
- Audits de sécurité annuels (pentest externe)

✅ **Continuité d'activité** :
- Plan de reprise d'activité (PRA)
- Sauvegardes géographiquement réparties

### 7.3 Notification des violations de données

En cas de violation de données personnelles susceptible d'engendrer un risque pour vos droits :
- Notification à la **CNIL sous 72h**
- Notification aux personnes concernées **dans les meilleurs délais**

Contact en cas d'incident : security@quelyos.com

---

## 8. Vos Droits RGPD

Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :

### 8.1 Droit d'accès (art. 15 RGPD)

Vous pouvez obtenir :
- Confirmation que vos données sont traitées
- Copie de vos données personnelles
- Informations sur les finalités, destinataires, durées de conservation

**Comment l'exercer** : Via votre espace compte (Paramètres > Mes données) ou email à privacy@quelyos.com

### 8.2 Droit de rectification (art. 16 RGPD)

Vous pouvez corriger vos données inexactes ou incomplètes.

**Comment l'exercer** : Via votre espace compte (Profil > Modifier) ou email à privacy@quelyos.com

### 8.3 Droit à l'effacement / Droit à l'oubli (art. 17 RGPD)

Vous pouvez demander la suppression de vos données dans les cas suivants :
- Données plus nécessaires au regard des finalités
- Retrait de votre consentement
- Opposition au traitement
- Données traitées illicitement

**Exceptions** : Conservation obligatoire pour factures (10 ans) et conformité légale.

**Comment l'exercer** : Via votre espace compte (Paramètres > Supprimer mon compte) ou email à privacy@quelyos.com

### 8.4 Droit à la portabilité (art. 20 RGPD)

Vous pouvez récupérer vos données dans un format structuré, lisible par machine (JSON, CSV).

**Comment l'exercer** : Via votre espace compte (Paramètres > Exporter mes données) ou email à privacy@quelyos.com

**Données exportables** :
- Profil utilisateur
- Historique des commandes
- Liste des produits
- Clients et adresses

### 8.5 Droit d'opposition (art. 21 RGPD)

Vous pouvez vous opposer à tout moment :
- Au traitement à des fins de marketing direct (newsletters)
- Au traitement fondé sur l'intérêt légitime

**Comment l'exercer** :
- Newsletters : Lien de désinscription en bas de chaque email
- Autres traitements : Email à privacy@quelyos.com

### 8.6 Droit à la limitation du traitement (art. 18 RGPD)

Vous pouvez demander le "gel" temporaire de vos données pendant :
- Vérification de l'exactitude des données
- Examen de votre demande d'opposition

**Comment l'exercer** : Email à privacy@quelyos.com

### 8.7 Droit de ne pas faire l'objet d'une décision automatisée (art. 22 RGPD)

Nous n'utilisons **aucun profilage automatisé ni décision automatisée** ayant des effets juridiques ou significatifs sur vous.

### 8.8 Droit de définir des directives post-mortem (art. 85 Loi Informatique et Libertés)

Vous pouvez définir des directives concernant le sort de vos données après votre décès.

**Comment l'exercer** : Email à privacy@quelyos.com avec objet "Directives post-mortem"

---

## 9. Exercice de vos Droits

### 9.1 Comment exercer vos droits

**Par email** : privacy@quelyos.com
**Par courrier** : [Adresse Quelyos]
**Via l'application** : Paramètres > Mes données et vie privée

### 9.2 Délai de réponse

Nous nous engageons à répondre à votre demande dans un délai de **1 mois** (prorogeable de 2 mois si complexité).

### 9.3 Justificatif d'identité

Pour des raisons de sécurité, nous pouvons vous demander une copie de votre pièce d'identité pour vérifier votre identité avant traitement de la demande.

### 9.4 Gratuité

L'exercice de vos droits est **gratuit**. En cas de demandes manifestement infondées ou excessives, nous pourrons facturer des frais raisonnables.

---

## 10. Cookies et Technologies Similaires

Notre site utilise des cookies pour améliorer votre expérience.

Pour plus de détails : **[Politique Cookies](./COOKIES.md)**

En résumé :
- **Cookies essentiels** : Nécessaires au fonctionnement (session, panier) - Pas de consentement requis
- **Cookies analytics** : Google Analytics (anonymisé) - Consentement requis
- **Cookies marketing** : Facebook Pixel, publicités ciblées - Consentement requis

Vous pouvez gérer vos préférences de cookies via la bannière de consentement ou dans Paramètres > Cookies.

---

## 11. Mineurs

Quelyos ERP est un service professionnel destiné aux entreprises et entrepreneurs.

Nous ne collectons **pas sciemment** de données personnelles de personnes de moins de 16 ans.

Si vous avez connaissance qu'un mineur a fourni des données, contactez-nous : privacy@quelyos.com

---

## 12. Modifications de la Politique de Confidentialité

Nous pouvons être amenés à modifier cette Politique de Confidentialité.

En cas de modification substantielle, vous serez informé par :
- Email de notification
- Bannière dans l'application

La nouvelle version entre en vigueur **30 jours** après notification.

Nous vous encourageons à consulter régulièrement cette page.

**Dernière modification** : [Date]

---

## 13. Réclamation auprès de la CNIL

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'autorité de contrôle compétente :

**Commission Nationale de l'Informatique et des Libertés (CNIL)**
**Adresse** : 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
**Téléphone** : 01 53 73 22 22
**Site web** : https://www.cnil.fr
**Formulaire en ligne** : https://www.cnil.fr/fr/plaintes

---

## 14. Questions et Contact

Pour toute question concernant la protection de vos données personnelles :

**Email** : privacy@quelyos.com
**Délégué à la Protection des Données (DPO)** : dpo@quelyos.com
**Adresse postale** : [À compléter]

Nous nous engageons à vous répondre dans les **5 jours ouvrés**.

---

## 15. Registre des Activités de Traitement

Conformément à l'article 30 du RGPD, nous tenons un registre des activités de traitement.

Ce registre est disponible sur demande auprès de : dpo@quelyos.com

Voir également : [Registre des Traitements RGPD](./REGISTRE_TRAITEMENTS_RGPD.md)

---

**Date d'entrée en vigueur : [Date]**
**Dernière modification : [Date]**
**Version : 1.0**
