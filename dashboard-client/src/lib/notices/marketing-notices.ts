import { Mail, Users, BarChart3, Lightbulb, TrendingUp, Zap } from 'lucide-react';
import type { PageNoticeConfig } from './types';

export const marketingNotices: Record<string, PageNoticeConfig> = {
  campaigns: {
    pageId: 'marketing-campaigns',
    title: 'Campagnes Marketing',
    purpose: "Créez, envoyez et suivez vos campagnes d'emailing marketing en exploitant les fonctionnalités natives du système (module mass_mailing). Analysez les performances (ouvertures, clics, bounces) pour optimiser vos communications.",
    icon: Mail,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Segmentez vos destinataires via le domaine de filtrage pour cibler précisément (clients actifs, prospects qualifiés, etc.)`,
        `Testez vos campagnes en mode brouillon avant envoi : vérifiez rendu HTML, liens, images`,
        `Personnalisez le contenu avec les variables système (nom, prénom, historique achats) pour augmenter l'engagement`,
        `Envoyez un test à votre équipe avant envoi massif : détectez erreurs de contenu ou problèmes techniques`,
        `Analysez les KPI (taux ouverture, taux clic, bounces) : optimisez objet et contenu selon les performances`,
        `Nettoyez régulièrement les contacts bounced/opt-out : préservez votre réputation expéditeur`,
        `Respectez la fréquence optimale : évitez sur-sollicitation (désabonnements) et sous-sollicitation (oubli de la marque)`,
      ]
    }]
  },

  'campaign-tracking': {
    pageId: 'campaign-tracking',
    title: 'Tracking Détaillé Campagne',
    purpose: "Analysez en profondeur les performances d'une campagne : stats détaillées (ouvertures, clics, engagement), heatmap des liens cliqués, top clickers, timeline chronologique des interactions et contacts inactifs.",
    icon: TrendingUp,
    moduleColor: 'pink',
    sections: [{
      title: 'Interpréter les métriques',
      icon: BarChart3,
      items: [
        `Taux ouverture : 15-25% = bon, <10% = revoir objet/réputation expéditeur`,
        `Taux clic : 2-5% = bon, <1% = revoir CTA ou contenu peu engageant`,
        `Score engagement (0-100) : combine ouvertures + clics + fréquence, >60 = contact chaud`,
        `Temps moyen ouverture : <2h = excellent engagement, >24h = timing à revoir`,
        `Top clickers : identifiez prospects chauds pour relance commerciale ciblée`,
        `Heatmap liens : révèle quels CTA performent, supprimez liens ignorés`,
        `Contacts inactifs (jamais ouvert) : >30% = problème qualité liste ou délivrabilité`,
      ]
    }]
  },

  'automation-workflows': {
    pageId: 'automation-workflows',
    title: 'Workflows Marketing Automation',
    purpose: "Automatisez vos campagnes marketing avec des workflows événementiels : drip campaigns, nurturing prospects, relances panier abandonné, anniversaires. Activez/désactivez, suivez progression participants.",
    icon: Zap,
    moduleColor: 'pink',
    sections: [{
      title: 'Créer un workflow efficace',
      icon: Lightbulb,
      items: [
        `Démarrez simple : 2-3 activités max pour premier workflow (email bienvenue → attendre 3j → email suivi)`,
        `Activités types : email (contenu), wait (pause jours/heures), add_to_list (segmentation), send_sms (multi-canal)`,
        `Triggers événementiels : nouveau contact, ajout liste, commande passée, panier abandonné, anniversaire, manuel`,
        `Filtrez participants : appliquez domaine filtrage pour ne cibler que contacts éligibles (ex: clients France, > 1 commande)`,
        `Suivez progression : surveillez participants actifs/terminés, identifiez étapes de blocage`,
        `Testez avant activation : créez workflow inactif, ajoutez vous-même comme participant test, vérifiez emails reçus`,
        `Timing optimal : email bienvenue immédiat, relance panier 1h-24h, nurturing 3-7 jours entre emails`,
      ]
    }]
  },

  lists: {
    pageId: 'marketing-lists',
    title: 'Listes de Diffusion',
    purpose: "Gérez vos listes de contacts marketing pour structurer vos audiences (clients, prospects, newsletter, événements). Ajoutez, retirez et segmentez vos contacts pour des campagnes ciblées.",
    icon: Users,
    moduleColor: 'pink',
    sections: [{
      title: 'Bonnes pratiques',
      icon: Lightbulb,
      items: [
        `Créez des listes thématiques : newsletter générale, nouveautés produits, événements, promotions VIP`,
        `Importez vos contacts par lot (CSV, Excel) : gagnez du temps sur la saisie manuelle`,
        `Nettoyez les doublons régulièrement : un même email dans plusieurs listes = risque de spam`,
        `Segmentez par comportement : clients actifs 6 derniers mois, prospects non convertis, paniers abandonnés`,
        `Respectez le RGPD : incluez lien désabonnement dans chaque email, tracez les consentements`,
        `Suivez la croissance des listes : une liste qui stagne révèle un problème d'acquisition`,
        `Exportez vos listes pour backup ou analyses croisées (CRM, outils BI externes)`,
      ]
    }]
  },
};
