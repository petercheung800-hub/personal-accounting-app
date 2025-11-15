import express from 'express';
import Database from 'better-sqlite3';

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// SQLite init
const db = new Database('server/database.sqlite');
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL,
    amountText TEXT,
    category TEXT,
    date TEXT,
    notes TEXT,
    currency TEXT,
    created_at INTEGER
  );
`);

// Exchange rates proxy with safe fallback
app.get('/api/rates', async (req, res) => {
  const base = String(req.query.base || 'CNY').toUpperCase();
  const url = `https://api.exchangerate.host/latest?base=${base}&symbols=USD,EUR,GBP,JPY,CNY`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (data && data.rates) {
      return res.json(data.rates);
    }
  } catch (_e) {
    // ignore network errors
  }
  // Fallback demo rates
  return res.json({
    USD: 0.137,
    EUR: 0.129,
    GBP: 0.109,
    JPY: 20.0,
    CNY: 1,
  });
});

// Expenses CRUD backed by SQLite
app.get('/api/expenses', (_req, res) => {
  const rows = db.prepare('SELECT id, amount, amountText, category, date, notes, currency, created_at FROM expenses ORDER BY date DESC, id DESC').all();
  res.json(rows);
});

app.post('/api/expenses', (req, res) => {
  const { amount, amountText, category, date, notes, currency } = req.body || {};
  const createdAt = Date.now();
  const stmt = db.prepare('INSERT INTO expenses (amount, amountText, category, date, notes, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(Number(amount) || 0, amountText ?? null, category ?? null, date ?? null, notes ?? null, currency ?? null, createdAt);
  const item = { id: Number(info.lastInsertRowid), amount: Number(amount) || 0, amountText: amountText ?? null, category, date, notes, currency, created_at: createdAt };
  res.status(201).json(item);
});

app.put('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  const { amount, amountText, category, date, notes, currency } = req.body || {};
  const stmt = db.prepare('UPDATE expenses SET amount=?, amountText=?, category=?, date=?, notes=?, currency=? WHERE id=?');
  const info = stmt.run(Number(amount) || 0, amountText ?? null, category ?? null, date ?? null, notes ?? null, currency ?? null, id);
  if (info.changes > 0) {
    const row = db.prepare('SELECT id, amount, amountText, category, date, notes, currency, created_at FROM expenses WHERE id=?').get(id);
    res.json(row);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM expenses WHERE id=?').run(id);
  if (info.changes > 0) {
    res.status(204).end();
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});