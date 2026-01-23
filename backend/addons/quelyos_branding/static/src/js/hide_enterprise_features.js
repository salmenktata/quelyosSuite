/**
 * Quelyos Branding - Masquage des fonctionnalités Entreprise
 * Ce module masque tous les éléments liés à Odoo Enterprise
 */

(function() {
    'use strict';

    // ========================================
    // Fonction: Vérifier si un élément fait partie d'un composant Owl
    // ========================================
    // CRITICAL: Ne JAMAIS toucher aux composants Owl pour éviter de casser le lifecycle
    function isOwlComponent(element) {
        if (!element || !element.closest) return false;

        // Vérifier si l'élément ou un parent est un composant Owl
        const owlSelectors = [
            '[t-name]',                    // Templates QWeb
            '[data-tooltip-template]',     // Tooltips Owl
            '.o_kanban_view',              // Vues kanban (utilisent Owl)
            '.o_kanban_record',            // Enregistrements kanban
            '.o_kanban_renderer',          // Renderer kanban
            '.o_list_view',                // Vues liste (utilisent Owl)
            '.o_view_controller',          // Contrôleurs de vue
            '.o_renderer',                 // Renderers de vue
            '.o_field_widget',             // Widgets de champs
            '.o_form_view',                // Vues formulaire (Owl)
            '.o_component',                // Composants génériques Owl
        ];

        return owlSelectors.some(selector => element.closest(selector));
    }

    // ========================================
    // Fonction: Masquer les éléments entreprise
    // ========================================
    function hideEnterpriseElements() {
        // Badges et labels entreprise
        const badges = document.querySelectorAll(
            '.o_enterprise_badge, .badge-enterprise, ' +
            '.o_premium_feature, .o_enterprise_label'
        );
        badges.forEach(el => {
            // CRITICAL: Ne pas toucher aux composants Owl
            if (!isOwlComponent(el)) {
                el.remove();
            }
        });

        // Boutons de mise à niveau
        const upgradeButtons = document.querySelectorAll(
            'button[data-action*="upgrade"], ' +
            'a[href*="odoo.com/buy"], ' +
            'a[href*="/upgrade"], ' +
            '.o_upgrade_cta'
        );
        upgradeButtons.forEach(el => {
            // CRITICAL: Ne pas toucher aux composants Owl
            if (!isOwlComponent(el)) {
                el.style.display = 'none';
            }
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
        studioButtons.forEach(el => {
            // CRITICAL: Ne pas toucher aux composants Owl
            if (!isOwlComponent(el)) {
                el.remove();
            }
        });

        // Éléments de la navbar Studio
        const studioNavbar = document.querySelectorAll(
            '.o_web_studio_navbar_item, ' +
            '.o_studio_navbar_item'
        );
        studioNavbar.forEach(el => {
            // CRITICAL: Ne pas toucher aux composants Owl
            if (!isOwlComponent(el)) {
                el.remove();
            }
        });
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
            // CRITICAL: Ne pas toucher aux composants Owl
            if (isOwlComponent(dialog)) {
                return;
            }

            // Trouver le modal parent
            const modal = dialog.closest('.modal');
            if (modal && !isOwlComponent(modal)) {
                modal.remove();
            }
        });

        // Masquer aussi les bannières de trial
        const trialBanners = document.querySelectorAll(
            '.o_trial_banner, ' +
            '.o_upgrade_banner'
        );
        trialBanners.forEach(banner => {
            // CRITICAL: Ne pas toucher aux composants Owl
            if (!isOwlComponent(banner)) {
                banner.remove();
            }
        });
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
            // CRITICAL: Ne JAMAIS toucher aux composants Owl pour éviter de casser le lifecycle
            // Les vues kanban dans Odoo utilisent Owl et modifier leurs éléments pendant le rendering
            // peut causer l'erreur "ctx.kanban_image is not a function"
            if (isOwlComponent(card)) {
                return;
            }

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
                '.badge, ' +
                '.badge-enterprise, ' +
                'span.badge.badge-info'
            );

            enterpriseBadges.forEach(badge => {
                // Ne pas toucher aux composants Owl
                if (!isOwlComponent(badge) && badge.textContent.includes('Enterprise')) {
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
                    requestAnimationFrame(() => {
                        hideEnterpriseElements();
                        hideStudioButtons();
                        hideEnterpriseDialogs();
                        hideUninstallableModules();
                    });
                }, 500); // OPTIMIZED: Debounce de 500ms (was 100ms)
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

    // ========================================
    // Fonction consolidée pour mise à jour asynchrone
    // ========================================
    function hideEnterpriseAsync() {
        try {
            hideEnterpriseElements();
            hideStudioButtons();
            hideEnterpriseDialogs();
            hideUninstallableModules();
        } catch (error) {
            console.error('❌ Quelyos Enterprise Hiding: Error during update', error);
        }
    }

    // Re-vérification après le chargement complet de la page
    window.addEventListener('load', function() {
        setTimeout(hideEnterpriseAsync, 500);
    });

    // OPTIMIZED: Vérification périodique - intervalle de 10 secondes au lieu de 3 (3x moins agressif)
    // Capturer les éléments chargés dynamiquement avec une fréquence raisonnable
    window.quelyosEnterpriseInterval = setInterval(hideEnterpriseAsync, 10000);

    // OPTIMIZED: Vérifier aussi lors d'événements utilisateur avec debounce de 500ms
    ['click', 'focus', 'mouseenter'].forEach(eventType => {
        document.addEventListener(eventType, function() {
            clearTimeout(window.quelyosEnterpriseEventDebounce);
            window.quelyosEnterpriseEventDebounce = setTimeout(function() {
                requestAnimationFrame(function() {
                    hideEnterpriseElements();
                    hideStudioButtons();
                    hideUninstallableModules();
                });
            }, 500); // OPTIMIZED: 500ms au lieu de 100ms
        }, true);
    });

    // ========================================
    // Nettoyage des ressources avant déchargement
    // ========================================
    window.addEventListener('beforeunload', function() {
        // Nettoyer l'intervalle périodique
        if (window.quelyosEnterpriseInterval) {
            clearInterval(window.quelyosEnterpriseInterval);
        }

        // Nettoyer les timers de debounce
        if (window.quelyosEnterpriseTimer) {
            clearTimeout(window.quelyosEnterpriseTimer);
        }

        if (window.quelyosEnterpriseEventDebounce) {
            clearTimeout(window.quelyosEnterpriseEventDebounce);
        }

        console.log('🧹 Quelyos: Cleanup Enterprise hiding resources');
    });

    // ========================================
    // Exposer certaines fonctions pour debug
    // ========================================
    window.quelyosEnterpriseHiding = {
        hideEnterpriseElements: hideEnterpriseElements,
        hideStudioButtons: hideStudioButtons,
        hideEnterpriseDialogs: hideEnterpriseDialogs,
        hideUninstallableModules: hideUninstallableModules
    };

    console.log('✅ Quelyos Enterprise Hiding: Initialized (optimized for performance)');

})();
