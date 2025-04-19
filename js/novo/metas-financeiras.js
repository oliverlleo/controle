/**
 * Módulo de Metas Financeiras para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Criação e gerenciamento de metas financeiras
 * - Acompanhamento de progresso
 * - Sugestões para atingir metas
 */

'use strict';

/**
 * Inicializa o módulo de metas financeiras
 */
function initMetasFinanceiras() {
  setupMetasUI();
  loadMetasData();
}

/**
 * Configura a interface do usuário para metas financeiras
 */
function setupMetasUI() {
  // Criar seção de metas se não existir
  if (!document.getElementById('metasFinanceirasSection')) {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    
    const metasSection = document.createElement('section');
    metasSection.id = 'metasFinanceirasSection';
    metasSection.className = 'container';
    metasSection.style.display = 'none';
    
    metasSection.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-bullseye"></i> Metas Financeiras</h2>
        <div class="page-actions">
          <button class="btn btn-success" onclick="abrirModalNovaMeta()">
            <i class="fas fa-plus"></i>
            <span>Nova Meta</span>
          </button>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Metas em Andamento</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-hourglass-half"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="metasAndamentoContainer"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Metas Concluídas</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="metasConcluidasContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Detalhes da Meta</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-info-circle"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="detalhesMetaContainer">
                <div class="empty-state">
                  <i class="fas fa-hand-pointer empty-state-icon"></i>
                  <h3>Selecione uma meta</h3>
                  <p>Clique em uma meta para ver seus detalhes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal de Nova Meta -->
      <div id="novaMetaModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Nova Meta Financeira</h2>
            <button class="close" onclick="fecharModal('novaMetaModal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Título:</label>
              <input type="text" id="novaMetaTitulo" class="form-control" placeholder="Ex: Comprar um carro" required>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição:</label>
              <textarea id="novaMetaDescricao" class="form-control" placeholder="Descreva sua meta..." rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Valor Alvo (R$):</label>
              <input type="number" id="novaMetaValorAlvo" class="form-control" placeholder="Quanto você precisa economizar?" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label class="form-label">Valor Inicial (R$):</label>
              <input type="number" id="novaMetaValorInicial" class="form-control" placeholder="Quanto você já tem guardado?" step="0.01" min="0" value="0">
            </div>
            <div class="form-group">
              <label class="form-label">Data Limite:</label>
              <input type="date" id="novaMetaDataLimite" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Prioridade:</label>
              <select id="novaMetaPrioridade" class="form-control">
                <option value="alta">Alta</option>
                <option value="media" selected>Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Categoria:</label>
              <select id="novaMetaCategoria" class="form-control">
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="imovel">Imóvel</option>
                <option value="veiculo">Veículo</option>
                <option value="educacao">Educação</option>
                <option value="viagem">Viagem</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="salvarNovaMeta()">Salvar</button>
            <button class="btn btn-outline" onclick="fecharModal('novaMetaModal')">Cancelar</button>
          </div>
        </div>
      </div>
      
      <!-- Modal de Depósito -->
      <div id="depositoMetaModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Adicionar Depósito</h2>
            <button class="close" onclick="fecharModal('depositoMetaModal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Valor (R$):</label>
              <input type="number" id="depositoMetaValor" class="form-control" placeholder="Valor do depósito" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label class="form-label">Data:</label>
              <input type="date" id="depositoMetaData" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Observação:</label>
              <textarea id="depositoMetaObservacao" class="form-control" placeholder="Observação (opcional)" rows="2"></textarea>
            </div>
            <input type="hidden" id="depositoMetaId">
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="salvarDeposito()">Salvar</button>
            <button class="btn btn-outline" onclick="fecharModal('depositoMetaModal')">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    
    mainElement.appendChild(metasSection);
    
    // Adicionar link no menu lateral
    const navGroup = document.querySelector('#sidebar .nav-group:nth-child(2)');
    if (navGroup) {
      const metasLink = document.createElement('a');
      metasLink.href = '#';
      metasLink.className = 'nav-link';
      metasLink.dataset.section = 'metasFinanceirasSection';
      metasLink.innerHTML = '<i class="fa-solid fa-bullseye"></i><span>Metas</span>';
      metasLink.addEventListener('click', function(event) {
        event.preventDefault();
        showSectionEnhanced('metasFinanceirasSection');
      });
      
      navGroup.appendChild(metasLink);
    }
  }
  
  // Configurar data atual para os campos de data
  const hoje = new Date();
  const dataHoje = hoje.toISOString().split('T')[0];
  
  const dataLimiteInput = document.getElementById('novaMetaDataLimite');
  if (dataLimiteInput) {
    // Definir data mínima como hoje
    dataLimiteInput.min = dataHoje;
    
    // Definir data padrão como 1 ano a partir de hoje
    const dataProximoAno = new Date(hoje.getFullYear() + 1, hoje.getMonth(), hoje.getDate()).toISOString().split('T')[0];
    dataLimiteInput.value = dataProximoAno;
  }
  
  const depositoDataInput = document.getElementById('depositoMetaData');
  if (depositoDataInput) {
    depositoDataInput.value = dataHoje;
    depositoDataInput.max = dataHoje;
  }
}

