// Funcionalidades Financeiras Avançadas
'use strict';

// ==================== SISTEMA DE METAS FINANCEIRAS ====================

// Carregar metas financeiras
function loadFinancialGoals() {
  const userId = firebase.auth().currentUser.uid;
  const goalsContainer = document.getElementById('goalsContainer');
  
  goalsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i><p>Carregando metas...</p></div>';
  
  db.ref(`users/${userId}/goals`).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      goalsContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Você ainda não tem metas cadastradas.</p><button class="btn btn-primary" onclick="abrirModal(\'goalModal\')"><i class="fas fa-plus"></i> Criar Meta</button></div></div>';
      return;
    }
    
    goalsContainer.innerHTML = '';
    
    snapshot.forEach(childSnapshot => {
      const goal = childSnapshot.val();
      const goalId = childSnapshot.key;
      const progress = calculateGoalProgress(goal);
      
      let statusClass = 'primary';
      if (progress >= 100) {
        statusClass = 'success';
      } else if (isGoalNearDeadline(goal)) {
        statusClass = 'warning';
      }
      
      const daysLeft = calculateDaysLeft(goal.targetDate);
      const daysLeftText = daysLeft > 0 
        ? `${daysLeft} dias restantes` 
        : daysLeft === 0 
          ? 'Vence hoje!' 
          : `Venceu há ${Math.abs(daysLeft)} dias`;
      
      const goalCard = document.createElement('div');
      goalCard.className = 'card';
      goalCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">${goal.name}</div>
          <div>
            <button class="btn btn-icon" onclick="openEditGoalModal('${goalId}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-icon" onclick="deleteGoal('${goalId}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between mb-2">
            <div><strong>Meta:</strong> R$ ${parseFloat(goal.targetAmount).toFixed(2)}</div>
            <div><strong>Atual:</strong> R$ ${parseFloat(goal.currentAmount).toFixed(2)}</div>
          </div>
          <div class="progress mb-2">
            <div class="progress-bar progress-bar-${statusClass}" style="width: ${progress}%"></div>
          </div>
          <div class="d-flex justify-content-between mb-3">
            <div>${progress}% concluído</div>
            <div class="text-${statusClass === 'warning' ? 'warning' : statusClass === 'success' ? 'success' : 'secondary'}">${daysLeftText}</div>
          </div>
          <div class="d-flex justify-content-between">
            <button class="btn btn-primary" onclick="openContributionModal('${goalId}')">
              <i class="fas fa-plus"></i> Adicionar Contribuição
            </button>
            <button class="btn btn-secondary" onclick="viewGoalHistory('${goalId}')">
              <i class="fas fa-history"></i> Histórico
            </button>
          </div>
        </div>
      `;
      
      goalsContainer.appendChild(goalCard);
    });
  }).catch(error => {
    console.error('Erro ao carregar metas:', error);
    goalsContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Erro ao carregar metas. Tente novamente.</p></div></div>';
  });
}

// Calcular progresso da meta
function calculateGoalProgress(goal) {
  const current = parseFloat(goal.currentAmount) || 0;
  const target = parseFloat(goal.targetAmount) || 1; // Evitar divisão por zero
  return Math.min(Math.round((current / target) * 100), 100);
}

// Verificar se a meta está próxima do prazo
function isGoalNearDeadline(goal) {
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  
  // Considera próximo do prazo se faltam menos de 30 dias e o progresso é menor que 80%
  return daysLeft <= 30 && daysLeft > 0 && calculateGoalProgress(goal) < 80;
}

// Calcular dias restantes
function calculateDaysLeft(targetDateStr) {
  const targetDate = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

// Salvar meta financeira
function saveFinancialGoal() {
  const userId = firebase.auth().currentUser.uid;
  const name = document.getElementById('goalName').value.trim();
  const targetAmount = parseFloat(document.getElementById('goalAmount').value);
  const targetDate = document.getElementById('goalDate').value;
  const category = document.getElementById('goalCategory').value;
  const initialAmount = parseFloat(document.getElementById('goalInitialAmount').value) || 0;
  
  if (!name || isNaN(targetAmount) || !targetDate) {
    showToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  const goalData = {
    name: name,
    targetAmount: targetAmount,
    targetDate: targetDate,
    category: category,
    currentAmount: initialAmount,
    createdAt: new Date().toISOString(),
    contributions: initialAmount > 0 ? {
      [Date.now()]: {
        amount: initialAmount,
        date: new Date().toISOString(),
        description: 'Valor inicial'
      }
    } : null
  };
  
  const newGoalRef = db.ref(`users/${userId}/goals`).push();
  
  newGoalRef.set(goalData)
    .then(() => {
      showToast('Meta criada com sucesso!', 'success');
      fecharModal('goalModal');
      loadFinancialGoals();
      
      // Limpar formulário
      document.getElementById('goalForm').reset();
    })
    .catch(error => {
      console.error('Erro ao salvar meta:', error);
      showToast('Erro ao salvar meta. Tente novamente.', 'danger');
    });
}

// Abrir modal de edição de meta
function openEditGoalModal(goalId) {
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
  const name = document.getElementById('editGoalName').value.trim();
  const targetAmount = parseFloat(document.getElementById('editGoalAmount').value);
  const targetDate = document.getElementById('editGoalDate').value;
  const category = document.getElementById('editGoalCategory').value;
  
  if (!name || isNaN(targetAmount) || !targetDate) {
    showToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  const updates = {
    name: name,
    targetAmount: targetAmount,
    targetDate: targetDate,
    category: category,
    updatedAt: new Date().toISOString()
  };
  
  db.ref(`users/${userId}/goals/${goalId}`).update(updates)
    .then(() => {
      showToast('Meta atualizada com sucesso!', 'success');
      fecharModal('editGoalModal');
      loadFinancialGoals();
    })
    .catch(error => {
      console.error('Erro ao atualizar meta:', error);
      showToast('Erro ao atualizar meta. Tente novamente.', 'danger');
    });
}

// Excluir meta
function deleteGoal(goalId) {
  if (!confirm('Tem certeza que deseja excluir esta meta?')) {
    return;
  }
  
  const userId = firebase.auth().currentUser.uid;
  
  db.ref(`users/${userId}/goals/${goalId}`).remove()
    .then(() => {
      showToast('Meta excluída com sucesso!', 'success');
      loadFinancialGoals();
    })
    .catch(error => {
      console.error('Erro ao excluir meta:', error);
      showToast('Erro ao excluir meta. Tente novamente.', 'danger');
    });
}

// Abrir modal de contribuição
function openContributionModal(goalId) {
  const userId = firebase.auth().currentUser.uid;
  
  db.ref(`users/${userId}/goals/${goalId}`).once('value').then(snapshot => {
    const goal = snapshot.val();
    
    document.getElementById('contributionGoalId').value = goalId;
    document.getElementById('contributionGoalName').textContent = goal.name;
    document.getElementById('contributionCurrentAmount').textContent = `R$ ${parseFloat(goal.currentAmount).toFixed(2)}`;
    document.getElementById('contributionTargetAmount').textContent = `R$ ${parseFloat(goal.targetAmount).toFixed(2)}`;
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionDescription').value = '';
    
    abrirModal('contributionModal');
  });
}

// Salvar contribuição
function saveContribution() {
  const userId = firebase.auth().currentUser.uid;
  const goalId = document.getElementById('contributionGoalId').value;
  const amount = parseFloat(document.getElementById('contributionAmount').value);
  const description = document.getElementById('contributionDescription').value.trim() || 'Contribuição';
  
  if (isNaN(amount) || amount <= 0) {
    showToast('Informe um valor válido para a contribuição.', 'warning');
    return;
  }
  
  // Obter valor atual da meta
  db.ref(`users/${userId}/goals/${goalId}`).once('value').then(snapshot => {
    const goal = snapshot.val();
    const currentAmount = parseFloat(goal.currentAmount) || 0;
    const newAmount = currentAmount + amount;
    
    // Adicionar contribuição ao histórico
    const contributionData = {
      amount: amount,
      date: new Date().toISOString(),
      description: description
    };
    
    const updates = {};
    updates[`users/${userId}/goals/${goalId}/currentAmount`] = newAmount;
    updates[`users/${userId}/goals/${goalId}/contributions/${Date.now()}`] = contributionData;
    
    db.ref().update(updates)
      .then(() => {
        showToast('Contribuição adicionada com sucesso!', 'success');
        fecharModal('contributionModal');
        loadFinancialGoals();
      })
      .catch(error => {
        console.error('Erro ao adicionar contribuição:', error);
        showToast('Erro ao adicionar contribuição. Tente novamente.', 'danger');
      });
  });
}

// Ver histórico de contribuições
function viewGoalHistory(goalId) {
  const userId = firebase.auth().currentUser.uid;
  
  db.ref(`users/${userId}/goals/${goalId}`).once('value').then(snapshot => {
    const goal = snapshot.val();
    
    if (!goal.contributions) {
      showToast('Esta meta ainda não possui contribuições.', 'info');
      return;
    }
    
    let historyHTML = `<h3>Histórico de Contribuições - ${goal.name}</h3>`;
    historyHTML += '<table class="table"><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>';
    
    const contributions = [];
    for (const key in goal.contributions) {
      contributions.push({
        id: key,
        ...goal.contributions[key]
      });
    }
    
    // Ordenar contribuições por data (mais recentes primeiro)
    contributions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    contributions.forEach(contribution => {
      const date = new Date(contribution.date).toLocaleDateString();
      historyHTML += `
        <tr>
          <td>${date}</td>
          <td>${contribution.description}</td>
          <td>R$ ${parseFloat(contribution.amount).toFixed(2)}</td>
        </tr>
      `;
    });
    
    historyHTML += '</tbody></table>';
    
    // Criar modal dinâmico para exibir o histórico
    const historyModal = document.createElement('div');
    historyModal.className = 'modal';
    historyModal.id = 'historyModal';
    historyModal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="document.getElementById('historyModal').remove()">&times;</span>
        ${historyHTML}
      </div>
    `;
    
    document.body.appendChild(historyModal);
    historyModal.style.display = 'flex';
  });
}

