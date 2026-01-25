# @quelyos/hooks

> Hooks React partagés pour toutes les applications Quelyos

## 🎯 Hooks disponibles

### Window & Responsive

- `useWindowSize` - Dimensions de la fenêtre
- `useBreakpoint` - Détection mobile/tablet/desktop

### Storage

- `useLocalStorage` - localStorage avec sync inter-tabs

### Timing

- `useDebounce` - Debounce d'une valeur

### DOM Interactions

- `useClickOutside` - Détecte les clics en dehors d'un élément
- `useScroll` - Position du scroll

### Lifecycle

- `useMounted` - État de montage du component

### Utilities

- `useCopyToClipboard` - Copie dans le presse-papier
- `useOnline` - Détection online/offline
- `useKeyPress` - Détection de touche pressée

## 🚀 Installation

```bash
npm install @quelyos/hooks
```

## 📚 Usage

### useWindowSize

```typescript
import { useWindowSize } from "@quelyos/hooks";

function MyComponent() {
  const { width, height } = useWindowSize();

  return <div>Window: {width}x{height}</div>;
}
```

### useBreakpoint

```typescript
import { useBreakpoint } from "@quelyos/hooks";

function MyComponent() {
  const { isMobile, isTablet, isDesktop, type, width } = useBreakpoint();

  if (isMobile) return <MobileView />;
  if (isTablet) return <TabletView />;
  return <DesktopView />;
}
```

### useLocalStorage

```typescript
import { useLocalStorage } from "@quelyos/hooks";

function MyComponent() {
  const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Toggle theme: {theme}
    </button>
  );
}
```

### useDebounce

```typescript
import { useDebounce } from "@quelyos/hooks";
import { useState, useEffect } from "react";

function SearchComponent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    // Cette requête ne sera faite que 500ms après la dernière frappe
    if (debouncedSearch) {
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

### useClickOutside

```typescript
import { useClickOutside } from "@quelyos/hooks";
import { useRef, useState } from "react";

function Dropdown() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref}>
      <button onClick={() => setOpen(!open)}>Toggle</button>
      {open && <div>Dropdown content</div>}
    </div>
  );
}
```

### useScroll

```typescript
import { useScroll } from "@quelyos/hooks";

function ScrollIndicator() {
  const { x, y } = useScroll();

  return <div>Scroll position: {y}px</div>;
}
```

### useMounted

```typescript
import { useMounted } from "@quelyos/hooks";

function MyComponent() {
  const mounted = useMounted();

  // Évite les erreurs de hydration avec des valeurs qui changent côté client
  if (!mounted) return <div>Loading...</div>;

  return <div>{localStorage.getItem("user")}</div>;
}
```

### useCopyToClipboard

```typescript
import { useCopyToClipboard } from "@quelyos/hooks";

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button onClick={() => copy(text)}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

### useOnline

```typescript
import { useOnline } from "@quelyos/hooks";

function ConnectionStatus() {
  const online = useOnline();

  return (
    <div className={online ? "text-green-500" : "text-red-500"}>
      {online ? "Online" : "Offline"}
    </div>
  );
}
```

### useKeyPress

```typescript
import { useKeyPress } from "@quelyos/hooks";
import { useEffect } from "react";

function KeyboardShortcuts() {
  const escapePressed = useKeyPress("Escape");
  const enterPressed = useKeyPress("Enter");

  useEffect(() => {
    if (escapePressed) {
      closeModal();
    }
  }, [escapePressed]);

  useEffect(() => {
    if (enterPressed) {
      submitForm();
    }
  }, [enterPressed]);

  return <div>Press ESC to close, Enter to submit</div>;
}
```

## 🔧 API Reference

### useWindowSize

```typescript
interface WindowSize {
  width: number;
  height: number;
}
function useWindowSize(): WindowSize;
```

### useBreakpoint

```typescript
type BreakpointType = "mobile" | "tablet" | "desktop";

interface Breakpoint {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  type: BreakpointType;
  width: number;
}

function useBreakpoint(): Breakpoint;
```

Breakpoints :

- **Mobile** : < 768px
- **Tablet** : 768px - 1023px
- **Desktop** : ≥ 1024px

### useLocalStorage

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void];
```

### useDebounce

```typescript
function useDebounce<T>(value: T, delay?: number): T; // delay défaut: 500ms
```

### useClickOutside

```typescript
function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled?: boolean // défaut: true
): void;
```

### useScroll

```typescript
interface ScrollPosition {
  x: number;
  y: number;
}
function useScroll(): ScrollPosition;
```

### useMounted

```typescript
function useMounted(): boolean;
```

### useCopyToClipboard

```typescript
interface CopyStatus {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}
function useCopyToClipboard(timeout?: number): CopyStatus; // timeout défaut: 2000ms
```

### useOnline

```typescript
function useOnline(): boolean;
```

### useKeyPress

```typescript
function useKeyPress(targetKey: string): boolean;
```

## 📝 Changelog

### v1.0.0

- ✅ useWindowSize - Dimensions fenêtre
- ✅ useBreakpoint - Responsive detection
- ✅ useLocalStorage - Storage avec sync
- ✅ useDebounce - Debounce valeur
- ✅ useClickOutside - Clics en dehors
- ✅ useScroll - Position scroll
- ✅ useMounted - État montage
- ✅ useCopyToClipboard - Copie clipboard
- ✅ useOnline - Online/Offline
- ✅ useKeyPress - Détection touche
