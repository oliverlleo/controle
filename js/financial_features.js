// Funcionalidades financeiras avançadas para o sistema de gestão financeira

// Sistema de Metas Financeiras
class FinancialGoalsManager {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.database();
    this.goalsRef = this.db.ref(`users/${userId}/goals`);
  }

  // Criar nova meta financeira
  createGoal(goalData) {
    return new Promise((resolve, reject) => {
      const newGoal = {
        name: goalData.name,
        targetAmount: parseFloat(goalData.targetAmount),
        currentAmount: parseFloat(goalData.initialAmount || 0),
        targetDate: goalData.targetDate,
        category: goalData.category || 'outro',
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      };
      
      this.goalsRef.push().set(newGoal)
        .then(() => resolve(newGoal))
        .catch(error => reject(error));
    });
  }

  // Obter todas as metas
  getAllGoals() {
    return new Promise((resolve, reject) => {
      this.goalsRef.once('value')
        .then(snapshot => {
          const goals = [];
          snapshot.forEach(childSnapshot => {
            goals.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          resolve(goals);
        })
        .catch(error => reject(error));
    });
  }

  // Atualizar progresso da meta
  updateGoalProgress(goalId, amount) {
    return new Promise((resolve, reject) => {
      this.goalsRef.child(goalId).once('value')
        .then(snapshot => {
          if (!snapshot.exists()) {
            reject(new Error('Meta não encontrada'));
            return;
          }
          
          const goal = snapshot.val();
          const newAmount = parseFloat(goal.currentAmount) + parseFloat(amount);
          
          this.goalsRef.child(goalId).update({
            currentAmount: newAmount,
            lastUpdate: new Date().toISOString()
          })
            .then(() => resolve({ id: goalId, newAmount }))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  // Excluir meta
  deleteGoal(goalId) {
    return this.goalsRef.child(goalId).remove();
  }

  // Calcular progresso da meta
  calculateGoalProgress(goal) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(Math.round(progress), 100);
  }

  // Verificar se a meta está próxima do prazo
  isGoalNearDeadline(goal) {
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    return daysLeft <= 7 && daysLeft >= 0 && this.calculateGoalProgress(goal) < 100;
  }

  // Calcular dias restantes
  calculateDaysLeft(targetDate) {
    const target = new Date(targetDate);
    const today = new Date();
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }
}

// Sistema de Orçamento Mensal por Categoria
class BudgetManager {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.database();
    this.budgetsRef = this.db.ref(`users/${userId}/budgets`);
    this.categoriesRef = this.db.ref(`users/${userId}/categorias`);
    this.expensesRef = this.db.ref(`users/${userId}/despesas`);
  }

  // Criar ou atualizar orçamento para categoria
  setBudget(categoryId, amount, month, year) {
    return new Promise((resolve, reject) => {
      if (!categoryId || !amount) {
        reject(new Error('Categoria e valor são obrigatórios'));
        return;
      }
      
      const currentDate = new Date();
      const budgetMonth = month || currentDate.getMonth() + 1;
      const budgetYear = year || currentDate.getFullYear();
      const budgetKey = `${budgetYear}-${budgetMonth.toString().padStart(2, '0')}`;
      
      this.budgetsRef.child(budgetKey).child(categoryId).set({
        amount: parseFloat(amount),
        createdAt: new Date().toISOString()
      })
        .then(() => resolve({ categoryId, amount, month: budgetMonth, year: budgetYear }))
        .catch(error => reject(error));
    });
  }

  // Obter orçamentos para um mês específico
  getBudgets(month, year) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const budgetMonth = month || currentDate.getMonth() + 1;
      const budgetYear = year || currentDate.getFullYear();
      const budgetKey = `${budgetYear}-${budgetMonth.toString().padStart(2, '0')}`;
      
      Promise.all([
        this.budgetsRef.child(budgetKey).once('value'),
        this.categoriesRef.once('value')
      ])
        .then(([budgetsSnapshot, categoriesSnapshot]) => {
          const budgets = {};
          const categories = {};
          
          categoriesSnapshot.forEach(childSnapshot => {
            categories[childSnapshot.key] = childSnapshot.val();
          });
          
          budgetsSnapshot.forEach(childSnapshot => {
            const categoryId = childSnapshot.key;
            if (categories[categoryId]) {
              budgets[categoryId] = {
                ...childSnapshot.val(),
                category: categories[categoryId]
              };
            }
          });
          
          resolve({ budgets, categories, month: budgetMonth, year: budgetYear });
        })
        .catch(error => reject(error));
    });
  }

  // Calcular gastos atuais por categoria para um mês específico
  getExpensesByCategory(month, year) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const expenseMonth = month || currentDate.getMonth() + 1;
      const expenseYear = year || currentDate.getFullYear();
      
      // Obter primeiro e último dia do mês
      const startDate = new Date(expenseYear, expenseMonth - 1, 1).toISOString();
      const endDate = new Date(expenseYear, expenseMonth, 0).toISOString();
      
      this.expensesRef.orderByChild('dataCompra').startAt(startDate).endAt(endDate).once('value')
        .then(snapshot => {
          const expenses = {};
          
          snapshot.forEach(childSnapshot => {
            const expense = childSnapshot.val();
            const categoryId = expense.categoria;
            
            if (!expenses[categoryId]) {
              expenses[categoryId] = 0;
            }
            
            expenses[categoryId] += parseFloat(expense.valor);
          });
          
          resolve({ expenses, month: expenseMonth, year: expenseYear });
        })
        .catch(error => reject(error));
    });
  }

  // Calcular progresso do orçamento
  calculateBudgetProgress(budgetAmount, expenseAmount) {
    if (budgetAmount <= 0) return 0;
    const progress = (expenseAmount / budgetAmount) * 100;
    return Math.min(Math.round(progress), 100);
  }

  // Verificar se o orçamento foi excedido
  isBudgetExceeded(budgetAmount, expenseAmount) {
    return expenseAmount > budgetAmount;
  }

  // Verificar se o orçamento está próximo do limite
  isBudgetNearLimit(budgetAmount, expenseAmount) {
    return expenseAmount >= budgetAmount * 0.8 && expenseAmount <= budgetAmount;
  }
}

