import { Printer } from 'lucide-react';
import { Modal, Btn } from './ui';
import { money, fmtDate } from '../utils/calc';
import { useStore } from '../store/useStore';

export const STORE_NAME = 'RETAIL POS STORE';

export function ReceiptBody({ sale }) {
  const customers = useStore((s) => s.customers);
  const users = useStore((s) => s.users);
  const cust = customers.find((c) => c.id === sale.customerId);
  const cashier = users.find((u) => u.id === sale.cashierId);
  const row = 'flex justify-between';
  return (
    <div className="print-area mx-auto bg-white p-3 font-mono text-[12px] leading-tight text-black" style={{ width: '80mm' }}>
      <div className="text-center">
        <div className="text-base font-bold">{STORE_NAME}</div>
        <div>Main Street, Karachi</div>
        <div>Tel: 021-0000000</div>
      </div>
      <hr className="my-2 border-dashed border-black" />
      <div className={row}><span>Invoice</span><span>{sale.number}</span></div>
      <div className={row}><span>Date</span><span>{fmtDate(sale.createdAt)}</span></div>
      <div className={row}><span>Cashier</span><span>{cashier?.name || '-'}</span></div>
      {cust && <div className={row}><span>Customer</span><span>{cust.name}</span></div>}
      {sale.voided && <div className="my-1 text-center font-bold">*** VOIDED ***</div>}
      <hr className="my-2 border-dashed border-black" />
      {sale.items.map((i, k) => (
        <div key={k} className="mb-1">
          <div>{i.name}</div>
          <div className={row}><span>{i.qty} x {i.price.toFixed(2)}</span><span>{(i.price * i.qty).toFixed(2)}</span></div>
        </div>
      ))}
      <hr className="my-2 border-dashed border-black" />
      <div className={row}><span>Subtotal</span><span>{sale.subtotal.toFixed(2)}</span></div>
      {sale.discount > 0 && <div className={row}><span>Discount</span><span>-{sale.discount.toFixed(2)}</span></div>}
      <div className={row}><span>Tax</span><span>{sale.tax.toFixed(2)}</span></div>
      <div className={`${row} text-sm font-bold`}><span>TOTAL</span><span>{money(sale.total)}</span></div>
      <hr className="my-2 border-dashed border-black" />
      {sale.payments.map((p, k) => (
        <div key={k} className={row}><span className="capitalize">{p.method}</span><span>{p.amount.toFixed(2)}</span></div>
      ))}
      {sale.change > 0 && <div className={row}><span>Change</span><span>{sale.change.toFixed(2)}</span></div>}
      <hr className="my-2 border-dashed border-black" />
      <div className="text-center">Thank you for shopping with us!</div>
    </div>
  );
}

export default function ReceiptModal({ sale, onClose }) {
  return (
    <Modal title={`Receipt ${sale.number}`} onClose={onClose}
      footer={<><Btn v="ghost" onClick={onClose}>Close</Btn><Btn onClick={() => window.print()}><Printer size={16} /> Print</Btn></>}>
      <div className="overflow-x-auto rounded bg-slate-300 p-3"><ReceiptBody sale={sale} /></div>
    </Modal>
  );
}
