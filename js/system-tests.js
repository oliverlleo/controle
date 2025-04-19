/**
 * Script de Teste para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este script testa:
 * - Integração entre módulos originais e novos
 * - Funcionalidades do sistema
 * - Responsividade
 * - Compatibilidade entre navegadores
 */

'use strict';

/**
 * Inicia os testes do sistema
 */
function iniciarTestes() {
  console.log('Iniciando testes do sistema...');
  
  // Testar carregamento de módulos
  testarCarregamentoModulos();
  
  // Testar funcionalidades principais
  testarFuncionalidadesPrincipais();
  
  // Testar novas funcionalidades
  testarNovasFuncionalidades();
  
  // Testar responsividade
  testarResponsividade();
  
  // Testar compatibilidade entre navegadores
  testarCompatibilidadeNavegadores();
}

/**
 * Testa o carregamento de todos os módulos
 */
function testarCarregamentoModulos() {
  console.log('Testando carregamento de módulos...');
  
  // Lista de funções de inicialização que devem estar disponíveis
  const funcoesInicializacao = [
    'initEnhancedSystem',
    'initUIComponents',
    'initDashboardEnhanced',
    'initFinancasSection',
    'initMetasSection',
    'initBugFixes',
    'initBrowserCompatibility',
    'initResponsiveness',
    'initFormValidation',
    'initTendenciasAnalysis',
    'initOrcamentoPlanner',
    'initRelatoriosAvancados',
    'initMetasFinanceiras'
  ];
  
  // Verificar se cada função está disponível
  const funcoesDisponiveis = funcoesInicializacao.filter(funcao => typeof window[funcao] === 'function');
  const funcoesIndisponiveis = funcoesInicializacao.filter(funcao => typeof window[funcao] !== 'function');
  
  console.log(`Funções disponíveis: ${funcoesDisponiveis.length}/${funcoesInicializacao.length}`);
  
  if (funcoesIndisponiveis.length > 0) {
    console.warn('Funções não disponíveis:', funcoesIndisponiveis);
  }
  
  // Verificar se os módulos originais estão disponíveis
  const modulosOriginais = [
    'atualizarDashboard',
    'verificarAlertas',
    'calcularPrevisoes',
    'showSection'
  ];
  
  const modulosOriginaisDisponiveis = modulosOriginais.filter(funcao => typeof window[funcao] === 'function');
  const modulosOriginaisIndisponiveis = modulosOriginais.filter(funcao => typeof window[funcao] !== 'function');
  
  console.log(`Módulos originais disponíveis: ${modulosOriginaisDisponiveis.length}/${modulosOriginais.length}`);
  
  if (modulosOriginaisIndisponiveis.length > 0) {
    console.warn('Módulos originais não disponíveis:', modulosOriginaisIndisponiveis);
  }
}

/**
 * Testa as funcionalidades principais do sistema
 */
function testarFuncionalidadesPrincipais() {
  console.log('Testando funcionalidades principais...');
  
  // Testar navegação
  testarNavegacao();
  
  // Testar dashboard
  testarDashboard();
  
  // Testar CRUD de despesas
  testarCRUDDespesas();
  
  // Testar CRUD de receitas
  testarCRUDReceitas();
  
  // Testar alertas
  testarAlertas();
  
  // Testar previsões
  testarPrevisoes();
}

/**
 * Testa a navegação entre as seções
 */
