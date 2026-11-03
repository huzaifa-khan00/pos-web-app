import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 no-print" onMouseDown={onClose}>
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-xl bg-white shadow-2xl dark:bg-slate-800 ${wide ? 'max-w-3xl' : 'max-w-md'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-200 dark:hover:bg-slate-700"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">{footer}</div>}
      </div>
    </div>
  );
}

const variants = {
  primary: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
  dark: 'bg-slate-700 text-white hover:bg-slate-600',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ok: 'bg-emerald-600 text-white hover:bg-emerald-500',
  ghost: 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
};
export function Btn({ v = 'primary', className = '', ...p }) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[v]} ${className}`}
    />
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>}
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function Select({ children, ...p }) {
  return <select {...p} className={`${inputCls} ${p.className || ''}`}>{children}</select>;
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="font-semibold">{title}</h2>
          <div className="flex gap-2">{actions}</div>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {head.map((h, i) => <th key={i} className="px-2 py-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_td]:px-2 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-slate-100 dark:[&_tr]:border-slate-700/60">{children}</tbody>
      </table>
      {empty && <p className="py-6 text-center text-sm text-slate-500">{empty}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
