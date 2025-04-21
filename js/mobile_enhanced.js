/**
 * Script mobile aprimorado para o Sistema de Gerenciamento de Contas Pessoais
 * Versão: 2.0
 * Data: 21/04/2025
 * 
 * Este arquivo contém funcionalidades aprimoradas para a versão mobile,
 * mantendo todas as funcionalidades originais mas com melhor usabilidade
 * e experiência para dispositivos móveis.
 */

// Função para inicializar ajustes específicos para mobile
function initEnhancedMobileAdjustments() {
  // Verificar se estamos em um dispositivo mobile
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  // Criar elementos de navegação mobile
  createMobileNavigation();
  
  // Melhorar a experiência do menu lateral em dispositivos móveis
  enhanceMobileSidebar();
  
  // Transformar tabelas em cards para melhor visualização em mobile
  enhanceMobileTables();
  
  // Otimizar modais para dispositivos móveis
  enhanceMobileModals();
  
  // Melhorar a experiência de formulários em dispositivos móveis
  enhanceMobileForms();
  
  // Otimizar gráficos para dispositivos móveis
  enhanceMobileCharts();
  
  // Transformar dashboard cards em carrossel
  enhanceDashboardCards();
  
  // Adicionar indicadores de carregamento
  addLoadingIndicators();
  
  // Melhorar feedback visual para interações
  enhanceTouchFeedback();
}

// Criar elementos de navegação mobile
function createMobileNavigation() {
  // Verificar se a navegação inferior já existe
  if (document.querySelector('.mobile-bottom-nav')) return;
  
  // Criar overlay para o menu
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.addEventListener('click', toggleMobileMenu);
  document.body.appendChild(overlay);
  
  // Criar botão de menu hamburguer
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  menuToggle.addEventListener('click', toggleMobileMenu);
  document.body.appendChild(menuToggle);
  
  // Criar navegação inferior
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'mobile-bottom-nav';
  
  // Definir itens da navegação inferior
  const navItems = [
    { icon: 'fas fa-home', text: 'Início', action: () => showSection('dashboardSection') },
    { icon: 'fas fa-wallet', text: 'Contas', action: () => showSection('contasSection') },
    { icon: 'fas fa-exchange-alt', text: 'Transações', action: () => showSection('transacoesSection') },
    { icon: 'fas fa-chart-line', text: 'Relatórios', action: () => showSection('relatoriosSection') },
    { icon: 'fas fa-cog', text: 'Mais', action: toggleMobileMenu }
  ];
  
  // Adicionar itens à navegação inferior
  navItems.forEach(item => {
    const navItem = document.createElement('a');
    navItem.className = 'mobile-nav-item';
    navItem.href = '#';
    navItem.innerHTML = `<i class="${item.icon}"></i><span>${item.text}</span>`;
    navItem.addEventListener('click', (e) => {
      e.preventDefault();
      item.action();
      
      // Atualizar item ativo
      document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
      navItem.classList.add('active');
    });
    
    bottomNav.appendChild(navItem);
  });
  
  // Adicionar navegação inferior ao body
  document.body.appendChild(bottomNav);
  
  // Ativar o primeiro item por padrão
  bottomNav.querySelector('.mobile-nav-item').classList.add('active');
}

// Alternar menu mobile
function toggleMobileMenu() {
  const sidebar = document.querySelector('aside');
  const overlay = document.querySelector('.menu-overlay');
  
  if (sidebar.classList.contains('active')) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Melhorar a experiência do menu lateral em dispositivos móveis
function enhanceMobileSidebar() {
  const sidebar = document.querySelector('aside');
  if (!sidebar) return;
  
  // Adicionar botão de fechar ao menu lateral
  if (!sidebar.querySelector('.sidebar-close')) {
    const closeButton = document.createElement('button');
    closeButton.className = 'sidebar-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.setAttribute('aria-label', 'Fechar menu');
    closeButton.addEventListener('click', toggleMobileMenu);
    sidebar.prepend(closeButton);
  }
  
  // Melhorar interação com links do menu
  const navLinks = sidebar.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMobileMenu(); // Fechar o menu ao clicar em um link
    });
  });
}

