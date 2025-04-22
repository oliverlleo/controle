/**
 * Sistema de Gerenciamento de Contas Pessoais - Mobile
 * JavaScript completamente redesenhado para experiência em dispositivos móveis
 */

// Configuração inicial e variáveis globais
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  checkAuthentication();
  
  // Inicializar componentes da interface
  initializeUI();
  
  // Carregar dados iniciais
  loadInitialData();
  
  // Esconder tela de carregamento após inicialização
  setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }
  }, 1000);
});

// Verificação de autenticação
function checkAuthentication() {
  // Verificar se o usuário está autenticado
  const isAuthenticated = localStorage.getItem('userAuthenticated') === 'true';
  
  // Se não estiver autenticado, redirecionar para a página de login
  if (!isAuthenticated && !window.location.href.includes('mobile-login.html')) {
    window.location.href = 'mobile-login.html';
    return;
  }
  
  // Carregar dados do usuário se estiver autenticado
  if (isAuthenticated) {
    loadUserData();
  }
}

// Carregar dados do usuário
function loadUserData() {
  // Simulação de dados do usuário (em produção, viria do backend)
  const userData = {
    name: 'João da Silva',
    email: 'joao.silva@email.com',
    avatar: 'JD'
  };
  
  // Atualizar elementos da interface com dados do usuário
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar) {
    profileAvatar.innerHTML = `<span>${userData.avatar}</span>`;
  }
}

// Inicialização da interface do usuário
function initializeUI() {
  // Inicializar navegação
  initNavigation();
  
  // Inicializar modais
  initModals();
  
  // Inicializar gráficos
  initCharts();
  
  // Inicializar formulários
  initForms();
  
  // Inicializar eventos de toque
  initTouchEvents();
  
  // Inicializar abas
  initTabs();
}

// Inicialização da navegação
function initNavigation() {
  // Navegação inferior
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(button => {
    if (!button.classList.contains('add-btn')) {
      button.addEventListener('click', function() {
        const sectionId = this.getAttribute('data-section');
        if (sectionId) {
          showSection(sectionId);
          
          // Atualizar botões ativos
          navButtons.forEach(btn => {
            if (!btn.classList.contains('add-btn')) {
              btn.classList.remove('active');
            }
          });
          this.classList.add('active');
          
          // Atualizar título da página
          updatePageTitle(sectionId);
        }
      });
    }
  });
  
  // Botão de adicionar transação
  const addTransactionBtn = document.getElementById('addTransactionNavBtn');
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', function() {
      openModal('newTransactionModal');
    });
  }
  
  // Botão de menu "Mais"
  const moreNavBtn = document.getElementById('moreNavBtn');
  const moreMenu = document.getElementById('moreMenu');
  if (moreNavBtn && moreMenu) {
    moreNavBtn.addEventListener('click', function() {
      moreMenu.classList.add('active');
    });
    
    // Fechar menu "Mais"
    const closeMoreMenuBtn = document.getElementById('closeMoreMenuBtn');
    if (closeMoreMenuBtn) {
      closeMoreMenuBtn.addEventListener('click', function() {
        moreMenu.classList.remove('active');
      });
    }
    
    // Overlay do menu "Mais"
    moreMenu.addEventListener('click', function(e) {
      if (e.target === moreMenu) {
        moreMenu.classList.remove('active');
      }
    });
    
    // Itens do menu "Mais"
    const moreMenuItems = document.querySelectorAll('.more-menu-item');
    moreMenuItems.forEach(item => {
      item.addEventListener('click', function() {
        const sectionId = this.getAttribute('data-section');
        if (sectionId) {
          showSection(sectionId);
          moreMenu.classList.remove('active');
          
          // Atualizar título da página
          updatePageTitle(sectionId);
          
          // Desativar todos os botões de navegação
          navButtons.forEach(btn => {
            btn.classList.remove('active');
          });
        }
      });
    });
  }
  
  // Botões de notificações e perfil
  const notificationsBtn = document.getElementById('notificationsBtn');
  if (notificationsBtn) {
    notificationsBtn.addEventListener('click', function() {
      openModal('notificationsModal');
    });
  }
  
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', function() {
      openModal('profileModal');
    });
  }
}

