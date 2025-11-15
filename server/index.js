import express from 'express';

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

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

// Placeholder expenses API (integration optional)
const inMemoryExpenses = [];
app.get('/api/expenses', (_req, res) => {
  res.json(inMemoryExpenses);
});
app.post('/api/expenses', (req, res) => {
  const item = { id: Date.now(), ...req.body };
  inMemoryExpenses.push(item);
  res.status(201).json(item);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});