/**
 * Carrega os dados das metas
 */
function loadMetasData() {
  const metasAndamentoContainer = document.getElementById('metasAndamentoContainer');
  const metasConcluidasContainer = document.getElementById('metasConcluidasContainer');
  
  if (!metasAndamentoContainer || !metasConcluidasContainer) return;
  
  // Exibir indicador de carregamento
  metasAndamentoContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando metas...</div>';
  metasConcluidasContainer.innerHTML = '';
  
  // Obter metas do Firebase
  db.ref("metas").once("value").then(snapshot => {
    const metasAndamento = [];
    const metasConcluidas = [];
    
    snapshot.forEach(child => {
      const meta = {
        id: child.key,
        ...child.val()
      };
      
      // Calcular progresso
      const valorAtual = calcularValorAtualMeta(meta);
      const valorAlvo = parseFloat(meta.valorAlvo) || 0;
      const progresso = valorAlvo > 0 ? (valorAtual / valorAlvo) * 100 : 0;
      
      meta.valorAtual = valorAtual;
      meta.progresso = progresso;
      
      // Verificar se está concluída
      if (progresso >= 100) {
        metasConcluidas.push(meta);
      } else {
        metasAndamento.push(meta);
      }
    });
    
    // Ordenar metas em andamento por progresso (decrescente)
    metasAndamento.sort((a, b) => b.progresso - a.progresso);
    
    // Ordenar metas concluídas por data de conclusão (mais recente primeiro)
    metasConcluidas.sort((a, b) => {
      const dataA = obterDataConclusao(a);
      const dataB = obterDataConclusao(b);
      return dataB - dataA;
    });
    
    // Renderizar metas em andamento
    if (metasAndamento.length > 0) {
      metasAndamentoContainer.innerHTML = '';
      
      metasAndamento.forEach(meta => {
        const metaCard = criarCardMeta(meta);
        metasAndamentoContainer.appendChild(metaCard);
      });
    } else {
      metasAndamentoContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bullseye empty-state-icon"></i>
          <h3>Nenhuma meta em andamento</h3>
          <p>Crie uma nova meta para começar a acompanhar seu progresso.</p>
          <button class="btn btn-primary mt-3" onclick="abrirModalNovaMeta()">
            <i class="fas fa-plus"></i> Criar Meta
          </button>
        </div>
      `;
    }
    
    // Renderizar metas concluídas
    if (metasConcluidas.length > 0) {
      metasConcluidasContainer.innerHTML = '';
      
      metasConcluidas.forEach(meta => {
        const metaCard = criarCardMeta(meta, true);
        metasConcluidasContainer.appendChild(metaCard);
      });
    } else {
      metasConcluidasContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle empty-state-icon"></i>
          <h3>Nenhuma meta concluída</h3>
          <p>Suas metas concluídas aparecerão aqui.</p>
        </div>
      `;
    }
  }).catch(error => {
    console.error("Erro ao carregar metas:", error);
    metasAndamentoContainer.innerHTML = '<div class="error-message">Erro ao carregar metas. Tente novamente.</div>';
  });
}

/**
 * Calcula o valor atual de uma meta
 * @param {Object} meta - Objeto da meta
 * @returns {number} - Valor atual da meta
 */
function calcularValorAtualMeta(meta) {
  const valorInicial = parseFloat(meta.valorInicial) || 0;
  let valorDepositos = 0;
  
  if (meta.depositos) {
    valorDepositos = Object.values(meta.depositos).reduce((sum, deposito) => {
      return sum + (parseFloat(deposito.valor) || 0);
    }, 0);
  }
  
  return valorInicial + valorDepositos;
}