// Mostrar seção específica
function showSection(sectionId) {
  const sections = document.querySelectorAll('.app-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    
    // Rolar para o topo da seção
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      appContent.scrollTop = 0;
    }
  }
}

// Atualizar título da página
function updatePageTitle(sectionId) {
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    switch (sectionId) {
      case 'dashboardSection':
        pageTitle.textContent = 'Dashboard';
        break;
      case 'transactionsSection':
        pageTitle.textContent = 'Transações';
        break;
      case 'reportsSection':
        pageTitle.textContent = 'Relatórios';
        break;
      case 'intelligenceSection':
        pageTitle.textContent = 'Inteligência Financeira';
        break;
      case 'goalsSection':
        pageTitle.textContent = 'Metas';
        break;
      case 'settingsSection':
        pageTitle.textContent = 'Configurações';
        break;
      default:
        pageTitle.textContent = 'Dashboard';
    }
  }
}

// Inicialização de modais
function initModals() {
  // Fechar modais
  const closeButtons = document.querySelectorAll('[id$="ModalBtn"]');
  closeButtons.forEach(button => {
    if (button.id.startsWith('close')) {
      button.addEventListener('click', function() {
        const modalId = button.id.replace('close', '').replace('ModalBtn', '');
        closeModal(`${modalId.charAt(0).toLowerCase() + modalId.slice(1)}Modal`);
      });
    }
  });
  
  // Fechar modal ao clicar no overlay
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', function() {
        closeModal(modal.id);
      });
    }
  });
  
  // Inicializar modal de transação
  initTransactionModal();
  
  // Inicializar modal de perfil
  initProfileModal();
}

// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    
    // Animar entrada do modal
    const container = modal.querySelector('.modal-container');
    if (container) {
      setTimeout(() => {
        container.style.transform = 'translateY(0)';
      }, 10);
    }
  }
}

// Fechar modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    const container = modal.querySelector('.modal-container');
    if (container) {
      container.style.transform = 'translateY(100%)';
      
      setTimeout(() => {
        modal.classList.remove('active');
      }, 300);
    } else {
      modal.classList.remove('active');
    }
  }
}

// Inicializar modal de transação
function initTransactionModal() {
  // Alternar entre despesa e receita
  const expenseTypeBtn = document.getElementById('expenseTypeBtn');
  const incomeTypeBtn = document.getElementById('incomeTypeBtn');
  
  if (expenseTypeBtn && incomeTypeBtn) {
    expenseTypeBtn.addEventListener('click', function() {
      expenseTypeBtn.classList.add('active');
      incomeTypeBtn.classList.remove('active');
    });
    
    incomeTypeBtn.addEventListener('click', function() {
      incomeTypeBtn.classList.add('active');
      expenseTypeBtn.classList.remove('active');
    });
  }
  
  // Formulário de transação
  const transactionForm = document.getElementById('transactionForm');
  if (transactionForm) {
    transactionForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Obter tipo de transação
      const isExpense = document.getElementById('expenseTypeBtn').classList.contains('active');
      
      // Obter valores do formulário
      const description = document.getElementById('transactionDescription').value;
      const amount = document.getElementById('transactionAmount').value;
      const date = document.getElementById('transactionDate').value;
      const category = document.getElementById('transactionCategory').value;
      const status = document.getElementById('transactionStatus').value;
      const notes = document.getElementById('transactionNotes').value;
      
      // Validar dados
      if (!description || !amount || !date || !category) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
      }
      
      // Criar objeto de transação
      const transaction = {
        id: generateUniqueId(),
        type: isExpense ? 'expense' : 'income',
        description,
        amount: parseFloat(amount),
        date,
        category,
        status,
        notes
      };
      
      // Salvar transação (em produção, enviaria para o backend)
      saveTransaction(transaction);
      
      // Fechar modal e mostrar notificação
      closeModal('newTransactionModal');
      showNotification('Transação salva com sucesso', 'success');
      
      // Limpar formulário
      transactionForm.reset();
      
      // Recarregar dados
      loadTransactions();
    });
  }
  
  // Definir data atual como padrão
  const transactionDate = document.getElementById('transactionDate');
  if (transactionDate) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    transactionDate.value = `${year}-${month}-${day}`;
  }
}

