// Funções principais do sistema de gestão financeira

// Inicializar aplicativo
function initializeApp() {
  // Configurar navegação
  setupNavigation();
  
  // Configurar tema
  setupTheme();
  
  // Configurar eventos
  setupEvents();
  
  // Carregar dados iniciais
  loadInitialData();
}

// Configurar navegação
function setupNavigation() {
  // Navegação do sidebar
  const navLinks = document.querySelectorAll('.sidebar-nav a, #bottom-nav a, .more-menu-content a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        
        const section = this.getAttribute('href').substring(1);
        
        if (section) {
          // Atualizar navegação ativa
          document.querySelectorAll('.sidebar-nav li, #bottom-nav a').forEach(item => {
            item.classList.remove('active');
          });
          
          document.querySelectorAll(`[data-section="${section}"]`).forEach(item => {
            item.classList.add('active');
          });
          
          // Mostrar seção correspondente
          document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
          });
          
          const targetSection = document.getElementById(`${section}-section`);
          if (targetSection) {
            targetSection.classList.add('active');
            document.getElementById('pageTitle').textContent = targetSection.querySelector('h2').textContent;
          }
          
          // Fechar menu mais em dispositivos móveis
          document.getElementById('moreMenu').classList.remove('active');
          document.getElementById('overlay').classList.remove('active');
        }
      }
    });
  });
  
  // Toggle do sidebar
  document.getElementById('toggleSidebar').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.querySelector('main').classList.toggle('expanded');
  });
  
  // Toggle do sidebar em dispositivos móveis
  document.getElementById('mobileSidebarToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
  });
  
  // Menu mais em dispositivos móveis
  document.getElementById('moreBtn').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('moreMenu').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  });
  
  document.getElementById('closeMoreMenu').addEventListener('click', function() {
    document.getElementById('moreMenu').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  });
  
  // Overlay
  document.getElementById('overlay').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('moreMenu').classList.remove('active');
    document.getElementById('notificationsPanel').classList.remove('active');
    this.classList.remove('active');
  });
  
  // Dropdown do usuário
  document.getElementById('userDropdownBtn').addEventListener('click', function() {
    document.getElementById('userDropdownMenu').classList.toggle('active');
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-dropdown') && document.getElementById('userDropdownMenu').classList.contains('active')) {
      document.getElementById('userDropdownMenu').classList.remove('active');
    }
  });
  
  // Notificações
  document.getElementById('notificationsBtn').addEventListener('click', function() {
    document.getElementById('notificationsPanel').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
    loadNotifications();
  });
  
  document.getElementById('closeNotifications').addEventListener('click', function() {
    document.getElementById('notificationsPanel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  });
}

// Configurar tema
function setupTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  
  // Carregar tema salvo
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Tema Claro</span>';
    mobileThemeToggle.innerHTML = '<i class="fas fa-sun"></i> Tema Claro';
  }
  
  // Toggle do tema
  themeToggle.addEventListener('click', function() {
    toggleTheme();
  });
  
  mobileThemeToggle.addEventListener('click', function() {
    toggleTheme();
    document.getElementById('moreMenu').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  });
}

// Alternar tema
function toggleTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const mobileThemeToggle = document.getElementById('mobileThemeToggle');
  
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Tema Escuro</span>';
    mobileThemeToggle.innerHTML = '<i class="fas fa-moon"></i> Tema Escuro';
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Tema Claro</span>';
    mobileThemeToggle.innerHTML = '<i class="fas fa-sun"></i> Tema Claro';
    localStorage.setItem('theme', 'dark');
  }
}

