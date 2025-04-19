/**
 * Módulo de Metas Financeiras para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Criação e gerenciamento de metas financeiras
 * - Acompanhamento de progresso
 * - Projeções para atingir metas
 */

'use strict';

/**
 * Inicializa a seção de metas financeiras
 */
function initMetasSection() {
  loadMetas();
  setupMetasTabs();
}

/**
 * Configura as tabs da seção de metas
 */
function setupMetasTabs() {
  // Já implementado pelo módulo ui-components.js
  // As tabs são inicializadas automaticamente
}

/**
 * Carrega as metas financeiras
 */
function loadMetas() {
  const metasContainer = document.getElementById('metasContainer');
  if (!metasContainer) return;
  
  metasContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando metas...</div>';
  
  // Verificar se já existem metas cadastradas
  db.ref("metas_financeiras").once("value").then(snapshot => {
    if (snapshot.exists()) {
      // Renderizar metas existentes
      renderMetas(snapshot.val());
    } else {
      // Mostrar mensagem de que não há metas cadastradas
      metasContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bullseye empty-state-icon"></i>
          <h3>Nenhuma meta financeira cadastrada</h3>
          <p>Crie metas financeiras para acompanhar seu progresso e planejar seu futuro financeiro.</p>
          <button class="btn btn-primary mt-3" onclick="abrirModalNovaMeta()">
            <i class="fas fa-plus"></i> Criar Primeira Meta
          </button>
        </div>
      `;
    }
  }).catch(error => {
    console.error("Erro ao carregar metas:", error);
    metasContainer.innerHTML = '<div class="error-message">Erro ao carregar metas. Tente novamente.</div>';
  });
}

/**
 * Renderiza as metas financeiras
 * @param {Object} metas - Objeto com as metas financeiras
 */
function renderMetas(metas) {
  const metasContainer = document.getElementById('metasContainer');
  if (!metasContainer) return;
  
  metasContainer.innerHTML = '';
  
  // Verificar se há metas
  if (Object.keys(metas).length === 0) {
    metasContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bullseye empty-state-icon"></i>
        <h3>Nenhuma meta financeira cadastrada</h3>
        <p>Crie metas financeiras para acompanhar seu progresso e planejar seu futuro financeiro.</p>
        <button class="btn btn-primary mt-3" onclick="abrirModalNovaMeta()">
          <i class="fas fa-plus"></i> Criar Primeira Meta
        </button>
      </div>
    `;
    return;
  }
  
  // Separar metas em categorias
  const metasEmAndamento = [];
  const metasConcluidas = [];
  
  Object.entries(metas).forEach(([key, meta]) => {
    meta.id = key;
    
    if (meta.concluida) {
      metasConcluidas.push(meta);
    } else {
      metasEmAndamento.push(meta);
    }
  });
  
  // Ordenar metas em andamento por prazo (mais próximas primeiro)
  metasEmAndamento.sort((a, b) => {
    const dataA = new Date(a.prazo);
    const dataB = new Date(b.prazo);
    return dataA - dataB;
  });
  
  // Ordenar metas concluídas por data de conclusão (mais recentes primeiro)
  metasConcluidas.sort((a, b) => {
    const dataA = new Date(a.dataConclusao || 0);
    const dataB = new Date(b.dataConclusao || 0);
    return dataB - dataA;
  });
  
  // Criar container para metas em andamento
  if (metasEmAndamento.length > 0) {
    const metasEmAndamentoSection = document.createElement('div');
    metasEmAndamentoSection.className = 'content-section';
    
    const header = document.createElement('div');
    header.className = 'content-header';
    
    const title = document.createElement('h3');
    title.className = 'content-title';
    title.textContent = 'Metas em Andamento';
    
    header.appendChild(title);
    metasEmAndamentoSection.appendChild(header);
    
    // Grid de cards
    const metasGrid = document.createElement('div');
    metasGrid.className = 'dashboard-cards';
    
    metasEmAndamento.forEach(meta => {
      const metaCard = criarCardMeta(meta);
      metasGrid.appendChild(metaCard);
    });
    
    metasEmAndamentoSection.appendChild(metasGrid);
    metasContainer.appendChild(metasEmAndamentoSection);
  }
  
  // Criar container para metas concluídas
  if (metasConcluidas.length > 0) {
    const metasConcluidasSection = document.createElement('div');
    metasConcluidasSection.className = 'content-section';
    
    const header = document.createElement('div');
    header.className = 'content-header';
    
    const title = document.createElement('h3');
    title.className = 'content-title';
    title.textContent = 'Metas Concluídas';
    
    header.appendChild(title);
    metasConcluidasSection.appendChild(header);
    
    // Grid de cards
    const metasGrid = document.createElement('div');
    metasGrid.className = 'dashboard-cards';
    
    metasConcluidas.forEach(meta => {
      const metaCard = criarCardMeta(meta);
      metasGrid.appendChild(metaCard);
    });
    
    metasConcluidasSection.appendChild(metasGrid);
    metasContainer.appendChild(metasConcluidasSection);
  }
  
  // Botão para adicionar nova meta
  const addButton = document.createElement('button');
  addButton.className = 'btn btn-primary btn-block mt-3';
  addButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar Nova Meta';
  addButton.addEventListener('click', abrirModalNovaMeta);
  
  metasContainer.appendChild(addButton);
}

/**
 * Cria um card para uma meta financeira
 * @param {Object} meta - Dados da meta
 * @returns {HTMLElement} - Elemento do card
 */
function criarCardMeta(meta) {
  const valorAtual = parseFloat(meta.valorAtual) || 0;
  const valorMeta = parseFloat(meta.valorMeta) || 1; // Evitar divisão por zero
  const progresso = Math.min(100, (valorAtual / valorMeta) * 100);
  
  // Calcular dias restantes
  let diasRestantes = '';
  let statusClass = '';
  
  if (!meta.concluida && meta.prazo) {
    const hoje = new Date();
    const prazo = new Date(meta.prazo);
    const diffTime = prazo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      diasRestantes = 'Meta atrasada';
      statusClass = 'text-danger';
    } else if (diffDays === 0) {
      diasRestantes = 'Último dia';
      statusClass = 'text-warning';
    } else {
      diasRestantes = `${diffDays} dias restantes`;
    }
  }
  
  // Criar card
  const card = document.createElement('div');
  card.className = 'meta-card';
  
  // Cabeçalho
  const header = document.createElement('div');
  header.className = 'meta-header';
  
  const title = document.createElement('div');
  title.className = 'meta-title';
  title.textContent = meta.titulo;
  
  const value = document.createElement('div');
  value.className = 'meta-value';
  value.textContent = `R$ ${valorAtual.toFixed(2)} / R$ ${valorMeta.toFixed(2)}`;
  
  header.appendChild(title);
  header.appendChild(value);
  card.appendChild(header);
  
  // Progresso
  const progressContainer = document.createElement('div');
  progressContainer.className = 'meta-progress';
  
  const progressBar = document.createElement('div');
  progressBar.className = 'meta-progress-bar';
  progressBar.style.width = `${progresso}%`;
  
  progressContainer.appendChild(progressBar);
  card.appendChild(progressContainer);
  
  // Detalhes
  const details = document.createElement('div');
  details.className = 'meta-details';
  
  const status = document.createElement('div');
  status.className = statusClass;
  
  if (meta.concluida) {
    status.textContent = 'Concluída';
    status.className = 'text-success';
  } else {
    status.textContent = diasRestantes;
  }
  
  const percentual = document.createElement('div');
  percentual.textContent = `${Math.round(progresso)}% concluído`;
  
  details.appendChild(status);
  details.appendChild(percentual);
  card.appendChild(details);
  
  // Ações
  const actions = document.createElement('div');
  actions.className = 'd-flex justify-between mt-2';
  
  const updateBtn = document.createElement('button');
  updateBtn.className = 'btn btn-sm btn-outline';
  updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
  updateBtn.addEventListener('click', () => abrirModalAtualizarMeta(meta));
  
  const moreBtn = document.createElement('button');
  moreBtn.className = 'btn btn-sm btn-outline';
  moreBtn.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
  moreBtn.addEventListener('click', () => abrirMenuOpcoesMeta(meta, moreBtn));
  
  actions.appendChild(updateBtn);
  actions.appendChild(moreBtn);
  card.appendChild(actions);
  
  return card;
}

/**
 * Abre o modal para criar uma nova meta
 */
function abrirModalNovaMeta() {
  // Implementação do modal
  console.log("Abrir modal para nova meta");
  // Esta função seria implementada com um modal real
}

/**
 * Abre o modal para atualizar uma meta
 * @param {Object} meta - Dados da meta a ser atualizada
 */
function abrirModalAtualizarMeta(meta) {
  // Implementação do modal
  console.log("Abrir modal para atualizar meta:", meta);
  // Esta função seria implementada com um modal real
}

/**
 * Abre o menu de opções para uma meta
 * @param {Object} meta - Dados da meta
 * @param {HTMLElement} buttonElement - Elemento do botão que foi clicado
 */
function abrirMenuOpcoesMeta(meta, buttonElement) {
  // Implementação do menu de opções
  console.log("Abrir menu de opções para meta:", meta);
  // Esta função seria implementada com um menu dropdown real
}

/**
 * Calcula projeções para atingir uma meta
 * @param {Object} meta - Dados da meta
 * @returns {Object} - Projeções calculadas
 */
function calcularProjecoesMeta(meta) {
  const valorAtual = parseFloat(meta.valorAtual) || 0;
  const valorMeta = parseFloat(meta.valorMeta) || 0;
  const valorRestante = valorMeta - valorAtual;
  
  if (valorRestante <= 0) {
    return {
      concluida: true,
      valorRestante: 0,
      valorMensal: 0,
      valorSemanal: 0,
      valorDiario: 0,
      diasRestantes: 0
    };
  }
  
  // Calcular dias restantes
  const hoje = new Date();
  const prazo = new Date(meta.prazo);
  const diffTime = prazo - hoje;
  const diasRestantes = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  // Calcular valores necessários
  const valorDiario = valorRestante / diasRestantes;
  const valorSemanal = valorDiario * 7;
  const valorMensal = valorDiario * 30;
  
  return {
    concluida: false,
    valorRestante,
    valorMensal,
    valorSemanal,
    valorDiario,
    diasRestantes
  };
}

/**
 * Salva uma nova meta financeira
 * @param {Object} meta - Dados da meta a ser salva
 * @returns {Promise} - Promessa que resolve quando a meta for salva
 */
function salvarMeta(meta) {
  return db.ref("metas_financeiras").push(meta);
}

/**
 * Atualiza uma meta financeira existente
 * @param {string} metaId - ID da meta a ser atualizada
 * @param {Object} dadosAtualizados - Dados atualizados da meta
 * @returns {Promise} - Promessa que resolve quando a meta for atualizada
 */
function atualizarMeta(metaId, dadosAtualizados) {
  return db.ref(`metas_financeiras/${metaId}`).update(dadosAtualizados);
}

/**
 * Exclui uma meta financeira
 * @param {string} metaId - ID da meta a ser excluída
 * @returns {Promise} - Promessa que resolve quando a meta for excluída
 */
function excluirMeta(metaId) {
  return db.ref(`metas_financeiras/${metaId}`).remove();
}

/**
 * Marca uma meta como concluída
 * @param {string} metaId - ID da meta a ser marcada como concluída
 * @returns {Promise} - Promessa que resolve quando a meta for marcada como concluída
 */
function concluirMeta(metaId) {
  return db.ref(`metas_financeiras/${metaId}`).update({
    concluida: true,
    dataConclusao: new Date().toISOString()
  });
}

// Exportar funções
window.initMetasSection = initMetasSection;
window.abrirModalNovaMeta = abrirModalNovaMeta;
window.abrirModalAtualizarMeta = abrirModalAtualizarMeta;
window.calcularProjecoesMeta = calcularProjecoesMeta;
window.salvarMeta = salvarMeta;
window.atualizarMeta = atualizarMeta;
window.excluirMeta = excluirMeta;
window.concluirMeta = concluirMeta;
