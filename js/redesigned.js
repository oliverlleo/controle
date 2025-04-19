/**
 * redesigned.js - Script complementar para a interface redesenhada
 * 
 * Este arquivo contém funções adicionais para garantir a compatibilidade
 * da nova interface com as funcionalidades existentes.
 */

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar o menu móvel
  initMobileMenu();
  
  // Inicializar sistema de abas
  initTabSystem();
  
  // Inicializar tooltips
  initTooltips();
  
  // Corrigir comportamento dos modais
  fixModals();
  
  // Inicializar componentes após autenticação
  checkAuthState();
});

// Inicialização do menu móvel
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(event) {
      if (window.innerWidth <= 992 && 
          !sidebar.contains(event.target) && 
          !menuToggle.contains(event.target) &&
          sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
      }
    });
  }
}

// Inicialização do sistema de abas
function initTabSystem() {
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabId = this.dataset.tab;
      activateTab(tabId);
    });
  });
}

// Ativar uma aba específica
function activateTab(tabId) {
  // Desativar todas as abas
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Ativar a aba selecionada
  document.querySelectorAll(`.tab-button[data-tab="${tabId}"]`).forEach(button => {
    button.classList.add('active');
  });
  
  const tabContent = document.getElementById(tabId);
  if (tabContent) {
    tabContent.classList.add('active');
  }
  
  // Ativar o item correspondente no menu lateral
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  const navLinks = document.querySelectorAll('.nav-link');
  for (let i = 0; i < navLinks.length; i++) {
    if (navLinks[i].getAttribute('onclick') && navLinks[i].getAttribute('onclick').includes(tabId)) {
      navLinks[i].classList.add('active');
      break;
    }
  }
  
  // Fechar o menu em dispositivos móveis após selecionar uma opção
  if (window.innerWidth <= 992) {
    document.getElementById('sidebar').classList.remove('show');
  }
  
  // Chamar funções específicas para cada aba
  if (tabId === 'dashboard-tab') {
    if (typeof atualizarDashboard === 'function') atualizarDashboard();
  } else if (tabId === 'despesas-tab') {
    if (typeof loadTodasDespesas === 'function') loadTodasDespesas();
  } else if (tabId === 'relatorio-tab') {
    if (typeof gerarRelatorio === 'function') gerarRelatorio();
  } else if (tabId === 'previsao-tab') {
    if (typeof novo_calcularPrevisoes === 'function') novo_calcularPrevisoes();
  } else if (tabId === 'calendario-tab') {
    if (typeof renderCalendar === 'function') renderCalendar();
  } else if (tabId === 'categorias-tab') {
    if (typeof loadCategorias === 'function') loadCategorias();
  } else if (tabId === 'cartoes-tab') {
    if (typeof loadCartoes === 'function') loadCartoes();
  } else if (tabId === 'renda-tab') {
    if (typeof loadRendas === 'function') loadRendas();
  }
}

// Inicializar tooltips
function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', function() {
      const tooltipText = this.dataset.tooltip;
      
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = tooltipText;
      
      document.body.appendChild(tooltip);
      
      const rect = this.getBoundingClientRect();
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
      
      this.addEventListener('mouseleave', function() {
        document.body.removeChild(tooltip);
      }, { once: true });
    });
  });
}

// Corrigir comportamento dos modais
function fixModals() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        fecharModal(this.id);
      }
    });
    
    // Adicionar suporte para tecla ESC
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.style.display === 'flex') {
        fecharModal(modal.id);
      }
    });
  });
}

// Função para abrir modal
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    
    // Focar no primeiro input
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
      }, 100);
    }
  }
}

// Função para fechar modal
function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

// Verificar estado de autenticação
function checkAuthState() {
  // Se o Firebase Auth estiver disponível, usar o listener de autenticação
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // Usuário autenticado, inicializar componentes
        initComponents();
      } else {
        // Usuário não autenticado, redirecionar para login
        window.location.href = 'login.html';
      }
    });
  } else {
    // Firebase Auth não disponível, inicializar componentes diretamente
    initComponents();
  }
}

// Inicializar componentes da interface
function initComponents() {
  // Inicializar seletor de período
  initDateRangePicker();
  
  // Inicializar seletores de mês/ano
  initMonthYearSelectors();
  
  // Atualizar componentes principais
  updateMainComponents();
}