// Configurar eventos
function setupEvents() {
  // Logout
  const logoutButtons = document.querySelectorAll('#logoutBtn, #headerLogoutBtn, #mobileLogout');
  
  logoutButtons.forEach(button => {
    button.addEventListener('click', function() {
      auth.signOut().then(() => {
        window.location.href = 'login.html';
      }).catch(error => {
        console.error('Erro ao fazer logout:', error);
      });
    });
  });
  
  // Formulário de despesa
  document.getElementById('formaPagamento').addEventListener('change', function() {
    const cartaoOptions = document.getElementById('cartaoOptions');
    const parcelasOptions = document.getElementById('parcelasOptions');
    
    if (this.value === 'cartao') {
      cartaoOptions.style.display = 'block';
      parcelasOptions.style.display = 'block';
    } else {
      cartaoOptions.style.display = 'none';
      parcelasOptions.style.display = 'none';
    }
  });
  
  // Navegação de mês
  document.getElementById('prevMonth').addEventListener('click', function() {
    changeMonth(-1);
  });
  
  document.getElementById('nextMonth').addEventListener('click', function() {
    changeMonth(1);
  });
  
  // Botões de atualização
  document.getElementById('refreshCategoryChart').addEventListener('click', function() {
    loadCategoryChart();
  });
  
  document.getElementById('refreshRecentExpenses').addEventListener('click', function() {
    loadRecentExpenses();
  });
  
  document.getElementById('refreshUpcomingDues').addEventListener('click', function() {
    loadUpcomingDues();
  });
  
  document.getElementById('refreshGoals').addEventListener('click', function() {
    loadDashboardGoals();
  });
}

// Carregar dados iniciais
function loadInitialData() {
  // Atualizar mês atual no dashboard
  updateCurrentMonth();
  
  // Carregar dados do dashboard
  loadDashboardData();
  
  // Carregar categorias
  loadCategories();
  
  // Carregar cartões
  loadCards();
  
  // Verificar notificações
  checkNotifications();
}

