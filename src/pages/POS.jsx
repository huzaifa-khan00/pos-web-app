import { useMemo, useState } from 'react';
import { Search, Minus, Plus, Trash2, PauseCircle, PlayCircle, Percent, Tag, User, CreditCard, AlertTriangle, ShoppingCart, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cartTotals, money, stockOf, round2 } from '../utils/calc';
import { Modal, Btn, Input, Select, Field, Badge } from '../components/ui';
import ReceiptModal from '../components/Receipt';

export default function POS() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const customers = useStore((s) => s.customers);
  const parked = useStore((s) => s.parked);
  const cart = useStore((s) => s.cart);
  const st = useStore();

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [payOpen, setPayOpen] = useState(false);
  const [parkOpen, setParkOpen] = useState(false);
  const [parkedOpen, setParkedOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [lineEdit, setLineEdit] = useState(null);
  const [cartOpen, setCartOpen] = useState(false); // phone only: cart is a full-screen sheet

  const shift = st.openShift();
  const totals = useMemo(() => cartTotals(cart.lines, cart), [cart]);
  const customer = customers.find((c) => c.id === cart.customerId);
  const itemCount = cart.lines.reduce((a, l) => a + l.qty, 0);

  const list = products.filter((p) => {
    const t = q.trim().toLowerCase();
    return (cat === 'all' || p.category === cat) && (!t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t));
  });

  const add = (p) => {
    if (stockOf(p, products) <= 0) return st.notify(`${p.name} is out of stock`, 'error');
    st.addToCart(p);
  };
  // typed SKU/barcode: Enter on an exact SKU match adds it (typed input only, no global key listeners)
  const onSearchEnter = (e) => {
    if (e.key !== 'Enter') return;
    const hit = products.find((p) => p.sku.toLowerCase() === q.trim().toLowerCase());
    if (hit) { add(hit); setQ(''); }
  };

  const changeQty = (l, d) => {
    const nq = l.qty + d;
    if (nq <= 0) return st.removeLine(l.key);
    const p = products.find((x) => x.id === l.productId);
    const inCart = cart.lines.filter((x) => x.productId === l.productId && x.key !== l.key).reduce((a, x) => a + x.qty, 0);
    if (p && d > 0 && nq + inCart > stockOf(p, products)) return st.notify('Not enough stock', 'error');
    st.updateLine(l.key, { qty: nq });
  };

  const override = (l) => setLineEdit({ ...l, mode: 'price' });
  const chip = (active) =>
    `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? 'border-slate-900 bg-slate-900 text-white dark:border-brand-600 dark:bg-brand-600'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
    }`;
  const iconBtn = 'rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <div className="flex h-full flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ── products */}
      <section className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={17} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchEnter}
            placeholder="Search by name, or type a SKU and press Enter" className="pl-9" />
        </div>
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5">
          <button onClick={() => setCat('all')} className={chip(cat === 'all')}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={chip(cat === c.id)}>
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
            </button>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => {
            const stock = stockOf(p, products);
            const color = categories.find((c) => c.id === p.category)?.color || '#64748b';
            const low = stock <= p.reorder && p.type !== 'composite';
            return (
              <button key={p.id} onClick={() => add(p)} disabled={stock <= 0}
                style={{ borderLeftColor: color }}
                className="flex min-h-[92px] flex-col rounded-md border border-l-4 border-slate-200 bg-white p-2.5 text-left transition-colors hover:border-r-brand-500 hover:border-t-brand-500 hover:border-b-brand-500 active:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800">
                <span className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</span>
                <span className="mt-auto pt-2 text-sm font-semibold">{money(p.price)}</span>
                <span className="mt-0.5 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.sku}</span>
                  {low ? <Badge tone={stock <= 0 ? 'red' : 'amber'}>{stock <= 0 ? 'Out' : `${stock} left`}</Badge> : <span>{stock} in stock</span>}
                </span>
              </button>
            );
          })}
          {!list.length && <p className="col-span-full py-10 text-center text-sm text-slate-500">No products match "{q}". Check the spelling or clear the search.</p>}
        </div>
      </section>

      {/* phone: bar that opens the cart */}
      {cart.lines.length > 0 && (
        <button onClick={() => setCartOpen(true)}
          className="no-print flex shrink-0 items-center justify-between bg-brand-600 px-4 py-3 text-white lg:hidden">
          <span className="flex items-center gap-2 text-sm font-medium"><ShoppingCart size={18} /> View cart ({itemCount})</span>
          <span className="font-semibold">{money(totals.total)}</span>
        </button>
      )}

      {/* ── cart (receipt style). Full screen sheet on phones, fixed side panel on desktop */}
      <aside className={`${cartOpen ? 'fixed inset-0 z-40 flex' : 'hidden'} flex-col bg-white dark:bg-slate-900 lg:static lg:z-auto lg:flex lg:border-l lg:border-slate-200 lg:dark:border-slate-800`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800 lg:hidden">
          <h2 className="text-[15px] font-semibold">Cart ({itemCount})</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" className={iconBtn}><X size={20} /></button>
        </div>
        <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <User size={16} className="shrink-0 text-slate-400" />
          <Select value={cart.customerId || ''} onChange={(e) => st.setCart({ customerId: e.target.value || null })}>
            <option value="">Walk-in customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        {customer && (
          <div className="flex justify-between bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-400">
            <span>Points: {customer.points}</span>
            <span>Owes {money(customer.balance)} of {money(customer.creditLimit)} limit</span>
          </div>
        )}

        <div className="min-h-0 flex-1 divide-y divide-dashed divide-slate-200 overflow-y-auto dark:divide-slate-800">
          {cart.lines.map((l) => (
            <div key={l.key} className="px-3 py-2.5">
              <div className="flex justify-between gap-2">
                <div className="text-sm font-medium">{l.name}</div>
                <div className="text-sm font-semibold">{money(totals.lines.find((x) => x.key === l.key)?.net ?? 0)}</div>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => changeQty(l, -1)} aria-label="Decrease quantity" className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700"><Minus size={15} /></button>
                  <span className="w-9 text-center text-sm font-semibold">{l.qty}</span>
                  <button onClick={() => changeQty(l, 1)} aria-label="Increase quantity" className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700"><Plus size={15} /></button>
                  <span className="ml-2 text-xs text-slate-500">at {money(l.price)}{l.overridden && ' (changed)'}</span>
                </div>
                <div className="flex">
                  <button onClick={() => setLineEdit({ ...l, mode: 'discount' })} title="Discount this item" aria-label="Discount this item" className={iconBtn}><Percent size={16} /></button>
                  <button onClick={() => override(l)} title="Change price" aria-label="Change price" className={iconBtn}><Tag size={16} /></button>
                  <button onClick={() => st.removeLine(l.key)} title="Remove" aria-label="Remove item" className={`${iconBtn} hover:!text-red-600`}><Trash2 size={16} /></button>
                </div>
              </div>
              {l.discount > 0 && <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">Discount: {l.discountType === 'percent' ? `${l.discount}%` : money(l.discount)}</div>}
            </div>
          ))}
          {!cart.lines.length && <p className="px-6 py-14 text-center text-sm text-slate-500">The cart is empty. Tap a product to add it.</p>}
        </div>

        <div className="space-y-2 border-t border-dashed border-slate-300 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Order discount</span>
            <Input type="number" min="0" value={cart.discount || ''} placeholder="0" className="!w-24 !min-h-[36px] !py-1"
              onChange={(e) => st.setCart({ discount: Math.max(0, Number(e.target.value) || 0) })} />
            <Select value={cart.discountType} onChange={(e) => st.setCart({ discountType: e.target.value })} className="!w-20 !min-h-[36px] !py-1">
              <option value="fixed">Rs</option><option value="percent">%</option>
            </Select>
          </div>
          <Row k="Subtotal" v={money(totals.subtotal)} />
          {totals.orderDiscount > 0 && <Row k="Order discount" v={`-${money(totals.orderDiscount)}`} />}
          <Row k="Tax" v={money(totals.tax)} />
          <div className="flex items-baseline justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
            <span className="text-base font-semibold">Total</span>
            <span className="text-2xl font-semibold">{money(totals.total)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Btn v="ghost" onClick={() => setParkOpen(true)} disabled={!cart.lines.length}><PauseCircle size={16} /> Hold</Btn>
            <Btn v="ghost" onClick={() => setParkedOpen(true)}><PlayCircle size={16} /> Held ({parked.length})</Btn>
            <Btn v="ghost" onClick={st.clearCart} disabled={!cart.lines.length}>Clear</Btn>
          </div>
          <Btn v="ok" className="w-full !min-h-[48px] text-base" disabled={!cart.lines.length}
            onClick={() => (shift ? setPayOpen(true) : setShiftOpen(true))}>
            <CreditCard size={18} /> Pay {money(totals.total)}
          </Btn>
        </div>
      </aside>

      {lineEdit && <LineEditor line={lineEdit} onClose={() => setLineEdit(null)} />}
      {parkOpen && <ParkModal onClose={() => setParkOpen(false)} customer={customer} />}
      {parkedOpen && <ParkedList onClose={() => setParkedOpen(false)} />}
      {shiftOpen && <StartShift onClose={() => setShiftOpen(false)} onStarted={() => { setShiftOpen(false); setPayOpen(true); }} />}
      {payOpen && <PayModal totals={totals} customer={customer} onClose={() => setPayOpen(false)} onDone={(s) => { setPayOpen(false); setCartOpen(false); setReceipt(s); }} />}
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

const Row = ({ k, v }) => <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>{k}</span><span>{v}</span></div>;

function LineEditor({ line, onClose }) {
  const updateLine = useStore((s) => s.updateLine);
  const [price, setPrice] = useState(line.price);
  const [disc, setDisc] = useState(line.discount || 0);
  const [type, setType] = useState(line.discountType || 'fixed');
  const save = () => {
    if (line.mode === 'price') updateLine(line.key, { price: Math.max(0, Number(price) || 0), overridden: true });
    else updateLine(line.key, { discount: Math.max(0, Number(disc) || 0), discountType: type });
    onClose();
  };
  return (
    <Modal title={line.mode === 'price' ? `Override price: ${line.name}` : `Line discount: ${line.name}`} onClose={onClose}
      footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Apply</Btn></>}>
      {line.mode === 'price' ? (
        <Field label="New unit price"><Input autoFocus type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      ) : (
        <div className="flex gap-2">
          <Field label="Discount" className="flex-1"><Input autoFocus type="number" min="0" value={disc} onChange={(e) => setDisc(e.target.value)} /></Field>
          <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="fixed">Rs</option><option value="percent">%</option></Select></Field>
        </div>
      )}
    </Modal>
  );
}

function ParkModal({ onClose, customer }) {
  const parkCart = useStore((s) => s.parkCart);
  const [label, setLabel] = useState(customer?.name || '');
  return (
    <Modal title="Hold sale" onClose={onClose} footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={() => { parkCart(label); onClose(); }}>Hold</Btn></>}>
      <Field label="Customer or table name"><Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Table 4" /></Field>
    </Modal>
  );
}

