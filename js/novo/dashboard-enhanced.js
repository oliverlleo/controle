/**
 * Módulo de Dashboard Aprimorado para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Dashboard com visualização aprimorada
 * - Widgets interativos
 * - Resumo financeiro completo
 */

'use strict';

/**
 * Inicializa o dashboard aprimorado
 */
function initDashboardEnhanced() {
  // Manter a estrutura original do dashboard que o usuário gosta
  // Apenas aprimorar com novas funcionalidades e melhor visualização
  loadDashboardData();
  setupDashboardWidgets();
}

/**
 * Carrega os dados para o dashboard
 */
function loadDashboardData() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  
  // Carregar dados originais
  atualizarDashboard();
  
  // Adicionar novos widgets e visualizações
  loadDashboardWidgets(dashboardMonth, dashboardYear);
}

/**
 * Configura os widgets do dashboard
 */
function setupDashboardWidgets() {
  // Adicionar listeners para os controles do dashboard
  document.getElementById("dashboardMonth").addEventListener("change", loadDashboardData);
  document.getElementById("dashboardYear").addEventListener("change", loadDashboardData);
}

/**
 * Carrega os widgets do dashboard
 * @param {number} mes - Mês selecionado (0-11)
 * @param {number} ano - Ano selecionado
 */
function loadDashboardWidgets(mes, ano) {
  // Carregar widget de resumo mensal
  loadResumoMensal(mes, ano);
  
  // Carregar widget de próximos vencimentos
  loadProximosVencimentos();
  
  // Carregar widget de tendências
  loadTendenciasGastos();
  
  // Carregar widget de metas
  loadMetasResumo();
}

/**
 * Carrega o widget de resumo mensal
 * @param {number} mes - Mês selecionado (0-11)
 * @param {number} ano - Ano selecionado
 */
function loadResumoMensal(mes, ano) {
  const resumoContainer = document.getElementById("resumoMensalWidget");
  if (!resumoContainer) return;
  
  resumoContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  
  // Obter receitas do mês
  db.ref("pessoas").once("value").then(snapshotReceitas => {
    let totalReceitas = 0;
    
    snapshotReceitas.forEach(child => {
      const pessoa = child.val();
      
      if (pessoa.pagamentos) {
        pessoa.pagamentos.forEach(pagamento => {
          // Considerar pagamentos do mês atual
          const diaPagamento = parseInt(pagamento.dia);
          if (diaPagamento >= 1 && diaPagamento <= 31) {
            totalReceitas += parseFloat(pagamento.valor) || 0;
          }
        });
      }
    });
    
    // Obter despesas do mês
    db.ref("despesas").once("value").then(snapshotDespesas => {
      let totalDespesas = 0;
      let despesasPagas = 0;
      let despesasPendentes = 0;
      
      snapshotDespesas.forEach(child => {
        const despesa = child.val();
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const dataDespesa = new Date(despesa.dataCompra);
          
          if (dataDespesa.getMonth() === mes && dataDespesa.getFullYear() === ano) {
            const valor = parseFloat(despesa.valor) || 0;
            
            if (despesa.pago) {
              despesasPagas += valor;
            } else {
              despesasPendentes += valor;
            }
            
            totalDespesas += valor;
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const dataParcela = new Date(parcela.vencimento);
            
            if (dataParcela.getMonth() === mes && dataParcela.getFullYear() === ano) {
              const valor = parseFloat(parcela.valor) || 0;
              
              if (parcela.pago) {
                despesasPagas += valor;
              } else {
                despesasPendentes += valor;
              }
              
              totalDespesas += valor;
            }
          });
        }
      });
      
      // Calcular saldo
      const saldo = totalReceitas - totalDespesas;
      const percentualGasto = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
      
      // Renderizar widget
      resumoContainer.innerHTML = '';
      
      // Criar card de resumo
      const resumoCard = document.createElement('div');
      resumoCard.className = 'dashboard-card';
      
      // Cabeçalho
      const header = document.createElement('div');
      header.className = 'dashboard-card-header';
      
      const title = document.createElement('div');
      title.className = 'dashboard-card-title';
      title.textContent = 'Resumo Mensal';
      
      const icon = document.createElement('div');
      icon.className = 'dashboard-card-icon';
      icon.innerHTML = '<i class="fas fa-chart-pie"></i>';
      
      header.appendChild(title);
      header.appendChild(icon);
      resumoCard.appendChild(header);
      
      // Conteúdo
      const content = document.createElement('div');
      content.className = 'dashboard-card-content';
      
      // Gráfico de pizza
      const chartContainer = document.createElement('div');
      chartContainer.id = 'resumoMensalChart';
      chartContainer.style.height = '200px';
      content.appendChild(chartContainer);
      
      // Detalhes
      const details = document.createElement('div');
      details.className = 'dashboard-card-details mt-2';
      
      details.innerHTML = `
        <div class="detail-item">
          <span class="detail-label">Receitas:</span>
          <span class="detail-value text-success">R$ ${totalReceitas.toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Despesas:</span>
          <span class="detail-value text-danger">R$ ${totalDespesas.toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Saldo:</span>
          <span class="detail-value ${saldo >= 0 ? 'text-success' : 'text-danger'}">R$ ${saldo.toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Comprometido:</span>
          <span class="detail-value">${percentualGasto.toFixed(1)}% da renda</span>
        </div>
      `;
      
      content.appendChild(details);
      resumoCard.appendChild(content);
      resumoContainer.appendChild(resumoCard);
      
      // Criar gráfico
      const options = {
        series: [despesasPagas, despesasPendentes, Math.max(0, saldo)],
        chart: {
          type: 'donut',
          height: 200
        },
        labels: ['Pago', 'Pendente', 'Disponível'],
        colors: ['#f44336', '#ff9800', '#4caf50'],
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
          enabled: false
        }
      };
      
      const chart = new ApexCharts(document.getElementById("resumoMensalChart"), options);
      chart.render();
      
    }).catch(error => {
      console.error("Erro ao carregar despesas:", error);
      resumoContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
    });
  }).catch(error => {
    console.error("Erro ao carregar receitas:", error);
    resumoContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
  });
}

