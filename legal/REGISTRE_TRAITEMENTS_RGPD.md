# Registre des Activités de Traitement RGPD
## Quelyos ERP

**Conformément à l'article 30 du RGPD**

**Responsable du traitement** : Quelyos [SAS]
**Délégué à la Protection des Données (DPO)** : [Nom] ou "Non applicable"
**Dernière mise à jour** : [Date]

---

## Introduction

Ce registre recense l'ensemble des traitements de données personnelles effectués par Quelyos ERP.

Conformément à l'article 30 du Règlement Général sur la Protection des Données (RGPD), ce document est obligatoire et doit être tenu à disposition de la CNIL sur demande.

---

## Traitement n°1 : Gestion des Comptes Utilisateurs

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Création, gestion et sécurisation des comptes utilisateurs de la plateforme Quelyos ERP |
| **Base légale** | Exécution du contrat (art. 6.1.b RGPD) |
| **Catégories de personnes concernées** | Utilisateurs de la plateforme (administrateurs, gestionnaires, employés) |
| **Catégories de données** | - Données d'identification : nom, prénom<br>- Coordonnées : email, téléphone (optionnel)<br>- Données de connexion : mot de passe (hashé), date dernière connexion<br>- Données techniques : adresse IP, logs de connexion |
| **Catégories de destinataires** | - Personnel autorisé Quelyos (équipe technique, support)<br>- Hébergeur (AWS / OVH) |
| **Transferts hors UE** | Non (hébergement France/UE uniquement) |
| **Durée de conservation** | - Compte actif : Durée du contrat<br>- Compte inactif : 3 ans après dernière connexion<br>- Logs de connexion : 6 mois |
| **Mesures de sécurité** | - Mots de passe hashés (bcrypt)<br>- Chiffrement HTTPS (TLS 1.3)<br>- Authentification 2FA disponible<br>- Logs d'audit sécurisés |

---

## Traitement n°2 : Facturation et Comptabilité

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Facturation des services, comptabilité, conformité fiscale |
| **Base légale** | Obligation légale (art. 6.1.c RGPD) - Code de commerce |
| **Catégories de personnes concernées** | Clients (personnes physiques ou représentants de personnes morales) |
| **Catégories de données** | - Identité : nom, prénom, raison sociale<br>- Coordonnées : adresse postale, email, téléphone<br>- Données fiscales : numéro SIRET, TVA intracommunautaire<br>- Données bancaires : 4 derniers chiffres CB, IBAN (si virement)<br>- Données transactionnelles : montants, dates, statut paiement |
| **Catégories de destinataires** | - Service comptabilité Quelyos<br>- Expert-comptable<br>- Stripe (prestataire de paiement, certifié PCI-DSS)<br>- Administration fiscale (sur réquisition) |
| **Transferts hors UE** | Oui - Stripe (USA) avec clauses contractuelles types (CCT) |
| **Durée de conservation** | **10 ans** (obligation légale - art. L.123-22 Code de commerce) |
| **Mesures de sécurité** | - Chiffrement des factures archivées (AES-256)<br>- Accès restreint (principe du moindre privilège)<br>- Pas de stockage des numéros CB complets (Stripe uniquement) |

---

