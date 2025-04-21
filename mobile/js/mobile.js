/**
 * mobile.js - JavaScript para a interface mobile independente
 * Finanças Pessoais - Versão Mobile 2025
 * 
 * Este arquivo contém todas as funcionalidades JavaScript específicas para a interface mobile,
 * incluindo navegação, interações, gráficos e integração com o banco de dados.
 */

// ===== CONFIGURAÇÃO INICIAL =====
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBCZ8-vQh-GYPAf-acnUUmUmDc_dRdvjpk",
  authDomain: "financas-pessoais-app.firebaseapp.com",
  databaseURL: "https://financas-pessoais-app.firebaseio.com",
  projectId: "financas-pessoais-app",
  storageBucket: "financas-pessoais-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

// Inicialização do Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}

// ===== UTILITÁRIOS =====
// Formatação de moeda
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formatação de data
function formatDate(date, format = 'short') {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('pt-BR');
  } else if (format === 'long') {
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } else if (format === 'month') {
    return d.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }
  
  return d.toLocaleDateString('pt-BR');
}

// Geração de ID único
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Detecção de dispositivo móvel
function isMobileDevice() {
  return (window.innerWidth <= 768);
}

// Obter parâmetros da URL
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// ===== GERENCIAMENTO DE ESTADO =====
// Estado global da aplicação
const appState = {
  currentUser: null,
  isLoading: false,
  currentPage: window.location.pathname.split('/').pop(),
  currentPeriod: {
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  },
  notifications: [],
  darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
};

// Gerenciador de estado
const stateManager = {
  // Atualizar estado
  updateState(key, value) {
    appState[key] = value;
    this.notifyListeners(key);
  },
  
  // Ouvintes de mudanças de estado
  listeners: {},
  
  // Adicionar ouvinte
  addListener(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
  },
  
  // Notificar ouvintes
  notifyListeners(key) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(appState[key]));
    }
  }
};

// ===== NAVEGAÇÃO E UI =====
// Inicialização da UI
function initUI() {
  // Configurar navegação inferior
  setupBottomNav();
  
  // Configurar menu "Mais"
  setupMoreMenu();
  
  // Configurar FAB
  setupFAB();
  
  // Configurar modais
  setupModals();
  
  // Configurar pesquisa
  setupSearch();
  
  // Configurar filtros
  setupFilters();
  
  // Configurar tabs
  setupTabs();
  
  // Inicializar página específica
  initCurrentPage();
  
  // Verificar autenticação
  checkAuth();
}

// Configurar navegação inferior
function setupBottomNav() {
  const bottomNav = document.getElementById('bottom-nav');
  if (!bottomNav) return;
  
  // Marcar item ativo
  const currentPage = appState.currentPage;
  const navItems = bottomNav.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && href.includes(currentPage)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Configurar botão "Mais"
  const moreBtn = document.getElementById('more-menu-btn');
  if (moreBtn) {
    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMoreMenu();
    });
  }
}

// Alternar menu "Mais"
function toggleMoreMenu() {
  const moreMenu = document.getElementById('more-menu');
  const overlay = document.getElementById('overlay');
  
  if (moreMenu) {
    moreMenu.classList.toggle('active');
    
    if (moreMenu.classList.contains('active')) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
}

// Configurar menu "Mais"
function setupMoreMenu() {
  const moreMenu = document.getElementById('more-menu');
  if (!moreMenu) return;
  
  // Fechar menu
  const closeBtn = document.getElementById('close-more-menu');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      moreMenu.classList.remove('active');
      document.getElementById('overlay').classList.remove('active');
    });
  }
  
  // Configurar botão de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }
  
  // Marcar item ativo
  const currentPage = appState.currentPage;
  const menuItems = moreMenu.querySelectorAll('.more-menu-item');
  
  menuItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && href.includes(currentPage)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Configurar botão de ação flutuante (FAB)
function setupFAB() {
  const fab = document.getElementById('fab-button');
  if (!fab) return;
  
  // Configurar ação do FAB com base na página atual
  fab.addEventListener('click', () => {
    const currentPage = appState.currentPage;
    
    if (currentPage === 'index.html' || currentPage === '') {
      showModal('add-transaction-modal');
    } else if (currentPage === 'despesas.html') {
      showModal('add-expense-modal');
    } else if (currentPage === 'receitas.html') {
      showModal('add-income-modal');
    } else if (currentPage === 'cartoes.html') {
      showModal('add-card-modal');
    } else if (currentPage === 'metas.html') {
      showModal('add-goal-modal');
    }
  });
}