// Inicializar modal de perfil
function initProfileModal() {
  // Botão de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Limpar dados de autenticação
      localStorage.removeItem('userAuthenticated');
      
      // Redirecionar para a página de login
      window.location.href = 'mobile-login.html';
    });
  }
  
  // Botão de configurações
  const viewSettingsBtn = document.getElementById('viewSettingsBtn');
  if (viewSettingsBtn) {
    viewSettingsBtn.addEventListener('click', function() {
      closeModal('profileModal');
      showSection('settingsSection');
      updatePageTitle('settingsSection');
      
      // Desativar todos os botões de navegação
      const navButtons = document.querySelectorAll('.nav-btn');
      navButtons.forEach(btn => {
        btn.classList.remove('active');
      });
    });
  }
}

// Inicialização de gráficos
function initCharts() {
  // Gráfico de despesas
  initExpensesChart();
  
  // Gráfico de resumo
  initSummaryChart();
  
  // Gráfico de categorias
  initCategoriesChart();
  
  // Gráfico de tendências
  initTrendsChart();
  
  // Gráfico de previsão
  initForecastChart();
}

// Inicializar gráfico de despesas
function initExpensesChart() {
  const expensesChart = document.getElementById('expensesChart');
  if (expensesChart) {
    const options = {
      series: [44, 25, 13, 10, 8],
      chart: {
        type: 'donut',
        height: 200,
        fontFamily: 'Roboto, sans-serif',
        toolbar: {
          show: false
        }
      },
      colors: ['#4361ee', '#3a0ca3', '#f72585', '#4cc9f0', '#f8961e'],
      labels: ['Moradia', 'Alimentação', 'Transporte', 'Serviços', 'Lazer'],
      legend: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 180
          }
        }
      }],
      tooltip: {
        y: {
          formatter: function(value) {
            return `R$ ${value.toFixed(2)}`;
          }
        }
      }
    };
    
    const chart = new ApexCharts(expensesChart, options);
    chart.render();
  }
}

// Inicializar gráfico de resumo
function initSummaryChart() {
  const summaryChart = document.getElementById('summaryChart');
  if (summaryChart) {
    const options = {
      series: [{
        name: 'Receitas',
        data: [8500, 8500, 8500, 8500]
      }, {
        name: 'Despesas',
        data: [4320, 4440, 4500, 4600]
      }],
      chart: {
        type: 'bar',
        height: 200,
        fontFamily: 'Roboto, sans-serif',
        toolbar: {
          show: false
        },
        stacked: false
      },
      colors: ['#38b000', '#e63946'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Jan', 'Fev', 'Mar', 'Abr'],
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            return `R$ ${(value / 1000).toFixed(1)}k`;
          },
          style: {
            fontSize: '10px'
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function(value) {
            return `R$ ${value.toFixed(2)}`;
          }
        }
      },
      legend: {
        show: false
      }
    };
    
    const chart = new ApexCharts(summaryChart, options);
    chart.render();
  }
}

