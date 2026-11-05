import { X } from 'lucide-react';

// Modals are bottom sheets on phones and centred dialogs from the sm breakpoint up.
export function Modal({ title, onClose, children, wide, footer }) {
  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-lg ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="-mr-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  dark: 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ok: 'bg-emerald-700 text-white hover:bg-emerald-800',
  ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
};
export function Btn({ v = 'primary', className = '', ...p }) {
  return (
    <button
      {...p}
      className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[v]} ${className}`}
    />
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>}
      {children}
    </label>
  );
}

export const inputCls =
  'min-h-[40px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm';

export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}
export function Select({ children, ...p }) {
  return <select {...p} className={`${inputCls} ${p.className || ''}`}>{children}</select>;
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:px-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </header>
      )}
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  };
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

// hide = column numbers (1-based) to hide on phones
export function Table({ head, children, empty, hide = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${hide.map((n) => `hide-c-${n}`).join(' ')}`}>
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {head.map((h, i) => <th key={i} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_td]:px-2 [&_td]:py-2.5 [&_tr]:border-b [&_tr]:border-slate-100 dark:[&_tr]:border-slate-800/70">{children}</tbody>
      </table>
      {empty && <p className="py-8 text-center text-sm text-slate-500">{empty}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold sm:text-xl">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