// Atualizar mês atual no dashboard
function updateCurrentMonth() {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentDate = new Date();
  const currentMonthElement = document.getElementById('currentMonth');
  
  // Armazenar mês e ano atuais como dados do elemento
  currentMonthElement.dataset.month = currentDate.getMonth();
  currentMonthElement.dataset.year = currentDate.getFullYear();
  
  currentMonthElement.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

// Mudar mês
function changeMonth(direction) {
  const currentMonthElement = document.getElementById('currentMonth');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  let month = parseInt(currentMonthElement.dataset.month);
  let year = parseInt(currentMonthElement.dataset.year);
  
  month += direction;
  
  if (month < 0) {
    month = 11;
    year--;
  } else if (month > 11) {
    month = 0;
    year++;
  }
  
  currentMonthElement.dataset.month = month;
  currentMonthElement.dataset.year = year;
  currentMonthElement.textContent = `${months[month]} ${year}`;
  
  // Recarregar dados do dashboard com o novo mês
  loadDashboardData(month, year);
}

// Carregar dados do dashboard
function loadDashboardData(month, year) {
  // Carregar resumo financeiro
  loadFinancialSummary(month, year);
  
  // Carregar gráfico de categorias
  loadCategoryChart(month, year);
  
  // Carregar despesas recentes
  loadRecentExpenses();
  
  // Carregar próximos vencimentos
  loadUpcomingDues();
  
  // Carregar metas no dashboard
  loadDashboardGoals();
}

// Carregar resumo financeiro
function loadFinancialSummary(month, year) {
  const userId = auth.currentUser.uid;
  const currentMonthElement = document.getElementById('currentMonth');
  
  // Usar mês e ano fornecidos ou obter do elemento
  const targetMonth = month !== undefined ? month : parseInt(currentMonthElement.dataset.month);
  const targetYear = year !== undefined ? year : parseInt(currentMonthElement.dataset.year);
  
  // Obter primeiro e último dia do mês
  const startDate = new Date(targetYear, targetMonth, 1).toISOString();
  const endDate = new Date(targetYear, targetMonth + 1, 0).toISOString();
  
  // Obter despesas do mês atual
  db.ref(`users/${userId}/despesas`).orderByChild('dataCompra').startAt(startDate).endAt(endDate).once('value').then(snapshot => {
    let totalExpenses = 0;
    let cardExpenses = 0;
    
    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const expense = childSnapshot.val();
        const value = parseFloat(expense.valor);
        
        totalExpenses += value;
        
        if (expense.formaPagamento === 'cartao') {
          cardExpenses += value;
        }
      });
    }
    
    // Atualizar valores no dashboard
    document.getElementById('totalExpenses').textContent = `R$ ${totalExpenses.toFixed(2)}`;
    document.getElementById('cardExpenses').textContent = `R$ ${cardExpenses.toFixed(2)}`;
    
    // Obter rendas do mês atual
    db.ref(`users/${userId}/rendas`).once('value').then(incomesSnapshot => {
      let totalIncome = 0;
      
      if (incomesSnapshot.exists()) {
        incomesSnapshot.forEach(childSnapshot => {
          const income = childSnapshot.val();
          totalIncome += parseFloat(income.valor);
        });
      }
      
      // Atualizar valores no dashboard
      document.getElementById('totalIncome').textContent = `R$ ${totalIncome.toFixed(2)}`;
      document.getElementById('balance').textContent = `R$ ${(totalIncome - totalExpenses).toFixed(2)}`;
      
      // Obter dados do mês anterior para calcular tendências
      const previousMonth = targetMonth === 0 ? 11 : targetMonth - 1;
      const previousYear = targetMonth === 0 ? targetYear - 1 : targetYear;
      
      const previousStartDate = new Date(previousYear, previousMonth, 1).toISOString();
      const previousEndDate = new Date(previousYear, previousMonth + 1, 0).toISOString();
      
      db.ref(`users/${userId}/despesas`).orderByChild('dataCompra').startAt(previousStartDate).endAt(previousEndDate).once('value').then(previousSnapshot => {
        let previousTotalExpenses = 0;
        let previousCardExpenses = 0;
        
        if (previousSnapshot.exists()) {
          previousSnapshot.forEach(childSnapshot => {
            const expense = childSnapshot.val();
            const value = parseFloat(expense.valor);
            
            previousTotalExpenses += value;
            
            if (expense.formaPagamento === 'cartao') {
              previousCardExpenses += value;
            }
          });
        }
        
        // Calcular tendências
        const expensesTrend = previousTotalExpenses > 0 ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100 : 0;
        const cardTrend = previousCardExpenses > 0 ? ((cardExpenses - previousCardExpenses) / previousCardExpenses) * 100 : 0;
        
        // Atualizar tendências no dashboard
        const expensesTrendElement = document.getElementById('expensesTrend');
        expensesTrendElement.innerHTML = `<i class="fas fa-arrow-${expensesTrend > 0 ? 'up' : 'down'}"></i> ${Math.abs(expensesTrend).toFixed(1)}%`;
        expensesTrendElement.style.color = expensesTrend > 0 ? 'var(--danger)' : 'var(--success)';
        
        const cardTrendElement = document.getElementById('cardTrend');
        cardTrendElement.innerHTML = `<i class="fas fa-arrow-${cardTrend > 0 ? 'up' : 'down'}"></i> ${Math.abs(cardTrend).toFixed(1)}%`;
        cardTrendElement.style.color = cardTrend > 0 ? 'var(--danger)' : 'var(--success)';
        
        // Obter rendas do mês anterior
        db.ref(`users/${userId}/rendas`).once('value').then(previousIncomesSnapshot => {
          let previousTotalIncome = 0;
          
          if (previousIncomesSnapshot.exists()) {
            previousIncomesSnapshot.forEach(childSnapshot => {
              const income = childSnapshot.val();
              previousTotalIncome += parseFloat(income.valor);
            });
          }
          
          // Calcular tendências de renda e saldo
          const incomeTrend = previousTotalIncome > 0 ? ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100 : 0;
          const previousBalance = previousTotalIncome - previousTotalExpenses;
          const currentBalance = totalIncome - totalExpenses;
          const balanceTrend = previousBalance !== 0 ? ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100 : 0;
          
          // Atualizar tendências no dashboard
          const incomeTrendElement = document.getElementById('incomeTrend');
          incomeTrendElement.innerHTML = `<i class="fas fa-arrow-${incomeTrend > 0 ? 'up' : 'down'}"></i> ${Math.abs(incomeTrend).toFixed(1)}%`;
          incomeTrendElement.style.color = incomeTrend > 0 ? 'var(--success)' : 'var(--danger)';
          
          const balanceTrendElement = document.getElementById('balanceTrend');
          balanceTrendElement.innerHTML = `<i class="fas fa-arrow-${balanceTrend > 0 ? 'up' : 'down'}"></i> ${Math.abs(balanceTrend).toFixed(1)}%`;
          balanceTrendElement.style.color = balanceTrend > 0 ? 'var(--success)' : 'var(--danger)';
        });
      });
    });
  }).catch(error => {
    console.error('Erro ao carregar resumo financeiro:', error);
  });
}

