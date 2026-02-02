import type { StockLocation, LocationTreeNode } from '@/types/stock'
import { logger } from '@/lib/logger'

/**
 * Construire un arbre hiérarchique à partir d'une liste plate de locations
 * Complexité: O(n)
 */
export function buildLocationTree(locations: StockLocation[]): LocationTreeNode[] {
  const map = new Map<number, LocationTreeNode>()
  const roots: LocationTreeNode[] = []

  // Récupérer les IDs expanded depuis localStorage
  const expandedIds = getExpandedLocationIds()

  // 1. Créer tous les nodes avec état initial
  locations.forEach(loc => {
    map.set(loc.id, {
      ...loc,
      level: 0,
      isExpanded: expandedIds.has(loc.id),
      path: [],
      children: []
    })
  })

  // 2. Construire les relations parent-enfant
  locations.forEach(loc => {
    const node = map.get(loc.id)!

    if (loc.parent_id && map.has(loc.parent_id)) {
      const parent = map.get(loc.parent_id)!

      // Ajouter à la liste des enfants du parent
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(node)

      // Calculer le niveau et le chemin
      node.level = parent.level + 1
      node.path = [...parent.path, parent.id]
    } else {
      // Pas de parent ou parent non trouvé = root
      roots.push(node)
    }
  })

  // 3. Trier alphabétiquement récursivement
  const sortTree = (nodes: LocationTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children as LocationTreeNode[])
      }
    })
  }
  sortTree(roots)

  return roots
}

/**
 * Vérifier si nodeId est un descendant de potentialAncestorId
 * Utilisé pour empêcher les boucles infinies lors du drag & drop
 */
export function isDescendant(
  nodeId: number,
  potentialAncestorId: number,
  locationMap: Map<number, LocationTreeNode>
): boolean {
  if (nodeId === potentialAncestorId) {
    return true
  }

  const node = locationMap.get(nodeId)
  if (!node || !node.parent_id) {
    return false
  }

  return isDescendant(node.parent_id, potentialAncestorId, locationMap)
}

/**
 * Récupérer le chemin complet depuis la racine jusqu'au node
 */
export function getNodePath(
  nodeId: number,
  locationMap: Map<number, LocationTreeNode>
): number[] {
  const node = locationMap.get(nodeId)
  if (!node) {
    return []
  }

  return [...node.path, nodeId]
}

/**
 * Récupérer le chemin complet sous forme de noms
 */
export function getNodePathNames(
  nodeId: number,
  locationMap: Map<number, LocationTreeNode>
): string[] {
  const path = getNodePath(nodeId, locationMap)
  return path.map(id => locationMap.get(id)?.name || '').filter(Boolean)
}

/**
 * Formater le chemin complet pour affichage
 */
export function formatNodePath(
  nodeId: number,
  locationMap: Map<number, LocationTreeNode>
): string {
  const names = getNodePathNames(nodeId, locationMap)
  return names.join(' / ')
}

/**
 * Aplatir l'arbre en liste (pour recherche, export, etc.)
 */
export function flattenTree(tree: LocationTreeNode[]): LocationTreeNode[] {
  const result: LocationTreeNode[] = []

  const traverse = (nodes: LocationTreeNode[]) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children as LocationTreeNode[])
      }
    })
  }

  traverse(tree)
  return result
}

/**
 * Filtrer l'arbre par recherche (nom, chemin complet, barcode)
 */
export function filterTree(
  tree: LocationTreeNode[],
  searchQuery: string
): LocationTreeNode[] {
  if (!searchQuery.trim()) {
    return tree
  }

  const query = searchQuery.toLowerCase()
  const _filtered: LocationTreeNode[] = []

  const traverse = (nodes: LocationTreeNode[]): LocationTreeNode[] => {
    const result: LocationTreeNode[] = []

    nodes.forEach(node => {
      const matchesNode =
        node.name.toLowerCase().includes(query) ||
        node.complete_name.toLowerCase().includes(query) ||
        (node.barcode && node.barcode.toLowerCase().includes(query))

      const filteredChildren = node.children ? traverse(node.children as LocationTreeNode[]) : []

      if (matchesNode || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren,
          isExpanded: true // Auto-expand nodes qui matchent
        })
      }
    })

    return result
  }

  return traverse(tree)
}

// ══════════════════════════════════════════════════════════════════════
// LOCALSTORAGE PERSISTENCE
// ══════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'stock_locations_expanded'

/**
 * Récupérer les IDs des locations expanded depuis localStorage
 */
export function getExpandedLocationIds(): Set<number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const ids = JSON.parse(stored) as number[]
      return new Set(ids)
    }
  } catch (error) {
    logger.error('tree-utils: Error reading expanded IDs from localStorage:', error)
  }
  return new Set()
}

/**
 * Sauvegarder les IDs des locations expanded dans localStorage
 */
function saveExpandedLocationIds(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch (error) {
    logger.error('tree-utils: Error saving expanded IDs to localStorage:', error)
  }
}

/**
 * Toggle l'état expanded d'une location
 */
export function toggleExpanded(locationId: number) {
  const expanded = getExpandedLocationIds()

  if (expanded.has(locationId)) {
    expanded.delete(locationId)
  } else {
    expanded.add(locationId)
  }

  saveExpandedLocationIds(expanded)
}

/**
 * Expand tous les nœuds
 */
export function expandAll(tree: LocationTreeNode[]) {
  const allIds = flattenTree(tree).map(node => node.id)
  saveExpandedLocationIds(new Set(allIds))
}

/**
 * Collapse tous les nœuds
 */
export function collapseAll() {
  saveExpandedLocationIds(new Set())
}

/**
 * Expand un nœud et tous ses parents
 */
export function expandPath(nodeId: number, locationMap: Map<number, LocationTreeNode>) {
  const expanded = getExpandedLocationIds()
  const path = getNodePath(nodeId, locationMap)

  path.forEach(id => expanded.add(id))
  saveExpandedLocationIds(expanded)
}
