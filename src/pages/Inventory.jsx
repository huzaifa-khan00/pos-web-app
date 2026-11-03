import { useState } from 'react';
import { Plus, Pencil, Trash2, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useStore, ID } from '../store/useStore';
import { Card, Btn, Modal, Field, Input, Select, Table, Badge } from '../components/ui';
import { money, stockOf, fmtDate } from '../utils/calc';

const REASONS = ['Damaged', 'Expired', 'Stock Count Correction', 'Other'];

export default function Inventory() {
  const [tab, setTab] = useState('products');
  return (
    <div className="space-y-3 p-3">
      <div className="flex gap-2">
        {['products', 'categories', 'units', 'adjustments'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-slate-800 text-white dark:bg-amber-500 dark:text-slate-900' : 'bg-white dark:bg-slate-800'}`}>{t}</button>
        ))}
      </div>
      {tab === 'products' && <Products />}
      {tab === 'categories' && <Categories />}
      {tab === 'units' && <Units />}
      {tab === 'adjustments' && <Adjustments />}
    </div>
  );
}

function Products() {
  const { products, categories, upsert, remove, notify } = useStore();
  const [q, setQ] = useState('');
  const [low, setLow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [adj, setAdj] = useState(null);

  const rows = products.filter((p) => {
    const t = q.toLowerCase();
    const match = !t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t);
    const isLow = p.type !== 'composite' && p.stock <= p.reorder;
    return match && (!low || isLow);
  });
  const lowCount = products.filter((p) => p.type !== 'composite' && p.stock <= p.reorder).length;

  return (
    <Card title="Products"
      actions={<>
        <Btn v={low ? 'primary' : 'ghost'} onClick={() => setLow(!low)}><AlertTriangle size={14} /> Low stock ({lowCount})</Btn>
        <Btn onClick={() => setEdit({ id: ID(), name: '', sku: '', category: categories[0]?.id || '', cost: 0, price: 0, tax: 0, stock: 0, reorder: 0, unit: 'pcs', type: 'standard', components: [], isNew: true })}><Plus size={14} /> Add</Btn>
      </>}>
      <Input placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3 max-w-sm" />
      <Table head={['Name', 'SKU', 'Category', 'Cost', 'Price', 'Tax', 'Stock', 'Reorder', 'Type', '']} empty={!rows.length && 'No products.'}>
        {rows.map((p) => {
          const stock = stockOf(p, products);
          const isLow = p.type !== 'composite' && p.stock <= p.reorder;
          return (
            <tr key={p.id} className={isLow ? 'bg-red-50 dark:bg-red-900/20' : ''}>
              <td className="font-medium">{p.name}</td>
              <td>{p.sku}</td>
              <td>{categories.find((c) => c.id === p.category)?.name || '-'}</td>
              <td>{money(p.cost)}</td><td>{money(p.price)}</td><td>{p.tax}%</td>
              <td>{isLow ? <Badge tone="red">{stock} {p.unit}</Badge> : `${stock} ${p.unit}`}</td>
              <td>{p.type === 'composite' ? '-' : p.reorder}</td>
              <td><Badge tone={p.type === 'composite' ? 'amber' : 'slate'}>{p.type}</Badge></td>
              <td className="whitespace-nowrap text-right">
                {p.type !== 'composite' && <button title="Adjust stock" onClick={() => setAdj(p)} className="p-1 text-slate-500 hover:text-amber-500"><SlidersHorizontal size={16} /></button>}
                <button onClick={() => setEdit(p)} className="p-1 text-slate-500 hover:text-amber-500"><Pencil size={16} /></button>
                <button onClick={() => confirm(`Delete ${p.name}?`) && (remove('products', p.id), notify('Product deleted'))} className="p-1 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
              </td>
            </tr>
          );
        })}
      </Table>
      {edit && <ProductForm initial={edit} onClose={() => setEdit(null)} />}
      {adj && <AdjustForm product={adj} onClose={() => setAdj(null)} />}
    </Card>
  );
}

