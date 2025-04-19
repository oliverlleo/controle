/**
 * Novas Funcionalidades Financeiras para o Sistema de Gestão
 * 
 * Este arquivo contém as novas funcionalidades financeiras implementadas:
 * 1. Sistema de Metas Financeiras
 * 2. Orçamento Mensal por Categoria
 * 3. Análise de Tendências e Previsões
 * 4. Fluxo de Caixa
 * 5. Comparativo de Gastos
 * 6. Sistema de Notificações Personalizáveis
 */

// Referência ao banco de dados Firebase
const db = firebase.database();

/**
 * ===============================================
 * 1. SISTEMA DE METAS FINANCEIRAS
 * ===============================================
 */

// Carregar metas financeiras do usuário
function loadFinancialGoals() {
  const userId = firebase.auth().currentUser.uid;
  const goalsContainer = document.getElementById('goalsContainer');
  goalsContainer.innerHTML = '';
  
  db.ref(`users/${userId}/goals`).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      goalsContainer.innerHTML = '<p class="text-center">Você ainda não tem metas cadastradas. Crie sua primeira meta!</p>';
      return;
    }
    
    snapshot.forEach(childSnapshot => {
      const goal = childSnapshot.val();
      const goalId = childSnapshot.key;
      const progress = calculateGoalProgress(goal);
      
      const goalCard = document.createElement('div');
      goalCard.className = 'card hover-lift mb-4';
      goalCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">${goal.name}</div>
          <div class="dropdown">
            <button class="btn btn-icon"><i class="fas fa-ellipsis-v"></i></button>
            <div class="dropdown-content">
              <a href="#" onclick="editGoal('${goalId}')"><i class="fas fa-edit"></i> Editar</a>
              <a href="#" onclick="deleteGoal('${goalId}')"><i class="fas fa-trash"></i> Excluir</a>
              <a href="#" onclick="addGoalContribution('${goalId}')"><i class="fas fa-plus"></i> Adicionar</a>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <div>Meta: R$ ${parseFloat(goal.targetAmount).toFixed(2)}</div>
            <div>Atual: R$ ${parseFloat(goal.currentAmount).toFixed(2)}</div>
          </div>
          <div class="progress mb-3">
            <div class="progress-bar progress-bar-primary" style="width: ${progress}%"></div>
          </div>
          <div class="d-flex justify-content-between">
            <div>${progress}% concluído</div>
            <div>Prazo: ${new Date(goal.targetDate).toLocaleDateString()}</div>
          </div>
          ${getRemainingTimeText(goal.targetDate)}
        </div>
      `;
      
      goalsContainer.appendChild(goalCard);
    });
  }).catch(error => {
    console.error("Erro ao carregar metas:", error);
    showToast("Erro ao carregar metas. Tente novamente.", "danger");
  });
}

// Calcular progresso da meta
function calculateGoalProgress(goal) {
  const current = parseFloat(goal.currentAmount) || 0;
  const target = parseFloat(goal.targetAmount) || 1; // Evitar divisão por zero
  const progress = Math.min(Math.round((current / target) * 100), 100);
  return progress;
}

// Obter texto de tempo restante
function getRemainingTimeText(targetDate) {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let statusClass = 'text-success';
  let statusIcon = 'fa-check-circle';
  
  if (diffDays < 0) {
    statusClass = 'text-danger';
    statusIcon = 'fa-exclamation-circle';
    return `<div class="${statusClass} mt-2"><i class="fas ${statusIcon}"></i> Meta vencida há ${Math.abs(diffDays)} dias</div>`;
  } else if (diffDays <= 7) {
    statusClass = 'text-warning';
    statusIcon = 'fa-exclamation-triangle';
  }
  
  return `<div class="${statusClass} mt-2"><i class="fas ${statusIcon}"></i> ${diffDays} dias restantes</div>`;
}

// Salvar nova meta financeira
function saveFinancialGoal() {
  const userId = firebase.auth().currentUser.uid;
  const goalName = document.getElementById('goalName').value;
  const goalAmount = parseFloat(document.getElementById('goalAmount').value);
  const goalDate = document.getElementById('goalDate').value;
  const goalCategory = document.getElementById('goalCategory').value;
  const goalInitialAmount = parseFloat(document.getElementById('goalInitialAmount').value) || 0;
  
  if (!goalName || !goalAmount || !goalDate) {
    showToast("Preencha todos os campos obrigatórios.", "warning");
    return;
  }
  
  const goalData = {
    name: goalName,
    targetAmount: goalAmount,
    targetDate: goalDate,
    category: goalCategory,
    currentAmount: goalInitialAmount,
    createdAt: new Date().toISOString(),
    history: [{
      date: new Date().toISOString(),
      amount: goalInitialAmount,
      description: "Valor inicial"
    }]
  };
  
  const goalRef = db.ref(`users/${userId}/goals`).push();
  
  goalRef.set(goalData)
    .then(() => {
      showToast("Meta criada com sucesso!", "success");
      document.getElementById('goalForm').reset();
      fecharModal('goalModal');
      loadFinancialGoals();
    })
    .catch(error => {
      console.error("Erro ao salvar meta:", error);
      showToast("Erro ao salvar meta. Tente novamente.", "danger");
    });
}

// Adicionar contribuição a uma meta
function addGoalContribution(goalId) {
  const userId = firebase.auth().currentUser.uid;
  
  // Abrir modal de contribuição
  document.getElementById('contributionGoalId').value = goalId;
  abrirModal('contributionModal');
  
  // Carregar informações da meta
  db.ref(`users/${userId}/goals/${goalId}`).once('value').then(snapshot => {
    const goal = snapshot.val();
    document.getElementById('contributionGoalName').textContent = goal.name;
    document.getElementById('contributionCurrentAmount').textContent = `R$ ${parseFloat(goal.currentAmount).toFixed(2)}`;
    document.getElementById('contributionTargetAmount').textContent = `R$ ${parseFloat(goal.targetAmount).toFixed(2)}`;
  });
}

// Salvar contribuição
function saveContribution() {
  const userId = firebase.auth().currentUser.uid;
  const goalId = document.getElementById('contributionGoalId').value;
  const amount = parseFloat(document.getElementById('contributionAmount').value);
  const description = document.getElementById('contributionDescription').value || "Contribuição";
  
  if (!amount || amount <= 0) {
    showToast("Informe um valor válido para a contribuição.", "warning");
    return;
  }
  
  const goalRef = db.ref(`users/${userId}/goals/${goalId}`);
  
  goalRef.once('value').then(snapshot => {
    const goal = snapshot.val();
    const newAmount = parseFloat(goal.currentAmount) + amount;
    
    // Atualizar valor atual
    goalRef.update({
      currentAmount: newAmount
    });
    
    // Adicionar ao histórico
    const historyRef = goalRef.child('history');
    historyRef.push({
      date: new Date().toISOString(),
      amount: amount,
      description: description
    });
    
    showToast("Contribuição adicionada com sucesso!", "success");
    fecharModal('contributionModal');
    loadFinancialGoals();
    
    // Verificar se a meta foi atingida
    if (newAmount >= parseFloat(goal.targetAmount)) {
      showToast(`Parabéns! Você atingiu sua meta "${goal.name}"!`, "success", 5000);
      
      // Adicionar notificação
      addNotification({
        type: 'goal_completed',
        title: 'Meta atingida!',
        message: `Você atingiu sua meta "${goal.name}"!`,
        date: new Date().toISOString()
      });
    }
  });
}

// Editar meta
function editGoal(goalId) {
  const userId = firebase.auth().currentUser.uid;
  
  db.ref(`users/${userId}/goals/${goalId}`).once('value').then(snapshot => {
    const goal = snapshot.val();
    
    document.getElementById('editGoalId').value = goalId;
    document.getElementById('editGoalName').value = goal.name;
    document.getElementById('editGoalAmount').value = goal.targetAmount;
    document.getElementById('editGoalDate').value = goal.targetDate;
    document.getElementById('editGoalCategory').value = goal.category || '';
    
    abrirModal('editGoalModal');
  });
}

// Atualizar meta
function updateGoal() {
  const userId = firebase.auth().currentUser.uid;
  const goalId = document.getElementById('editGoalId').value;
  const goalName = document.getElementById('editGoalName').value;
  const goalAmount = parseFloat(document.getElementById('editGoalAmount').value);
  const goalDate = document.getElementById('editGoalDate').value;
  const goalCategory = document.getElementById('editGoalCategory').value;
  
  if (!goalName || !goalAmount || !goalDate) {
    showToast("Preencha todos os campos obrigatórios.", "warning");
    return;
  }
  
  const updates = {
    name: goalName,
    targetAmount: goalAmount,
    targetDate: goalDate,
    category: goalCategory
  };
  
  db.ref(`users/${userId}/goals/${goalId}`).update(updates)
    .then(() => {
      showToast("Meta atualizada com sucesso!", "success");
      fecharModal('editGoalModal');
      loadFinancialGoals();
    })
    .catch(error => {
      console.error("Erro ao atualizar meta:", error);
      showToast("Erro ao atualizar meta. Tente novamente.", "danger");
    });
}

// Excluir meta
function deleteGoal(goalId) {
  if (confirm("Tem certeza que deseja excluir esta meta?")) {
    const userId = firebase.auth().currentUser.uid;
    
    db.ref(`users/${userId}/goals/${goalId}`).remove()
      .then(() => {
        showToast("Meta excluída com sucesso!", "success");
        loadFinancialGoals();
      })
      .catch(error => {
        console.error("Erro ao excluir meta:", error);
        showToast("Erro ao excluir meta. Tente novamente.", "danger");
      });
  }
}

/**
 * ===============================================
 * 2. ORÇAMENTO MENSAL POR CATEGORIA
 * ===============================================
 */

// Carregar orçamentos
function loadBudgets() {
  const userId = firebase.auth().currentUser.uid;
  const budgetContainer = document.getElementById('budgetContainer');
  budgetContainer.innerHTML = '';
  
  // Obter mês e ano atual para filtro
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Carregar categorias para o formulário de orçamento
  loadCategoriesForBudget();
  
  // Carregar orçamentos do mês atual
  db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}`).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      budgetContainer.innerHTML = '<p class="text-center">Você ainda não definiu orçamentos para este mês. Defina seu primeiro orçamento!</p>';
      return;
    }
    
    // Obter despesas do mês para calcular o progresso
    getMonthlyExpensesByCategory(currentYear, currentMonth).then(expenses => {
      snapshot.forEach(childSnapshot => {
        const budget = childSnapshot.val();
        const categoryId = childSnapshot.key;
        const categoryName = window.novo_categoriasMap[categoryId] || categoryId;
        const spent = expenses[categoryId] || 0;
        const limit = parseFloat(budget.limit);
        const progress = Math.min(Math.round((spent / limit) * 100), 100);
        
        let statusClass = 'success';
        if (progress >= 80 && progress < 100) {
          statusClass = 'warning';
        } else if (progress >= 100) {
          statusClass = 'danger';
        }
        
        const budgetCard = document.createElement('div');
        budgetCard.className = 'card mb-3';
        budgetCard.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <div class="card-title">${categoryName}</div>
              <div class="dropdown">
                <button class="btn btn-icon"><i class="fas fa-ellipsis-v"></i></button>
                <div class="dropdown-content">
                  <a href="#" onclick="editBudget('${categoryId}', ${limit})"><i class="fas fa-edit"></i> Editar</a>
                  <a href="#" onclick="deleteBudget('${categoryId}')"><i class="fas fa-trash"></i> Excluir</a>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <div>Gasto: R$ ${spent.toFixed(2)}</div>
              <div>Limite: R$ ${limit.toFixed(2)}</div>
            </div>
            <div class="progress mb-2">
              <div class="progress-bar progress-bar-${statusClass}" style="width: ${progress}%"></div>
            </div>
            <div class="d-flex justify-content-between">
              <div>${progress}% utilizado</div>
              <div class="text-${statusClass}">
                ${progress >= 100 ? '<i class="fas fa-exclamation-circle"></i> Limite excedido' : 
                  progress >= 80 ? '<i class="fas fa-exclamation-triangle"></i> Próximo ao limite' : 
                  '<i class="fas fa-check-circle"></i> Dentro do orçamento'}
              </div>
            </div>
          </div>
        `;
        
        budgetContainer.appendChild(budgetCard);
      });
    });
  }).catch(error => {
    console.error("Erro ao carregar orçamentos:", error);
    showToast("Erro ao carregar orçamentos. Tente novamente.", "danger");
  });
}

// Obter despesas mensais por categoria
function getMonthlyExpensesByCategory(year, month) {
  return new Promise((resolve, reject) => {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const expenses = {};
    
    db.ref("despesas").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Despesas à vista
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataCompra = new Date(despesa.dataCompra);
          if (dataCompra.getMonth() === month && dataCompra.getFullYear() === year) {
            const categoria = despesa.categoria;
            expenses[categoria] = (expenses[categoria] || 0) + parseFloat(despesa.valor || 0);
          }
        } 
        // Despesas no cartão
        else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            if (dataVencimento.getMonth() === month && dataVencimento.getFullYear() === year) {
              const categoria = despesa.categoria;
              expenses[categoria] = (expenses[categoria] || 0) + parseFloat(parcela.valor || 0);
            }
          });
        }
      });
      
      resolve(expenses);
    }).catch(error => {
      console.error("Erro ao obter despesas:", error);
      reject(error);
    });
  });
}

// Carregar categorias para o formulário de orçamento
function loadCategoriesForBudget() {
  const budgetCategorySelect = document.getElementById('budgetCategory');
  budgetCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement('option');
      option.value = child.key;
      option.textContent = categoria.nome;
      budgetCategorySelect.appendChild(option);
    });
  });
}

// Salvar orçamento
function saveBudget() {
  const userId = firebase.auth().currentUser.uid;
  const categoryId = document.getElementById('budgetCategory').value;
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  
  if (!categoryId || !limit) {
    showToast("Selecione uma categoria e defina um limite.", "warning");
    return;
  }
  
  // Obter mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const budgetRef = db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}/${categoryId}`);
  
  budgetRef.set({
    limit: limit,
    createdAt: new Date().toISOString()
  })
    .then(() => {
      showToast("Orçamento definido com sucesso!", "success");
      document.getElementById('budgetForm').reset();
      fecharModal('budgetModal');
      loadBudgets();
    })
    .catch(error => {
      console.error("Erro ao salvar orçamento:", error);
      showToast("Erro ao salvar orçamento. Tente novamente.", "danger");
    });
}

// Editar orçamento
function editBudget(categoryId, currentLimit) {
  document.getElementById('editBudgetCategory').textContent = window.novo_categoriasMap[categoryId] || categoryId;
  document.getElementById('editBudgetCategoryId').value = categoryId;
  document.getElementById('editBudgetLimit').value = currentLimit;
  
  abrirModal('editBudgetModal');
}

// Atualizar orçamento
function updateBudget() {
  const userId = firebase.auth().currentUser.uid;
  const categoryId = document.getElementById('editBudgetCategoryId').value;
  const limit = parseFloat(document.getElementById('editBudgetLimit').value);
  
  if (!limit) {
    showToast("Defina um limite válido.", "warning");
    return;
  }
  
  // Obter mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}/${categoryId}`).update({
    limit: limit,
    updatedAt: new Date().toISOString()
  })
    .then(() => {
      showToast("Orçamento atualizado com sucesso!", "success");
      fecharModal('editBudgetModal');
      loadBudgets();
    })
    .catch(error => {
      console.error("Erro ao atualizar orçamento:", error);
      showToast("Erro ao atualizar orçamento. Tente novamente.", "danger");
    });
}

