import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

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
  const clearCart = () => setItems([]);

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
