/**
 * Módulo de Análise de Tendências para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Análise de tendências de gastos
 * - Previsões de despesas futuras
 * - Recomendações para economia
 */

'use strict';

/**
 * Inicializa o módulo de análise de tendências
 */
function initTendenciasAnalysis() {
  setupTendenciasUI();
  loadHistoricalData();
}

/**
 * Configura a interface do usuário para análise de tendências
 */
function setupTendenciasUI() {
  // Criar seção de tendências se não existir
  if (!document.getElementById('tendenciasSection')) {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;
    
    const tendenciasSection = document.createElement('section');
    tendenciasSection.id = 'tendenciasSection';
    tendenciasSection.className = 'container';
    tendenciasSection.style.display = 'none';
    
    tendenciasSection.innerHTML = `
      <div class="page-header">
        <h2 class="page-title"><i class="fas fa-chart-line"></i> Análise de Tendências</h2>
        <div class="page-actions">
          <div class="form-group mb-0">
            <select id="tendenciasPeriodo" class="form-control">
              <option value="3">Últimos 3 meses</option>
              <option value="6" selected>Últimos 6 meses</option>
              <option value="12">Último ano</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="atualizarTendencias()">
            <i class="fas fa-sync-alt"></i>
            <span>Atualizar</span>
          </button>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Tendência de Gastos</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-chart-line"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="tendenciasGastosGrafico" style="height: 300px;"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Categorias em Alta</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-arrow-trend-up"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="categoriasAltaContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-row">
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Previsão de Gastos</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-crystal-ball"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="previsaoGastosGrafico" style="height: 300px;"></div>
            </div>
          </div>
        </div>
        <div class="dashboard-col">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <div class="dashboard-card-title">Recomendações</div>
              <div class="dashboard-card-icon">
                <i class="fas fa-lightbulb"></i>
              </div>
            </div>
            <div class="dashboard-card-content">
              <div id="recomendacoesContainer"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    mainElement.appendChild(tendenciasSection);
    
    // Adicionar link no menu lateral
    const navGroup = document.querySelector('#sidebar .nav-group:nth-child(3)');
    if (navGroup) {
      const tendenciasLink = document.createElement('a');
      tendenciasLink.href = '#';
      tendenciasLink.className = 'nav-link';
      tendenciasLink.dataset.section = 'tendenciasSection';
      tendenciasLink.innerHTML = '<i class="fa-solid fa-chart-line"></i><span>Tendências</span>';
      tendenciasLink.addEventListener('click', function(event) {
        event.preventDefault();
        showSectionEnhanced('tendenciasSection');
      });
      
      // Inserir antes do link de exportar dados
      const exportarLink = navGroup.querySelector('a:last-child');
      if (exportarLink) {
        navGroup.insertBefore(tendenciasLink, exportarLink);
      } else {
        navGroup.appendChild(tendenciasLink);
      }
    }
  }
  
  // Configurar evento de mudança de período
  const periodoSelect = document.getElementById('tendenciasPeriodo');
  if (periodoSelect) {
    periodoSelect.addEventListener('change', atualizarTendencias);
  }
}

/**
 * Carrega dados históricos para análise
 */
function loadHistoricalData() {
  const periodo = parseInt(document.getElementById('tendenciasPeriodo')?.value || '6');
  
  // Obter data atual
  const hoje = new Date();
  const dataInicial = new Date(hoje.getFullYear(), hoje.getMonth() - periodo, 1);
  
  // Preparar array de meses para análise
  const meses = [];
  for (let i = 0; i < periodo; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.unshift({
      mes: data.getMonth(),
      ano: data.getFullYear(),
      nome: data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
    });
  }
  
  // Obter despesas por mês e categoria
  db.ref("despesas").once("value").then(snapshot => {
    const despesasPorMes = Array(periodo).fill(0);
    const despesasPorCategoria = {};
    const categoriasPorMes = {};
    
    // Inicializar arrays para cada mês
    meses.forEach((mes, index) => {
      categoriasPorMes[`${mes.mes}-${mes.ano}`] = {};
    });
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const dataDespesa = new Date(despesa.dataCompra);
        
        // Verificar se está dentro do período de análise
        if (dataDespesa >= dataInicial && dataDespesa <= hoje) {
          const valor = parseFloat(despesa.valor) || 0;
          const categoriaId = despesa.categoria;
          
          // Encontrar índice do mês correspondente
          meses.forEach((mes, index) => {
            if (dataDespesa.getMonth() === mes.mes && dataDespesa.getFullYear() === mes.ano) {
              despesasPorMes[index] += valor;
              
              // Acumular por categoria
              const mesKey = `${mes.mes}-${mes.ano}`;
              categoriasPorMes[mesKey][categoriaId] = (categoriasPorMes[mesKey][categoriaId] || 0) + valor;
              
              // Acumular total por categoria
              despesasPorCategoria[categoriaId] = (despesasPorCategoria[categoriaId] || 0) + valor;
            }
          });
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (parcela.vencimento) {
            const dataParcela = new Date(parcela.vencimento);
            
            // Verificar se está dentro do período de análise
            if (dataParcela >= dataInicial && dataParcela <= hoje) {
              const valor = parseFloat(parcela.valor) || 0;
              const categoriaId = despesa.categoria;
              
              // Encontrar índice do mês correspondente
              meses.forEach((mes, index) => {
                if (dataParcela.getMonth() === mes.mes && dataParcela.getFullYear() === mes.ano) {
                  despesasPorMes[index] += valor;
                  
                  // Acumular por categoria
                  const mesKey = `${mes.mes}-${mes.ano}`;
                  categoriasPorMes[mesKey][categoriaId] = (categoriasPorMes[mesKey][categoriaId] || 0) + valor;
                  
                  // Acumular total por categoria
                  despesasPorCategoria[categoriaId] = (despesasPorCategoria[categoriaId] || 0) + valor;
                }
              });
            }
          }
        });
      }
    });
    
    // Obter nomes das categorias
    db.ref("categorias").once("value").then(snapshotCategorias => {
      const categorias = {};
      
      snapshotCategorias.forEach(child => {
        categorias[child.key] = child.val().nome;
      });
      
      // Calcular tendências por categoria
      const tendenciasCategorias = calcularTendenciasCategorias(categoriasPorMes, categorias);
      
      // Renderizar gráficos e análises
      renderizarGraficoTendencias(meses.map(m => m.nome), despesasPorMes);
      renderizarCategoriasAlta(tendenciasCategorias);
      renderizarPrevisaoGastos(meses.map(m => m.nome), despesasPorMes);
      gerarRecomendacoes(tendenciasCategorias, despesasPorMes);
      
    }).catch(error => {
      console.error("Erro ao carregar categorias:", error);
      exibirToast("Erro ao carregar dados de categorias.", "danger");
    });
  }).catch(error => {
    console.error("Erro ao carregar despesas:", error);
    exibirToast("Erro ao carregar dados históricos.", "danger");
  });
}

/**
 * Calcula tendências por categoria
 * @param {Object} categoriasPorMes - Objeto com gastos por categoria e mês
 * @param {Object} categorias - Objeto com nomes das categorias
 * @returns {Array} - Array de tendências por categoria
 */
function calcularTendenciasCategorias(categoriasPorMes, categorias) {
  const tendencias = [];
  const categoriasUnicas = new Set();
  
  // Identificar todas as categorias únicas
  Object.values(categoriasPorMes).forEach(categoriasMes => {
    Object.keys(categoriasMes).forEach(categoriaId => {
      categoriasUnicas.add(categoriaId);
    });
  });
  
  // Calcular tendência para cada categoria
  categoriasUnicas.forEach(categoriaId => {
    if (!categoriaId || !categorias[categoriaId]) return;
    
    const valoresPorMes = [];
    const mesesKeys = Object.keys(categoriasPorMes).sort();
    
    // Obter valores para os últimos meses
    mesesKeys.forEach(mesKey => {
      valoresPorMes.push(categoriasPorMes[mesKey][categoriaId] || 0);
    });
    
    // Calcular tendência (média móvel dos últimos 3 meses vs. média anterior)
    if (valoresPorMes.length >= 3) {
      const ultimosTresMeses = valoresPorMes.slice(-3);
      const mesesAnteriores = valoresPorMes.slice(0, -3);
      
      const mediaTresMeses = ultimosTresMeses.reduce((sum, val) => sum + val, 0) / ultimosTresMeses.length;
      const mediaAnterior = mesesAnteriores.length > 0 
        ? mesesAnteriores.reduce((sum, val) => sum + val, 0) / mesesAnteriores.length 
        : mediaTresMeses;
      
      const variacao = mediaAnterior > 0 
        ? ((mediaTresMeses - mediaAnterior) / mediaAnterior) * 100 
        : 0;
      
      tendencias.push({
        id: categoriaId,
        nome: categorias[categoriaId],
        mediaRecente: mediaTresMeses,
        mediaAnterior: mediaAnterior,
        variacao: variacao,
        valores: valoresPorMes
      });
    }
  });
  
  // Ordenar por variação (decrescente)
  tendencias.sort((a, b) => b.variacao - a.variacao);
  
  return tendencias;
}

/**
 * Renderiza o gráfico de tendências de gastos
 * @param {Array} labels - Array com labels dos meses
 * @param {Array} valores - Array com valores de despesas por mês
 */
function renderizarGraficoTendencias(labels, valores) {
  const container = document.getElementById('tendenciasGastosGrafico');
  if (!container) return;
  
  // Calcular média móvel
  const mediaMovel = [];
  for (let i = 0; i < valores.length; i++) {
    if (i < 2) {
      // Para os primeiros meses, usar média dos meses disponíveis
      const soma = valores.slice(0, i + 1).reduce((sum, val) => sum + val, 0);
      mediaMovel.push(soma / (i + 1));
    } else {
      // Para os demais, usar média dos 3 últimos meses
      const soma = valores[i] + valores[i-1] + valores[i-2];
      mediaMovel.push(soma / 3);
    }
  }
  
  // Configurar gráfico
  const options = {
    series: [
      {
        name: 'Despesas Mensais',
        type: 'column',
        data: valores
      },
      {
        name: 'Média Móvel (3 meses)',
        type: 'line',
        data: mediaMovel
      }
    ],
    chart: {
      height: 300,
      type: 'line',
      toolbar: {
        show: true
      }
    },
    stroke: {
      width: [0, 3],
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        columnWidth: '50%'
      }
    },
    fill: {
      opacity: [0.85, 1],
      gradient: {
        inverseColors: false,
        shade: 'light',
        type: "vertical",
        opacityFrom: 0.85,
        opacityTo: 0.55,
        stops: [0, 100, 100, 100]
      }
    },
    markers: {
      size: 0
    },
    xaxis: {
      categories: labels
    },
    yaxis: {
      title: {
        text: 'Valor (R$)'
      },
      labels: {
        formatter: function(val) {
          return "R$ " + val.toFixed(0);
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function(value) {
          return "R$ " + value.toFixed(2);
        }
      }
    },
    colors: ['#4361ee', '#ff6b6b']
  };
  
  // Destruir gráfico anterior se existir
  if (window.tendenciasGastosChart) {
    window.tendenciasGastosChart.destroy();
  }
  
  // Criar gráfico
  window.tendenciasGastosChart = new ApexCharts(container, options);
  window.tendenciasGastosChart.render();
}

/**
 * Renderiza as categorias em alta
 * @param {Array} tendencias - Array de tendências por categoria
 */
function renderizarCategoriasAlta(tendencias) {
  const container = document.getElementById('categoriasAltaContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (tendencias.length === 0) {
    container.innerHTML = '<div class="empty-state">Não há dados suficientes para análise.</div>';
    return;
  }
  
  // Criar lista de categorias em alta
  const categoriasLista = document.createElement('div');
  categoriasLista.className = 'categorias-tendencia-lista';
  
  // Mostrar até 5 categorias com maior variação
  const categoriasExibidas = tendencias.slice(0, 5);
  
  categoriasExibidas.forEach(categoria => {
    const categoriaItem = document.createElement('div');
    categoriaItem.className = 'categoria-tendencia-item';
    
    const variacao = categoria.variacao.toFixed(1);
    const variacaoClass = categoria.variacao > 0 ? 'text-danger' : 'text-success';
    const variacaoIcon = categoria.variacao > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    categoriaItem.innerHTML = `
      <div class="categoria-tendencia-info">
        <div class="categoria-tendencia-nome">${categoria.nome}</div>
        <div class="categoria-tendencia-valor">R$ ${categoria.mediaRecente.toFixed(2)}</div>
      </div>
      <div class="categoria-tendencia-variacao ${variacaoClass}">
        <i class="fas ${variacaoIcon}"></i> ${Math.abs(variacao)}%
      </div>
    `;
    
    categoriasLista.appendChild(categoriaItem);
  });
  
  container.appendChild(categoriasLista);
}

/**
 * Renderiza a previsão de gastos
 * @param {Array} labels - Array com labels dos meses
 * @param {Array} valores - Array com valores de despesas por mês
 */
function renderizarPrevisaoGastos(labels, valores) {
  const container = document.getElementById('previsaoGastosGrafico');
  if (!container) return;
  
  // Calcular previsão para os próximos 3 meses
  const previsao = calcularPrevisaoGastos(valores);
  
  // Preparar dados para o gráfico
  const todosLabels = [...labels];
  const todosValores = [...valores];
  
  // Adicionar meses futuros
  const ultimoMes = new Date();
  for (let i = 1; i <= 3; i++) {
    const novoMes = new Date(ultimoMes.getFullYear(), ultimoMes.getMonth() + i, 1);
    todosLabels.push(novoMes.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }));
    todosValores.push(null); // V
(Content truncated due to size limit. Use line ranges to read in chunks)