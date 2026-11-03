export const money = (n) =>
  'Rs ' + (Number(n) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const fmtDate = (iso) => new Date(iso).toLocaleString();

// Available stock: composites derive availability from components.
export function stockOf(product, products) {
  if (product.type !== 'composite') return product.stock;
  if (!product.components?.length) return 0;
  return Math.min(
    ...product.components.map((c) => {
      const sub = products.find((p) => p.id === c.productId);
      return sub ? Math.floor(stockOf(sub, products) / c.qty) : 0;
    })
  );
}

// line = { price, qty, discount, discountType: 'fixed' | 'percent', taxRate }
export function lineNet(line) {
  const gross = line.price * line.qty;
  const d = line.discountType === 'percent' ? (gross * (line.discount || 0)) / 100 : line.discount || 0;
  return Math.max(0, round2(gross - d));
}

// order = { discount, discountType }
export function cartTotals(lines, order = {}) {
  const nets = lines.map(lineNet);
  const subtotal = round2(nets.reduce((a, b) => a + b, 0));
  const od =
    order.discountType === 'percent'
      ? (subtotal * (order.discount || 0)) / 100
      : Math.min(order.discount || 0, subtotal);
  const orderDiscount = round2(od);
  const ratio = subtotal > 0 ? (subtotal - orderDiscount) / subtotal : 0;
  const lineDiscounts = round2(lines.reduce((s, l, i) => s + (l.price * l.qty - nets[i]), 0));
  const detailed = lines.map((l, i) => {
    const net = round2(nets[i] * ratio);
    return { ...l, net, tax: round2((net * (l.taxRate || 0)) / 100) };
  });
  const tax = round2(detailed.reduce((s, l) => s + l.tax, 0));
  return {
    lines: detailed,
    subtotal,
    lineDiscounts,
    orderDiscount,
    discount: round2(lineDiscounts + orderDiscount),
    tax,
    total: round2(subtotal - orderDiscount + tax),
  };
}

export function rangeFor(key, from, to) {
  const now = new Date();
  const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = sod(now);
  if (key === 'today') return [today, new Date(today.getTime() + 864e5)];
  if (key === 'yesterday') return [new Date(today.getTime() - 864e5), today];
  if (key === 'week') {
    const s = new Date(today);
    s.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return [s, new Date(today.getTime() + 864e5)];
  }
  const f = from ? new Date(from + 'T00:00:00') : today;
  const t = to ? new Date(new Date(to + 'T00:00:00').getTime() + 864e5) : new Date(today.getTime() + 864e5);
  return [f, t];
}
