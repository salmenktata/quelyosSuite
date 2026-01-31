import { Boxes, ClipboardList, ArrowLeftRight, Truck, Warehouse, MapPin, RefreshCcw, Lightbulb, Layers, Shuffle, TrendingUp } from 'lucide-react';
import type { PageNoticeConfig } from './types';

export const stockNotices: Record<string, PageNoticeConfig> = {
  products: {
    pageId: 'stock-products',
    title: 'Stock & Disponibilité',
    purpose: "Visualisez en temps réel le niveau de stock de tous vos produits, identifiez les ruptures ou surstocks, et ajustez rapidement les quantités pour garantir la disponibilité des articles.",
    icon: Boxes,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Configurez des seuils min/max adaptés à la rotation : seuil min = stock sécurité + qté vendue pendant délai fournisseur`,
        `Utilisez les alertes "Stock faible" pour anticiper les ruptures avant qu'elles impactent les ventes`,
        `Exportez régulièrement l'état du stock (Excel/CSV) pour des analyses complémentaires ou audits`,
        `Ajustez via le modal pour tracer les mouvements : évitez les modifications directes dans l'interface d'administration`,
        `Activez l'inventaire périodique (mensuel ou trimestriel) pour corriger les écarts physique/théorique`,
      ]
    }]
  },

  inventory: {
    pageId: 'stock-inventory',
    title: 'Inventaire Physique',
    purpose: "Organisez et suivez vos campagnes d'inventaire physique pour garantir la cohérence entre stock théorique et réel. Identifiez et corrigez les écarts rapidement.",
    icon: ClipboardList,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Planifiez des inventaires réguliers : inventaire complet annuel + inventaires tournants mensuels par zone`,
        `Imprimez les listes de comptage via export Excel pour faciliter le travail terrain`,
        `Saisissez les quantités réelles dans le backoffice : le système calcule automatiquement les écarts`,
        `Analysez les écarts avant validation : identifiez les causes (casse, vol, erreur saisie)`,
        `Validez l'inventaire pour ajuster le stock : les mouvements d'ajustement sont tracés automatiquement`,
      ]
    }]
  },

  moves: {
    pageId: 'stock-moves',
    title: 'Mouvements de Stock',
    purpose: "Consultez l'historique exhaustif de tous les mouvements de stock (entrées, sorties, ajustements, transferts) pour tracer l'origine de chaque variation et garantir l'auditabilité.",
    icon: ArrowLeftRight,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Filtrez par période, produit ou emplacement pour analyser des flux spécifiques`,
        `Surveillez les types de mouvements : les ajustements fréquents révèlent des dysfonctionnements`,
        `Exportez les mouvements pour croiser avec la comptabilité ou les audits qualité`,
        `Vérifiez la cohérence : tout mouvement doit avoir une origine identifiée (commande, transfert, inventaire)`,
        `Utilisez les références de picking/livraison pour remonter aux documents sources`,
      ]
    }]
  },

  transfers: {
    pageId: 'stock-transfers',
    title: 'Transferts entre Entrepôts',
    purpose: "Gérez les transferts de marchandises entre vos différents entrepôts ou emplacements. Suivez l'état des transferts en cours et l'historique des mouvements inter-sites.",
    icon: Truck,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez un transfert pour tout mouvement entre sites : garantit la traçabilité complète`,
        `Validez la réception à l'arrivée : évite les décalages entre sites expéditeur et destinataire`,
        `Suivez les transferts "En transit" : alertez si délai anormal (perte, erreur logistique)`,
        `Utilisez les références uniques pour faciliter le suivi multi-sites`,
        `Analysez les flux inter-sites pour optimiser la répartition du stock`,
      ]
    }]
  },

  warehouses: {
    pageId: 'stock-warehouses',
    title: 'Gestion des Entrepôts',
    purpose: "Administrez vos entrepôts et sites de stockage : configuration, emplacements, règles de réapprovisionnement. Visualisez le stock par entrepôt pour optimiser la répartition.",
    icon: Warehouse,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Structurez vos entrepôts par fonction : stock principal, showroom, SAV, zones de picking`,
        `Configurez les routes et séquences de picking adaptées à votre activité`,
        `Définissez des règles de réapprovisionnement par entrepôt selon la demande locale`,
        `Suivez le taux de remplissage par entrepôt : évitez saturation ou sous-utilisation`,
        `Activez les emplacements hiérarchiques pour faciliter l'organisation physique`,
      ]
    }]
  },

  locations: {
    pageId: 'stock-locations',
    title: 'Emplacements de Stock',
    purpose: "Organisez vos emplacements de stockage (allées, rayons, casiers) pour optimiser le picking et la traçabilité. Visualisez le stock par emplacement et gérez les mouvements internes.",
    icon: MapPin,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez une hiérarchie claire : Entrepôt > Zone > Allée > Rayon > Casier`,
        `Nommez les emplacements de façon logique : A01-R02-C03 pour faciliter le repérage`,
        `Affectez les produits à rotation rapide aux emplacements les plus accessibles`,
        `Utilisez les emplacements virtuels pour stock endommagé, en contrôle qualité, etc.`,
        `Scannez les emplacements lors des mouvements pour garantir la fiabilité`,
      ]
    }]
  },

  reorderingRules: {
    pageId: 'stock-reordering-rules',
    title: 'Règles de Réapprovisionnement',
    purpose: "Automatisez le réapprovisionnement en définissant des règles (min/max, point de commande) pour chaque produit. Le système génère automatiquement les bons de commande fournisseur.",
    icon: RefreshCcw,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Configurez min = stock sécurité + demande pendant délai fournisseur, max = min + lot économique`,
        `Activez le calcul automatique : le système suggère les règles selon historique de ventes`,
        `Révisez trimestriellement les règles : ajustez selon saisonnalité ou changements de rotation`,
        `Testez les règles sur quelques produits avant généralisation pour valider les paramètres`,
        `Surveillez les alertes de stock mini : déclenchent automatiquement les commandes fournisseurs`,
      ]
    }]
  },

  valuation: {
    pageId: 'stock-valuation',
    title: 'Valorisation du Stock',
    purpose: "Analysez la valeur financière de votre inventaire en temps réel. La valorisation est calculée en multipliant le stock disponible par le coût unitaire de chaque produit, vous permettant d'identifier où votre capital est immobilisé et d'optimiser vos niveaux de stock.",
    icon: Layers,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Suivez la valorisation par entrepôt pour identifier les sites sur ou sous-stockés`,
        `Analysez la répartition par catégorie : concentrez le capital sur les produits à forte rotation`,
        `Comparez régulièrement valorisation théorique vs inventaire physique pour détecter les écarts`,
        `Utilisez les exports CSV pour intégrer dans vos tableaux de bord financiers ou comptables`,
        `Identifiez les produits dormants (forte valeur, faible rotation) pour libérer du cash`,
      ]
    }]
  },

  turnover: {
    pageId: 'stock-turnover',
    title: 'Rotation du Stock',
    purpose: "Mesurez la vitesse de rotation de vos produits pour optimiser les achats et réduire les coûts de stockage. Le ratio de rotation (Quantité vendue ÷ Stock moyen) révèle les produits performants et identifie le stock dormant.",
    icon: Shuffle,
    moduleColor: 'orange',
    sections: [
      {
        title: 'Comprendre les statuts',
        icon: TrendingUp,
        items: [
          `Excellent (≥12) : Rotation optimale - produit très demandé, minimisez le stock pour libérer du cash`,
          `Bon (6-12) : Performance saine - équilibre correct entre disponibilité et immobilisation`,
          `Lent (2-6) : À surveiller - vérifiez la demande réelle, ajustez les règles de réappro`,
          `Dormant (<2) : Action requise - envisagez promotions, déstockage ou arrêt de commercialisation`,
        ]
      },
      {
        title: 'Bonnes pratiques',
        icon: Lightbulb,
        items: [
          `Analysez sur 90 jours minimum pour lisser les variations saisonnières`,
          `Segmentez par catégorie : les ratios normaux varient selon le type de produit`,
          `Identifiez les produits dormants pour négocier retours fournisseurs ou promotions`,
          `Ajustez les seuils de réappro selon rotation : produits rapides = stock mini, produits lents = stock réduit`,
          `Exportez régulièrement pour suivre l'évolution et mesurer l'impact de vos actions`,
        ]
      }
    ]
  },

  locationLocks: {
    pageId: 'stock-location-locks',
    title: 'Verrouillage Emplacements',
    purpose: "Bloquez temporairement des emplacements de stock pour maintenance, réorganisation ou inventaire physique. Empêche tout mouvement de stock sur les zones verrouillées pour garantir l'intégrité des opérations.",
    icon: MapPin,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Verrouillez avant inventaire : empêche les mouvements pendant le comptage pour garantir cohérence`,
        `Documentez la raison : indiquez motif (maintenance, réorganisation, inventaire) pour traçabilité`,
        `Planifiez les verrouillages : prévenez l'équipe logistique pour éviter blocages opérationnels`,
        `Limitez la durée : déverrouillez dès que possible pour ne pas ralentir l'activité`,
        `Suivez les alertes : notifications automatiques si tentative d'accès à emplacement verrouillé`,
      ]
    }]
  },

  changeReasons: {
    pageId: 'stock-change-reasons',
    title: 'Raisons de Changement',
    purpose: "Tracez les motifs d'ajustements de stock (casse, vol, inventaire, péremption) pour analyser les pertes et identifier les sources de démarque inconnue. Essentiel pour l'audit et le contrôle qualité.",
    icon: ClipboardList,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez des raisons standardisées : Casse, Vol, Péremption, Inventaire, Erreur saisie, Retour client`,
        `Associez une raison à chaque ajustement : garantit la traçabilité et facilite l'analyse des pertes`,
        `Analysez mensuellement les motifs : identifiez les tendances (casse récurrente sur produit fragile)`,
        `Sensibilisez les équipes : encouragez la déclaration systématique pour réduire la démarque inconnue`,
        `Exportez pour comptabilité : les ajustements avec raison simplifient les écritures de perte/démarque`,
      ]
    }]
  },

  inventoriesOCA: {
    pageId: 'stock-inventories-oca',
    title: 'Inventaires Avancés',
    purpose: "Version avancée de l'inventaire physique avec fonctionnalités étendues : inventaires par lots, validation multi-niveaux, historique détaillé. Pour organisations nécessitant un contrôle strict du stock.",
    icon: ClipboardList,
    moduleColor: 'orange',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Utilisez les inventaires tournants : comptez 20% du stock chaque semaine plutôt qu'un inventaire complet annuel`,
        `Segmentez par emplacement : créez plusieurs inventaires parallèles pour ne pas bloquer tout l'entrepôt`,
        `Validez en 2 temps : recomptez les écarts >10% avant validation finale pour éviter erreurs`,
        `Analysez les tendances d'écarts : identifiez les zones/produits à problèmes récurrents`,
        `Documentez les ajustements : joignez photos ou justificatifs pour écarts importants (audit)`,
      ]
    }]
  },

  inventoryGroups: {
    pageId: 'stock-inventory-groups',
    title: 'Groupes d\'Inventaire OCA',
    purpose: "Organisez vos inventaires par groupes cohérents (emplacements, catégories) pour un comptage plus structuré. Module OCA permettant de gérer plusieurs inventaires parallèles avec workflow de validation.",
    icon: ClipboardList,
    moduleColor: 'teal',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez un groupe par zone : permet de compter en parallèle sans bloquer tout l'entrepôt`,
        `Workflow 4 états : Brouillon → En cours → Validé (ou Annulé) pour contrôle strict`,
        `Sélection produits flexible : tous produits, sélection manuelle, par catégorie ou lot/série`,
        `Validez uniquement après vérification : les ajustements sont appliqués au stock définitivement`,
        `Tracez les mouvements : chaque groupe génère des mouvements de stock identifiables dans l'historique`,
      ]
    }]
  },

  warehouseCalendars: {
    pageId: 'stock-warehouse-calendars',
    title: 'Calendriers Entrepôts OCA',
    purpose: "Configurez les jours et horaires de travail de vos entrepôts pour calculer des dates de livraison réalistes. Le système prend en compte les jours ouvrables, heures d'ouverture et congés.",
    icon: Warehouse,
    moduleColor: 'teal',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Assignez un calendrier par entrepôt : garantit des promesses de livraison réalistes selon capacité`,
        `Configurez jours ouvrables + horaires : Lun-Ven 8h-17h par défaut, adaptez selon votre activité`,
        `Utilisez timezones : essentiel pour multi-sites internationaux (délais cohérents)`,
        `Planifiez livraisons : +5 jours ouvrables = date réelle en excluant weekends/congés`,
        `Mettez à jour congés : ajoutez jours fériés nationaux pour calculs précis toute l'année`,
      ]
    }]
  },
};