// Transformar tabelas em cards para melhor visualização em mobile
function enhanceMobileTables() {
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    // Verificar se a tabela já tem a classe de responsividade
    if (table.closest('.table-responsive')) return;
    
    // Adicionar classe para indicar que a tabela pode ter rolagem horizontal
    const tableContainer = table.closest('.table-container');
    if (tableContainer) {
      tableContainer.classList.add('scrollable');
    }
    
    // Opcionalmente, transformar tabelas em cards para melhor visualização
    if (table.rows.length > 1 && table.rows.length < 20) {
      transformTableToCards(table);
    }
  });
}

// Transformar tabela em cards
function transformTableToCards(table) {
  // Verificar se a tabela já foi transformada
  if (table.dataset.transformed === 'true') return;
  
  // Criar container para os cards
  const cardView = document.createElement('div');
  cardView.className = 'table-card-view';
  
  // Obter cabeçalhos da tabela
  const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
  
  // Criar um card para cada linha da tabela (exceto o cabeçalho)
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  
  rows.forEach(row => {
    const card = document.createElement('div');
    card.className = 'table-card-item';
    
    // Adicionar dados ao card
    const cells = Array.from(row.querySelectorAll('td'));
    cells.forEach((cell, index) => {
      if (index < headers.length) {
        const rowData = document.createElement('div');
        rowData.className = 'table-card-row';
        
        const label = document.createElement('div');
        label.className = 'table-card-label';
        label.textContent = headers[index];
        
        const value = document.createElement('div');
        value.className = 'table-card-value';
        value.innerHTML = cell.innerHTML;
        
        rowData.appendChild(label);
        rowData.appendChild(value);
        card.appendChild(rowData);
      }
    });
    
    cardView.appendChild(card);
  });
  
  // Adicionar visualização de cards após a tabela
  const tableContainer = table.closest('.table-container');
  if (tableContainer) {
    // Esconder a tabela em dispositivos móveis
    table.style.display = 'none';
    
    // Adicionar toggle para alternar entre visualizações
    const toggleView = document.createElement('button');
    toggleView.className = 'btn btn-sm btn-outline';
    toggleView.innerHTML = '<i class="fas fa-table"></i> Alternar visualização';
    toggleView.addEventListener('click', () => {
      if (table.style.display === 'none') {
        table.style.display = 'table';
        cardView.style.display = 'none';
        toggleView.innerHTML = '<i class="fas fa-th-large"></i> Visualizar como cards';
      } else {
        table.style.display = 'none';
        cardView.style.display = 'flex';
        toggleView.innerHTML = '<i class="fas fa-table"></i> Visualizar como tabela';
      }
    });
    
    tableContainer.prepend(toggleView);
    tableContainer.appendChild(cardView);
  }
  
  // Marcar a tabela como transformada
  table.dataset.transformed = 'true';
}

// Otimizar modais para dispositivos móveis
function enhanceMobileModals() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    const modalContent = modal.querySelector('.modal-content');
    
    // Adicionar indicador de arraste para fechar
    if (!modal.querySelector('.modal-drag-indicator')) {
      const dragIndicator = document.createElement('div');
      dragIndicator.className = 'modal-drag-indicator';
      modalContent.prepend(dragIndicator);
      
      // Implementar funcionalidade de arraste para fechar
      let startY = 0;
      let currentY = 0;
      
      dragIndicator.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
      });
      
      dragIndicator.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        if (deltaY > 0) {
          modalContent.style.transform = `translateY(${deltaY}px)`;
        }
      });
      
      dragIndicator.addEventListener('touchend', () => {
        const deltaY = currentY - startY;
        
        if (deltaY > 100) {
          // Fechar o modal
          modal.style.display = 'none';
          modalContent.style.transform = '';
        } else {
          // Resetar posição
          modalContent.style.transform = '';
        }
      });
    }
    
    // Ajustar botões de ação para layout mobile
    const modalFooter = modal.querySelector('.modal-footer');
    if (modalFooter) {
      const buttons = modalFooter.querySelectorAll('.btn');
      buttons.forEach(button => {
        button.classList.add('btn-block');
      });
    }
  });
}

