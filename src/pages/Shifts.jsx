import { useState } from 'react';
import { Printer, ArrowDownToLine, ArrowUpFromLine, Lock, Play } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card, Btn, Modal, Field, Input, Table, Stat, Badge } from '../components/ui';
import { money, fmtDate } from '../utils/calc';
import { STORE_NAME } from '../components/Receipt';

export default function Shifts() {
  const st = useStore();
  const shift = st.openShift();
  const [start, setStart] = useState('');
  const [move, setMove] = useState(null);
  const [closing, setClosing] = useState(false);
  const [report, setReport] = useState(null);
  const sum = shift ? st.shiftSummary(shift) : null;
  const history = st.shifts.filter((s) => s.closedAt).sort((a, b) => b.closedAt.localeCompare(a.closedAt));

  return (
    <div className="space-y-3 p-3">
      {!shift ? (
        <Card title="Open register">
          <div className="flex max-w-md items-end gap-2">
            <Field label="Starting cash float" className="flex-1"><Input type="number" min="0" value={start} onChange={(e) => setStart(e.target.value)} placeholder="0.00" /></Field>
            <Btn v="ok" onClick={() => { st.startShift(start); setStart(''); st.notify('Shift started', 'ok'); }}><Play size={14} /> Start shift</Btn>
          </div>
        </Card>
      ) : (
        <Card title={`Current shift · opened ${fmtDate(shift.openedAt)}`}
          actions={<>
            <Btn v="dark" onClick={() => setMove('in')}><ArrowDownToLine size={14} /> Cash in</Btn>
            <Btn v="dark" onClick={() => setMove('out')}><ArrowUpFromLine size={14} /> Cash out</Btn>
            <Btn v="danger" onClick={() => setClosing(true)}><Lock size={14} /> Close shift</Btn>
          </>}>
          {/* X-report: no counted cash, safe to view mid-shift */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Sales" value={money(sum.total)} sub={`${sum.count} invoices`} />
            <Stat label="Cash sales" value={money(sum.by.cash)} />
            <Stat label="Card sales" value={money(sum.by.card)} />
            <Stat label="On account" value={money(sum.by.credit)} />
          </div>
          <p className="mt-3 text-sm text-slate-500">Float {money(shift.startingFloat)} · Cash in {money(sum.cashIn)} · Cash out {money(sum.cashOut)}. Expected drawer total is hidden until you close (blind count).</p>
          {shift.movements.length > 0 && (
            <Table head={['Time', 'Type', 'Amount', 'Note']}>
              {shift.movements.map((m) => (
                <tr key={m.id}><td>{fmtDate(m.at)}</td><td><Badge tone={m.type === 'in' ? 'green' : 'red'}>{m.type}</Badge></td><td>{money(m.amount)}</td><td>{m.note}</td></tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Card title="Closed shifts (Z-reports)">
        <Table head={['Closed', 'Cashier', 'Expected', 'Counted', 'Variance', '']} empty={!history.length && 'No closed shifts yet.'}>
          {history.map((s) => (
            <tr key={s.id}>
              <td>{fmtDate(s.closedAt)}</td>
              <td>{st.users.find((u) => u.id === s.cashierId)?.name}</td>
              <td>{money(s.expectedCash)}</td><td>{money(s.countedCash)}</td>
              <td className={s.variance < 0 ? 'text-red-500' : s.variance > 0 ? 'text-amber-500' : 'text-emerald-600'}>{money(s.variance)}</td>
              <td className="text-right"><Btn v="ghost" onClick={() => setReport(s)}><Printer size={14} /> View</Btn></td>
            </tr>
          ))}
        </Table>
      </Card>

      {move && <MoveModal type={move} onClose={() => setMove(null)} />}
      {closing && <CloseModal onClose={() => setClosing(false)} onClosed={(s) => { setClosing(false); setReport(s); }} />}
      {report && <ZReport shift={report} onClose={() => setReport(null)} />}
    </div>
  );
}

function MoveModal({ type, onClose }) {
  const cashMovement = useStore((s) => s.cashMovement);
  const notify = useStore((s) => s.notify);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const save = () => {
    if (!(Number(amount) > 0)) return notify('Enter an amount', 'error');
    cashMovement(type, amount, note);
    notify('Drawer updated', 'ok');
    onClose();
  };
  return (
    <Modal title={type === 'in' ? 'Cash in' : 'Cash out'} onClose={onClose} footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save</Btn></>}>
      <div className="space-y-3">
        <Field label="Amount"><Input autoFocus type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'in' ? 'Added change' : 'Drawer payout'} /></Field>
      </div>
    </Modal>
  );
}

function CloseModal({ onClose, onClosed }) {
  const closeShift = useStore((s) => s.closeShift);
  const [counted, setCounted] = useState('');
  return (
    <Modal title="Close shift (blind count)" onClose={onClose}
      footer={<><Btn v="ghost" onClick={onClose}>Cancel</Btn><Btn v="danger" disabled={counted === ''} onClick={() => onClosed(closeShift(counted))}>Close & print Z-report</Btn></>}>
      <p className="mb-3 text-sm text-slate-500">Count the cash in the drawer and enter the total. The expected amount is revealed after closing.</p>
      <Field label="Actual counted cash"><Input autoFocus type="number" min="0" value={counted} onChange={(e) => setCounted(e.target.value)} /></Field>
    </Modal>
  );
}

function ZReport({ shift, onClose }) {
  const st = useStore();
  const sum = st.shiftSummary(shift);
  const row = 'flex justify-between';
  return (
    <Modal title="Z-Report" onClose={onClose} footer={<><Btn v="ghost" onClick={onClose}>Close</Btn><Btn onClick={() => window.print()}><Printer size={14} /> Print</Btn></>}>
      <div className="overflow-x-auto rounded bg-slate-300 p-3">
        <div className="print-area mx-auto bg-white p-3 font-mono text-[12px] text-black" style={{ width: '80mm' }}>
          <div className="text-center font-bold">{STORE_NAME}</div>
          <div className="text-center">Z-REPORT / SHIFT CLOSURE</div>
          <hr className="my-2 border-dashed border-black" />
          <div className={row}><span>Cashier</span><span>{st.users.find((u) => u.id === shift.cashierId)?.name}</span></div>
          <div className={row}><span>Opened</span><span>{fmtDate(shift.openedAt)}</span></div>
          <div className={row}><span>Closed</span><span>{fmtDate(shift.closedAt)}</span></div>
          <hr className="my-2 border-dashed border-black" />
          <div className={row}><span>Invoices</span><span>{sum.count}</span></div>
          <div className={row}><span>Total sales</span><span>{sum.total.toFixed(2)}</span></div>
          <div className={row}><span>  Cash</span><span>{sum.by.cash.toFixed(2)}</span></div>
          <div className={row}><span>  Card</span><span>{sum.by.card.toFixed(2)}</span></div>
          <div className={row}><span>  On account</span><span>{sum.by.credit.toFixed(2)}</span></div>
          <hr className="my-2 border-dashed border-black" />
          <div className={row}><span>Starting float</span><span>{shift.startingFloat.toFixed(2)}</span></div>
          <div className={row}><span>Cash in</span><span>{sum.cashIn.toFixed(2)}</span></div>
          <div className={row}><span>Cash out</span><span>{sum.cashOut.toFixed(2)}</span></div>
          <div className={row}><span>Expected cash</span><span>{shift.expectedCash.toFixed(2)}</span></div>
          <div className={row}><span>Counted cash</span><span>{shift.countedCash.toFixed(2)}</span></div>
          <div className={`${row} font-bold`}>
            <span>{shift.variance < 0 ? 'SHORTAGE' : shift.variance > 0 ? 'OVERAGE' : 'VARIANCE'}</span>
            <span>{shift.variance.toFixed(2)}</span>
          </div>
          <hr className="my-2 border-dashed border-black" />
          <div className="mt-6 flex justify-between"><span>Cashier sign: ______</span><span>Manager: ______</span></div>
        </div>
      </div>
    </Modal>
  );
}
