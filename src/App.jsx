import { useEffect, useState } from 'react';
import {
  ShoppingCart, Package, Truck, Wallet, Users, Building2, BarChart3, Settings, Lock, Sun, Moon, Cloud, HardDrive, Store,
  MoreHorizontal,
} from 'lucide-react';
import { useStore } from './store/useStore';
import { isFirebaseConfigured } from './firebase/config';
import { Modal } from './components/ui';
import Login from './pages/Login';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Shifts from './pages/Shifts';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

const NAV = [
  { id: 'pos', label: 'POS', icon: ShoppingCart, C: POS },
  { id: 'shifts', label: 'Register', icon: Wallet, C: Shifts },
  { id: 'inventory', label: 'Inventory', icon: Package, C: Inventory },
  { id: 'purchases', label: 'Purchases', icon: Truck, C: Purchases },
  { id: 'customers', label: 'Customers', icon: Users, C: Customers },
  { id: 'suppliers', label: 'Suppliers', icon: Building2, C: Suppliers },
  { id: 'reports', label: 'Reports', icon: BarChart3, C: Reports },
  { id: 'settings', label: 'Settings', icon: Settings, C: Admin },
];
// shown in the phone's bottom bar; the rest go under "More"
const PRIMARY = ['pos', 'shifts', 'inventory', 'reports'];

export default function App() {
  const userId = useStore((s) => s.currentUserId);
  const theme = useStore((s) => s.theme);
  const toast = useStore((s) => s.toast);
  const logout = useStore((s) => s.logout);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const connectCloud = useStore((s) => s.connectCloud);
  const [page, setPage] = useState('pos');
  const [more, setMore] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    let off = () => {};
    if (isFirebaseConfigured) connectCloud().then((u) => (off = u));
    return () => off();
  }, [connectCloud]);

  if (!userId) return <><Login />{toast && <Toast t={toast} />}</>;

  const current = NAV.find((n) => n.id === page) || NAV[0];
  const Active = current.C;
  const primary = NAV.filter((n) => PRIMARY.includes(n.id));
  const secondary = NAV.filter((n) => !PRIMARY.includes(n.id));
  const go = (id) => { setPage(id); setMore(false); };
  const storage = isFirebaseConfigured ? { Icon: Cloud, text: 'Cloud sync' } : { Icon: HardDrive, text: 'Local storage' };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* desktop sidebar */}
      <aside className="no-print hidden w-52 shrink-0 flex-col bg-slate-900 text-slate-300 dark:border-r dark:border-slate-800 dark:bg-slate-950 lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white"><Store size={17} /></span>
          <span className="text-[15px] font-semibold text-white">RetailPOS</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                current.id === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}>
              <Icon size={17} className={current.id === id ? 'text-brand-400' : ''} /> {label}
            </button>
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-slate-800 p-2">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500"><storage.Icon size={14} /> {storage.text}</div>
          <button onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/60 hover:text-slate-200">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/60 hover:text-slate-200">
            <Lock size={17} /> Lock screen
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* phone top bar */}
        <header className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <h1 className="text-[15px] font-semibold">{current.label}</h1>
          <div className="flex items-center gap-0.5 text-slate-500">
            <span className="mr-1 flex items-center gap-1 text-xs"><storage.Icon size={13} /> {storage.text}</span>
            <button onClick={toggleTheme} aria-label="Switch theme" className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={logout} aria-label="Lock screen" className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Lock size={18} /></button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto"><Active goto={setPage} /></main>

        {/* phone bottom tabs */}
        <nav className="no-print flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          {primary.map(({ id, label, icon: Icon }) => (
            <TabBtn key={id} active={current.id === id} onClick={() => go(id)} icon={Icon} label={label} />
          ))}
          <TabBtn active={secondary.some((n) => n.id === current.id)} onClick={() => setMore(true)} icon={MoreHorizontal} label="More" />
        </nav>
      </div>

      {more && (
        <Modal title="More" onClose={() => setMore(false)}>
          <div className="grid grid-cols-2 gap-2">
            {secondary.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => go(id)}
                className="flex items-center gap-2.5 rounded-md border border-slate-200 px-3 py-3 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                <Icon size={18} className="text-brand-600 dark:text-brand-400" /> {label}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {toast && <Toast t={toast} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
        active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'
      }`}>
      <Icon size={20} /> {label}
    </button>
  );
}

function Toast({ t }) {
  const color = t.kind === 'error' ? 'bg-red-700' : t.kind === 'ok' ? 'bg-emerald-700' : 'bg-slate-800';
  return (
    <div className={`no-print fixed bottom-20 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-lg lg:bottom-6 ${color}`}>
      {t.msg}
    </div>
  );
}
