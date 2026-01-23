/**
 * Quelyos Branding - Masquage des fonctionnalités Entreprise
 * Ce module masque tous les éléments liés à Odoo Enterprise
 */

(function() {
    'use strict';

    // ========================================
    // Fonction: Masquer les éléments entreprise
    // ========================================
    function hideEnterpriseElements() {
        // Badges et labels entreprise
        const badges = document.querySelectorAll(
            '.o_enterprise_badge, .badge-enterprise, ' +
            '.o_premium_feature, .o_enterprise_label'
        );
        badges.forEach(el => el.remove());

        // Boutons de mise à niveau
        const upgradeButtons = document.querySelectorAll(
            'button[data-action*="upgrade"], ' +
            'a[href*="odoo.com/buy"], ' +
            'a[href*="/upgrade"], ' +
            '.o_upgrade_cta'
        );
        upgradeButtons.forEach(el => {
            el.style.display = 'none';
        });
    }

    // ========================================
    // Fonction: Masquer les boutons Studio
    // ========================================
    function hideStudioButtons() {
        // Boutons "Edit in Studio"
        const studioButtons = document.querySelectorAll(
            'button[studio="true"], ' +
            'button[data-action="studio"], ' +
            'a[href*="/web_studio/"]'
        );
        studioButtons.forEach(el => el.remove());

        // Éléments de la navbar Studio
        const studioNavbar = document.querySelectorAll(
            '.o_web_studio_navbar_item, ' +
            '.o_studio_navbar_item'
        );
        studioNavbar.forEach(el => el.remove());
    }

    // ========================================
    // Fonction: Masquer les dialogues entreprise
    // ========================================
    function hideEnterpriseDialogs() {
        // Intercepter les dialogues de mise à niveau
        const upgradeDialogs = document.querySelectorAll(
            '.o_upgrade_content, ' +
            '.o_technical_modal'
        );

        upgradeDialogs.forEach(dialog => {
            // Trouver le modal parent
            const modal = dialog.closest('.modal');
            if (modal) {
                modal.remove();
            }
        });

        // Masquer aussi les bannières de trial
        const trialBanners = document.querySelectorAll(
            '.o_trial_banner, ' +
            '.o_upgrade_banner'
        );
        trialBanners.forEach(banner => banner.remove());
    }

    // ========================================
    // Fonction: Masquer les modules non installables
    // ========================================
    function hideUninstallableModules() {
        // Sélectionner tous les modules dans l'écran Apps
        const moduleCards = document.querySelectorAll(
            '.o_kanban_record, .o_module_card, .o_app'
        );

        moduleCards.forEach(card => {
            // Vérifier l'état du module
            const state = card.getAttribute('data-state');
            const license = card.getAttribute('data-license');

            // Masquer si le module est non installable
            if (state === 'uninstallable') {
                card.style.display = 'none';
                card.remove();
                return;
            }

            // Masquer si le module a une licence Enterprise (OEEL-1)
            if (license === 'OEEL-1') {
                card.style.display = 'none';
                card.remove();
                return;
            }

            // Vérifier aussi dans le contenu de la carte
            const cardContent = card.textContent || '';

            // Masquer les badges "Enterprise" dans les cartes
            const enterpriseBadges = card.querySelectorAll(
                '.badge:contains("Enterprise"), ' +
                '.badge-enterprise, ' +
                'span.badge.badge-info'
            );

            enterpriseBadges.forEach(badge => {
                if (badge.textContent.includes('Enterprise')) {
                    badge.remove();
                }
            });

            // Si la carte contient "Uninstallable" ou mentionne l'impossibilité d'installer
            if (cardContent.includes('Uninstallable') ||
                cardContent.includes('Cannot be installed') ||
                cardContent.includes('Non installable')) {
                card.style.display = 'none';
                card.remove();
            }
        });

        console.log('🚫 Quelyos: Modules non installables masqués');
    }

    // ========================================
    // Fonction: Observer les changements du DOM
    // ========================================
    function observeAndHide() {
        const observer = new MutationObserver(function(mutations) {
            let shouldProcess = false;

            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldProcess = true;
                }
            });

            if (shouldProcess) {
                clearTimeout(window.quelyosEnterpriseTimer);
                window.quelyosEnterpriseTimer = setTimeout(() => {
                    hideEnterpriseElements();
                    hideStudioButtons();
                    hideEnterpriseDialogs();
                    hideUninstallableModules();
                }, 100); // Debounce de 100ms
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('👀 Quelyos: Observer du DOM pour entreprise activé');
    }

    // ========================================
    // Fonction: Initialisation
    // ========================================
    function init() {
        console.log('🚫 Quelyos: Masquage des fonctionnalités Entreprise activé');

        hideEnterpriseElements();
        hideStudioButtons();
        hideEnterpriseDialogs();
        hideUninstallableModules();

        if (document.body) {
            observeAndHide();
        }

        console.log('✅ Quelyos: Masquage Entreprise initialisé avec succès');
    }

    // ========================================
    // Démarrage
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-vérification après le chargement complet de la page
    window.addEventListener('load', function() {
        setTimeout(function() {
            hideEnterpriseElements();
            hideStudioButtons();
            hideEnterpriseDialogs();
            hideUninstallableModules();
        }, 500);
    });

    // Vérification périodique pour capturer les éléments chargés dynamiquement
    // Intervalle de 3 secondes (moins agressif que le debranding général)
    setInterval(function() {
        hideEnterpriseElements();
        hideStudioButtons();
        hideEnterpriseDialogs();
        hideUninstallableModules();
    }, 3000);

    // Vérifier aussi lors d'événements utilisateur
    ['click', 'focus', 'mouseenter'].forEach(eventType => {
        document.addEventListener(eventType, function() {
            setTimeout(function() {
                hideEnterpriseElements();
                hideStudioButtons();
                hideUninstallableModules();
            }, 100);
        }, true);
    });

    // Exposer certaines fonctions pour debug
    window.quelyosEnterpriseHiding = {
        hideEnterpriseElements: hideEnterpriseElements,
        hideStudioButtons: hideStudioButtons,
        hideEnterpriseDialogs: hideEnterpriseDialogs,
        hideUninstallableModules: hideUninstallableModules
    };

})();