// Inicializar gráfico de categorias
function initCategoriesChart() {
  const categoriesChart = document.getElementById('categoriesChart');
  if (categoriesChart) {
    const options = {
      series: [35, 20, 15, 10, 8, 7, 5],
      chart: {
        type: 'pie',
        height: 200,
        fontFamily: 'Roboto, sans-serif',
        toolbar: {
          show: false
        }
      },
      colors: ['#4361ee', '#3a0ca3', '#f72585', '#4cc9f0', '#f8961e', '#7209b7', '#38b000'],
      labels: ['Moradia', 'Alimentação', 'Transporte', 'Serviços', 'Lazer', 'Saúde', 'Outros'],
      legend: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 180
          }
        }
      }],
      tooltip: {
        y: {
          formatter: function(value) {
            return `${value}%`;
          }
        }
      }
    };
    
    const chart = new ApexCharts(categoriesChart, options);
    chart.render();
  }
}

// Inicializar gráfico de tendências
function initTrendsChart() {
  const trendsChart = document.getElementById('trendsChart');
  if (trendsChart) {
    const options = {
      series: [{
        name: 'Despesas',
        data: [4100, 4200, 4150, 4320, 4440]
      }],
      chart: {
        type: 'line',
        height: 200,
        fontFamily: 'Roboto, sans-serif',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      colors: ['#f72585'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      grid: {
        borderColor: '#e0e0e0',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5
        }
      },
      markers: {
        size: 4
      },
      xaxis: {
        categories: ['Dez', 'Jan', 'Fev', 'Mar', 'Abr'],
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            return `R$ ${(value / 1000).toFixed(1)}k`;
          },
          style: {
            fontSize: '10px'
          }
        }
      }
    };
    
    const chart = new ApexCharts(trendsChart, options);
    chart.render();
  }
}

// Inicializar gráfico de previsão
function initForecastChart() {
  const forecastChart = document.getElementById('forecastChart');
  if (forecastChart) {
    const options = {
      series: [{
        name: 'Receitas',
        data: [8500, 8500, 8500]
      }, {
        name: 'Despesas',
        data: [4440, 4500, 4600]
      }, {
        name: 'Saldo',
        data: [4060, 4000, 3900]
      }],
      chart: {
        type: 'line',
        height: 200,
        fontFamily: 'Roboto, sans-serif',
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      colors: ['#4361ee', '#f72585', '#4cc9f0'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: [3, 3, 3]
      },
      grid: {
        borderColor: '#e0e0e0',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5
        }
      },
      markers: {
        size: 4
      },
      xaxis: {
        categories: ['Abr', 'Mai', 'Jun'],
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            return `R$ ${(value / 1000).toFixed(1)}k`;
          },
          style: {
            fontSize: '10px'
          }
        }
      }
    };
    
    const chart = new ApexCharts(forecastChart, options);
    chart.render();
  }
}

// Inicialização de formulários
function initForms() {
  // Inicializar seletores de período
  initPeriodSelectors();
}

// Inicializar seletores de período
function initPeriodSelectors() {
  // Seletor de período no card de saldo
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const currentPeriod = document.getElementById('currentPeriod');
  
  if (prevMonthBtn && nextMonthBtn && currentPeriod) {
    // Data atual
    let currentDate = new Date();
    updatePeriodDisplay();
    
    prevMonthBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() - 1);
      updatePeriodDisplay();
      loadPeriodData();
    });
    
    nextMonthBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() + 1);
      updatePeriodDisplay();
      loadPeriodData();
    });
    
    function updatePeriodDisplay() {
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const month = months[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      currentPeriod.textContent = `${month} ${year}`;
    }
    
    function loadPeriodData() {
      // Em produção, carregaria dados do período selecionado
      console.log('Carregando dados para:', currentPeriod.textContent);
      
      // Simulação de atualização de dados
      setTimeout(() => {
        showNotification('Dados atualizados', 'info');
      }, 500);
    }
  }
  
  // Seletor de período na aba de resumo
  const prevPeriodBtn = document.getElementById('prevPeriodBtn');
  const nextPeriodBtn = document.getElementById('nextPeriodBtn');
  const periodLabel = document.getElementById('periodLabel');
  
  if (prevPeriodBtn && nextPeriodBtn && periodLabel) {
    // Data atual
    let currentDate = new Date();
    updatePeriodLabel();
    
    prevPeriodBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() - 1);
      updatePeriodLabel();
      loadPeriodReportData();
    });
    
    nextPeriodBtn.addEventListener('click', function() {
      currentDate.setMonth(currentDate.getMonth() + 1);
      updatePeriodLabel();
      loadPeriodReportData();
    });
    
    function updatePeriodLabel() {
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const month = months[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      periodLabel.textContent = `${month} ${year}`;
    }
    
    function loadPeriodReportData() {
      // Em produção, carregaria dados do período selecionado
      console.log('Carregando relatório para:', periodLabel.textContent);
      
      // Simulação de atualização de dados
      setTimeout(() => {
        showNotification('Relatório atualizado', 'info');
      }, 500);
    }
  }
}

