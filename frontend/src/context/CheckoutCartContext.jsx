import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const STORAGE_KEY = 'stockpulse_checkout_cart';
const NOTES_STORAGE_KEY = 'stockpulse_checkout_notes';

const CheckoutCartContext = createContext(null);

export const CheckoutCartProvider = ({ children }) => {
  const [itemsMap, setItemsMap] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [notes, setNotesState] = useState(() => {
    try {
      return localStorage.getItem(NOTES_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsMap));
    } catch (err) {
      console.error('Failed to persist checkout cart to localStorage', err);
    }
  }, [itemsMap]);

  // Sync notes to localStorage
  const setNotes = useCallback((newNotes) => {
    setNotesState(newNotes);
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, newNotes);
    } catch (err) {
      console.error('Failed to persist checkout notes', err);
    }
  }, []);

  const items = useMemo(() => Object.values(itemsMap), [itemsMap]);
  const totalItems = items.length;
  const totalUnits = useMemo(
    () => items.reduce((acc, curr) => acc + (Number(curr.requestedQuantity) || 0), 0),
    [items]
  );

  const addToCart = useCallback((product, quantityToAdd = 1) => {
    if (!product || !product.id) return;
    const available = Number(product.quantity) || 0;
    if (available <= 0) return;

    setItemsMap((prev) => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.requestedQuantity : 0;
      const targetQty = currentQty + Number(quantityToAdd);
      const validQty = Math.max(1, Math.min(available, targetQty));

      return {
        ...prev,
        [product.id]: {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          brand: product.brand || 'Generic',
          category: product.category || product.category_name || 'General',
          unit: product.unit || 'pcs',
          imageUrl: product.image_url || product.imageUrl || null,
          availableQuantity: available,
          requestedQuantity: validQty
        }
      };
    });
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    const qty = Number(newQuantity);
    setItemsMap((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          requestedQuantity: Math.max(1, qty)
        }
      };
    });
  }, []);

  const updateAvailableQuantity = useCallback((productId, latestAvailable) => {
    setItemsMap((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      return {
        ...prev,
        [productId]: {
          ...existing,
          availableQuantity: Number(latestAvailable)
        }
      };
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItemsMap((prev) => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItemsMap({});
    setNotesState('');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NOTES_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear cart storage', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemsMap,
      totalItems,
      totalUnits,
      notes,
      setNotes,
      addToCart,
      updateQuantity,
      updateAvailableQuantity,
      removeFromCart,
      clearCart
    }),
    [
      items,
      itemsMap,
      totalItems,
      totalUnits,
      notes,
      setNotes,
      addToCart,
      updateQuantity,
      updateAvailableQuantity,
      removeFromCart,
      clearCart
    ]
  );

  return <CheckoutCartContext.Provider value={value}>{children}</CheckoutCartContext.Provider>;
};

export const useCheckoutCart = () => {
  const context = useContext(CheckoutCartContext);
  if (!context) {
    throw new Error('useCheckoutCart must be used within a CheckoutCartProvider');
  }
  return context;
};