## Traitement n°3 : Support Client

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Assistance technique et résolution des demandes clients |
| **Base légale** | Intérêt légitime (art. 6.1.f RGPD) - Qualité du service |
| **Catégories de personnes concernées** | Utilisateurs ayant contacté le support |
| **Catégories de données** | - Identité : nom, prénom<br>- Coordonnées : email, téléphone<br>- Contenu : messages, fichiers joints (captures d'écran, logs)<br>- Données techniques : informations compte, historique bugs |
| **Catégories de destinataires** | - Équipe support Quelyos<br>- Équipe technique (si nécessaire)<br>- Intercom (plateforme de chat support) - optionnel |
| **Transferts hors UE** | Oui - Intercom (USA) avec clauses contractuelles types |
| **Durée de conservation** | 3 ans après résolution du ticket |
| **Mesures de sécurité** | - Accès restreint au personnel support<br>- Chiffrement des communications<br>- Suppression automatique après 3 ans |

---

## Traitement n°4 : Analytics et Amélioration du Service

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Analyse de l'utilisation de la plateforme, amélioration de l'expérience utilisateur, détection de bugs |
| **Base légale** | Consentement (art. 6.1.a RGPD) - Bannière cookies |
| **Catégories de personnes concernées** | Visiteurs et utilisateurs du site/application ayant consenti |
| **Catégories de données** | - Données techniques : adresse IP (anonymisée), user-agent, résolution écran<br>- Données de navigation : pages visitées, durée, parcours<br>- Données d'interaction : clics, scrolls, erreurs rencontrées |
| **Catégories de destinataires** | - Équipe produit Quelyos<br>- Google Analytics (sous-traitant)<br>- Sentry (monitoring erreurs) |
| **Transferts hors UE** | Oui - Google Analytics (USA) avec IP anonymisée + Privacy Shield |
| **Durée de conservation** | **13 mois maximum** (recommandation CNIL) |
| **Mesures de sécurité** | - Anonymisation de l'IP (Google Analytics)<br>- Données agrégées uniquement (pas de profilage individuel)<br>- Opt-out possible via bannière cookies |

---

## Traitement n°5 : Marketing et Newsletters

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Envoi de newsletters, actualités produit, offres commerciales |
| **Base légale** | Consentement (art. 6.1.a RGPD) - Case à cocher opt-in |
| **Catégories de personnes concernées** | Personnes ayant souscrit à la newsletter |
| **Catégories de données** | - Identité : nom, prénom<br>- Coordonnées : email<br>- Données comportementales : emails ouverts, liens cliqués |
| **Catégories de destinataires** | - Service marketing Quelyos<br>- Mailchimp (plateforme d'envoi d'emails) |
| **Transferts hors UE** | Oui - Mailchimp (USA) avec clauses contractuelles types |
| **Durée de conservation** | Jusqu'à désinscription + 3 ans (liste d'opposition) |
| **Mesures de sécurité** | - Lien de désinscription dans chaque email<br>- Double opt-in (confirmation par email)<br>- Suppression automatique des désabonnés (sauf blacklist) |

---

## Traitement n°6 : Sécurité et Prévention de la Fraude

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Détection et prévention des activités frauduleuses, protection du service contre les abus |
| **Base légale** | Intérêt légitime (art. 6.1.f RGPD) - Sécurité du service |
| **Catégories de personnes concernées** | Tous les utilisateurs du service |
| **Catégories de données** | - Données techniques : adresse IP, user-agent, empreinte navigateur<br>- Données comportementales : tentatives de connexion, actions suspectes<br>- Logs de sécurité : horodatage, événements, alertes |
| **Catégories de destinataires** | - Équipe sécurité Quelyos<br>- Hébergeur (AWS / OVH)<br>- Sentry (monitoring) |
| **Transferts hors UE** | Non (hébergement France/UE) |
| **Durée de conservation** | **6 mois** (recommandation CNIL pour logs de sécurité) |
| **Mesures de sécurité** | - Chiffrement des logs<br>- Accès restreint équipe sécurité<br>- Surveillance automatisée (IDS/IPS)<br>- Suppression automatique après 6 mois |

---

## Traitement n°7 : Gestion des Données E-commerce (Client Final)

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | **Client utilisant Quelyos ERP** (le marchand)<br>Quelyos agit en tant que **sous-traitant** (art. 28 RGPD) |
| **Finalité du traitement** | Gestion des commandes, clients, stocks de la boutique e-commerce du client |
| **Base légale** | Variable selon l'usage du client (généralement : exécution contrat) |
| **Catégories de personnes concernées** | Clients finaux de la boutique e-commerce (acheteurs) |
| **Catégories de données** | - Identité : nom, prénom des acheteurs<br>- Coordonnées : email, téléphone, adresse livraison<br>- Données transactionnelles : commandes, montants, historique achats |
| **Catégories de destinataires** | - Client Quelyos (le marchand) - responsable de traitement<br>- Quelyos (sous-traitant technique)<br>- Stripe (paiement) |
| **Transferts hors UE** | Selon configuration du client |
| **Durée de conservation** | Définie par le client (responsable de traitement) |
| **Mesures de sécurité** | - Chiffrement des données en base<br>- Sauvegardes quotidiennes<br>- Isolation des données par client (multi-tenant)<br>- Contrat de sous-traitance RGPD (art. 28) |

**Note importante** : Pour ce traitement, **le client est responsable de traitement**. Quelyos fournit uniquement l'infrastructure technique (sous-traitant). Le client doit avoir sa propre politique de confidentialité et gérer les droits RGPD de ses clients finaux.

---

## Traitement n°8 : Recrutement (si applicable)

| Élément | Description |
|---------|-------------|
| **Responsable de traitement** | Quelyos [SAS] - [Adresse] |
| **Finalité du traitement** | Gestion des candidatures et processus de recrutement |
| **Base légale** | Consentement (art. 6.1.a RGPD) - Candidature volontaire |
| **Catégories de personnes concernées** | Candidats à un poste chez Quelyos |
| **Catégories de données** | - CV et lettre de motivation<br>- Coordonnées : email, téléphone<br>- Notes d'entretien<br>- Diplômes et certifications |
| **Catégories de destinataires** | - Service RH Quelyos<br>- Managers concernés par le poste |
| **Transferts hors UE** | Non |
| **Durée de conservation** | - Candidat retenu : Dossier personnel (durée contrat + 5 ans)<br>- Candidat non retenu : 2 ans (possibilité futures opportunités) |
| **Mesures de sécurité** | - Accès restreint service RH<br>- Suppression automatique après 2 ans<br>- Possibilité de retirer candidature à tout moment |

