/**
 * Módulo de Relatórios Avançados para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Relatórios financeiros detalhados
 * - Exportação de dados em diferentes formatos
 * - Visualizações personalizáveis
 */

'use strict';

/**
 * Inicializa o módulo de relatórios avançados
 */
function initRelatoriosAvancados() {
  setupRelatoriosUI();
  setupDateRangePicker();
}

/**
 * Configura a interface do usuário para relatórios avançados
 */
function setupRelatoriosUI() {
  // Atualizar a seção de relatórios existente
  const relatorioSection = document.getElementById('relatorioSection');
  if (!relatorioSection) return;
  
  // Limpar conteúdo existente
  relatorioSection.innerHTML = `
    <div class="page-header">
      <h2 class="page-title"><i class="fas fa-chart-line"></i> Relatórios Avançados</h2>
      <div class="page-actions">
        <div class="form-group mb-0">
          <input type="text" id="dataRange" class="form-control" placeholder="00/00/0000 - 00/00/0000">
        </div>
        <button class="btn btn-primary" onclick="gerarRelatorios()">
          <i class="fas fa-sync-alt"></i>
          <span>Gerar Relatórios</span>
        </button>
        <div class="dropdown">
          <button class="btn btn-outline dropdown-toggle" onclick="toggleExportOptions()">
            <i class="fas fa-download"></i>
            <span>Exportar</span>
          </button>
          <div class="dropdown-menu" id="exportOptionsMenu">
            <a href="#" onclick="exportarRelatorio('pdf')">PDF</a>
            <a href="#" onclick="exportarRelatorio('excel')">Excel</a>
            <a href="#" onclick="exportarRelatorio('csv')">CSV</a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tabs de relatórios -->
    <div class="section-tabs" data-tab-group="relatorios">
      <div class="section-tab active" data-content="resumoFinanceiroContent">Resumo Financeiro</div>
      <div class="section-tab" data-content="despesasCategoriasContent">Despesas por Categoria</div>
      <div class="section-tab" data-content="fluxoCaixaContent">Fluxo de Caixa</div>
      <div class="section-tab" data-content="comparativoContent">Comparativo</div>
    </div>
    
    <!-- Conteúdo das tabs -->
    <div id="resumoFinanceiroContent" class="tab-content" data-tab-group="relatorios">
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Resumo do Período</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-chart-pie"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="resumoPeriodoContainer"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Indicadores Financeiros</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-tachometer-alt"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="indicadoresFinanceirosContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Evolução Financeira</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-chart-line"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="evolucaoFinanceiraChart" style="height: 300px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="despesasCategoriasContent" class="tab-content" data-tab-group="relatorios" style="display: none;">
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Distribuição por Categoria</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-chart-pie"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="distribuicaoCategoriasChart" style="height: 300px;"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Top 5 Categorias</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-trophy"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="topCategoriasContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Detalhamento por Categoria</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-list"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="detalhamentoCategoriasContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="fluxoCaixaContent" class="tab-content" data-tab-group="relatorios" style="display: none;">
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Fluxo de Caixa Mensal</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-exchange-alt"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="fluxoCaixaMensalChart" style="height: 300px;"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Detalhamento do Fluxo de Caixa</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-list"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="detalhamentoFluxoCaixaContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="comparativoContent" class="tab-content" data-tab-group="relatorios" style="display: none;">
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Comparativo Mensal</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-balance-scale"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="comparativoMensalChart" style="height: 300px;"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Comparativo por Categoria</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-chart-bar"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="comparativoCategoriasChart" style="height: 300px;"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Variação Percentual</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-percentage"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="variacaoPercentualContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Configurar dropdown de exportação
  document.addEventListener('click', function(event) {
    const exportMenu = document.getElementById('exportOptionsMenu');
    if (!exportMenu) return;
    
    if (!event.target.closest('.dropdown')) {
      exportMenu.classList.remove('show');
    }
  });
}

/**
 * Configura o seletor de intervalo de datas
 */
function setupDateRangePicker() {
  const dataRangeInput = document.getElementById('dataRange');
  if (!dataRangeInput) return;
  
  // Configurar daterangepicker
  $(dataRangeInput).daterangepicker({
    startDate: moment().startOf('month'),
    endDate: moment().endOf('month'),
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
      monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ],
      firstDay: 0
    },
    ranges: {
      'Hoje': [moment(), moment()],
      'Ontem': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Últimos 7 Dias': [moment().subtract(6, 'days'), moment()],
      'Últimos 30 Dias': [moment().subtract(29, 'days'), moment()],
      'Este Mês': [moment().startOf('month'), moment().endOf('month')],
      'Mês Passado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
      'Este Ano': [moment().startOf('year'), moment().endOf('year')]
    }
  });
  
  // Gerar relatórios ao mudar o intervalo de datas
  $(dataRangeInput).on('apply.daterangepicker', function(ev, picker) {
    gerarRelatorios();
  });
}

/**
 * Gera os relatórios com base no intervalo de datas selecionado
 */
function gerarRelatorios() {
  const dataRangeInput = document.getElementById('dataRange');
  if (!dataRangeInput) return;
  
  const dateRange = $(dataRangeInput).data('daterangepicker');
  const dataInicial = dateRange.startDate.toDate();
  const dataFinal = dateRange.endDate.toDate();
  
  // Exibir indicadores de carregamento
  document.querySelectorAll('[id$="Container"], [id$="Chart"]').forEach(container => {
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  });
  
  // Obter dados para o período selecionado
  obterDadosPeriodo(dataInicial, dataFinal).then(dados => {
    // Gerar relatórios com os dados obtidos
    gerarResumoFinanceiro(dados);
    gerarRelatorioCategorias(dados);
    gerarRelatorioFluxoCaixa(dados);
    gerarRelatorioComparativo(dados);
  }).catch(error => {
    console.error("Erro ao obter dados:", error);
    exibirToast("Erro ao gerar relatórios. Tente novamente.", "danger");
  });
}

/**
 * Obtém os dados para o período selecionado
 * @param {Date} dataInicial - Data inicial do período
 * @param {Date} dataFinal - Data final do período
 * @returns {Promise<Object>} - Promessa que resolve para um objeto com os dados do período
 */
function obterDadosPeriodo(dataInicial, dataFinal) {
  return new Promise((resolve, reject) => {
    // Inicializar objeto de dados
    const dados = {
      despesas: {
        total: 0,
        porCategoria: {},
        porMes: {},
        itens: []
      },
      receitas: {
        total: 0,
        porMes: {},
        itens: []
      },
      fluxoCaixa: {
        saldoInicial: 0,
        saldoFinal: 0,
        porMes: {}
      }
    };
    
    // Obter despesas
    db.ref("despesas").once("value").then(snapshotDespesas => {
      snapshotDespesas.forEach(child => {
        const despesa = child.val();
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataDespesa = new Date(despesa.dataCompra);
          
          if (dataDespesa >= dataInicial && dataDespesa <= dataFinal) {
            const valor = parseFloat(despesa.valor) || 0;
            const categoriaId = despesa.categoria;
            const mesAno = `${dataDespesa.getMonth()}-${dataDespesa.getFullYear()}`;
            
            // Acumular total
            dados.despesas.total += valor;
            
            // Acumular por categoria
            if (!dados.despesas.porCategoria[categoriaId]) {
              dados.despesas.porCategoria[categoriaId] = 0;
            }
            dados.despesas.porCategoria[categoriaId] += valor;
            
            // Acumular por mês
            if (!dados.despesas.porMes[mesAno]) {
              dados.despesas.porMes[mesAno] = 0;
            }
            dados.despesas.porMes[mesAno] += valor;
            
            // Adicionar à lista de itens
            dados.despesas.itens.push({
              id: child.key,
              descricao: despesa.descricao,
              valor: valor,
              data: dataDespesa,
              categoria: categoriaId,
              pago: despesa.pago
            });
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach((parcela, index) => {
            if (parcela.vencimento) {
              const dataParcela = new Date(parcela.vencimento);
              
              if (dataParcela >= dataInicial && dataParcela <= dataFinal) {
                const valor = parseFloat(parcela.valor) || 0;
                const categoriaId = despesa.categoria;
                const mesAno = `${dataParcela.getMonth()}-${dataParcela.getFullYear()}`;
                
                // Acumular total
                dados.despesas.total += valor;
                
                // Acumular por categoria
                if (!dados.despesas.porCategoria[categoriaId]) {
                  dados.despesas.porCategoria[categoriaId] = 0;
                }
                dados.despesas.porCategoria[categoriaId] += valor;
                
                // Acumular por mês
                if (!dados.despesas.porMes[mesAno]) {
                  dados.despesas.porMes[mesAno] = 0;
                }
                dados.despesas.porMes[mesAno] += valor;
                
                // Adicionar à lista de itens
                dados.despesas.itens.push({
                  id: child.key,
                  descricao: `${despesa.descricao} (Parcela ${index+1})`,
                  valor: valor,
                  data: dataParcela,
                  categoria: categoriaId,
                  pago: parcela.pago
                });
              }
            }
          });
        }
      });
      
      // Obter receitas
      db.ref("pessoas").once("value").then(snapshotReceitas => {
        snapshotReceitas.forEach(child => {
          const pessoa = child.val();
          
          if (pessoa.pagamentos) {
            pessoa.pagamentos.forEach(pagamento => {
              // Para cada pagamento, criar entradas para todos os meses no período
              let dataAtual = new Date(dataInicial);
              while (dataAtual <= dataFinal) {
                // Criar data do pagamento para o mês atual
                const dataPagamento = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), pagamento.dia);
                
                if (
(Content truncated due to size limit. Use line ranges to read in chunks)