// Análise de Tendências e Previsões
class TrendsAnalyzer {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.database();
    this.expensesRef = this.db.ref(`users/${userId}/despesas`);
    this.incomesRef = this.db.ref(`users/${userId}/rendas`);
  }

  // Obter dados de gastos dos últimos 6 meses
  getExpenseTrends() {
    return new Promise((resolve, reject) => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const monthsData = [];
      const promises = [];
      
      // Obter dados dos últimos 6 meses
      for (let i = 0; i < 6; i++) {
        const targetMonth = currentMonth - i;
        const targetYear = currentYear + Math.floor(targetMonth / 12);
        const normalizedMonth = ((targetMonth % 12) + 12) % 12; // Garantir que o mês seja positivo
        
        const startDate = new Date(targetYear, normalizedMonth, 1).toISOString();
        const endDate = new Date(targetYear, normalizedMonth + 1, 0).toISOString();
        
        const promise = this.expensesRef.orderByChild('dataCompra').startAt(startDate).endAt(endDate).once('value')
          .then(snapshot => {
            let totalExpense = 0;
            const categoryExpenses = {};
            
            snapshot.forEach(childSnapshot => {
              const expense = childSnapshot.val();
              const value = parseFloat(expense.valor);
              const categoryId = expense.categoria;
              
              totalExpense += value;
              
              if (!categoryExpenses[categoryId]) {
                categoryExpenses[categoryId] = 0;
              }
              
              categoryExpenses[categoryId] += value;
            });
            
            const monthName = new Date(targetYear, normalizedMonth, 1).toLocaleDateString('pt-BR', { month: 'long' });
            
            monthsData.unshift({
              month: monthName,
              year: targetYear,
              totalExpense,
              categoryExpenses
            });
          });
        
        promises.push(promise);
      }
      
      Promise.all(promises)
        .then(() => resolve(monthsData))
        .catch(error => reject(error));
    });
  }

  // Prever gastos para os próximos 3 meses usando regressão linear
  predictExpenses() {
    return this.getExpenseTrends()
      .then(trendsData => {
        // Implementar regressão linear simples
        const n = trendsData.length;
        const x = Array.from({ length: n }, (_, i) => i); // [0, 1, 2, 3, 4, 5]
        const y = trendsData.map(data => data.totalExpense);
        
        // Calcular médias
        const meanX = x.reduce((sum, val) => sum + val, 0) / n;
        const meanY = y.reduce((sum, val) => sum + val, 0) / n;
        
        // Calcular coeficientes
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
          numerator += (x[i] - meanX) * (y[i] - meanY);
          denominator += Math.pow(x[i] - meanX, 2);
        }
        
        const slope = numerator / denominator;
        const intercept = meanY - slope * meanX;
        
        // Prever próximos 3 meses
        const predictions = [];
        const today = new Date();
        
        for (let i = 1; i <= 3; i++) {
          const targetMonth = today.getMonth() + i;
          const targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
          const normalizedMonth = targetMonth % 12;
          
          const predictedValue = intercept + slope * (n + i - 1);
          const monthName = new Date(targetYear, normalizedMonth, 1).toLocaleDateString('pt-BR', { month: 'long' });
          
          predictions.push({
            month: monthName,
            year: targetYear,
            predictedExpense: Math.max(0, predictedValue) // Garantir que não seja negativo
          });
        }
        
        return {
          historicalData: trendsData,
          predictions,
          trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
        };
      });
  }

  // Analisar padrões de gastos e gerar insights
  generateInsights() {
    return this.getExpenseTrends()
      .then(trendsData => {
        const insights = [];
        
        // Verificar tendência geral
        const firstMonth = trendsData[0].totalExpense;
        const lastMonth = trendsData[trendsData.length - 1].totalExpense;
        const percentChange = ((lastMonth - firstMonth) / firstMonth) * 100;
        
        if (percentChange > 10) {
          insights.push({
            type: 'warning',
            message: `Seus gastos aumentaram ${percentChange.toFixed(1)}% nos últimos 6 meses.`
          });
        } else if (percentChange < -10) {
          insights.push({
            type: 'success',
            message: `Seus gastos diminuíram ${Math.abs(percentChange).toFixed(1)}% nos últimos 6 meses. Bom trabalho!`
          });
        }
        
        // Identificar categoria com maior aumento
        const firstMonthCategories = trendsData[0].categoryExpenses;
        const lastMonthCategories = trendsData[trendsData.length - 1].categoryExpenses;
        
        let maxIncrease = 0;
        let maxIncreaseCategory = null;
        
        for (const categoryId in lastMonthCategories) {
          const currentValue = lastMonthCategories[categoryId];
          const previousValue = firstMonthCategories[categoryId] || 0;
          
          if (previousValue > 0) {
            const increase = ((currentValue - previousValue) / previousValue) * 100;
            
            if (increase > maxIncrease && increase > 20) {
              maxIncrease = increase;
              maxIncreaseCategory = categoryId;
            }
          }
        }
        
        if (maxIncreaseCategory) {
          insights.push({
            type: 'warning',
            message: `A categoria ${maxIncreaseCategory} teve um aumento de ${maxIncrease.toFixed(1)}% nos últimos 6 meses.`
          });
        }
        
        // Identificar mês com maior gasto
        let maxExpenseMonth = null;
        let maxExpenseValue = 0;
        
        trendsData.forEach(monthData => {
          if (monthData.totalExpense > maxExpenseValue) {
            maxExpenseValue = monthData.totalExpense;
            maxExpenseMonth = monthData.month;
          }
        });
        
        if (maxExpenseMonth) {
          insights.push({
            type: 'info',
            message: `${maxExpenseMonth} foi o mês com maior gasto (R$ ${maxExpenseValue.toFixed(2)}).`
          });
        }
        
        return insights;
      });
  }
}

