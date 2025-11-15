import { describe, it, expect, afterEach, vi } from 'vitest';
import { getDefaultCurrency, formatCurrency, fetchRates } from './currency.js';

describe('getDefaultCurrency', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns CNY for zh-CN', () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' });
    expect(getDefaultCurrency()).toBe('CNY');
  });

  it('returns USD for en-US', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(getDefaultCurrency()).toBe('USD');
  });

  it('falls back to USD for unknown locale', () => {
    vi.stubGlobal('navigator', { language: 'xx-YY' });
    expect(getDefaultCurrency()).toBe('USD');
  });
});

describe('formatCurrency', () => {
  it('falls back when Intl.NumberFormat throws', () => {
    const spy = vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
      throw new Error('format fail');
    });
    const formatted = formatCurrency(12.34, 'ABC', 'en-US');
    expect(formatted).toBe(' 12.34');
    spy.mockRestore();
  });
});

describe('fetchRates', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns default rates when network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
    const rates = await fetchRates('CNY');
    expect(rates).toBeDefined();
    expect(rates).toHaveProperty('USD');
    expect(typeof rates.USD).toBe('number');
  });
});