/**
 * Módulo de Integração para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Integração entre os módulos originais e os novos módulos
 * - Inicialização coordenada de todos os componentes
 * - Garantia de compatibilidade entre as diferentes partes do sistema
 */

'use strict';

/**
 * Inicializa o sistema aprimorado
 */
function initEnhancedSystem() {
  // Inicializar módulos de correção e compatibilidade primeiro
  if (typeof initBugFixes === 'function') {
    initBugFixes();
  }
  
  if (typeof initBrowserCompatibility === 'function') {
    initBrowserCompatibility();
  }
  
  if (typeof initResponsiveness === 'function') {
    initResponsiveness();
  }
  
  if (typeof initFormValidation === 'function') {
    initFormValidation();
  }
  
  // Inicializar componentes de UI
  if (typeof initUIComponents === 'function') {
    initUIComponents();
  }
  
  // Inicializar módulos funcionais
  initFunctionalModules();
  
  // Configurar navegação aprimorada
  setupEnhancedNavigation();
  
  // Configurar eventos globais
  setupGlobalEvents();
  
  console.log('Sistema aprimorado inicializado com sucesso!');
}

/**
 * Inicializa os módulos funcionais
 */
function initFunctionalModules() {
  // Inicializar dashboard aprimorado
  if (typeof initDashboardEnhanced === 'function' && document.getElementById('dashboardSection')) {
    initDashboardEnhanced();
  } else if (typeof atualizarDashboard === 'function' && document.getElementById('dashboardSection')) {
    atualizarDashboard();
  }
  
  // Inicializar módulo de finanças
  if (typeof initFinancasSection === 'function' && document.getElementById('financasSection')) {
    initFinancasSection();
  }
  
  // Inicializar módulo de metas
  if (typeof initMetasSection === 'function' && document.getElementById('metasSection')) {
    initMetasSection();
  }
  
  // Inicializar alertas
  if (typeof verificarAlertas === 'function') {
    verificarAlertas();
  } else if (typeof novo_verificarAlertas === 'function') {
    novo_verificarAlertas();
  }
  
  // Inicializar previsões
  if (document.getElementById('previsaoSection')) {
    if (typeof novo_calcularPrevisoes === 'function') {
      novo_calcularPrevisoes();
    } else if (typeof calcularPrevisoes === 'function') {
      calcularPrevisoes();
    }
  }
}

/**
 * Configura a navegação aprimorada
 */
function setupEnhancedNavigation() {
  // Sobrescrever função de navegação original
  if (typeof showSectionEnhanced === 'function') {
    window.showSection = showSectionEnhanced;
  } else {
    // Implementar versão aprimorada se não existir
    window.showSectionEnhanced = function(sectionId) {
      // Ocultar todas as seções
      document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
      });
      
      // Mostrar a seção selecionada
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = 'block';
        
        // Inicializar seção específica se necessário
        initSectionIfNeeded(sectionId);
      }
      
      // Atualizar navegação
      document.querySelectorAll('#sidebar .nav-link, #sidebar .submenu-link').forEach(link => {
        link.classList.remove('active');
      });
      
      // Ativar link correspondente
      const navLink = document.querySelector(`#sidebar .nav-link[data-section="${sectionId}"]`);
      if (navLink) {
        navLink.classList.add('active');
      }
      
      const submenuLink = document.querySelector(`#sidebar .submenu-link[data-section="${sectionId}"]`);
      if (submenuLink) {
        submenuLink.classList.add('active');
        
        // Abrir submenu pai
        const submenu = submenuLink.closest('.submenu');
        if (submenu) {
          submenu.classList.add('open');
          const parentLink = submenu.previousElementSibling;
          if (parentLink) {
            parentLink.classList.add('expanded');
          }
        }
      }
      
      // Fechar menu lateral em dispositivos móveis
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const appContainer = document.querySelector('.app-container');
        const menuToggle = document.getElementById('menuToggle');
        
        if (sidebar && appContainer && menuToggle) {
          sidebar.classList.remove('open');
          appContainer.classList.remove('sidebar-open');
          menuToggle.classList.remove('active');
        }
      }
      
      // Rolar para o topo
      window.scrollTo(0, 0);
    };
    
    // Usar a versão aprimorada
    window.showSection = window.showSectionEnhanced;
  }
  
  // Configurar links de navegação
  document.querySelectorAll('#sidebar .nav-link, #sidebar .submenu-link').forEach(link => {
    const sectionId = link.getAttribute('data-section');
    if (sectionId) {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        window.showSection(sectionId);
      });
    }
  });
  
  // Configurar toggle de submenus
  document.querySelectorAll('.nav-link-with-submenu').forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      this.classList.toggle('expanded');
      const submenu = this.nextElementSibling;
      if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('open');
      }
    });
  });
}

