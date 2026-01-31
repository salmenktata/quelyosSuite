# Spécifications Techniques - Theme Builder Visuel

## 🎯 Objectif

Créer une interface drag & drop permettant aux designers de créer des thèmes visuellement sans coder, avec preview temps réel et export JSON.

---

## 🎨 Fonctionnalités MVP

### 1. Éditeur de Couleurs
**Interface** :
- Palette complète avec color picker
- 4 couleurs principales : primary, secondary, accent, background
- Preview en temps réel dans preview pane
- Presets de couleurs (Material, Tailwind, Custom)

**Composants** :
```tsx
<ColorPicker
  label="Primary Color"
  value={colors.primary}
  onChange={(color) => updateColors({ primary: color })}
  presets={['#3b82f6', '#8b5cf6', '#ec4899']}
/>
```

**Output JSON** :
```json
{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#10b981",
    "accent": "#f59e0b",
    "background": "#ffffff"
  }
}
```

---

### 2. Sélecteur Typographie
**Interface** :
- Liste Google Fonts populaires (50+ fonts)
- Preview texte avec la font sélectionnée
- 2 fonts max : headings + body
- Weight sélection (400, 500, 600, 700, 800)

**Composants** :
```tsx
<FontSelector
  label="Headings Font"
  value={typography.headings}
  onChange={(font) => updateTypography({ headings: font })}
  fonts={googleFonts}
  preview="The quick brown fox"
/>
```

**Output JSON** :
```json
{
  "typography": {
    "headings": "Playfair Display",
    "headingsWeight": 700,
    "body": "Inter",
    "bodyWeight": 400
  }
}
```

---

### 3. Drag & Drop Sections
**Interface** :
- Sidebar gauche : Catalogue 10 sections (VideoHero, FeaturedProducts, etc.)
- Zone centrale : Canvas homepage avec sections ordonnées
- Drag depuis catalogue → Canvas
- Réorganiser sections dans canvas (drag up/down)
- Supprimer section (icône X)

**Bibliothèque DnD** :
- `@dnd-kit/core` (moderne, accessible, performant)
- `@dnd-kit/sortable` (réorganisation)
- `@dnd-kit/utilities` (helpers)

**Composants** :
```tsx
<DndContext onDragEnd={handleDragEnd}>
  <SectionsPalette sections={availableSections} />
  <CanvasArea sections={homepageSections} />
</DndContext>
```

**Output JSON** :
```json
{
  "layouts": {
    "homepage": {
      "sections": [
        { "type": "video-hero", "variant": "fullscreen" },
        { "type": "featured-products", "variant": "grid-4cols" },
        { "type": "newsletter", "variant": "centered" }
      ]
    }
  }
}
```

---

### 4. Configuration Sections
**Interface** :
- Cliquer sur section dans canvas → Panel droite config
- Props spécifiques par section (variant, config object)
- Exemple VideoHero : height, autoplay, loop, overlay
- Sauvegarde automatique changements

**Composants** :
```tsx
<SectionConfigPanel section={selectedSection}>
  <VariantSelector
    options={['fullscreen', 'split-screen', 'minimal']}
    value={section.variant}
    onChange={updateSectionVariant}
  />
  <ConfigFields config={section.config} />
</SectionConfigPanel>
```

**Output JSON** :
```json
{
  "type": "video-hero",
  "variant": "fullscreen",
  "config": {
    "height": "90vh",
    "autoplay": true,
    "loop": true,
    "overlay": 0.3
  }
}
```

---

### 5. Preview Temps Réel
**Interface** :
- Iframe isolé avec vitrine-client rendu
- Applique theme.json en temps réel
- Toggle desktop / tablet / mobile
- Refresh manuel si besoin

**Architecture** :
```tsx
<PreviewPane>
  <DeviceToggle value={device} onChange={setDevice} />
  <iframe
    src="/preview?theme=temp-builder"
    width={device === 'mobile' ? '375px' : '100%'}
  />
</PreviewPane>
```

