/**
 * Módulo de Planejamento Orçamentário para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Criação e gerenciamento de orçamentos mensais
 * - Acompanhamento de gastos por categoria
 * - Alertas de limite de orçamento
 */

'use strict';

/**
 * Inicializa o módulo de planejamento orçamentário
 */
function initOrcamentoPlanner() {
  setupOrcamentoUI();
  loadOrcamentoData();
}

/**
 * Configura a interface do usuário para planejamento orçamentário
 */
function setupOrcamentoUI() {
  // Criar seção de orçamento se não existir
  if (!document.getElementById('orcamentoSection')) {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    
    const orcamentoSection = document.createElement('section');
    orcamentoSection.id = 'orcamentoSection';
    orcamentoSection.className = 'container';
    orcamentoSection.style.display = 'none';
    
    orcamentoSection.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-money-bill-wave"></i> Planejamento Orçamentário</h2>
        <div class="page-actions">
          <div class="form-group mb-0">
            <select id="orcamentoMes" class="form-control">
              <option value="0">Janeiro</option>
              <option value="1">Fevereiro</option>
              <option value="2">Março</option>
              <option value="3">Abril</option>
              <option value="4">Maio</option>
              <option value="5">Junho</option>
              <option value="6">Julho</option>
              <option value="7">Agosto</option>
              <option value="8">Setembro</option>
              <option value="9">Outubro</option>
              <option value="10">Novembro</option>
              <option value="11">Dezembro</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <select id="orcamentoAno" class="form-control">
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="atualizarOrcamento()">
            <i class="fas fa-sync-alt"></i>
            <span>Atualizar</span>
          </button>
          <button class="btn btn-success" onclick="abrirModalNovoOrcamento()">
            <i class="fas fa-plus"></i>
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Resumo do Orçamento</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-chart-pie"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="resumoOrcamentoContainer"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Progresso por Categoria</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-tasks"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="progressoCategoriasContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Detalhes do Orçamento</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-list"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="detalhesOrcamentoContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal de Novo Orçamento -->
      <div id="novoOrcamentoModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Novo Orçamento</h2>
            <button class="close" onclick="fecharModal('novoOrcamentoModal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Mês:</label>
              <select id="novoOrcamentoMes" class="form-control">
                <option value="0">Janeiro</option>
                <option value="1">Fevereiro</option>
                <option value="2">Março</option>
                <option value="3">Abril</option>
                <option value="4">Maio</option>
                <option value="5">Junho</option>
                <option value="6">Julho</option>
                <option value="7">Agosto</option>
                <option value="8">Setembro</option>
                <option value="9">Outubro</option>
                <option value="10">Novembro</option>
                <option value="11">Dezembro</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Ano:</label>
              <select id="novoOrcamentoAno" class="form-control">
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Renda Total:</label>
              <input type="number" id="novoOrcamentoRenda" class="form-control" placeholder="Renda total do mês" step="0.01" required>
            </div>
            <div id="novoOrcamentoCategorias">
              <!-- Preenchido dinamicamente -->
            </div>
            <button class="btn btn-sm btn-outline mt-2" onclick="adicionarCategoriaOrcamento()">
              <i class="fas fa-plus"></i> Adicionar Categoria
            </button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="salvarNovoOrcamento()">Salvar</button>
            <button class="btn btn-outline" onclick="fecharModal('novoOrcamentoModal')">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    
    mainElement.appendChild(orcamentoSection);
    
    // Adicionar link no menu lateral
    const navGroup = document.querySelector('#sidebar .nav-group:nth-child(2)');
    if (navGroup) {
      const orcamentoLink = document.createElement('a');
      orcamentoLink.href = '#';
      orcamentoLink.className = 'nav-link';
      orcamentoLink.dataset.section = 'orcamentoSection';
      orcamentoLink.innerHTML = '<i class="fa-solid fa-money-bill-wave"></i><span>Orçamento</span>';
      orcamentoLink.addEventListener('click', function(event) {
        event.preventDefault();
        showSectionEnhanced('orcamentoSection');
      });
      
      navGroup.appendChild(orcamentoLink);
    }
  }
  
  // Configurar eventos
  const mesSelect = document.getElementById('orcamentoMes');
  const anoSelect = document.getElementById('orcamentoAno');
  
  if (mesSelect && anoSelect) {
    // Definir mês e ano atuais como padrão
    const hoje = new Date();
    mesSelect.value = hoje.getMonth();
    anoSelect.value = hoje.getFullYear();
    
    // Adicionar eventos de mudança
    mesSelect.addEventListener('change', atualizarOrcamento);
    anoSelect.addEventListener('change', atualizarOrcamento);
  }
}

