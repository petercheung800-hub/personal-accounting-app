// 货币工具：符号、默认映射、格式化、汇率获取与换算

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: '美元' },
  { code: 'EUR', symbol: '€', name: '欧元' },
  { code: 'GBP', symbol: '£', name: '英镑' },
  { code: 'JPY', symbol: '¥', name: '日元' },
  { code: 'CNY', symbol: '¥', name: '人民币' },
];

export const symbolMap = SUPPORTED_CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c.symbol;
  return acc;
}, {});

export const nameMap = SUPPORTED_CURRENCIES.reduce((acc, c) => {
  acc[c.code] = c.name;
  return acc;
}, {});

export function getSymbol(code) {
  return symbolMap[code] || '';
}

export function getName(code) {
  return nameMap[code] || code;
}

// 根据偏好返回展示文本：代码、符号或中文名
export function getCurrencyLabel(code, mode = 'name') {
  if (!code) return '';
  switch (mode) {
    case 'symbol':
      return getSymbol(code);
    case 'code':
      return code;
    case 'name':
    default:
      return getName(code);
  }
}

export function getDefaultCurrency() {
  const lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'zh-CN';
  const lower = lang.toLowerCase();
  if (lower.startsWith('zh')) return 'CNY';
  if (lower === 'en-us') return 'USD';
  if (lower === 'en-gb') return 'GBP';
  if (lower === 'ja-jp') return 'JPY';
  // 常见欧盟语言映射到欧元
  const eurLangs = ['fr', 'de', 'es', 'it', 'nl', 'pt', 'pl', 'cs', 'sk', 'sl', 'fi'];
  if (eurLangs.some(l => lower.startsWith(l))) return 'EUR';
  return 'USD';
}

export function formatCurrency(amount, currency, locale = (typeof navigator !== 'undefined' ? navigator.language : 'zh-CN')) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch (_e) {
    const sym = getSymbol(currency);
    return `${sym} ${Number(amount).toFixed(2)}`;
  }
}

// 获取汇率：以 base 为基准，返回其他币种相对 base 的乘数
export async function fetchRates(base = 'CNY') {
  const url = `/api/rates?base=${base}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.rates) {
      return data.rates;
    }
  } catch (_e) {
    // ignore
  }
  // 回退固定汇率（仅用于演示；非实时）
  return {
    USD: 0.137, // 1 CNY -> 0.137 USD
    EUR: 0.129,
    GBP: 0.109,
    JPY: 20.0,
    CNY: 1,
  };
}

export function convertAmount(amount, to, rates, base = 'CNY') {
  const num = Number(amount) || 0;
  if (!rates || !rates[to] || to === base) return num;
  return num * rates[to];
}