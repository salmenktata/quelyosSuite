# 🚀 Guide de Démarrage Rapide - Tests Manuels

**Date:** 2026-01-23
**Pour:** Validation du refactoring

---

## ⚡ TL;DR

```bash
# 1. Ouvrir Odoo
open http://localhost:8069

# 2. Login (si nécessaire)
# Email: admin
# Password: admin

# 3. Aller dans Apps
# 4. Search "Quelyos"
# 5. Installer les modules
```

---

## 📋 Checklist Rapide (15 minutes)

### ✅ Étape 1: Vérifier Infrastructure (2 min)

```bash
# Check containers
docker ps | grep quelyos
# Devrait afficher: quelyos-odoo (UP), quelyos-db (UP)

# Check Odoo logs
docker logs --tail 20 quelyos-odoo
# Devrait voir: "Registry loaded", "werkzeug" requests

# Health check
./test-api-health.sh
```

**Attendu:**
- ✅ 2 containers UP
- ✅ Odoo répond sur http://localhost:8069
- ✅ Pas d'erreurs critiques dans les logs

---

### ✅ Étape 2: Installer Modules (3 min)

1. **Ouvrir Odoo**
   ```
   http://localhost:8069
   ```

2. **Activer Mode Développeur**
   ```
   Settings (engrenage) > Activate Developer Mode
   ```

3. **Aller dans Apps**
   ```
   Apps (icône grille) > Remove "Apps" filter
   ```

4. **Installer quelyos_branding**
   ```
   Search: "quelyos branding"
   Click: Install
   Wait: ~30 secondes
   ```

5. **Installer quelyos_ecommerce**
   ```
   Search: "quelyos ecommerce"
   Click: Install
   Wait: ~30 secondes
   ```

**Attendu:**
- ✅ Modules apparaissent dans la liste
- ✅ Installation réussie
- ✅ Pas d'erreurs affichées

---

### ✅ Étape 3: Tester quelyos_branding (5 min)

1. **Accéder aux paramètres**
   ```
   Settings > General Settings
   Scroll down: Section "Quelyos Branding"
   ```

2. **Tester Thèmes**
   ```
   Click: "Blue Theme" button
   Verify: Notification "Thème bleu professionnel appliqué"

   Click: "Green Theme" button
   Verify: Notification "Thème vert écologique appliqué"
   ```

3. **Tester Upload Logo**
   ```
   Section "Logos"
   Upload: Un fichier PNG (<2MB, ~1000x250px)
   Click: Save
   Verify: Pas d'erreur, logo sauvegardé
   ```

4. **Tester Validation**
   ```
   Upload: Un fichier trop large (>2MB)
   Verify: Erreur "L'image est trop volumineuse"

   Upload: Un fichier non-image (TXT, PDF)
   Verify: Erreur "Format non autorisé"
   ```

**Attendu:**
- ✅ Thèmes s'appliquent sans erreur
- ✅ Upload logo fonctionne
- ✅ Validation bloque fichiers invalides
- ✅ Messages d'erreur clairs

---

### ✅ Étape 4: Tester quelyos_ecommerce (5 min)

#### Test 1: Products API

```bash
curl -X POST http://localhost:8069/api/ecommerce/products \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Attendu:**
- Code: 200 ou 400 (avec message clair)
- Pas de crash serveur

#### Test 2: Categories API

```bash
curl -X POST http://localhost:8069/api/ecommerce/categories \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Attendu:**
- Code: 200 ou 400 (avec message clair)
- Pas de crash serveur

#### Test 3: Rate Limiting

```bash
# Envoyer 10 requêtes rapides
for i in {1..10}; do
  curl -X POST http://localhost:8069/api/ecommerce/products \
    -H "Content-Type: application/json" \
    -d '{}' &
done
wait
```

**Attendu:**
- Premières requêtes: 200/400
- Dernières requêtes: Message "Trop de requêtes"
- Rate limiting fonctionne

#### Test 4: Input Validation

```bash
# Test avec ID invalide
curl -X POST http://localhost:8069/api/ecommerce/cart/add \
  -H "Content-Type: application/json" \
  -d '{"product_id": "invalid", "quantity": 1}'
```

**Attendu:**
- Erreur de validation
- Message clair sur le problème

---

## 🧪 Tests Automatisés (Optionnel, 10 min)

Si vous voulez exécuter les 168 tests automatisés:

```bash
# Option 1: Tous les tests
docker exec quelyos-odoo odoo-bin --test-enable \
  --stop-after-init -d quelyos \
  -u quelyos_branding,quelyos_ecommerce \
  --log-level=test

# Option 2: Seulement quelyos_branding
docker exec quelyos-odoo odoo-bin --test-enable \
  --stop-after-init -d quelyos \
  -u quelyos_branding \
  --log-level=test

# Option 3: Seulement quelyos_ecommerce
docker exec quelyos-odoo odoo-bin --test-enable \
  --stop-after-init -d quelyos \
  -u quelyos_ecommerce \
  --log-level=test
```

