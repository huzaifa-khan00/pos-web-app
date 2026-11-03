// Persistence adapter: localStorage always, Firestore when configured.
import { db } from '../firebase/config';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';

export const COLLECTIONS = [
  'products', 'categories', 'units', 'customers', 'suppliers', 'users',
  'shifts', 'sales', 'purchaseOrders', 'stockLogs', 'parked', 'ledger',
];
const KEY = 'retail-pos-v1';

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocal(state) {
  try {
    const out = {};
    COLLECTIONS.forEach((c) => (out[c] = state[c]));
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch (e) {
    console.warn('Local save failed', e);
  }
}

const clean = (o) => JSON.parse(JSON.stringify(o)); // Firestore rejects undefined

export function cloudUpsert(col, item) {
  if (!db) return;
  setDoc(doc(db, col, item.id), clean(item)).catch((e) => console.error('Cloud save failed', col, e));
}

export function cloudRemove(col, id) {
  if (!db) return;
  deleteDoc(doc(db, col, id)).catch((e) => console.error('Cloud delete failed', col, e));
}

// Pushes seed data to an empty cloud collection, then streams live updates into the store.
export async function cloudConnect(getState, setCol) {
  if (!db) return () => {};
  const unsubs = [];
  for (const col of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, col));
      if (snap.empty) {
        const items = getState()[col] || [];
        for (let i = 0; i < items.length; i += 400) {
          const batch = writeBatch(db);
          items.slice(i, i + 400).forEach((it) => batch.set(doc(db, col, it.id), clean(it)));
          await batch.commit();
        }
      }
      unsubs.push(
        onSnapshot(collection(db, col), (s) => {
          setCol(col, s.docs.map((d) => d.data()));
        })
      );
    } catch (e) {
      console.error('Cloud sync failed for', col, e);
    }
  }
  return () => unsubs.forEach((u) => u());
}