// Inicialização de eventos de toque
function initTouchEvents() {
  // Implementar gestos de deslize para navegação entre abas
  const appContent = document.querySelector('.app-content');
  if (appContent) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    appContent.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    appContent.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, false);
    
    function handleSwipe() {
      const minSwipeDistance = 50;
      const swipeDistance = touchEndX - touchStartX;
      
      // Ignorar swipes pequenos
      if (Math.abs(swipeDistance) < minSwipeDistance) {
        return;
      }
      
      // Verificar se estamos em uma seção que suporta navegação por swipe
      const activeSection = document.querySelector('.app-section.active');
      if (!activeSection) return;
      
      // Verificar se estamos em uma aba que suporta navegação por swipe
      const activeTab = activeSection.querySelector('.tab-pane.active');
      if (activeTab) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const activeBtnIndex = Array.from(tabButtons).findIndex(btn => btn.classList.contains('active'));
        
        if (swipeDistance > 0 && activeBtnIndex > 0) {
          // Swipe para a direita (aba anterior)
          tabButtons[activeBtnIndex - 1].click();
        } else if (swipeDistance < 0 && activeBtnIndex < tabButtons.length - 1) {
          // Swipe para a esquerda (próxima aba)
          tabButtons[activeBtnIndex + 1].click();
        }
      }
    }
  }
  
  // Implementar pull-to-refresh
  // Nota: Esta é uma implementação básica, em produção usaria uma biblioteca específica
  let pullStartY = 0;
  let pullMoveY = 0;
  let isPulling = false;
  const pullThreshold = 80;
  
  appContent.addEventListener('touchstart', function(e) {
    // Verificar se estamos no topo da página
    if (appContent.scrollTop === 0) {
      pullStartY = e.touches[0].clientY;
      isPulling = true;
    }
  });
  
  appContent.addEventListener('touchmove', function(e) {
    if (!isPulling) return;
    
    pullMoveY = e.touches[0].clientY;
    const pullDistance = pullMoveY - pullStartY;
    
    // Se estiver puxando para baixo
    if (pullDistance > 0 && pullDistance < pullThreshold) {
      // Aqui poderia mostrar um indicador visual de pull-to-refresh
    }
  });
  
  appContent.addEventListener('touchend', function() {
    if (!isPulling) return;
    
    const pullDistance = pullMoveY - pullStartY;
    
    if (pullDistance > pullThreshold) {
      // Atualizar dados
      refreshData();
    }
    
    isPulling = false;
  });
  
  function refreshData() {
    showNotification('Atualizando dados...', 'info');
    
    // Simulação de atualização de dados
    setTimeout(() => {
      loadInitialData();
      showNotification('Dados atualizados com sucesso', 'success');
    }, 1000);
  }
}

// Inicialização de abas
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Desativar todas as abas
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Desativar todos os painéis de abas
      const tabPanes = document.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
      });
      
      // Ativar aba selecionada
      this.classList.add('active');
      
      // Ativar painel de aba selecionado
      const selectedPane = document.getElementById(tabId);
      if (selectedPane) {
        selectedPane.classList.add('active');
      }
    });
  });
}

// Carregar dados iniciais
function loadInitialData() {
  // Carregar transações
  loadTransactions();
  
  // Carregar saldo
  loadBalance();
  
  // Carregar metas
  loadGoals();
  
  // Carregar notificações
  loadNotifications();
}