// Configurar modais
function setupModals() {
  // Fechar modais ao clicar no overlay
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeAllModals();
      
      // Fechar também o menu "Mais"
      const moreMenu = document.getElementById('more-menu');
      if (moreMenu) {
        moreMenu.classList.remove('active');
      }
    });
  }
  
  // Configurar botões de fechar modal
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      if (modal) {
        hideModal(modal);
      }
    });
  });
}

// Mostrar modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  // Mostrar overlay
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.classList.add('active');
  }
  
  // Mostrar modal
  modal.classList.add('active');
  
  // Evento de modal aberto
  const event = new CustomEvent('modalOpened', { detail: { modalId } });
  document.dispatchEvent(event);
}

// Esconder modal
function hideModal(modal) {
  if (typeof modal === 'string') {
    modal = document.getElementById(modal);
  }
  
  if (!modal) return;
  
  // Esconder modal
  modal.classList.remove('active');
  
  // Verificar se há outros modais abertos
  const openModals = document.querySelectorAll('.modal.active');
  if (openModals.length === 0) {
    // Se não houver, esconder overlay
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
  
  // Evento de modal fechado
  const modalId = modal.id;
  const event = new CustomEvent('modalClosed', { detail: { modalId } });
  document.dispatchEvent(event);
}

// Fechar todos os modais
function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.classList.remove('active');
  });
  
  // Esconder overlay
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Configurar pesquisa
function setupSearch() {
  const searchBtn = document.getElementById('search-btn');
  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  const clearSearch = document.getElementById('clear-search');
  
  if (!searchBtn || !searchBar || !searchInput) return;
  
  // Mostrar/esconder barra de pesquisa
  searchBtn.addEventListener('click', () => {
    searchBar.classList.toggle('active');
    
    if (searchBar.classList.contains('active')) {
      searchInput.focus();
    }
  });
  
  // Limpar pesquisa
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      
      // Disparar evento de pesquisa
      const event = new Event('input');
      searchInput.dispatchEvent(event);
    });
  }
  
  // Configurar evento de pesquisa
  searchInput.addEventListener('input', debounce(() => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Disparar evento de pesquisa
    const event = new CustomEvent('search', { detail: { searchTerm } });
    document.dispatchEvent(event);
    
    // Executar pesquisa específica da página
    performSearch(searchTerm);
  }, 300));
}

// Executar pesquisa específica da página
function performSearch(searchTerm) {
  const currentPage = appState.currentPage;
  
  if (currentPage === 'index.html' || currentPage === '') {
    searchTransactions(searchTerm);
  } else if (currentPage === 'despesas.html') {
    searchExpenses(searchTerm);
  } else if (currentPage === 'receitas.html') {
    searchIncomes(searchTerm);
  } else if (currentPage === 'cartoes.html') {
    searchCards(searchTerm);
  } else if (currentPage === 'metas.html') {
    searchGoals(searchTerm);
  }
}

// Configurar filtros
function setupFilters() {
  const filterBtn = document.getElementById('filter-btn');
  const filterBar = document.getElementById('filter-bar');
  
  if (!filterBtn || !filterBar) return;
  
  // Mostrar/esconder barra de filtros
  filterBtn.addEventListener('click', () => {
    filterBar.classList.toggle('active');
  });
  
  // Configurar chips de filtro
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Remover classe ativa de todos os chips
      filterChips.forEach(c => c.classList.remove('active'));
      
      // Adicionar classe ativa ao chip clicado
      chip.classList.add('active');
      
      // Obter filtro
      const filter = chip.getAttribute('data-filter');
      
      // Disparar evento de filtro
      const event = new CustomEvent('filter', { detail: { filter } });
      document.dispatchEvent(event);
      
      // Aplicar filtro específico da página
      applyFilter(filter);
    });
  });
}

// Aplicar filtro específico da página
function applyFilter(filter) {
  const currentPage = appState.currentPage;
  
  if (currentPage === 'index.html' || currentPage === '') {
    filterTransactions(filter);
  } else if (currentPage === 'despesas.html') {
    filterExpenses(filter);
  } else if (currentPage === 'receitas.html') {
    filterIncomes(filter);
  } else if (currentPage === 'cartoes.html') {
    filterCards(filter);
  } else if (currentPage === 'metas.html') {
    filterGoals(filter);
  }
}