// Carregar gráfico de categorias
function loadCategoryChart(month, year) {
  const userId = auth.currentUser.uid;
  const currentMonthElement = document.getElementById('currentMonth');
  
  // Usar mês e ano fornecidos ou obter do elemento
  const targetMonth = month !== undefined ? month : parseInt(currentMonthElement.dataset.month);
  const targetYear = year !== undefined ? year : parseInt(currentMonthElement.dataset.year);
  
  // Obter primeiro e último dia do mês
  const startDate = new Date(targetYear, targetMonth, 1).toISOString();
  const endDate = new Date(targetYear, targetMonth + 1, 0).toISOString();
  
  // Obter categorias
  db.ref(`users/${userId}/categorias`).once('value').then(categoriesSnapshot => {
    const categories = {};
    
    if (categoriesSnapshot.exists()) {
      categoriesSnapshot.forEach(childSnapshot => {
        const category = childSnapshot.val();
        categories[childSnapshot.key] = {
          nome: category.nome,
          cor: category.cor || '#4caf50',
          valor: 0
        };
      });
    }
    
    // Obter despesas do mês atual
    db.ref(`users/${userId}/despesas`).orderByChild('dataCompra').startAt(startDate).endAt(endDate).once('value').then(expensesSnapshot => {
      if (expensesSnapshot.exists()) {
        expensesSnapshot.forEach(childSnapshot => {
          const expense = childSnapshot.val();
          const categoryId = expense.categoria;
          
          if (categories[categoryId]) {
            categories[categoryId].valor += parseFloat(expense.valor);
          }
        });
      }
      
      // Preparar dados para o gráfico
      const categoryNames = [];
      const categoryValues = [];
      const categoryColors = [];
      
      Object.values(categories).forEach(category => {
        if (category.valor > 0) {
          categoryNames.push(category.nome);
          categoryValues.push(category.valor);
          categoryColors.push(category.cor);
        }
      });
      
      // Renderizar gráfico
      const ctx = document.getElementById('categoryChart').getContext('2d');
      
      if (window.categoryChart) {
        window.categoryChart.destroy();
      }
      
      window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categoryNames,
          datasets: [{
            data: categoryValues,
            backgroundColor: categoryColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `R$ ${value.toFixed(2)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }).catch(error => {
      console.error('Erro ao carregar despesas para o gráfico:', error);
    });
  }).catch(error => {
    console.error('Erro ao carregar categorias para o gráfico:', error);
  });
}

// Carregar despesas recentes
function loadRecentExpenses() {
  const userId = auth.currentUser.uid;
  const recentExpensesContainer = document.getElementById('recentExpenses');
  
  recentExpensesContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Carregando despesas...</p></div>';
  
  db.ref(`users/${userId}/despesas`).orderByChild('dataCompra').limitToLast(5).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      recentExpensesContainer.innerHTML = '<div class="text-center"><p>Nenhuma despesa encontrada.</p></div>';
      return;
    }
    
    // Obter categorias
    db.ref(`users/${userId}/categorias`).once('value').then(categoriesSnapshot => {
      const categories = {};
      
      if (categoriesSnapshot.exists()) {
        categoriesSnapshot.forEach(childSnapshot => {
          const category = childSnapshot.val();
          categories[childSnapshot.key] = {
            nome: category.nome,
            cor: category.cor || '#4caf50',
            icone: category.icone || 'fa-tag'
          };
        });
      }
      
      // Processar despesas
      const expenses = [];
      
      snapshot.forEach(childSnapshot => {
        expenses.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Ordenar despesas por data (mais recentes primeiro)
      expenses.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
      
      // Renderizar despesas
      recentExpensesContainer.innerHTML = '';
      
      expenses.forEach(expense => {
        const category = categories[expense.categoria] || { nome: 'Categoria', cor: '#4caf50', icone: 'fa-tag' };
        const date = new Date(expense.dataCompra);
        
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
          <div class="expense-icon" style="background-color: ${category.cor}">
            <i class="fas ${category.icone}"></i>
          </div>
          <div class="expense-content">
            <div class="expense-title">${expense.descricao}</div>
            <div class="expense-details">
              <span>${category.nome} • ${date.toLocaleDateString('pt-BR')}</span>
              <span class="expense-amount">R$ ${parseFloat(expense.valor).toFixed(2)}</span>
            </div>
          </div>
        `;
        
        recentExpensesContainer.appendChild(expenseItem);
      });
    }).catch(error => {
      console.error('Erro ao carregar categorias para despesas recentes:', error);
      recentExpensesContainer.innerHTML = '<div class="text-center"><p>Erro ao carregar despesas. Tente novamente.</p></div>';
    });
  }).catch(error => {
    console.error('Erro ao carregar despesas recentes:', error);
    recentExpensesContainer.innerHTML = '<div class="text-center"><p>Erro ao carregar despesas. Tente novamente.</p></div>';
  });
}

