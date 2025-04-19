/**
 * Módulo de Responsividade para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Melhorias de responsividade para dispositivos móveis
 * - Ajustes dinâmicos de layout baseados no tamanho da tela
 * - Otimizações para interação em dispositivos touch
 */

'use strict';

/**
 * Inicializa as melhorias de responsividade
 */
function initResponsiveness() {
  setupMobileMenu();
  enhanceResponsiveTables();
  optimizeChartsForMobile();
  addTouchSupport();
  setupResizeHandlers();
}

/**
 * Configura o menu móvel
 */
function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const appContainer = document.querySelector('.app-container');
  
  if (!menuToggle || !sidebar || !appContainer) return;
  
  // Adicionar evento de clique ao botão de menu
  menuToggle.addEventListener('click', function() {
    sidebar.classList.toggle('open');
    appContainer.classList.toggle('sidebar-open');
    this.classList.toggle('active');
  });
  
  // Fechar menu ao clicar fora dele em dispositivos móveis
  document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('open') && 
        !sidebar.contains(event.target) && 
        event.target !== menuToggle) {
      sidebar.classList.remove('open');
      appContainer.classList.remove('sidebar-open');
      menuToggle.classList.remove('active');
    }
  });
  
  // Melhorar interação com submenus em dispositivos móveis
  document.querySelectorAll('.nav-link-with-submenu').forEach(link => {
    link.addEventListener('click', function(event) {
      if (window.innerWidth <= 768) {
        event.preventDefault();
        this.classList.toggle('expanded');
        const submenu = this.nextElementSibling;
        if (submenu && submenu.classList.contains('submenu')) {
          submenu.classList.toggle('open');
        }
      }
    });
  });
}

/**
 * Melhora a responsividade das tabelas
 */