function ParkedList({ onClose }) {
  const parked = useStore((s) => s.parked);
  const restore = useStore((s) => s.restoreParked);
  const remove = useStore((s) => s.remove);
  const cart = useStore((s) => s.cart);
  return (
    <Modal title="Held sales" onClose={onClose}>
      {!parked.length && <p className="py-6 text-center text-sm text-slate-500">No held sales. Use Hold in the cart to set one aside.</p>}
      <div className="space-y-2">
        {parked.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div>
              <div className="font-semibold">{p.label}</div>
              <div className="text-xs text-slate-500">{p.cart.lines.length} items · {new Date(p.createdAt).toLocaleTimeString()}</div>
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => { if (cart.lines.length) return useStore.getState().notify('Hold or clear the current cart first', 'error'); restore(p.id); onClose(); }}>Restore</Btn>
              <Btn v="danger" onClick={() => remove('parked', p.id)}><Trash2 size={14} /></Btn>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function StartShift({ onClose, onStarted }) {
  const startShift = useStore((s) => s.startShift);
  const [f, setF] = useState('');
  return (
    <Modal title="Open shift" onClose={onClose} footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={() => { startShift(f); onStarted(); }}>Start shift</Btn></>}>
      <p className="mb-3 flex items-center gap-2 text-sm text-slate-500"><AlertTriangle size={16} className="text-amber-500" /> A shift must be open before taking payment.</p>
      <Field label="Starting cash float"><Input autoFocus type="number" min="0" value={f} onChange={(e) => setF(e.target.value)} placeholder="0.00" /></Field>
    </Modal>
  );
}

function PayModal({ totals, customer, onClose, onDone }) {
  const checkout = useStore((s) => s.checkout);
  const notify = useStore((s) => s.notify);
  const [amts, setAmts] = useState({ cash: '', card: '', credit: '' });
  const set = (k, v) => setAmts((a) => ({ ...a, [k]: v }));
  const n = (k) => Math.max(0, Number(amts[k]) || 0);
  const paid = round2(n('cash') + n('card') + n('credit'));
  const remaining = round2(totals.total - paid);
  const change = remaining < 0 ? Math.min(-remaining, n('cash')) : 0;

  const fill = (k) => {
    const others = round2(Object.keys(amts).filter((x) => x !== k).reduce((a, x) => a + n(x), 0));
    set(k, Math.max(0, round2(totals.total - others)).toString());
  };
  const quick = (k) => setAmts({ cash: '', card: '', credit: '', [k]: totals.total.toString() });

  const confirm = () => {
    try {
      const payments = [
        { method: 'cash', amount: round2(n('cash') - change) },
        { method: 'card', amount: n('card') },
        { method: 'credit', amount: n('credit') },
      ].filter((p) => p.amount > 0);
      const sale = checkout({ payments, change });
      onDone(sale);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <Modal title="Payment" onClose={onClose}
      footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="ok" onClick={confirm} disabled={remaining > 0.009}>Complete sale</Btn></>}>
      <div className="mb-4 rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-950">
        <div className="text-xs text-slate-500">Amount due</div>
        <div className="text-3xl font-semibold">{money(totals.total)}</div>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Btn v="ghost" onClick={() => quick('cash')}>Full cash</Btn>
        <Btn v="ghost" onClick={() => quick('card')}>Full card</Btn>
        <Btn v="ghost" onClick={() => quick('credit')} disabled={!customer}>On account</Btn>
      </div>
      <p className="mb-2 text-xs text-slate-500">Split payment: enter amounts in more than one box.</p>
      {['cash', 'card', 'credit'].map((k) => (
        <div key={k} className="mb-2 flex items-end gap-2">
          <Field label={{ cash: 'Cash', card: 'Card', credit: 'Customer credit (account)' }[k]} className="flex-1">
            <Input type="number" min="0" value={amts[k]} disabled={k === 'credit' && !customer} onChange={(e) => set(k, e.target.value)} placeholder="0.00" />
          </Field>
          <Btn v="ghost" onClick={() => fill(k)} disabled={k === 'credit' && !customer}>Fill rest</Btn>
        </div>
      ))}
      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Tendered</span><b>{money(paid)}</b></div>
        {remaining > 0 && <div className="flex justify-between text-red-500"><span>Remaining</span><b>{money(remaining)}</b></div>}
        {change > 0 && <div className="flex justify-between text-emerald-600"><span>Change</span><b>{money(change)}</b></div>}
      </div>
    </Modal>
  );
}
