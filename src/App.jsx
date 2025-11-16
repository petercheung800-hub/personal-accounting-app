import { useState, useEffect } from 'react';
import ExpenseForm from './components/ExpenseForm';
import Report from './components/Report';
import CurrencySelector from './components/CurrencySelector';
import ConfirmDialog from './components/ConfirmDialog';
import { getDefaultCurrency, fetchRates, getSymbol } from './utils/currency';
import './App.css';


const addExpense = async (expense) => {
  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return res.ok;
  } catch (e) {
    console.error('Add expense failed:', e);
    return false;
  }
};

const getExpenses = async () => {
  try {
    const res = await fetch('/api/expenses');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('Get expenses failed:', e);
    return [];
  }
};

const deleteExpense = async (id) => {
  try {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    console.error('Delete expense failed:', e);
    return false;
  }
};

const updateExpense = async (expense) => {
  try {
    if (!expense || typeof expense.id === 'undefined') throw new Error('Missing id');
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return res.ok;
  } catch (e) {
    console.error('Update expense failed:', e);
    return false;
  }
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currency, setCurrency] = useState('CNY');
  const [rates, setRates] = useState({ CNY: 1 });
  const [locale, _setLocale] = useState(typeof navigator !== 'undefined' ? navigator.language : 'zh-CN');
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'info', message: string }
  const [confirmDelete, setConfirmDelete] = useState({ open: false, item: null });

  useEffect(() => {
    const fetchExpenses = async () => {
      const allExpenses = await getExpenses();
      setExpenses(allExpenses);
    };
    const initCurrency = () => {
      const saved = localStorage.getItem('preferredCurrency');
      const defaultCur = saved || getDefaultCurrency();
      setCurrency(defaultCur);
    };
    const initRates = async () => {
      const r = await fetchRates('CNY');
      setRates(r);
    };
    fetchExpenses();
    initCurrency();
    initRates();
  }, []);

  const notifyStatus = (message, type = 'info', timeout = 3000) => {
    setStatus({ message, type });
    if (timeout) {
      setTimeout(() => setStatus(null), timeout);
    }
  };

  const handleAddExpense = async (expenseData) => {
    const ok = await addExpense(expenseData);
    const allExpenses = await getExpenses();
    setExpenses(allExpenses);
    if (!ok) {
      console.warn('添加记录失败');
      notifyStatus('添加记录失败，请稍后重试', 'error');
    } else {
      notifyStatus('记录已添加', 'success');
    }
  };

  const handleUpdateExpense = async (expenseData) => {
    const ok = await updateExpense(expenseData);
    const allExpenses = await getExpenses();
    setExpenses(allExpenses);
    setEditingExpense(null);
    if (!ok) {
      console.warn('更新记录失败');
      notifyStatus('更新记录失败，请稍后重试', 'error');
    } else {
      notifyStatus('记录已更新', 'success');
    }
  };

  const getCategoryEmoji = (category) => {
    const map = {
      food: '🍽️',
      transportation: '🚗',
      shopping: '🛍️',
      entertainment: '🎬',
      other: '📦',
      '餐饮': '🍽️',
      '交通': '🚗',
      '购物': '🛍️',
      '娱乐': '🎬',
      '医疗': '🏥',
      '其他': '📦',
    };
    return map[category] || '💸';
  };

  // 使用内联方式设置编辑项，移除未使用的包装函数以满足 ESLint

  const handleDeleteExpense = async (id) => {
    const ok = await deleteExpense(id);
    const allExpenses = await getExpenses();
    setExpenses(allExpenses);
    const stillExists = allExpenses.some(e => e.id === id);
    if (stillExists || !ok) {
      console.warn('删除记录失败或仍然存在');
      notifyStatus('删除失败，请稍后重试', 'error');
    } else {
      notifyStatus('记录已删除', 'success');
    }
  };

  const requestDeleteExpense = (item) => {
    setConfirmDelete({ open: true, item });
  };

  const confirmDeleteExpense = async () => {
    const id = confirmDelete.item?.id;
    setConfirmDelete({ open: false, item: null });
    await handleDeleteExpense(id);
  };

  const cancelDeleteExpense = () => {
    setConfirmDelete({ open: false, item: null });
  };

  const handleCurrencyChange = (code) => {
    setCurrency(code);
    localStorage.setItem('preferredCurrency', code);
  };

  // 展示金额：在数字前加记录的货币符号（若有）；
  // 若用户原始输入已包含符号或代码，则不重复添加。
  const displayAmount = (expense) => {
    const symbol = getSymbol(expense?.currency || currency);
    const raw = (expense?.amountText ?? '').trim();
    if (raw) {
      const hasPrefixSymbol = symbol && raw.startsWith(symbol);
      const hasPrefixCode = (expense?.currency && raw.toUpperCase().startsWith(String(expense.currency)));
      const hasGenericSymbol = /^[€$£¥]/.test(raw);
      return (hasPrefixSymbol || hasPrefixCode || hasGenericSymbol)
        ? raw
        : (symbol ? `${symbol} ${raw}` : raw);
    }
    const numStr = String(expense?.amount ?? '');
    return symbol ? `${symbol} ${numStr}` : numStr;
  };

  return (
    <div className="App">
      <header className="app-header animate-fade-in-up">
        <h1>💰 智能记账助手</h1>
        <p className="app-subtitle">轻松管理 · 智能分析 · 一目了然</p>
        <div className="header-tools">
          <CurrencySelector value={currency} onChange={handleCurrencyChange} />
        </div>
        {status && (
          <div className={`status-bar ${status.type}`} role="status" aria-live="polite">
            {status.message}
          </div>
        )}
      </header>
      
      <main className="main-grid">
        <div className="form-section animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <ExpenseForm
            onAddExpense={handleAddExpense}
            editingExpense={editingExpense}
            onUpdateExpense={handleUpdateExpense}
            onCancelEdit={() => setEditingExpense(null)}
            currency={currency}
          />
        </div>
        
        <div className="report-section animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <Report expenses={expenses} currency={currency} rates={rates} locale={locale} />
        </div>
      </main>
      
      <div className="expense-section">
        <h2 className="section-title animate-float">📋 消费记录</h2>
        {expenses.length === 0 ? (
          <div className="empty-state animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <svg className="animate-pulse" width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7l-10-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 12l4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="8" cy="8" r="1" fill="currentColor"/>
            </svg>
            <p className="empty-title">暂无消费记录</p>
            <p className="empty-subtitle">添加您的第一笔消费记录开始智能记账吧！</p>
          </div>
        ) : (
          <div className="expense-grid">
            {expenses.map((expense, index) => (
              <div key={expense.id} className="expense-card animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="expense-header">
                  {/* 显示原始输入金额，不进行任何转换或格式化 */}
                  <span className="expense-amount">{displayAmount(expense)}</span>
                  <span className="expense-category">{getCategoryEmoji(expense.category)} {expense.category}</span>
                </div>
                <div className="expense-body">
                  <p className="expense-date">📅 {expense.date}</p>
                  {expense.notes && <p className="expense-notes">📝 {expense.notes}</p>}
                </div>
                <div className="expense-actions">
                  <button className="edit-btn" onClick={() => setEditingExpense(expense)}>
                    ✏️ 编辑
                  </button>
                  <button className="delete-btn" onClick={() => requestDeleteExpense(expense)}>
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete.open}
        title="删除支出"
        message={
          confirmDelete.item
            ? `确定删除这笔支出？金额 ${displayAmount(confirmDelete.item)} · 类别 ${confirmDelete.item.category} · 日期 ${confirmDelete.item.date}。此操作不可恢复。`
            : '确定要删除吗？此操作不可恢复。'
        }
        confirmText="删除"
        cancelText="取消"
        danger={true}
        closeOnOverlay={true}
        onConfirm={confirmDeleteExpense}
        onCancel={cancelDeleteExpense}
      />
    </div>
  );
}

export default App;