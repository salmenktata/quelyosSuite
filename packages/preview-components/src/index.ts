/**
 * @quelyos/preview-components
 *
 * Composants React pour prévisualiser du contenu dans différents contextes (mobile, tablet, desktop)
 * avec indicateurs visuels pour le feedback temps réel.
 *
 * @example
 * ```tsx
 * import { PreviewPanel, DeviceToggle, LiveIndicator } from '@quelyos/preview-components'
 *
 * function MyPreview() {
 *   const [device, setDevice] = useState<DeviceType>('desktop')
 *
 *   return (
 *     <>
 *       <div className="flex items-center justify-between mb-4">
 *         <DeviceToggle value={device} onChange={setDevice} />
 *         <LiveIndicator />
 *       </div>
 *       <PreviewPanel device={device} showUrlBar>
 *         <MyComponent />
 *       </PreviewPanel>
 *     </>
 *   )
 * }
 * ```
 */

export { PreviewPanel, type PreviewPanelProps, type DeviceType } from './PreviewPanel'
export { DeviceToggle, type DeviceToggleProps } from './DeviceToggle'
export { LiveIndicator, type LiveIndicatorProps } from './LiveIndicator'