// ==================== SISTEMA DE ORÇAMENTO MENSAL ====================

// Carregar orçamentos
function loadBudgets() {
  const userId = firebase.auth().currentUser.uid;
  const budgetContainer = document.getElementById('budgetContainer');
  
  budgetContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i><p>Carregando orçamentos...</p></div>';
  
  // Obter mês e ano atual para filtro
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Carregar categorias primeiro
  db.ref('categorias').once('value').then(categoriesSnapshot => {
    const categories = {};
    categoriesSnapshot.forEach(child => {
      categories[child.key] = child.val().nome;
    });
    
    // Carregar orçamentos do mês atual
    db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}`).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        budgetContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Você ainda não definiu orçamentos para este mês.</p><button class="btn btn-primary" onclick="abrirModal(\'budgetModal\')"><i class="fas fa-plus"></i> Definir Orçamento</button></div></div>';
        return;
      }
      
      // Obter despesas do mês para calcular o progresso
      getMonthlyExpensesByCategory(currentYear, currentMonth).then(expenses => {
        budgetContainer.innerHTML = '';
        
        snapshot.forEach(childSnapshot => {
          const budget = childSnapshot.val();
          const categoryId = childSnapshot.key;
          const categoryName = categories[categoryId] || categoryId;
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
          budgetCard.className = 'card';
          budgetCard.innerHTML = `
            <div class="card-header">
              <div class="card-title">${categoryName}</div>
              <div>
                <button class="btn btn-icon" onclick="openEditBudgetModal('${categoryId}', '${categoryName}', ${limit})">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-icon" onclick="deleteBudget('${categoryId}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <div><strong>Limite:</strong> R$ ${limit.toFixed(2)}</div>
                <div><strong>Gasto:</strong> R$ ${spent.toFixed(2)}</div>
              </div>
              <div class="progress mb-2">
                <div class="progress-bar progress-bar-${statusClass}" style="width: ${progress}%"></div>
              </div>
              <div class="d-flex justify-content-between">
                <div>${progress}% utilizado</div>
                <div class="text-${statusClass === 'danger' ? 'danger' : statusClass === 'warning' ? 'warning' : 'success'}">
                  ${progress >= 100 ? 'Limite excedido!' : progress >= 80 ? 'Próximo do limite!' : 'Dentro do limite'}
                </div>
              </div>
            </div>
          `;
          
          budgetContainer.appendChild(budgetCard);
        });
        
        // Adicionar botão para criar novo orçamento
        const newBudgetCard = document.createElement('div');
        newBudgetCard.className = 'card';
        newBudgetCard.innerHTML = `
          <div class="card-body text-center">
            <button class="btn btn-primary" onclick="abrirModal('budgetModal')">
              <i class="fas fa-plus"></i> Novo Orçamento
            </button>
          </div>
        `;
        
        budgetContainer.appendChild(newBudgetCard);
      });
    }).catch(error => {
      console.error('Erro ao carregar orçamentos:', error);
      budgetContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Erro ao carregar orçamentos. Tente novamente.</p></div></div>';
    });
  });
}

// Carregar categorias para o modal de orçamento
function loadCategoriesForBudget() {
  const budgetCategory = document.getElementById('budgetCategory');
  budgetCategory.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  db.ref('categorias').once('value').then(snapshot => {
    snapshot.forEach(child => {
      const option = document.createElement('option');
      option.value = child.key;
      option.textContent = child.val().nome;
      budgetCategory.appendChild(option);
    });
  });
}

// Salvar orçamento
function saveBudget() {
  const userId = firebase.auth().currentUser.uid;
  const categoryId = document.getElementById('budgetCategory').value;
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  
  if (!categoryId || isNaN(limit) || limit <= 0) {
    showToast('Selecione uma categoria e informe um limite válido.', 'warning');
    return;
  }
  
  // Obter mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const budgetData = {
    limit: limit,
    createdAt: new Date().toISOString()
  };
  
  db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}/${categoryId}`).set(budgetData)
    .then(() => {
      showToast('Orçamento definido com sucesso!', 'success');
      fecharModal('budgetModal');
      loadBudgets();
      
      // Limpar formulário
      document.getElementById('budgetCategory').value = '';
      document.getElementById('budgetLimit').value = '';
    })
    .catch(error => {
      console.error('Erro ao salvar orçamento:', error);
      showToast('Erro ao salvar orçamento. Tente novamente.', 'danger');
    });
}

// Abrir modal de edição de orçamento
function openEditBudgetModal(categoryId, categoryName, limit) {
  document.getElementById('editBudgetCategoryId').value = categoryId;
  document.getElementById('editBudgetCategory').textContent = categoryName;
  document.getElementById('editBudgetLimit').value = limit;
  
  abrirModal('editBudgetModal');
}

// Atualizar orçamento
function updateBudget() {
  const userId = firebase.auth().currentUser.uid;
  const categoryId = document.getElementById('editBudgetCategoryId').value;
  const limit = parseFloat(document.getElementById('editBudgetLimit').value);
  
  if (isNaN(limit) || limit <= 0) {
    showToast('Informe um limite válido.', 'warning');
    return;
  }
  
  // Obter mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const updates = {
    limit: limit,
    updatedAt: new Date().toISOString()
  };
  
  db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}/${categoryId}`).update(updates)
    .then(() => {
      showToast('Orçamento atualizado com sucesso!', 'success');
      fecharModal('editBudgetModal');
      loadBudgets();
    })
    .catch(error => {
      console.error('Erro ao atualizar orçamento:', error);
      showToast('Erro ao atualizar orçamento. Tente novamente.', 'danger');
    });
}

// Excluir orçamento
function deleteBudget(categoryId) {
  if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
    return;
  }
  
  const userId = firebase.auth().currentUser.uid;
  
  // Obter mês e ano atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}/${categoryId}`).remove()
    .then(() => {
      showToast('Orçamento excluído com sucesso!', 'success');
      loadBudgets();
    })
    .catch(error => {
      console.error('Erro ao excluir orçamento:', error);
      showToast('Erro ao excluir orçamento. Tente novamente.', 'danger');
    });
}

