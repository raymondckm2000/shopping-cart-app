import { describe, expect, it } from 'vitest';
import {
  cartInitialState,
  cartReducer,
  getCartCount,
  getCartSubtotal,
  type CartItem,
} from '../context/CartContext';

describe('cartReducer', () => {
  const baseItem: CartItem = {
    id: 'sku-1',
    name: 'Sample product',
    price: 25,
    qty: 1,
  };

  it('adds new items to the cart', () => {
    const state = cartReducer(cartInitialState, { type: 'ADD_ITEM', payload: baseItem });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ id: 'sku-1', qty: 1 });
  });

  it('increments quantity when adding the same item', () => {
    const state = cartReducer(cartInitialState, { type: 'ADD_ITEM', payload: baseItem });
    const next = cartReducer(state, { type: 'ADD_ITEM', payload: { ...baseItem, qty: 2 } });

    expect(next.items).toHaveLength(1);
    expect(next.items[0].qty).toBe(3);
  });

  it('updates the quantity when setQty is called', () => {
    const state = cartReducer(cartInitialState, { type: 'ADD_ITEM', payload: baseItem });
    const next = cartReducer(state, { type: 'SET_QTY', payload: { id: baseItem.id, qty: 5 } });

    expect(next.items[0].qty).toBe(5);
  });

  it('removes an item when setQty is set to zero', () => {
    const state = cartReducer(cartInitialState, { type: 'ADD_ITEM', payload: baseItem });
    const next = cartReducer(state, { type: 'SET_QTY', payload: { id: baseItem.id, qty: 0 } });

    expect(next.items).toHaveLength(0);
  });

  it('removes an item via remove action', () => {
    const state = cartReducer(cartInitialState, { type: 'ADD_ITEM', payload: baseItem });
    const next = cartReducer(state, { type: 'REMOVE_ITEM', payload: { id: baseItem.id } });

    expect(next.items).toHaveLength(0);
  });
});

describe('cart totals', () => {
  it('calculates subtotal and total quantity correctly', () => {
    const items: CartItem[] = [
      { id: 'a', name: 'Product A', price: 10, qty: 2 },
      { id: 'b', name: 'Product B', price: 5.5, qty: 1 },
    ];

    expect(getCartSubtotal(items)).toBeCloseTo(25.5);
    expect(getCartCount(items)).toBe(3);
  });
});
