import { useState, useEffect } from 'react';
import { getSymbol } from '../utils/currency';

const ExpenseForm = ({ onAddExpense, onUpdateExpense, onCancelEdit, editingExpense, currency = 'CNY' }) => {
  const [amount, setAmount] = useState('');
  // 允许中间态：空、整数、小数、尾随点；支持全角数字与全角点
  const numberInputRegex = /^[\p{N}]*[.\uFF0E]?[\p{N}]*$/u;
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amountText ?? String(editingExpense.amount ?? ''));
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setNotes(editingExpense.notes);
    }
  }, [editingExpense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // 校验：必须是有效数字（支持 1. / .5 / 1.23），且 > 0
    const isValidNumber = /^(?:[\p{N}]+(?:[.\uFF0E][\p{N}]*)?|[.\uFF0E][\p{N}]+)$/u.test(amount);
    if (!isValidNumber) {
      setError('请输入有效的数字金额（可包含小数点）');
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError('金额必须为正数');
      return;
    }
    const payload = {
      amount: parseFloat(amount),
      amountText: amount, // 保存原始输入文本用于展示
      // 保存每条记录的货币类型，编辑时优先保留原有值
      currency: editingExpense?.currency ?? currency,
      category,
      date,
      notes,
    };
    if (editingExpense && onUpdateExpense) {
      onUpdateExpense({ ...editingExpense, ...payload });
      if (onCancelEdit) onCancelEdit();
    } else if (onAddExpense) {
      onAddExpense(payload);
    }
    setAmount('');
    setCategory('food');
    setDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setError('');
  };

  return (
    <div className="expense-form animate-fade-in-up">
      <div className="form-header">
        <h3>{editingExpense ? '📝 编辑消费记录' : '➕ 添加消费记录'}</h3>
        {editingExpense && (
          <button
            className="cancel-btn"
            onClick={() => {
              setAmount('');
              setCategory('food');
              setDate(new Date().toISOString().slice(0, 10));
              setNotes('');
              setError('');
              if (onCancelEdit) onCancelEdit();
            }}
          >
            ❌ 取消
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="modern-form">
        <div className="form-group">
          <label className="form-label">
            <span>💰</span>
            <span>消费金额</span>
            <span className="currency-hint">（显示货币：{getSymbol(currency)} {currency}）</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            className={`form-input${error ? ' error' : ''}`}
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || numberInputRegex.test(val)) {
                setAmount(val);
                setError('');
              } else {
                // 保持输入框显示为原始值（不改写），仅提示错误
                setError('请输入有效的数字格式（可包含小数点）');
              }
            }}
            aria-invalid={!!error}
            placeholder={`请输入消费金额（${getSymbol(currency)} ${currency} 显示）`}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <span>🏷️</span>
            <span>消费分类</span>
          </label>
          <select 
            className="form-select" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            required
          >
            <option value="food">🍽️ 餐饮美食</option>
            <option value="transportation">🚗 交通出行</option>
            <option value="shopping">🛍️ 购物消费</option>
            <option value="entertainment">🎬 娱乐休闲</option>
            <option value="other">📦 其他支出</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <span>📅</span>
            <span>消费日期</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <span>📝</span>
            <span>备注信息</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="添加备注信息（可选）"
          />
        </div>
        
        <button type="submit" className="submit-btn">
          <span>{editingExpense ? '💾' : '➕'}</span>
          <span>{editingExpense ? '更新记录' : '添加记录'}</span>
        </button>
      </form>
      {error && <div className="error-message">⚠️ {error}</div>}
    </div>
  );
};

export default ExpenseForm;