// Fluxo de Caixa
class CashFlowManager {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.database();
    this.expensesRef = this.db.ref(`users/${userId}/despesas`);
    this.incomesRef = this.db.ref(`users/${userId}/rendas`);
  }

  // Obter fluxo de caixa para um período específico
  getCashFlow(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
      
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      
      Promise.all([
        this.expensesRef.orderByChild('dataCompra').startAt(startIso).endAt(endIso).once('value'),
        this.incomesRef.once('value')
      ])
        .then(([expensesSnapshot, incomesSnapshot]) => {
          const expenses = [];
          const incomes = [];
          
          expensesSnapshot.forEach(childSnapshot => {
            expenses.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
              type: 'expense'
            });
          });
          
          incomesSnapshot.forEach(childSnapshot => {
            const income = childSnapshot.val();
            
            // Verificar se a renda está dentro do período
            if (this.isIncomeInPeriod(income, start, end)) {
              incomes.push({
                id: childSnapshot.key,
                ...income,
                type: 'income'
              });
            }
          });
          
          // Combinar despesas e receitas
          const transactions = [...expenses, ...incomes].sort((a, b) => {
            const dateA = a.type === 'expense' ? new Date(a.dataCompra) : new Date(a.data);
            const dateB = b.type === 'expense' ? new Date(b.dataCompra) : new Date(b.data);
            return dateA - dateB;
          });
          
          // Calcular saldo acumulado
          let balance = 0;
          const cashFlow = transactions.map(transaction => {
            if (transaction.type === 'expense') {
              balance -= parseFloat(transaction.valor);
            } else {
              balance += parseFloat(transaction.valor);
            }
            
            return {
              ...transaction,
              balance
            };
          });
          
          // Calcular totais
          const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.valor), 0);
          const totalIncomes = incomes.reduce((sum, income) => sum + parseFloat(income.valor), 0);
          const netCashFlow = totalIncomes - totalExpenses;
          
          resolve({
            cashFlow,
            summary: {
              totalExpenses,
              totalIncomes,
              netCashFlow,
              startDate: start,
              endDate: end
            }
          });
        })
        .catch(error => reject(error));
    });
  }

  // Verificar se uma renda está dentro do período
  isIncomeInPeriod(income, startDate, endDate) {
    if (!income.data) return false;
    
    const incomeDate = new Date(income.data);
    return incomeDate >= startDate && incomeDate <= endDate;
  }

  // Gerar dados para gráfico de fluxo de caixa diário
  getDailyCashFlowChart(startDate, endDate) {
    return this.getCashFlow(startDate, endDate)
      .then(({ cashFlow }) => {
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        
        // Criar array com todos os dias do período
        const days = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          days.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Inicializar dados do gráfico
        const chartData = {
          labels: days.map(day => day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
          datasets: [
            {
              label: 'Saldo Acumulado',
              data: Array(days.length).fill(0),
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true
            }
          ]
        };
        
        // Preencher dados do gráfico
        cashFlow.forEach(transaction => {
          const transactionDate = transaction.type === 'expense' ? new Date(transaction.dataCompra) : new Date(transaction.data);
          
          // Encontrar índice do dia correspondente
          for (let i = 0; i < days.length; i++) {
            if (days[i].toDateString() === transactionDate.toDateString()) {
              // Atualizar saldo para este dia e todos os dias subsequentes
              for (let j = i; j < days.length; j++) {
                if (transaction.type === 'expense') {
                  chartData.datasets[0].data[j] -= parseFloat(transaction.valor);
                } else {
                  chartData.datasets[0].data[j] += parseFloat(transaction.valor);
                }
              }
              break;
            }
          }
        });
        
        return chartData;
      });
  }
}