function ProductForm({ initial, onClose }) {
  const { products, categories, units, upsert, notify } = useStore();
  const [f, setF] = useState(initial);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const num = (k) => (e) => set(k, e.target.value === '' ? '' : Number(e.target.value));
  const others = products.filter((p) => p.id !== f.id && p.type !== 'composite');

  const save = () => {
    if (!f.name.trim()) return notify('Name is required', 'error');
    if (!f.sku.trim()) return notify('SKU / barcode is required', 'error');
    if (products.some((p) => p.id !== f.id && p.sku === f.sku.trim())) return notify('SKU already in use', 'error');
    if (f.type === 'composite' && !f.components.length) return notify('Add at least one component', 'error');
    const { isNew, ...clean } = f;
    upsert('products', {
      ...clean, name: f.name.trim(), sku: f.sku.trim(), cost: +f.cost || 0, price: +f.price || 0, tax: +f.tax || 0,
      stock: f.type === 'composite' ? 0 : +f.stock || 0, reorder: +f.reorder || 0,
    });
    notify('Product saved', 'ok');
    onClose();
  };

  return (
    <Modal wide title={initial.isNew ? 'New product' : 'Edit product'} onClose={onClose}
      footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Name" className="col-span-2"><Input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="SKU / Barcode"><Input value={f.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
        <Field label="Category"><Select value={f.category} onChange={(e) => set('category', e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Unit"><Select value={f.unit} onChange={(e) => set('unit', e.target.value)}>
          {units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</Select></Field>
        <Field label="Type"><Select value={f.type} onChange={(e) => set('type', e.target.value)}>
          <option value="standard">Standard</option><option value="composite">Composite / Bundle</option></Select></Field>
        <Field label="Cost price"><Input type="number" min="0" value={f.cost} onChange={num('cost')} /></Field>
        <Field label="Retail price"><Input type="number" min="0" value={f.price} onChange={num('price')} /></Field>
        <Field label="Tax rate %"><Input type="number" min="0" value={f.tax} onChange={num('tax')} /></Field>
        {f.type === 'standard' && <>
          <Field label="Stock quantity"><Input type="number" value={f.stock} onChange={num('stock')} /></Field>
          <Field label="Reorder level"><Input type="number" min="0" value={f.reorder} onChange={num('reorder')} /></Field>
        </>}
      </div>
      {f.type === 'composite' && (
        <div className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between">
            <b className="text-sm">Bundle components (stock deducted on sale)</b>
            <Btn v="ghost" onClick={() => others[0] && set('components', [...f.components, { productId: others[0].id, qty: 1 }])}><Plus size={14} /> Add</Btn>
          </div>
          {f.components.map((c, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Select value={c.productId} onChange={(e) => set('components', f.components.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}>
                {others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
              <Input type="number" min="1" className="!w-24" value={c.qty}
                onChange={(e) => set('components', f.components.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)))} />
              <Btn v="danger" onClick={() => set('components', f.components.filter((_, j) => j !== i))}><Trash2 size={14} /></Btn>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function AdjustForm({ product, onClose }) {
  const adjustStock = useStore((s) => s.adjustStock);
  const notify = useStore((s) => s.notify);
  const [mode, setMode] = useState('remove');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const save = () => {
    const q = Number(qty);
    if (!q || q < 0) return notify('Enter a quantity', 'error');
    let delta = mode === 'remove' ? -q : mode === 'add' ? q : q - product.stock; // 'count' sets absolute
    if (mode === 'count') setReason('Stock Count Correction');
    adjustStock(product.id, delta, mode === 'count' ? 'Stock Count Correction' : reason, note);
    notify('Stock adjusted', 'ok');
    onClose();
  };
  return (
    <Modal title={`Adjust stock: ${product.name}`} onClose={onClose} footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
      <p className="mb-3 text-sm text-slate-500">Current stock: <b>{product.stock} {product.unit}</b></p>
      <div className="space-y-3">
        <Field label="Action"><Select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="remove">Remove (write-off)</option><option value="add">Add</option><option value="count">Set counted quantity</option></Select></Field>
        <Field label={mode === 'count' ? 'Counted quantity' : 'Quantity'}><Input type="number" min="0" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        {mode !== 'count' && <Field label="Reason"><Select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</Select></Field>}
        <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function Adjustments() {
  const { stockLogs, products, users } = useStore();
  const rows = [...stockLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Card title="Stock adjustment log">
      <Table head={['When', 'Product', 'Change', 'Reason', 'Note', 'By']} empty={!rows.length && 'No adjustments yet.'}>
        {rows.map((l) => (
          <tr key={l.id}>
            <td>{fmtDate(l.createdAt)}</td>
            <td>{products.find((p) => p.id === l.productId)?.name || 'Deleted product'}</td>
            <td className={l.delta < 0 ? 'text-red-500' : 'text-emerald-600'}>{l.delta > 0 ? '+' : ''}{l.delta}</td>
            <td>{l.reason}</td><td>{l.note}</td><td>{users.find((u) => u.id === l.userId)?.name || '-'}</td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Categories() {
  const { categories, products, upsert, remove, notify } = useStore();
  const [edit, setEdit] = useState(null);
  const del = (c) => {
    if (products.some((p) => p.category === c.id)) return notify('Category has products — move them first', 'error');
    if (categories.some((x) => x.parentId === c.id)) return notify('Category has sub-categories', 'error');
    if (confirm(`Delete ${c.name}?`)) remove('categories', c.id);
  };
  return (
    <Card title="Categories" actions={<Btn onClick={() => setEdit({ id: ID(), name: '', parentId: null, color: '#0ea5e9' })}><Plus size={14} /> Add</Btn>}>
      <Table head={['Color', 'Name', 'Parent', 'Products', '']}>
        {categories.map((c) => (
          <tr key={c.id}>
            <td><span className="inline-block h-4 w-4 rounded" style={{ background: c.color }} /></td>
            <td className="font-medium">{c.name}</td>
            <td>{categories.find((x) => x.id === c.parentId)?.name || '-'}</td>
            <td>{products.filter((p) => p.category === c.id).length}</td>
            <td className="text-right">
              <button onClick={() => setEdit(c)} className="p-1 text-slate-500 hover:text-amber-500"><Pencil size={16} /></button>
              <button onClick={() => del(c)} className="p-1 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
            </td>
          </tr>
        ))}
      </Table>
      {edit && (
        <Modal title="Category" onClose={() => setEdit(null)}
          footer={<><Btn v="ghost" onClick={() => setEdit(null)}>Cancel</Btn>
            <Btn onClick={() => { if (!edit.name.trim()) return notify('Name required', 'error'); upsert('categories', edit); setEdit(null); }}>Save</Btn></>}>
          <div className="space-y-3">
            <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Parent category"><Select value={edit.parentId || ''} onChange={(e) => setEdit({ ...edit, parentId: e.target.value || null })}>
              <option value="">None</option>{categories.filter((c) => c.id !== edit.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Display color"><input type="color" value={edit.color} onChange={(e) => setEdit({ ...edit, color: e.target.value })} className="h-10 w-20" /></Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function Units() {
  const { units, products, upsert, remove, notify } = useStore();
  const [name, setName] = useState('');
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (units.some((u) => u.name.toLowerCase() === n.toLowerCase())) return notify('Unit exists', 'error');
    upsert('units', { id: n.toLowerCase().replace(/\s+/g, '-'), name: n });
    setName('');
  };
  return (
    <Card title="Units of measure">
      <div className="mb-3 flex max-w-sm gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. box" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Btn onClick={add}><Plus size={14} /> Add</Btn>
      </div>
      <div className="flex flex-wrap gap-2">
        {units.map((u) => (
          <span key={u.id} className="flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-sm dark:bg-slate-700">
            {u.name}
            <button onClick={() => (products.some((p) => p.unit === u.name) ? notify('Unit is in use', 'error') : remove('units', u.id))} className="text-slate-500 hover:text-red-500"><Trash2 size={13} /></button>
          </span>
        ))}
      </div>
    </Card>
  );
}