/**
 * Carrega o widget de próximos vencimentos
 */
function loadProximosVencimentos() {
  const vencimentosContainer = document.getElementById("proximosVencimentosWidget");
  if (!vencimentosContainer) return;
  
  vencimentosContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  
  const hoje = new Date();
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate());
  
  db.ref("despesas").once("value").then(snapshot => {
    let vencimentos = [];
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const dataVencimento = new Date(despesa.dataCompra);
        
        if (dataVencimento >= hoje && dataVencimento <= proximoMes) {
          vencimentos.push({
            id: child.key,
            descricao: despesa.descricao,
            valor: parseFloat(despesa.valor) || 0,
            data: dataVencimento,
            tipo: 'avista'
          });
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            
            if (dataVencimento >= hoje && dataVencimento <= proximoMes) {
              vencimentos.push({
                id: child.key,
                descricao: `${despesa.descricao} (Parcela ${index+1})`,
                valor: parseFloat(parcela.valor) || 0,
                data: dataVencimento,
                tipo: 'cartao',
                parcela: index
              });
            }
          }
        });
      }
    });
    
    // Ordenar por data de vencimento
    vencimentos.sort((a, b) => a.data - b.data);
    
    // Limitar a 5 vencimentos
    vencimentos = vencimentos.slice(0, 5);
    
    // Renderizar widget
    vencimentosContainer.innerHTML = '';
    
    // Criar card
    const card = document.createElement('div');
    card.className = 'dashboard-card';
    
    // Cabeçalho
    const header = document.createElement('div');
    header.className = 'dashboard-card-header';
    
    const title = document.createElement('div');
    title.className = 'dashboard-card-title';
    title.textContent = 'Próximos Vencimentos';
    
    const icon = document.createElement('div');
    icon.className = 'dashboard-card-icon';
    icon.innerHTML = '<i class="fas fa-calendar-alt"></i>';
    
    header.appendChild(title);
    header.appendChild(icon);
    card.appendChild(header);
    
    // Conteúdo
    const content = document.createElement('div');
    content.className = 'dashboard-card-content';
    
    if (vencimentos.length === 0) {
      content.innerHTML = '<div class="empty-state">Nenhum vencimento nos próximos 30 dias.</div>';
    } else {
      const list = document.createElement('div');
      list.className = 'vencimentos-list';
      
      vencimentos.forEach(vencimento => {
        const item = document.createElement('div');
        item.className = 'vencimento-item';
        
        // Calcular dias até o vencimento
        const diffTime = vencimento.data - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusClass = '';
        if (diffDays <= 0) {
          statusClass = 'text-danger';
        } else if (diffDays <= 3) {
          statusClass = 'text-warning';
        }
        
        item.innerHTML = `
          <div class="vencimento-info">
            <div class="vencimento-titulo">${vencimento.descricao}</div>
            <div class="vencimento-data ${statusClass}">
              ${vencimento.data.toLocaleDateString()} 
              (${diffDays <= 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : `${diffDays} dias`})
            </div>
          </div>
          <div class="vencimento-valor">R$ ${vencimento.valor.toFixed(2)}</div>
        `;
        
        list.appendChild(item);
      });
      
      content.appendChild(list);
    }
    
    card.appendChild(content);
    
    // Adicionar botão para ver todos
    const footer = document.createElement('div');
    footer.className = 'dashboard-card-footer';
    
    const verTodosBtn = document.createElement('button');
    verTodosBtn.className = 'btn btn-sm btn-outline';
    verTodosBtn.innerHTML = 'Ver Todos <i class="fas fa-arrow-right"></i>';
    verTodosBtn.addEventListener('click', () => {
      showSectionEnhanced('despesasSection');
    });
    
    footer.appendChild(verTodosBtn);
    card.appendChild(footer);
    
    vencimentosContainer.appendChild(card);
    
  }).catch(error => {
    console.error("Erro ao carregar vencimentos:", error);
    vencimentosContainer.innerHTML = '<div class="error-message">Erro ao carregar dados. Tente novamente.</div>';
  });
}

