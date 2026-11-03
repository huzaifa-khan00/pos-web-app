# RetailPOS — Aronium-style web POS

React (Vite) · Tailwind · Lucide · Zustand · Firebase (optional, plug-in later)

## Run

```bash
npm install
npm run dev
```

Single owner account, demo PIN **1111** (change it in Settings).

## Data storage

- **No Firebase config (default):** everything is saved in the browser's localStorage with demo data.
- **With Firebase:** copy `.env.example` to `.env`, paste your Firebase web-app values, restart `npm run dev`.
  The app then streams all collections from Firestore and uploads the demo data into any empty collection on first run.
  No code changes are needed. The only file that reads the keys is `src/firebase/config.js`.

Firestore collections used: products, categories, units, customers, suppliers, users, shifts, sales, purchaseOrders, stockLogs, parked, ledger.
(While testing, use Firestore in test mode. Before real use, add proper security rules, because PINs are stored in the `users` collection.)

## Structure

```
src/
  firebase/config.js   ← the only place Firebase keys are read (from .env)
  data/seed.js         ← dummy fallback data for every schema
  data/sync.js         ← localStorage + Firestore adapter
  store/useStore.js    ← Zustand store: cart, checkout, shifts, stock, POs, voids
  utils/calc.js        ← totals, tax, discounts, composite stock, date ranges
  pages/               ← POS, Inventory, Purchases, Shifts, Customers, Suppliers, Reports, Admin
  components/          ← ui kit, 80mm receipt
```

## Notes

- Barcodes/SKUs are typed into the search box (press Enter on an exact match). There are no global key listeners.
- No expense tracking; only drawer Cash In/Out.
- No roles: one admin does everything. The PIN only locks the screen.
- Tax is added on top of the discounted price.
- Net profit = sales revenue − tax − product cost.
