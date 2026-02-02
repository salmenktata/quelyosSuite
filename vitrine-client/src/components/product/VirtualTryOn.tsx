'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { logger } from '@/lib/logger';

interface VirtualTryOnProps {
  productName: string;
  productImage?: string;
  productType?: 'accessory' | 'clothing' | 'eyewear' | 'jewelry';
  onClose: () => void;
}

export function VirtualTryOn({
  productName,
  productImage,
  productType = 'accessory',
  onClose,
}: VirtualTryOnProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [productPosition, setProductPosition] = useState({ x: 50, y: 30 });
  const [productScale, setProductScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err) {
      logger.error('Camera error:', err);
      setCameraError('Impossible d\'acceder a la camera. Verifiez les permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setProductPosition({
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setProductScale(prev => Math.max(0.3, Math.min(2, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Essayage virtuel</h2>
            <p className="text-white/70 text-sm">{productName}</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div
        className="flex-1 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {!cameraActive ? (
          /* Start Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8">
            <div className="w-24 h-24 mb-6 bg-primary/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold mb-2">Essayez ce produit en realite augmentee</h3>
            <p className="text-gray-400 text-center mb-6 max-w-md">
              Activez votre camera pour voir comment ce produit vous irait.
              Vous pourrez ajuster la position et la taille du produit.
            </p>

            {cameraError && (
              <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg mb-4">
                {cameraError}
              </div>
            )}

            <button
              onClick={startCamera}
              className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Activer la camera
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Votre vie privee est respectee - aucune image n&apos;est enregistree
            </p>
          </div>
        ) : (
          /* AR View */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />

            {/* Product Overlay */}
            {productImage && (
              <div
                className="absolute cursor-move transition-transform"
                style={{
                  left: `${productPosition.x}%`,
                  top: `${productPosition.y}%`,
                  transform: `translate(-50%, -50%) scale(${productScale}) scaleX(-1)`,
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="relative w-32 h-32 opacity-80">
                  <Image
                    src={getProxiedImageUrl(productImage)}
                    alt={productName}
                    fill
                    className="object-contain drop-shadow-2xl"
                    sizes="128px"
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="flex items-center justify-center gap-4">
                {/* Scale controls */}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2">
                  <button
                    onClick={() => setProductScale(prev => Math.max(0.3, prev - 0.1))}
                    className="w-8 h-8 text-white hover:bg-white/20 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-white text-sm min-w-[3ch] text-center">
                    {Math.round(productScale * 100)}%
                  </span>
                  <button
                    onClick={() => setProductScale(prev => Math.min(2, prev + 0.1))}
                    className="w-8 h-8 text-white hover:bg-white/20 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => {
                    setProductPosition({ x: 50, y: 30 });
                    setProductScale(1);
                  }}
                  className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm hover:bg-white/30"
                >
                  Reinitialiser
                </button>

                {/* Stop camera */}
                <button
                  onClick={stopCamera}
                  className="bg-red-500/80 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600"
                >
                  Arreter
                </button>
              </div>

              <p className="text-white/60 text-xs text-center mt-3">
                Glissez le produit pour le positionner - Utilisez la molette pour zoomer
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