// Inicializar DateRangePicker
function initDateRangePicker() {
  if (typeof $ !== 'undefined' && $.fn.daterangepicker) {
    $('#dataRange').daterangepicker({
      opens: 'left',
      locale: {
        format: 'DD/MM/YYYY',
        separator: ' - ',
        applyLabel: 'Aplicar',
        cancelLabel: 'Cancelar',
        fromLabel: 'De',
        toLabel: 'Até',
        customRangeLabel: 'Personalizado',
        weekLabel: 'S',
        daysOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        firstDay: 0
      },
      startDate: moment().startOf('month'),
      endDate: moment().endOf('month')
    }, function(start, end) {
      if (typeof gerarRelatorio === 'function') {
        gerarRelatorio(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'));
      }
    });
  }
}

// Inicializar seletores de mês/ano
function initMonthYearSelectors() {
  const yearSelect = document.getElementById('dashboardYear');
  
  if (yearSelect) {
    // Preencher anos (5 anos atrás até 5 anos à frente)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      if (year === currentYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  }
  
  // Definir mês atual no seletor
  const monthSelect = document.getElementById('dashboardMonth');
  if (monthSelect) {
    const currentMonth = new Date().getMonth();
    monthSelect.value = currentMonth;
  }
}

// Atualizar componentes principais
function updateMainComponents() {
  // Ativar a aba inicial (dashboard)
  activateTab('dashboard-tab');
  
  // Verificar alertas
  if (typeof novo_verificarAlertas === 'function') {
    novo_verificarAlertas();
  }
}

// Sobrescrever a função exibirToast para usar o estilo correto
function exibirToast(mensagem, tipo = 'success') {
  let backgroundColor;
  let icon;
  
  switch (tipo) {
    case 'success':
      backgroundColor = 'var(--success)';
      icon = 'fas fa-check-circle';
      break;
    case 'error':
      backgroundColor = 'var(--danger)';
      icon = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      backgroundColor = 'var(--warning)';
      icon = 'fas fa-exclamation-triangle';
      break;
    default:
      backgroundColor = 'var(--primary)';
      icon = 'fas fa-info-circle';
  }
  
  Toastify({
    text: mensagem,
    duration: 3000,
    close: true,
    gravity: "bottom",
    position: "right",
    style: {
      background: backgroundColor
    },
    onClick: function(){}
  }).showToast();
}

// Função para alternar entre temas claro e escuro (preparação para futuro)
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  
  // Salvar preferência do usuário
  const isDarkTheme = document.body.classList.contains('dark-theme');
  localStorage.setItem('darkTheme', isDarkTheme);
}

// Função para aplicar tema baseado na preferência do usuário
function applyTheme() {
  const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
  }
}

// Função para criar um alerta no painel de mini-alertas
function createAlertItem(titulo, descricao, tipo = 'normal', data = null) {
  const alertaItem = document.createElement('div');
  alertaItem.className = `alerta-item ${tipo === 'vencimento' ? 'alerta-vencimento' : ''}`;
  
  const icon = tipo === 'vencimento' ? 'fa-exclamation-circle' : 'fa-bell';
  
  alertaItem.innerHTML = `
    <div class="alerta-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="alerta-content">
      <div class="alerta-title">${titulo}</div>
      <div class="alerta-details">
        <span>${descricao}</span>
        ${data ? `<span>${data}</span>` : ''}
      </div>
    </div>
  `;
  
  return alertaItem;
}

// Função para criar um item de despesa na lista de despesas
function createDespesaItem(descricao, valor, data, categoria) {
  const despesaItem = document.createElement('div');
  despesaItem.className = 'despesa-item';
  
  despesaItem.innerHTML = `
    <div class="despesa-info">
      <div class="despesa-titulo">${descricao}</div>
      <div class="despesa-detalhe">${categoria} • ${data}</div>
    </div>
    <div class="despesa-valor">R$ ${parseFloat(valor).toFixed(2)}</div>
  `;
  
  return despesaItem;
}

// Função para criar um badge de status
function createStatusBadge(status) {
  const badge = document.createElement('span');
  
  if (status === 'Pago') {
    badge.className = 'badge badge-success';
    badge.textContent = 'Pago';
  } else if (status === 'Pendente') {
    badge.className = 'badge badge-warning';
    badge.textContent = 'Pendente';
  } else if (status === 'Atrasado') {
    badge.className = 'badge badge-danger';
    badge.textContent = 'Atrasado';
  } else {
    badge.className = 'badge';
    badge.textContent = status;
  }
  
  return badge;
}

// Função para criar um botão de ação
function createActionButton(icon, onClick, tooltip = '', btnClass = 'btn-icon') {
  const button = document.createElement('button');
  button.className = `btn ${btnClass}`;
  button.innerHTML = `<i class="fas ${icon}"></i>`;
  
  if (tooltip) {
    button.setAttribute('data-tooltip', tooltip);
  }
  
  if (typeof onClick === 'function') {
    button.addEventListener('click', onClick);
  } else if (typeof onClick === 'string') {
    button.setAttribute('onclick', onClick);
  }
  
  return button;
}

// Exportar funções para uso global
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.activateTab = activateTab;
window.exibirToast = exibirToast;
window.toggleTheme = toggleTheme;
window.createAlertItem = createAlertItem;
window.createDespesaItem = createDespesaItem;
window.createStatusBadge = createStatusBadge;
window.createActionButton = createActionButton;
