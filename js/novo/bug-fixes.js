/**
 * Módulo de Correção de Bugs para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Correções para problemas de integração entre arquivos originais e novos
 * - Melhorias de compatibilidade entre navegadores
 * - Tratamento de erros para funções críticas
 */

'use strict';

/**
 * Inicializa as correções de bugs
 */
function initBugFixes() {
  fixNavigationIssues();
  fixResponsiveIssues();
  fixCalculationIssues();
  enhanceErrorHandling();
}

/**
 * Corrige problemas de navegação
 */
function fixNavigationIssues() {
  // Corrigir problema de ativação de links no menu
  const originalShowSection = window.showSection;
  
  // Sobrescrever apenas se a função aprimorada não estiver disponível
  if (typeof window.showSectionEnhanced !== 'function') {
    window.showSection = function(sectionId) {
      // Chamar função original
      if (typeof originalShowSection === 'function') {
        originalShowSection(sectionId);
      } else {
        // Fallback se a função original não estiver disponível
        const sections = document.querySelectorAll('main > section');
        sections.forEach(sec => sec.style.display = 'none');
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
          targetSection.style.display = 'block';
        }
      }
      
      // Atualizar navegação
      document.querySelectorAll('#sidebar .nav-link, #sidebar .submenu-link').forEach(link => {
        link.classList.remove('active');
      });
      
      // Encontrar e ativar o link correspondente
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
    };
  }
  
  // Corrigir problema de inicialização de componentes
  document.addEventListener('DOMContentLoaded', function() {
    // Verificar se os elementos existem antes de inicializar
    if (document.getElementById('dashboardSection')) {
      // Inicializar dashboard se a função existir
      if (typeof initDashboardEnhanced === 'function') {
        initDashboardEnhanced();
      } else if (typeof atualizarDashboard === 'function') {
        atualizarDashboard();
      }
    }
  });
}

/**
 * Corrige problemas de responsividade
 */
function fixResponsiveIssues() {
  // Adicionar classe para detectar dispositivos móveis
  function detectMobileDevice() {
    if (window.innerWidth <= 768) {
      document.body.classList.add('mobile-device');
    } else {
      document.body.classList.remove('mobile-device');
    }
  }
  
  // Detectar no carregamento e no redimensionamento
  window.addEventListener('load', detectMobileDevice);
  window.addEventListener('resize', detectMobileDevice);
  
  // Corrigir problema de scroll horizontal em tabelas em dispositivos móveis
  document.querySelectorAll('.table-container').forEach(container => {
    container.style.overflowX = 'auto';
  });
  
  // Ajustar tamanho dos gráficos em dispositivos móveis
  function resizeCharts() {
    if (window.innerWidth <= 768) {
      document.querySelectorAll('[id$="Chart"]').forEach(chart => {
        chart.style.height = '250px';
      });
    }
  }
  
  window.addEventListener('load', resizeCharts);
  window.addEventListener('resize', resizeCharts);
}

/**
 * Corrige problemas de cálculo
 */
function fixCalculationIssues() {
  // Sobrescrever funções de cálculo para tratar valores nulos ou indefinidos
  
  // Função segura para parsing de números
  window.safeParseFloat = function(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  // Função segura para formatação de moeda
  window.formatCurrency = function(value) {
    const amount = window.safeParseFloat(value);
    return `R$ ${amount.toFixed(2)}`;
  };
  
  // Função segura para cálculo de percentual
  window.calculatePercentage = function(value, total) {
    const safeValue = window.safeParseFloat(value);
    const safeTotal = window.safeParseFloat(total);
    
    if (safeTotal === 0) {
      return 0;
    }
    
    return (safeValue / safeTotal) * 100;
  };
}

/**
 * Melhora o tratamento de erros
 */
function enhanceErrorHandling() {
  // Capturar erros não tratados
  window.addEventListener('error', function(event) {
    console.error('Erro capturado:', event.error);
    
    // Exibir toast de erro se a função existir
    if (typeof exibirToast === 'function') {
      exibirToast('Ocorreu um erro. Por favor, tente novamente.', 'danger');
    }
    
    // Evitar que o erro interrompa a execução
    event.preventDefault();
  });
  
  // Adicionar tratamento de erro para funções críticas
  const criticalFunctions = [
    'atualizarDashboard',
    'salvarDespesa',
    'loadFluxoCaixa',
    'loadMetas',
    'novo_calcularPrevisoes',
    'novo_verificarAlertas'
  ];
  
  criticalFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      const originalFunc = window[funcName];
      
      window[funcName] = function() {
        try {
          return originalFunc.apply(this, arguments);
        } catch (error) {
          console.error(`Erro em ${funcName}:`, error);
          
          if (typeof exibirToast === 'function') {
            exibirToast(`Erro ao executar ${funcName}. Por favor, tente novamente.`, 'danger');
          }
          
          // Retornar valor padrão para evitar erros em cascata
          return null;
        }
      };
    }
  });
  
  // Verificar existência de elementos DOM antes de manipulá-los
  window.safeQuerySelector = function(selector) {
    return document.querySelector(selector);
  };
  
  window.safeGetElementById = function(id) {
    return document.getElementById(id);
  };
}

/**
 * Corrige problemas de compatibilidade entre navegadores
 */
function fixBrowserCompatibilityIssues() {
  // Polyfill para o método forEach em NodeList para navegadores antigos
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  
  // Polyfill para o método includes em Array para navegadores antigos
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      
      var o = Object(this);
      var len = o.length >>> 0;
      
      if (len === 0) {
        return false;
      }
      
      var n = fromIndex | 0;
      var k = Math.max(n >= 0 ? n : len + n, 0);
      
      while (k < len) {
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }
      
      return false;
    };
  }
  
  // Corrigir problemas com datas em diferentes navegadores
  window.formatDate = function(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  window.parseDate = function(dateString) {
    if (!dateString) return null;
    
    // Tentar formato ISO
    let date = new Date(dateString);
    
    // Se não for válido, tentar formato DD/MM/YYYY
    if (isNaN(date.getTime())) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    
    return isNaN(date.getTime()) ? null : date;
  };
}

// Inicializar correções
document.addEventListener('DOMContentLoaded', initBugFixes);
