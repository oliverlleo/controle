/**
 * Módulo de Finanças para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Visualização integrada de despesas e receitas
 * - Análise de fluxo de caixa
 * - Planejamento financeiro
 */

'use strict';

/**
 * Inicializa a seção de finanças
 */
function initFinancasSection() {
  loadFinancasData();
  setupFinancasTabs();
}

/**
 * Carrega os dados para a seção de finanças
 */
function loadFinancasData() {
  // Carregar dados do mês atual por padrão
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  loadFluxoCaixa(mesAtual, anoAtual);
  loadDespesasCategorizadas(mesAtual, anoAtual);
  loadPlanejamentoFinanceiro();
}

/**
 * Configura as tabs da seção de finanças
 */
function setupFinancasTabs() {
  // Já implementado pelo módulo ui-components.js
  // As tabs são inicializadas automaticamente
}

/**
 * Carrega os dados de fluxo de caixa
 * @param {number} mes - Mês (0-11)
 * @param {number} ano - Ano
 */
function loadFluxoCaixa(mes, ano) {
  const fluxoCaixaContainer = document.getElementById('fluxoCaixaContainer');
  if (!fluxoCaixaContainer) return;
  
  fluxoCaixaContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  
  // Obter dados de receitas
  db.ref("pessoas").once("value").then(snapshotReceitas => {
    let receitas = [];
    let totalReceitas = 0;
    
    snapshotReceitas.forEach(child => {
      const pessoa = child.val();
      
      if (pessoa.pagamentos) {
        pessoa.pagamentos.forEach(pagamento => {
          // Criar data do pagamento para o mês/ano atual
          const dataPagamento = new Date(ano, mes, pagamento.dia);
          
          receitas.push({
            descricao: `Pagamento - ${pessoa.nome || 'Sem nome'}`,
            valor: parseFloat(pagamento.valor) || 0,
            data: dataPagamento,
            tipo: 'receita'
          });
          
          totalReceitas += parseFloat(pagamento.valor) || 0;
        });
      }
    });
    
    // Obter dados de despesas
    db.ref("despesas").once("value").then(snapshotDespesas => {
      let despesas = [];
      let totalDespesas = 0;
      
      snapshotDespesas.forEach(child => {
        const despesa = child.val();
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataDespesa = new Date(despesa.dataCompra);
          
          if (dataDespesa.getMonth() === mes && dataDespesa.getFullYear() === ano) {
            despesas.push({
              descricao: despesa.descricao,
              valor: parseFloat(despesa.valor) || 0,
              data: dataDespesa,
              categoria: despesa.categoria,
              tipo: 'despesa',
              pago: despesa.pago
            });
            
            if (!despesa.pago) {
              totalDespesas += parseFloat(despesa.valor) || 0;
            }
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach((parcela, index) => {
            const dataParcela = new Date(parcela.vencimento);
            
            if (dataParcela.getMonth() === mes && dataParcela.getFullYear() === ano) {
              despesas.push({
                descricao: `${despesa.descricao} (Parcela ${index+1})`,
                valor: parseFloat(parcela.valor) || 0,
                data: dataParcela,
                categoria: despesa.categoria,
                tipo: 'despesa',
                pago: parcela.pago
              });
              
              if (!parcela.pago) {
                totalDespesas += parseFloat(parcela.valor) || 0;
              }
            }
          });
        }
      });
      
      // Combinar receitas e despesas
      const transacoes = [...receitas, ...despesas].sort((a, b) => a.data - b.data);
      
      // Calcular saldo
      const saldo = totalReceitas - totalDespesas;
      
      // Renderizar resumo
      renderFluxoCaixaResumo(totalReceitas, totalDespesas, saldo);
      
      // Renderizar transações
      renderFluxoCaixaTransacoes(transacoes);
      
      // Renderizar gráfico
      renderFluxoCaixaGrafico(receitas, despesas);
      
    }).catch(error => {
      console.error("Erro ao carregar despesas:", error);
      fluxoCaixaContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
    });
  }).catch(error => {
    console.error("Erro ao carregar receitas:", error);
    fluxoCaixaContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
  });
}

/**
 * Renderiza o resumo do fluxo de caixa
 * @param {number} totalReceitas - Total de receitas
 * @param {number} totalDespesas - Total de despesas
 * @param {number} saldo - Saldo (receitas - despesas)
 */