/**
 * Inicializa uma seção específica se necessário
 * @param {string} sectionId - ID da seção a ser inicializada
 */
function initSectionIfNeeded(sectionId) {
  switch (sectionId) {
    case 'dashboardSection':
      if (typeof initDashboardEnhanced === 'function') {
        initDashboardEnhanced();
      } else if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
      }
      break;
      
    case 'financasSection':
      if (typeof initFinancasSection === 'function') {
        initFinancasSection();
      }
      break;
      
    case 'metasSection':
      if (typeof initMetasSection === 'function') {
        initMetasSection();
      }
      break;
      
    case 'despesasSection':
      if (typeof carregarTodasDespesas === 'function') {
        carregarTodasDespesas();
      }
      break;
      
    case 'rendaSection':
      if (typeof loadRendas === 'function') {
        loadRendas();
      }
      break;
      
    case 'previsaoSection':
      if (typeof novo_calcularPrevisoes === 'function') {
        novo_calcularPrevisoes();
      } else if (typeof calcularPrevisoes === 'function') {
        calcularPrevisoes();
      }
      break;
      
    case 'alertasSection':
      if (typeof novo_verificarAlertas === 'function') {
        novo_verificarAlertas();
      } else if (typeof verificarAlertas === 'function') {
        verificarAlertas();
      }
      break;
      
    case 'categoriasSection':
      if (typeof loadCategorias === 'function') {
        loadCategorias();
      }
      break;
      
    case 'cartoesSection':
      if (typeof loadCartoes === 'function') {
        loadCartoes();
      }
      break;
      
    case 'relatorioSection':
      if (typeof initRelatorios === 'function') {
        initRelatorios();
      }
      break;
  }
}

/**
 * Configura eventos globais
 */
function setupGlobalEvents() {
  // Configurar notificações toast aprimoradas
  if (typeof exibirToast !== 'function') {
    window.exibirToast = function(mensagem, tipo = 'info') {
      // Verificar se Toastify está disponível
      if (typeof Toastify === 'function') {
        Toastify({
          text: mensagem,
          duration: 3000,
          close: true,
          gravity: 'top',
          position: 'right',
          backgroundColor: tipo === 'success' ? '#4caf50' : 
                          tipo === 'danger' ? '#f44336' : 
                          tipo === 'warning' ? '#ff9800' : '#2196f3',
          stopOnFocus: true
        }).showToast();
      } else {
        // Fallback para alert se Toastify não estiver disponível
        alert(mensagem);
      }
    };
  }
  
  // Configurar manipulador de erros global
  window.addEventListener('error', function(event) {
    console.error('Erro capturado:', event.error);
    
    // Exibir toast de erro
    if (typeof exibirToast === 'function') {
      exibirToast('Ocorreu um erro. Por favor, tente novamente.', 'danger');
    }
    
    // Evitar que o erro interrompa a execução
    event.preventDefault();
  });
  
  // Configurar detecção de conexão
  window.addEventListener('online', function() {
    if (typeof exibirToast === 'function') {
      exibirToast('Conexão com a internet restaurada.', 'success');
    }
    
    // Recarregar dados se necessário
    if (typeof atualizarDashboard === 'function') {
      atualizarDashboard();
    }
  });
  
  window.addEventListener('offline', function() {
    if (typeof exibirToast === 'function') {
      exibirToast('Conexão com a internet perdida. Algumas funcionalidades podem não estar disponíveis.', 'warning');
    }
  });
}

// Inicializar sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initEnhancedSystem);

// Exportar funções
window.initEnhancedSystem = initEnhancedSystem;
window.showSectionEnhanced = window.showSectionEnhanced || function() {};
