'use client';

import React, { useEffect, useRef, useState } from 'react';
import { backendClient } from '@/lib/backend/client';

interface PayPalButtonProps {
  orderId: number;
  amount: number;
  currency?: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: Error) => void;
  onCancel?: () => void;
}

/**
 * PayPal payment button component
 * Uses PayPal JavaScript SDK to render payment buttons
 */
export function PayPalButton({
  orderId,
  amount,
  currency = 'EUR',
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load PayPal SDK
  useEffect(() => {
    // Check if SDK is already loaded
    if (window.paypal) {
      setSdkLoaded(true);
      return;
    }

    // Load PayPal SDK
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError('PayPal client ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => setError('Failed to load PayPal SDK');

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [currency]);

  // Render PayPal button when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !paypalRef.current || !window.paypal) {
      return;
    }

    // Clear previous buttons
    paypalRef.current.innerHTML = '';

    // Render PayPal button
    window.paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 45,
        },

        // Create PayPal order
        createOrder: async () => {
          try {
            setLoading(true);
            setError(null);

            const response = await backendClient.createPayPalOrder(orderId);

            if (!response.success || !response.data) {
              throw new Error(response.error || 'Failed to create PayPal order');
            }

            return response.data.paypal_order_id;
          } catch (_err) {
            const err = _err as Error;
            const errorMsg = err instanceof Error ? err.message : 'PayPal order creation failed';
            setError(errorMsg);
            onError(err instanceof Error ? err : new Error(errorMsg));
            throw err;
          } finally {
            setLoading(false);
          }
        },

        // Capture PayPal order after approval
        onApprove: async (data: PayPalOnApproveData) => {
          try {
            setLoading(true);
            setError(null);

            const response = await backendClient.capturePayPalOrder(data.orderID, orderId);

            if (!response.success || !response.data) {
              throw new Error(response.error || 'Failed to capture PayPal payment');
            }

            // Payment successful
            onSuccess(response.data.transaction_id);
          } catch (_err) {
            const err = _err as Error;
            const errorMsg = err instanceof Error ? err.message : 'PayPal payment capture failed';
            setError(errorMsg);
            onError(err instanceof Error ? err : new Error(errorMsg));
          } finally {
            setLoading(false);
          }
        },

        // Handle cancellation
        onCancel: () => {
          setLoading(false);
          if (onCancel) {
            onCancel();
          }
        },

        // Handle errors
        onError: (err: PayPalError) => {
          const errorMsg = err?.message || 'PayPal payment error';
          setError(errorMsg);
          onError(new Error(errorMsg));
          setLoading(false);
        },
      })
      .render(paypalRef.current);
  }, [sdkLoaded, orderId, amount, onSuccess, onError, onCancel]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">PayPal Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white bg-opacity-75">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}

      {!sdkLoaded && (
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Loading PayPal...</span>
          </div>
        </div>
      )}

      <div ref={paypalRef} className={!sdkLoaded ? 'hidden' : ''} />

      <div className="mt-3 text-center text-xs text-gray-500">
        Secure payment powered by PayPal
      </div>
    </div>
  );
}

// TypeScript declarations for PayPal SDK
interface PayPalOnApproveData {
  orderID: string;
  payerID?: string;
  paymentID?: string;
  billingToken?: string;
  facilitatorAccessToken?: string;
}

interface PayPalError {
  message?: string;
  name?: string;
  stack?: string;
}

interface PayPalButtonStyle {
  layout?: 'vertical' | 'horizontal';
  color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
  shape?: 'rect' | 'pill';
  label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
  height?: number;
}

interface PayPalButtons {
  style?: PayPalButtonStyle;
  createOrder: () => Promise<string>;
  onApprove: (data: PayPalOnApproveData) => Promise<void>;
  onCancel?: () => void;
  onError?: (err: PayPalError) => void;
}

interface PayPalNamespace {
  Buttons: (config: PayPalButtons) => {
    render: (container: HTMLElement) => void;
  };
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}