function testarNavegacao() {
  console.log('Testando navegação...');
  
  // Lista de seções que devem estar disponíveis
  const secoes = [
    'dashboardSection',
    'despesasSection',
    'rendaSection',
    'previsaoSection',
    'alertasSection',
    'categoriasSection',
    'cartoesSection',
    'relatorioSection',
    'financasSection',
    'metasSection',
    'tendenciasSection',
    'orcamentoSection',
    'metasFinanceirasSection'
  ];
  
  // Verificar se cada seção existe no DOM
  const secoesDisponiveis = secoes.filter(secao => document.getElementById(secao) !== null);
  const secoesIndisponiveis = secoes.filter(secao => document.getElementById(secao) === null);
  
  console.log(`Seções disponíveis: ${secoesDisponiveis.length}/${secoes.length}`);
  
  if (secoesIndisponiveis.length > 0) {
    console.warn('Seções não disponíveis:', secoesIndisponiveis);
  }
  
  // Testar função de navegação
  if (typeof window.showSection === 'function') {
    try {
      // Testar navegação para cada seção disponível
      secoesDisponiveis.forEach(secao => {
        window.showSection(secao);
        const secaoElement = document.getElementById(secao);
        const estaVisivel = secaoElement.style.display !== 'none';
        
        if (!estaVisivel) {
          console.warn(`Falha ao navegar para a seção: ${secao}`);
        }
      });
      
      console.log('Teste de navegação concluído');
    } catch (error) {
      console.error('Erro ao testar navegação:', error);
    }
  } else {
    console.error('Função de navegação não disponível');
  }
}

/**
 * Testa o dashboard
 */
function testarDashboard() {
  console.log('Testando dashboard...');
  
  try {
    // Verificar se o dashboard está visível
    window.showSection('dashboardSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (!dashboardSection) {
      console.error('Seção do dashboard não encontrada');
      return;
    }
    
    // Verificar se os elementos principais do dashboard existem
    const elementosDashboard = [
      'saldoAtualCard',
      'despesasMesCard',
      'receitasMesCard',
      'graficoFluxoCaixa',
      'graficoCategoriasContainer'
    ];
    
    const elementosDisponiveis = elementosDashboard.filter(elemento => 
      dashboardSection.querySelector(`#${elemento}`) !== null
    );
    
    console.log(`Elementos do dashboard disponíveis: ${elementosDisponiveis.length}/${elementosDashboard.length}`);
    
    // Testar atualização do dashboard
    if (typeof window.atualizarDashboard === 'function') {
      window.atualizarDashboard();
      console.log('Dashboard atualizado com sucesso');
    } else if (typeof window.initDashboardEnhanced === 'function') {
      window.initDashboardEnhanced();
      console.log('Dashboard aprimorado inicializado com sucesso');
    } else {
      console.warn('Função de atualização do dashboard não encontrada');
    }
  } catch (error) {
    console.error('Erro ao testar dashboard:', error);
  }
}

/**
 * Testa o CRUD de despesas
 */