// Carregar próximos vencimentos
function loadUpcomingDues() {
  const userId = auth.currentUser.uid;
  const upcomingDuesContainer = document.getElementById('upcomingDues');
  
  upcomingDuesContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Carregando vencimentos...</p></div>';
  
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const startDate = today.toISOString();
  const endDate = nextWeek.toISOString();
  
  db.ref(`users/${userId}/despesas`).orderByChild('dataVencimento').startAt(startDate).endAt(endDate).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      upcomingDuesContainer.innerHTML = '<div class="text-center"><p>Nenhum vencimento próximo.</p></div>';
      return;
    }
    
    // Processar vencimentos
    const dues = [];
    
    snapshot.forEach(childSnapshot => {
      const expense = childSnapshot.val();
      
      // Verificar se já foi paga
      if (expense.status !== 'pago') {
        dues.push({
          id: childSnapshot.key,
          ...expense
        });
      }
    });
    
    // Ordenar vencimentos por data
    dues.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
    
    // Renderizar vencimentos
    upcomingDuesContainer.innerHTML = '';
    
    if (dues.length === 0) {
      upcomingDuesContainer.innerHTML = '<div class="text-center"><p>Nenhum vencimento próximo.</p></div>';
      return;
    }
    
    dues.forEach(due => {
      const dueDate = new Date(due.dataVencimento);
      const day = dueDate.getDate();
      const month = dueDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      
      const dueItem = document.createElement('div');
      dueItem.className = 'due-item';
      dueItem.innerHTML = `
        <div class="due-date">
          <span class="due-day">${day}</span>
          <span>${month}</span>
        </div>
        <div class="due-content">
          <div class="due-title">${due.descricao}</div>
          <div class="due-details">
            <span>${due.formaPagamento === 'cartao' ? 'Cartão' : 'À Vista'}</span>
            <span class="due-amount">R$ ${parseFloat(due.valor).toFixed(2)}</span>
          </div>
        </div>
      `;
      
      upcomingDuesContainer.appendChild(dueItem);
    });
  }).catch(error => {
    console.error('Erro ao carregar próximos vencimentos:', error);
    upcomingDuesContainer.innerHTML = '<div class="text-center"><p>Erro ao carregar vencimentos. Tente novamente.</p></div>';
  });
}

