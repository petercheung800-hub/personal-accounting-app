import React from 'react';
import { SUPPORTED_CURRENCIES, getSymbol } from '../utils/currency';

const CurrencySelector = ({ value, onChange }) => {
  return (
    <div className="currency-selector" title="选择显示的货币">
      <label className="currency-label">🔁 货币</label>
      <select
        className="currency-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {getSymbol(c.code)} {c.code} · {c.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;