// Obter despesas do mês por categoria
function getMonthlyExpensesByCategory(year, month) {
  return new Promise((resolve, reject) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const expenses = {};
    
    db.ref('despesas').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Processar despesas à vista
        if (despesa.formaPagamento === 'avista') {
          const dataCompra = new Date(despesa.dataCompra);
          
          if (dataCompra >= startDate && dataCompra <= endDate) {
            const categoria = despesa.categoria;
            expenses[categoria] = (expenses[categoria] || 0) + parseFloat(despesa.valor);
          }
        }
        // Processar despesas no cartão
        else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            
            if (dataVencimento >= startDate && dataVencimento <= endDate) {
              const categoria = despesa.categoria;
              expenses[categoria] = (expenses[categoria] || 0) + parseFloat(parcela.valor);
            }
          });
        }
      });
      
      resolve(expenses);
    }).catch(error => {
      console.error('Erro ao obter despesas:', error);
      reject(error);
    });
  });
}

// ==================== ANÁLISE DE TENDÊNCIAS E PREVISÕES ====================

// Carregar análise de tendências
function loadTrendsAnalysis() {
  const userId = firebase.auth().currentUser.uid;
  const trendsContainer = document.getElementById('trendsContainer');
  
  trendsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i><p>Analisando dados...</p></div>';
  
  // Obter dados dos últimos 6 meses
  const today = new Date();
  const months = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`
    });
  }
  
  // Obter despesas por mês
  const promises = months.map(m => getMonthlyExpenses(m.year, m.month));
  
  Promise.all(promises)
    .then(results => {
      const monthlyData = months.map((m, i) => ({
        ...m,
        expenses: results[i].total,
        byCategory: results[i].byCategory
      }));
      
      // Criar gráfico de tendências
      createTrendsChart(monthlyData);
      
      // Calcular previsões para os próximos 3 meses
      const predictions = calculatePredictions(monthlyData);
      
      // Criar insights baseados nos dados
      const insights = generateInsights(monthlyData, predictions);
      
      // Exibir resultados
      trendsContainer.innerHTML = '';
      
      // Gráfico de tendências
      const chartCard = document.createElement('div');
      chartCard.className = 'card grid-col-2';
      chartCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">Tendência de Gastos - Últimos 6 Meses</div>
        </div>
        <div class="card-body">
          <canvas id="trendsChart" height="250"></canvas>
        </div>
      `;
      trendsContainer.appendChild(chartCard);
      
      // Previsões
      const predictionsCard = document.createElement('div');
      predictionsCard.className = 'card';
      predictionsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">Previsão para os Próximos 3 Meses</div>
        </div>
        <div class="card-body">
          <canvas id="predictionsChart" height="250"></canvas>
        </div>
      `;
      trendsContainer.appendChild(predictionsCard);
      
      // Insights
      const insightsCard = document.createElement('div');
      insightsCard.className = 'card grid-col-2';
      insightsCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">Insights Financeiros</div>
        </div>
        <div class="card-body">
          <ul class="insights-list">
            ${insights.map(insight => `
              <li class="insight-item">
                <i class="fas fa-lightbulb" style="color: var(--warning); font-size: 1.5rem;"></i>
                <div>
                  <div class="insight-title">${insight.title}</div>
                  <div class="insight-description">${insight.description}</div>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      trendsContainer.appendChild(insightsCard);
      
      // Categorias com maior crescimento
      const growthCard = document.createElement('div');
      growthCard.className = 'card';
      growthCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">Categorias com Maior Variação</div>
        </div>
        <div class="card-body">
          <canvas id="categoryGrowthChart" height="250"></canvas>
        </div>
      `;
      trendsContainer.appendChild(growthCard);
      
      // Inicializar gráficos
      createPredictionsChart(monthlyData, predictions);
      createCategoryGrowthChart(monthlyData);
    })
    .catch(error => {
      console.error('Erro ao carregar análise de tendências:', error);
      trendsContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Erro ao carregar análise de tendências. Tente novamente.</p></div></div>';
    });
}

// Obter despesas mensais
function getMonthlyExpenses(year, month) {
  return new Promise((resolve, reject) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    let total = 0;
    const byCategory = {};
    
    db.ref('despesas').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Processar despesas à vista
        if (despesa.formaPagamento === 'avista') {
          const dataCompra = new Date(despesa.dataCompra);
          
          if (dataCompra >= startDate && dataCompra <= endDate) {
            const valor = parseFloat(despesa.valor);
            const categoria = despesa.categoria;
            
            total += valor;
            byCategory[categoria] = (byCategory[categoria] || 0) + valor;
          }
        }
        // Processar despesas no cartão
        else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            
            if (dataVencimento >= startDate && dataVencimento <= endDate) {
              const valor = parseFloat(parcela.valor);
              const categoria = despesa.categoria;
              
              total += valor;
              byCategory[categoria] = (byCategory[categoria] || 0) + valor;
            }
          });
        }
      });
      
      resolve({ total, byCategory });
    }).catch(error => {
      console.error('Erro ao obter despesas mensais:', error);
      reject(error);
    });
  });
}

// Criar gráfico de tendências
function createTrendsChart(monthlyData) {
  const ctx = document.getElementById('trendsChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.map(m => m.label),
      datasets: [{
        label: 'Despesas Mensais',
        data: monthlyData.map(m => m.expenses),
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
              return `R$ ${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// Calcular previsões para os próximos meses
function calculatePredictions(monthlyData) {
  // Usar regressão linear simples para prever os próximos 3 meses
  const x = [0, 1, 2, 3, 4, 5]; // Índices dos meses
  const y = monthlyData.map(m => m.expenses); // Despesas mensais
  
  // Calcular médias
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  // Calcular coeficientes da regressão linear (y = a + bx)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const b = numerator / denominator;
  const a = meanY - b * meanX;
  
  // Prever os próximos 3 meses
  const predictions = [];
  const today = new Date();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  for (let i = 1; i <= 3; i++) {
    const predictedValue = a + b * (5 + i);
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    
    predictions.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]}/${d.getFullYear().toString().substr(2)}`,
      expenses: Math.max(0, predictedValue) // Evitar valores negativos
    });
  }
  
  return predictions;
}

// Criar gráfico de previsões
function createPredictionsChart(monthlyData, predictions) {
  const ctx = document.getElementById('predictionsChart').getContext('2d');
  
  // Obter os últimos 3 meses de dados reais para comparação
  const recentData = monthlyData.slice(-3);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [...recentData.map(m => m.label), ...predictions.map(p => p.label)],
      datasets: [{
        label: 'Dados Reais',
        data: [...recentData.map(m => m.expenses), ...Array(predictions.length).fill(null)],
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 1
      }, {
        label: 'Previsão',
        data: [...Array(recentData.length).fill(null), ...predictions.map(p => p.expenses)],
        backgroundColor: 'rgba(247, 37, 133, 0.7)',
        borderColor: 'rgba(247, 37, 133, 1)',
        borderWidth: 1
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
              if (context.raw !== null) {
                return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return `R$ ${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// Criar gráfico de crescimento por categoria
function createCategoryGrowthChart(monthlyData) {
  // Obter categorias
  db.ref('categorias').once('value').then(snapshot => {
    const categories = {};
    snapshot.forEach(child => {
      categories[child.key] = child.val().nome;
    });
    
    // Calcular variação percentual por categoria
    const categoryGrowth = {};
    
    // Comparar primeiro e último mês
    const firstMonth = monthlyData[0];
    const lastMonth = monthlyData[monthlyData.length - 1];
    
    // Combinar todas as categorias de ambos os meses
    const allCategories = new Set([
      ...Object.keys(firstMonth.byCategory || {}),
      ...Object.keys(lastMonth.byCategory || {})
    ]);
    
    allCategories.forEach(categoryId => {
      const firstValue = firstMonth.byCategory[categoryId] || 0;
      const lastValue = lastMonth.byCategory[categoryId] || 0;
      
      // Calcular variação percentual
      let growthPercent = 0;
      
      if (firstValue > 0) {
        growthPercent = ((lastValue - firstValue) / firstValue) * 100;
      } else if (lastValue > 0) {
        growthPercent = 100; // Novo gasto (crescimento de 100%)
      }
      
      categoryGrowth[categoryId] = {
        name: categories[categoryId] || categoryId,
        growth: growthPercent,
        firstValue: firstValue,
        lastValue: lastValue
      };
    });
    
    // Ordenar categorias por variação (maior para menor)
    const sortedCategories = Object.entries(categoryGrowth)
      .sort((a, b) => Math.abs(b[1].growth) - Math.abs(a[1].growth))
      .slice(0, 5); // Pegar as 5 categorias com maior variação
    
    // Criar gráfico
    const ctx = document.getElementById('categoryGrowthChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedCategories.map(c => c[1].name),
        datasets: [{
          label: 'Variação (%)',
          data: sortedCategories.map(c => c[1].growth),
          backgroundColor: sortedCategories.map(c => c[1].growth >= 0 ? 'rgba(230, 57, 70, 0.7)' : 'rgba(76, 201, 240, 0.7)'),
          borderColor: sortedCategories.map(c => c[1].growth >= 0 ? 'rgba(230, 57, 70, 1)' : 'rgba(76, 201, 240, 1)'),
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
                const categoryId = sortedCategories[context.dataIndex][0];
                const data = categoryGrowth[categoryId];
                return [
                  `Variação: ${context.raw.toFixed(1)}%`,
                  `Inicial: R$ ${data.firstValue.toFixed(2)}`,
                  `Atual: R$ ${data.lastValue.toFixed(2)}`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `${value}%`;
              }
            }
          }
        }
      }
    });
  });
}

