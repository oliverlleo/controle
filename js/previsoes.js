/**
 * Módulo de Previsões para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Cálculo de previsões de gastos para os próximos meses
 * - Visualização de tendências em gráficos
 * - Análise de padrões de gastos
 */

'use strict';

/**
 * Calcula previsões de gastos para os próximos 3 meses
 * baseado no histórico dos últimos 6 meses
 */
function novo_calcularPrevisoes() {
  const hoje = new Date();
  const seisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  let despesasMes = {};
  
  // Buscar despesas dos últimos 6 meses
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      let despesa = child.val();
      let dt;
      
      // Processar despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        dt = new Date(despesa.dataCompra);
        if (dt >= seisMesesAtras && dt <= hoje) {
          let key = dt.getFullYear() + "-" + (dt.getMonth() + 1);
          despesasMes[key] = (despesasMes[key] || 0) + parseFloat(despesa.valor);
        }
      } 
      // Processar despesas no cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          dt = new Date(parcela.vencimento);
          if (dt >= seisMesesAtras && dt <= hoje) {
            let key = dt.getFullYear() + "-" + (dt.getMonth() + 1);
            despesasMes[key] = (despesasMes[key] || 0) + parseFloat(parcela.valor);
          }
        });
      }
    });
    
    // Preparar dados para regressão linear
    const keys = Object.keys(despesasMes).sort();
    let x = [];
    let y = [];
    let labels = [];
    
    keys.forEach((k, index) => {
      x.push(index + 1);
      y.push(despesasMes[k]);
      
      // Formatar rótulo do mês
      const [ano, mes] = k.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      labels.push(data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }));
    });
    
    // Calcular regressão linear
    const { m, b } = regressaoLinear(x, y);
    
    // Calcular previsões para os próximos 3 meses
    let previsoes = [];
    let labelsPrevisao = [];
    
    for (let i = 1; i <= 3; i++) {
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      labelsPrevisao.push(proximoMes.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }));
      previsoes.push(b + m * (x.length + i));
    }
    
    // Criar gráfico de previsões
    criarGraficoPrevisoes(labels, y, labelsPrevisao, previsoes);
    
    // Atualizar tabela de previsões
    atualizarTabelaPrevisoes(labelsPrevisao, previsoes);
  }).catch(error => {
    console.error("Erro ao calcular previsões:", error);
    exibirToast("Erro ao calcular previsões. Tente novamente.", "danger");
  });
}

/**
 * Calcula os coeficientes da regressão linear
 * @param {Array} x - Array de valores x (índices dos meses)
 * @param {Array} y - Array de valores y (valores das despesas)
 * @returns {Object} Coeficientes m (inclinação) e b (intercepto)
 */
function regressaoLinear(x, y) {
  let n = x.length;
  let sumX = x.reduce((a, b) => a + b, 0);
  let sumY = y.reduce((a, b) => a + b, 0);
  let sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
  let sumX2 = x.reduce((acc, val) => acc + val * val, 0);
  
  // Fórmulas da regressão linear
  let m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  let b = (sumY - m * sumX) / n;
  
  return { m, b };
}

/**
 * Cria o gráfico de previsões
 * @param {Array} labelsHistorico - Rótulos dos meses do histórico
 * @param {Array} valoresHistorico - Valores das despesas do histórico
 * @param {Array} labelsPrevisao - Rótulos dos meses da previsão
 * @param {Array} valoresPrevisao - Valores previstos das despesas
 */
function criarGraficoPrevisoes(labelsHistorico, valoresHistorico, labelsPrevisao, valoresPrevisao) {
  // Destruir gráfico anterior se existir
  if (window.graficoPrevisao) {
    window.graficoPrevisao.destroy();
  }
  
  // Configurar opções do gráfico
  const options = {
    series: [
      {
        name: 'Histórico',
        data: valoresHistorico
      },
      {
        name: 'Previsão',
        data: [...Array(valoresHistorico.length).fill(null), ...valoresPrevisao]
      }
    ],
    chart: {
      type: 'line',
      height: 350,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      },
      toolbar: {
        show: true
      }
    },
    stroke: {
      width: [3, 3],
      curve: 'smooth',
      dashArray: [0, 5]
    },
    colors: ['#4caf50', '#ff9800'],
    xaxis: {
      categories: [...labelsHistorico, ...labelsPrevisao],
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Valor (R$)'
      },
      labels: {
        formatter: function(value) {
          return "R$ " + value.toFixed(2);
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return "R$ " + value.toFixed(2);
        }
      }
    },
    legend: {
      position: 'top'
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    grid: {
      borderColor: '#e0e0e0',
      row: {
        colors: ['#f8f9fa', 'transparent'],
        opacity: 0.5
      }
    }
  };
  
  // Criar gráfico
  window.graficoPrevisao = new ApexCharts(document.getElementById("novo_graficoPrevisao"), options);
  window.graficoPrevisao.render();
}

/**
 * Atualiza a tabela de previsões
 * @param {Array} labels - Rótulos dos meses
 * @param {Array} valores - Valores previstos
 */
function atualizarTabelaPrevisoes(labels, valores) {
  const tabela = document.getElementById("novo_tabelaPrevisao");
  tabela.innerHTML = "";
  
  // Criar tabela
  const table = document.createElement("table");
  table.className = "table";
  
  // Cabeçalho
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  
  const thMes = document.createElement("th");
  thMes.textContent = "Mês";
  headerRow.appendChild(thMes);
  
  const thValor = document.createElement("th");
  thValor.textContent = "Valor Previsto";
  headerRow.appendChild(thValor);
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Corpo da tabela
  const tbody = document.createElement("tbody");
  
  // Adicionar linhas com previsões
  labels.forEach((label, index) => {
    const row = document.createElement("tr");
    
    const tdMes = document.createElement("td");
    tdMes.textContent = label;
    row.appendChild(tdMes);
    
    const tdValor = document.createElement("td");
    tdValor.textContent = "R$ " + valores[index].toFixed(2);
    row.appendChild(tdValor);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  
  // Adicionar tabela ao container
  tabela.appendChild(table);
  
  // Adicionar informações adicionais
  const info = document.createElement("div");
  info.className = "previsao-info";
  info.innerHTML = `
    <p class="mt-3">
      <i class="fas fa-info-circle text-primary"></i>
      As previsões são baseadas no histórico dos últimos 6 meses e podem variar conforme seus hábitos de consumo.
    </p>
  `;
  
  tabela.appendChild(info);
}

/**
 * Inicializa o módulo de previsões
 */
function inicializarModuloPrevisoes() {
  // Verificar se estamos na seção de previsões
  if (document.getElementById('previsaoSection').style.display !== 'none') {
    novo_calcularPrevisoes();
  }
}

// Exportar funções
window.novo_calcularPrevisoes = novo_calcularPrevisoes;
