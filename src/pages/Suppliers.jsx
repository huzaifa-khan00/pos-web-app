import { useState } from 'react';
import { Plus, Pencil, Trash2, History } from 'lucide-react';
import { useStore, ID } from '../store/useStore';
import { Card, Btn, Modal, Field, Input, Table, Badge } from '../components/ui';
import { money, fmtDate } from '../utils/calc';

export default function Suppliers() {
  const { suppliers, purchaseOrders, upsert, remove, notify } = useStore();
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);
  const owed = (id) => purchaseOrders.filter((p) => p.supplierId === id).reduce((a, p) => a + (p.total - p.paid), 0);

  const del = (s) => {
    if (purchaseOrders.some((p) => p.supplierId === s.id)) return notify('Supplier has purchase orders', 'error');
    if (confirm(`Delete ${s.name}?`)) remove('suppliers', s.id);
  };
  const save = () => {
    if (!edit.name.trim()) return notify('Name required', 'error');
    const { isNew, ...s } = edit;
    upsert('suppliers', s);
    setEdit(null);
  };

  return (
    <div className="p-3">
      <Card title="Suppliers" actions={<Btn onClick={() => setEdit({ id: ID(), name: '', contact: '', phone: '', email: '', taxId: '', isNew: true })}><Plus size={14} /> Add</Btn>}>
        <Table head={['Name', 'Contact', 'Phone', 'Email', 'Tax / VAT ID', 'Outstanding', '']} hide={[2, 3, 4, 5]} empty={!suppliers.length && 'No suppliers.'}>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td className="font-medium">{s.name}</td><td>{s.contact}</td><td>{s.phone}</td><td>{s.email}</td><td>{s.taxId}</td>
              <td>{owed(s.id) > 0 ? <Badge tone="amber">{money(owed(s.id))}</Badge> : money(0)}</td>
              <td className="whitespace-nowrap text-right">
                <button onClick={() => setView(s.id)} title="PO history" className="p-2 text-slate-500 hover:text-brand-600"><History size={16} /></button>
                <button onClick={() => setEdit(s)} className="p-2 text-slate-500 hover:text-brand-600"><Pencil size={16} /></button>
                <button onClick={() => del(s)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      {edit && (
        <Modal title="Supplier" onClose={() => setEdit(null)} footer={<><Btn v="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
          <div className="space-y-3">
            {[['name', 'Name'], ['contact', 'Contact person'], ['phone', 'Phone'], ['email', 'Email'], ['taxId', 'Tax / VAT ID']].map(([k, l]) => (
              <Field key={k} label={l}><Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></Field>
            ))}
          </div>
        </Modal>
      )}
      {view && <History_ id={view} onClose={() => setView(null)} />}
    </div>
  );
}

function History_({ id, onClose }) {
  const { suppliers, purchaseOrders, payPO, notify } = useStore();
  const s = suppliers.find((x) => x.id === id);
  const [pay, setPay] = useState({});
  const pos = purchaseOrders.filter((p) => p.supplierId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Modal wide title={`${s?.name} — purchase history`} onClose={onClose}>
      <Table head={['PO', 'Date', 'Status', 'Total', 'Paid', 'Due', 'Pay']} hide={[2, 3, 5]} empty={!pos.length && 'No purchase orders.'}>
        {pos.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td><td>{fmtDate(p.createdAt)}</td><td>{p.status}</td><td>{money(p.total)}</td><td>{money(p.paid)}</td>
            <td className="font-semibold">{money(p.total - p.paid)}</td>
            <td>{p.total - p.paid > 0 && (
              <div className="flex gap-1">
                <Input type="number" min="0" className="!w-24 !py-1" value={pay[p.id] || ''} onChange={(e) => setPay({ ...pay, [p.id]: e.target.value })} />
                <Btn onClick={() => { payPO(p.id, pay[p.id]); setPay({ ...pay, [p.id]: '' }); notify('Payment recorded', 'ok'); }}>Pay</Btn>
              </div>)}</td>
          </tr>
        ))}
      </Table>
    </Modal>
  );
}