// Gerar insights baseados nos dados
function generateInsights(monthlyData, predictions) {
  const insights = [];
  
  // Insight 1: Tendência geral
  const firstMonth = monthlyData[0].expenses;
  const lastMonth = monthlyData[monthlyData.length - 1].expenses;
  const trend = ((lastMonth - firstMonth) / firstMonth) * 100;
  
  if (trend > 10) {
    insights.push({
      title: 'Aumento nos gastos',
      description: `Seus gastos aumentaram ${trend.toFixed(1)}% nos últimos 6 meses. Considere revisar seu orçamento e identificar áreas para redução.`
    });
  } else if (trend < -10) {
    insights.push({
      title: 'Redução nos gastos',
      description: `Parabéns! Seus gastos diminuíram ${Math.abs(trend).toFixed(1)}% nos últimos 6 meses. Continue com o bom trabalho de controle financeiro.`
    });
  } else {
    insights.push({
      title: 'Gastos estáveis',
      description: `Seus gastos se mantiveram relativamente estáveis nos últimos 6 meses, com variação de ${trend.toFixed(1)}%.`
    });
  }
  
  // Insight 2: Previsão
  const lastActual = monthlyData[monthlyData.length - 1].expenses;
  const nextPredicted = predictions[0].expenses;
  const predictionChange = ((nextPredicted - lastActual) / lastActual) * 100;
  
  if (predictionChange > 5) {
    insights.push({
      title: 'Previsão de aumento',
      description: `Prevemos um aumento de ${predictionChange.toFixed(1)}% em seus gastos para o próximo mês. Considere planejar com antecedência para evitar surpresas.`
    });
  } else if (predictionChange < -5) {
    insights.push({
      title: 'Previsão de redução',
      description: `Prevemos uma redução de ${Math.abs(predictionChange).toFixed(1)}% em seus gastos para o próximo mês. Aproveite para aumentar sua poupança.`
    });
  } else {
    insights.push({
      title: 'Previsão estável',
      description: `Prevemos que seus gastos se manterão estáveis no próximo mês, com variação de ${predictionChange.toFixed(1)}%.`
    });
  }
  
  // Insight 3: Meses com maiores gastos
  const sortedMonths = [...monthlyData].sort((a, b) => b.expenses - a.expenses);
  const highestMonth = sortedMonths[0];
  
  insights.push({
    title: 'Mês com maior gasto',
    description: `${highestMonth.label} foi o mês com maior gasto (R$ ${highestMonth.expenses.toFixed(2)}). Verifique o que aconteceu neste período para entender melhor seus padrões de gastos.`
  });
  
  // Insight 4: Sazonalidade
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonth = new Date().getMonth();
  const upcomingHolidays = [];
  
  // Verificar feriados/eventos nos próximos 3 meses
  for (let i = 0; i < 3; i++) {
    const month = (currentMonth + i) % 12;
    
    if (month === 11) { // Dezembro
      upcomingHolidays.push('Natal e Ano Novo');
    } else if (month === 1) { // Fevereiro
      upcomingHolidays.push('Carnaval');
    } else if (month === 5) { // Junho
      upcomingHolidays.push('Festas Juninas');
    } else if (month === 9) { // Outubro
      upcomingHolidays.push('Dia das Crianças');
    } else if (month === 10) { // Novembro
      upcomingHolidays.push('Black Friday');
    }
  }
  
  if (upcomingHolidays.length > 0) {
    insights.push({
      title: 'Eventos sazonais próximos',
      description: `Fique atento aos próximos eventos: ${upcomingHolidays.join(', ')}. Planeje seus gastos com antecedência para evitar endividamento.`
    });
  }
  
  return insights;
}

// ==================== FLUXO DE CAIXA ====================

