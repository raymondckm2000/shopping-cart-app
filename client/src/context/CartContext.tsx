import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'SET_QTY'; payload: { id: string; qty: number } }
  | { type: 'CLEAR' };

export const cartInitialState: CartState = {
  items: [],
};

const clampQty = (qty: number) => {
  if (!Number.isFinite(qty)) {
    return 0;
  }

  return Math.max(0, Math.floor(qty));
};

export const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const incoming = action.payload;
      const existing = state.items.find((item) => item.id === incoming.id);

      if (existing) {
        const updatedQty = clampQty(existing.qty + incoming.qty);
        return {
          items: state.items.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  qty: Math.max(1, updatedQty),
                }
              : item,
          ),
        };
      }

      return {
        items: [...state.items, { ...incoming, qty: Math.max(1, clampQty(incoming.qty)) }],
      };
    }

    case 'REMOVE_ITEM': {
      const { id } = action.payload;
      return {
        items: state.items.filter((item) => item.id !== id),
      };
    }

    case 'SET_QTY': {
      const { id, qty } = action.payload;
      const normalizedQty = clampQty(qty);

      if (normalizedQty <= 0) {
        return {
          items: state.items.filter((item) => item.id !== id),
        };
      }

      return {
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                qty: normalizedQty,
              }
            : item,
        ),
      };
    }

    case 'CLEAR':
      return { items: [] };

    default:
      return state;
  }
};

export const getCartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

export const getCartCount = (items: CartItem[]) =>
  items.reduce((total, item) => total + item.qty, 0);

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  setItemQty: (id: string, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, cartInitialState);

  const addItem = useCallback(
    (item: CartItem) => {
      dispatch({ type: 'ADD_ITEM', payload: item });
    },
    [dispatch],
  );

  const removeItem = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_ITEM', payload: { id } });
    },
    [dispatch],
  );

  const setItemQty = useCallback(
    (id: string, qty: number) => {
      dispatch({ type: 'SET_QTY', payload: { id, qty } });
    },
    [dispatch],
  );

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, [dispatch]);

  const items = state.items;
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const totalItems = useMemo(() => getCartCount(items), [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setItemQty,
      clearCart,
      subtotal,
      totalItems,
    }),
    [items, addItem, removeItem, setItemQty, clearCart, subtotal, totalItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};