/**
 * Obtém a data de conclusão de uma meta
 * @param {Object} meta - Objeto da meta
 * @returns {Date} - Data de conclusão da meta
 */
function obterDataConclusao(meta) {
  if (!meta.depositos) return new Date(meta.dataCriacao);
  
  // Encontrar o depósito que completou a meta
  const valorAlvo = parseFloat(meta.valorAlvo) || 0;
  const valorInicial = parseFloat(meta.valorInicial) || 0;
  let valorAcumulado = valorInicial;
  let dataUltimoDeposito = new Date(meta.dataCriacao);
  
  const depositos = Object.values(meta.depositos).sort((a, b) => {
    return new Date(a.data) - new Date(b.data);
  });
  
  for (const deposito of depositos) {
    valorAcumulado += parseFloat(deposito.valor) || 0;
    dataUltimoDeposito = new Date(deposito.data);
    
    if (valorAcumulado >= valorAlvo) {
      return dataUltimoDeposito;
    }
  }
  
  return dataUltimoDeposito;
}

/**
 * Cria um card para uma meta
 * @param {Object} meta - Objeto da meta
 * @param {boolean} concluida - Indica se a meta está concluída
 * @returns {HTMLElement} - Elemento do card
 */
function criarCardMeta(meta, concluida = false) {
  const card = document.createElement('div');
  card.className = 'meta-card';
  card.dataset.metaId = meta.id;
  
  // Definir classe baseada na prioridade
  if (meta.prioridade) {
    card.classList.add(`prioridade-${meta.prioridade}`);
  }
  
  // Calcular dias restantes
  let diasRestantes = '';
  if (meta.dataLimite && !concluida) {
    const hoje = new Date();
    const dataLimite = new Date(meta.dataLimite);
    const diffTempo = dataLimite - hoje;
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
    
    if (diffDias > 0) {
      diasRestantes = `${diffDias} dias restantes`;
    } else if (diffDias === 0) {
      diasRestantes = 'Último dia';
    } else {
      diasRestantes = `${Math.abs(diffDias)} dias atrasada`;
    }
  }
  
  // Obter ícone baseado na categoria
  let iconeCategoria = 'fa-piggy-bank';
  switch (meta.categoria) {
    case 'investimento': iconeCategoria = 'fa-chart-line'; break;
    case 'imovel': iconeCategoria = 'fa-home'; break;
    case 'veiculo': iconeCategoria = 'fa-car'; break;
    case 'educacao': iconeCategoria = 'fa-graduation-cap'; break;
    case 'viagem': iconeCategoria = 'fa-plane'; break;
  }
  
  // Criar conteúdo do card
  card.innerHTML = `
    <div class="meta-card-header">
      <div class="meta-card-icon">
        <i class="fas ${iconeCategoria}"></i>
      </div>
      <div class="meta-card-title">${meta.titulo}</div>
    </div>
    <div class="meta-card-progress">
      <div class="progresso-barra-container">
        <div class="progresso-barra ${concluida ? 'bg-success' : ''}" style="width: ${Math.min(100, meta.progresso)}%"></div>
      </div>
      <div class="meta-card-progress-text">
        ${meta.progresso.toFixed(1)}% concluído
      </div>
    </div>
    <div class="meta-card-info">
      <div class="meta-card-valor">
        <span>R$ ${meta.valorAtual.toFixed(2)}</span> / R$ ${parseFloat(meta.valorAlvo).toFixed(2)}
      </div>
      ${diasRestantes ? `<div class="meta-card-prazo">${diasRestantes}</div>` : ''}
    </div>
  `;
  
  // Adicionar evento de clique
  card.addEventListener('click', function() {
    exibirDetalhesMeta(meta.id);
  });
  
  return card;
}

/**
 * Exibe os detalhes de uma meta
 * @param {string} metaId - ID da meta
 */
function exibirDetalhesMeta(metaId) {
  const detalhesContainer = document.getElementById('detalhesMetaContainer');
  if (!detalhesContainer) return;
  
  // Exibir indicador de carregamento
  detalhesContainer.innerHTML = '<div class="loading-spinner"><i c
(Content truncated due to size limit. Use line ranges to read in chunks)