// Configurar tabs
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Obter grupo de tabs
      const tabGroup = button.closest('.summary-tabs, .report-tabs, .tab-buttons');
      if (!tabGroup) return;
      
      // Remover classe ativa de todos os botões no grupo
      const buttons = tabGroup.querySelectorAll('.tab-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      
      // Adicionar classe ativa ao botão clicado
      button.classList.add('active');
      
      // Obter tab alvo
      const tabId = button.getAttribute('data-tab');
      if (!tabId) return;
      
      // Esconder todas as tabs
      const tabPanes = document.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Mostrar tab alvo
      const targetTab = document.getElementById(`${tabId}-tab`);
      if (targetTab) {
        targetTab.classList.add('active');
      }
      
      // Disparar evento de mudança de tab
      const event = new CustomEvent('tabChanged', { detail: { tabId } });
      document.dispatchEvent(event);
    });
  });
}

// ===== AUTENTICAÇÃO =====
// Verificar autenticação
function checkAuth() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth não está disponível');
    return;
  }
  
  // Verificar se o usuário está na página de login
  const isLoginPage = appState.currentPage === 'login.html';
  
  // Observar mudanças de estado de autenticação
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // Usuário autenticado
      appState.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      
      // Se estiver na página de login, redirecionar para a página inicial
      if (isLoginPage) {
        window.location.href = 'index.html';
      }
      
      // Carregar dados do usuário
      loadUserData();
    } else {
      // Usuário não autenticado
      appState.currentUser = null;
      
      // Se não estiver na página de login, redirecionar para a página de login
      if (!isLoginPage) {
        window.location.href = 'login.html';
      }
    }
  });
}

// Login com email e senha
function loginWithEmail(email, password) {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth não está disponível');
    return Promise.reject(new Error('Firebase Auth não está disponível'));
  }
  
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

// Login com Google
function loginWithGoogle() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth não está disponível');
    return Promise.reject(new Error('Firebase Auth não está disponível'));
  }
  
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider);
}

// Cadastro com email e senha
function signupWithEmail(email, password, displayName) {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth não está disponível');
    return Promise.reject(new Error('Firebase Auth não está disponível'));
  }
  
  return firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(result => {
      // Atualizar perfil do usuário
      return result.user.updateProfile({
        displayName: displayName
      });
    });
}

// Recuperar senha
function resetPassword(email) {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth não está disponível');
    return Promise.reject(new Error('Firebase Auth não está disponível'));
  }
  
  return firebase.auth().sendPasswordResetEmail(email);
}

// Logout
function logout() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.warn('Firebase Auth não está disponível');
    return Promise.reject(new Error('Firebase Auth não está disponível'));
  }
  
  return firebase.auth().signOut()
    .then(() => {
      // Redirecionar para a página de login
      window.location.href = 'login.html';
    });
}

// ===== BANCO DE DADOS =====
// Carregar dados do usuário
function loadUserData() {
  if (!appState.currentUser) return;
  
  // Carregar dados específicos da página
  const currentPage = appState.currentPage;
  
  if (currentPage === 'index.html' || currentPage === '') {
    loadDashboardData();
  } else if (currentPage === 'despesas.html') {
    loadExpensesData();
  } else if (currentPage === 'receitas.html') {
    loadIncomesData();
  } else if (currentPage === 'cartoes.html') {
    loadCardsData();
  } else if (currentPage === 'metas.html') {
    loadGoalsData();
  } else if (currentPage === 'relatorios.html') {
    loadReportsData();
  }
}