function testarCRUDDespesas() {
  console.log('Testando CRUD de despesas...');
  
  try {
    // Verificar se a seção de despesas está disponível
    window.showSection('despesasSection');
    const despesasSection = document.getElementById('despesasSection');
    
    if (!despesasSection) {
      console.error('Seção de despesas não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosDespesas = [
      'despesasTable',
      'addDespesaBtn'
    ];
    
    const elementosDisponiveis = elementosDespesas.filter(elemento => 
      despesasSection.querySelector(`#${elemento}`) !== null
    );
    
    console.log(`Elementos de despesas disponíveis: ${elementosDisponiveis.length}/${elementosDespesas.length}`);
    
    // Testar carregamento de despesas
    if (typeof window.carregarTodasDespesas === 'function') {
      window.carregarTodasDespesas();
      console.log('Despesas carregadas com sucesso');
    } else {
      console.warn('Função de carregamento de despesas não encontrada');
    }
    
    // Verificar se o modal de adicionar despesa existe
    const addDespesaModal = document.getElementById('addDespesaModal');
    if (addDespesaModal) {
      console.log('Modal de adicionar despesa encontrado');
    } else {
      console.warn('Modal de adicionar despesa não encontrado');
    }
  } catch (error) {
    console.error('Erro ao testar CRUD de despesas:', error);
  }
}

/**
 * Testa o CRUD de receitas
 */
function testarCRUDReceitas() {
  console.log('Testando CRUD de receitas...');
  
  try {
    // Verificar se a seção de receitas está disponível
    window.showSection('rendaSection');
    const rendaSection = document.getElementById('rendaSection');
    
    if (!rendaSection) {
      console.error('Seção de receitas não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosReceitas = [
      'rendasTable',
      'addRendaBtn'
    ];
    
    const elementosDisponiveis = elementosReceitas.filter(elemento => 
      rendaSection.querySelector(`#${elemento}`) !== null
    );
    
    console.log(`Elementos de receitas disponíveis: ${elementosDisponiveis.length}/${elementosReceitas.length}`);
    
    // Testar carregamento de receitas
    if (typeof window.loadRendas === 'function') {
      window.loadRendas();
      console.log('Receitas carregadas com sucesso');
    } else {
      console.warn('Função de carregamento de receitas não encontrada');
    }
    
    // Verificar se o modal de adicionar receita existe
    const addRendaModal = document.getElementById('addRendaModal');
    if (addRendaModal) {
      console.log('Modal de adicionar receita encontrado');
    } else {
      console.warn('Modal de adicionar receita não encontrado');
    }
  } catch (error) {
    console.error('Erro ao testar CRUD de receitas:', error);
  }
}

/**
 * Testa o sistema de alertas
 */
function testarAlertas() {
  console.log('Testando sistema de alertas...');
  
  try {
    // Verificar se a seção de alertas está disponível
    window.showSection('alertasSection');
    const alertasSection = document.getElementById('alertasSection');
    
    if (!alertasSection) {
      console.error('Seção de alertas não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosAlertas = [
      'alertasContainer'
    ];
    
    const elementosDisponiveis = elementosAlertas.filter(elemento => 
      alertasSection.querySelector(`#${elemento}`) !== null
    );
    
    console.log(`Elementos de alertas disponíveis: ${elementosDisponiveis.length}/${elementosAlertas.length}`);
    
    // Testar verificação de alertas
    if (typeof window.verificarAlertas === 'function') {
      window.verificarAlertas();
      console.log('Alertas verificados com sucesso');
    } else if (typeof window.novo_verificarAlertas === 'function') {
      window.novo_verificarAlertas();
      console.log('Alertas verificados com sucesso (nova função)');
    } else {
      console.warn('Função de verificação de alertas não encontrada');
    }
  } catch (error) {
    console.error('Erro ao testar sistema de alertas:', error);
  }
}

/**
 * Testa o sistema de previsões
 */
function testarPrevisoes() {
  console.log('Testando sistema de previsões...');
  
  try {
    // Verificar se a seção de previsões está disponível
    window.showSection('previsaoSection');
    const previsaoSection = document.getElementById('previsaoSection');
    
    if (!previsaoSection) {
      console.error('Seção de previsões não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosPrevisoes = [
      'previsaoContainer'
    ];
    
    const elementosDisponiveis = elementosPrevisoes.filter(elemento => 
      previsaoSection.querySelector(`#${elemento}`) !== null
    );
    
    console.log(`Elementos de previsões disponíveis: ${elementosDisponiveis.length}/${elementosPrevisoes.length}`);
    
    // Testar cálculo de previsões
    if (typeof window.calcularPrevisoes === 'function') {
      window.calcularPrevisoes();
      console.log('Previsões calculadas com sucesso');
    } else if (typeof window.novo_calcularPrevisoes === 'function') {
      window.novo_calcularPrevisoes();
      console.log('Previsões calculadas com sucesso (nova função)');
    } else {
      console.warn('Função de cálculo de previsões não encontrada');
    }
  } catch (error) {
    console.error('Erro ao testar sistema de previsões:', error);
  }
}

/**
 * Testa as novas funcionalidades implementadas
 */
function testarNovasFuncionalidades() {
  console.log('Testando novas funcionalidades...');
  
  // Testar análise de tendências
  testarAnaliseTendencias();
  
  // Testar planejamento orçamentário
  testarPlanejamentoOrcamentario();
  
  // Testar relatórios avançados
  testarRelatoriosAvancados();
  
  // Testar metas financeiras
  testarMetasFinanceiras();
}

/**
 * Testa o módulo de análise de tendências
 */
function testarAnaliseTendencias() {
  console.log('Testando módulo de análise de tendências...');
  
  try {
    // Verificar se a seção de tendências está disponível
    window.showSection('tendenciasSection');
    const tendenciasSection = document.getElementById('tendenciasSection');
    
    if (!tendenciasSection) {
      console.error('Seção de tendências não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosTendencias = [
      'tendenciasGastosGrafico',
      'categoriasAltaContainer',
      'previsaoGastosGrafico',
      'recomendacoesContainer'
    ];
    
    const elementosDisponiveis = elementosTendencias.filter(elemento => 
      tendenciasSection.querySelector(`#${elemento}`) !== null
    );
    
    console.log(`Elementos de tendências disponíveis: ${elementosDisponiveis.length}/${elementosTendencias.length}`);
    
    // Testar inicialização do módulo
    if (typeof window.initTendenciasAnalysis === 'function') {
      window.initTendenciasAnalysis();
      console.log('Módulo de tendências inicializado com sucesso');
    } else {
      console.warn('Função de inicialização de tendências não encontrada');
    }
    
    // Testar atualização de tendências
    if (typeof window.atualizarTendencias === 'function') {
      window.atualizarTendencias();
      console.log('Tendências atualizadas com sucesso');
    } else {
      console.warn('Função de atualização de tendências não encontrada');
    }
  } catch (error) {
    console.error('Erro ao testar módulo de tendências:', error);
  }
}

/**
 * Testa o módulo de planejamento orçamentário
 */
function testarPlanejamentoOrcamentario() {
  console.log('Testando módulo de planejamento orçamentário...');
  
  try {
    // Verificar se a seção de orçamento está disponível
    window.showSection('orcamentoSection');
    const orcamentoSection = document.getElementById('orcamentoSection');
    
    if (!orcamentoSection) {
      console.error('Seção de orçamento não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosOrcamento = [
      'resumoOrcamentoContainer',
      'progressoCategoriasContainer',
      'detalhesOrcamentoContainer',
      'novoOrcamentoModal'
    ];
    
    const elementosDisponiveis = elementosOrcamento.filter(elemento => 
      document.getElementById(elemento) !== null
    );
    
    console.log(`Elementos de orçamento disponíveis: ${elementosDisponiveis.length}/${elementosOrcamento.length}`);
    
    // Testar inicialização do módulo
    if (typeof window.initOrcamentoPlanner === 'function') {
      window.initOrcamentoPlanner();
      console.log('Módulo de orçamento inicializado com sucesso');
    } else {
      console.warn('Função de inicialização de orçamento não encontrada');
    }
    
    // Testar atualização de orçamento
    if (typeof window.atualizarOrcamento === 'function') {
      window.atualizarOrcamento();
      console.log('Orçamento atualizado com sucesso');
    } else {
      console.warn('Função de atualização de orçamento não encontrada');
    }
  } catch (error) {
    console.error('Erro ao testar módulo de orçamento:', error);
  }
}

/**
 * Testa o módulo de relatórios avançados
 */
function testarRelatoriosAvancados() {
  console.log('Testando módulo de relatórios avançados...');
  
  try {
    // Verificar se a seção de relatórios está disponível
    window.showSection('relatorioSection');
    const relatorioSection = document.getElementById('relatorioSection');
    
    if (!relatorioSection) {
      console.error('Seção de relatórios não encontrada');
      return;
    }
    
    // Verificar se os elementos principais existem
    const elementosRelatorios = [
      'resumoFinanceiroContent',
      'despesasCategoriasContent',
      'fluxoCaixaContent',
      'comparativoContent'
    ];
    
   
(Content truncated due to size limit. Use line ranges to read in chunks)