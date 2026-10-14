import { createContext, useContext, useMemo, useState, useEffect, useRef, ReactNode } from 'react';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../lib/storage';

const CART_STORAGE_KEY = 'farmsking_user_cart';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string | null;
  quantity: number;
  bulkDiscountMinQty?: number | null;
  bulkDiscountPercentage?: number | null;
  weightKg?: number | null;
  isCodAllowed?: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalAmount: number;
  wholesaleSavings: number;
  itemCount: number;
  totalWeightKg: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const isLoaded = useRef(false);

  // Load persisted cart on app mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await getItemAsync(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to load cart from storage', err);
      } finally {
        isLoaded.current = true;
      }
    })();
  }, []);

  // Save cart whenever items change
  useEffect(() => {
    if (!isLoaded.current) return;
    (async () => {
      try {
        await setItemAsync(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.error('Failed to save cart to storage', err);
      }
    })();
  }, [items]);

  const addItem: CartContextValue['addItem'] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.productId !== productId) : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const clearCart = () => {
    setItems([]);
    deleteItemAsync(CART_STORAGE_KEY).catch(() => {});
  };

  const value = useMemo<CartContextValue>(() => {
    let rawTotal = 0;
    let effectiveTotal = 0;
    let itemCount = 0;
    let totalWeightKg = 0;

    items.forEach((i) => {
      itemCount += i.quantity;
      totalWeightKg += (i.weightKg || 0.5) * i.quantity;
      const baseSub = i.price * i.quantity;
      rawTotal += baseSub;

      // Calculate wholesale tier discount if applicable
      const hasBulkDiscount = i.bulkDiscountMinQty && i.bulkDiscountPercentage && i.quantity >= i.bulkDiscountMinQty;
      const effectivePrice = hasBulkDiscount
        ? i.price * (1 - Number(i.bulkDiscountPercentage) / 100)
        : i.price;

      effectiveTotal += effectivePrice * i.quantity;
    });

    const wholesaleSavings = Math.max(0, rawTotal - effectiveTotal);

    return {
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal: rawTotal,
      totalAmount: effectiveTotal,
      wholesaleSavings,
      itemCount,
      totalWeightKg,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