// Carregar transações
function loadTransactions() {
  // Em produção, carregaria do backend
  // Simulação de dados
  const transactions = [
    {
      id: '1',
      type: 'expense',
      description: 'Aluguel',
      amount: 1500,
      date: '2025-04-05',
      category: 'moradia',
      status: 'pago'
    },
    {
      id: '2',
      type: 'expense',
      description: 'Supermercado',
      amount: 800,
      date: '2025-04-10',
      category: 'alimentacao',
      status: 'pago'
    },
    {
      id: '3',
      type: 'expense',
      description: 'Internet',
      amount: 120,
      date: '2025-04-15',
      category: 'servicos',
      status: 'pago'
    },
    {
      id: '4',
      type: 'income',
      description: 'Salário',
      amount: 8500,
      date: '2025-04-01',
      category: 'salario',
      status: 'recebido'
    }
  ];
  
  // Atualizar lista de transações recentes
  updateRecentTransactions(transactions);
}

// Atualizar lista de transações recentes
function updateRecentTransactions(transactions) {
  const recentTransactionsList = document.getElementById('recentTransactionsList');
  if (!recentTransactionsList) return;
  
  // Ordenar transações por data (mais recentes primeiro)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Limitar a 4 transações mais recentes
  const recentTransactions = transactions.slice(0, 4);
  
  // Limpar lista atual
  // recentTransactionsList.innerHTML = '';
  
  // Adicionar transações à lista
  // recentTransactions.forEach(transaction => {
  //   const transactionItem = createTransactionElement(transaction);
  //   recentTransactionsList.appendChild(transactionItem);
  // });
}

// Criar elemento de transação
function createTransactionElement(transaction) {
  const transactionItem = document.createElement('div');
  transactionItem.className = 'transaction-item';
  
  // Definir ícone com base na categoria
  let icon = 'fa-question';
  switch (transaction.category) {
    case 'moradia':
      icon = 'fa-home';
      break;
    case 'alimentacao':
      icon = 'fa-shopping-cart';
      break;
    case 'transporte':
      icon = 'fa-car';
      break;
    case 'servicos':
      icon = 'fa-wifi';
      break;
    case 'lazer':
      icon = 'fa-film';
      break;
    case 'saude':
      icon = 'fa-heartbeat';
      break;
    case 'educacao':
      icon = 'fa-graduation-cap';
      break;
    case 'salario':
      icon = 'fa-briefcase';
      break;
  }
  
  // Formatar data
  const date = new Date(transaction.date);
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  
  // Formatar valor
  const formattedAmount = `R$ ${transaction.amount.toFixed(2)}`;
  
  transactionItem.innerHTML = `
    <div class="transaction-icon ${transaction.type}">
      <i class="fas ${icon}"></i>
    </div>
    <div class="transaction-details">
      <div class="transaction-title">${transaction.description}</div>
      <div class="transaction-date">${formattedDate}</div>
    </div>
    <div class="transaction-amount ${transaction.type}">
      ${formattedAmount}
    </div>
  `;
  
  return transactionItem;
}

// Carregar saldo
function loadBalance() {
  // Em produção, carregaria do backend
  // Simulação de dados
  const balance = {
    current: 6416.60,
    income: 8500,
    expense: 4440,
    upcoming: 3
  };
  
  // Atualizar elementos da interface
  const balanceValue = document.getElementById('balanceValue');
  if (balanceValue) {
    balanceValue.textContent = `R$ ${balance.current.toFixed(2)}`;
  }
  
  const incomeValue = document.getElementById('incomeValue');
  if (incomeValue) {
    incomeValue.textContent = `R$ ${balance.income.toFixed(2)}`;
  }
  
  const expenseValue = document.getElementById('expenseValue');
  if (expenseValue) {
    expenseValue.textContent = `R$ ${balance.expense.toFixed(2)}`;
  }
  
  const upcomingValue = document.getElementById('upcomingValue');
  if (upcomingValue) {
    upcomingValue.textContent = `Em ${balance.upcoming} dias`;
  }
}