function enhanceResponsiveTables() {
  document.querySelectorAll('table').forEach(table => {
    // Adicionar classe para identificar tabelas
    table.classList.add('responsive-table');
    
    // Adicionar atributos de dados para cabeçalhos
    const headers = table.querySelectorAll('thead th');
    const headerTexts = Array.from(headers).map(header => header.textContent);
    
    // Adicionar atributos de dados para células
    table.querySelectorAll('tbody tr').forEach(row => {
      row.querySelectorAll('td').forEach((cell, index) => {
        if (index < headerTexts.length) {
          cell.setAttribute('data-label', headerTexts[index]);
        }
      });
    });
    
    // Envolver tabela em um container com scroll horizontal
    if (!table.parentElement.classList.contains('table-container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-container';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
  
  // Adicionar CSS para tabelas responsivas
  addResponsiveTableStyles();
}

/**
 * Adiciona estilos CSS para tabelas responsivas
 */
function addResponsiveTableStyles() {
  // Verificar se os estilos já foram adicionados
  if (document.getElementById('responsive-table-styles')) return;
  
  // Criar elemento de estilo
  const style = document.createElement('style');
  style.id = 'responsive-table-styles';
  
  // Adicionar regras CSS
  style.textContent = `
    @media screen and (max-width: 768px) {
      .responsive-table {
        border: 0;
        width: 100%;
      }
      
      .responsive-table thead {
        border: none;
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
      }
      
      .responsive-table tr {
        border-bottom: 3px solid #ddd;
        display: block;
        margin-bottom: 0.625em;
      }
      
      .responsive-table td {
        border-bottom: 1px solid #ddd;
        display: block;
        font-size: 0.8em;
        text-align: right;
        padding: 0.625em;
      }
      
      .responsive-table td::before {
        content: attr(data-label);
        float: left;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .responsive-table td:last-child {
        border-bottom: 0;
      }
    }
  `;
  
  // Adicionar ao documento
  document.head.appendChild(style);
}

/**
 * Otimiza gráficos para dispositivos móveis
 */
function optimizeChartsForMobile() {
  // Ajustar configurações de gráficos para dispositivos móveis
  window.addEventListener('resize', function() {
    const isMobile = window.innerWidth <= 768;
    
    // Ajustar altura dos gráficos
    document.querySelectorAll('[id$="Chart"], [id^="grafico"]').forEach(chart => {
      chart.style.height = isMobile ? '250px' : '350px';
    });
    
    // Atualizar configurações de gráficos existentes
    if (window.ApexCharts) {
      document.querySelectorAll('.apexcharts-canvas').forEach(canvas => {
        const chartId = canvas.id.replace('apexcharts', '');
        const chartInstance = window.ApexCharts.getChartByID(chartId);
        
        if (chartInstance) {
          // Ajustar configurações para dispositivos móveis
          if (isMobile) {
            chartInstance.updateOptions({
              chart: {
                height: 250
              },
              legend: {
                position: 'bottom',
                fontSize: '10px'
              },
              xaxis: {
                labels: {
                  style: {
                    fontSize: '10px'
                  }
                }
              },
              yaxis: {
                labels: {
                  style: {
                    fontSize: '10px'
                  }
                }
              }
            }, false, true);
          } else {
            // Restaurar configurações para desktop
            chartInstance.updateOptions({
              chart: {
                height: 350
              },
              legend: {
                position: 'right',
                fontSize: '12px'
              },
              xaxis: {
                labels: {
                  style: {
                    fontSize: '12px'
                  }
                }
              },
              yaxis: {
                labels: {
                  style: {
                    fontSize: '12px'
                  }
                }
              }
            }, false, true);
          }
        }
      });
    }
  });
  
  // Disparar evento de redimensionamento para aplicar configurações iniciais
  window.dispatchEvent(new Event('resize'));
}

/**
 * Adiciona suporte a interações touch
 */
function addTouchSupport() {
  // Melhorar interação com elementos clicáveis
  document.querySelectorAll('button, .btn, .nav-link, .submenu-link').forEach(element => {
    element.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    });
    
    element.addEventListener('touchend', function() {
      this.classList.remove('touch-active');
    });
    
    element.addEventListener('touchcancel', function() {
      this.classList.remove('touch-active');
    });
  });
  
  // Adicionar suporte a gestos de swipe para navegação
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
  });
  
  document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const sidebar = document.getElementById('sidebar');
    const appContainer = document.querySelector('.app-container');
    const menuToggle = document.getElementById('menuToggle');
    
    if (!sidebar || !appContainer || !menuToggle) return;
    
    // Swipe da esquerda para a direita (abrir menu)
    if (touchEndX - touchStartX > 100 && window.innerWidth <= 768 && !sidebar.classList.contains('open')) {
      sidebar.classList.add('open');
      appContainer.classList.add('sidebar-open');
      menuToggle.classList.add('active');
    }
    
    // Swipe da direita para a esquerda (fechar menu)
    if (touchStartX - touchEndX > 100 && window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      appContainer.classList.remove('sidebar-open');
      menuToggle.classList.remove('active');
    }
  }
}

/**
 * Configura manipuladores de eventos de redimensionamento
 */
function setupResizeHandlers() {
  // Detectar mudanças de orientação
  window.addEventListener('orientationchange', function() {
    // Ajustar layout após mudança de orientação
    setTimeout(function() {
      window.dispatchEvent(new Event('resize'));
    }, 200);
  });
  
  // Ajustar layout para diferentes tamanhos de tela
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      adjustLayoutForScreenSize();
    }, 250);
  });
  
  // Aplicar ajustes iniciais
  adjustLayoutForScreenSize();
}

/**
 * Ajusta o layout com base no tamanho da tela
 */
function adjustLayoutForScreenSize() {
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
  const isDesktop = window.innerWidth > 1024;
  
  // Adicionar classes ao body para estilos específicos
  document.body.classList.toggle('mobile-view', isMobile);
  document.body.classList.toggle('tablet-view', isTablet);
  document.body.classList.toggle('desktop-view', isDesktop);
  
  // Ajustar cards do dashboard
  if (isMobile) {
    document.querySelectorAll('.dashboard-cards').forEach(container => {
      container.classList.add('flex-column');
    });
  } else {
    document.querySelectorAll('.dashboard-cards').forEach(container => {
      container.classList.remove('flex-column');
    });
  }
  
  // Ajustar layout de formulários
  if (isMobile) {
    document.querySelectorAll('.form-row').forEach(row => {
      row.classList.add('flex-column');
    });
  } else {
    document.querySelectorAll('.form-row').forEach(row => {
      row.classList.remove('flex-column');
    });
  }
}

// Exportar funções
window.initResponsiveness = initResponsiveness;