// Comparativo de Gastos
class ExpenseComparator {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.database();
    this.expensesRef = this.db.ref(`users/${userId}/despesas`);
    this.categoriesRef = this.db.ref(`users/${userId}/categorias`);
  }

  // Comparar gastos entre dois períodos
  compareExpenses(period1Start, period1End, period2Start, period2End) {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getExpensesForPeriod(period1Start, period1End),
        this.getExpensesForPeriod(period2Start, period2End),
        this.categoriesRef.once('value')
      ])
        .then(([period1Expenses, period2Expenses, categoriesSnapshot]) => {
          const categories = {};
          
          categoriesSnapshot.forEach(childSnapshot => {
            categories[childSnapshot.key] = childSnapshot.val();
          });
          
          // Calcular totais por categoria para cada período
          const period1ByCategory = this.calculateExpensesByCategory(period1Expenses);
          const period2ByCategory = this.calculateExpensesByCategory(period2Expenses);
          
          // Calcular variações
          const comparison = {};
          const allCategoryIds = new Set([...Object.keys(period1ByCategory), ...Object.keys(period2ByCategory)]);
          
          allCategoryIds.forEach(categoryId => {
            const period1Amount = period1ByCategory[categoryId] || 0;
            const period2Amount = period2ByCategory[categoryId] || 0;
            const absoluteDifference = period2Amount - period1Amount;
            const percentageDifference = period1Amount > 0 ? (absoluteDifference / period1Amount) * 100 : 0;
            
            comparison[categoryId] = {
              categoryId,
              categoryName: categories[categoryId] ? categories[categoryId].nome : 'Categoria Desconhecida',
              period1Amount,
              period2Amount,
              absoluteDifference,
              percentageDifference
            };
          });
          
          // Calcular totais gerais
          const period1Total = Object.values(period1ByCategory).reduce((sum, amount) => sum + amount, 0);
          const period2Total = Object.values(period2ByCategory).reduce((sum, amount) => sum + amount, 0);
          const totalAbsoluteDifference = period2Total - period1Total;
          const totalPercentageDifference = period1Total > 0 ? (totalAbsoluteDifference / period1Total) * 100 : 0;
          
          resolve({
            period1: {
              start: period1Start,
              end: period1End,
              total: period1Total
            },
            period2: {
              start: period2Start,
              end: period2End,
              total: period2Total
            },
            comparison: Object.values(comparison),
            summary: {
              absoluteDifference: totalAbsoluteDifference,
              percentageDifference: totalPercentageDifference,
              trend: totalPercentageDifference > 0 ? 'increase' : totalPercentageDifference < 0 ? 'decrease' : 'stable'
            }
          });
        })
        .catch(error => reject(error));
    });
  }

  // Obter despesas para um período específico
  getExpensesForPeriod(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 0);
      
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      
      this.expensesRef.orderByChild('dataCompra').startAt(startIso).endAt(endIso).once('value')
        .then(snapshot => {
          const expenses = [];
          
          snapshot.forEach(childSnapshot => {
            expenses.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          
          resolve(expenses);
        })
        .catch(error => reject(error));
    });
  }

  // Calcular despesas por categoria
  calculateExpensesByCategory(expenses) {
    const expensesByCategory = {};
    
    expenses.forEach(expense => {
      const categoryId = expense.categoria;
      const value = parseFloat(expense.valor);
      
      if (!expensesByCategory[categoryId]) {
        expensesByCategory[categoryId] = 0;
      }
      
      expensesByCategory[categoryId] += value;
    });
    
    return expensesByCategory;
  }

  // Gerar dados para gráfico comparativo
  getComparisonChartData(period1Start, period1End, period2Start, period2End) {
    return this.compareExpenses(period1Start, period1End, period2Start, period2End)
      .then(comparisonData => {
        const period1Label = this.formatPeriodLabel(period1Start, period1End);
        const period2Label = this.formatPeriodLabel(period2Start, period2End);
        
        // Ordenar categorias por maior diferença absoluta
        const sortedComparison = [...comparisonData.comparison].sort((a, b) => Math.abs(b.absoluteDifference) - Math.abs(a.absoluteDifference));
        
        // Limitar a 10 categorias para melhor visualização
        const topCategories = sortedComparison.slice(0, 10);
        
        return {
          labels: topCategories.map(item => item.categoryName),
          datasets: [
            {
              label: period1Label,
              data: topCategories.map(item => item.period1Amount),
              backgroundColor: 'rgba(54, 162, 235, 0.7)'
            },
            {
              label: period2Label,
              data: topCategories.map(item => item.period2Amount),
              backgroundColor: 'rgba(255, 99, 132, 0.7)'
            }
          ]
        };
      });
  }

  // Formatar label do período
  formatPeriodLabel(startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    
    return `${start.toLocaleDateString('pt-BR', { month: 'short' })} - ${end.toLocaleDateString('pt-BR', { month: 'short' })}`;
  }
}

