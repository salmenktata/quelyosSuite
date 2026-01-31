import { MODULES, type Module } from '@/config/modules'

export function useDetectModule(
  _accessibleModules: Module[],
  pathname: string
): Module {
  if (pathname.startsWith('/marketing')) return MODULES[1] || MODULES[0]
  return MODULES[0]
}