**Durée estimée:** 5-10 minutes
**Attendu:**
- Tests s'exécutent
- Certains peuvent échouer (besoin données de test)
- Pas de crash Python

---

## 📊 Vérification Logs (2 min)

```bash
# Voir erreurs/warnings
docker logs quelyos-odoo 2>&1 | grep -E "(ERROR|CRITICAL)" | tail -20

# Voir chargement modules
docker logs quelyos-odoo 2>&1 | grep -E "quelyos" | tail -20

# Suivre en temps réel
docker logs -f quelyos-odoo
```

**Attendu:**
- Pas d'erreurs CRITICAL
- Warnings mineurs OK (deprecations)
- Modules quelyos chargés

---

## ✅ Checklist Finale

Cochez après validation:

### Infrastructure
- [ ] Docker containers UP
- [ ] Odoo accessible (http://localhost:8069)
- [ ] Pas d'erreurs critiques dans logs

### Modules
- [ ] quelyos_branding installé
- [ ] quelyos_ecommerce installé
- [ ] Pas d'erreurs au démarrage

### quelyos_branding
- [ ] Settings > Quelyos Branding accessible
- [ ] Thèmes s'appliquent correctement
- [ ] Upload logo fonctionne
- [ ] Validation rejette fichiers invalides
- [ ] Messages d'erreur clairs

### quelyos_ecommerce
- [ ] API endpoints répondent
- [ ] Rate limiting fonctionne
- [ ] Input validation fonctionne
- [ ] Pas de crash sur requêtes invalides

---

## 🐛 Troubleshooting

### Problème: Modules n'apparaissent pas dans Apps

**Solution:**
```bash
# 1. Vérifier fichiers présents
ls backend/addons/ | grep quelyos

# 2. Redémarrer Odoo
docker-compose -f backend/docker-compose.yml restart odoo

# 3. Mettre à jour liste modules
Apps > Update Apps List
```

### Problème: Erreur au chargement module

**Solution:**
```bash
# 1. Voir logs détaillés
docker logs quelyos-odoo 2>&1 | grep -A 10 -B 10 "quelyos"

# 2. Vérifier syntaxe Python
cd backend/addons/quelyos_branding
python3 -m py_compile models/**/*.py

# 3. Redémarrer proprement
docker-compose -f backend/docker-compose.yml down
docker-compose -f backend/docker-compose.yml up -d
```

### Problème: API retourne toujours 400

**Solution:**
```bash
# Normal si modules pas installés
# Installer via: Apps > Search "Quelyos" > Install

# Vérifier installation
docker exec quelyos-odoo odoo-bin shell -d quelyos << 'EOF'
module = env['ir.module.module'].search([('name', 'in', ['quelyos_branding', 'quelyos_ecommerce'])])
for m in module:
    print(f"{m.name}: {m.state}")
EOF
```

### Problème: Tests ne s'exécutent pas

**Solution:**
```bash
# Créer base de test
docker exec quelyos-odoo odoo-bin -d test_quelyos --init=base --stop-after-init

# Exécuter tests sur base de test
docker exec quelyos-odoo odoo-bin --test-enable \
  --stop-after-init -d test_quelyos \
  -u quelyos_branding \
  --log-level=test
```

---

## 📞 Support

Si vous rencontrez des problèmes:

1. **Check logs:**
   ```bash
   docker logs quelyos-odoo 2>&1 | tail -100
   ```

2. **Check documentation:**
   - [VALIDATION_REPORT.md](VALIDATION_REPORT.md)
   - [REFACTORING_COMPLETE_SUMMARY.md](REFACTORING_COMPLETE_SUMMARY.md)

3. **Vérifier commits:**
   ```bash
   git log --oneline -5
   ```

4. **Status Docker:**
   ```bash
   docker ps -a
   docker-compose -f backend/docker-compose.yml ps
   ```

---

## 🎯 Après les Tests

Une fois les tests manuels terminés:

1. **Noter résultats**
   - Quels tests ont réussi?
   - Quels problèmes rencontrés?

2. **Prochaines étapes**
   - [ ] Activation CSRF (suivre CSRF_ACTIVATION_GUIDE.md)
   - [ ] Setup Redis pour rate limiting
   - [ ] Setup monitoring (ELK/Datadog)
   - [ ] Load testing (target: 100 req/s)

3. **Documentation**
   - Mettre à jour VALIDATION_REPORT.md avec résultats
   - Noter bugs/améliorations dans un fichier TODO

---

**Temps total estimé:** 15-30 minutes
**Prérequis:** Docker, Odoo 19.0, modules quelyos installés

**Bon tests! 🚀**