// Carregar fluxo de caixa
function loadCashFlow() {
  const userId = firebase.auth().currentUser.uid;
  const cashFlowContainer = document.getElementById('cashFlowContainer');
  
  cashFlowContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i><p>Carregando fluxo de caixa...</p></div>';
  
  // Obter mês e ano selecionados
  const selectedMonth = parseInt(document.getElementById('cashFlowMonth').value);
  const selectedYear = parseInt(document.getElementById('cashFlowYear').value);
  
  // Obter dados do mês
  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0);
  const daysInMonth = endDate.getDate();
  
  // Inicializar array de dias
  const dailyData = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dailyData.push({
      day: i,
      date: new Date(selectedYear, selectedMonth, i),
      income: 0,
      expenses: 0,
      balance: 0
    });
  }
  
  // Obter despesas
  const expensesPromise = new Promise((resolve, reject) => {
    db.ref('despesas').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Processar despesas à vista
        if (despesa.formaPagamento === 'avista') {
          const dataCompra = new Date(despesa.dataCompra);
          
          if (dataCompra >= startDate && dataCompra <= endDate) {
            const day = dataCompra.getDate() - 1; // Índice 0-based
            const valor = parseFloat(despesa.valor);
            
            dailyData[day].expenses += valor;
          }
        }
        // Processar despesas no cartão
        else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataVencimento = new Date(parcela.vencimento);
            
            if (dataVencimento >= startDate && dataVencimento <= endDate) {
              const day = dataVencimento.getDate() - 1; // Índice 0-based
              const valor = parseFloat(parcela.valor);
              
              dailyData[day].expenses += valor;
            }
          });
        }
      });
      
      resolve();
    }).catch(error => {
      console.error('Erro ao obter despesas:', error);
      reject(error);
    });
  });
  
  // Obter receitas
  const incomePromise = new Promise((resolve, reject) => {
    db.ref('usuarios').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const usuario = child.val();
        
        if (usuario.pagamentos) {
          usuario.pagamentos.forEach(pagamento => {
            const dia = parseInt(pagamento.dia);
            const valor = parseFloat(pagamento.valor);
            
            if (dia >= 1 && dia <= daysInMonth) {
              dailyData[dia - 1].income += valor;
            }
          });
        }
      });
      
      resolve();
    }).catch(error => {
      console.error('Erro ao obter receitas:', error);
      reject(error);
    });
  });
  
  // Processar dados após obter despesas e receitas
  Promise.all([expensesPromise, incomePromise])
    .then(() => {
      // Calcular saldo acumulado
      let cumulativeBalance = 0;
      dailyData.forEach(day => {
        day.balance = day.income - day.expenses;
        cumulativeBalance += day.balance;
        day.cumulativeBalance = cumulativeBalance;
      });
      
      // Calcular totais
      const totalIncome = dailyData.reduce((sum, day) => sum + day.income, 0);
      const totalExpenses = dailyData.reduce((sum, day) => sum + day.expenses, 0);
      const netBalance = totalIncome - totalExpenses;
      
      // Criar cards de resumo
      cashFlowContainer.innerHTML = '';
      
      const summaryGrid = document.createElement('div');
      summaryGrid.className = 'grid mb-4';
      summaryGrid.innerHTML = `
        <div class="stat-card-enhanced success">
          <div class="stat-card-icon-enhanced">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div class="stat-card-title-enhanced">Receitas</div>
          <div class="stat-card-value-enhanced">R$ ${totalIncome.toFixed(2)}</div>
        </div>
        
        <div class="stat-card-enhanced warning">
          <div class="stat-card-icon-enhanced">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div class="stat-card-title-enhanced">Despesas</div>
          <div class="stat-card-value-enhanced">R$ ${totalExpenses.toFixed(2)}</div>
        </div>
        
        <div class="stat-card-enhanced ${netBalance >= 0 ? 'success' : 'danger'}">
          <div class="stat-card-icon-enhanced">
            <i class="fas fa-balance-scale"></i>
          </div>
          <div class="stat-card-title-enhanced">Saldo</div>
          <div class="stat-card-value-enhanced">R$ ${netBalance.toFixed(2)}</div>
          <div class="stat-card-trend-enhanced">
            ${netBalance >= 0 ? 'Positivo' : 'Negativo'}
          </div>
        </div>
      `;
      
      cashFlowContainer.appendChild(summaryGrid);
      
      // Criar gráfico de fluxo de caixa
      const chartCard = document.createElement('div');
      chartCard.className = 'card grid-col-2';
      chartCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">Fluxo de Caixa Diário</div>
        </div>
        <div class="card-body">
          <canvas id="cashFlowChart" height="250"></canvas>
        </div>
      `;
      
      cashFlowContainer.appendChild(chartCard);
      
      // Criar tabela de transações
      const tableCard = document.createElement('div');
      tableCard.className = 'card';
      tableCard.innerHTML = `
        <div class="card-header">
          <div class="card-title">Transações Diárias</div>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Receitas</th>
                  <th>Despesas</th>
                  <th>Saldo do Dia</th>
                  <th>Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                ${dailyData.map(day => `
                  <tr>
                    <td>${day.day.toString().padStart(2, '0')}/${(selectedMonth + 1).toString().padStart(2, '0')}/${selectedYear}</td>
                    <td class="text-success">${day.income > 0 ? `R$ ${day.income.toFixed(2)}` : '-'}</td>
                    <td class="text-danger">${day.expenses > 0 ? `R$ ${day.expenses.toFixed(2)}` : '-'}</td>
                    <td class="${day.balance >= 0 ? 'text-success' : 'text-danger'}">R$ ${day.balance.toFixed(2)}</td>
                    <td class="${day.cumulativeBalance >= 0 ? 'text-success' : 'text-danger'}">R$ ${day.cumulativeBalance.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      cashFlowContainer.appendChild(tableCard);
      
      // Inicializar gráfico
      createCashFlowChart(dailyData);
    })
    .catch(error => {
      console.error('Erro ao carregar fluxo de caixa:', error);
      cashFlowContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Erro ao carregar fluxo de caixa. Tente novamente.</p></div></div>';
    });
}

// Criar gráfico de fluxo de caixa
function createCashFlowChart(dailyData) {
  const ctx = document.getElementById('cashFlowChart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dailyData.map(d => d.day),
      datasets: [
        {
          label: 'Receitas',
          data: dailyData.map(d => d.income),
          backgroundColor: 'rgba(76, 201, 240, 0.7)',
          borderColor: 'rgba(76, 201, 240, 1)',
          borderWidth: 1
        },
        {
          label: 'Despesas',
          data: dailyData.map(d => -d.expenses), // Valores negativos para visualização
          backgroundColor: 'rgba(247, 37, 133, 0.7)',
          borderColor: 'rgba(247, 37, 133, 1)',
          borderWidth: 1
        },
        {
          label: 'Saldo Acumulado',
          data: dailyData.map(d => d.cumulativeBalance),
          type: 'line',
          fill: false,
          borderColor: 'rgba(67, 97, 238, 1)',
          tension: 0.1,
          borderWidth: 2,
          pointRadius: 3,
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
              const value = Math.abs(context.raw);
              if (context.dataset.label === 'Receitas') {
                return `Receitas: R$ ${value.toFixed(2)}`;
              } else if (context.dataset.label === 'Despesas') {
                return `Despesas: R$ ${value.toFixed(2)}`;
              } else {
                return `Saldo Acumulado: R$ ${context.raw.toFixed(2)}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Dia do Mês'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Receitas e Despesas (R$)'
          },
          ticks: {
            callback: function(value) {
              return `R$ ${Math.abs(value).toFixed(2)}`;
            }
          }
        },
        y1: {
          position: 'right',
          title: {
            display: true,
            text: 'Saldo Acumulado (R$)'
          },
          ticks: {
            callback: function(value) {
              return `R$ ${value.toFixed(2)}`;
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

// ==================== COMPARATIVO DE GASTOS ====================

// Carregar comparativo de gastos
function loadExpenseComparison() {
  const userId = firebase.auth().currentUser.uid;
  const comparisonContainer = document.getElementById('comparisonContainer');
  
  comparisonContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i><p>Carregando comparativo...</p></div>';
  
  // Obter mês atual e mês anterior
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  
  if (previousMonth < 0) {
    previousMonth = 11;
    previousYear--;
  }
  
  // Obter despesas dos dois meses
  const currentMonthPromise = getMonthlyExpenses(currentYear, currentMonth);
  const previousMonthPromise = getMonthlyExpenses(previousYear, previousMonth);
  
  Promise.all([currentMonthPromise, previousMonthPromise])
    .then(([currentData, previousData]) => {
      // Obter categorias
      db.ref('categorias').once('value').then(snapshot => {
        const categories = {};
        snapshot.forEach(child => {
          categories[child.key] = child.val().nome;
        });
        
        // Combinar todas as categorias de ambos os meses
        const allCategories = new Set([
          ...Object.keys(currentData.byCategory || {}),
          ...Object.keys(previousData.byCategory || {})
        ]);
        
        // Calcular variações
        const comparisonData = [];
        
        allCategories.forEach(categoryId => {
          const currentValue = currentData.byCategory[categoryId] || 0;
          const previousValue = previousData.byCategory[categoryId] || 0;
          
          // Calcular variação absoluta e percentual
          const absoluteChange = currentValue - previousValue;
          let percentChange = 0;
          
          if (previousValue > 0) {
            percentChange = (absoluteChange / previousValue) * 100;
          } else if (currentValue > 0) {
            percentChange = 100; // Novo gasto (crescimento de 100%)
          }
          
          comparisonData.push({
            categoryId: categoryId,
            categoryName: categories[categoryId] || categoryId,
            currentValue: currentValue,
            previousValue: previousValue,
            absoluteChange: absoluteChange,
            percentChange: percentChange
          });
        });
        
        // Ordenar por variação absoluta (maior para menor)
        comparisonData.sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange));
        
        // Calcular totais
        const currentTotal = currentData.total;
        const previousTotal = previousData.total;
        const totalChange = currentTotal - previousTotal;
        const totalPercentChange = previousTotal > 0 ? (totalChange / previousTotal) * 100 : 0;
        
        // Criar cards de resumo
        comparisonContainer.innerHTML = '';
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        const summaryGrid = document.createElement('div');
        summaryGrid.className = 'grid mb-4';
        summaryGrid.innerHTML = `
          <div class="stat-card-enhanced">
            <div class="stat-card-icon-enhanced">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="stat-card-title-enhanced">Mês Anterior</div>
            <div class="stat-card-value-enhanced">R$ ${previousTotal.toFixed(2)}</div>
            <div class="stat-card-trend-enhanced">
              ${monthNames[previousMonth]} ${previousYear}
            </div>
          </div>
          
          <div class="stat-card-enhanced">
            <div class="stat-card-icon-enhanced">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="stat-card-title-enhanced">Mês Atual</div>
            <div class="stat-card-value-enhanced">R$ ${currentTotal.toFixed(2)}</div>
            <div class="stat-card-trend-enhanced">
              ${monthNames[currentMonth]} ${currentYear}
            </div>
          </div>
          
          <div class="stat-card-enhanced ${totalChange <= 0 ? 'success' : 'warning'}">
            <div class="stat-card-icon-enhanced">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-card-title-enhanced">Variação</div>
            <div class="stat-card-value-enhanced">R$ ${Math.abs(totalChange).toFixed(2)}</div>
            <div class="stat-card-trend-enhanced">
              <i class="fas fa-arrow-${totalChange <= 0 ? 'down' : 'up'} trend-${totalChange <= 0 ? 'up' : 'down'}"></i>
              ${Math.abs(totalPercentChange).toFixed(1)}% ${totalChange <= 0 ? 'redução' : 'aumento'}
            </div>
          </div>
        `;
        
        comparisonContainer.appendChild(summaryGrid);
        
        // Criar gráfico de comparação
        const chartCard = document.createElement('div');
        chartCard.className = 'card grid-col-2';
        chartCard.innerHTML = `
          <div class="card-header">
            <div class="card-title">Comparativo por Categoria</div>
          </div>
          <div class="card-body">
            <canvas id="comparisonChart" height="250"></canvas>
          </div>
        `;
        
        comparisonContainer.appendChild(chartCard);
        
        // Criar tabela de variações
        const tableCard = document.createElement('div');
        tableCard.className = 'card';
        tableCard.innerHTML = `
          <div class="card-header">
            <div class="card-title">Variações por Categoria</div>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Mês Anterior</th>
                    <th>Mês Atual</th>
                    <th>Variação</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  ${comparisonData.map(item => `
                    <tr>
                      <td>${item.categoryName}</td>
                      <td>R$ ${item.previousValue.toFixed(2)}</td>
                      <td>R$ ${item.currentValue.toFixed(2)}</td>
                      <td class="${item.absoluteChange <= 0 ? 'text-success' : 'text-danger'}">
                        ${item.absoluteChange <= 0 ? '-' : '+'}R$ ${Math.abs(item.absoluteChange).toFixed(2)}
                      </td>
                      <td class="${item.percentChange <= 0 ? 'text-success' : 'text-danger'}">
                        ${item.percentChange <= 0 ? '' : '+'}${item.percentChange.toFixed(1)}%
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        
        comparisonContainer.appendChild(tableCard);
        
        // Inicializar gráfico
        createComparisonChart(comparisonData, monthNames[previousMonth], monthNames[currentMonth]);
      });
    })
    .catch(error => {
      console.error('Erro ao carregar comparativo:', error);
      comparisonContainer.innerHTML = '<div class="card grid-col-2"><div class="card-body text-center"><p>Erro ao carregar comparativo. Tente novamente.</p></div></div>';
    });
}

// Criar gráfico de comparação
function createComparisonChart(comparisonData, previousMonthName, currentMonthName) {
  const ctx = document.getElementById('comparisonChart').getContext('2d');
  
  // Limitar a 8 categorias para melhor visualização
  const chartData = comparisonData.slice(0, 8);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.map(item => item.categoryName),
      datasets: [
        {
          label: previousMonthName,
          data: chartData.map(item => item.previousValue),
          backgroundColor: 'rgba(67, 97, 238, 0.7)',
          borderColor: 'rgba(67, 97, 238, 1)',
          borderWidth: 1
        },
        {
          label: currentMonthName,
          data: chartData.map(item => item.currentValue),
          backgroundColor: 'rgba(247, 37, 133, 0.7)',
          borderColor: 'rgba(247, 37, 133, 1)',
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
              return `R$ ${value.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

// ==================== SISTEMA DE NOTIFICAÇÕES ====================

// Carregar notificações
function loadNotifications() {
  const userId = firebase.auth().currentUser.uid;
  const notificationsContainer = document.getElementById('notificationsContainer');
  
  notificationsContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i><p>Carregando notificações...</p></div>';
  
  // Verificar configurações de notificações
  db.ref(`users/${userId}/settings/notifications`).once('value').then(snapshot => {
    const settings = snapshot.val() || {
      notifyBudget: true,
      notifyDueDate: true,
      notifyOverdue: true,
      notifyGoals: true
    };
    
    // Atualizar checkboxes nas configurações
    document.getElementById('notifyBudget').checked = settings.notifyBudget;
    document.getElementById('notifyDueDate').checked = settings.notifyDueDate;
    document.getElementById('notifyOverdue').checked = settings.notifyOverdue;
    document.getElementById('notifyGoals').checked = settings.notifyGoals;
    
    // Gerar notificações
    const notifications = [];
    
    // Obter data atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Notificações de orçamento
    if (settings.notifyBudget) {
      const budgetPromise = checkBudgetNotifications(userId, today);
      
      // Notificações de vencimentos próximos
      const dueDatePromise = settings.notifyDueDate ? checkDueDateNotifications(today) : Promise.resolve([]);
      
      // Notificações de despesas vencidas
      const overduePromise = settings.notifyOverdue ? checkOverdueNotifications(today) : Promise.resolve([]);
      
      // Notificações de metas
      const goalsPromise = settings.notifyGoals ? checkGoalNotifications(userId, today) : Promise.resolve([]);
      
      Promise.all([budgetPromise, dueDatePromise, overduePromise, goalsPromise])
        .then(([budgetNotifications, dueDateNotifications, overdueNotifications, goalNotifications]) => {
          const allNotifications = [
            ...budgetNotifications,
            ...dueDateNotifications,
            ...overdueNotifications,
            ...goalNotifications
          ];
          
          // Ordenar por data (mais recentes primeiro)
          allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Atualizar contador de notificações
          updateNotificationCount(allNotifications.length);
          
          if (allNotifications.length === 0) {
            notificationsContainer.innerHTML = '<div class="text-center"><p>Você não tem notificações no momento.</p></div>';
            return;
          }
          
          // Exibir notificações
          notificationsContainer.innerHTML = '';
          
          allNotifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.read ? 'read' : ''}`;
            notificationItem.innerHTML = `
              <div class="notification-icon ${notification.type}">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-date">${formatNotificationDate(notification.date)}</div>
              </div>
              <div class="notification-actions">
                <button class="btn btn-icon" onclick="markNotificationAsRead('${notification.id}')">
                  <i class="fas ${notification.read ? 'fa-envelope-open' : 'fa-envelope'}"></i>
                </button>
              </div>
            `;
            
            notificationsContainer.appendChild(notificationItem);
          });
        })
        .catch(error => {
          console.error('Erro ao carregar notificações:', error);
          notificationsContainer.innerHTML = '<div class="text-center"><p>Erro ao carregar notificações. Tente novamente.</p></div>';
        });
    }
  });
}