**Endpoint preview** :
```typescript
// dashboard-client/src/pages/store/themes/preview.tsx
export default function ThemePreview() {
  const themeConfig = localStorage.getItem('builder-temp-theme');
  return <ThemeRenderer config={JSON.parse(themeConfig)} />;
}
```

---

### 6. Export / Import JSON
**Interface** :
- Bouton "Export JSON" → Télécharge fichier `.json`
- Bouton "Import JSON" → Upload fichier → Parse + charge builder
- Bouton "Save to Odoo" → Enregistre comme soumission draft
- Validation JSON Schema avant sauvegarde

**Composants** :
```tsx
<ActionsToolbar>
  <Button onClick={exportJSON}>
    <Download /> Export JSON
  </Button>
  <Button onClick={() => fileInputRef.current?.click()}>
    <Upload /> Import JSON
  </Button>
  <Button onClick={saveToOdoo} variant="primary">
    <Save /> Save to Odoo
  </Button>
</ActionsToolbar>
```

**Validation** :
```typescript
import Ajv from 'ajv';
import themeSchema from '@/schemas/theme.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(themeSchema);

if (!validate(themeConfig)) {
  toast.error('Invalid theme config', { description: validate.errors[0].message });
  return;
}
```

---

## 🏗️ Architecture Composants

### Structure Fichiers
```
dashboard-client/src/pages/store/themes/builder.tsx (page principale)
dashboard-client/src/components/theme-builder/
├── ColorPicker.tsx
├── FontSelector.tsx
├── SectionsPalette.tsx
├── CanvasArea.tsx
├── SectionCard.tsx
├── SectionConfigPanel.tsx
├── PreviewPane.tsx
├── ActionsToolbar.tsx
├── DeviceToggle.tsx
└── BuilderContext.tsx (state management)
```

### State Management
**Context API pour builder** :
```typescript
interface BuilderState {
  colors: ThemeColors;
  typography: ThemeTypography;
  sections: SectionConfig[];
  selectedSection: SectionConfig | null;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
}

const BuilderContext = createContext<{
  state: BuilderState;
  updateColors: (colors: Partial<ThemeColors>) => void;
  updateTypography: (typo: Partial<ThemeTypography>) => void;
  addSection: (section: SectionConfig) => void;
  removeSection: (index: number) => void;
  reorderSections: (oldIndex: number, newIndex: number) => void;
  selectSection: (section: SectionConfig | null) => void;
  exportJSON: () => void;
  importJSON: (json: string) => void;
  saveToOdoo: () => Promise<void>;
}>(null);
```

---

## 🎨 Design UI/UX

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Theme Builder                    [Export] [Save]    │
├─────────┬───────────────────────────────────┬───────────────┤
│         │                                   │               │
│ PALETTE │          CANVAS                   │    CONFIG     │
│         │                                   │               │
│ Colors  │  ┌─────────────────────────┐     │ Section: Hero │
│ ■ Pri   │  │     Video Hero          │     │               │
│ ■ Sec   │  │     [Fullscreen]        │     │ Variant:      │
│ ■ Acc   │  └─────────────────────────┘     │ • Fullscreen  │
│         │                                   │ ○ Split       │
│ Fonts   │  ┌─────────────────────────┐     │               │
│ Aa Head │  │  Featured Products      │     │ Config:       │
│ Aa Body │  │  [Grid 4 cols]          │     │ Height: 90vh  │
│         │  └─────────────────────────┘     │ Autoplay: ✓   │
│ Sections│                                   │               │
│ + Hero  │  ┌─────────────────────────┐     │               │
│ + Prod  │  │    Newsletter           │     │               │
│ + News  │  │    [Centered]           │     │               │
│ + FAQ   │  └─────────────────────────┘     │               │
│         │                                   │               │
│         │  [Preview]                        │               │
│         │  Desktop | Tablet | Mobile        │               │
│         │  ┌──────────────────────────┐    │               │
│         │  │                          │    │               │
│         │  │  LIVE PREVIEW IFRAME     │    │               │
│         │  │                          │    │               │
│         │  └──────────────────────────┘    │               │
└─────────┴───────────────────────────────────┴───────────────┘
```

### Responsive
- **Desktop** : 3 colonnes (Palette 250px | Canvas flex-1 | Config 300px)
- **Tablet** : 2 colonnes (Palette + Canvas | Config en drawer)
- **Mobile** : 1 colonne (Tabs : Palette | Canvas | Config)

---

## 🔧 Technologies

### Dépendances Nouvelles
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "ajv": "^8.12.0",
  "react-colorful": "^5.6.1",
  "file-saver": "^2.0.5"
}
```

