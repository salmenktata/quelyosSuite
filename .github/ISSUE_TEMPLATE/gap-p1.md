---
name: Gap P1 - Parité Fonctionnelle
about: Template pour documenter et tracker un gap P1 (Important) de parité fonctionnelle Odoo ↔ Quelyos
title: '[P1] '
labels: 'parité, P1, enhancement'
assignees: ''
---

## 📋 Informations Gap

**Module concerné** : [Produits / Commandes / Clients / Panier / Stock / Livraison / Paiement / Coupons / Analytics / Factures / Featured]

**Priorité** : 🟡 P1 (Important)

**Effort estimé** : [0.5 jour / 1 jour / 2 jours / 3-4 jours]

**Impact métier** : ⭐⭐⭐ [Haute / Moyenne / Basse]

**Sprint recommandé** : [Sprint 1 - Production MVP / Sprint 2 - UX Premium / Sprint 3 - Optimisation]

---

## 🎯 Description de la Fonctionnalité Odoo

**Fonctionnalité Odoo native** :
[Décrire précisément la fonctionnalité telle qu'elle existe dans Odoo]

**Modèle(s) Odoo utilisé(s)** :
- `[modèle.odoo]` (ex: `product.template`, `sale.order`, etc.)

**Champs Odoo concernés** :
- `champ_1` : Description
- `champ_2` : Description

---

## 🔴 Gap Actuel dans Quelyos

**Ce qui manque** :
[Décrire ce qui n'est pas implémenté ou incomplet]

**Impact utilisateur** :
[Expliquer en quoi l'absence de cette fonctionnalité impacte l'utilisateur]

**Workaround actuel** :
[Existe-t-il une solution de contournement ? Si oui, laquelle ?]

---

## ✅ Solution Proposée

### Backend API

**Endpoint(s) à créer/modifier** :
- [ ] `POST /api/ecommerce/[module]/[action]` - [Description]

**Paramètres** :
```json
{
  "param1": "type",
  "param2": "type"
}
```

**Réponse attendue** :
```json
{
  "data": {
    "...": "..."
  }
}
```

**Modèles Odoo à exploiter** :
- `[modèle.odoo].search_read([...])` pour [description]
- `[modèle.odoo].write({...})` pour [description]

**Approche "surcouche" respectée** :
- [ ] Aucune modification schéma Odoo ✅
- [ ] Utilisation exclusive modèles existants ✅
- [ ] API JSON-RPC uniquement ✅

### Frontend / Backoffice

**Page(s) à créer/modifier** :
- [ ] `backoffice/src/pages/[Page].tsx` - [Description]
- [ ] `frontend/src/app/[route]/page.tsx` - [Description]

**Composant(s) UI** :
- [ ] `[ComposantName].tsx` - [Description et responsabilité]

**Hook(s) React Query** :
- [ ] `use[HookName]()` dans `backoffice/src/hooks/use[Module].ts`

**Types TypeScript** :
- [ ] Ajouter types dans `backoffice/src/types/index.ts` ou `frontend/src/types/index.ts`

---

## 📝 Spécifications Techniques

### Étapes d'Implémentation

1. **Backend** :
   - [ ] Créer endpoint(s) dans `backend/addons/quelyos_api/controllers/main.py`
   - [ ] Tester endpoint avec Postman / curl
   - [ ] Valider réponses JSON conformes

2. **Types TypeScript** :
   - [ ] Définir interfaces dans `types/index.ts`
   - [ ] Valider cohérence avec réponse API

3. **API Client** :
   - [ ] Ajouter méthode(s) dans `lib/api.ts`
   - [ ] Tester appel API

4. **Hook React Query** :
   - [ ] Créer/modifier hook dans `hooks/use[Module].ts`
   - [ ] Gérer loading, error, success states

5. **Interface Utilisateur** :
   - [ ] Créer/modifier page(s) et composant(s)
   - [ ] Intégrer hook React Query
   - [ ] Gérer états loading (Skeleton), error, empty state
   - [ ] Feedback utilisateur (Toast success/error)
   - [ ] Valider UX moderne 2026 (CLAUDE.md section UX/UI)

6. **Tests** :
   - [ ] Test manuel complet du workflow
   - [ ] Vérifier responsive (mobile, tablette, desktop)
   - [ ] Vérifier mode sombre
   - [ ] Vérifier accessibilité (navigation clavier, ARIA)

7. **Documentation** :
   - [ ] Update README.md si nouveau endpoint
   - [ ] Update LOGME.md avec étape réalisée
   - [ ] Ré-exécuter `/parity` pour valider progression

---

## 🧪 Critères d'Acceptation

- [ ] Fonctionnalité implémentée conforme à Odoo natif
- [ ] Backend endpoint(s) opérationnel(s) et testé(s)
- [ ] Interface utilisateur complète (backoffice ET/OU frontend selon besoin)
- [ ] Feedback utilisateur clair (loading, success, error)
- [ ] UX moderne respectée (WCAG 2.1 AA, responsive, dark mode)
- [ ] Aucune modification schéma Odoo (approche "surcouche" respectée)
- [ ] Documentation mise à jour (README.md, LOGME.md)
- [ ] Tests manuels passés (workflow complet end-to-end)

---

## 📚 Références

**Audit de parité source** : `/parity` 2026-01-24

**Documentation Odoo** :
- [Lien vers documentation Odoo officielle du modèle concerné]

**Sprint Plan** : [PARITY_SPRINT_PLAN.md](../../PARITY_SPRINT_PLAN.md)

**CLAUDE.md - Règles de parité** : [Section "Principe Fondamental : Parité Fonctionnelle Totale avec Odoo"](../../CLAUDE.md#principe-fondamental--parité-fonctionnelle-totale-avec-odoo)

---

## 💬 Notes Complémentaires

[Ajouter ici toute information complémentaire utile : dépendances avec autres gaps, contraintes techniques particulières, questions ouvertes, etc.]