/**
 * Carrega os dados do orçamento
 */
function loadOrcamentoData() {
  const mes = parseInt(document.getElementById('orcamentoMes')?.value || new Date().getMonth());
  const ano = parseInt(document.getElementById('orcamentoAno')?.value || new Date().getFullYear());
  
  const resumoContainer = document.getElementById('resumoOrcamentoContainer');
  const progressoContainer = document.getElementById('progressoCategoriasContainer');
  const detalhesContainer = document.getElementById('detalhesOrcamentoContainer');
  
  if (!resumoContainer || !progressoContainer || !detalhesContainer) return;
  
  // Exibir indicador de carregamento
  resumoContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  progressoContainer.innerHTML = '';
  detalhesContainer.innerHTML = '';
  
  // Verificar se existe orçamento para o mês/ano selecionado
  db.ref(`orcamentos/${ano}/${mes}`).once("value").then(snapshot => {
    if (snapshot.exists()) {
      const orcamento = snapshot.val();
      
      // Obter despesas do mês
      obterDespesasMes(mes, ano).then(despesas => {
        // Renderizar componentes
        renderizarResumoOrcamento(orcamento, despesas);
        renderizarProgressoCategorias(orcamento, despesas);
        renderizarDetalhesOrcamento(orcamento, despesas);
      }).catch(error => {
        console.error("Erro ao obter despesas:", error);
        exibirToast("Erro ao carregar despesas do mês.", "danger");
      });
    } else {
      // Não existe orçamento para o mês/ano selecionado
      resumoContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-money-bill-wave empty-state-icon"></i>
          <h3>Nenhum orçamento definido</h3>
          <p>Você ainda não definiu um orçamento para ${obterNomeMes(mes)} de ${ano}.</p>
          <button class="btn btn-primary mt-3" onclick="abrirModalNovoOrcamento()">
            <i class="fas fa-plus"></i> Criar Orçamento
          </button>
        </div>
      `;
      progressoContainer.innerHTML = '';
      detalhesContainer.innerHTML = '';
    }
  }).catch(error => {
    console.error("Erro ao carregar orçamento:", error);
    resumoContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
  });
}

/**
 * Obtém as despesas de um mês específico
 * @param {number} mes - Mês (0-11)
 * @param {number} ano - Ano
 * @returns {Promise<Object>} - Promessa que resolve para um objeto com despesas por categoria
 */
function obterDespesasMes(mes, ano) {
  return new Promise((resolve, reject) => {
    const despesasPorCategoria = {};
    let totalDespesas = 0;
    
    db.ref("despesas").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const despesa = child.val();
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataDespesa = new Date(despesa.dataCompra);
          
          if (dataDespesa.getMonth() === mes && dataDespesa.getFullYear() === ano) {
            const valor = parseFloat(despesa.valor) || 0;
            const categoriaId = despesa.categoria;
            
            if (!despesasPorCategoria[categoriaId]) {
              despesasPorCategoria[categoriaId] = 0;
            }
            
            despesasPorCategoria[categoriaId] += valor;
            totalDespesas += valor;
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            if (parcela.vencimento) {
              const dataParcela = new Date(parcela.vencimento);
              
              if (dataParcela.getMonth() === mes && dataParcela.getFullYear() === ano) {
                const valor = parseFloat(parcela.valor) || 0;
                const categoriaId = despesa.categoria;
                
                if (!despesasPorCategoria[categoriaId]) {
                  despesasPorCategoria[categoriaId] = 0;
                }
                
                despesasPorCategoria[categoriaId] += valor;
                totalDespesas += valor;
              }
            }
          });
        }
      });
      
      resolve({
        porCategoria: despesasPorCategoria,
        total: totalDespesas
      });
    }).catch(error => {
      reject(error);
    });
  });
}

/**
 * Renderiza o resumo do orçamento
 * @param {Object} orcamento - Dados do orçamento
 * @param {Object} despesas - Dados das despesas
 */
function renderizarResumoOrcamento(orcamento, despesas) {
  const container = document.getElementById('resumoOrcamentoContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Calcular valores
  const rendaTotal = parseFloat(orcamento.rendaTotal) || 0;
  const totalOrcado = Object.values(orcamento.categorias || {}).reduce((sum, cat) => sum + (parseFloat(cat.valor) || 0), 0);
  const totalGasto = despesas.total;
  const saldoDisponivel = rendaTotal - totalGasto;
  const percentualGasto = rendaTotal > 0 ? (totalGasto / rendaTotal) * 100 : 0;
  
  // Criar cards de resumo
  const resumoCards = document.createElement('div');
  resumoCards.className = 'dashboard-cards';
  
  // Card de Renda
  const rendaCard = createDashboardCard({
    title: 'Renda Total',
    value: `R$ ${rendaTotal.toFixed(2)}`,
    label: 'Renda prevista para o mês',
    icon: 'fas fa-wallet',
    color: 'var(--primary)'
  });
  
  // Card de Gastos
  const gastosCard = createDashboardCard({
    title: 'Total Gasto',
    value: `R$ ${totalGasto.toFixed(2)}`,
    label: `${percentualGasto.toFixed(1)}% da renda`,
    icon: 'fas fa-shopping-cart',
    color: percentualGasto > 90 ? 'var(--danger)' : percentualGasto > 75 ? 'var(--warning)' : 'var(--info)'
  });
  
  // Card de Saldo
  const saldoCard = createDashboardCard({
    title: 'Saldo Disponível',
    value: `R$ ${saldoDisponivel.toFixed(2)}`,
    label: 'Restante para o mês',
    icon: 'fas fa-piggy-bank',
    color: saldoDisponivel < 0 ? 'var(--danger)' : 'var(--success)'
  });
  
  resumoCards.appendChild(rendaCard);
  resumoCards.appendChild(gastosCard);
  resumoCards.appendChild(saldoCard);
  
  container.appendChild(resumoCards);
  
  // Adicionar gráfico de resumo
  const chartContainer = document.createElement('div');
  chartContainer.id = 'resumoOrcamentoChart';
  chartContainer.style.height = '250px';
  chartContainer.style.marginTop = '1rem';
  
  container.appendChild(chartContainer);
  
  // Configurar gráfico
  const options = {
    series: [totalGasto, Math.max(0, saldoDisponivel)],
    chart: {
      type: 'donut',
      height: 250
    },
    labels: ['Gasto', 'Disponível'],
    colors: ['#f44336', '#4caf50'],
    legend: {
      position: 'bottom'
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return "R$ " + value.toFixed(2);
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val, opts) {
        return opts.w.config.series[opts.seriesIndex] > 0 
          ? `${val.toFixed(1)}%` 
          : '';
      }
    }
  };
  
  const chart = new ApexCharts(document.getElementById("resumoOrcamentoChart"), options);
  chart.render();
}

/**
 * Renderiza o progresso por categoria
 * @param {Object} orcamento - Dados do orçamento
 * @param {Object} despesas - Dados das despesas
 */
function renderizarProgressoCategorias(orcamento, despesas) {
  const container = document.getElementById('progressoCategoriasContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!orcamento.categorias || Object.keys(orcamento.categorias).length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhuma categoria definida no orçamento.</div>';
    return;
  }
  
  // Obter nomes das categorias
  db.ref("categorias").once("value").then(snapshot => {
    const categorias = {};
    
    snapshot.forEach(child => {
      categorias[child.key] = child.val().nome;
    });
    
    // Criar lista de progresso
    const progressoList = document.createElement('div');
    progressoList.className = 'progresso-categorias-lista';
    
    Object.entries(orcamento.categorias).forEach(([categoriaId, categoria]) => {
      const valorOrcado = parseFloat(categoria.valor) || 0;
      const valorGasto = parseFloat(despesas.porCategoria[categoriaId])
(Content truncated due to size limit. Use line ranges to read in chunks)