---

## Sous-Traitants RGPD

Conformément à l'article 28 du RGPD, nous faisons appel aux sous-traitants suivants :

| Sous-traitant | Service | Localisation | Garanties RGPD |
|---------------|---------|--------------|----------------|
| **AWS / OVH** | Hébergement infrastructure | France / UE | ISO 27001, SOC 2, Certification RGPD |
| **Stripe** | Traitement paiements | UE / USA | PCI-DSS niveau 1, Clauses contractuelles types (CCT) |
| **Mailchimp (Intuit)** | Envoi newsletters | UE / USA | RGPD compliant, CCT |
| **Google Analytics** | Analytics web | USA | Privacy Shield, IP anonymisée |
| **Intercom** | Chat support | UE / USA | RGPD compliant, CCT |
| **Sentry** | Monitoring erreurs | UE | ISO 27001, RGPD compliant |

Tous les sous-traitants ont signé un **contrat de sous-traitance RGPD** (article 28) garantissant :
- Mesures de sécurité appropriées
- Confidentialité des données
- Assistance pour exercice des droits des personnes
- Notification des violations de données

---

## Mesures de Sécurité Générales

Quelyos met en œuvre les mesures techniques et organisationnelles suivantes :

### Mesures Techniques
- ✅ Chiffrement HTTPS (TLS 1.3) pour toutes les communications
- ✅ Chiffrement AES-256 des sauvegardes
- ✅ Hachage bcrypt des mots de passe (jamais stockés en clair)
- ✅ Pare-feu applicatif (WAF) et protection anti-DDoS
- ✅ Sauvegardes quotidiennes (rétention 30 jours)
- ✅ Surveillance 24/7 des intrusions (IDS/IPS)
- ✅ Logs d'audit complets (qui, quoi, quand)

### Mesures Organisationnelles
- ✅ Politique de confidentialité interne signée par tous les employés
- ✅ Formation annuelle RGPD de l'équipe
- ✅ Principe du moindre privilège (accès strictement nécessaire)
- ✅ Procédure de gestion des incidents de sécurité
- ✅ Analyse d'impact (PIA) pour les traitements à risque
- ✅ Audits de sécurité annuels (pentest externe)

---

## Exercice des Droits RGPD

Les personnes concernées peuvent exercer leurs droits via :
- **Email** : privacy@quelyos.com
- **Interface** : Paramètres > Mes données et vie privée
- **Courrier** : [Adresse Quelyos]

**Délai de réponse** : 1 mois (prorogeable de 2 mois si complexité)

**Droits disponibles** :
- Droit d'accès (copie des données)
- Droit de rectification
- Droit à l'effacement (droit à l'oubli)
- Droit à la portabilité (export JSON/CSV)
- Droit d'opposition
- Droit à la limitation du traitement

---

## Violations de Données

En cas de violation de données personnelles (data breach) :

**Procédure** :
1. Détection et analyse de l'incident (équipe sécurité)
2. Notification CNIL sous **72 heures** (si risque pour les droits)
3. Notification personnes concernées **sans délai** (si risque élevé)
4. Documentation de l'incident (registre des violations)

**Contact en cas d'incident** : security@quelyos.com

---

## Mises à Jour du Registre

Ce registre est mis à jour régulièrement :
- Lors de l'ajout d'un nouveau traitement
- Lors de modification substantielle d'un traitement existant
- Au minimum 1 fois par an (révision annuelle)

**Prochaine révision prévue** : [Date + 1 an]

---

## Annexe : Analyse d'Impact (PIA)

Pour les traitements à risque élevé (art. 35 RGPD), nous effectuons une Analyse d'Impact sur la Protection des Données (PIA).

**Traitements nécessitant une PIA** :
- Traitement n°7 (Données e-commerce clients finaux) - PIA réalisée le [Date]

**Méthodologie** : Outil PIA CNIL

---

## Contact

**Responsable de traitement** : Quelyos [SAS]
**Délégué à la Protection des Données (DPO)** : [Nom] - dpo@quelyos.com
**Email RGPD** : privacy@quelyos.com
**Adresse** : [À compléter]

---

**Version** : 1.0
**Date de création** : [Date]
**Dernière mise à jour** : [Date]
**Prochaine révision** : [Date + 1 an]
