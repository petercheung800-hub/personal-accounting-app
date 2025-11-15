import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
// 不做汇率换算与货币格式化，按原始数值展示

ChartJS.register(ArcElement, Tooltip, Legend, PieController);

const Report = ({ expenses, currency = 'CNY', rates = { CNY: 1 }, locale = 'zh-CN' }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 计算统计数据
  const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const averageDailyExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
  const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(e => Number(e.amount))) : 0;
  const minExpense = expenses.length > 0 ? Math.min(...expenses.map(e => Number(e.amount))) : 0;

  useEffect(() => {
    const categoryData = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {});

    // 分类映射：英文分类 -> 中文显示
    const categoryMap = {
      food: '餐饮美食',
      transportation: '交通出行', 
      shopping: '购物消费',
      entertainment: '娱乐休闲',
      other: '其他支出',
      '餐饮': '餐饮美食',
      '交通': '交通出行',
      '购物': '购物消费', 
      '娱乐': '娱乐休闲',
      '医疗': '医疗健康',
      '其他': '其他支出'
    };

    const data = {
      labels: Object.keys(categoryData).map(cat => categoryMap[cat] || cat),
      datasets: [
        {
          label: '支出金额',
          data: Object.values(categoryData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    if (chartRef.current) {
      chartInstance.current = new ChartJS(chartRef.current, {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: '支出分类饼图',
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const label = ctx.label || '';
                  const value = ctx.raw;
                  return `${label}: ${value}`;
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [expenses, currency, rates, locale]);

  return (
    <div className="report-container animate-fade-in-up">
      <div className="report-header">
        <h2>📊 消费数据分析</h2>
        <p className="report-subtitle">智能统计 · 一目了然</p>
      </div>
      
      <div className="summary-cards">
        <div className="summary-card animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h4>总支出</h4>
            <p className="card-value">{String(totalExpense)}</p>
          </div>
        </div>
        
        <div className="summary-card animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h4>日均支出</h4>
            <p className="card-value">{String(averageDailyExpense)}</p>
          </div>
        </div>
        
        <div className="summary-card animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h4>最大支出</h4>
            <p className="card-value">{String(maxExpense)}</p>
          </div>
        </div>
        
        <div className="summary-card animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="card-icon">📉</div>
          <div className="card-content">
            <h4>最小支出</h4>
            <p className="card-value">{String(minExpense)}</p>
          </div>
        </div>
      </div>
      
      <div className="chart-container animate-fade-in-up" style={{animationDelay: '0.5s'}}>
        <div className="chart-header">
          <h3>📈 分类支出分布图</h3>
          <p className="chart-subtitle">各分类支出占比分析</p>
        </div>
        <div className="chart-wrapper">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default Report;