// Sistema de Notificações Personalizáveis
class NotificationManager {
  constructor(userId) {
    this.userId = userId;
    this.db = firebase.database();
    this.notificationsRef = this.db.ref(`users/${userId}/notifications`);
    this.expensesRef = this.db.ref(`users/${userId}/despesas`);
    this.budgetsRef = this.db.ref(`users/${userId}/budgets`);
    this.goalsRef = this.db.ref(`users/${userId}/goals`);
  }

  // Obter todas as notificações
  getNotifications() {
    return new Promise((resolve, reject) => {
      this.notificationsRef.orderByChild('createdAt').once('value')
        .then(snapshot => {
          const notifications = [];
          
          snapshot.forEach(childSnapshot => {
            notifications.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          
          // Ordenar por data (mais recentes primeiro)
          notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          resolve(notifications);
        })
        .catch(error => reject(error));
    });
  }

  // Criar nova notificação
  createNotification(type, title, message, data = {}) {
    return new Promise((resolve, reject) => {
      const notification = {
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      this.notificationsRef.push().set(notification)
        .then(() => resolve(notification))
        .catch(error => reject(error));
    });
  }

  // Marcar notificação como lida
  markAsRead(notificationId) {
    return this.notificationsRef.child(notificationId).update({
      read: true
    });
  }

  // Excluir notificação
  deleteNotification(notificationId) {
    return this.notificationsRef.child(notificationId).remove();
  }

  // Verificar despesas próximas do vencimento
  checkUpcomingDues() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const startDate = today.toISOString();
    const endDate = nextWeek.toISOString();
    
    return new Promise((resolve, reject) => {
      this.expensesRef.orderByChild('dataVencimento').startAt(startDate).endAt(endDate).once('value')
        .then(snapshot => {
          const upcomingDues = [];
          
          snapshot.forEach(childSnapshot => {
            const expense = childSnapshot.val();
            
            // Verificar se já foi paga
            if (expense.status !== 'pago') {
              upcomingDues.push({
                id: childSnapshot.key,
                ...expense
              });
            }
          });
          
          // Criar notificações para despesas próximas do vencimento
          const promises = upcomingDues.map(expense => {
            const dueDate = new Date(expense.dataVencimento);
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            let message = '';
            if (daysLeft === 0) {
              message = `A despesa "${expense.descricao}" vence hoje!`;
            } else if (daysLeft === 1) {
              message = `A despesa "${expense.descricao}" vence amanhã!`;
            } else {
              message = `A despesa "${expense.descricao}" vence em ${daysLeft} dias.`;
            }
            
            return this.createNotification('due', 'Vencimento Próximo', message, {
              expenseId: expense.id,
              dueDate: expense.dataVencimento,
              amount: expense.valor
            });
          });
          
          Promise.all(promises)
            .then(() => resolve(upcomingDues))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  // Verificar orçamentos excedidos
  checkBudgetAlerts() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const budgetKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    return new Promise((resolve, reject) => {
      const budgetManager = new BudgetManager(this.userId);
      
      Promise.all([
        this.budgetsRef.child(budgetKey).once('value'),
        budgetManager.getExpensesByCategory(currentMonth, currentYear)
      ])
        .then(([budgetsSnapshot, expensesData]) => {
          const budgets = {};
          const alerts = [];
          
          budgetsSnapshot.forEach(childSnapshot => {
            const categoryId = childSnapshot.key;
            budgets[categoryId] = childSnapshot.val();
          });
          
          // Verificar orçamentos excedidos ou próximos do limite
          for (const categoryId in budgets) {
            const budget = budgets[categoryId];
            const expense = expensesData.expenses[categoryId] || 0;
            
            if (expense > budget.amount) {
              // Orçamento excedido
              alerts.push({
                categoryId,
                budget: budget.amount,
                expense,
                status: 'exceeded',
                percentage: Math.round((expense / budget.amount) * 100)
              });
            } else if (expense >= budget.amount * 0.8) {
              // Próximo do limite
              alerts.push({
                categoryId,
                budget: budget.amount,
                expense,
                status: 'warning',
                percentage: Math.round((expense / budget.amount) * 100)
              });
            }
          }
          
          // Criar notificações para alertas
          const promises = alerts.map(alert => {
            let title = '';
            let message = '';
            
            if (alert.status === 'exceeded') {
              title = 'Orçamento Excedido';
              message = `Você excedeu o orçamento da categoria ${alert.categoryId} em ${(alert.expense - alert.budget).toFixed(2)} (${alert.percentage}% do limite).`;
            } else {
              title = 'Orçamento Próximo do Limite';
              message = `Você já utilizou ${alert.percentage}% do orçamento da categoria ${alert.categoryId}.`;
            }
            
            return this.createNotification('budget', title, message, {
              categoryId: alert.categoryId,
              budget: alert.budget,
              expense: alert.expense,
              percentage: alert.percentage
            });
          });
          
          Promise.all(promises)
            .then(() => resolve(alerts))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  // Verificar metas próximas do prazo
  checkGoalAlerts() {
    return new Promise((resolve, reject) => {
      const goalsManager = new FinancialGoalsManager(this.userId);
      
      goalsManager.getAllGoals()
        .then(goals => {
          const alerts = [];
          
          goals.forEach(goal => {
            const progress = goalsManager.calculateGoalProgress(goal);
            const daysLeft = goalsManager.calculateDaysLeft(goal.targetDate);
            
            if (progress >= 100) {
              // Meta atingida
              alerts.push({
                goalId: goal.id,
                name: goal.name,
                status: 'completed',
                progress,
                daysLeft
              });
            } else if (daysLeft <= 7 && daysLeft >= 0) {
              // Próxima do prazo
              alerts.push({
                goalId: goal.id,
                name: goal.name,
                status: 'deadline',
                progress,
                daysLeft
              });
            }
          });
          
          // Criar notificações para alertas
          const promises = alerts.map(alert => {
            let title = '';
            let message = '';
            
            if (alert.status === 'completed') {
              title = 'Meta Atingida';
              message = `Parabéns! Você atingiu sua meta "${alert.name}".`;
            } else {
              title = 'Meta Próxima do Prazo';
              if (alert.daysLeft === 0) {
                message = `Sua meta "${alert.name}" vence hoje! Você completou ${alert.progress}%.`;
              } else if (alert.daysLeft === 1) {
                message = `Sua meta "${alert.name}" vence amanhã! Você completou ${alert.progress}%.`;
              } else {
                message = `Sua meta "${alert.name}" vence em ${alert.daysLeft} dias. Você completou ${alert.progress}%.`;
              }
            }
            
            return this.createNotification('goal', title, message, {
              goalId: alert.goalId,
              progress: alert.progress,
              daysLeft: alert.daysLeft
            });
          });
          
          Promise.all(promises)
            .then(() => resolve(alerts))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  // Verificar todas as notificações
  checkAllNotifications() {
    return Promise.all([
      this.checkUpcomingDues(),
      this.checkBudgetAlerts(),
      this.checkGoalAlerts()
    ])
      .then(([dues, budgets, goals]) => {
        return {
          dues,
          budgets,
          goals,
          total: dues.length + budgets.length + goals.length
        };
      });
  }
}

// Exportar classes para uso global
window.FinancialGoalsManager = FinancialGoalsManager;
window.BudgetManager = BudgetManager;
window.TrendsAnalyzer = TrendsAnalyzer;
window.CashFlowManager = CashFlowManager;
window.ExpenseComparator = ExpenseComparator;
window.NotificationManager = NotificationManager;
