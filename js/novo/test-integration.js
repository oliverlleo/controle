/**
 * Script de Integração para Testes do Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este script integra todos os módulos e inicializa os testes do sistema
 */

'use strict';

/**
 * Inicializa o sistema e executa os testes
 */
function initTestEnvironment() {
  console.log('Inicializando ambiente de testes...');
  
  // Carregar todos os módulos necessários
  carregarModulos();
  
  // Inicializar sistema aprimorado
  if (typeof window.initEnhancedSystem === 'function') {
    window.initEnhancedSystem();
  }
  
  // Iniciar testes após carregamento completo
  setTimeout(() => {
    if (typeof window.iniciarTestes === 'function') {
      window.iniciarTestes();
    } else {
      console.error('Função de testes não encontrada');
    }
  }, 2000);
}

/**
 * Carrega todos os módulos necessários
 */
function carregarModulos() {
  console.log('Carregando módulos...');
  
  // Lista de módulos a serem carregados
  const modulos = [
    // Módulos originais
    { nome: 'main.js', carregado: verificarModulo('atualizarDashboard') },
    { nome: 'alertas.js', carregado: verificarModulo('verificarAlertas') },
    { nome: 'previsoes.js', carregado: verificarModulo('calcularPrevisoes') },
    { nome: 'auth.js', carregado: verificarModulo('checkAuth') },
    
    // Módulos de correção e compatibilidade
    { nome: 'novo/bug-fixes.js', carregado: verificarModulo('initBugFixes') },
    { nome: 'novo/browser-compatibility.js', carregado: verificarModulo('initBrowserCompatibility') },
    { nome: 'novo/responsiveness.js', carregado: verificarModulo('initResponsiveness') },
    { nome: 'novo/form-validation.js', carregado: verificarModulo('initFormValidation') },
    
    // Módulos de UI e integração
    { nome: 'novo/ui-components.js', carregado: verificarModulo('initUIComponents') },
    { nome: 'novo/system-integration.js', carregado: verificarModulo('initEnhancedSystem') },
    
    // Módulos de novas funcionalidades
    { nome: 'novo/dashboard-enhanced.js', carregado: verificarModulo('initDashboardEnhanced') },
    { nome: 'novo/financas.js', carregado: verificarModulo('initFinancasSection') },
    { nome: 'novo/metas.js', carregado: verificarModulo('initMetasSection') },
    { nome: 'novo/tendencias-analysis.js', carregado: verificarModulo('initTendenciasAnalysis') },
    { nome: 'novo/orcamento-planner.js', carregado: verificarModulo('initOrcamentoPlanner') },
    { nome: 'novo/relatorios-avancados.js', carregado: verificarModulo('initRelatoriosAvancados') },
    { nome: 'novo/metas-financeiras.js', carregado: verificarModulo('initMetasFinanceiras') },
    
    // Módulo de testes
    { nome: 'novo/system-tests.js', carregado: verificarModulo('iniciarTestes') }
  ];
  
  // Verificar módulos já carregados
  const modulosCarregados = modulos.filter(modulo => modulo.carregado);
  const modulosNaoCarregados = modulos.filter(modulo => !modulo.carregado);
  
  console.log(`Módulos já carregados: ${modulosCarregados.length}/${modulos.length}`);
  
  // Carregar módulos não carregados
  if (modulosNaoCarregados.length > 0) {
    console.log(`Carregando ${modulosNaoCarregados.length} módulos pendentes...`);
    
    modulosNaoCarregados.forEach(modulo => {
      carregarScript(`js/${modulo.nome}`);
    });
  }
}

/**
 * Verifica se um módulo está carregado
 * @param {string} funcaoChave - Nome da função chave do módulo
 * @returns {boolean} - Indica se o módulo está carregado
 */
function verificarModulo(funcaoChave) {
  return typeof window[funcaoChave] === 'function';
}

/**
 * Carrega um script dinamicamente
 * @param {string} caminho - Caminho do script
 */
function carregarScript(caminho) {
  const script = document.createElement('script');
  script.src = caminho;
  script.async = true;
  script.onload = () => console.log(`Script carregado: ${caminho}`);
  script.onerror = () => console.error(`Erro ao carregar script: ${caminho}`);
  document.head.appendChild(script);
}

// Inicializar ambiente de testes quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initTestEnvironment);

// Exportar funções
window.initTestEnvironment = initTestEnvironment;