// Verificar notificações de orçamento
function checkBudgetNotifications(userId, today) {
  return new Promise((resolve, reject) => {
    const notifications = [];
    
    // Obter mês e ano atual
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Verificar orçamentos
    db.ref(`users/${userId}/budgets/${currentYear}/${currentMonth}`).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        resolve(notifications);
        return;
      }
      
      // Obter categorias
      db.ref('categorias').once('value').then(categoriesSnapshot => {
        const categories = {};
        categoriesSnapshot.forEach(child => {
          categories[child.key] = child.val().nome;
        });
        
        // Obter despesas do mês
        getMonthlyExpensesByCategory(currentYear, currentMonth).then(expenses => {
          snapshot.forEach(childSnapshot => {
            const budget = childSnapshot.val();
            const categoryId = childSnapshot.key;
            const categoryName = categories[categoryId] || categoryId;
            const spent = expenses[categoryId] || 0;
            const limit = parseFloat(budget.limit);
            const progress = Math.round((spent / limit) * 100);
            
            // Verificar se o orçamento está próximo do limite ou excedido
            if (progress >= 100) {
              notifications.push({
                id: `budget_exceeded_${categoryId}_${Date.now()}`,
                type: 'warning',
                title: 'Orçamento Excedido',
                message: `Você excedeu o orçamento para ${categoryName}. Limite: R$ ${limit.toFixed(2)}, Gasto: R$ ${spent.toFixed(2)}.`,
                date: new Date().toISOString(),
                read: false
              });
            } else if (progress >= 80) {
              notifications.push({
                id: `budget_near_limit_${categoryId}_${Date.now()}`,
                type: 'info',
                title: 'Orçamento Próximo do Limite',
                message: `Você está próximo de atingir o orçamento para ${categoryName} (${progress}%). Limite: R$ ${limit.toFixed(2)}, Gasto: R$ ${spent.toFixed(2)}.`,
                date: new Date().toISOString(),
                read: false
              });
            }
          });
          
          resolve(notifications);
        });
      });
    }).catch(error => {
      console.error('Erro ao verificar notificações de orçamento:', error);
      reject(error);
    });
  });
}

