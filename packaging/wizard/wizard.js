/**
 * ============================================================================
 * Quelyos ERP - Wizard de Configuration - JavaScript
 * ============================================================================
 */

(function() {
    'use strict';

    // Configuration
    const TOTAL_STEPS = 7;
    let currentStep = 1;
    let configData = {};

    // Elements DOM
    const elements = {
        steps: document.querySelectorAll('.step'),
        btnPrev: document.getElementById('btnPrev'),
        btnNext: document.getElementById('btnNext'),
        btnFinish: document.getElementById('btnFinish'),
        progressFill: document.getElementById('progressFill'),
        currentStepSpan: document.getElementById('currentStep'),
        totalStepsSpan: document.getElementById('totalSteps'),
        enableSmtp: document.getElementById('enableSmtp'),
        smtpConfig: document.getElementById('smtpConfig'),
        adminPassword: document.getElementById('adminPassword'),
        adminPasswordConfirm: document.getElementById('adminPasswordConfirm'),
        passwordStrength: document.getElementById('passwordStrength'),
        passwordError: document.getElementById('passwordError')
    };

    // ========================================================================
    // Initialisation
    // ========================================================================
    function init() {
        console.log('Quelyos Wizard initialized');

        // Set total steps
        elements.totalStepsSpan.textContent = TOTAL_STEPS - 2; // Sans loading et success

        // Event listeners
        elements.btnPrev.addEventListener('click', prevStep);
        elements.btnNext.addEventListener('click', nextStep);
        elements.btnFinish.addEventListener('click', finishConfiguration);
        elements.enableSmtp.addEventListener('change', toggleSmtpConfig);
        elements.adminPassword.addEventListener('input', checkPasswordStrength);
        elements.adminPasswordConfirm.addEventListener('input', checkPasswordMatch);

        // Initialiser la première étape
        updateUI();
    }

    // ========================================================================
    // Navigation
    // ========================================================================
    function nextStep() {
        // Valider l'étape actuelle
        if (!validateCurrentStep()) {
            return;
        }

        // Sauvegarder les données
        saveCurrentStepData();

        // Passer à l'étape suivante
        if (currentStep < TOTAL_STEPS) {
            currentStep++;

            // Si c'est l'étape de récapitulatif, afficher le résumé
            if (currentStep === 5) {
                displaySummary();
            }

            updateUI();
        }
    }

    function prevStep() {
        if (currentStep > 1 && currentStep < 6) { // Pas de retour depuis loading/success
            currentStep--;
            updateUI();
        }
    }

    function updateUI() {
        // Masquer toutes les étapes
        elements.steps.forEach(step => step.classList.remove('active'));

        // Afficher l'étape actuelle
        const currentStepElement = document.getElementById(`step${currentStep}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Mettre à jour la barre de progression (exclure loading et success)
        const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 2)) * 100;
        elements.progressFill.style.width = `${progressPercent}%`;
        elements.currentStepSpan.textContent = Math.min(currentStep, TOTAL_STEPS - 2);

        // Gérer les boutons
        elements.btnPrev.disabled = currentStep === 1 || currentStep >= 6;

        if (currentStep === 5) {
            // Étape de récapitulatif
            elements.btnNext.classList.add('hidden');
            elements.btnFinish.classList.remove('hidden');
        } else if (currentStep >= 6) {
            // Loading et success
            elements.btnNext.classList.add('hidden');
            elements.btnFinish.classList.add('hidden');
            elements.btnPrev.classList.add('hidden');
        } else {
            elements.btnNext.classList.remove('hidden');
            elements.btnFinish.classList.add('hidden');
        }
    }

    // ========================================================================
    // Validation
    // ========================================================================
    function validateCurrentStep() {
        switch (currentStep) {
            case 1:
                return true; // Bienvenue, pas de validation

            case 2:
                // Informations entreprise
                const companyName = document.getElementById('companyName').value.trim();
                const companyEmail = document.getElementById('companyEmail').value.trim();

                if (!companyName) {
                    alert('Veuillez entrer le nom de votre entreprise');
                    return false;
                }

                if (!companyEmail || !isValidEmail(companyEmail)) {
                    alert('Veuillez entrer un email valide');
                    return false;
                }

                return true;

            case 3:
                // Compte administrateur
                const adminName = document.getElementById('adminName').value.trim();
                const adminEmail = document.getElementById('adminEmail').value.trim();
                const adminPassword = document.getElementById('adminPassword').value;
                const adminPasswordConfirm = document.getElementById('adminPasswordConfirm').value;

                if (!adminName) {
                    alert('Veuillez entrer votre nom');
                    return false;
                }

                if (!adminEmail || !isValidEmail(adminEmail)) {
                    alert('Veuillez entrer un email valide');
                    return false;
                }

                if (adminPassword.length < 8) {
                    alert('Le mot de passe doit contenir au moins 8 caractères');
                    return false;
                }

                if (adminPassword !== adminPasswordConfirm) {
                    alert('Les mots de passe ne correspondent pas');
                    return false;
                }

                return true;

            case 4:
                // Configuration SMTP (optionnelle)
                if (elements.enableSmtp.checked) {
                    const smtpHost = document.getElementById('smtpHost').value.trim();
                    const smtpUser = document.getElementById('smtpUser').value.trim();

                    if (!smtpHost || !smtpUser) {
                        alert('Veuillez remplir tous les champs SMTP obligatoires');
                        return false;
                    }
                }

                return true;

            default:
                return true;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ========================================================================
    // Sauvegarde des données
    // ========================================================================
    function saveCurrentStepData() {
        switch (currentStep) {
            case 2:
                configData.company = {
                    name: document.getElementById('companyName').value.trim(),
                    email: document.getElementById('companyEmail').value.trim(),
                    phone: document.getElementById('companyPhone').value.trim(),
                    address: document.getElementById('companyAddress').value.trim()
                };
                break;

            case 3:
                configData.admin = {
                    name: document.getElementById('adminName').value.trim(),
                    email: document.getElementById('adminEmail').value.trim(),
                    password: document.getElementById('adminPassword').value
                };
                break;

            case 4:
                if (elements.enableSmtp.checked) {
                    configData.smtp = {
                        enabled: true,
                        host: document.getElementById('smtpHost').value.trim(),
                        port: parseInt(document.getElementById('smtpPort').value),
                        encryption: document.getElementById('smtpEncryption').value,
                        user: document.getElementById('smtpUser').value.trim(),
                        password: document.getElementById('smtpPassword').value
                    };
                } else {
                    configData.smtp = { enabled: false };
                }
                break;
        }

        console.log('Config data saved:', configData);
    }

    // ========================================================================
    // Affichage du résumé
    // ========================================================================
    function displaySummary() {
        document.getElementById('summaryCompanyName').textContent = configData.company.name;
        document.getElementById('summaryCompanyEmail').textContent = configData.company.email;
        document.getElementById('summaryAdminName').textContent = configData.admin.name;
        document.getElementById('summaryAdminEmail').textContent = configData.admin.email;
        document.getElementById('summarySmtp').textContent = configData.smtp.enabled
            ? `Activé (${configData.smtp.host})`
            : 'Désactivé';
    }

    // ========================================================================
    // Configuration finale
    // ========================================================================
    async function finishConfiguration() {
        console.log('Starting configuration with data:', configData);

        // Passer à l'étape de chargement
        currentStep = 6;
        updateUI();

        // Simuler le processus de configuration
        try {
            await simulateConfigurationProcess();

            // Passer à l'étape de succès
            currentStep = 7;
            document.getElementById('finalAdminEmail').textContent = configData.admin.email;
            updateUI();

            // Marquer le wizard comme complété
            localStorage.setItem('quelyos_wizard_completed', 'true');

        } catch (error) {
            console.error('Configuration error:', error);
            alert('Une erreur est survenue pendant la configuration. Veuillez réessayer.');
            currentStep = 5; // Retour au récapitulatif
            updateUI();
        }
    }

    async function simulateConfigurationProcess() {
        const steps = [
            { message: 'Initialisation de la base de données...', duration: 2000, progress: 20 },
            { message: 'Configuration du compte administrateur...', duration: 1500, progress: 40 },
            { message: 'Installation des modules de base...', duration: 2500, progress: 60 },
            { message: 'Configuration de l\'entreprise...', duration: 1500, progress: 80 },
            { message: 'Finalisation...', duration: 1000, progress: 100 }
        ];

        const loadingMessage = document.getElementById('loadingMessage');
        const loadingBar = document.getElementById('loadingBar');

        for (const step of steps) {
            loadingMessage.textContent = step.message;
            loadingBar.style.width = `${step.progress}%`;

            // En production, faire l'appel API réel ici
            // await sendConfigurationToBackend(configData);

            await sleep(step.duration);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================================================
    // SMTP Toggle
    // ========================================================================
    function toggleSmtpConfig() {
        if (elements.enableSmtp.checked) {
            elements.smtpConfig.classList.remove('hidden');
        } else {
            elements.smtpConfig.classList.add('hidden');
        }
    }

    // ========================================================================
    // Password Strength
    // ========================================================================
    function checkPasswordStrength() {
        const password = elements.adminPassword.value;
        let strength = 'weak';

        if (password.length >= 8) {
            strength = 'medium';
        }

        if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
            strength = 'strong';
        }

        elements.passwordStrength.className = `password-strength ${strength}`;

        if (password.length > 0) {
            elements.passwordStrength.style.display = 'block';
        } else {
            elements.passwordStrength.style.display = 'none';
        }
    }

    function checkPasswordMatch() {
        const password = elements.adminPassword.value;
        const confirm = elements.adminPasswordConfirm.value;

        if (confirm.length > 0) {
            if (password !== confirm) {
                elements.passwordError.textContent = 'Les mots de passe ne correspondent pas';
                elements.passwordError.classList.add('visible');
            } else {
                elements.passwordError.classList.remove('visible');
            }
        } else {
            elements.passwordError.classList.remove('visible');
        }
    }

    // ========================================================================
    // Vérification si le wizard a déjà été complété
    // ========================================================================
    function checkWizardCompleted() {
        const completed = localStorage.getItem('quelyos_wizard_completed');
        if (completed === 'true') {
            // Rediriger vers la homepage
            // window.location.href = '/';
            console.log('Wizard already completed - would redirect to homepage');
        }
    }

    // ========================================================================
    // Démarrage
    // ========================================================================
    document.addEventListener('DOMContentLoaded', function() {
        checkWizardCompleted();
        init();
    });

})();