// Excluir orçamento
function deleteBudget(categoryId) {
  if (confirm("Tem certeza que deseja excluir este orçamento?")) {
    const userId = firebase.auth().currentUser.uid;
    
    // Obter mês e ano atual
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}/${categoryId}`).remove()
      .then(() => {
        showToast("Orçamento excluído com sucesso!", "success");
        loadBudgets();
      })
      .catch(error => {
        console.error("Erro ao excluir orçamento:", error);
        showToast("Erro ao excluir orçamento. Tente novamente.", "danger");
      });
  }
}

/**
 * ===============================================
 * 3. ANÁLISE DE TENDÊNCIAS E PREVISÕES
 * ===============================================
 */

// Carregar análise de tendências
function loadTrendsAnalysis() {
  const trendsContainer = document.getElementById('trendsContainer');
  trendsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Carregando análise de tendências...</p></div>';
  
  // Obter dados dos últimos 6 meses
  getExpensesData(6).then(data => {
    trendsContainer.innerHTML = '';
    
    // Criar container para o gráfico de tendências
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container mb-4';
    chartContainer.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">Tendência de Gastos - Últimos 6 Meses</div>
      </div>
      <canvas id="trendChart" height="300"></canvas>
    `;
    trendsContainer.appendChild(chartContainer);
    
    // Criar gráfico de tendências
    createTrendChart(data.monthlyTotals);
    
    // Criar container para o gráfico de categorias
    const categoryChartContainer = document.createElement('div');
    categoryChartContainer.className = 'chart-container mb-4';
    categoryChartContainer.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">Gastos por Categoria - Últimos 6 Meses</div>
      </div>
      <canvas id="categoryTrendChart" height="300"></canvas>
    `;
    trendsContainer.appendChild(categoryChartContainer);
    
    // Criar gráfico de categorias
    createCategoryTrendChart(data.categoryTotals);
    
    // Adicionar previsões
    const predictions = calculatePredictions(data.monthlyTotals);
    const predictionsContainer = document.createElement('div');
    predictionsContainer.className = 'card mb-4';
    predictionsContainer.innerHTML = `
      <div class="card-header">
        <div class="card-title">Previsão de Gastos - Próximos 3 Meses</div>
      </div>
      <div class="card-body">
        <div class="chart-container">
          <canvas id="predictionChart" height="250"></canvas>
        </div>
      </div>
    `;
    trendsContainer.appendChild(predictionsContainer);
    
    // Criar gráfico de previsões
    createPredictionChart(data.monthlyTotals, predictions);
    
    // Adicionar insights
    const insights = generateInsights(data, predictions);
    const insightsContainer = document.createElement('div');
    insightsContainer.className = 'card';
    insightsContainer.innerHTML = `
      <div class="card-header">
        <div class="card-title">Insights Financeiros</div>
      </div>
      <div class="card-body">
        <ul class="insights-list">
          ${insights.map(insight => `
            <li class="insight-item">
              <i class="fas ${insight.icon} text-${insight.type}"></i>
              <div>
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    trendsContainer.appendChild(insightsContainer);
    
  }).catch(error => {
    console.error("Erro ao carregar análise de tendências:", error);
    trendsContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar análise de tendências. Tente novamente mais tarde.</div>';
  });
}

// Obter dados de despesas para análise
function getExpensesData(months) {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const monthlyTotals = [];
    const categoryTotals = {};
    
    // Inicializar arrays para os últimos meses
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthlyTotals.push({
        month: date.toLocaleString('pt-BR', { month: 'short' }),
        year: date.getFullYear(),
        total: 0,
        date: date
      });
    }
    
    db.ref("despesas").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Despesas à vista
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataCompra = new Date(despesa.dataCompra);
          
          // Verificar se está dentro do período de análise
          for (let i = 0; i < monthlyTotals.length; i++) {
            const monthData = monthlyTotals[i];
            if (dataCompra.getMonth() === monthData.date.getMonth() && 
                dataCompra.getFullYear() === monthData.date.getFullYear()) {
              
              const valor = parseFloat(despesa.valor || 0);
              monthData.total += valor;
              
              // Adicionar ao total da categoria
              const categoria = despesa.categoria;
              if (!categoryTotals[categoria]) {
                categoryTotals[categoria] = Array(months).fill(0);
              }
              categoryTotals[categoria][i] += valor;
              
              break;
            }
          }
        } 
        // Despesas no cartão
        else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            
            // Verificar se está dentro do período de análise
            for (let i = 0; i < monthlyTotals.length; i++) {
              const monthData = monthlyTotals[i];
              if (dataVencimento.getMonth() === monthData.date.getMonth() && 
                  dataVencimento.getFullYear() === monthData.date.getFullYear()) {
                
                const valor = parseFloat(parcela.valor || 0);
                monthData.total += valor;
                
                // Adicionar ao total da categoria
                const categoria = despesa.categoria;
                if (!categoryTotals[categoria]) {
                  categoryTotals[categoria] = Array(months).fill(0);
                }
                categoryTotals[categoria][i] += valor;
                
                break;
              }
            }
          });
        }
      });
      
      resolve({
        monthlyTotals: monthlyTotals,
        categoryTotals: categoryTotals
      });
    }).catch(error => {
      console.error("Erro ao obter dados de despesas:", error);
      reject(error);
    });
  });
}

// Criar gráfico de tendências
function createTrendChart(data) {
  const ctx = document.getElementById('trendChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(item => `${item.month}/${item.year}`),
      datasets: [{
        label: 'Total de Gastos',
        data: data.map(item => item.total),
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `R$ ${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Criar gráfico de tendências por categoria
function createCategoryTrendChart(categoryData) {
  const ctx = document.getElementById('categoryTrendChart').getContext('2d');
  const months = Object.values(categoryData)[0].length;
  const labels = [];
  
  // Criar labels para os meses
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    labels.push(date.toLocaleString('pt-BR', { month: 'short' }) + '/' + date.getFullYear());
  }
  
  // Cores para as categorias
  const colors = [
    'rgba(67, 97, 238, 1)',   // Azul
    'rgba(76, 201, 240, 1)',  // Ciano
    'rgba(247, 37, 133, 1)',  // Rosa
    'rgba(58, 12, 163, 1)',   // Roxo
    'rgba(114, 9, 183, 1)',   // Violeta
    'rgba(72, 149, 239, 1)',  // Azul claro
    'rgba(76, 175, 80, 1)'    // Verde
  ];
  
  // Preparar datasets
  const datasets = [];
  let colorIndex = 0;
  
  for (const [categoryId, values] of Object.entries(categoryData)) {
    const categoryName = window.novo_categoriasMap[categoryId] || categoryId;
    
    datasets.push({
      label: categoryName,
      data: values,
      borderColor: colors[colorIndex % colors.length],
      backgroundColor: colors[colorIndex % colors.length].replace('1)', '0.2)'),
      borderWidth: 2,
      tension: 0.3
    });
    
    colorIndex++;
  }
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Calcular previsões para os próximos meses
function calculatePredictions(data) {
  // Usar regressão linear simples para prever os próximos 3 meses
  const x = data.map((_, index) => index);
  const y = data.map(item => item.total);
  
  // Calcular coeficientes da regressão linear (y = mx + b)
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = x.length;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }
  
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  
  // Calcular previsões para os próximos 3 meses
  const predictions = [];
  
  for (let i = 1; i <= 3; i++) {
    const nextMonth = new Date(data[data.length - 1].date);
    nextMonth.setMonth(nextMonth.getMonth() + i);
    
    predictions.push({
      month: nextMonth.toLocaleString('pt-BR', { month: 'short' }),
      year: nextMonth.getFullYear(),
      total: m * (n + i - 1) + b,
      date: nextMonth
    });
  }
  
  return predictions;
}

// Criar gráfico de previsões
function createPredictionChart(historicalData, predictions) {
  const ctx = document.getElementById('predictionChart').getContext('2d');
  
  // Combinar dados históricos e previsões
  const labels = [
    ...historicalData.map(item => `${item.month}/${item.year}`),
    ...predictions.map(item => `${item.month}/${item.year}`)
  ];
  
  const historicalValues = historicalData.map(item => item.total);
  const predictionValues = predictions.map(item => item.total);
  
  // Criar array combinado com valores históricos e null para previsões
  const historicalDataset = [
    ...historicalValues,
    ...Array(predictionValues.length).fill(null)
  ];
  
  // Criar array combinado com null para histórico e valores de previsão
  const predictionDataset = [
    ...Array(historicalValues.length).fill(null),
    ...predictionValues
  ];
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Dados Históricos',
          data: historicalDataset,
          borderColor: 'rgba(67, 97, 238, 1)',
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Previsão',
          data: predictionDataset,
          borderColor: 'rgba(247, 37, 133, 1)',
          backgroundColor: 'rgba(247, 37, 133, 0.2)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.raw === null) return '';
              return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Gerar insights baseados nos dados
function generateInsights(data, predictions) {
  const insights = [];
  const monthlyTotals = data.monthlyTotals;
  const categoryTotals = data.categoryTotals;
  
  // Insight 1: Tendência geral de gastos
  const firstMonth = monthlyTotals[0].total;
  const lastMonth = monthlyTotals[monthlyTotals.length - 1].total;
  const percentChange = ((lastMonth - firstMonth) / firstMonth) * 100;
  
  if (percentChange > 10) {
    insights.push({
      title: 'Aumento nos gastos',
      description: `Seus gastos aumentaram ${percentChange.toFixed(1)}% nos últimos ${monthlyTotals.length} meses.`,
      icon: 'fa-arrow-trend-up',
      type: 'warning'
    });
  } else if (percentChange < -10) {
    insights.push({
      title: 'Redução nos gastos',
      description: `Seus gastos diminuíram ${Math.abs(percentChange).toFixed(1)}% nos últimos ${monthlyTotals.length} meses.`,
      icon: 'fa-arrow-trend-down',
      type: 'success'
    });
  } else {
    insights.push({
      title: 'Gastos estáveis',
      description: `Seus gastos se mantiveram estáveis nos últimos ${monthlyTotals.length} meses.`,
      icon: 'fa-equals',
      type: 'primary'
    });
  }
  
  // Insight 2: Categoria com maior crescimento
  let maxGrowthCategory = null;
  let maxGrowthPercent = 0;
  
  for (const [categoryId, values] of Object.entries(categoryTotals)) {
    if (values[0] > 0) {
      const growth = ((values[values.length - 1] - values[0]) / values[0]) * 100;
      if (growth > maxGrowthPercent) {
        maxGrowthPercent = growth;
        maxGrowthCategory = categoryId;
      }
    }
  }
  
  if (maxGrowthCategory && maxGrowthPercent > 20) {
    const categoryName = window.novo_categoriasMap[maxGrowthCategory] || maxGrowthCategory;
    insights.push({
      title: 'Categoria em crescimento',
      description: `Seus gastos com ${categoryName} aumentaram ${maxGrowthPercent.toFixed(1)}%.`,
      icon: 'fa-chart-line',
      type: 'warning'
    });
  }
  
  // Insight 3: Previsão para o próximo mês
  const lastMonthTotal = monthlyTotals[monthlyTotals.length - 1].total;
  const nextMonthPrediction = predictions[0].total;
  const predictionChange = ((nextMonthPrediction - lastMonthTotal) / lastMonthTotal) * 100;
  
  if (predictionChange > 10) {
    insights.push({
      title: 'Previsão de aumento',
      description: `Prevemos um aumento de ${predictionChange.toFixed(1)}% nos seus gastos para o próximo mês.`,
      icon: 'fa-chart-line',
      type: 'warning'
    });
  } else if (predictionChange < -10) {
    insights.push({
      title: 'Previsão de redução',
      description: `Prevemos uma redução de ${Math.abs(predictionChange).toFixed(1)}% nos seus gastos para o próximo mês.`,
      icon: 'fa-chart-line',
      type: 'success'
    });
  } else {
    insights.push({
      title: 'Previsão estável',
      description: `Prevemos que seus gastos se manterão estáveis no próximo mês.`,
      icon: 'fa-chart-line',
      type: 'primary'
    });
  }
  
  // Insight 4: Categoria com maior gasto
  let maxSpendCategory = null;
  let maxSpendValue = 0;
  
  for (const [categoryId, values] of Object.entries(categoryTotals)) {
    const totalSpend = values.reduce((sum, value) => sum + value, 0);
    if (totalSpend > maxSpendValue) {
      maxSpendValue = totalSpend;
      maxSpendCategory = categoryId;
    }
  }
  
  if (maxSpendCategory) {
    const categoryName = window.novo_categoriasMap[maxSpendCategory] || maxSpendCategory;
    const totalExpenses = monthlyTotals.reduce((sum, month) => sum + month.total, 0);
    const percentOfTotal = (maxSpendValue / totalExpenses) * 100;
    
    insights.push({
      title: 'Maior categoria de gastos',
      description: `${categoryName} representa ${percentOfTotal.toFixed(1)}% dos seus gastos totais.`,
      icon: 'fa-wallet',
      type: 'primary'
    });
  }
  
  return insights;
}

/**
 * ===============================================
 * 4. FLUXO DE CAIXA
 * ===============================================
 */

// Carregar fluxo de caixa
function loadCashFlow() {
  const cashFlowContainer = document.getElementById('cashFlowContainer');
  cashFlowContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Carregando fluxo de caixa...</p></div>';
  
  // Obter mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Obter dados do mês atual
  getCashFlowData(currentYear, currentMonth).then(data => {
    cashFlowContainer.innerHTML = '';
    
    // Criar container para o resumo
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'grid mb-4';
    
    // Calcular saldo final
    const finalBalance = data.totalIncome - data.totalExpenses;
    const balanceClass = finalBalance >= 0 ? 'success' : 'danger';
    
    summaryContainer.innerHTML = `
      <div class="stat-card-enhanced">
        <div class="stat-card-icon-enhanced">
          <i class="fas fa-money-bill-wave"></i>
        </div>
        <div class="stat-card-title-enhanced">Receitas</div>
        <div class="stat-card-value-enhanced text-success">R$ ${data.totalIncome.toFixed(2)}</div>
      </div>
      
      <div class="stat-card-enhanced">
        <div class="stat-card-icon-enhanced">
          <i class="fas fa-credit-card"></i>
        </div>
        <div class="stat-card-title-enhanced">Despesas</div>
        <div class="stat-card-value-enhanced text-danger">R$ ${data.totalExpenses.toFixed(2)}</div>
      </div>
      
      <div class="stat-card-enhanced ${balanceClass}">
        <div class="stat-card-icon-enhanced">
          <i class="fas fa-wallet"></i>
        </div>
        <div class="stat-card-title-enhanced">Saldo</div>
        <div class="stat-card-value-enhanced text-${balanceClass}">R$ ${finalBalance.toFixed(2)}</div>
      </div>
    `;
    
    cashFlowContainer.appendChild(summaryContainer);
    
    // Criar container para o gráfico
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container mb-4';
    chartContainer.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">Fluxo de Caixa - ${currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</div>
      </div>
      <canvas id="cashFlowChart" height="300"></canvas>
    `;
    cashFlowContainer.appendChild(chartContainer);
    
    // Criar gráfico de fluxo de caixa
    createCashFlowChart(data);
    
    // Criar tabela de transações
    const transactionsContainer = document.createElement('div');
    transactionsContainer.className = 'card';
    transactionsContainer.innerHTML = `
      <div class="card-header">
        <div class="card-title">Transações do Mês</div>
      </div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody id="transactionsTableBody">
              ${data.transactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.date).toLocaleDateString()}</td>
                  <td>${transaction.description}</td>
                  <td>${transaction.category}</td>
                  <td>
                    <span class="badge badge-${transaction.type === 'income' ? 'success' : 'danger'}">
                      ${transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td class="text-${transaction.type === 'income' ? 'success' : 'danger'}">
                    R$ ${parseFloat(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    cashFlowContainer.appendChild(transactionsContainer);
    
  }).catch(error => {
    console.error("Erro ao carregar fluxo de caixa:", error);
    cashFlowContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar fluxo de caixa. Tente novamente mais tarde.</div>';
  });
}

// Obter dados de fluxo de caixa
function getCashFlowData(year, month) {
  return new Promise((resolve, reject) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const transactions = [];
    const dailyData = {};
    
    // Inicializar dados diários
    for (let day = 1; day <= endDate.getDate(); day++) {
      dailyData[day] = {
        income: 0,
        expenses: 0
      };
    }
    
    // Obter receitas
    db.ref("pessoas").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const pessoa = child.val();
        
        // Adicionar saldo inicial como transação
        if (pessoa.saldoInicial) {
          const saldoInicial = parseFloat(pessoa.saldoInicial);
          totalIncome += saldoInicial;
          
          transactions.push({
            date: startDate.toISOString(),
            description: "Saldo Inicial",
            category: "Saldo",
            type: "income",
            amount: saldoInicial
          });
          
          dailyData[1].income += saldoInicial;
        }
        
        // Adicionar pagamentos
        if (pessoa.pagamentos) {
          pessoa.pagamentos.forEach(pag => {
            const pagamentoDia = parseInt(pag.dia);
            const pagamentoValor = parseFloat(pag.valor);
            
            if (pagamentoDia <= endDate.getDate()) {
              totalIncome += pagamentoValor;
              
              const pagamentoDate = new Date(year, month, pagamentoDia);
              
              transactions.push({
                date: pagamentoDate.toISOString(),
                description: `Pagamento - ${pessoa.nome}`,
                category: "Renda",
                type: "income",
                amount: pagamentoValor
              });
              
              dailyData[pagamentoDia].income += pagamentoValor;
            }
          });
        }
      });
      
      // Obter despesas
      return db.ref("despesas").once("value");
    }).then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Despesas à vista
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataCompra = new Date(despesa.dataCompra);
          
          if (dataCompra.getMonth() === month && dataCompra.getFullYear() === year) {
            const valor = parseFloat(despesa.valor);
            totalExpenses += valor;
            
            const categoryName = window.novo_categoriasMap[despesa.categoria] || despesa.categoria;
            
            transactions.push({
              date: despesa.dataCompra,
              description: despesa.descricao,
              category: categoryName,
              type: "expense",
              amount: valor
            });
            
            const day = dataCompra.getDate();
            dailyData[day].expenses += valor;
          }
        } 
        // Despesas no cartão
        else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            
            if (dataVencimento.getMonth() === month && dataVencimento.getFullYear() === year) {
              const valor = parseFloat(parcela.valor);
              totalExpenses += valor;
              
              const categoryName = window.novo_categoriasMap[despesa.categoria] || despesa.categoria;
              
              transactions.push({
                date: parcela.vencimento,
                description: `${despesa.descricao} - Parcela`,
                category: categoryName,
                type: "expense",
                amount: valor
              });
              
              const day = dataVencimento.getDate();
              dailyData[day].expenses += valor;
            }
          });
        }
      });
      
      // Ordenar transações por data
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      resolve({
        totalIncome,
        totalExpenses,
        transactions,
        dailyData
      });
    }).catch(error => {
      console.error("Erro ao obter dados de fluxo de caixa:", error);
      reject(error);
    });
  });
}