// Melhorar a experiência de formulários em dispositivos móveis
function enhanceMobileForms() {
  // Ajustar layout de formulários para melhor usabilidade em mobile
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    // Ajustar grupos de formulários
    const formGroups = form.querySelectorAll('.form-group');
    formGroups.forEach(group => {
      const label = group.querySelector('label');
      const input = group.querySelector('input, select, textarea');
      
      if (label && input) {
        // Garantir que o label esteja associado ao input
        if (!label.getAttribute('for') && input.id) {
          label.setAttribute('for', input.id);
        }
        
        // Adicionar atributos para melhorar a experiência mobile
        if (input.tagName === 'INPUT') {
          // Ajustar tipo de teclado com base no tipo de input
          if (input.type === 'email') {
            input.setAttribute('inputmode', 'email');
          } else if (input.type === 'number' || input.type === 'tel') {
            input.setAttribute('inputmode', 'numeric');
          }
          
          // Adicionar autocomplete quando apropriado
          if (input.name.includes('email')) {
            input.setAttribute('autocomplete', 'email');
          } else if (input.name.includes('name')) {
            input.setAttribute('autocomplete', 'name');
          } else if (input.name.includes('phone') || input.name.includes('tel')) {
            input.setAttribute('autocomplete', 'tel');
          }
        }
      }
    });
    
    // Ajustar botões de formulário
    const formButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
    formButtons.forEach(button => {
      button.classList.add('btn-block');
    });
  });
  
  // Melhorar selects para dispositivos móveis
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    select.classList.add('form-control');
  });
}

// Otimizar gráficos para dispositivos móveis
function enhanceMobileCharts() {
  // Verificar se a biblioteca ApexCharts está disponível
  if (typeof ApexCharts !== 'undefined') {
    // Obter todas as instâncias de gráficos
    const chartElements = document.querySelectorAll('.apexcharts-canvas');
    
    chartElements.forEach(chartElement => {
      const chartId = chartElement.id.replace('apexcharts', '');
      
      // Tentar obter a instância do gráfico
      try {
        const chart = ApexCharts.getChartByID(chartId);
        
        if (chart) {
          // Atualizar opções para melhor visualização em mobile
          chart.updateOptions({
            chart: {
              height: 300,
              toolbar: {
                show: true,
                tools: {
                  download: false,
                  selection: true,
                  zoom: true,
                  zoomin: true,
                  zoomout: true,
                  pan: true,
                  reset: true
                }
              }
            },
            legend: {
              position: 'bottom',
              horizontalAlign: 'center',
              fontSize: '12px',
              offsetY: 5
            },
            dataLabels: {
              enabled: false
            },
            stroke: {
              width: 2
            },
            grid: {
              padding: {
                left: 10,
                right: 10
              }
            },
            tooltip: {
              shared: true,
              intersect: false
            }
          }, false, true);
        }
      } catch (error) {
        console.log('Erro ao otimizar gráfico:', error);
      }
    });
  }
}

