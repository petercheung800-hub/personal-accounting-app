import React, { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, PieController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, LineController, BarController } from 'chart.js';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  PieController, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title,
  LineController,
  BarController
);

const Report = ({ expenses }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [activeChart, setActiveChart] = useState('pie'); // 'pie', 'line', or 'bar'

  // 计算统计数据
  const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const averageDailyExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
  const maxExpense = expenses.length > 0 ? Math.max(...expenses.map(e => Number(e.amount))) : 0;
  const minExpense = expenses.length > 0 ? Math.min(...expenses.map(e => Number(e.amount))) : 0;

  // 按日期分组计算每日支出总额
  const getDailyExpenses = () => {
    const dailyData = expenses.reduce((acc, expense) => {
      const date = expense.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(expense.amount);
      return acc;
    }, {});

    // 转换为排序后的数组
    const sortedDates = Object.keys(dailyData).sort();
    const amounts = sortedDates.map(date => dailyData[date]);
    
    return { dates: sortedDates, amounts };
  };

  // 按分类分组计算支出
  const getCategoryData = () => {
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

    const labels = Object.keys(categoryData).map(cat => categoryMap[cat] || cat);
    const data = Object.values(categoryData);
    
    return { labels, data };
  };

  useEffect(() => {
    // 销毁现有的图表实例
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    if (!chartRef.current) return;

    const { labels, data } = getCategoryData();
    const { dates, amounts } = getDailyExpenses();

    // 根据当前选中的图表类型创建相应的图表
    switch (activeChart) {
      case 'pie':
        chartInstance.current = new ChartJS(chartRef.current, {
          type: 'pie',
          data: {
            labels,
            datasets: [
              {
                label: '支出金额',
                data,
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
          },
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
        break;

      case 'line':
        chartInstance.current = new ChartJS(chartRef.current, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: '每日支出',
                data: amounts,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: '每日支出趋势',
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              }
            }
          },
        });
        break;

      case 'bar':
        chartInstance.current = new ChartJS(chartRef.current, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: '分类支出',
                data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: '分类支出柱状图',
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              }
            }
          },
        });
        break;

      default:
        break;
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [expenses, activeChart]); // 依赖 expenses 和 activeChart

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
          <h3>📈 支出图表分析</h3>
          <p className="chart-subtitle">多种图表展示消费数据</p>
        </div>
        
        <div className="chart-selector">
          <button 
            className={`chart-btn ${activeChart === 'pie' ? 'active' : ''}`}
            onClick={() => setActiveChart('pie')}
          >
            饼图
          </button>
          <button 
            className={`chart-btn ${activeChart === 'line' ? 'active' : ''}`}
            onClick={() => setActiveChart('line')}
          >
            折线图
          </button>
          <button 
            className={`chart-btn ${activeChart === 'bar' ? 'active' : ''}`}
            onClick={() => setActiveChart('bar')}
          >
            柱状图
          </button>
        </div>
        
        <div className="chart-wrapper">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default Report;