// Verificar notificações de vencimentos próximos
function checkDueDateNotifications(today) {
  return new Promise((resolve, reject) => {
    const notifications = [];
    
    // Verificar despesas com vencimento nos próximos 3 dias
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    
    db.ref('despesas').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Processar despesas à vista não pagas
        if (despesa.formaPagamento === 'avista' && !despesa.pago) {
          const dataCompra = new Date(despesa.dataCompra);
          
          if (dataCompra >= today && dataCompra <= threeDaysLater) {
            const daysLeft = Math.ceil((dataCompra - today) / (1000 * 60 * 60 * 24));
            
            notifications.push({
              id: `due_date_${child.key}_${Date.now()}`,
              type: 'info',
              title: 'Vencimento Próximo',
              message: `A despesa "${despesa.descricao}" vence em ${daysLeft} dia(s). Valor: R$ ${parseFloat(despesa.valor).toFixed(2)}.`,
              date: new Date().toISOString(),
              read: false
            });
          }
        }
        // Processar despesas no cartão não pagas
        else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
          despesa.parcelas.forEach((parcela, index) => {
            if (!parcela.pago) {
              const dataVencimento = new Date(parcela.vencimento);
              
              if (dataVencimento >= today && dataVencimento <= threeDaysLater) {
                const daysLeft = Math.ceil((dataVencimento - today) / (1000 * 60 * 60 * 24));
                
                notifications.push({
                  id: `due_date_${child.key}_${index}_${Date.now()}`,
                  type: 'info',
                  title: 'Vencimento Próximo',
                  message: `A parcela ${index + 1} de "${despesa.descricao}" vence em ${daysLeft} dia(s). Valor: R$ ${parseFloat(parcela.valor).toFixed(2)}.`,
                  date: new Date().toISOString(),
                  read: false
                });
              }
            }
          });
        }
      });
      
      resolve(notifications);
    }).catch(error => {
      console.error('Erro ao verificar notificações de vencimentos:', error);
      reject(error);
    });
  });
}

// Verificar notificações de despesas vencidas
function checkOverdueNotifications(today) {
  return new Promise((resolve, reject) => {
    const notifications = [];
    
    db.ref('despesas').once('value').then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Processar despesas à vista não pagas
        if (despesa.formaPagamento === 'avista' && !despesa.pago) {
          const dataCompra = new Date(despesa.dataCompra);
          
          if (dataCompra < today) {
            const daysOverdue = Math.ceil((today - dataCompra) / (1000 * 60 * 60 * 24));
            
            notifications.push({
              id: `overdue_${child.key}_${Date.now()}`,
              type: 'danger',
              title: 'Despesa Vencida',
              message: `A despesa "${despesa.descricao}" está vencida há ${daysOverdue} dia(s). Valor: R$ ${parseFloat(despesa.valor).toFixed(2)}.`,
              date: new Date().toISOString(),
              read: false
            });
          }
        }
        // Processar despesas no cartão não pagas
        else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
          despesa.parcelas.forEach((parcela, index) => {
            if (!parcela.pago) {
              const dataVencimento = new Date(parcela.vencimento);
              
              if (dataVencimento < today) {
                const daysOverdue = Math.ceil((today - dataVencimento) / (1000 * 60 * 60 * 24));
                
                notifications.push({
                  id: `overdue_${child.key}_${index}_${Date.now()}`,
                  type: 'danger',
                  title: 'Parcela Vencida',
                  message: `A parcela ${index + 1} de "${despesa.descricao}" está vencida há ${daysOverdue} dia(s). Valor: R$ ${parseFloat(parcela.valor).toFixed(2)}.`,
                  date: new Date().toISOString(),
                  read: false
                });
              }
            }
          });
        }
      });
      
      resolve(notifications);
    }).catch(error => {
      console.error('Erro ao verificar notificações de despesas vencidas:', error);
      reject(error);
    });
  });
}