// Carregar metas no dashboard
function loadDashboardGoals() {
  const userId = auth.currentUser.uid;
  const dashboardGoals = document.getElementById('dashboardGoals');
  
  dashboardGoals.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Carregando metas...</p></div>';
  
  db.ref(`users/${userId}/goals`).limitToFirst(3).once('value').then(snapshot => {
    if (!snapshot.exists()) {
      dashboardGoals.innerHTML = '<div class="text-center"><p>Você ainda não tem metas cadastradas.</p><button class="btn btn-sm btn-primary mt-2" onclick="abrirModal(\'goalModal\')"><i class="fas fa-plus"></i> Criar Meta</button></div>';
      return;
    }
    
    dashboardGoals.innerHTML = '';
    
    snapshot.forEach(childSnapshot => {
      const goal = childSnapshot.val();
      const goalId = childSnapshot.key;
      
      // Usar a classe FinancialGoalsManager para calcular o progresso
      const goalsManager = new FinancialGoalsManager(userId);
      const progress = goalsManager.calculateGoalProgress(goal);
      
      let statusClass = 'primary';
      if (progress >= 100) {
        statusClass = 'success';
      } else if (goalsManager.isGoalNearDeadline(goal)) {
        statusClass = 'warning';
      }
      
      const daysLeft = goalsManager.calculateDaysLeft(goal.targetDate);
      const daysLeftText = daysLeft > 0 
        ? `${daysLeft} dias restantes` 
        : daysLeft === 0 
          ? 'Vence hoje!' 
          : `Venceu há ${Math.abs(daysLeft)} dias`;
      
      const goalItem = document.createElement('div');
      goalItem.className = 'dashboard-goal-item';
      goalItem.innerHTML = `
        <div class="dashboard-goal-header">
          <div class="dashboard-goal-title">${goal.name}</div>
          <div class="dashboard-goal-amount">R$ ${parseFloat(goal.currentAmount).toFixed(2)} / R$ ${parseFloat(goal.targetAmount).toFixed(2)}</div>
        </div>
        <div class="progress">
          <div class="progress-bar progress-bar-${statusClass}" style="width: ${progress}%"></div>
        </div>
        <div class="dashboard-goal-footer">
          <div>${progress}% concluído</div>
          <div class="text-${statusClass === 'warning' ? 'warning' : statusClass === 'success' ? 'success' : 'secondary'}">${daysLeftText}</div>
        </div>
      `;
      
      dashboardGoals.appendChild(goalItem);
    });
    
    // Adicionar link para ver todas
    const viewAllLink = document.createElement('div');
    viewAllLink.className = 'text-center mt-3';
    viewAllLink.innerHTML = '<a href="#goals" class="btn btn-sm btn-outline">Ver Todas</a>';
    
    dashboardGoals.appendChild(viewAllLink);
  }).catch(error => {
    console.error('Erro ao carregar metas:', error);
    dashboardGoals.innerHTML = '<div class="text-center"><p>Erro ao carregar metas. Tente novamente.</p></div>';
  });
}

// Carregar categorias
function loadCategories() {
  const userId = auth.currentUser.uid;
  const categoriaSelect = document.getElementById('categoria');
  
  if (!categoriaSelect) return;
  
  // Limpar opções existentes
  categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  db.ref(`users/${userId}/categorias`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const category = childSnapshot.val();
        const option = document.createElement('option');
        option.value = childSnapshot.key;
        option.textContent = category.nome;
        categoriaSelect.appendChild(option);
      });
    }
  }).catch(error => {
    console.error('Erro ao carregar categorias:', error);
  });
}

// Carregar cartões
function loadCards() {
  const userId = auth.currentUser.uid;
  const cartaoSelect = document.getElementById('cartao');
  
  if (!cartaoSelect) return;
  
  // Limpar opções existentes
  cartaoSelect.innerHTML = '<option value="">Selecione o cartão</option>';
  
  db.ref(`users/${userId}/cartoes`).once('value').then(snapshot => {
    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const card = childSnapshot.val();
        const option = document.createElement('option');
        option.value = childSnapshot.key;
        option.textContent = card.nome;
        cartaoSelect.appendChild(option);
      });
    }
  }).catch(error => {
    console.error('Erro ao carregar cartões:', error);
  });
}

