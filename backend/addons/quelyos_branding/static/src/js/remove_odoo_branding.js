/**
 * Quelyos Branding - JavaScript
 * Suppression automatique des références Odoo dans l'interface
 */

(function() {
    'use strict';

    console.log('🎨 Quelyos Branding: JavaScript chargé');

    // ========================================
    // Fonction: Changer le titre de la page
    // ========================================
    function updatePageTitle() {
        if (document.title.toLowerCase().includes('odoo')) {
            document.title = document.title.replace(/Odoo/gi, 'Quelyos');
        }
        if (document.title === '' || document.title === 'Odoo') {
            document.title = 'Quelyos ERP';
        }
    }

    // ========================================
    // Fonction: Remplacer les classes CSS Odoo par Quelyos
    // ========================================
    function updateBodyClasses() {
        if (document.body) {
            document.body.classList.remove('o_web_client');
            document.body.classList.add('quelyos_web_client');
        }
    }

    // ========================================
    // Fonction: Remplacer les textes "Odoo" par "Quelyos"
    // ========================================
    function replaceOdooText() {
        // Sélectionner tous les éléments de texte
        const textNodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            // Ignorer les scripts et styles
            if (node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
                if (node.nodeValue && node.nodeValue.match(/Odoo/i)) {
                    textNodes.push(node);
                }
            }
        }

        // Remplacer "Odoo" par "Quelyos" dans les textes
        textNodes.forEach(node => {
            node.nodeValue = node.nodeValue.replace(/Odoo/g, 'Quelyos');
            node.nodeValue = node.nodeValue.replace(/odoo/g, 'quelyos');
            node.nodeValue = node.nodeValue.replace(/ODOO/g, 'QUELYOS');
        });

        // Remplacer dans les attributs HTML (title, placeholder, aria-label, etc.)
        const elementsWithOdoo = document.querySelectorAll('[title*="odoo" i], [placeholder*="odoo" i], [aria-label*="odoo" i], [data-original-title*="odoo" i]');
        elementsWithOdoo.forEach(el => {
            if (el.title) {
                el.title = el.title.replace(/Odoo/gi, 'Quelyos');
            }
            if (el.placeholder) {
                el.placeholder = el.placeholder.replace(/Odoo/gi, 'Quelyos');
            }
            if (el.getAttribute('aria-label')) {
                el.setAttribute('aria-label', el.getAttribute('aria-label').replace(/Odoo/gi, 'Quelyos'));
            }
            if (el.getAttribute('data-original-title')) {
                el.setAttribute('data-original-title', el.getAttribute('data-original-title').replace(/Odoo/gi, 'Quelyos'));
            }
        });

        // Remplacer dans les meta tags
        const metaTags = document.querySelectorAll('meta[content*="odoo" i]');
        metaTags.forEach(meta => {
            if (meta.content) {
                meta.content = meta.content.replace(/Odoo/gi, 'Quelyos');
            }
        });

        // Remplacer dans les labels et descriptions (Settings, formulaires, etc.)
        const labels = document.querySelectorAll('label, .o_field_label, .o_form_label, span.text-muted, small, .help-block');
        labels.forEach(el => {
            if (el.textContent && el.textContent.match(/Odoo/i)) {
                el.textContent = el.textContent.replace(/Odoo/gi, 'Quelyos');
            }
        });

        // Remplacer dans les boutons
        const buttons = document.querySelectorAll('button, .btn, .o_button');
        buttons.forEach(btn => {
            if (btn.textContent && btn.textContent.match(/Odoo/i)) {
                btn.textContent = btn.textContent.replace(/Odoo/gi, 'Quelyos');
            }
        });

        // Remplacer dans les headers et titres
        const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .modal-title, .o_form_label');
        headers.forEach(h => {
            if (h.textContent && h.textContent.match(/Odoo/i)) {
                h.textContent = h.textContent.replace(/Odoo/gi, 'Quelyos');
            }
        });

        // Remplacer dans les valeurs d'attributs value
        const inputs = document.querySelectorAll('input[value*="odoo" i], textarea');
        inputs.forEach(input => {
            if (input.value && input.value.match(/Odoo/i)) {
                input.value = input.value.replace(/Odoo/gi, 'Quelyos');
            }
        });
    }

    // ========================================
    // Fonction: Bloquer les liens vers Odoo.com
    // ========================================
    function blockOdooLinks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && (link.href.includes('odoo.com') || link.href.includes('odoo.org'))) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚫 Quelyos Branding: Lien Odoo bloqué -', link.href);
                return false;
            }
        }, true);
    }

    // ========================================
    // Fonction: Observer les mutations du DOM
    // ========================================
    function observeDOMChanges() {
        const observer = new MutationObserver(function(mutations) {
            let shouldUpdate = false;

            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate) {
                updatePageTitle();
                // Debounce pour éviter trop d'appels
                clearTimeout(window.quelyosDebounceTimer);
                window.quelyosDebounceTimer = setTimeout(replaceOdooText, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('👀 Quelyos Branding: Observer du DOM activé');
    }

    // ========================================
    // Fonction: Remplacer les couleurs Purple par Blue
    // ========================================
    function replacePurpleColors() {
        // Couleurs purple Odoo à remplacer
        const purpleColors = [
            '#875A7B',
            '#7c7bad',
            '#714B67',
            '#6f6a99',
            'rgb(135, 90, 123)',
            'rgb(124, 123, 173)',
            'rgba(135, 90, 123',
            'rgba(124, 123, 173'
        ];

        const blueReplacement = '#1e40af'; // Quelyos blue
        const blueReplacementRgb = 'rgb(30, 64, 175)';

        // ULTRA AGRESSIF: Forcer tous les onglets de navigation
        const navTabs = document.querySelectorAll('.nav-link, .nav-item, a[role="tab"], button[role="tab"], .o_cp_top a, .o_cp_top button');
        navTabs.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const bgColor = computedStyle.backgroundColor;

            // Si la couleur de fond est purple, la forcer en bleu
            if (bgColor && (bgColor.includes('124, 123, 173') || bgColor.includes('135, 90, 123'))) {
                el.style.backgroundColor = blueReplacement + ' !important';
                el.style.background = blueReplacement + ' !important';
                el.style.color = 'white !important';
            }
        });

        // Remplacer dans tous les éléments avec style inline
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style) {
                let newStyle = style;
                let changed = false;

                purpleColors.forEach(purple => {
                    if (newStyle.includes(purple)) {
                        newStyle = newStyle.replace(new RegExp(purple, 'gi'), blueReplacement);
                        changed = true;
                    }
                });

                if (changed) {
                    el.setAttribute('style', newStyle);
                }
            }

            // Forcer via computed style pour les éléments qui ont du purple en computed
            const computedBg = window.getComputedStyle(el).backgroundColor;
            if (computedBg && (computedBg.includes('124, 123, 173') || computedBg.includes('135, 90, 123'))) {
                el.style.setProperty('background-color', blueReplacement, 'important');
                el.style.setProperty('background', blueReplacement, 'important');
            }

            // Remplacer dans les attributs color des éléments
            if (el.getAttribute('color')) {
                let color = el.getAttribute('color');
                purpleColors.forEach(purple => {
                    if (color.includes(purple)) {
                        el.setAttribute('color', blueReplacement);
                    }
                });
            }
        });

        // Remplacer dans les SVG
        const svgElements = document.querySelectorAll('svg [fill], svg [stroke]');
        svgElements.forEach(el => {
            const fill = el.getAttribute('fill');
            if (fill) {
                purpleColors.forEach(purple => {
                    if (fill.toLowerCase().includes(purple.toLowerCase())) {
                        el.setAttribute('fill', blueReplacement);
                    }
                });
            }

            const stroke = el.getAttribute('stroke');
            if (stroke) {
                purpleColors.forEach(purple => {
                    if (stroke.toLowerCase().includes(purple.toLowerCase())) {
                        el.setAttribute('stroke', blueReplacement);
                    }
                });
            }
        });
    }

    // ========================================
    // Fonction: Supprimer les bannières de promotion Odoo
    // ========================================
    function removeOdooPromotions() {
        // Supprimer les bannières Odoo Studio/Enterprise
        const promotions = document.querySelectorAll('.o_web_studio_promotion, .o_promote_studio');
        promotions.forEach(el => el.remove());

        // Supprimer les liens vers Odoo.com dans les menus
        const odooLinks = document.querySelectorAll('a[href*="odoo.com"], a[href*="odoo.org"]');
        odooLinks.forEach(link => {
            if (!link.classList.contains('quelyos_kept')) {
                // Marquer comme traité pour éviter les boucles
                link.classList.add('quelyos_removed');
                // Ne pas supprimer complètement, juste désactiver
                link.style.display = 'none';
            }
        });
    }

    // ========================================
    // Fonction: Personnaliser la console
    // ========================================
    function customizeConsole() {
        console.log('%c╔═══════════════════════════════════════╗', 'color: #1e40af; font-weight: bold;');
        console.log('%c║   🚀 QUELYOS ERP                     ║', 'color: #1e40af; font-weight: bold;');
        console.log('%c║   Plateforme SaaS Retail Omnicanal   ║', 'color: #10b981;');
        console.log('%c╚═══════════════════════════════════════╝', 'color: #1e40af; font-weight: bold;');
        console.log('%cVersion: 18.0.1.0.0', 'color: #6b7280;');
        console.log('%cDocumentation: https://docs.quelyos.com', 'color: #6b7280;');
    }

    // ========================================
    // Fonction: Initialisation
    // ========================================
    function init() {
        console.log('🚀 Quelyos Branding: Initialisation...');

        updatePageTitle();
        updateBodyClasses();
        blockOdooLinks();
        removeOdooPromotions();
        replacePurpleColors();
        customizeConsole();

        // Observer les changements du DOM
        if (document.body) {
            observeDOMChanges();
            replaceOdooText();
        }

        console.log('✅ Quelyos Branding: Initialisé avec succès');
    }

    // ========================================
    // Démarrage
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-vérifier après le chargement complet de la page
    window.addEventListener('load', function() {
        setTimeout(function() {
            updatePageTitle();
            replaceOdooText();
            removeOdooPromotions();
            replacePurpleColors();
        }, 500);
    });

    // Vérification périodique pour capturer les éléments chargés dynamiquement
    setInterval(function() {
        updatePageTitle();
        replaceOdooText();
        removeOdooPromotions();
        replacePurpleColors();
    }, 2000); // Toutes les 2 secondes

    // Vérifier aussi lors d'événements utilisateur
    ['click', 'focus', 'mouseenter'].forEach(eventType => {
        document.addEventListener(eventType, function() {
            setTimeout(function() {
                replaceOdooText();
                replacePurpleColors();
            }, 100);
        }, true);
    });

    // Exposer certaines fonctions pour debug
    window.quelyosBranding = {
        updatePageTitle: updatePageTitle,
        replaceOdooText: replaceOdooText,
        removePromotions: removeOdooPromotions,
        replacePurpleColors: replacePurpleColors
    };

})();
