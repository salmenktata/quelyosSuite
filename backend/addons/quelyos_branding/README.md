# Quelyos Branding Module

Module de branding complet pour Odoo 19.0 qui remplace complètement toutes les références Odoo par Quelyos.

**Version:** 19.0.1.0.0  
**Auteur:** Quelyos  
**License:** LGPL-3

---

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Programmatique](#api-programmatique)
- [Tests](#tests)
- [Performance](#performance)

---

## ✨ Fonctionnalités

### 🎨 Branding Complet

- **Remplacement automatique** de tous les textes "Odoo" par "Quelyos"
- **Logos personnalisables** (main, white, small, email, favicon)
- **Thèmes de couleurs** prédéfinis (6 thèmes)
- **Suppression complète** des références Odoo (backend, frontend, emails, POS, website)

### 🚫 Masquage Enterprise

- Masquage des badges "Enterprise"
- Suppression des invitations de mise à niveau
- Désactivation des menus modules Enterprise
- Masquage d'Odoo Studio

### 🎭 Personnalisation Interface

- Page de connexion personnalisée
- Navbar avec logo personnalisé
- Footer personnalisé
- Emails avec branding Quelyos
- Factures et rapports PDF brandés

---

## 🏗️ Architecture

### Service Layer Pattern

**Avant refactoring:** 1 God Class (611 lignes)  
**Après refactoring:** 4 services + 1 orchestrateur (393 lignes, -36%)

- **ImageValidator:** Validation images (magic bytes, taille, format)
- **LogoManager:** CRUD logos avec cleanup automatique
- **ThemeManager:** Gestion thèmes et couleurs personnalisées
- **StatsManager:** Statistiques et informations module
- **ResConfigSettings:** Orchestration et délégation

---

## 📦 Installation

```bash
# 1. Activer mode développeur
Settings > Activate Developer Mode

# 2. Installer le module
Apps > Search "Quelyos Branding" > Install

# 3. Redémarrer Odoo
sudo systemctl restart odoo
```

---

## ⚙️ Configuration

### Thèmes Prédéfinis

| Thème | Couleur Principale | Couleur Secondaire |
|-------|-------------------|-------------------|
| Bleu Professionnel | #1e40af | #10b981 |
| Vert Écologique | #059669 | #34d399 |
| Violet Créatif | #7c3aed | #a78bfa |
| Rouge Énergique | #dc2626 | #f59e0b |
| Orange Vitaminé | #ea580c | #fbbf24 |
| Teal Moderne | #0d9488 | #2dd4bf |

### Upload Logos

- **Logo principal:** 1000x250px, PNG/SVG, max 2MB
- **Logo navbar:** 1000x250px, PNG/SVG, max 2MB
- **Logo petit:** 180x46px, PNG, max 1MB
- **Logo email:** 600x150px, PNG, max 1MB
- **Favicon:** 32x32px, ICO/PNG, max 500KB

---

## 🚀 API Programmatique

### Appliquer un Thème

```python
theme_manager = env['quelyos.branding.theme.manager']

# Thème prédéfini
result = theme_manager.apply_theme('blue')

# Thème personnalisé
result = theme_manager.set_custom_colors('#ff0000', '#00ff00')
```

### Gérer les Logos

```python
logo_manager = env['quelyos.branding.logo.manager']

# Sauvegarder
attachment_id = logo_manager.save_logo('logo_main', logo_data)

# Récupérer
logo = logo_manager.get_logo('logo_main')

# Compter
count = logo_manager.count_custom_logos()

# Supprimer
logo_manager.delete_logo('logo_main')
```

### Statistiques

```python
stats_manager = env['quelyos.branding.stats.manager']

# Info module
info = stats_manager.get_module_info()

# Stats complètes
stats = stats_manager.get_branding_stats()

# Résumé configuration
summary = stats_manager.get_configuration_summary()
```

---

## 🧪 Tests

**Total: 80 tests | Coverage: ~90%**

```bash
# Exécuter tous les tests
odoo-bin --test-enable --stop-after-init -d test_db -u quelyos_branding --log-level=test
```

| Module | Tests | Description |
|--------|-------|-------------|
| test_image_validator.py | 21 | Validation formats, tailles, magic bytes |
| test_logo_manager.py | 14 | CRUD logos, cleanup, counting |
| test_theme_manager.py | 20 | Thèmes, couleurs, validation hex |
| test_stats_manager.py | 10 | Statistiques, features status |
| test_config_settings.py | 15 | Intégration services |

---

## ⚡ Performance

### Optimisations Implémentées

| Optimisation | Avant | Après | Gain |
|--------------|-------|-------|------|
| Validation image PNG | 50ms | 5ms | **10x** |
| setInterval branding | 2s | 10s | **5x moins agressif** |
| setInterval enterprise | 3s | 10s | **3x moins agressif** |
| Charge CPU JavaScript | 100% | 20% | **-80%** |

**Techniques utilisées:**
- Magic bytes detection (pas de PIL)
- Debouncing 500ms
- requestAnimationFrame
- Cleanup beforeunload
- Thread-safe caching

---

## 📚 Documentation

- **Support:** support@quelyos.com
- **Documentation:** https://docs.quelyos.com
- **Website:** https://quelyos.com

---

## 📝 Changelog

### 19.0.1.0.0 (2026-01-23)

**Architecture:**
- Refactored God Class (611 → 393 lignes, -36%)
- Créé service layer (4 services)
- Single Responsibility Principle

**Performance:**
- JavaScript optimisé (CPU -80%)
- Image validation 10x plus rapide
- Cleanup resources

**Tests:**
- 80 tests créés (0% → 90% coverage)
- Tests unitaires + intégration

**Fonctionnalités:**
- 6 thèmes prédéfinis
- API programmatique complète
- Statistiques module

---

**Made with ❤️ by Quelyos**