// Carregar dados do dashboard
function loadDashboardData() {
  if (!appState.currentUser) return;
  
  // Mostrar indicador de carregamento
  showLoading();
  
  // Referência ao banco de dados
  const db = firebase.database();
  const userId = appState.currentUser.uid;
  
  // Período atual
  const { month, year } = appState.currentPeriod;
  const startDate = new Date(year, month, 1).getTime();
  const endDate = new Date(year, month + 1, 0).getTime();
  
  // Carregar saldo
  db.ref(`users/${userId}/balance`).once('value')
    .then(snapshot => {
      const balance = snapshot.val() || 0;
      updateBalance(balance);
    })
    .catch(error => {
      console.error('Erro ao carregar saldo:', error);
      showError('Erro ao carregar saldo');
    });
  
  // Carregar receitas do período
  db.ref(`users/${userId}/incomes`)
    .orderByChild('date')
    .startAt(startDate)
    .endAt(endDate)
    .once('value')
    .then(snapshot => {
      const incomes = [];
      let totalIncome = 0;
      
      snapshot.forEach(childSnapshot => {
        const income = childSnapshot.val();
        income.id = childSnapshot.key;
        incomes.push(income);
        totalIncome += income.amount;
      });
      
      updateIncomesSummary(totalIncome);
      updateRecentIncomes(incomes);
    })
    .catch(error => {
      console.error('Erro ao carregar receitas:', error);
      showError('Erro ao carregar receitas');
    });
  
  // Carregar despesas do período
  db.ref(`users/${userId}/expenses`)
    .orderByChild('date')
    .startAt(startDate)
    .endAt(endDate)
    .once('value')
    .then(snapshot => {
      const expenses = [];
      let totalExpense = 0;
      
      snapshot.forEach(childSnapshot => {
        const expense = childSnapshot.val();
        expense.id = childSnapshot.key;
        expenses.push(expense);
        totalExpense += expense.amount;
      });
      
      updateExpensesSummary(totalExpense);
      updateRecentExpenses(expenses);
      
      // Atualizar gráfico de despesas por categoria
      updateExpensesByCategoryChart(expenses);
    })
    .catch(error => {
      console.error('Erro ao carregar despesas:', error);
      showError('Erro ao carregar despesas');
    });
  
  // Carregar transações recentes
  Promise.all([
    db.ref(`users/${userId}/expenses`)
      .orderByChild('date')
      .limitToLast(5)
      .once('value'),
    db.ref(`users/${userId}/incomes`)
      .orderByChild('date')
      .limitToLast(5)
      .once('value')
  ])
    .then(([expensesSnapshot, incomesSnapshot]) => {
      const transactions = [];
      
      expensesSnapshot.forEach(childSnapshot => {
        const expense = childSnapshot.val();
        expense.id = childSnapshot.key;
        expense.type = 'expense';
        transactions.push(expense);
      });
      
      incomesSnapshot.forEach(childSnapshot => {
        const income = childSnapshot.val();
        income.id = childSnapshot.key;
        income.type = 'income';
        transactions.push(income);
      });
      
      // Ordenar por data (mais recente primeiro)
      transactions.sort((a, b) => b.date - a.date);
      
      // Limitar a 5 transações
      const recentTransactions = transactions.slice(0, 5);
      
      updateRecentTransactions(recentTransactions);
    })
    .catch(error => {
      console.error('Erro ao carregar transações recentes:', error);
      showError('Erro ao carregar transações recentes');
    })
    .finally(() => {
      // Esconder indicador de carregamento
      hideLoading();
    });
}

// Atualizar saldo
function updateBalance(balance) {
  const balanceElement = document.getElementById('balance-amount');
  if (balanceElement) {
    balanceElement.textContent = formatCurrency(balance);
  }
}

// Atualizar resumo de receitas
function updateIncomesSummary(totalIncome) {
  const incomesElement = document.getElementById('income-amount');
  if (incomesElement) {
    incomesElement.textContent = formatCurrency(totalIncome);
  }
}

// Atualizar resumo de despesas
function updateExpensesSummary(totalExpense) {
  const expensesElement = document.getElementById('expense-amount');
  if (expensesElement) {
    expensesElement.textContent = formatCurrency(totalExpense);
  }
}

