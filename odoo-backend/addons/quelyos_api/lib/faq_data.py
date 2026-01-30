# -*- coding: utf-8 -*-
"""
Données FAQ prédéfinies pour le Chatbot IA Quelyos.
Questions/réponses fréquentes avec mots-clés de matching.
"""
from typing import List, TypedDict


class FAQEntry(TypedDict):
    keywords: List[str]
    question: str
    answer: str


FAQ_ENTRIES: List[FAQEntry] = [
    {
        "keywords": ["créer boutique", "créer shop", "créer magasin", "ouvrir boutique", "créer commerce"],
        "question": "Comment créer une boutique sur Quelyos ?",
        "answer": """Pour créer une boutique e-commerce sur Quelyos :

1. **Créez votre compte** sur https://quelyos.com
2. **Choisissez votre plan** (Essentiel, Pro ou Entreprise)
3. **Activez le module E-commerce** dans votre tableau de bord
4. **Configurez votre boutique** :
   - Nom et description
   - Logo et images
   - Couleurs et thème
5. **Ajoutez vos produits** (photos, prix, stock)
6. **Configurez les moyens de paiement** (Stripe, PayPal)
7. **Paramétrez la livraison** (zones, tarifs)
8. **Publiez votre boutique** en un clic !

Votre boutique est prête en moins de 30 minutes. Besoin d'aide ? Contactez notre support à support@quelyos.com"""
    },
    {
        "keywords": ["prix", "tarif", "coût", "abonnement", "plan", "combien", "pricing"],
        "question": "Quels sont les tarifs de Quelyos ?",
        "answer": """Super ! Parlons budget 💰

On a 3 formules pensées pour chaque étape de ta croissance :

**🟢 Essentiel - 49€/mois**
Parfait pour démarrer !
→ Les 8 modules complets
→ 5 utilisateurs inclus
→ 10 Go de stockage
→ Support par email

**🔵 Pro - 99€/mois** ⭐ Le plus populaire
Idéal pour les équipes qui grandissent :
→ Tout Essentiel +
→ Utilisateurs **illimités**
→ 50 Go de stockage
→ Support prioritaire
→ Personnalisation avancée

**🟣 Entreprise - Sur mesure**
Pour les ambitions XXL :
→ Tout Pro +
→ Stockage illimité
→ Support dédié 24/7
→ Infrastructure dédiée
→ Intégrations custom

🎁 **Bonus** : Essai gratuit 14 jours sur tous les plans (aucune CB demandée !)

Tu hésites entre deux plans ? Je peux t'aider à choisir selon tes besoins !

Détails complets : https://quelyos.com/tarifs"""
    },
    {
        "keywords": ["c'est quoi", "qu'est-ce que", "définition", "présentation", "quelyos", "bonjour", "salut", "hello"],
        "question": "Qu'est-ce que Quelyos ?",
        "answer": """Ravi de te rencontrer ! 👋

Quelyos, c'est **LA suite ERP française** qui simplifie la vie des TPE/PME. Imagine pouvoir gérer toute ton entreprise depuis une seule plateforme moderne et intuitive !

🎯 **Nos 8 modules qui travaillent ensemble** :
- 💰 **Finance** → Trésorerie IA, factures, compta
- 👥 **CRM** → Clients, opportunités, suivi commercial
- 📦 **Stock** → Inventaire temps réel, alertes auto
- 🏪 **E-commerce** → Ta boutique en ligne en 30 min
- 👔 **RH** → Congés, absences, contrats
- 📍 **Point de Vente** → Caisse tactile pro
- 📢 **Marketing** → Campagnes email/SMS
- 🧠 **IA native** → Prévisions et analyses intelligentes

✨ **Pourquoi tu vas adorer** :
✅ 100% français (hébergement, support, RGPD)
✅ SaaS accessible partout, sans installation
✅ Données synchronisées en temps réel
✅ Interface super intuitive

**Essai gratuit 14 jours** pour tout tester ! Pas de CB demandée 😉

Tu veux en savoir plus sur un module en particulier ?"""
    },
    {
        "keywords": ["modules", "fonctionnalités", "features", "options", "que faire"],
        "question": "Quels modules propose Quelyos ?",
        "answer": """Quelyos intègre **8 modules professionnels** :

**💰 Quelyos Finance**
Trésorerie IA, factures, devis, comptabilité, rapprochement bancaire

**👥 Quelyos CRM**
Gestion clients, pipeline des ventes, opportunités, historique

**📦 Quelyos Stock**
Inventaire temps réel, mouvements, alertes de réapprovisionnement

**🏪 Quelyos E-commerce**
Boutique en ligne, catalogue produits, paiements en ligne

**👔 Quelyos RH**
Congés, absences, notes de frais, contrats, évaluations

**📍 Quelyos POS**
Point de vente tactile, caisse enregistreuse, tickets

**📢 Quelyos Marketing**
Campagnes email/SMS, segmentation clients, automation

**🧠 IA Native**
Prévisions de trésorerie, analyses automatiques, insights

Tous les modules sont **inclus dans chaque abonnement** !"""
    },
    {
        "keywords": ["essai", "gratuit", "demo", "tester", "démo", "trial"],
        "question": "Puis-je tester Quelyos gratuitement ?",
        "answer": """Oui ! Quelyos propose un **essai gratuit de 14 jours** :

✅ **Sans carte bancaire** (pas de paiement automatique)
✅ **Accès complet** aux 8 modules
✅ **Données de démo** pour explorer
✅ **Support inclus** pour vos questions
✅ **Migration facile** de vos données

**Comment démarrer :**
1. Créez votre compte sur https://quelyos.com
2. Choisissez votre plan (facturation après 14 jours)
3. Explorez librement tous les modules
4. Décidez en fin d'essai (annulation en 1 clic)

Vous pouvez aussi demander une **démo personnalisée** avec un expert : support@quelyos.com"""
    },
    {
        "keywords": ["support", "aide", "assistance", "contact", "problème"],
        "question": "Comment contacter le support Quelyos ?",
        "answer": """Le support Quelyos est disponible via plusieurs canaux :

**📧 Email** : support@quelyos.com
- Réponse sous 24h (jours ouvrés)
- Gratuit pour tous les plans

**💬 Chat en direct** (vous y êtes !)
- Réponses instantanées aux questions courantes
- Disponible 24/7

**📞 Support téléphonique** (plans Pro & Entreprise)
- Ligne directe prioritaire
- Assistance technique en français

**📚 Centre d'aide** : https://quelyos.com/docs
- Guides détaillés
- Tutoriels vidéo
- FAQ complète

**🎯 Support dédié** (plan Entreprise)
- Account manager dédié
- Support 24/7
- Hotline prioritaire"""
    },
    {
        "keywords": ["sécurité", "rgpd", "données", "protection", "sécurisé"],
        "question": "Mes données sont-elles sécurisées ?",
        "answer": """Quelyos prend la sécurité très au sérieux :

🔒 **Chiffrement**
- SSL/TLS pour toutes les connexions
- Données chiffrées en base (AES-256)
- Backups chiffrés quotidiens

🇫🇷 **Hébergement France**
- Serveurs en France (ISO 27001)
- Conformité RGPD complète
- Données hébergées en Europe uniquement

🛡️ **Accès**
- Authentification à deux facteurs (2FA)
- Contrôle des accès par rôle
- Logs d'audit détaillés

💾 **Sauvegardes**
- Backups automatiques quotidiens
- Conservation 30 jours
- Restauration en 1 clic

🔐 **Certifications**
- RGPD (DPO dédié)
- ISO 27001 (hébergeur)
- HDS (Hébergeur de Données de Santé)

Vos données vous appartiennent, toujours."""
    },
    {
        "keywords": ["intégration", "connecter", "import", "export", "api"],
        "question": "Puis-je intégrer Quelyos avec d'autres outils ?",
        "answer": """Oui ! Quelyos propose plusieurs options d'intégration :

**🔌 API REST Complète**
- Documentation détaillée
- Authentification OAuth2
- Webhooks temps réel
- Rate limiting généreux

**📊 Intégrations Natives**
- Stripe (paiements)
- PayPal (paiements)
- Services d'expédition (Colissimo, Chronopost)
- Email marketing (Mailchimp, Sendinblue)

**📥 Import/Export**
- CSV, Excel, JSON
- Imports en masse
- Export comptable (FEC)
- Synchronisation automatique

**🔗 Zapier / Make.com**
- Connectez 5000+ applications
- Automatisations sans code
- Templates prêts à l'emploi

**💼 Intégrations Custom** (plan Entreprise)
- Développement sur mesure
- Connecteurs spécifiques
- Support technique dédié

L'API est documentée sur https://quelyos.com/docs/api"""
    },
    {
        "keywords": ["stock", "inventaire", "gestion stock", "commande", "réapprovisionnement"],
        "question": "Comment gérer mon stock avec Quelyos ?",
        "answer": """Quelyos Stock offre une gestion complète de votre inventaire :

📦 **Suivi en Temps Réel**
- Stock disponible par produit et emplacement
- Mouvements d'entrée/sortie automatiques
- Valorisation du stock (FIFO, LIFO, PMP)

🔔 **Alertes Intelligentes**
- Seuils de réapprovisionnement personnalisables
- Notifications automatiques par email/SMS
- Prévisions basées sur l'historique

📊 **Inventaire**
- Comptages physiques
- Corrections d'écart
- Historique complet des mouvements

🏭 **Multi-Emplacements**
- Entrepôts multiples
- Transferts inter-sites
- Zones de stockage

📈 **Rapports**
- Valeur du stock
- Rotation des produits
- Produits en rupture
- Analyses ABC

Synchronisé automatiquement avec les ventes et achats !"""
    },
    {
        "keywords": ["facture", "devis", "facturation", "paiement", "comptabilité"],
        "question": "Comment gérer ma facturation ?",
        "answer": """Quelyos Finance simplifie votre facturation :

📄 **Devis & Factures**
- Création en quelques clics
- Templates personnalisables
- Numérotation automatique
- Multi-devises

💳 **Paiements**
- Suivi des échéances
- Relances automatiques
- Paiements en ligne (Stripe, PayPal)
- Rapprochement bancaire

📊 **Comptabilité**
- Plan comptable français
- Export FEC (Fichier des Écritures Comptables)
- TVA automatique
- Clôture d'exercice

🤖 **Automatisation**
- Factures récurrentes
- Acomptes et avoirs
- Conversion devis → facture en 1 clic

📧 **Envoi Automatique**
- Email avec PDF
- Portail client en ligne
- Signature électronique

Conforme aux normes françaises et européennes !"""
    },
    {
        "keywords": ["migrer", "migration", "importer données", "transfert", "import", "changer erp"],
        "question": "Comment migrer mes données vers Quelyos ?",
        "answer": """Quelyos facilite la migration de vos données :

📥 **Import Manuel**
- Formats : CSV, Excel (XLSX)
- Mapping automatique des colonnes
- Prévisualisation avant import
- Validation des données

🔄 **Import Automatisé**
- API REST complète et documentée
- Connecteurs ERP (Sage, Cegid, etc.)
- Scripts de migration personnalisés
- Synchronisation incrémentale

🤝 **Migration Assistée** (plan Entreprise)
- Équipe dédiée pour votre migration
- Migration complète clé en main
- Nettoyage et optimisation des données
- Formation incluse
- Garantie zéro perte de données

📊 **Données Migrables**
- Clients et fournisseurs
- Produits et catalogues
- Factures et historique
- Stocks et inventaires
- Contacts et opportunités

Contactez notre équipe migration : support@quelyos.com"""
    },
    {
        "keywords": ["performance", "rapidité", "vitesse", "lenteur", "scalabilité", "croissance", "montée en charge"],
        "question": "Quelyos peut-il gérer une forte croissance ?",
        "answer": """Quelyos est conçu pour évoluer avec votre entreprise :

⚡ **Performance**
- Cache Redis intégré
- CDN mondial (Cloudflare)
- Temps de réponse < 200ms
- Optimisations base de données

📈 **Scalabilité**
- Infrastructure auto-scalable
- Pas de limite d'utilisateurs (plan Pro+)
- Données illimitées (plan Entreprise)
- Architecture cloud-native

📊 **Clients Références**
- 50 à 500 collaborateurs
- Milliers de transactions/jour
- Multi-sites supporté
- Millions de références produits

💪 **Garanties**
- SLA 99.9% (plan Entreprise)
- Monitoring 24/7
- Alertes proactives
- Support dédié

Quelyos grandit avec vous, sans migration !"""
    },
    {
        "keywords": ["mobile", "smartphone", "tablette", "android", "ios", "app", "application"],
        "question": "Y a-t-il une application mobile ?",
        "answer": """Quelyos est 100% responsive et accessible sur mobile :

📱 **Version Web Mobile**
- Interface optimisée tablette/smartphone
- Pas d'installation nécessaire
- Accès via navigateur (Chrome, Safari, Firefox)
- Fonctionne sur tous appareils

🚀 **Progressive Web App (PWA)**
- Installation sur écran d'accueil
- Mode hors-ligne (lecture)
- Notifications push
- Expérience app native

📲 **Applications Natives** (2026)
- iOS & Android en développement
- Disponibilité prévue : Q2 2026
- Fonctionnalités complètes offline
- Inscrivez-vous à la beta : beta@quelyos.com

✨ **Fonctionnalités Mobile**
- Scanner code-barres (stock/POS)
- Géolocalisation (vendeurs terrain)
- Photos produits (appareil photo)
- Signature électronique tactile

En attendant, la version web mobile est parfaitement utilisable !"""
    },
    {
        "keywords": ["conformité", "certification", "norme", "iso", "rgpd", "légal", "audit", "hds"],
        "question": "Quelles sont les certifications de Quelyos ?",
        "answer": """Quelyos respecte les normes les plus strictes :

🔐 **Sécurité**
- ISO 27001 (hébergeur certifié)
- HDS (Hébergeur de Données de Santé)
- PCI-DSS (paiements sécurisés)
- Pentests trimestriels

📋 **Conformité**
- RGPD (DPO dédié)
- Loi française sur les données
- Export FEC comptable
- Archivage légal 10 ans

🇫🇷 **Souveraineté**
- Hébergement 100% France
- Données en Europe uniquement
- Support en français
- Contrats droit français

📜 **Audits**
- Audit sécurité annuel externe
- Pentest applicatif trimestriel
- Certifications à jour
- Rapports disponibles sur demande

🏥 **Santé** (HDS)
- Hébergement données de santé
- Conforme aux normes CNIL
- Traçabilité complète

Demandez nos certificats : conformite@quelyos.com"""
    },
    {
        "keywords": ["utilisateurs", "permissions", "droits", "accès", "rôles", "équipe", "multi-utilisateurs"],
        "question": "Comment gérer les permissions utilisateurs ?",
        "answer": """Quelyos offre une gestion fine des accès :

👥 **Utilisateurs Illimités**
- Plan Essentiel : 5 utilisateurs
- Plan Pro : utilisateurs illimités
- Plan Entreprise : utilisateurs illimités

🔐 **Rôles Prédéfinis**
- Administrateur (accès complet)
- Manager (lecture/écriture)
- Comptable (finances uniquement)
- Commercial (CRM/ventes)
- Magasinier (stock uniquement)
- Lecture seule (consultation)

⚙️ **Permissions Granulaires**
- Par module (Finance, CRM, Stock, etc.)
- Par opération (créer, lire, modifier, supprimer)
- Par données (mes clients, tous les clients)
- Règles personnalisées

👔 **Gestion Multi-Équipes**
- Équipes commerciales séparées
- Territoires géographiques
- Hiérarchie managériale
- Délégation de droits

🔍 **Audit & Traçabilité**
- Logs de toutes les actions
- Historique des modifications
- Alertes sur actions sensibles

Configuration simple via interface graphique !"""
    },
    {
        "keywords": ["personnalisation", "personnaliser", "white label", "marque", "logo", "couleurs", "branding"],
        "question": "Puis-je personnaliser Quelyos à ma marque ?",
        "answer": """Quelyos propose plusieurs niveaux de personnalisation :

🎨 **Personnalisation Standard** (tous plans)
- Logo entreprise
- Couleurs principales
- Emails personnalisés
- Templates de documents (factures, devis)

🏷️ **White Label** (plan Entreprise)
- URL personnalisée (erp.votreentreprise.com)
- Suppression marque Quelyos
- Interface 100% votre charte graphique
- Emails depuis votre domaine

📄 **Documents**
- Templates factures/devis personnalisés
- En-têtes et pieds de page
- Conditions générales
- Mentions légales

🌐 **Portail Client**
- Personnalisation complète
- Votre marque, votre design
- URL dédiée

💼 **Développement Custom** (plan Entreprise)
- Modules métier spécifiques
- Intégrations sur mesure
- Workflows personnalisés
- Support développeurs dédié

Faites de Quelyos VOTRE outil !"""
    },
    {
        "keywords": ["formation", "apprendre", "tutoriel", "aide", "débuter", "onboarding", "prise en main"],
        "question": "Comment se former à Quelyos ?",
        "answer": """Quelyos facilite votre prise en main :

📚 **Centre d'Aide**
- Documentation complète : https://quelyos.com/docs
- Guides pas à pas illustrés
- FAQ exhaustive
- Base de connaissances

🎥 **Tutoriels Vidéo**
- Vidéos courtes (2-5 min)
- Par module et fonctionnalité
- Cas d'usage concrets
- Playlist YouTube

🎓 **Formation en Ligne**
- Parcours interactifs
- Certification Quelyos
- Quiz de validation
- Progression sauvegardée

👨‍🏫 **Formation Personnalisée** (plans Pro & Entreprise)
- Sessions en visio avec formateur
- Formation sur site (plan Entreprise)
- Adaptation à votre métier
- Support post-formation

🚀 **Onboarding Dédié** (plan Entreprise)
- Account manager dédié
- Configuration assistée
- Migration de données
- Formation équipe complète

⚡ **Prise en Main Rapide**
- Interface intuitive
- Tooltips contextuels
- Assistant de configuration
- Données de démo pré-remplies

Devenez expert en quelques heures !"""
    },
    {
        "keywords": ["rapports", "statistiques", "analytics", "analyse", "tableau de bord", "kpi", "dashboard"],
        "question": "Quels rapports et analyses propose Quelyos ?",
        "answer": """Quelyos intègre des analyses puissantes :

📊 **Tableaux de Bord**
- Vue d'ensemble entreprise (KPI clés)
- Tableaux par module (Finance, CRM, etc.)
- Widgets personnalisables
- Actualisation temps réel

📈 **Rapports Prédéfinis**
- Chiffre d'affaires (CA)
- Trésorerie et prévisions
- Pipeline des ventes
- Performance commerciale
- Rotation des stocks
- Productivité RH

🧠 **IA & Prévisions**
- Prévisions de trésorerie 90 jours
- Détection d'anomalies
- Recommandations automatiques
- Analyses prédictives

💼 **Rapports Personnalisés**
- Créateur de rapports visuel
- Filtres avancés
- Exports (PDF, Excel, CSV)
- Planification d'envoi automatique

📉 **Analyses Croisées**
- Ventes par commercial/produit/région
- Marges par client/catégorie
- Évolutions temporelles
- Comparaisons périodes

📧 **Rapports Automatiques**
- Envoi email planifié
- Fréquence configurable (jour/semaine/mois)
- Destinataires multiples

Pilotez votre activité en temps réel !"""
    },
    {
        "keywords": ["abonnement", "récurrent", "récurrence", "souscription", "subscription", "facturation périodique"],
        "question": "Quelyos gère-t-il les abonnements récurrents ?",
        "answer": """Oui ! Quelyos Finance gère parfaitement les abonnements :

🔄 **Facturation Récurrente**
- Fréquence configurable (mensuel, trimestriel, annuel)
- Création automatique des factures
- Envoi email automatique
- Prélèvement automatique (Stripe, GoCardless)

💳 **Gestion Abonnements**
- Catalogue d'offres
- Essais gratuits (trial periods)
- Upgrades/Downgrades
- Suspensions et résiliations
- Prorata temporis

📊 **Métriques SaaS**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn rate (taux d'attrition)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)

💰 **Tarification Flexible**
- Prix fixe ou par usage
- Paliers de consommation
- Réductions automatiques
- Codes promo

📧 **Notifications**
- Renouvellements à venir
- Échecs de paiement
- Relances automatiques
- Fin de période d'essai

🧾 **Comptabilité**
- Reconnaissance du revenu (revenue recognition)
- Produits constatés d'avance
- Rapports fiscaux

Parfait pour les business SaaS et abonnements !"""
    },
    {
        "keywords": ["langue", "anglais", "espagnol", "multilingue", "traduction", "international"],
        "question": "Quelyos est-il disponible en plusieurs langues ?",
        "answer": """Quelyos supporte le multi-langue :

🇫🇷 **Français** (natif)
- Interface complète en français
- Support en français
- Documentation française

🌍 **Autres Langues** (2026)
- Anglais : Q1 2026
- Espagnol : Q2 2026
- Allemand : en développement

⚙️ **Fonctionnalités Multi-Langue**
- Interface utilisateur traduite
- Documents (factures, devis) multilingues
- Emails clients dans leur langue
- Catalogue produits traduit

🌐 **International Business**
- Multi-devises (déjà disponible)
- Multi-pays (déjà disponible)
- Formats de dates/nombres localisés
- TVA intracommunautaire

📧 **Support Multilingue** (plan Entreprise)
- Support client dans la langue client
- Documentation traduite
- Formation multilingue

🔔 **Notifications**
Inscrivez-vous pour être averti de la disponibilité de votre langue : support@quelyos.com

Actuellement optimisé pour le marché français !"""
    }
]