function renderFluxoCaixaResumo(totalReceitas, totalDespesas, saldo) {
  const resumoContainer = document.getElementById('fluxoCaixaResumo');
  if (!resumoContainer) return;
  
  resumoContainer.innerHTML = '';
  
  // Card de Receitas
  const receitasCard = createDashboardCard({
    title: 'Receitas',
    value: `R$ ${totalReceitas.toFixed(2)}`,
    label: 'Total de entradas no mês',
    icon: 'fas fa-arrow-down',
    color: 'var(--success)'
  });
  
  // Card de Despesas
  const despesasCard = createDashboardCard({
    title: 'Despesas',
    value: `R$ ${totalDespesas.toFixed(2)}`,
    label: 'Total de saídas no mês',
    icon: 'fas fa-arrow-up',
    color: 'var(--danger)'
  });
  
  // Card de Saldo
  const saldoCard = createDashboardCard({
    title: 'Saldo',
    value: `R$ ${saldo.toFixed(2)}`,
    label: 'Diferença entre receitas e despesas',
    icon: 'fas fa-wallet',
    color: saldo >= 0 ? 'var(--success)' : 'var(--danger)'
  });
  
  resumoContainer.appendChild(receitasCard);
  resumoContainer.appendChild(despesasCard);
  resumoContainer.appendChild(saldoCard);
}

/**
 * Renderiza a lista de transações do fluxo de caixa
 * @param {Array} transacoes - Lista de transações (receitas e despesas)
 */
