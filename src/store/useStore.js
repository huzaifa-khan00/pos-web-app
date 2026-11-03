import { create } from 'zustand';
import { seed } from '../data/seed';
import { COLLECTIONS, loadLocal, saveLocal, cloudUpsert, cloudRemove, cloudConnect } from '../data/sync';
import { cartTotals, round2 } from '../utils/calc';

const uid = () => crypto.randomUUID();
const initial = (() => {
  const base = seed();
  const local = loadLocal();
  const merged = local ? { ...base, ...local } : base;
  // single owner account: keep only one user
  const owner = merged.users?.[0] || base.users[0];
  return { ...merged, users: [{ ...owner, role: 'admin' }] };
})();

export const useStore = create((set, get) => ({
  ...initial,
  currentUserId: null,
  theme: localStorage.getItem('pos-theme') || 'dark',
  cart: { lines: [], customerId: null, discount: 0, discountType: 'fixed' },
  toast: null,

  // ───────── generic persistence helpers
  notify: (msg, kind = 'info') => {
    set({ toast: { msg, kind, t: Date.now() } });
    setTimeout(() => get().toast?.msg === msg && set({ toast: null }), 3500);
  },
  _commit: () => saveLocal(get()),
  setCol: (col, items) => {
    set({ [col]: items });
    saveLocal(get());
  },
  upsert: (col, item) => {
    const list = get()[col];
    const next = list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
    set({ [col]: next });
    saveLocal(get());
    cloudUpsert(col, item);
    return item;
  },
  remove: (col, id) => {
    set({ [col]: get()[col].filter((x) => x.id !== id) });
    saveLocal(get());
    cloudRemove(col, id);
  },
  connectCloud: () => cloudConnect(get, (col, items) => {
    set({ [col]: items });
    saveLocal(get());
  }),

  // ───────── auth
  currentUser: () => get().users.find((u) => u.id === get().currentUserId) || null,
  login: (pin) => {
    const u = get().users[0];
    if (!u || u.pin !== pin) return false;
    set({ currentUserId: u.id });
    return true;
  },
  logout: () => set({ currentUserId: null }),
  toggleTheme: () => {
    const t = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pos-theme', t);
    set({ theme: t });
  },

  // ───────── cart
  addToCart: (product) => {
    const { cart } = get();
    const i = cart.lines.findIndex((l) => l.productId === product.id && !l.overridden);
    const lines = [...cart.lines];
    if (i >= 0) lines[i] = { ...lines[i], qty: lines[i].qty + 1 };
    else
      lines.push({
        key: uid(), productId: product.id, name: product.name, price: product.price, cost: product.cost,
        taxRate: product.tax, qty: 1, discount: 0, discountType: 'fixed', overridden: false,
      });
    set({ cart: { ...cart, lines } });
  },
  updateLine: (key, patch) =>
    set({ cart: { ...get().cart, lines: get().cart.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) } }),
  removeLine: (key) => set({ cart: { ...get().cart, lines: get().cart.lines.filter((l) => l.key !== key) } }),
  setCart: (patch) => set({ cart: { ...get().cart, ...patch } }),
  clearCart: () => set({ cart: { lines: [], customerId: null, discount: 0, discountType: 'fixed' } }),

  parkCart: (label) => {
    const { cart } = get();
    if (!cart.lines.length) return;
    get().upsert('parked', { id: uid(), label: label || 'Parked sale', cart, createdAt: new Date().toISOString() });
    get().clearCart();
  },
  restoreParked: (id) => {
    const p = get().parked.find((x) => x.id === id);
    if (!p) return;
    set({ cart: p.cart });
    get().remove('parked', id);
  },

  // ───────── stock
  _deduct: (productId, qty, products) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (p.type === 'composite') p.components.forEach((c) => get()._deduct(c.productId, c.qty * qty, products));
    else p.stock = round2(p.stock - qty);
  },
  adjustStock: (productId, delta, reason, note = '') => {
    const p = get().products.find((x) => x.id === productId);
    if (!p) return;
    get().upsert('products', { ...p, stock: round2(p.stock + delta) });
    get().upsert('stockLogs', {
      id: uid(), productId, delta, reason, note, userId: get().currentUserId, createdAt: new Date().toISOString(),
    });
  },

  // ───────── shifts
  openShift: () => get().shifts.find((s) => !s.closedAt && s.cashierId === get().currentUserId) || null,
  startShift: (startingFloat) =>
    get().upsert('shifts', {
      id: uid(), cashierId: get().currentUserId, openedAt: new Date().toISOString(),
      startingFloat: Number(startingFloat) || 0, closedAt: null, movements: [],
      expectedCash: null, countedCash: null, variance: null, cardTotal: null,
    }),
  cashMovement: (type, amount, note) => {
    const s = get().openShift();
    if (!s) return;
    get().upsert('shifts', {
      ...s, movements: [...s.movements, { id: uid(), type, amount: Number(amount), note, at: new Date().toISOString() }],
    });
  },
  shiftSummary: (shift) => {
    const sales = get().sales.filter((x) => x.shiftId === shift.id && !x.voided);
    const by = { cash: 0, card: 0, credit: 0 };
    sales.forEach((s) => s.payments.forEach((p) => (by[p.method] = round2((by[p.method] || 0) + p.amount))));
    const cashIn = shift.movements.filter((m) => m.type === 'in').reduce((a, m) => a + m.amount, 0);
    const cashOut = shift.movements.filter((m) => m.type === 'out').reduce((a, m) => a + m.amount, 0);
    return {
      count: sales.length, total: round2(sales.reduce((a, s) => a + s.total, 0)), by, cashIn, cashOut,
      expectedCash: round2(shift.startingFloat + by.cash + cashIn - cashOut),
    };
  },
  closeShift: (countedCash) => {
    const s = get().openShift();
    if (!s) return null;
    const sum = get().shiftSummary(s);
    const closed = {
      ...s, closedAt: new Date().toISOString(), expectedCash: sum.expectedCash,
      countedCash: Number(countedCash) || 0, variance: round2((Number(countedCash) || 0) - sum.expectedCash),
      cardTotal: sum.by.card,
    };
    get().upsert('shifts', closed);
    return closed;
  },

  // ───────── checkout
  checkout: ({ payments, change }) => {
    const st = get();
    const shift = st.openShift();
    if (!shift) throw new Error('Open a shift before selling.');
    const t = cartTotals(st.cart.lines, st.cart);
    if (!t.lines.length) throw new Error('Cart is empty.');
    const paid = round2(payments.reduce((a, p) => a + p.amount, 0));
    if (paid + 0.001 < t.total) throw new Error('Payment is less than the total.');
    const customer = st.customers.find((c) => c.id === st.cart.customerId);
    const creditAmt = payments.filter((p) => p.method === 'credit').reduce((a, p) => a + p.amount, 0);
    if (creditAmt > 0) {
      if (!customer) throw new Error('Select a customer to charge to account.');
      if (customer.balance + creditAmt > customer.creditLimit) throw new Error('Customer credit limit exceeded.');
    }
    // stock deduction on a working copy
    const products = st.products.map((p) => ({ ...p }));
    t.lines.forEach((l) => get()._deduct(l.productId, l.qty, products));
    products.forEach((p, i) => p.stock !== st.products[i].stock && get().upsert('products', p));

    const number = `INV-${1000 + st.sales.length + 1}`;
    const sale = {
      id: uid(), number, createdAt: new Date().toISOString(), shiftId: shift.id, cashierId: st.currentUserId,
      customerId: customer?.id || null, voided: false,
      items: t.lines.map((l) => ({
        productId: l.productId, name: l.name, qty: l.qty, price: l.price, cost: l.cost,
        discount: l.discount, discountType: l.discountType, tax: l.tax, net: l.net,
      })),
      subtotal: t.subtotal, discount: t.discount, tax: t.tax, total: t.total,
      payments: payments.filter((p) => p.amount > 0), change: change || 0,
    };
    get().upsert('sales', sale);

    if (customer) {
      const earned = Math.floor(t.total / 100);
      get().upsert('customers', {
        ...customer, balance: round2(customer.balance + creditAmt), points: customer.points + earned,
      });
      if (creditAmt > 0)
        get().upsert('ledger', {
          id: uid(), customerId: customer.id, type: 'debit', amount: creditAmt, note: `Sale ${number}`,
          createdAt: sale.createdAt,
        });
    }
    get().clearCart();
    return sale;
  },
  voidSale: (saleId) => {
    const st = get();
    const sale = st.sales.find((s) => s.id === saleId);
    if (!sale || sale.voided) return;
    const products = st.products.map((p) => ({ ...p }));
    sale.items.forEach((i) => get()._deduct(i.productId, -i.qty, products));
    products.forEach((p, i) => p.stock !== st.products[i].stock && get().upsert('products', p));
    get().upsert('sales', { ...sale, voided: true, voidedAt: new Date().toISOString(), voidedBy: st.currentUserId });
    const customer = st.customers.find((c) => c.id === sale.customerId);
    if (customer) {
      const credit = sale.payments.filter((p) => p.method === 'credit').reduce((a, p) => a + p.amount, 0);
      get().upsert('customers', {
        ...customer, balance: round2(customer.balance - credit),
        points: Math.max(0, customer.points - Math.floor(sale.total / 100)),
      });
    }
  },

  // ───────── customers / suppliers
  settleCustomer: (customerId, amount, note = 'Payment received') => {
    const c = get().customers.find((x) => x.id === customerId);
    if (!c) return;
    const a = Math.min(Number(amount) || 0, c.balance);
    if (a <= 0) return;
    get().upsert('customers', { ...c, balance: round2(c.balance - a) });
    get().upsert('ledger', { id: uid(), customerId, type: 'credit', amount: a, note, createdAt: new Date().toISOString() });
  },
  adjustPoints: (customerId, delta) => {
    const c = get().customers.find((x) => x.id === customerId);
    if (!c) return;
    get().upsert('customers', {
      ...c, points: Math.max(0, c.points + delta), redeemed: delta < 0 ? c.redeemed - delta : c.redeemed,
    });
  },

  // ───────── purchase orders
  createPO: (supplierId, items) =>
    get().upsert('purchaseOrders', {
      id: `PO-${1001 + get().purchaseOrders.length}`, supplierId, createdAt: new Date().toISOString(),
      status: 'Pending', paid: 0, items: items.map((i) => ({ ...i, received: 0 })),
      total: round2(items.reduce((a, i) => a + i.ordered * i.cost, 0)),
    }),
  receivePO: (poId, receivedMap) => {
    const po = get().purchaseOrders.find((p) => p.id === poId);
    if (!po) return;
    const items = po.items.map((it) => {
      const add = Math.max(0, Math.min(Number(receivedMap[it.productId]) || 0, it.ordered - it.received));
      if (add > 0) {
        const p = get().products.find((x) => x.id === it.productId);
        if (p) get().upsert('products', { ...p, stock: round2(p.stock + add), cost: it.cost });
        get().upsert('stockLogs', {
          id: uid(), productId: it.productId, delta: add, reason: 'Purchase Received', note: poId,
          userId: get().currentUserId, createdAt: new Date().toISOString(),
        });
      }
      return { ...it, received: it.received + add };
    });
    const all = items.every((i) => i.received >= i.ordered);
    const any = items.some((i) => i.received > 0);
    get().upsert('purchaseOrders', { ...po, items, status: all ? 'Received' : any ? 'Partial' : 'Pending' });
  },
  payPO: (poId, amount) => {
    const po = get().purchaseOrders.find((p) => p.id === poId);
    if (po) get().upsert('purchaseOrders', { ...po, paid: round2(Math.min(po.total, po.paid + Number(amount || 0))) });
  },

  resetDemo: () => {
    const base = seed();
    COLLECTIONS.forEach((c) => set({ [c]: base[c] }));
    saveLocal(get());
    COLLECTIONS.forEach((c) => base[c].forEach((it) => cloudUpsert(c, it)));
  },
}));

export const ID = uid;
