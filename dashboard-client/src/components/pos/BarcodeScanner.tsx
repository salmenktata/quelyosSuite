/**
 * Scanner de codes-barres POS
 * Supporte les scanners USB (émulation clavier) et la caméra (WebAPI)
 */

import { useEffect, useState, useRef } from 'react'
import { ScanBarcode, Camera, X, Loader2 } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  enabled?: boolean
}

/**
 * Hook pour détecter les scans de codes-barres via clavier
 * Les scanners USB émulent des frappes clavier très rapides suivies de Enter
 */
export function useBarcodeScan(
  onScan: (barcode: string) => void,
  enabled: boolean = true
) {
  const bufferRef = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input field
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Clear timeout on each keypress
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (e.key === 'Enter') {
        // Process buffer if we have something
        if (bufferRef.current.length >= 3) {
          onScan(bufferRef.current)
        }
        bufferRef.current = ''
      } else if (e.key.length === 1) {
        // Single character key
        bufferRef.current += e.key
      }

      // Clear buffer after 100ms of inactivity (scanner is very fast)
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = ''
      }, 100)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [onScan, enabled])
}

/**
 * Composant bouton pour activer le scan caméra
 */
export function BarcodeScanButton({ onScan, enabled = true }: BarcodeScannerProps) {
  const [showCamera, setShowCamera] = useState(false)

  // Use keyboard scanner hook
  useBarcodeScan(onScan, enabled)

  if (!enabled) return null

  return (
    <>
      <button
        onClick={() => setShowCamera(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Scanner un code-barres"
      >
        <ScanBarcode className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>

      {showCamera && (
        <CameraScannerModal
          onScan={(code) => {
            onScan(code)
            setShowCamera(false)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}

/**
 * Modal avec scanner caméra
 */
interface CameraScannerModalProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

function CameraScannerModal({ onScan: _onScan, onClose }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setLoading(false)
        }
      } catch (_err) {
        setError('Impossible d\'accéder à la caméra')
        setLoading(false)
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Note: Pour un vrai scanner, il faudrait intégrer une librairie comme
  // @zxing/browser ou quagga2 pour décoder les codes-barres en temps réel

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-teal-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="aspect-video bg-black relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
              <div>
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
                <p className="text-sm mt-2 opacity-75">
                  Utilisez un scanner USB ou entrez le code manuellement
                </p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Scan overlay */}
          {!error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-teal-500 rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-500 rounded-br-lg" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Placez le code-barres dans le cadre
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanButton
