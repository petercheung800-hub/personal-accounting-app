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

// Migration: add type column if not exists
try {
  db.exec('ALTER TABLE expenses ADD COLUMN type TEXT');
} catch (_e) {
  // ignore if column already exists
}

const ALLOWED_TYPES = new Set(['expense', 'income']);

function validateExpenseBody(body) {
  const errors = [];
  const p = {};

  // amount: required, non-negative number
  const amountNum = Number(body?.amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    errors.push('amount must be a non-negative number');
  } else {
    p.amount = amountNum;
  }

  // amountText: optional string
  p.amountText = body?.amountText != null ? String(body.amountText) : null;

  // category: optional string
  p.category = body?.category != null ? String(body.category) : null;

  // date: required YYYY-MM-DD and valid
  const dateStr = body?.date;
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    errors.push('date must be YYYY-MM-DD');
  } else {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (Number.isNaN(d.getTime())) {
      errors.push('date is invalid');
    } else {
      p.date = dateStr;
    }
  }

  // currency: optional (normalize uppercase)
  p.currency = body?.currency != null ? String(body.currency).toUpperCase() : null;

  // notes: optional
  p.notes = body?.notes != null ? String(body.notes) : null;

  // type: optional with default 'expense', must be allowed
  let typeVal = body?.type ?? 'expense';
  typeVal = String(typeVal);
  if (!ALLOWED_TYPES.has(typeVal)) {
    errors.push('type must be "expense" or "income"');
  } else {
    p.type = typeVal;
  }

  return { ok: errors.length === 0, errors, payload: p };
}

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
// List expenses with optional filters and pagination
// Query params: start=YYYY-MM-DD, end=YYYY-MM-DD, category=string, type=expense|income, page, pageSize
app.get('/api/expenses', (req, res) => {
  const { start, end, category, type } = req.query || {};
  const pageSize = Math.min(Number(req.query?.pageSize) || 50, 200);
  const page = Math.max(Number(req.query?.page) || 1, 1);
  const offset = (page - 1) * pageSize;

  const where = [];
  const params = [];
  if (typeof start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
    where.push('date >= ?');
    params.push(start);
  }
  if (typeof end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
    where.push('date <= ?');
    params.push(end);
  }
  if (typeof category === 'string' && category.length > 0) {
    where.push('category = ?');
    params.push(category);
  }
  if (typeof type === 'string' && ALLOWED_TYPES.has(type)) {
    where.push('type = ?');
    params.push(type);
  }

  const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const selectSql = `SELECT id, amount, amountText, category, date, notes, currency, created_at, type FROM expenses${whereSql} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(selectSql).all(...params, pageSize, offset);

  // Provide total count via header for future pagination usage
  try {
    const countSql = `SELECT COUNT(*) as c FROM expenses${whereSql}`;
    const total = db.prepare(countSql).get(...params).c;
    res.set('X-Total-Count', String(total));
  } catch (_e) {
    // ignore counting failure
  }

  res.json(rows);
});

app.post('/api/expenses', (req, res) => {
  const { ok, errors, payload } = validateExpenseBody(req.body || {});
  if (!ok) return res.status(400).json({ errors });
  const createdAt = Date.now();
  const stmt = db.prepare('INSERT INTO expenses (amount, amountText, category, date, notes, currency, created_at, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(payload.amount, payload.amountText, payload.category, payload.date, payload.notes, payload.currency, createdAt, payload.type);
  const item = { id: Number(info.lastInsertRowid), ...payload, created_at: createdAt };
  res.status(201).json(item);
});

app.put('/api/expenses/:id', (req, res) => {
  const id = Number(req.params.id);
  const { ok, errors, payload } = validateExpenseBody(req.body || {});
  if (!ok) return res.status(400).json({ errors });
  const stmt = db.prepare('UPDATE expenses SET amount=?, amountText=?, category=?, date=?, notes=?, currency=?, type=? WHERE id=?');
  const info = stmt.run(payload.amount, payload.amountText, payload.category, payload.date, payload.notes, payload.currency, payload.type, id);
  if (info.changes > 0) {
    const row = db.prepare('SELECT id, amount, amountText, category, date, notes, currency, created_at, type FROM expenses WHERE id=?').get(id);
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