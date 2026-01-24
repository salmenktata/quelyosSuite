# Guide Dark Mode - Backoffice Quelyos

## Configuration

Le dark mode est configuré avec Tailwind CSS en mode `class`.

### Configuration Tailwind
```js
// tailwind.config.js
darkMode: 'class'
```

### ThemeContext
Le `ThemeContext` gère l'état du thème et applique la classe `dark` sur `<html>`.

```tsx
// Utilisation
import { useTheme } from '../contexts/ThemeContext'

const { theme, toggleTheme } = useTheme()
```

## Conventions de style

### Pages avec Layout
Les pages qui utilisent le composant `Layout` n'ont PAS besoin de définir leur propre fond.
Le `Layout` gère déjà le fond de page.

```tsx
// ✅ CORRECT
export default function MyPage() {
  return (
    <Layout>
      <div className="p-8">
        {/* Contenu sans bg-* car hérité du Layout */}
      </div>
    </Layout>
  )
}
```

### Pages sans Layout (ex: Login)
Les pages qui n'utilisent PAS le `Layout` doivent définir leur propre fond.

```tsx
// ✅ CORRECT
export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Contenu */}
    </div>
  )
}
```

### Cartes et conteneurs
Toutes les cartes et conteneurs avec fond doivent avoir une variante dark.

```tsx
// ✅ CORRECT - Fond avec variante dark
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
  {/* Contenu */}
</div>

// ✅ CORRECT - Bordures avec variante dark
<div className="border border-gray-200 dark:border-gray-700">
  {/* Contenu */}
</div>

// ✅ CORRECT - Texte avec variante dark
<h1 className="text-gray-900 dark:text-white">Titre</h1>
<p className="text-gray-600 dark:text-gray-400">Description</p>
```

## Palette de couleurs recommandée

### Fonds
- **Page** : `bg-gray-50 dark:bg-gray-900`
- **Carte/Container** : `bg-white dark:bg-gray-800`
- **Survol** : `hover:bg-gray-50 dark:hover:bg-gray-700`
- **Actif/Sélectionné** : `bg-indigo-50 dark:bg-indigo-900/30`

### Bordures
- **Légère** : `border-gray-200 dark:border-gray-700`
- **Diviseur** : `divide-gray-200 dark:divide-gray-700`

### Texte
- **Titre principal** : `text-gray-900 dark:text-white`
- **Texte normal** : `text-gray-700 dark:text-gray-300`
- **Texte secondaire** : `text-gray-600 dark:text-gray-400`
- **Texte tertiaire** : `text-gray-500 dark:text-gray-500`

### Couleurs d'accent
- **Primary** : `text-indigo-600 dark:text-indigo-400`
- **Success** : `text-green-600 dark:text-green-400`
- **Warning** : `text-amber-600 dark:text-amber-400`
- **Error** : `text-red-600 dark:text-red-400`
- **Info** : `text-blue-600 dark:text-blue-400`

## Checklist avant commit

- [ ] Toutes les classes `bg-white` ont un `dark:bg-gray-*`
- [ ] Toutes les classes `bg-gray-50` ont un `dark:bg-gray-900`
- [ ] Toutes les bordures ont une variante dark
- [ ] Tous les textes ont une variante dark
- [ ] Les composants sont testés en mode clair ET sombre
- [ ] Pas de fond blanc persistant en mode sombre

## Debugging

### Vérifier le thème actuel
```js
// Console navigateur
localStorage.getItem('quelyos-backoffice-theme') // 'light' ou 'dark'
document.documentElement.classList // doit contenir 'dark' ou 'light'
```

### Forcer le dark mode
```js
// Console navigateur
localStorage.setItem('quelyos-backoffice-theme', 'dark')
location.reload()
```

### Forcer le light mode
```js
// Console navigateur
localStorage.setItem('quelyos-backoffice-theme', 'light')
location.reload()
```

## Erreurs courantes

### ❌ Oublier la variante dark
```tsx
// MAUVAIS
<div className="bg-white">

// BON
<div className="bg-white dark:bg-gray-800">
```

### ❌ Utiliser des couleurs absolues
```tsx
// MAUVAIS
<div className="bg-white text-black">

// BON
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### ❌ Dupliquer les fonds de page
```tsx
// MAUVAIS - Double fond dans App.tsx ET Layout.tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <Layout> {/* Layout a déjà son fond */}

// BON - Un seul fond dans Layout.tsx
<Layout>
  {/* Pas de fond ici */}
</Layout>
```

## Tests automatiques

```bash
# Vérifier les classes bg-white sans dark: dans les pages
cd backoffice
find src/pages -name "*.tsx" -exec grep -l "bg-white[^-]" {} \; | while read file; do
  if ! grep -q "dark:bg-gray" "$file"; then
    echo "⚠️  $file - Manque dark mode"
  fi
done

# Vérifier les composants communs
find src/components/common -name "*.tsx" -exec grep -l "bg-white[^-]" {} \; | while read file; do
  if ! grep -q "dark:bg-gray" "$file"; then
    echo "⚠️  $file - Manque dark mode"
  fi
done
```
