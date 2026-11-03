import { useMemo, useState } from 'react';
import { Printer, Ban } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, Btn, Input, Select, Stat, Table, Badge } from '../components/ui';
import { money, fmtDate, rangeFor, round2, stockOf } from '../utils/calc';
import ReceiptModal from '../components/Receipt';

export default function Reports() {
  const { sales, products, users, voidSale, notify } = useStore();
  const [key, setKey] = useState('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [receipt, setReceipt] = useState(null);

  const [start, end] = rangeFor(key, from, to);
  const inRange = useMemo(
    () => sales.filter((s) => { const d = new Date(s.createdAt); return d >= start && d < end; }),
    [sales, key, from, to] // eslint-disable-line
  );
  const valid = inRange.filter((s) => !s.voided);

  const m = useMemo(() => {
    let revenue = 0, cost = 0, tax = 0, disc = 0;
    const pay = { cash: 0, card: 0, credit: 0 };
    const hours = Array(24).fill(0);
    const prod = {};
    valid.forEach((s) => {
      revenue += s.total; tax += s.tax; disc += s.discount;
      s.payments.forEach((p) => (pay[p.method] = (pay[p.method] || 0) + p.amount));
      hours[new Date(s.createdAt).getHours()] += s.total;
      s.items.forEach((i) => {
        cost += i.cost * i.qty;
        const r = (prod[i.productId] ||= { name: i.name, qty: 0, revenue: 0, margin: 0 });
        r.qty += i.qty; r.revenue += i.net; r.margin += i.net - i.cost * i.qty;
      });
    });
    // profit = sales revenue (excl. tax) minus product cost
    const net = round2(revenue - tax - cost);
    return { revenue: round2(revenue), tax: round2(tax), disc: round2(disc), net, pay, hours, top: Object.values(prod) };
  }, [valid]);

  const valuation = useMemo(() => {
    let cost = 0, retail = 0;
    products.filter((p) => p.type !== 'composite').forEach((p) => { cost += p.cost * p.stock; retail += p.price * p.stock; });
    return { cost, retail };
  }, [products]);

  const maxH = Math.max(1, ...m.hours);
  const payTotal = m.pay.cash + m.pay.card + m.pay.credit || 1;
  const byVol = [...m.top].sort((a, b) => b.qty - a.qty).slice(0, 8);
  const byMargin = [...m.top].sort((a, b) => b.margin - a.margin).slice(0, 8);

  const doVoid = (s) => {
    if (!confirm(`Void ${s.number}? Stock will be restored.`)) return;
    voidSale(s.id);
    notify(`${s.number} voided and stock restored`, 'ok');
  };

  return (
    <div className="space-y-3 p-3">
      <div className="no-print flex flex-wrap items-end gap-2">
        <Select value={key} onChange={(e) => setKey(e.target.value)} className="!w-40">
          <option value="today">Today</option><option value="yesterday">Yesterday</option><option value="week">This week</option><option value="custom">Custom</option>
        </Select>
        {key === 'custom' && <><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!w-40" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!w-40" /></>}
        <Btn v="ghost" className="ml-auto" onClick={() => window.print()}><Printer size={14} /> Print summary</Btn>
      </div>

      <div className="print-area space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Total sales" value={money(m.revenue)} sub={`${valid.length} invoices`} />
          <Stat label="Net profit" value={money(m.net)} sub="Revenue − tax − cost" />
          <Stat label="Tax collected" value={money(m.tax)} />
          <Stat label="Discounts given" value={money(m.disc)} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Hourly sales">
            <div className="flex h-44 items-end gap-1">
              {m.hours.map((v, h) => (
                <div key={h} className="flex flex-1 flex-col items-center justify-end" title={`${h}:00 — ${money(v)}`}>
                  <div className="w-full rounded-t bg-amber-500" style={{ height: `${(v / maxH) * 100}%`, minHeight: v ? 2 : 0 }} />
                  <span className="mt-1 text-[9px] text-slate-500">{h}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Payment breakdown">
            {['cash', 'card', 'credit'].map((k) => (
              <div key={k} className="mb-3">
                <div className="mb-1 flex justify-between text-sm"><span className="capitalize">{k === 'credit' ? 'Customer credit' : k}</span><b>{money(m.pay[k])}</b></div>
                <div className="h-2 rounded bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded bg-amber-500" style={{ width: `${(m.pay[k] / payTotal) * 100}%` }} /></div>
              </div>
            ))}
            <hr className="my-3 border-slate-200 dark:border-slate-700" />
            <div className="flex justify-between text-sm"><span>Inventory cost value</span><b>{money(valuation.cost)}</b></div>
            <div className="flex justify-between text-sm"><span>Inventory retail value</span><b>{money(valuation.retail)}</b></div>
            <div className="flex justify-between text-sm"><span>Potential margin</span><b>{money(valuation.retail - valuation.cost)}</b></div>
          </Card>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Top sellers by volume">
            <Table head={['Product', 'Qty', 'Revenue']} empty={!byVol.length && 'No sales in range.'}>
              {byVol.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.qty}</td><td>{money(r.revenue)}</td></tr>)}
            </Table>
          </Card>
          <Card title="Top sellers by margin">
            <Table head={['Product', 'Margin', 'Margin %']} empty={!byMargin.length && 'No sales in range.'}>
              {byMargin.map((r) => <tr key={r.name}><td>{r.name}</td><td>{money(r.margin)}</td><td>{r.revenue ? ((r.margin / r.revenue) * 100).toFixed(1) : 0}%</td></tr>)}
            </Table>
          </Card>
        </div>
      </div>

      <Card title="Invoices in range" className="no-print">
        <Table head={['Invoice', 'Time', 'Cashier', 'Total', 'Payment', 'Status', '']} empty={!inRange.length && 'No invoices.'}>
          {[...inRange].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((s) => (
            <tr key={s.id}>
              <td className="font-medium">{s.number}</td><td>{fmtDate(s.createdAt)}</td>
              <td>{users.find((u) => u.id === s.cashierId)?.name}</td><td>{money(s.total)}</td>
              <td className="capitalize">{s.payments.length > 1 ? 'split' : s.payments[0]?.method}</td>
              <td>{s.voided ? <Badge tone="red">void</Badge> : <Badge tone="green">paid</Badge>}</td>
              <td className="whitespace-nowrap text-right">
                <Btn v="ghost" onClick={() => setReceipt(s)}>Receipt</Btn>{' '}
                {!s.voided && <Btn v="danger" onClick={() => doVoid(s)}><Ban size={14} /> Void</Btn>}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
