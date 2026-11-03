import { useMemo, useState } from 'react';
import { Search, Minus, Plus, Trash2, PauseCircle, PlayCircle, Percent, Tag, User, CreditCard, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cartTotals, money, stockOf, round2 } from '../utils/calc';
import { Modal, Btn, Input, Select, Field, Badge } from '../components/ui';
import ReceiptModal from '../components/Receipt';

export default function POS({ goto }) {
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

  const shift = st.openShift();
  const totals = useMemo(() => cartTotals(cart.lines, cart), [cart]);
  const customer = customers.find((c) => c.id === cart.customerId);

  const list = products.filter((p) => {
    const t = q.trim().toLowerCase();
    return (cat === 'all' || p.category === cat) && (!t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t));
  });

  const add = (p) => {
    if (stockOf(p, products) <= 0) return st.notify(`${p.name} is out of stock`, 'error');
    st.addToCart(p);
  };
  // manual SKU entry: Enter on an exact SKU match adds it (typed input only, no global key listeners)
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

  return (
    <div className="grid h-full grid-cols-1 gap-3 p-3 lg:grid-cols-[1fr_420px]">
      {/* ── products */}
      <div className="flex min-h-0 flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onSearchEnter}
            placeholder="Search name or type SKU/barcode and press Enter" className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCat('all')} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${cat === 'all' ? 'bg-slate-800 text-white dark:bg-amber-500 dark:text-slate-900' : 'bg-white dark:bg-slate-800'}`}>All</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ borderColor: c.color, background: cat === c.id ? c.color : undefined, color: cat === c.id ? '#fff' : undefined }}
              className="whitespace-nowrap rounded-lg border-2 bg-white px-4 py-2 text-sm font-semibold dark:bg-slate-800">
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => {
            const stock = stockOf(p, products);
            const color = categories.find((c) => c.id === p.category)?.color || '#64748b';
            return (
              <button key={p.id} onClick={() => add(p)} disabled={stock <= 0}
                style={{ borderTopColor: color }}
                className="flex flex-col rounded-lg border border-t-4 border-slate-200 bg-white p-3 text-left shadow-sm transition hover:shadow-md active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800">
                <span className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">{p.name}</span>
                <span className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">{money(p.price)}</span>
                <span className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.sku}</span>
                  {stock <= p.reorder && p.type !== 'composite' ? <Badge tone={stock <= 0 ? 'red' : 'amber'}>{stock} left</Badge> : <span>{stock} in stock</span>}
                </span>
              </button>
            );
          })}
          {!list.length && <p className="col-span-full py-10 text-center text-slate-500">No products found.</p>}
        </div>
      </div>

      {/* ── cart */}
      <aside className="flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-700">
          <User size={16} className="text-slate-400" />
          <Select value={cart.customerId || ''} onChange={(e) => st.setCart({ customerId: e.target.value || null })}>
            <option value="">Walk-in customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        {customer && (
          <div className="flex justify-between bg-amber-50 px-3 py-1 text-xs dark:bg-slate-700/50">
            <span>Points: {customer.points}</span>
            <span>Owes: {money(customer.balance)} / limit {money(customer.creditLimit)}</span>
          </div>
        )}

        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
          {cart.lines.map((l) => (
            <div key={l.key} className="p-3">
              <div className="flex justify-between gap-2">
                <div className="text-sm font-semibold">{l.name}</div>
                <div className="text-sm font-bold">{money(totals.lines.find((x) => x.key === l.key)?.net ?? 0)}</div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => changeQty(l, -1)} className="rounded bg-slate-200 p-1 dark:bg-slate-700"><Minus size={14} /></button>
                  <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                  <button onClick={() => changeQty(l, 1)} className="rounded bg-slate-200 p-1 dark:bg-slate-700"><Plus size={14} /></button>
                  <span className="ml-2 text-xs text-slate-500">@ {money(l.price)}{l.overridden && ' (override)'}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setLineEdit({ ...l, mode: 'discount' })} title="Line discount" className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><Percent size={15} /></button>
                  <button onClick={() => override(l)} title="Price override" className="rounded p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><Tag size={15} /></button>
                  <button onClick={() => st.removeLine(l.key)} className="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"><Trash2 size={15} /></button>
                </div>
              </div>
              {l.discount > 0 && <div className="text-xs text-emerald-600">Discount: {l.discountType === 'percent' ? `${l.discount}%` : money(l.discount)}</div>}
            </div>
          ))}
          {!cart.lines.length && <p className="py-12 text-center text-sm text-slate-500">Cart is empty. Tap a product to add it.</p>}
        </div>

        <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-slate-500">Order discount</span>
            <Input type="number" min="0" value={cart.discount || ''} placeholder="0" className="!w-24 !py-1"
              onChange={(e) => st.setCart({ discount: Math.max(0, Number(e.target.value) || 0) })} />
            <Select value={cart.discountType} onChange={(e) => st.setCart({ discountType: e.target.value })} className="!w-20 !py-1">
              <option value="fixed">Rs</option><option value="percent">%</option>
            </Select>
          </div>
          <Row k="Subtotal" v={money(totals.subtotal)} />
          {totals.orderDiscount > 0 && <Row k="Order discount" v={`-${money(totals.orderDiscount)}`} />}
          <Row k="Tax" v={money(totals.tax)} />
          <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{money(totals.total)}</span></div>
          <div className="grid grid-cols-3 gap-2">
            <Btn v="dark" onClick={() => setParkOpen(true)} disabled={!cart.lines.length}><PauseCircle size={16} /> Hold</Btn>
            <Btn v="dark" onClick={() => setParkedOpen(true)}><PlayCircle size={16} /> Parked ({parked.length})</Btn>
            <Btn v="ghost" onClick={st.clearCart} disabled={!cart.lines.length}>Clear</Btn>
          </div>
          <Btn v="ok" className="w-full !py-3 text-base" disabled={!cart.lines.length}
            onClick={() => (shift ? setPayOpen(true) : setShiftOpen(true))}>
            <CreditCard size={18} /> Pay {money(totals.total)}
          </Btn>
        </div>
      </aside>

      {lineEdit && <LineEditor line={lineEdit} onClose={() => setLineEdit(null)} />}
      {parkOpen && <ParkModal onClose={() => setParkOpen(false)} customer={customer} />}
      {parkedOpen && <ParkedList onClose={() => setParkedOpen(false)} />}
      {shiftOpen && <StartShift onClose={() => setShiftOpen(false)} onStarted={() => { setShiftOpen(false); setPayOpen(true); }} />}
      {payOpen && <PayModal totals={totals} customer={customer} onClose={() => setPayOpen(false)} onDone={(s) => { setPayOpen(false); setReceipt(s); }} />}
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
    <Modal title="Parked sales" onClose={onClose}>
      {!parked.length && <p className="py-6 text-center text-sm text-slate-500">Nothing on hold.</p>}
      <div className="space-y-2">
        {parked.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
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
      <div className="mb-4 rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-900">
        <div className="text-xs uppercase text-slate-500">Amount due</div>
        <div className="text-3xl font-bold">{money(totals.total)}</div>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Btn v="dark" onClick={() => quick('cash')}>Full cash</Btn>
        <Btn v="dark" onClick={() => quick('card')}>Full card</Btn>
        <Btn v="dark" onClick={() => quick('credit')} disabled={!customer}>On account</Btn>
      </div>
      <p className="mb-2 text-xs text-slate-500">Split payment: enter amounts in more than one box.</p>
      {['cash', 'card', 'credit'].map((k) => (
        <div key={k} className="mb-2 flex items-end gap-2">
          <Field label={k === 'credit' ? 'Customer credit (account)' : k} className="flex-1">
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
