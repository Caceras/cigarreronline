import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Lines = Record<string, number>;
interface Cart {
  lines: Lines;
  count: number;
  add: (id: string, qty?: number) => void;
  set: (id: string, qty: number) => void;
  lastAdded: string | null;
}

const CartContext = createContext<Cart>({ lines: {}, count: 0, add: () => {}, set: () => {}, lastAdded: null });
const KEY = 'co-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Lines>({});
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  // Loaded after mount so the prerendered HTML and the first client render match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Lines) => {
    setLines(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const add = (id: string, qty = 1) => {
    persist({ ...lines, [id]: (lines[id] ?? 0) + qty });
    setLastAdded(id);
    setTimeout(() => setLastAdded(null), 2600);
  };
  const set = (id: string, qty: number) => {
    const next = { ...lines };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    persist(next);
  };
  const count = Object.values(lines).reduce((a, b) => a + b, 0);

  return <CartContext.Provider value={{ lines, count, add, set, lastAdded }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