/**
 * Carrega o widget de tendências de gastos
 */
function loadTendenciasGastos() {
  const tendenciasContainer = document.getElementById("tendenciasGastosWidget");
  if (!tendenciasContainer) return;
  
  tendenciasContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  
  const hoje = new Date();
  const ultimosMeses = 6; // Analisar os últimos 6 meses
  
  // Preparar datas
  const meses = [];
  const labels = [];
  
  for (let i = ultimosMeses - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({
      mes: data.getMonth(),
      ano: data.getFullYear()
    });
    
    labels.push(data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }));
  }
  
  // Obter despesas por mês
  db.ref("despesas").once("value").then(snapshot => {
    const despesasPorMes = Array(ultimosMeses).fill(0);
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const dataDespesa = new Date(despesa.dataCompra);
        
        meses.forEach((periodo, index) => {
          if (dataDespesa.getMonth() === periodo.mes && dataDespesa.getFullYear() === periodo.ano) {
            despesasPorMes[index] += parseFloat(despesa.valor) || 0;
          }
        });
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (parcela.vencimento) {
            const dataParcela = new Date(parcela.vencimento);
            
            meses.forEach((periodo, index) => {
              if (dataParcela.getMonth() === periodo.mes && dataParcela.getFullYear() === periodo.ano) {
                despesasPorMes[index] += parseFloat(parcela.valor) || 0;
              }
            });
          }
        });
      }
    });
    
    // Renderizar widget
    tendenciasContainer.innerHTML = '';
    
    // Criar card
    const card = document.createElement('div');
    card.className = 'dashboard-card';
    
    // Cabeçalho
    const header = document.createElement('div');
    header.className = 'dashboard-card-header';
    
    const title = document.createElement('div');
    title.className = 'dashboard-card-title';
    title.textContent = 'Tendências de Gastos';
    
    const icon = document.createElement('div');
    icon.className = 'dashboard-card-icon';
    icon.innerHTML = '<i class="fas fa-chart-line"></i>';
    
    header.appendChild(title);
    header.appendChild(icon);
    card.appendChild(header);
    
    // Conteúdo
    const content = document.createElement('div');
    content.className = 'dashboard-card-content';
    
    // Gráfico de linha
    const chartContainer = document.createElement('div');
    chartContainer.id = 'tendenciasGastosChart';
    chartContainer.style.height = '200px';
    content.appendChild(chartContainer);
    
    card.appendChild(content);
    tendenciasContainer.appendChild(card);
    
    // Criar gráfico
    const options = {
      series: [{
        name: 'Despesas',
        data: despesasPorMes
      }],
      chart: {
        type: 'line',
        height: 200,
        toolbar: {
          show: false
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: labels
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            return "R$ " + value.toFixed(0);
          }
        }
   
(Content truncated due to size limit. Use line ranges to read in chunks)