### Dépendances Existantes
- React 19
- TypeScript 5
- Tailwind CSS 4
- Lucide React (icônes)
- React Query (API calls)

---

## 📊 User Flows

### Flow 1 : Créer Thème from Scratch
1. User clique "Create New Theme" dans `/store/themes`
2. Redirigé vers `/store/themes/builder`
3. **Étape 1** : Choisit couleurs (palette primary/secondary/accent)
4. **Étape 2** : Sélectionne fonts (headings + body)
5. **Étape 3** : Drag & drop sections homepage (Hero, Products, Newsletter)
6. **Étape 4** : Configure chaque section (variants, props)
7. **Étape 5** : Preview temps réel dans iframe
8. **Étape 6** : Click "Save to Odoo" → Créé soumission draft
9. Redirigé vers `/store/themes/my-submissions`

### Flow 2 : Modifier Thème Existant
1. User clique "Edit" sur soumission draft dans `/store/themes/my-submissions`
2. Redirigé vers `/store/themes/builder?submission=123`
3. Builder charge config JSON existante
4. User modifie couleurs/fonts/sections
5. Preview mis à jour en temps réel
6. Click "Save" → Update soumission
7. Redirigé vers `/store/themes/my-submissions`

### Flow 3 : Import JSON Externe
1. User a un fichier `custom-theme.json` (créé manuellement ou par AI)
2. Va sur `/store/themes/builder`
3. Click "Import JSON"
4. Upload fichier
5. Builder parse et valide JSON
6. Si valide : Charge config dans builder
7. Si invalide : Toast erreur avec détails
8. User peut modifier et save

---

## 🧪 Tests

### Tests Unitaires
```typescript
// ColorPicker.test.tsx
describe('ColorPicker', () => {
  it('should update color on change', () => {
    const onChange = jest.fn();
    render(<ColorPicker value="#000" onChange={onChange} />);
    // Simulate color change
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });
});

// BuilderContext.test.tsx
describe('BuilderContext', () => {
  it('should add section to canvas', () => {
    const { result } = renderHook(() => useBuilder());
    act(() => {
      result.current.addSection({ type: 'hero', variant: 'fullscreen' });
    });
    expect(result.current.state.sections).toHaveLength(1);
  });
});
```

### Tests E2E (Playwright)
```typescript
test('User can create theme and save', async ({ page }) => {
  await page.goto('/store/themes/builder');

  // Choisir couleur
  await page.click('[data-testid="primary-color-picker"]');
  await page.fill('input[type="color"]', '#3b82f6');

  // Drag section
  await page.dragAndDrop('[data-section="hero"]', '[data-canvas]');

  // Save
  await page.click('button:has-text("Save to Odoo")');

  // Vérifier redirection
  await expect(page).toHaveURL('/store/themes/my-submissions');
});
```

---

## 🚀 Implémentation Par Phases

### Phase 1 : Infrastructure (2-3h)
- [x] Structure fichiers composants
- [x] BuilderContext + state management
- [x] Layout 3 colonnes
- [x] Routing `/store/themes/builder`