function renderFluxoCaixaTransacoes(transacoes) {
  const transacoesContainer = document.getElementById('fluxoCaixaTransacoes');
  if (!transacoesContainer) return;
  
  transacoesContainer.innerHTML = '';
  
  if (transacoes.length === 0) {
    transacoesContainer.innerHTML = '<div class="empty-state">Nenhuma transação encontrada para o período selecionado.</div>';
    return;
  }
  
  // Criar tabela
  const table = document.createElement('table');
  table.className = 'table';
  
  // Cabeçalho
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  ['Data', 'Descrição', 'Valor', 'Tipo', 'Status'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Corpo da tabela
  const tbody = document.createElement('tbody');
  
  transacoes.forEach(transacao => {
    const row = document.createElement('tr');
    
    // Data
    const tdData = document.createElement('td');
    tdData.textContent = transacao.data.toLocaleDateString();
    row.appendChild(tdData);
    
    // Descrição
    const tdDescricao = document.createElement('td');
    tdDescricao.textContent = transacao.descricao;
    row.appendChild(tdDescricao);
    
    // Valor
    const tdValor = document.createElement('td');
    tdValor.textContent = `R$ ${transacao.valor.toFixed(2)}`;
    tdValor.className = transacao.tipo === 'receita' ? 'text-success' : 'text-danger';
    row.appendChild(tdValor);
    
    // Tipo
    const tdTipo = document.createElement('td');
    const tipoBadge = createBadge(
      transacao.tipo === 'receita' ? 'Receita' : 'Despesa',
      transacao.tipo === 'receita' ? 'success' : 'danger'
    );
    tdTipo.appendChild(tipoBadge);
    row.appendChild(tdTipo);
    
    // Status
    const tdStatus = document.createElement('td');
    if (transacao.tipo === 'despesa') {
      const statusBadge = createBadge(
        transacao.pago ? 'Pago' : 'Pendente',
        transacao.pago ? 'success' : 'warning'
      );
      tdStatus.appendChild(statusBadge);
    } else {
      tdStatus.textContent = '-';
    }
    row.appendChild(tdStatus);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  transacoesContainer.appendChild(table);
}

/**
 * Renderiza o gráfico de fluxo de caixa
 * @param {Array} receitas - Lista de receitas
 * @param {Array} despesas - Lista de despesas
 */
function renderFluxoCaixaGrafico(receitas, despesas) {
  const graficoContainer = document.getElementById('fluxoCaixaGrafico');
  if (!graficoContainer) return;
  
  // Agrupar receitas por dia
  const receitasPorDia = {};
  receitas.forEach(receita => {
    const dia = receita.data.getDate();
    receitasPorDia[dia] = (receitasPorDia[dia] || 0) + receita.valor;
  });
  
  // Agrupar despesas por dia
  const despesasPorDia = {};
  despesas.forEach(despesa => {
    if (despesa.pago) return; // Ignorar despesas já pagas
    
    const dia = despesa.data.getDate();
    despesasPorDia[dia] = (despesasPorDia[dia] || 0) + despesa.valor;
  });
  
  // Obter todos os dias do mês
  const diasDoMes = new Date(despesas[0]?.data.getFullYear() || new Date().getFullYear(), 
                            (despesas[0]?.data.getMonth() || new Date().getMonth()) + 1, 0).getDate();
  
  // Preparar dados para o gráfico
  const dias = [];
  const valoresReceitas = [];
  const valoresDespesas = [];
  
  for (let i = 1; i <= diasDoMes; i++) {
    dias.push(i);
    valoresReceitas.push(receitasPorDia[i] || 0);
    valoresDespesas.push(despesasPorDia[i] || 0);
  }
  
  // Configurar gráfico
  const options = {
    series: [
      {
        name: 'Receitas',
        data: valoresReceitas
      },
      {
        name: 'Despesas',
        data: valoresDespesas
      }
    ],
    chart: {
      type: 'bar',
      height: 350,
      stacked: false,
      toolbar: {
        show: true
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: dias,
      title: {
        text: 'Dia do Mês'
      }
    },
    yaxis: {
      title: {
        text: 'Valor (R$)'
      },
      labels: {
        formatter: function (value) {
          return "R$ " + value.toFixed(2);
        }
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return "R$ " + value.toFixed(2);
        }
      }
    },
    colors: ['var(--success)', 'var(--danger)']
  };
  
  // Destruir gráfico anterior se existir
  if (window.fluxoCaixaChart) {
    window.fluxoCaixaChart.destroy();
  }
  
  // Criar gráfico
  window.fluxoCaixaChart = new ApexCharts(graficoContainer, options);
  window.fluxoCaixaChart.render();
}

/**
 * Carrega as despesas categorizadas
 * @param {number} mes - Mês (0-11)
 * @param {number} ano - Ano
 */
function loadDespesasCategorizadas(mes, ano) {
  const despesasCategorizadasContainer = document.getElementById('despesasCategorizadasContainer');
  if (!despesasCategorizadasContainer) return;
  
  despesasCategorizadasContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  
  // Obter categorias
  db.ref("categorias").once("value").then(snapshotCategorias => {
    const categorias = {};
    
    snapshotCategorias.forEach(child => {
      categorias[child.key] = {
        id: child.key,
        nome: child.val().nome,
        total: 0,
        despesas: []
      };
    });
    
    // Obter despesas
    db.ref("despesas").once("value").then(snapshotDespesas => {
      let totalGeral = 0;
      
      snapshotDespesas.forEach(child => {
        const despesa = child.val();
        const categoriaId = despesa.categoria;
        
        if (!categoriaId || !categorias[categoriaId]) return;
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataDespesa = new Date(despesa.dataCompra);
          
          if (dataDespesa.getMonth() === mes && dataDespesa.getFullYear() === ano && !despesa.pago) {
            const valor = parseFloat(despesa.valor) || 0;
            
            categorias[categoriaId].total += valor;
            totalGeral += valor;
            
            categorias[categoriaId].despesas.push({
              id: child.key,
              descricao: despesa.descricao,
              valor: valor,
              data: dataDespesa,
              pago: despesa.pago
            });
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach((parcela, index) => {
            const dataParcela = new Date(parcela.vencimento);
            
            if (dataParcela.getMonth() === mes && dataParcela.getFullYear() === ano && !parcela.pago) {
              const valor = parseFloat(parcela.valor) || 0;
              
              categorias[categoriaId].total += valor;
              totalGeral += valor;
              
              categorias[categoriaId].despesas.push({
                id: child.key,
                descricao: `${despesa.descricao} (Parcela ${index+1})`,
                valor: valor,
                data: dataParcela,
                pago: parcela.pago
              });
            }
          });
        }
      });
      
      // Filtrar categorias com despesas
      const categoriasComDespesas = Object.values(categorias).filter(cat => cat.total > 0);
      
      // Ordenar categorias por valor (decrescente)
      categoriasComDespesas.sort((a, b) => b.total - a.total);
      
      // Renderizar gráfico
      renderDespesasCategorizadasGrafico(categoriasComDespesas, totalGeral);
      
      // Renderizar lista
      renderDespesasCategorizadasLista(categoriasComDespesas);
      
    }).catch(error => {
      console.error("Erro ao carregar despesas:", error);
      despesasCategorizadasContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
    });
  }).catch(error => {
    console.error("Erro ao carregar categorias:", error);
    despesasCategorizadasContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
  });
}

/**
 * Renderiza o gráfico de despesas categorizadas
 * @param {Array} categorias - Lista de categorias com despesas
 * @param {number} totalGeral - Total geral de despesas
 */
function renderDespesasCategorizadasGrafico(categorias, totalGeral) {
  const graficoContainer = document.getElementById('despesasCategorizadasGrafico');
  if (!graficoContainer) return;
  
  // Preparar dados para o gráfico
  const series = categorias.map(cat => cat.total);
  const labels = categorias.map(cat => cat.nome);
  
  // Configurar gráfico
  const options = {
    series: series,
    chart: {
      type: 'donut',
      height: 350
    },
    labels: labels,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#795548', '#607d8b', '#e91e63', '#009688', '#673ab7'],
    tooltip: {
      y: {
        formatter: function (value) {
          return "R$ " + value.toFixed(2) + ` (${((value / totalGeral) * 100).toFixed(1)}%)`;
        }
      }
    },
    legend: {
      position: 'bottom'
    }
  };
  
  // Destruir gráfico anterior se existir
  if (window.despesasCategorizadasChart) {
    window.despesasCategorizadasChart.destroy();
  }
  
  // Criar gráfico
  window.despesasCategorizadasChart = new ApexCharts(graficoContainer, options);
  window.despe
(Content truncated due to size limit. Use line ranges to read in chunks)
