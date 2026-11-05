import { useState } from 'react';
import { Store } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Btn, Input } from '../components/ui';

export default function Login() {
  const login = useStore((s) => s.login);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!login(pin)) { setErr('Wrong PIN. Try again.'); setPin(''); }
  };

  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600"><Store size={20} /></span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">RetailPOS</h1>
            <p className="text-sm text-slate-400">Enter your PIN to open the register.</p>
          </div>
        </div>
        <Input type="password" inputMode="numeric" autoFocus value={pin} placeholder="PIN"
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setErr(''); }}
          className="!border-slate-700 !bg-slate-950 text-center text-2xl tracking-[0.4em] !text-slate-100" />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <Btn type="submit" className="w-full" disabled={!pin}>Unlock</Btn>
        <p className="text-center text-xs text-slate-500">Demo PIN: 1111</p>
      </form>
    </div>
  );
}
