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

  /**
   * Add individual product to cart
   */
  const addToCart = useCallback((product, quantityToAdd = 1) => {
    if (!product || !product.id) return;
    const available = Number(product.quantity) || 0;
    if (available <= 0) return;

    setItemsMap((prev) => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.requestedQuantity : 0;
      const targetQty = currentQty + Number(quantityToAdd);
      const validQty = Math.max(1, targetQty);

      const existingPackages = existing?.sourcePackages || [];

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
          requestedQuantity: validQty,
          sourcePackages: existingPackages.length > 0 ? existingPackages : ['Individual Part']
        }
      };
    });
  }, []);

  /**
   * Add a complete vehicle package into the cart in one operation
   * Expands components and intelligently merges duplicate products
   */
  const addPackageToCart = useCallback((expandedPackage, multiplier = 1) => {
    if (!expandedPackage || !Array.isArray(expandedPackage.items)) return null;

    const mult = Math.max(1, Number(multiplier) || 1);
    const packageName = expandedPackage.packageName || expandedPackage.name || 'Vehicle Package';
    const packageLabel = mult > 1 ? `${packageName} (×${mult})` : packageName;

    let addedCount = 0;
    let mergedCount = 0;
    let totalUnitsAdded = 0;

    setItemsMap((prev) => {
      const next = { ...prev };

      expandedPackage.items.forEach((comp) => {
        const prodId = comp.productId || comp.product_id;
        if (!prodId) return;

        const qtyPerVehicle = Number(comp.requiredPerVehicle || comp.required_quantity || comp.requestedQuantity);
        const quantityToAdd = qtyPerVehicle * mult;
        totalUnitsAdded += quantityToAdd;

        const existing = next[prodId];
        if (existing) {
          mergedCount++;
          const currentPackages = Array.isArray(existing.sourcePackages) ? existing.sourcePackages : [];
          const updatedPackages = currentPackages.includes(packageLabel)
            ? currentPackages
            : [...currentPackages, packageLabel];

          next[prodId] = {
            ...existing,
            requestedQuantity: existing.requestedQuantity + quantityToAdd,
            availableQuantity: comp.availableQuantity !== undefined ? comp.availableQuantity : existing.availableQuantity,
            sourcePackages: updatedPackages
          };
        } else {
          addedCount++;
          next[prodId] = {
            productId: prodId,
            name: comp.name || comp.product_name,
            sku: comp.sku,
            brand: comp.brand || 'Generic',
            category: comp.category || comp.category_name || 'General',
            unit: comp.unit || 'pcs',
            imageUrl: comp.imageUrl || comp.image_url || null,
            availableQuantity: Number(comp.availableQuantity || comp.quantity || 0),
            requestedQuantity: quantityToAdd,
            sourcePackages: [packageLabel]
          };
        }
      });

      return next;
    });

    return {
      packageName,
      multiplier: mult,
      addedCount,
      mergedCount,
      totalUnitsAdded,
      totalItemsInPackage: expandedPackage.items.length
    };
  }, []);

  /**
   * Update requested quantity for a product in cart
   */
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

  /**
   * Update known available quantity (e.g. from backend verification)
   */
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

  /**
   * Remove product from cart
   */
  const removeFromCart = useCallback((productId) => {
    setItemsMap((prev) => {
      if (!prev[productId]) return prev;
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }, []);

  /**
   * Clear entire cart and stored notes
   */
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
      addPackageToCart,
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
      addPackageToCart,
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