### Phase 2 : Éditeurs Basiques (3-4h)
- [ ] ColorPicker avec react-colorful
- [ ] FontSelector avec Google Fonts list
- [ ] ActionsToolbar (Export/Import/Save)
- [ ] Validation JSON Schema

### Phase 3 : Drag & Drop (4-5h)
- [ ] SectionsPalette avec @dnd-kit
- [ ] CanvasArea sortable
- [ ] Add/Remove/Reorder sections
- [ ] SectionCard composant

### Phase 4 : Configuration (2-3h)
- [ ] SectionConfigPanel
- [ ] Variant selector
- [ ] Config fields dynamiques par section

### Phase 5 : Preview (3-4h)
- [ ] PreviewPane iframe
- [ ] DeviceToggle responsive
- [ ] Endpoint `/preview`
- [ ] Hot reload preview on changes

### Phase 6 : Integration Backend (2h)
- [ ] Endpoint `POST /api/themes/builder/save`
- [ ] Endpoint `GET /api/themes/builder/load/:id`
- [ ] Validation côté serveur

### Phase 7 : Polish & Tests (2-3h)
- [ ] Dark mode complet
- [ ] Animations transitions
- [ ] Loading states
- [ ] Error handling
- [ ] Tests E2E

**Total estimé** : 18-24h développement

---

## 📈 Métriques de Succès

### Fonctionnelles
- ✅ User peut créer thème complet sans coder
- ✅ Preview temps réel fonctionne
- ✅ Export JSON valide (JSON Schema)
- ✅ Import JSON parse correctement
- ✅ Save to Odoo créé soumission

### Performance
- ✅ Drag & drop fluide (60 FPS)
- ✅ Preview refresh < 500ms
- ✅ Save to Odoo < 2s

### UX
- ✅ Interface intuitive (pas de formation requise)
- ✅ Responsive mobile
- ✅ Dark mode
- ✅ Undo/Redo (future)

---

## 🎯 Différenciation Concurrents

**Quelyos Builder vs Concurrents** :

| Feature | Quelyos | Shopify | Webflow | WordPress |
|---------|---------|---------|---------|-----------|
| Drag & Drop Sections | ✅ | ❌ | ✅ | ⚠️ (limité) |
| Visual Color Editor | ✅ | ⚠️ (basique) | ✅ | ⚠️ |
| Live Preview | ✅ | ❌ | ✅ | ❌ |
| JSON Export | ✅ | ❌ | ❌ | ❌ |
| AI Generation | ✅ | ❌ | ❌ | ❌ |
| Gratuit | ✅ | ❌ ($29+) | ❌ ($12+) | ✅ |

**Message marketing** :
> "Quelyos : Le seul SaaS e-commerce avec builder de thème visuel gratuit, AI generator intégré, et export JSON standard. Créez votre boutique parfaite en 10 minutes, sans coder."

---

## 🔒 Sécurité

### Validation JSON
- Valider contre JSON Schema côté client ET serveur
- Sanitize config_json avant sauvegarde DB
- Limiter taille JSON (max 1 MB)

### XSS Prevention
- Pas d'eval() ou de dangerouslySetInnerHTML
- Iframe sandbox pour preview
- CSP headers strictes

### CSRF Protection
- Token CSRF sur endpoint save
- Auth requise pour save/load

---

## 📚 Documentation

### Guide Utilisateur
Créer guide `THEME_BUILDER_USER_GUIDE.md` :
1. Introduction au builder
2. Créer votre premier thème
3. Personnaliser couleurs et fonts
4. Ajouter et configurer sections
5. Preview et export
6. Soumettre pour validation

### Guide Développeur
Créer guide `THEME_BUILDER_DEV_GUIDE.md` :
1. Architecture composants
2. Ajouter nouvelles sections
3. Étendre config sections
4. Tests et validation
5. Déploiement

---

**Builder visuel = Feature killer différenciation Quelyos !** 🎨