// Carregar metas
function loadGoals() {
  // Em produção, carregaria do backend
  // Simulação de dados
  const goals = [
    {
      id: '1',
      name: 'Reserva de Emergência',
      current: 6500,
      target: 10000,
      deadline: '2025-12-31',
      progress: 65
    },
    {
      id: '2',
      name: 'Viagem de Férias',
      current: 2000,
      target: 5000,
      deadline: '2025-06-30',
      progress: 40
    },
    {
      id: '3',
      name: 'Novo Notebook',
      current: 1500,
      target: 6000,
      deadline: '2025-09-30',
      progress: 25
    }
  ];
  
  // Atualizar elementos da interface
  // Em uma implementação completa, atualizaria os elementos da interface com os dados das metas
}

// Carregar notificações
function loadNotifications() {
  // Em produção, carregaria do backend
  // Simulação de dados
  const notifications = [
    {
      id: '1',
      title: 'Aluguel vence amanhã',
      text: 'Lembrete: Sua despesa de aluguel no valor de R$ 1.500,00 vence amanhã.',
      time: 'Hoje, 10:30',
      type: 'warning',
      read: false
    },
    {
      id: '2',
      title: 'Meta atingida',
      text: 'Parabéns! Você atingiu 50% da sua meta "Reserva de Emergência".',
      time: 'Ontem, 15:45',
      type: 'success',
      read: false
    },
    {
      id: '3',
      title: 'Dica de economia',
      text: 'Seus gastos com alimentação estão 15% acima da média. Considere revisar este orçamento.',
      time: '20/04/2025, 09:15',
      type: 'info',
      read: true
    }
  ];
  
  // Atualizar badge de notificações
  const notificationBadge = document.getElementById('notificationBadge');
  if (notificationBadge) {
    const unreadCount = notifications.filter(notification => !notification.read).length;
    
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount;
      notificationBadge.classList.remove('hidden');
    } else {
      notificationBadge.classList.add('hidden');
    }
  }
  
  // Atualizar lista de notificações
  // Em uma implementação completa, atualizaria a lista de notificações no modal
}

// Salvar transação
function saveTransaction(transaction) {
  // Em produção, enviaria para o backend
  console.log('Transação salva:', transaction);
  
  // Simulação de salvamento
  // Em uma implementação real, enviaria para o backend e atualizaria os dados locais
}

// Mostrar notificação
function showNotification(message, type = 'info') {
  // Definir cor com base no tipo
  let backgroundColor = '#4cc9f0'; // info
  
  if (type === 'success') {
    backgroundColor = '#38b000';
  } else if (type === 'error') {
    backgroundColor = '#e63946';
  } else if (type === 'warning') {
    backgroundColor = '#f8961e';
  }
  
  // Mostrar notificação usando Toastify
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'center',
    backgroundColor,
    stopOnFocus: true
  }).showToast();
}

// Gerar ID único
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Funções auxiliares para autenticação (login.html)
// Estas funções seriam chamadas da página de login

// Função de login
function login(email, password) {
  // Em produção, verificaria credenciais no backend
  // Simulação de login bem-sucedido
  localStorage.setItem('userAuthenticated', 'true');
  
  // Redirecionar para a página principal
  window.location.href = 'mobile.html';
}

// Função de registro
function register(name, email, password) {
  // Em produção, enviaria dados para o backend
  // Simulação de registro bem-sucedido
  localStorage.setItem('userAuthenticated', 'true');
  
  // Redirecionar para a página principal
  window.location.href = 'mobile.html';
}

// Função de recuperação de senha
function recoverPassword(email) {
  // Em produção, enviaria email de recuperação
  // Simulação de recuperação bem-sucedida
  showNotification('Email de recuperação enviado com sucesso', 'success');
}
