import { useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useStore, ID } from '../store/useStore';
import { Card, Btn, Modal, Field, Input, Table, Badge } from '../components/ui';
import { money, fmtDate } from '../utils/calc';
import ReceiptModal from '../components/Receipt';

export default function Customers() {
  const { customers, upsert, remove, notify } = useStore();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);
  const rows = customers.filter((c) => !q || (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));

  const del = (c) => {
    if (c.balance > 0) return notify('Customer has an outstanding balance', 'error');
    if (confirm(`Delete ${c.name}?`)) remove('customers', c.id);
  };
  const save = () => {
    if (!edit.name.trim()) return notify('Name required', 'error');
    const { isNew, ...c } = edit;
    upsert('customers', { ...c, creditLimit: +c.creditLimit || 0 });
    setEdit(null);
  };

  return (
    <div className="p-3">
      <Card title="Customers" actions={<Btn onClick={() => setEdit({ id: ID(), name: '', phone: '', email: '', balance: 0, creditLimit: 0, points: 0, redeemed: 0, isNew: true })}><Plus size={14} /> Add</Btn>}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone" className="mb-3 max-w-sm" />
        <Table head={['Name', 'Phone', 'Balance owed', 'Credit limit', 'Points', '']} hide={[2, 4]} empty={!rows.length && 'No customers.'}>
          {rows.map((c) => (
            <tr key={c.id}>
              <td className="font-medium">{c.name}</td><td>{c.phone}</td>
              <td>{c.balance > 0 ? <Badge tone="red">{money(c.balance)}</Badge> : money(0)}</td>
              <td>{money(c.creditLimit)}</td><td>{c.points}</td>
              <td className="whitespace-nowrap text-right">
                <button onClick={() => setView(c.id)} title="Account" className="p-2 text-slate-500 hover:text-brand-600"><BookOpen size={16} /></button>
                <button onClick={() => setEdit(c)} className="p-2 text-slate-500 hover:text-brand-600"><Pencil size={16} /></button>
                <button onClick={() => del(c)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      {edit && (
        <Modal title="Customer" onClose={() => setEdit(null)} footer={<><Btn v="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
          <div className="space-y-3">
            <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Phone"><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Credit limit"><Input type="number" min="0" value={edit.creditLimit} onChange={(e) => setEdit({ ...edit, creditLimit: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {view && <Account id={view} onClose={() => setView(null)} />}
    </div>
  );
}

function Account({ id, onClose }) {
  const { customers, ledger, sales, settleCustomer, adjustPoints, notify } = useStore();
  const c = customers.find((x) => x.id === id);
  const [pay, setPay] = useState('');
  const [pts, setPts] = useState('');
  const [receipt, setReceipt] = useState(null);
  if (!c) return null;
  const led = ledger.filter((l) => l.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inv = sales.filter((s) => s.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Modal wide title={`${c.name} — account`} onClose={onClose}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="text-xs text-slate-500">Balance owed</div>
          <div className="text-xl font-semibold">{money(c.balance)}</div>
          <div className="mt-2 flex gap-2">
            <Input type="number" min="0" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="Payment amount" />
            <Btn v="ok" onClick={() => { settleCustomer(id, pay); setPay(''); notify('Payment recorded', 'ok'); }}>Receive</Btn>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="text-xs text-slate-500">Loyalty points</div>
          <div className="text-xl font-semibold">{c.points} <span className="text-sm font-normal text-slate-500">(redeemed {c.redeemed})</span></div>
          <div className="mt-2 flex gap-2">
            <Input type="number" value={pts} onChange={(e) => setPts(e.target.value)} placeholder="+ add / − redeem" />
            <Btn onClick={() => { adjustPoints(id, Number(pts) || 0); setPts(''); }}>Adjust</Btn>
          </div>
        </div>
      </div>
      <h4 className="mb-1 text-sm font-semibold">Ledger</h4>
      <Table head={['Date', 'Type', 'Amount', 'Note']} empty={!led.length && 'No ledger entries.'}>
        {led.map((l) => <tr key={l.id}><td>{fmtDate(l.createdAt)}</td><td><Badge tone={l.type === 'debit' ? 'red' : 'green'}>{l.type}</Badge></td><td>{money(l.amount)}</td><td>{l.note}</td></tr>)}
      </Table>
      <h4 className="mb-1 mt-4 text-sm font-semibold">Purchase history</h4>
      <Table head={['Invoice', 'Date', 'Total', '']} empty={!inv.length && 'No purchases yet.'}>
        {inv.map((s) => (
          <tr key={s.id}><td>{s.number} {s.voided && <Badge tone="red">void</Badge>}</td><td>{fmtDate(s.createdAt)}</td><td>{money(s.total)}</td>
            <td className="text-right"><Btn v="ghost" onClick={() => setReceipt(s)}>Receipt</Btn></td></tr>
        ))}
      </Table>
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </Modal>
  );
}
