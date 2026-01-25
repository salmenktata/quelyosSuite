# @quelyos/rh-core

Package partagé pour le module RH (Ressources Humaines) de Quelyos.

## 📦 Contenu

Ce package contient tous les types TypeScript, schémas de validation Zod, et utilitaires partagés entre les différentes applications RH de Quelyos :

- **API Backend** (`apps/api`)
- **Application mobile React Native** (`apps/mobile-rh`)
- **Dashboard web Next.js** (`apps/rh-web`)

## 🚀 Installation

```bash
npm install @quelyos/rh-core
```

## 📚 Utilisation

### Types TypeScript

```typescript
import {
  Employee,
  Pointage,
  Demande,
  EmployeeStatus,
  PointageType
} from '@quelyos/rh-core';

const employee: Employee = {
  id: 1,
  companyId: 1,
  firstName: 'Ahmed',
  lastName: 'Ben Ali',
  employeeNumber: 'EMP-001',
  status: EmployeeStatus.ACTIVE,
  // ...
};
```

### Validation avec Zod

```typescript
import { createEmployeeSchema, createPointageSchema } from '@quelyos/rh-core';

// Valider les données d'entrée
const result = createEmployeeSchema.safeParse({
  employeeNumber: 'EMP-001',
  firstName: 'Ahmed',
  lastName: 'Ben Ali',
  hireDate: new Date(),
});

if (result.success) {
  console.log('Données valides:', result.data);
} else {
  console.error('Erreurs:', result.error);
}
```

### Utilitaires

```typescript
import {
  calculateDistance,
  isWithinRadius,
  formatDate,
  workdaysBetween,
  LIMITS
} from '@quelyos/rh-core';

// Calcul de distance GPS
const distance = calculateDistance(
  { latitude: 36.8065, longitude: 10.1815 }, // Tunis
  { latitude: 36.8189, longitude: 10.1658 }  // Carthage
);

// Validation de geofencing
const isValid = isWithinRadius(
  userLocation,
  storeLocation,
  LIMITS.GEOFENCING_DEFAULT_RADIUS_METERS
);

// Formatage de dates
const dateStr = formatDate(new Date()); // "08/01/2026"

// Calcul de jours ouvrés
const days = workdaysBetween(startDate, endDate);
```

## 📖 Structure

```
src/
├── types/           # Types TypeScript
│   ├── enums.ts
│   ├── employee.ts
│   ├── pointage.ts
│   ├── demande.ts
│   ├── shift.ts
│   ├── store.ts
│   ├── team.ts
│   ├── contract.ts
│   └── document.ts
│
├── schemas/         # Schémas de validation Zod
│   ├── employee.schema.ts
│   ├── pointage.schema.ts
│   ├── demande.schema.ts
│   ├── shift.schema.ts
│   ├── store.schema.ts
│   ├── team.schema.ts
│   ├── contract.schema.ts
│   └── document.schema.ts
│
└── utils/           # Utilitaires
    ├── date.utils.ts      # Manipulation de dates
    ├── geo.utils.ts       # Calculs GPS
    └── constants.ts       # Constantes
```

## 🔑 Concepts Clés

### Entités Principales

- **Store** : Magasin/site de l'entreprise
- **Team** : Équipe au sein d'un magasin
- **Employee** : Employé avec QR code unique
- **Pointage** : Check-in/check-out avec GPS
- **Demande** : Congés, absences, avances
- **Shift** : Planning de travail
- **Contract** : Contrat de travail (CDI, CDD, Stage, Intérim)
- **Document** : Documents RH stockés en S3

### Workflow d'Approbation

Les demandes (congés, avances) suivent un workflow à 2 niveaux :

```
PENDING → APPROVED_TEAM → APPROVED_RH
         ↓
      REJECTED
```

### Rôles RH

- **RH_ADMIN** : Responsable RH (accès total)
- **RH_MANAGER** : Responsable d'équipe (gestion équipe)
- **RH_AGENT** : Employé (lecture seule)

## 🛠️ Développement

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## 📝 Exemples

### Validation de Pointage

```typescript
import {
  createPointageSchema,
  validateGeofencing,
  PointageType
} from '@quelyos/rh-core';

const pointageData = {
  type: PointageType.ENTREE,
  latitude: 36.8065,
  longitude: 10.1815,
  qrCodeScanned: 'STORE-1-123456',
};

// 1. Validation du schéma
const validated = createPointageSchema.parse(pointageData);

// 2. Validation GPS
const geoValidation = validateGeofencing(
  { latitude: validated.latitude!, longitude: validated.longitude! },
  storeLocation,
  100 // rayon en mètres
);

if (!geoValidation.isValid) {
  console.error(geoValidation.message);
}
```

### Calcul de Congés

```typescript
import { calculateLeaveDays, workdaysBetween } from '@quelyos/rh-core';

const startDate = new Date('2026-07-01');
const endDate = new Date('2026-07-15');

// Jours calendaires
const totalDays = calculateLeaveDays(startDate, endDate); // 15 jours

// Jours ouvrés uniquement
const workdays = workdaysBetween(startDate, endDate); // ~11 jours
```

## 📄 License

MIT

## 👥 Auteur

Quelyos Team
