'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/common';
import { useCartStore } from '@/store/cartStore';

interface CartItemProps {
  item: {
    id: number;
    product_id: number;
    product_name: string;
    product_image?: string;
    quantity: number;
    price_unit: number;
    price_subtotal: number;
    currency_symbol?: string;
  };
  showRemove?: boolean;
  compact?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  showRemove = true,
  compact = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { updateQuantity, removeItem } = useCartStore();

  const currencySymbol = item.currency_symbol || 'TND';

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setIsRemoving(false);
    }
  };

  const imageUrl = item.product_image
    ? `${process.env.NEXT_PUBLIC_ODOO_URL}${item.product_image}`
    : '/placeholder-product.png';

  if (compact) {
    return (
      <div className={`flex gap-3 py-3 border-b border-gray-200 ${isRemoving ? 'opacity-50' : ''}`}>
        <div className="relative w-16 h-16 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={item.product_name}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {item.product_name}
          </h4>
          <p className="text-sm text-gray-500">
            Qté: {item.quantity}
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {item.price_subtotal.toFixed(2)} {currencySymbol}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 py-4 border-b border-gray-200 ${isRemoving ? 'opacity-50' : ''}`}>
      {/* Product Image */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={imageUrl}
          alt={item.product_name}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {item.product_name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Prix unitaire: {item.price_unit.toFixed(2)} {currencySymbol}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Diminuer la quantité"
            >
              −
            </button>
            <span className="px-4 py-1 min-w-[3rem] text-center font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>

          {showRemove && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
            >
              {isRemoving ? 'Suppression...' : 'Supprimer'}
            </button>
          )}
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-gray-900">
          {item.price_subtotal.toFixed(2)} {currencySymbol}
        </p>
      </div>
    </div>
  );
};

export default CartItem;