// Verificar notificações de metas
function checkGoalNotifications(userId, today) {
  return new Promise((resolve, reject) => {
    const notifications = [];
    
    db.ref(`users/${userId}/goals`).once('value').then(snapshot => {
      if (!snapshot.exists()) {
        resolve(notifications);
        return;
      }
      
      snapshot.forEach(childSnapshot => {
        const goal = childSnapshot.val();
        const goalId = childSnapshot.key;
        
        // Verificar metas próximas do prazo
        const targetDate = new Date(goal.targetDate);
        const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        // Verificar progresso
        const progress = calculateGoalProgress(goal);
        
        // Meta atingida
        if (progress >= 100) {
          notifications.push({
            id: `goal_completed_${goalId}_${Date.now()}`,
            type: 'success',
            title: 'Meta Atingida',
            message: `Parabéns! Você atingiu sua meta "${goal.name}".`,
            date: new Date().toISOString(),
            read: false
          });
        }
        // Meta próxima do prazo com progresso baixo
        else if (daysLeft <= 30 && daysLeft > 0 && progress < 80) {
          notifications.push({
            id: `goal_near_deadline_${goalId}_${Date.now()}`,
            type: 'warning',
            title: 'Meta Próxima do Prazo',
            message: `Sua meta "${goal.name}" vence em ${daysLeft} dia(s) e está com ${progress}% de progresso.`,
            date: new Date().toISOString(),
            read: false
          });
        }
        // Meta vencida
        else if (daysLeft <= 0 && progress < 100) {
          notifications.push({
            id: `goal_overdue_${goalId}_${Date.now()}`,
            type: 'danger',
            title: 'Meta Vencida',
            message: `Sua meta "${goal.name}" venceu e está com ${progress}% de progresso.`,
            date: new Date().toISOString(),
            read: false
          });
        }
      });
      
      resolve(notifications);
    }).catch(error => {
      console.error('Erro ao verificar notificações de metas:', error);
      reject(error);
    });
  });
}

// Marcar notificação como lida
function markNotificationAsRead(notificationId) {
  const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
  
  if (notificationItem) {
    notificationItem.classList.add('read');
    
    // Atualizar ícone
    const icon = notificationItem.querySelector('.notification-actions i');
    icon.classList.remove('fa-envelope');
    icon.classList.add('fa-envelope-open');
    
    // Atualizar contador
    const count = document.querySelectorAll('.notification-item:not(.read)').length;
    updateNotificationCount(count);
  }
}

// Atualizar contador de notificações
function updateNotificationCount(count) {
  const badge = document.getElementById('notificationCount');
  
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Verificar todas as notificações
function checkAllNotifications() {
  const userId = firebase.auth().currentUser.uid;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Verificar configurações de notificações
  db.ref(`users/${userId}/settings/notifications`).once('value').then(snapshot => {
    const settings = snapshot.val() || {
      notifyBudget: true,
      notifyDueDate: true,
      notifyOverdue: true,
      notifyGoals: true
    };
    
    // Gerar notificações
    const budgetPromise = settings.notifyBudget ? checkBudgetNotifications(userId, today) : Promise.resolve([]);
    const dueDatePromise = settings.notifyDueDate ? checkDueDateNotifications(today) : Promise.resolve([]);
    const overduePromise = settings.notifyOverdue ? checkOverdueNotifications(today) : Promise.resolve([]);
    const goalsPromise = settings.notifyGoals ? checkGoalNotifications(userId, today) : Promise.resolve([]);
    
    Promise.all([budgetPromise, dueDatePromise, overduePromise, goalsPromise])
      .then(([budgetNotifications, dueDateNotifications, overdueNotifications, goalNotifications]) => {
        const allNotifications = [
          ...budgetNotifications,
          ...dueDateNotifications,
          ...overdueNotifications,
          ...goalNotifications
        ];
        
        // Atualizar contador de notificações
        updateNotificationCount(allNotifications.length);
        
        // Mostrar toast para notificações importantes
        const importantNotifications = allNotifications.filter(n => n.type === 'danger' || n.type === 'warning');
        
        if (importantNotifications.length > 0) {
          showToast(`Você tem ${importantNotifications.length} notificação(ões) importante(s).`, 'warning');
        }
      })
      .catch(error => {
        console.error('Erro ao verificar notificações:', error);
      });
  });
}

// Obter ícone para tipo de notificação
function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return 'fa-check-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    case 'danger':
      return 'fa-exclamation-circle';
    case 'info':
    default:
      return 'fa-info-circle';
  }
}

// Formatar data de notificação
function formatNotificationDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Agora mesmo';
  } else if (diffMin < 60) {
    return `${diffMin} minuto(s) atrás`;
  } else if (diffHour < 24) {
    return `${diffHour} hora(s) atrás`;
  } else if (diffDay < 7) {
    return `${diffDay} dia(s) atrás`;
  } else {
    return date.toLocaleDateString();
  }
}

// Salvar configurações de notificações
function saveNotificationSettings() {
  const userId = firebase.auth().currentUser.uid;
  
  const settings = {
    notifyBudget: document.getElementById('notifyBudget').checked,
    notifyDueDate: document.getElementById('notifyDueDate').checked,
    notifyOverdue: document.getElementById('notifyOverdue').checked,
    notifyGoals: document.getElementById('notifyGoals').checked,
    updatedAt: new Date().toISOString()
  };
  
  db.ref(`users/${userId}/settings/notifications`).set(settings)
    .then(() => {
      showToast('Configurações salvas com sucesso!', 'success');
      fecharModal('notificationSettingsModal');
      loadNotifications();
    })
    .catch(error => {
      console.error('Erro ao salvar configurações:', error);
      showToast('Erro ao salvar configurações. Tente novamente.', 'danger');
    });
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

// Exibir toast
function showToast(message, type = 'info') {
  // Verificar se já existe um container de toast
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Criar toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Ícone baseado no tipo
  let icon = 'fa-info-circle';
  let title = 'Informação';
  
  switch (type) {
    case 'success':
      icon = 'fa-check-circle';
      title = 'Sucesso';
      break;
    case 'warning':
      icon = 'fa-exclamation-triangle';
      title = 'Atenção';
      break;
    case 'danger':
      icon = 'fa-exclamation-circle';
      title = 'Erro';
      break;
  }
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <div class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Remover toast após 5 segundos
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Exportar dados
function exportData() {
  const userId = firebase.auth().currentUser.uid;
  
  // Obter dados do usuário
  Promise.all([
    db.ref('despesas').once('value'),
    db.ref('categorias').once('value'),
    db.ref('cartoes').once('value'),
    db.ref('usuarios').once('value'),
    db.ref(`users/${userId}/goals`).once('value'),
    db.ref(`users/${userId}/budgets`).once('value')
  ])
    .then(([despesasSnapshot, categoriasSnapshot, cartoesSnapshot, usuariosSnapshot, goalsSnapshot, budgetsSnapshot]) => {
      const data = {
        despesas: despesasSnapshot.val() || {},
        categorias: categoriasSnapshot.val() || {},
        cartoes: cartoesSnapshot.val() || {},
        usuarios: usuariosSnapshot.val() || {},
        goals: goalsSnapshot.val() || {},
        budgets: budgetsSnapshot.val() || {},
        exportedAt: new Date().toISOString()
      };
      
      // Converter para JSON
      const jsonData = JSON.stringify(data, null, 2);
      
      // Criar blob e link para download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `financontrol_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      showToast('Dados exportados com sucesso!', 'success');
    })
    .catch(error => {
      console.error('Erro ao exportar dados:', error);
      showToast('Erro ao exportar dados. Tente novamente.', 'danger');
    });
}
