import { useState } from 'react';
import { Plus, PackageCheck, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, Btn, Modal, Field, Input, Select, Table, Badge } from '../components/ui';
import { money, fmtDate } from '../utils/calc';

export default function Purchases() {
  const { purchaseOrders, suppliers, products } = useStore();
  const [create, setCreate] = useState(false);
  const [recv, setRecv] = useState(null);
  const tone = { Pending: 'amber', Partial: 'slate', Received: 'green' };
  const rows = [...purchaseOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="p-3">
      <Card title="Purchase orders" actions={<Btn onClick={() => setCreate(true)}><Plus size={14} /> New PO</Btn>}>
        <Table head={['PO #', 'Supplier', 'Date', 'Items', 'Total', 'Status', '']} empty={!rows.length && 'No purchase orders.'}>
          {rows.map((po) => (
            <tr key={po.id}>
              <td className="font-medium">{po.id}</td>
              <td>{suppliers.find((s) => s.id === po.supplierId)?.name || '-'}</td>
              <td>{fmtDate(po.createdAt)}</td>
              <td>{po.items.map((i) => `${products.find((p) => p.id === i.productId)?.name || '?'} (${i.received}/${i.ordered})`).join(', ')}</td>
              <td>{money(po.total)}</td>
              <td><Badge tone={tone[po.status]}>{po.status}</Badge></td>
              <td className="text-right">{po.status !== 'Received' && <Btn v="ok" onClick={() => setRecv(po)}><PackageCheck size={14} /> Receive</Btn>}</td>
            </tr>
          ))}
        </Table>
      </Card>
      {create && <CreatePO onClose={() => setCreate(false)} />}
      {recv && <ReceivePO po={recv} onClose={() => setRecv(null)} />}
    </div>
  );
}

function CreatePO({ onClose }) {
  const { suppliers, products, createPO, notify } = useStore();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [items, setItems] = useState([]);
  const std = products.filter((p) => p.type !== 'composite');
  const add = () => std[0] && setItems([...items, { productId: std[0].id, ordered: 1, cost: std[0].cost }]);
  const upd = (i, patch) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const total = items.reduce((a, i) => a + i.ordered * i.cost, 0);

  const save = () => {
    if (!supplierId) return notify('Pick a supplier', 'error');
    if (!items.length) return notify('Add at least one item', 'error');
    if (items.some((i) => !(i.ordered > 0) || i.cost < 0)) return notify('Check quantities and costs', 'error');
    createPO(supplierId, items);
    notify('Purchase order created', 'ok');
    onClose();
  };

  return (
    <Modal wide title="New purchase order" onClose={onClose}
      footer={<><span className="mr-auto font-bold">Total {money(total)}</span><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Create</Btn></>}>
      <Field label="Supplier" className="mb-3"><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
      {items.map((it, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <Select value={it.productId} onChange={(e) => upd(i, { productId: e.target.value, cost: products.find((p) => p.id === e.target.value)?.cost || 0 })}>
            {std.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          <Input type="number" min="1" className="!w-24" value={it.ordered} onChange={(e) => upd(i, { ordered: Number(e.target.value) })} title="Qty" />
          <Input type="number" min="0" className="!w-28" value={it.cost} onChange={(e) => upd(i, { cost: Number(e.target.value) })} title="Unit cost" />
          <Btn v="danger" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 size={14} /></Btn>
        </div>
      ))}
      <Btn v="ghost" onClick={add}><Plus size={14} /> Add item</Btn>
    </Modal>
  );
}

function ReceivePO({ po, onClose }) {
  const { products, receivePO, notify } = useStore();
  const [map, setMap] = useState(() => Object.fromEntries(po.items.map((i) => [i.productId, i.ordered - i.received])));
  const save = () => { receivePO(po.id, map); notify('Stock received', 'ok'); onClose(); };
  return (
    <Modal title={`Receive ${po.id}`} onClose={onClose} footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="ok" onClick={save}>Receive stock</Btn></>}>
      <p className="mb-3 text-sm text-slate-500">Received quantities add to stock and update each product's cost price.</p>
      {po.items.map((i) => (
        <div key={i.productId} className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm"><div className="font-medium">{products.find((p) => p.id === i.productId)?.name}</div>
            <div className="text-xs text-slate-500">Ordered {i.ordered} · received {i.received} · @ {money(i.cost)}</div></div>
          <Input type="number" min="0" max={i.ordered - i.received} className="!w-24" value={map[i.productId]}
            onChange={(e) => setMap({ ...map, [i.productId]: e.target.value })} />
        </div>
      ))}
    </Modal>
  );
}
