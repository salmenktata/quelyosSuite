import { Mail, Users, BarChart3, Lightbulb, Send } from 'lucide-react';
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