// Atualizar receitas recentes
function updateRecentIncomes(incomes) {
  const incomesContainer = document.getElementById('recent-incomes');
  if (!incomesContainer) return;
  
  // Limpar container
  incomesContainer.innerHTML = '';
  
  // Verificar se há receitas
  if (incomes.length === 0) {
    incomesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-wallet"></i>
        <p>Nenhuma receita no período</p>
      </div>
    `;
    return;
  }
  
  // Ordenar por data (mais recente primeiro)
  incomes.sort((a, b) => b.date - a.date);
  
  // Limitar a 3 receitas
  const recentIncomes = incomes.slice(0, 3);
  
  // Adicionar receitas ao container
  recentIncomes.forEach(income => {
    const incomeElement = document.createElement('div');
    incomeElement.className = 'income-item';
    incomeElement.innerHTML = `
      <div class="income-icon">
        <i class="fas ${income.icon || 'fa-wallet'}"></i>
      </div>
      <div class="income-details">
        <div class="income-title">${income.description}</div>
        <div class="income-category">${income.category}</div>
      </div>
      <div class="income-amount">${formatCurrency(income.amount)}</div>
    `;
    incomesContainer.appendChild(incomeElement);
  });
}

// Atualizar despesas recentes
function updateRecentExpenses(expenses) {
  const expensesContainer = document.getElementById('recent-expenses');
  if (!expensesContainer) return;
  
  // Limpar container
  expensesContainer.innerHTML = '';
  
  // Verificar se há despesas
  if (expenses.length === 0) {
    expensesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-shopping-cart"></i>
        <p>Nenhuma despesa no período</p>
      </div>
    `;
    return;
  }
  
  // Ordenar por data (mais recente primeiro)
  expenses.sort((a, b) => b.date - a.date);
  
  // Limitar a 3 despesas
  const recentExpenses = expenses.slice(0, 3);
  
  // Adicionar despesas ao container
  recentExpenses.forEach(expense => {
    const expenseElement = document.createElement('div');
    expenseElement.className = 'expense-item';
    expenseElement.innerHTML = `
      <div class="expense-icon">
        <i class="fas ${expense.icon || 'fa-shopping-cart'}"></i>
      </div>
      <div class="expense-details">
        <div class="expense-title">${expense.description}</div>
        <div class="expense-category">${expense.category}</div>
      </div>
      <div class="expense-amount">${formatCurrency(expense.amount)}</div>
    `;
    expensesContainer.appendChild(expenseElement);
  });
}

