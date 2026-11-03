import { useEffect, useState } from 'react';
import {
  ShoppingCart, Package, Truck, Wallet, Users, Building2, BarChart3, Settings, Lock, Sun, Moon, Cloud, HardDrive,
} from 'lucide-react';
import { useStore } from './store/useStore';
import { isFirebaseConfigured } from './firebase/config';
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

export default function App() {
  const userId = useStore((s) => s.currentUserId);
  const theme = useStore((s) => s.theme);
  const toast = useStore((s) => s.toast);
  const logout = useStore((s) => s.logout);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const connectCloud = useStore((s) => s.connectCloud);
  const [page, setPage] = useState('pos');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    let off = () => {};
    if (isFirebaseConfigured) connectCloud().then((u) => (off = u));
    return () => off();
  }, [connectCloud]);

  if (!userId) return <><Login />{toast && <Toast t={toast} />}</>;

  const Active = (NAV.find((n) => n.id === page) || NAV[0]).C;

  return (
    <div className="flex h-full flex-col">
      <header className="no-print flex items-center gap-1 bg-slate-800 px-3 py-2 text-white shadow dark:bg-slate-950">
        <div className="mr-3 text-lg font-bold text-amber-400">RetailPOS</div>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                page === id ? 'bg-amber-500 text-slate-900' : 'text-slate-200 hover:bg-slate-700'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <span title={isFirebaseConfigured ? 'Synced with Firebase' : 'Local storage mode (no Firebase config)'}
          className="mx-2 hidden items-center gap-1 text-xs text-slate-300 sm:flex">
          {isFirebaseConfigured ? <Cloud size={14} /> : <HardDrive size={14} />}
          {isFirebaseConfigured ? 'Cloud' : 'Local'}
        </span>
        <button onClick={toggleTheme} className="rounded p-2 hover:bg-slate-700">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button onClick={logout} className="rounded p-2 hover:bg-slate-700" title="Lock"><Lock size={16} /></button>
      </header>
      <main className="min-h-0 flex-1 overflow-auto"><Active goto={setPage} /></main>
      {toast && <Toast t={toast} />}
    </div>
  );
}

function Toast({ t }) {
  const color = t.kind === 'error' ? 'bg-red-600' : t.kind === 'ok' ? 'bg-emerald-600' : 'bg-slate-700';
  return <div className={`no-print fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${color}`}>{t.msg}</div>;
}
