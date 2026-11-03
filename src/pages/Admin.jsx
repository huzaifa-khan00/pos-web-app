import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { isFirebaseConfigured } from '../firebase/config';
import { Card, Btn, Field, Input, Badge } from '../components/ui';

export default function Admin() {
  const { users, upsert, notify, resetDemo } = useStore();
  const admin = users[0];
  const [pin, setPin] = useState('');

  const savePin = () => {
    if (!/^\d{4,8}$/.test(pin)) return notify('PIN must be 4–8 digits', 'error');
    upsert('users', { ...admin, pin });
    setPin('');
    notify('PIN changed', 'ok');
  };

  return (
    <div className="space-y-3 p-3">
      <Card title="Security">
        <div className="flex max-w-sm items-end gap-2">
          <Field label="New PIN (4–8 digits)" className="flex-1">
            <Input value={pin} inputMode="numeric" onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
          </Field>
          <Btn onClick={savePin}>Change PIN</Btn>
        </div>
        <p className="mt-2 text-xs text-slate-500">One owner account. The PIN only locks the screen; use the lock button in the top bar to lock.</p>
      </Card>

      <Card title="Data storage">
        <p className="text-sm">
          Mode: <Badge tone={isFirebaseConfigured ? 'green' : 'amber'}>{isFirebaseConfigured ? 'Firebase (Firestore)' : 'Local browser storage'}</Badge>
        </p>
        {!isFirebaseConfigured && <p className="mt-2 text-sm text-slate-500">To go live, copy <code>.env.example</code> to <code>.env</code>, paste your Firebase web-app values and restart. Existing demo data is uploaded to empty collections automatically.</p>}
        <Btn v="danger" className="mt-3" onClick={() => confirm('Reset ALL data to demo data?') && (resetDemo(), notify('Demo data restored', 'ok'))}><RotateCcw size={14} /> Reset to demo data</Btn>
      </Card>
    </div>
  );
}