// Atualizar transações recentes
function updateRecentTransactions(transactions) {
  const transactionsContainer = document.getElementById('recent-transactions');
  if (!transactionsContainer) return;
  
  // Limpar container
  transactionsContainer.innerHTML = '';
  
  // Verificar se há transações
  if (transactions.length === 0) {
    transactionsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exchange-alt"></i>
        <p>Nenhuma transação recente</p>
      </div>
    `;
    return;
  }
  
  // Adicionar transações ao container
  transactions.forEach(transaction => {
    const transactionElement = document.createElement('div');
    transactionElement.className = 'transaction-item';
    
    const isExpense = transaction.type === 'expense';
    const icon = isExpense ? (transaction.icon || 'fa-shopping-cart') : (transaction.icon || 'fa-wallet');
    const amountClass = isExpense ? 'expense-amount' : 'income-amount';
    
    transactionElement.innerHTML = `
      <div class="transaction-icon ${isExpense ? 'expense-icon' : 'income-icon'}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="transaction-details">
        <div class="transaction-title">${transaction.description}</div>
        <div class="transaction-category">${transaction.category}</div>
      </div>
      <div class="${amountClass}">${formatCurrency(transaction.amount)}</div>
    `;
    transactionsContainer.appendChild(transactionElement);
  });
}

// Atualizar gráfico de despesas por categoria
function updateExpensesByCategoryChart(expenses) {
  const chartContainer = document.getElementById('expenses-by-category-chart');
  if (!chartContainer) return;
  
  // Agrupar despesas por categoria
  const categoriesMap = {};
  expenses.forEach(expense => {
    const category = expense.category;
    if (!categoriesMap[category]) {
      categoriesMap[category] = 0;
    }
    categoriesMap[category] += expense.amount;
  });
  
  // Converter para arrays para o gráfico
  const categories = Object.keys(categoriesMap);
  const values = Object.values(categoriesMap);
  
  // Cores para as categorias
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7FC97F', '#BEAED4', '#FDC086'
  ];
  
  // Configuração do gráfico
  const options = {
    series: values,
    chart: {
      type: 'donut',
      height: 250
    },
    labels: categories,
    colors: colors,
    legend: {
      position: 'bottom',
      fontSize: '12px'
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%'
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  
  // Criar gráfico
  if (typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
  }
}

// ===== INICIALIZAÇÃO DA PÁGINA ATUAL =====
// Inicializar página atual
function initCurrentPage() {
  const currentPage = appState.currentPage;
  
  if (currentPage === 'login.html') {
    initLoginPage();
  } else if (currentPage === 'index.html' || currentPage === '') {
    initDashboardPage();
  } else if (currentPage === 'despesas.html') {
    initExpensesPage();
  } else if (currentPage === 'receitas.html') {
    initIncomesPage();
  } else if (currentPage === 'cartoes.html') {
    initCardsPage();
  } else if (currentPage === 'metas.html') {
    initGoalsPage();
  } else if (currentPage === 'relatorios.html') {
    initReportsPage();
  }
}

// Inicializar página de login
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;
  
  // Configurar formulário de login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validar campos
    if (!email || !password) {
      showError('Preencha todos os campos');
      return;
    }
    
    // Mostrar indicador de carregamento
    showLoading();
    
    // Fazer login
    loginWithEmail(email, password)
      .then(() => {
        // Login bem-sucedido, redirecionamento será feito pelo observador de autenticação
      })
      .catch(error => {
        console.error('Erro ao fazer login:', error);
        
        // Tratar erros específicos
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          showError('Email ou senha incorretos');
        } else if (error.code === 'auth/invalid-email') {
          showError('Email inválido');
        } else {
          showError('Erro ao fazer login');
        }
      })
      .finally(() => {
        // Esconder indicador de carregamento
        hideLoading();
      });
  });
  
  // Configurar botão de login com Google
  const googleBtn = document.getElementById('google-login');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      // Mostrar indicador de carregamento
      showLoading();
      
      // Fazer login com Google
      loginWithGoogle()
        .then(() => {
          // Login bem-sucedido, redirecionamento será feito pelo observador de autenticação
        })
        .catch(error => {
          console.error('Erro ao fazer login com Google:', error);
          showError('Erro ao fazer login com Google');
        })
        .finally(() => {
          // Esconder indicador de carregamento
          hideLoading();
        });
    });
  }
  
  // Configurar link de cadastro
  const signupLink = document.getElementById('signup-link');
  if (signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('signup-modal');
    });
  }
  
  // Configurar link de recuperação de senha
  const forgotPasswordLink = document.getElementById('forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showModal('reset-password-modal');
    });
  }
  
  // Configurar formulário de cadastro
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      
      // Validar campos
      if (!name || !email || !password || !confirmPassword) {
        showError('Preencha todos os campos');
        return;
      }
      
      // Validar senhas
      if (password !== confirmPassword) {
        showError('As senhas não coincidem');
        return;
      }
      
      // Mostrar indicador de carregamento
      showLoading();
      
      // Fazer cadastro
      signupWithEmail(email, password, name)
        .then(() => {
          // Cadastro bem-sucedido
          hideModal(document.getElementById('signup-modal'));
          showSuccess('Cadastro realizado com sucesso');
        })
        .catch(error => {
          console.error('Erro ao fazer cadastro:', error);
          
          // Tratar erros específicos
          if (error.code === 'auth/email-already-in-use') {
            showError('Este email já está em uso');
          } else if (error.code === 'auth/invalid-email') {
            showError('Email inválido');
          } else if (error.code === 'auth/weak-password') {
            showError('Senha muito fraca');
          } else {
            showError('Erro ao fazer cadastro');
          }
        })
        .finally(() => {
          // Esconder indicador de carregamento
          hideLoading();
        });
    });
  }
  
  // Configurar formulário de recuperação de senha
  const resetPasswordForm = document.getElementById('reset-password-form');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('reset-email').value;
      
      // Validar campos
      if (!email) {
        showError('Preencha o campo de email');
        return;
      }
      
      // Mostrar indicador de carregamento
      showLoading();
      
      // Enviar email de recuperação de senha
      resetPassword(email)
        .then(() => {
          // Email enviado com sucesso
          hideModal(document.getElementById('reset-password-modal'));
          showSuccess('Email de recuperação enviado com sucesso');
        })
        .catch(error => {
          console.error('Erro ao enviar email de recuperação:', error);
          
          // Tratar erros específicos
          if (error.code === 'auth/user-not-found') {
            showError('Email não encontrado');
          } else if (error.code === 'auth/invalid-email') {
            showError('Email inválido');
          } else {
            showError('Erro ao enviar email de recuperação');
          }
        })
        .finally(() => {
          // Esconder indicador de carregamento
          hideLoading();
        });
    });
  }
}

// Inicializar página de dashboard
function initDashboardPage() {
  // Configurar seletor de período
  setupPeriodSelector();
  
  // Configurar carrossel de cartões
  setupCardsCarousel();
}

// ===== UTILITÁRIOS DE UI =====
// Mostrar indicador de carregamento
function showLoading() {
  // Atualizar estado
  stateManager.updateState('isLoading', true);
  
  // Mostrar indicador de carregamento
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.add('active');
  }
}

// Esconder indicador de carregamento
function hideLoading() {
  // Atualizar estado
  stateManager.updateState('isLoading', false);
  
  // Esconder indicador de carregamento
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.classList.remove('active');
  }
}

// Mostrar mensagem de erro
function showError(message) {
  if (typeof Toastify !== 'undefined') {
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: 'top',
      position: 'center',
      backgroundColor: 'var(--error)',
      stopOnFocus: true
    }).showToast();
  } else {
    alert(message);
  }
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
  if (typeof Toastify !== 'undefined') {
    Toastify({
      text: message,
      duration: 3000,
      close: true,
      gravity: 'top',
      position: 'center',
      backgroundColor: 'var(--success)',
      stopOnFocus: true
    }).showToast();
  } else {
    alert(message);
  }
}

// Debounce para evitar múltiplas chamadas
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// ===== INICIALIZAÇÃO =====
// Evento de carregamento da página
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar UI
  initUI();
  
  // Verificar tema escuro
  checkDarkMode();
});

// Verificar tema escuro
function checkDarkMode() {
  // Verificar preferência do sistema
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Verificar preferência do usuário (armazenada localmente)
  const userPreference = localStorage.getItem('darkMode');
  
  // Determinar se deve usar tema escuro
  let useDarkMode = prefersDarkMode;
  
  if (userPreference === 'dark') {
    useDarkMode = true;
  } else if (userPreference === 'light') {
    useDarkMode = false;
  }
  
  // Aplicar tema
  if (useDarkMode) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
  
  // Atualizar estado
  stateManager.updateState('darkMode', useDarkMode);
}

// Alternar tema escuro
function toggleDarkMode() {
  const isDarkMode = document.documentElement.classList.contains('dark-mode');
  
  if (isDarkMode) {
    document.documentElement.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'light');
    stateManager.updateState('darkMode', false);
  } else {
    document.documentElement.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'dark');
    stateManager.updateState('darkMode', true);
  }
}

// Configurar seletor de período
function setupPeriodSelector() {
  const prevPeriodBtn = document.getElementById('prev-period');
  const nextPeriodBtn = document.getElementById('next-period');
  const currentPeriodDisplay = document.getElementById('current-period-display');
  
  if (!prevPeriodBtn || !nextPeriodBtn || !currentPeriodDisplay) return;
  
  // Atualizar exibição do período
  function updatePeriodDisplay() {
    const { month, year } = appState.currentPeriod;
    const date = new Date(year, month, 1);
    currentPeriodDisplay.textContent = date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }
  
  // Inicializar exibição
  updatePeriodDisplay();
  
  // Configurar botões
  prevPeriodBtn.addEventListener('click', () => {
    const { month, year } = appState.currentPeriod;
    
    // Calcular período anterior
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    // Atualizar estado
    appState.currentPeriod = { month: newMonth, year: newYear };
    
    // Atualizar exibição
    updatePeriodDisplay();
    
    // Recarregar dados
    loadUserData();
  });
  
  nextPeriodBtn.addEventListener('click', () => {
    const { month, year } = appState.currentPeriod;
    
    // Calcular próximo período
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    // Atualizar estado
    appState.currentPeriod = { month: newMonth, year: newYear };
    
    // Atualizar exibição
    updatePeriodDisplay();
    
    // Recarregar dados
    loadUserData();
  });
  
  // Configurar clique no período atual para abrir modal de seleção
  currentPeriodDisplay.addEventListener('click', () => {
    showModal('period-modal');
  });
}

// Configurar carrossel de cartões
function setupCardsCarousel() {
  const carouselWrapper = document.getElementById('cards-wrapper');
  if (!carouselWrapper) return;
  
  // Variáveis do carrossel
  let currentIndex = 0;
  let startX = 0;
  let isDragging = false;
  let transitionInProgress = false;
  
  // Configurar indicadores
  function updateIndicators() {
    const indicators = document.getElementById('carousel-indicators');
    if (!indicators) return;
    
    // Limpar indicadores
    indicators.innerHTML = '';
    
    // Obter número de cartões
    const cards = carouselWrapper.querySelectorAll('.credit-card, .add-card-btn');
    
    // Criar indicadores
    for (let i = 0; i < cards.length; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'carousel-indicator';
      
      if (i === currentIndex) {
        indicator.classList.add('active');
      }
      
      indicator.addEventListener('click', () => {
        goToSlide(i);
      });
      
      indicators.appendChild(indicator);
    }
  }
  
  // Ir para um slide específico
  function goToSlide(index) {
    if (transitionInProgress) return;
    
    // Obter número de cartões
    const cards = carouselWrapper.querySelectorAll('.credit-card, .add-card-btn');
    
    // Validar índice
    if (index < 0) {
      index = 0;
    } else if (index >= cards.length) {
      index = cards.length - 1;
    }
    
    // Atualizar índice atual
    currentIndex = index;
    
    // Calcular deslocamento
    const cardWidth = cards[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(carouselWrapper).gap) || 16;
    const offset = -(currentIndex * (cardWidth + gap));
    
    // Aplicar transição
    transitionInProgress = true;
    carouselWrapper.style.transition = 'transform 0.3s ease';
    carouselWrapper.style.transform = `translateX(${offset}px)`;
    
    // Atualizar indicadores
    updateIndicators();
    
    // Resetar flag de transição após a animação
    setTimeout(() => {
      transitionInProgress = false;
    }, 300);
  }
  
  // Eventos de toque/mouse
  carouselWrapper.addEventListener('mousedown', (e) => {
    startDrag(e.clientX);
    e.preventDefault();
  });
  
  carouselWrapper.addEventListener('touchstart', (e) => {
    startDrag(e.touches[0].clientX);
  });
  
  carouselWrapper.addEventListener('mousemove', (e) => {
    if (isDragging) {
      drag(e.clientX);
      e.preventDefault();
    }
  });
  
  carouselWrapper.addEventListener('touchmove', (e) => {
    if (isDragging) {
      drag(e.touches[0].clientX);
    }
  });
  
  carouselWrapper.addEventListener('mouseup', () => {
    endDrag();
  });
  
  carouselWrapper.addEventListener('touchend', () => {
    endDrag();
  });
  
  carouselWrapper.addEventListener('mouseleave', () => {
    if (isDragging) {
      endDrag();
    }
  });
  
  // Iniciar arrasto
  function startDrag(clientX) {
    if (transitionInProgress) return;
    
    isDragging = true;
    startX = clientX;
    
    // Remover transição para arrastar suavemente
    carouselWrapper.style.transition = 'none';
  }
  
  // Arrastar
  function drag(clientX) {
    if (!isDragging) return;
    
    // Calcular deslocamento
    const cards = carouselWrapper.querySelectorAll('.credit-card, .add-card-btn');
    const cardWidth = cards[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(carouselWrapper).gap) || 16;
    const baseOffset = -(currentIndex * (cardWidth + gap));
    const dragOffset = clientX - startX;
    
    // Aplicar deslocamento com resistência nas extremidades
    let offset = baseOffset + dragOffset;
    
    // Adicionar resistência nas extremidades
    if (currentIndex === 0 && dragOffset > 0) {
      offset = baseOffset + (dragOffset * 0.3);
    } else if (currentIndex === cards.length - 1 && dragOffset < 0) {
      offset = baseOffset + (dragOffset * 0.3);
    }
    
    carouselWrapper.style.transform = `translateX(${offset}px)`;
  }
  
  // Finalizar arrasto
  function endDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Obter deslocamento atual
    const style = window.getComputedStyle(carouselWrapper);
    const matrix = new WebKitCSSMatrix(style.transform);
    const currentOffset = matrix.m41;
    
    // Calcular slide mais próximo
    const cards = carouselWrapper.querySelectorAll('.credit-card, .add-card-btn');
    const cardWidth = cards[0].offsetWidth;
    const gap = parseInt(window.getComputedStyle(carouselWrapper).gap) || 16;
    
    // Calcular índice baseado no deslocamento
    let newIndex = Math.round(-currentOffset / (cardWidth + gap));
    
    // Validar índice
    if (newIndex < 0) {
      newIndex = 0;
    } else if (newIndex >= cards.length) {
      newIndex = cards.length - 1;
    }
    
    // Ir para o slide
    goToSlide(newIndex);
  }
  
  // Inicializar indicadores
  updateIndicators();
  
  // Configurar botão de adicionar cartão
  const addCardBtn = carouselWrapper.querySelector('.add-card-btn');
  if (addCardBtn) {
    addCardBtn.addEventListener('click', () => {
      showModal('add-card-modal');
    });
  }
}

// Exportar funções para uso global
window.showModal = showModal;
window.hideModal = hideModal;
window.toggleDarkMode = toggleDarkMode;