// Verificar notificações
function checkNotifications() {
  const userId = auth.currentUser.uid;
  const notificationManager = new NotificationManager(userId);
  
  notificationManager.checkAllNotifications()
    .then(result => {
      // Atualizar contador de notificações
      const notificationCount = document.getElementById('notificationCount');
      notificationCount.textContent = result.total;
      
      // Carregar notificações se o painel estiver aberto
      if (document.getElementById('notificationsPanel').classList.contains('active')) {
        loadNotifications();
      }
    })
    .catch(error => {
      console.error('Erro ao verificar notificações:', error);
    });
}

// Carregar notificações
function loadNotifications() {
  const userId = auth.currentUser.uid;
  const notificationsContainer = document.getElementById('notificationsContainer');
  
  notificationsContainer.innerHTML = '<div class="text-center"><div class="spinner"></div><p>Carregando notificações...</p></div>';
  
  const notificationManager = new NotificationManager(userId);
  
  notificationManager.getNotifications()
    .then(notifications => {
      if (notifications.length === 0) {
        notificationsContainer.innerHTML = '<div class="text-center"><p>Nenhuma notificação encontrada.</p></div>';
        return;
      }
      
      notificationsContainer.innerHTML = '';
      
      notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        notificationItem.dataset.id = notification.id;
        
        let iconClass = 'fa-bell';
        let iconColor = 'var(--primary)';
        
        switch (notification.type) {
          case 'due':
            iconClass = 'fa-calendar-alt';
            iconColor = 'var(--warning)';
            break;
          case 'budget':
            iconClass = 'fa-chart-pie';
            iconColor = 'var(--danger)';
            break;
          case 'goal':
            iconClass = 'fa-bullseye';
            iconColor = notification.data && notification.data.progress >= 100 ? 'var(--success)' : 'var(--warning)';
            break;
        }
        
        const date = new Date(notification.createdAt);
        const timeAgo = formatTimeAgo(date);
        
        notificationItem.innerHTML = `
          <div class="notification-header">
            <div class="notification-title">
              <i class="fas ${iconClass}" style="color: ${iconColor}"></i>
              ${notification.title}
            </div>
            <div class="notification-time">${timeAgo}</div>
          </div>
          <div class="notification-content">${notification.message}</div>
          <div class="notification-actions">
            <button class="btn btn-sm btn-outline mark-read-btn" data-id="${notification.id}">
              ${notification.read ? 'Marcar como não lida' : 'Marcar como lida'}
            </button>
            <button class="btn btn-sm btn-outline delete-notification-btn" data-id="${notification.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        
        notificationsContainer.appendChild(notificationItem);
      });
      
      // Adicionar eventos para os botões
      document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', function() {
          const notificationId = this.dataset.id;
          const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
          const isRead = !notificationItem.classList.contains('unread');
          
          if (isRead) {
            // Marcar como não lida
            notificationItem.classList.add('unread');
            this.textContent = 'Marcar como lida';
          } else {
            // Marcar como lida
            notificationItem.classList.remove('unread');
            this.textContent = 'Marcar como não lida';
            
            // Atualizar no banco de dados
            notificationManager.markAsRead(notificationId);
          }
        });
      });
      
      document.querySelectorAll('.delete-notification-btn').forEach(button => {
        button.addEventListener('click', function() {
          const notificationId = this.dataset.id;
          const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
          
          // Remover do DOM
          notificationItem.remove();
          
          // Remover do banco de dados
          notificationManager.deleteNotification(notificationId);
          
          // Atualizar contador
          const notificationCount = document.getElementById('notificationCount');
          notificationCount.textContent = parseInt(notificationCount.textContent) - 1;
          
          // Verificar se não há mais notificações
          if (notificationsContainer.children.length === 0) {
            notificationsContainer.innerHTML = '<div class="text-center"><p>Nenhuma notificação encontrada.</p></div>';
          }
        });
      });
    })
    .catch(error => {
      console.error('Erro ao carregar notificações:', error);
      notificationsContainer.innerHTML = '<div class="text-center"><p>Erro ao carregar notificações. Tente novamente.</p></div>';
    });
}

// Formatar tempo relativo
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'agora mesmo';
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'} atrás`;
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hora' : 'horas'} atrás`;
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'dia' : 'dias'} atrás`;
  } else {
    return date.toLocaleDateString('pt-BR');
  }
}

// Abrir modal
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'flex';
  document.getElementById('overlay').classList.add('active');
}

// Fechar modal
function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'none';
  document.getElementById('overlay').classList.remove('active');
}

// Salvar despesa
function salvarDespesa() {
  const userId = auth.currentUser.uid;
  
  const descricao = document.getElementById('descricao').value;
  const valor = document.getElementById('valor').value.replace(',', '.');
  const categoria = document.getElementById('categoria').value;
  const dataCompra = document.getElementById('dataCompra').value;
  const formaPagamento = document.getElementById('formaPagamento').value;
  const observacao = document.getElementById('observacao').value;
  
  if (!descricao || !valor || !categoria || !dataCompra || !formaPagamento) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  
  const despesa = {
    descricao: descricao,
    valor: parseFloat(valor),
    categoria: categoria,
    dataCompra: dataCompra,
    formaPagamento: formaPagamento,
    observacao: observacao,
    status: 'pendente',
    dataVencimento: dataCompra // Pode ser ajustado conforme necessário
  };
  
  if (formaPagamento === 'cartao') {
    const cartao = document.getElementById('cartao').value;
    const parcelas = document.getElementById('parcelas').value;
    
    if (!cartao) {
      alert('Selecione um cartão.');
      return;
    }
    
    despesa.cartao = cartao;
    despesa.parcelas = parcelas || 1;
  }
  
  const despesaRef = db.ref(`users/${userId}/despesas`).push();
  
  despesaRef.set(despesa)
    .then(() => {
      alert('Despesa salva com sucesso!');
      document.getElementById('despesaForm').reset();
      fecharModal('despesaModal');
      
      // Atualizar dados do dashboard
      loadDashboardData();
    })
    .catch(error => {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa. Tente novamente.');
    });
}

// Salvar meta financeira
function saveFinancialGoal() {
  const userId = auth.currentUser.uid;
  const name = document.getElementById('goalName').value;
  const targetAmount = parseFloat(document.getElementById('goalAmount').value.replace(',', '.'));
  const targetDate = document.getElementById('goalDate').value;
  const category = document.getElementById('goalCategory').value;
  const initialAmount = parseFloat(document.getElementById('goalInitialAmount').value.replace(',', '.') || 0);
  
  if (!name || !targetAmount || !targetDate) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  
  const goalsManager = new FinancialGoalsManager(userId);
  
  goalsManager.createGoal({
    name: name,
    targetAmount: targetAmount,
    initialAmount: initialAmount,
    targetDate: targetDate,
    category: category
  })
    .then(() => {
      alert('Meta financeira criada com sucesso!');
      document.getElementById('goalForm').reset();
      fecharModal('goalModal');
      loadDashboardGoals();
    })
    .catch(error => {
      console.error('Erro ao salvar meta:', error);
      alert('Não foi possível salvar a meta. Tente novamente.');
    });
}

// Atualizar informações do usuário
function updateUserInfo(user) {
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userNameSmall = document.getElementById('userNameSmall');
  const userAvatar = document.getElementById('userAvatar');
  const userAvatarSmall = document.getElementById('userAvatarSmall');
  
  userName.textContent = user.displayName || 'Usuário';
  userEmail.textContent = user.email;
  userNameSmall.textContent = user.displayName || 'Usuário';
  
  if (user.photoURL) {
    userAvatar.src = user.photoURL;
    userAvatarSmall.src = user.photoURL;
  }
}

// Exportar funções para uso global
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.salvarDespesa = salvarDespesa;
window.saveFinancialGoal = saveFinancialGoal;
