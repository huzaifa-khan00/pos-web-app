// Dummy fallback data for every schema.
const id = () => crypto.randomUUID();
const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();

export function seed() {
  const cats = [
    { id: 'cat-bev', name: 'Beverages', parentId: null, color: '#0ea5e9' },
    { id: 'cat-snk', name: 'Snacks', parentId: null, color: '#f59e0b' },
    { id: 'cat-bak', name: 'Bakery', parentId: null, color: '#a16207' },
    { id: 'cat-gro', name: 'Grocery', parentId: null, color: '#16a34a' },
    { id: 'cat-bun', name: 'Bundles', parentId: null, color: '#9333ea' },
  ];
  const p = (pid, name, sku, category, cost, price, tax, stock, reorder, unit = 'pcs') => ({
    id: pid, name, sku, category, cost, price, tax, stock, reorder, unit, type: 'standard', components: [],
  });
  const products = [
    p('p1', 'Cola 500ml', '1001', 'cat-bev', 60, 100, 0, 48, 12),
    p('p2', 'Orange Juice 1L', '1002', 'cat-bev', 150, 240, 0, 20, 8),
    p('p3', 'Mineral Water 1.5L', '1003', 'cat-bev', 45, 80, 0, 60, 20),
    p('p4', 'Potato Chips', '2001', 'cat-snk', 70, 120, 5, 35, 10),
    p('p5', 'Chocolate Bar', '2002', 'cat-snk', 90, 150, 5, 6, 10),
    p('p6', 'Salted Peanuts', '2003', 'cat-snk', 55, 100, 5, 28, 8),
    p('p7', 'White Bread', '3001', 'cat-bak', 110, 170, 0, 15, 6),
    p('p8', 'Butter Cookies', '3002', 'cat-bak', 130, 220, 5, 22, 6),
    p('p9', 'Basmati Rice 5kg', '4001', 'cat-gro', 1500, 1850, 0, 12, 4, 'bag'),
    p('p10', 'Cooking Oil 1L', '4002', 'cat-gro', 480, 590, 5, 18, 6),
    p('p11', 'Sugar 1kg', '4003', 'cat-gro', 140, 180, 0, 30, 10),
    p('p12', 'Tea Bags 100pk', '4004', 'cat-gro', 320, 450, 5, 4, 6),
  ];
  products.push({
    id: 'p13', name: 'Snack Combo (Cola + Chips)', sku: '9001', category: 'cat-bun',
    cost: 130, price: 199, tax: 5, stock: 0, reorder: 0, unit: 'pcs', type: 'composite',
    components: [{ productId: 'p1', qty: 1 }, { productId: 'p4', qty: 1 }],
  });

  const users = [{ id: 'u-admin', name: 'Admin', role: 'admin', pin: '1111' }];

  const customers = [
    { id: 'c1', name: 'Ali Raza', phone: '0300-1112233', email: 'ali@example.com', balance: 0, creditLimit: 5000, points: 120, redeemed: 0 },
    { id: 'c2', name: 'Sara Khan', phone: '0321-4445566', email: 'sara@example.com', balance: 850, creditLimit: 3000, points: 40, redeemed: 10 },
    { id: 'c3', name: 'Walk-in Regular', phone: '', email: '', balance: 0, creditLimit: 0, points: 0, redeemed: 0 },
  ];

  const suppliers = [
    { id: 's1', name: 'Fresh Foods Distributors', contact: 'Imran', phone: '021-3456789', email: 'sales@freshfoods.test', taxId: 'NTN-123456' },
    { id: 's2', name: 'City Beverages Ltd', contact: 'Nadia', phone: '021-9876543', email: 'orders@citybev.test', taxId: 'NTN-654321' },
  ];

  const purchaseOrders = [
    {
      id: 'PO-1001', supplierId: 's2', createdAt: hoursAgo(48), status: 'Pending', paid: 0,
      items: [{ productId: 'p1', ordered: 24, received: 0, cost: 60 }, { productId: 'p3', ordered: 24, received: 0, cost: 45 }],
      total: 24 * 60 + 24 * 45,
    },
  ];

  // a few historical sales so reports are not empty
  const mk = (n, h, lines, method = 'cash') => {
    const items = lines.map(([pid, qty]) => {
      const pr = products.find((x) => x.id === pid);
      const net = pr.price * qty;
      return { productId: pid, name: pr.name, qty, price: pr.price, cost: pr.cost, discount: 0, tax: +(net * pr.tax / 100).toFixed(2), net };
    });
    const subtotal = items.reduce((s, i) => s + i.net, 0);
    const tax = items.reduce((s, i) => s + i.tax, 0);
    return {
      id: id(), number: `INV-${1000 + n}`, items, subtotal, tax, discount: 0, total: subtotal + tax,
      payments: [{ method, amount: subtotal + tax }], change: 0, customerId: null,
      shiftId: 'seed-shift', cashierId: 'u-admin', createdAt: hoursAgo(h), voided: false,
    };
  };
  const sales = [
    mk(1, 5, [['p1', 2], ['p4', 1]]), mk(2, 4, [['p9', 1]], 'card'), mk(3, 3, [['p7', 2], ['p8', 1]]),
    mk(4, 2, [['p10', 1], ['p11', 2]]), mk(5, 1, [['p2', 1], ['p5', 2]], 'card'),
  ];

  const total = sales.reduce((s, x) => s + x.total, 0);
  const shifts = [{
    id: 'seed-shift', cashierId: 'u-admin', openedAt: hoursAgo(8), startingFloat: 5000, closedAt: null,
    movements: [], expectedCash: null, countedCash: null, variance: null, cardTotal: null,
  }];

  return {
    products, categories: cats, units: [{ id: 'pcs', name: 'pcs' }, { id: 'kg', name: 'kg' }, { id: 'bag', name: 'bag' }, { id: 'ltr', name: 'ltr' }],
    customers, suppliers, users, shifts, sales, purchaseOrders, stockLogs: [], parked: [], ledger: [],
    _seedTotal: total,
  };
}