// Criar gráfico de fluxo de caixa
function createCashFlowChart(data) {
  const ctx = document.getElementById('cashFlowChart').getContext('2d');
  
  // Preparar dados para o gráfico
  const days = Object.keys(data.dailyData).sort((a, b) => parseInt(a) - parseInt(b));
  const incomeData = days.map(day => data.dailyData[day].income);
  const expenseData = days.map(day => data.dailyData[day].expenses);
  
  // Calcular saldo acumulado
  let cumulativeBalance = 0;
  const balanceData = days.map(day => {
    cumulativeBalance += data.dailyData[day].income - data.dailyData[day].expenses;
    return cumulativeBalance;
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: 'rgba(76, 201, 240, 0.6)',
          borderColor: 'rgba(76, 201, 240, 1)',
          borderWidth: 1
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'rgba(247, 37, 133, 0.6)',
          borderColor: 'rgba(247, 37, 133, 1)',
          borderWidth: 1
        },
        {
          label: 'Saldo Acumulado',
          data: balanceData,
          type: 'line',
          backgroundColor: 'rgba(67, 97, 238, 0.2)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Valores Diários (R$)'
          },
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Saldo Acumulado (R$)'
          },
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

/**
 * ===============================================
 * 5. COMPARATIVO DE GASTOS
 * ===============================================
 */

// Carregar comparativo de gastos
function loadExpenseComparison() {
  const comparisonContainer = document.getElementById('comparisonContainer');
  comparisonContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Carregando comparativo de gastos...</p></div>';
  
  // Obter dados dos últimos 2 meses para comparação
  getComparisonData().then(data => {
    comparisonContainer.innerHTML = '';
    
    // Criar container para o gráfico de comparação total
    const totalChartContainer = document.createElement('div');
    totalChartContainer.className = 'chart-container mb-4';
    totalChartContainer.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">Comparativo de Gastos Totais</div>
      </div>
      <canvas id="totalComparisonChart" height="300"></canvas>
    `;
    comparisonContainer.appendChild(totalChartContainer);
    
    // Criar gráfico de comparação total
    createTotalComparisonChart(data);
    
    // Criar container para o gráfico de comparação por categoria
    const categoryChartContainer = document.createElement('div');
    categoryChartContainer.className = 'chart-container mb-4';
    categoryChartContainer.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">Comparativo por Categoria</div>
      </div>
      <canvas id="categoryComparisonChart" height="400"></canvas>
    `;
    comparisonContainer.appendChild(categoryChartContainer);
    
    // Criar gráfico de comparação por categoria
    createCategoryComparisonChart(data);
    
    // Criar tabela de variação
    const variationContainer = document.createElement('div');
    variationContainer.className = 'card';
    variationContainer.innerHTML = `
      <div class="card-header">
        <div class="card-title">Variação de Gastos</div>
      </div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>${data.previousMonth.label}</th>
                <th>${data.currentMonth.label}</th>
                <th>Variação</th>
                <th>Variação %</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(data.categories).map(([categoryId, category]) => {
                const previousValue = category.values[0] || 0;
                const currentValue = category.values[1] || 0;
                const variation = currentValue - previousValue;
                const percentVariation = previousValue ? (variation / previousValue) * 100 : 0;
                const variationClass = variation > 0 ? 'danger' : variation < 0 ? 'success' : 'primary';
                
                return `
                  <tr>
                    <td>${category.name}</td>
                    <td>R$ ${previousValue.toFixed(2)}</td>
                    <td>R$ ${currentValue.toFixed(2)}</td>
                    <td class="text-${variationClass}">
                      ${variation > 0 ? '+' : ''}${variation.toFixed(2)}
                    </td>
                    <td class="text-${variationClass}">
                      ${variation > 0 ? '+' : ''}${percentVariation.toFixed(2)}%
                    </td>
                  </tr>
                `;
              }).join('')}
              <tr class="font-weight-bold">
                <td>Total</td>
                <td>R$ ${data.previousMonth.total.toFixed(2)}</td>
                <td>R$ ${data.currentMonth.total.toFixed(2)}</td>
                <td class="text-${data.totalVariation > 0 ? 'danger' : data.totalVariation < 0 ? 'success' : 'primary'}">
                  ${data.totalVariation > 0 ? '+' : ''}${data.totalVariation.toFixed(2)}
                </td>
                <td class="text-${data.totalVariation > 0 ? 'danger' : data.totalVariation < 0 ? 'success' : 'primary'}">
                  ${data.totalVariation > 0 ? '+' : ''}${data.percentVariation.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    comparisonContainer.appendChild(variationContainer);
    
  }).catch(error => {
    console.error("Erro ao carregar comparativo de gastos:", error);
    comparisonContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar comparativo de gastos. Tente novamente mais tarde.</div>';
  });
}

// Obter dados para comparação
function getComparisonData() {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentYear = today.getFullYear();
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthLabel = new Date(currentYear, currentMonth, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const previousMonthLabel = new Date(previousYear, previousMonth, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    
    const categories = {};
    let currentMonthTotal = 0;
    let previousMonthTotal = 0;
    
    db.ref("despesas").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Despesas à vista
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataCompra = new Date(despesa.dataCompra);
          const month = dataCompra.getMonth();
          const year = dataCompra.getFullYear();
          
          if ((month === currentMonth && year === currentYear) || 
              (month === previousMonth && year === previousYear)) {
            
            const valor = parseFloat(despesa.valor || 0);
            const categoria = despesa.categoria;
            const categoryName = window.novo_categoriasMap[categoria] || categoria;
            
            if (!categories[categoria]) {
              categories[categoria] = {
                name: categoryName,
                values: [0, 0] // [previousMonth, currentMonth]
              };
            }
            
            if (month === previousMonth && year === previousYear) {
              categories[categoria].values[0] += valor;
              previousMonthTotal += valor;
            } else {
              categories[categoria].values[1] += valor;
              currentMonthTotal += valor;
            }
          }
        } 
        // Despesas no cartão
        else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            const month = dataVencimento.getMonth();
            const year = dataVencimento.getFullYear();
            
            if ((month === currentMonth && year === currentYear) || 
                (month === previousMonth && year === previousYear)) {
              
              const valor = parseFloat(parcela.valor || 0);
              const categoria = despesa.categoria;
              const categoryName = window.novo_categoriasMap[categoria] || categoria;
              
              if (!categories[categoria]) {
                categories[categoria] = {
                  name: categoryName,
                  values: [0, 0] // [previousMonth, currentMonth]
                };
              }
              
              if (month === previousMonth && year === previousYear) {
                categories[categoria].values[0] += valor;
                previousMonthTotal += valor;
              } else {
                categories[categoria].values[1] += valor;
                currentMonthTotal += valor;
              }
            }
          });
        }
      });
      
      const totalVariation = currentMonthTotal - previousMonthTotal;
      const percentVariation = previousMonthTotal ? (totalVariation / previousMonthTotal) * 100 : 0;
      
      resolve({
        previousMonth: {
          label: previousMonthLabel,
          total: previousMonthTotal
        },
        currentMonth: {
          label: currentMonthLabel,
          total: currentMonthTotal
        },
        categories,
        totalVariation,
        percentVariation
      });
    }).catch(error => {
      console.error("Erro ao obter dados para comparação:", error);
      reject(error);
    });
  });
}

// Criar gráfico de comparação total
function createTotalComparisonChart(data) {
  const ctx = document.getElementById('totalComparisonChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [data.previousMonth.label, data.currentMonth.label],
      datasets: [{
        label: 'Total de Gastos',
        data: [data.previousMonth.total, data.currentMonth.total],
        backgroundColor: [
          'rgba(76, 201, 240, 0.6)',
          'rgba(67, 97, 238, 0.6)'
        ],
        borderColor: [
          'rgba(76, 201, 240, 1)',
          'rgba(67, 97, 238, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Total: R$ ${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Criar gráfico de comparação por categoria
function createCategoryComparisonChart(data) {
  const ctx = document.getElementById('categoryComparisonChart').getContext('2d');
  
  // Preparar dados para o gráfico
  const categories = Object.values(data.categories)
    .sort((a, b) => (b.values[1] + b.values[0]) - (a.values[1] + a.values[0]))
    .slice(0, 8); // Limitar a 8 categorias para melhor visualização
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories.map(cat => cat.name),
      datasets: [
        {
          label: data.previousMonth.label,
          data: categories.map(cat => cat.values[0]),
          backgroundColor: 'rgba(76, 201, 240, 0.6)',
          borderColor: 'rgba(76, 201, 240, 1)',
          borderWidth: 1
        },
        {
          label: data.currentMonth.label,
          data: categories.map(cat => cat.values[1]),
          backgroundColor: 'rgba(67, 97, 238, 0.6)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

/**
 * ===============================================
 * 6. SISTEMA DE NOTIFICAÇÕES PERSONALIZÁVEIS
 * ===============================================
 */

// Carregar notificações
function loadNotifications() {
  const userId = firebase.auth().currentUser.uid;
  const notificationsContainer = document.getElementById('notificationsContainer');
  notificationsContainer.innerHTML = '';
  
  db.ref(`users/${userId}/notifications`).orderByChild('date').limitToLast(20).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      notificationsContainer.innerHTML = '<p class="text-center">Você não tem notificações.</p>';
      return;
    }
    
    const notifications = [];
    snapshot.forEach(child => {
      notifications.push({
        id: child.key,
        ...child.val()
      });
    });
    
    // Ordenar notificações por data (mais recentes primeiro)
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    notifications.forEach(notification => {
      const notificationCard = document.createElement('div');
      notificationCard.className = `alert alert-${getNotificationTypeClass(notification.type)} mb-3`;
      notificationCard.innerHTML = `
        <div class="alert-icon">
          <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="alert-content">
          <div class="alert-title">${notification.title}</div>
          <div>${notification.message}</div>
          <small>${formatNotificationDate(notification.date)}</small>
        </div>
        <div class="alert-close" onclick="markNotificationAsRead('${notification.id}')">
          <i class="fas fa-times"></i>
        </div>
      `;
      
      notificationsContainer.appendChild(notificationCard);
    });
  }).catch(error => {
    console.error("Erro ao carregar notificações:", error);
    notificationsContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar notificações. Tente novamente mais tarde.</div>';
  });
}

// Obter classe CSS para tipo de notificação
function getNotificationTypeClass(type) {
  switch (type) {
    case 'warning':
    case 'budget_alert':
    case 'due_date':
      return 'warning';
    case 'success':
    case 'goal_completed':
      return 'success';
    case 'danger':
    case 'overdue':
      return 'danger';
    default:
      return 'primary';
  }
}

// Obter ícone para tipo de notificação
function getNotificationIcon(type) {
  switch (type) {
    case 'warning':
    case 'budget_alert':
      return 'fa-exclamation-triangle';
    case 'success':
    case 'goal_completed':
      return 'fa-check-circle';
    case 'danger':
    case 'overdue':
      return 'fa-exclamation-circle';
    case 'due_date':
      return 'fa-calendar-alt';
    default:
      return 'fa-bell';
  }
}

// Formatar data da notificação
function formatNotificationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return diffDay === 1 ? 'Ontem' : `${diffDay} dias atrás`;
  } else if (diffHour > 0) {
    return `${diffHour} ${diffHour === 1 ? 'hora' : 'horas'} atrás`;
  } else if (diffMin > 0) {
    return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'} atrás`;
  } else {
    return 'Agora mesmo';
  }
}

// Marcar notificação como lida
function markNotificationAsRead(notificationId) {
  const userId = firebase.auth().currentUser.uid;
  
  db.ref(`users/${userId}/notifications/${notificationId}`).remove()
    .then(() => {
      loadNotifications();
    })
    .catch(error => {
      console.error("Erro ao marcar notificação como lida:", error);
      showToast("Erro ao marcar notificação como lida. Tente novamente.", "danger");
    });
}

// Adicionar notificação
function addNotification(notification) {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  
  db.ref(`users/${userId}/notifications`).push(notification)
    .catch(error => {
      console.error("Erro ao adicionar notificação:", error);
    });
}

// Verificar orçamentos e adicionar notificações
function checkBudgetsAndNotify() {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Obter orçamentos do mês atual
  db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}`).once('value').then(snapshot => {
    if (!snapshot.exists()) return;
    
    // Obter despesas do mês para calcular o progresso
    getMonthlyExpensesByCategory(currentYear, currentMonth).then(expenses => {
      snapshot.forEach(childSnapshot => {
        const budget = childSnapshot.val();
        const categoryId = childSnapshot.key;
        const categoryName = window.novo_categoriasMap[categoryId] || categoryId;
        const spent = expenses[categoryId] || 0;
        const limit = parseFloat(budget.limit);
        const progress = (spent / limit) * 100;
        
        // Verificar se o orçamento está próximo do limite ou excedido
        if (progress >= 90 && progress < 100) {
          // Verificar se já existe uma notificação para este orçamento
          db.ref(`users/${userId}/notifications`)
            .orderByChild('budgetId')
            .equalTo(categoryId)
            .once('value')
            .then(notificationSnapshot => {
              if (!notificationSnapshot.exists()) {
                // Adicionar notificação
                addNotification({
                  type: 'budget_alert',
                  title: 'Orçamento quase atingido',
                  message: `Você já utilizou ${progress.toFixed(0)}% do seu orçamento para ${categoryName}.`,
                  date: new Date().toISOString(),
                  budgetId: categoryId
                });
              }
            });
        } else if (progress >= 100) {
          // Verificar se já existe uma notificação para este orçamento
          db.ref(`users/${userId}/notifications`)
            .orderByChild('budgetId')
            .equalTo(categoryId)
            .once('value')
            .then(notificationSnapshot => {
              if (!notificationSnapshot.exists()) {
                // Adicionar notificação
                addNotification({
                  type: 'danger',
                  title: 'Orçamento excedido',
                  message: `Você excedeu o orçamento para ${categoryName} em ${(progress - 100).toFixed(0)}%.`,
                  date: new Date().toISOString(),
                  budgetId: categoryId
                });
              }
            });
        }
      });
    });
  });
}

// Verificar despesas próximas do vencimento
function checkUpcomingExpenses() {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const dataCompra = new Date(despesa.dataCompra);
        
        // Verificar se a data de compra está entre hoje e 3 dias depois
        if (dataCompra >= today && dataCompra <= threeDaysLater) {
          // Verificar se já existe uma notificação para esta despesa
          db.ref(`users/${userId}/notifications`)
            .orderByChild('expenseId')
            .equalTo(child.key)
            .once('value')
            .then(notificationSnapshot => {
              if (!notificationSnapshot.exists()) {
                // Adicionar notificação
                addNotification({
                  type: 'due_date',
                  title: 'Despesa próxima do vencimento',
                  message: `A despesa "${despesa.descricao}" vence em ${Math.ceil((dataCompra - today) / (1000 * 60 * 60 * 24))} dias.`,
                  date: new Date().toISOString(),
                  expenseId: child.key
                });
              }
            });
        }
      } 
      // Despesas no cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            const dataVencimento = new Date(parcela.vencimento);
            
            // Verificar se a data de vencimento está entre hoje e 3 dias depois
            if (dataVencimento >= today && dataVencimento <= threeDaysLater) {
              // Verificar se já existe uma notificação para esta parcela
              db.ref(`users/${userId}/notifications`)
                .orderByChild('expenseId')
                .equalTo(`${child.key}_${index}`)
                .once('value')
                .then(notificationSnapshot => {
                  if (!notificationSnapshot.exists()) {
                    // Adicionar notificação
                    addNotification({
                      type: 'due_date',
                      title: 'Parcela próxima do vencimento',
                      message: `A parcela ${index + 1} de "${despesa.descricao}" vence em ${Math.ceil((dataVencimento - today) / (1000 * 60 * 60 * 24))} dias.`,
                      date: new Date().toISOString(),
                      expenseId: `${child.key}_${index}`
                    });
                  }
                });
            }
          }
        });
      }
    });
  });
}

// Verificar despesas vencidas
function checkOverdueExpenses() {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  
  const today = new Date();
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const dataCompra = new Date(despesa.dataCompra);
        
        // Verificar se a data de compra já passou
        if (dataCompra < today) {
          // Verificar se já existe uma notificação para esta despesa
          db.ref(`users/${userId}/notifications`)
            .orderByChild('overdueId')
            .equalTo(child.key)
            .once('value')
            .then(notificationSnapshot => {
              if (!notificationSnapshot.exists()) {
                // Adicionar notificação
                addNotification({
                  type: 'overdue',
                  title: 'Despesa vencida',
                  message: `A despesa "${despesa.descricao}" está vencida há ${Math.ceil((today - dataCompra) / (1000 * 60 * 60 * 24))} dias.`,
                  date: new Date().toISOString(),
                  overdueId: child.key
                });
              }
            });
        }
      } 
      // Despesas no cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            const dataVencimento = new Date(parcela.vencimento);
            
            // Verificar se a data de vencimento já passou
            if (dataVencimento < today) {
              // Verificar se já existe uma notificação para esta parcela
              db.ref(`users/${userId}/notifications`)
                .orderByChild('overdueId')
                .equalTo(`${child.key}_${index}`)
                .once('value')
                .then(notificationSnapshot => {
                  if (!notificationSnapshot.exists()) {
                    // Adicionar notificação
                    addNotification({
                      type: 'overdue',
                      title: 'Parcela vencida',
                      message: `A parcela ${index + 1} de "${despesa.descricao}" está vencida há ${Math.ceil((today - dataVencimento) / (1000 * 60 * 60 * 24))} dias.`,
                      date: new Date().toISOString(),
                      overdueId: `${child.key}_${index}`
                    });
                  }
                });
            }
          }
        });
      }
    });
  });
}

// Verificar metas próximas do prazo
function checkGoalDeadlines() {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);
  
  db.ref(`users/${userId}/goals`).once('value').then(snapshot => {
    snapshot.forEach(child => {
      const goal = child.val();
      const targetDate = new Date(goal.targetDate);
      
      // Verificar se a meta está próxima do prazo
      if (targetDate >= today && targetDate <= sevenDaysLater) {
        const progress = calculateGoalProgress(goal);
        
        // Verificar se a meta ainda não foi atingida
        if (progress < 100) {
          // Verificar se já existe uma notificação para esta meta
          db.ref(`users/${userId}/notifications`)
            .orderByChild('goalDeadlineId')
            .equalTo(child.key)
            .once('value')
            .then(notificationSnapshot => {
              if (!notificationSnapshot.exists()) {
                // Adicionar notificação
                addNotification({
                  type: 'warning',
                  title: 'Meta próxima do prazo',
                  message: `Sua meta "${goal.name}" vence em ${Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))} dias e está ${progress}% concluída.`,
                  date: new Date().toISOString(),
                  goalDeadlineId: child.key
                });
              }
            });
        }
      }
    });
  });
}

// Verificar todas as condições para notificações
function checkAllNotifications() {
  if (!firebase.auth().currentUser) return;
  
  checkBudgetsAndNotify();
  checkUpcomingExpenses();
  checkOverdueExpenses();
  checkGoalDeadlines();
}

// Configurar verificação periódica de notificações
function setupNotificationChecks() {
  // Verificar notificações ao carregar a página
  checkAllNotifications();
  
  // Verificar notificações a cada 12 horas
  setInterval(checkAllNotifications, 12 * 60 * 60 * 1000);
}

// Mostrar toast
function showToast(message, type = 'primary', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast-alerta bg-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Inicializar verificação de autenticação
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    setupNotificationChecks();
  }
});
