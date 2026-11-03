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
    if (!login(pin)) { setErr('Incorrect PIN'); setPin(''); }
  };

  return (
    <div className="flex h-full items-center justify-center bg-slate-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-slate-800 p-6 text-slate-100 shadow-2xl">
        <div className="text-center">
          <Store className="mx-auto text-amber-400" size={40} />
          <h1 className="mt-2 text-2xl font-bold">RetailPOS</h1>
          <p className="text-sm text-slate-400">Enter your PIN</p>
        </div>
        <Input type="password" inputMode="numeric" autoFocus value={pin} placeholder="PIN"
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setErr(''); }}
          className="text-center text-2xl tracking-[0.5em]" />
        {err && <p className="text-center text-sm text-red-400">{err}</p>}
        <Btn type="submit" className="w-full" disabled={!pin}>Unlock</Btn>
        <p className="text-center text-xs text-slate-500">Demo PIN: 1111</p>
      </form>
    </div>
  );
}