// Transformar dashboard cards em carrossel
function enhanceDashboardCards() {
  const dashboardCards = document.querySelector('.dashboard-cards');
  if (!dashboardCards) return;
  
  // Adicionar indicadores de paginação
  const cardsCount = dashboardCards.children.length;
  if (cardsCount > 1) {
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    
    for (let i = 0; i < cardsCount; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'carousel-indicator';
      if (i === 0) indicator.classList.add('active');
      
      indicator.addEventListener('click', () => {
        // Rolar para o card correspondente
        const card = dashboardCards.children[i];
        card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        
        // Atualizar indicador ativo
        document.querySelectorAll('.carousel-indicator').forEach(el => el.classList.remove('active'));
        indicator.classList.add('active');
      });
      
      indicators.appendChild(indicator);
    }
    
    // Adicionar indicadores após os cards
    dashboardCards.parentNode.insertBefore(indicators, dashboardCards.nextSibling);
    
    // Atualizar indicador ativo ao rolar
    dashboardCards.addEventListener('scroll', () => {
      const scrollPosition = dashboardCards.scrollLeft;
      const cardWidth = dashboardCards.firstElementChild.offsetWidth;
      const gap = parseInt(window.getComputedStyle(dashboardCards).gap) || 0;
      
      const activeIndex = Math.round(scrollPosition / (cardWidth + gap));
      
      document.querySelectorAll('.carousel-indicator').forEach((el, index) => {
        el.classList.toggle('active', index === activeIndex);
      });
    });
  }
}

// Adicionar indicadores de carregamento
function addLoadingIndicators() {
  // Criar componente de loading
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Carregando...</div>
  `;
  
  // Adicionar estilos CSS para o indicador de carregamento
  const style = document.createElement('style');
  style.textContent = `
    .loading-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease;
    }
    
    .loading-indicator.active {
      opacity: 1;
      visibility: visible;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(var(--primary-rgb), 0.1);
      border-radius: 50%;
      border-top-color: var(--primary);
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: var(--text);
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(loadingIndicator);
  
  // Função para mostrar/esconder o indicador
  window.showLoading = function(show = true, message = 'Carregando...') {
    const indicator = document.querySelector('.loading-indicator');
    const textElement = indicator.querySelector('.loading-text');
    
    textElement.textContent = message;
    
    if (show) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  };
  
  // Interceptar eventos de navegação e ações que podem demorar
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button');
    
    if (target) {
      // Verificar se é um link de navegação ou botão de ação
      const isNavLink = target.classList.contains('nav-link');
      const isActionButton = target.classList.contains('btn') && !target.classList.contains('btn-sm');
      
      if (isNavLink || isActionButton) {
        // Verificar se o clique não é para abrir um modal ou toggle
        const isModalTrigger = target.getAttribute('data-toggle') === 'modal';
        const isDropdownToggle = target.getAttribute('data-toggle') === 'dropdown';
        
        if (!isModalTrigger && !isDropdownToggle) {
          // Mostrar loading por um curto período
          window.showLoading(true);
          
          // Esconder após um tempo razoável
          setTimeout(() => {
            window.showLoading(false);
          }, 800);
        }
      }
    }
  });
}

// Melhorar feedback visual para interações
function enhanceTouchFeedback() {
  // Adicionar efeito de ripple para elementos interativos
  const style = document.createElement('style');
  style.textContent = `
    .ripple {
      position: relative;
      overflow: hidden;
      transform: translate3d(0, 0, 0);
    }
    
    .ripple:after {
      content: "";
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
      background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
      background-repeat: no-repeat;
      background-position: 50%;
      transform: scale(10, 10);
      opacity: 0;
      transition: transform .5s, opacity 1s;
    }
    
    .ripple:active:after {
      transform: scale(0, 0);
      opacity: .3;
      transition: 0s;
    }
  `;
  
  document.head.appendChild(style);
  
  // Adicionar classe ripple a elementos interativos
  const interactiveElements = document.querySelectorAll('button, .btn, .nav-link, .card, .dashboard-card');
  interactiveElements.forEach(element => {
    element.classList.add('ripple');
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  initEnhancedMobileAdjustments();
  
  // Reinicializar quando a orientação mudar
  window.addEventListener('resize', function() {
    initEnhancedMobileAdjustments();
  });
  
  // Reinicializar quando a orientação mudar em dispositivos móveis
  window.addEventListener('orientationchange', function() {
    initEnhancedMobileAdjustments();
  });
});
