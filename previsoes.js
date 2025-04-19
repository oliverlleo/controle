/**
 * Módulo de Previsões Financeiras para o Sistema de Gerenciamento de Contas
 * 
 * Este módulo implementa:
 * - Previsão de gastos para os próximos meses
 * - Análise de tendências de despesas
 * - Sugestões de economia baseadas em padrões de gastos
 */

'use strict';

// Inicialização do módulo de previsões
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar gráficos vazios
  inicializarGraficoPrevisao();
});

/**
 * Inicializa o gráfico de previsão com dados vazios
 */
function inicializarGraficoPrevisao() {
  const graficoElement = document.getElementById('novo_graficoPrevisao');
  if (!graficoElement) return;
  
  const options = {
    series: [{
      name: 'Gastos Reais',
      data: []
    }, {
      name: 'Previsão',
      data: []
    }],
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    colors: ['var(--primary)', 'var(--danger)'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: [3, 2],
      dashArray: [0, 5]
    },
    grid: {
      borderColor: '#e9ecef',
      row: {
        colors: ['#f8f9fa', 'transparent'],
        opacity: 0.5
      }
    },
    markers: {
      size: 5
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Mês'
      }
    },
    yaxis: {
      title: {
        text: 'Valor (R$)'
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return `R$ ${value.toFixed(2)}`;
        }
      }
    }
  };

  window.graficoPrevisao = new ApexCharts(graficoElement, options);
  window.graficoPrevisao.render();
}

/**
 * Calcula e exibe previsões de gastos para os próximos meses
 */
function novo_calcularPrevisoes() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Obter histórico de gastos dos últimos 6 meses
  const dataInicio = new Date(anoAtual, mesAtual - 5, 1);
  
  db.ref("despesas").once("value").then(snapshot => {
    // Estrutura para armazenar gastos mensais
    let gastosMensais = {};
    let gastosPorCategoria = {};
    
    // Inicializar arrays para os últimos 6 meses
    for (let i = 0; i < 6; i++) {
      const data = new Date(anoAtual, mesAtual - 5 + i, 1);
      const chave = `${data.getFullYear()}-${data.getMonth() + 1}`;
      gastosMensais[chave] = 0;
      gastosPorCategoria[chave] = {};
    }
    
    // Processar despesas
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Função para processar uma despesa e adicionar ao total mensal
      const processarDespesa = (valor, data, categoria) => {
        const dataVencimento = new Date(data);
        
        // Verificar se está dentro do período de análise
        if (dataVencimento >= dataInicio && dataVencimento <= hoje) {
          const chave = `${dataVencimento.getFullYear()}-${dataVencimento.getMonth() + 1}`;
          
          // Adicionar ao total mensal
          if (gastosMensais[chave] !== undefined) {
            gastosMensais[chave] += parseFloat(valor);
            
            // Adicionar à categoria
            if (!gastosPorCategoria[chave][categoria]) {
              gastosPorCategoria[chave][categoria] = 0;
            }
            gastosPorCategoria[chave][categoria] += parseFloat(valor);
          }
        }
      };
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        processarDespesa(despesa.valor, despesa.dataCompra, despesa.categoria);
      } 
      // Verificar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (parcela.vencimento) {
            processarDespesa(parcela.valor, parcela.vencimento, despesa.categoria);
          }
        });
      }
    });
    
    // Calcular previsões para os próximos 3 meses
    const previsoes = calcularPrevisoesFuturas(gastosMensais, gastosPorCategoria);
    
    // Atualizar gráfico
    atualizarGraficoPrevisao(gastosMensais, previsoes);
    
    // Atualizar tabela de previsões
    atualizarTabelaPrevisao(previsoes);
    
    // Gerar sugestões de economia
    const sugestoes = gerarSugestoesEconomia(gastosPorCategoria, previsoes);
    exibirSugestoesEconomia(sugestoes);
  });
}

/**
 * Calcula previsões para os próximos meses com base no histórico
 */
function calcularPrevisoesFuturas(gastosMensais, gastosPorCategoria) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Converter objeto em array para facilitar cálculos
  const historicoGastos = Object.entries(gastosMensais).map(([chave, valor]) => {
    const [ano, mes] = chave.split('-').map(Number);
    return { ano, mes, valor };
  }).sort((a, b) => {
    if (a.ano !== b.ano) return a.ano - b.ano;
    return a.mes - b.mes;
  });
  
  // Calcular média móvel ponderada (dando mais peso aos meses mais recentes)
  const pesos = [0.05, 0.1, 0.15, 0.2, 0.2, 0.3]; // Soma = 1
  let mediaMovelPonderada = 0;
  
  for (let i = 0; i < historicoGastos.length; i++) {
    mediaMovelPonderada += historicoGastos[i].valor * pesos[i];
  }
  
  // Calcular tendência (crescimento/decrescimento)
  let tendencia = 0;
  if (historicoGastos.length >= 3) {
    // Usar regressão linear simples para estimar tendência
    const n = 3; // Usar os últimos 3 meses para tendência
    const ultimosMeses = historicoGastos.slice(-n);
    
    let somaX = 0;
    let somaY = 0;
    let somaXY = 0;
    let somaX2 = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = ultimosMeses[i].valor;
      
      somaX += x;
      somaY += y;
      somaXY += x * y;
      somaX2 += x * x;
    }
    
    const mediaX = somaX / n;
    const mediaY = somaY / n;
    
    // Coeficiente angular da reta (tendência)
    const numerador = somaXY - n * mediaX * mediaY;
    const denominador = somaX2 - n * mediaX * mediaX;
    
    if (denominador !== 0) {
      tendencia = numerador / denominador;
    }
  }
  
  // Calcular previsões para os próximos 3 meses
  const previsoes = [];
  
  for (let i = 1; i <= 3; i++) {
    const dataPrevisao = new Date(anoAtual, mesAtual + i, 1);
    const mesPrevisao = dataPrevisao.getMonth() + 1;
    const anoPrevisao = dataPrevisao.getFullYear();
    
    // Aplicar média móvel ponderada + tendência
    const valorPrevisto = mediaMovelPonderada + (tendencia * i);
    
    // Ajustar para sazonalidade (se houver dados do ano anterior)
    let fatorSazonal = 1;
    const mesAnterior = `${anoPrevisao - 1}-${mesPrevisao}`;
    if (gastosMensais[mesAnterior]) {
      // Comparar com média anual do ano anterior
      const mediaAnualAnterior = Object.entries(gastosMensais)
        .filter(([chave]) => chave.startsWith(`${anoPrevisao - 1}`))
        .reduce((soma, [_, valor]) => soma + valor, 0) / 12;
      
      if (mediaAnualAnterior > 0) {
        fatorSazonal = gastosMensais[mesAnterior] / mediaAnualAnterior;
      }
    }
    
    // Aplicar fator sazonal
    const valorFinal = Math.max(0, valorPrevisto * fatorSazonal);
    
    previsoes.push({
      mes: mesPrevisao,
      ano: anoPrevisao,
      valor: valorFinal,
      tendencia: tendencia > 0 ? 'aumento' : (tendencia < 0 ? 'redução' : 'estável')
    });
  }
  
  return previsoes;
}

/**
 * Atualiza o gráfico de previsão com dados históricos e previsões
 */
function atualizarGraficoPrevisao(gastosMensais, previsoes) {
  if (!window.graficoPrevisao) return;
  
  // Preparar dados para o gráfico
  const meses = [];
  const valoresReais = [];
  const valoresPrevistos = [];
  
  // Adicionar dados históricos
  Object.entries(gastosMensais).forEach(([chave, valor]) => {
    const [ano, mes] = chave.split('-').map(Number);
    meses.push(obterNomeMes(mes - 1) + '/' + String(ano).slice(-2));
    valoresReais.push(valor);
    valoresPrevistos.push(null); // Sem previsão para dados históricos
  });
  
  // Adicionar previsões
  previsoes.forEach(previsao => {
    meses.push(obterNomeMes(previsao.mes - 1) + '/' + String(previsao.ano).slice(-2));
    valoresReais.push(null); // Sem dados reais para previsões
    valoresPrevistos.push(previsao.valor);
  });
  
  // Atualizar gráfico
  window.graficoPrevisao.updateOptions({
    xaxis: {
      categories: meses
    }
  });
  
  window.graficoPrevisao.updateSeries([
    {
      name: 'Gastos Reais',
      data: valoresReais
    },
    {
      name: 'Previsão',
      data: valoresPrevistos
    }
  ]);
}

/**
 * Atualiza a tabela de previsão com os dados calculados
 */
function atualizarTabelaPrevisao(previsoes) {
  const tabelaElement = document.getElementById('novo_tabelaPrevisao');
  if (!tabelaElement) return;
  
  let html = '<div class="table-container"><table><thead><tr>' +
             '<th>Mês</th><th>Previsão (R$)</th><th>Tendência</th>' +
             '</tr></thead><tbody>';
  
  previsoes.forEach(previsao => {
    const nomeMes = obterNomeMes(previsao.mes - 1);
    const tendenciaClasse = previsao.tendencia === 'aumento' ? 'text-danger' : 
                           (previsao.tendencia === 'redução' ? 'text-success' : '');
    const tendenciaIcone = previsao.tendencia === 'aumento' ? 'fa-arrow-up' : 
                          (previsao.tendencia === 'redução' ? 'fa-arrow-down' : 'fa-equals');
    
    html += `<tr>
              <td>${nomeMes}/${previsao.ano}</td>
              <td>R$ ${previsao.valor.toFixed(2)}</td>
              <td class="${tendenciaClasse}">
                <i class="fas ${tendenciaIcone}"></i> 
                ${previsao.tendencia.charAt(0).toUpperCase() + previsao.tendencia.slice(1)}
              </td>
            </tr>`;
  });
  
  html += '</tbody></table></div>';
  
  // Adicionar ao elemento
  tabelaElement.innerHTML = html;
}

/**
 * Gera sugestões de economia com base nos padrões de gastos
 */
function gerarSugestoesEconomia(gastosPorCategoria, previsoes) {
  const sugestoes = [];
  
  // Identificar categorias com maior crescimento
  const categoriasCrescimento = identificarCategoriasCrescimento(gastosPorCategoria);
  
  // Adicionar sugestões baseadas nas categorias com maior crescimento
  categoriasCrescimento.forEach(categoria => {
    if (categoria.crescimento > 15) {
      // Crescimento significativo
      sugestoes.push({
        tipo: 'alerta',
        mensagem: `Seus gastos com ${window.novo_categoriasMap[categoria.id] || 'Categoria'} aumentaram ${categoria.crescimento.toFixed(0)}% nos últimos meses. Considere revisar esses gastos.`,
        economia: categoria.valorMedio * 0.2 // Sugestão de economia de 20%
      });
    }
  });
  
  // Verificar se o total previsto excede a renda
  let rendaTotal = 0;
  db.ref("pessoas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const pessoa = child.val();
      if (pessoa.salarioLiquido) {
        rendaTotal += parseFloat(pessoa.salarioLiquido);
      }
    });
    
    if (rendaTotal > 0 && previsoes.length > 0) {
      const proximoMesPrevisao = previsoes[0].valor;
      
      if (proximoMesPrevisao > rendaTotal * 0.7) {
        // Gastos previstos acima de 70% da renda
        sugestoes.push({
          tipo: 'aviso',
          mensagem: `Seus gastos previstos para o próximo mês (R$ ${proximoMesPrevisao.toFixed(2)}) representam ${((proximoMesPrevisao / rendaTotal) * 100).toFixed(0)}% da sua renda mensal. Recomendamos reduzir despesas não essenciais.`,
          economia: proximoMesPrevisao - (rendaTotal * 0.7)
        });
      }
    }
  });
  
  return sugestoes;
}

/**
 * Identifica categorias com maior crescimento de gastos
 */
function identificarCategoriasCrescimento(gastosPorCategoria) {
  const categorias = {};
  
  // Processar gastos por categoria e mês
  Object.entries(gastosPorCategoria).forEach(([chave, categoriasDoMes]) => {
    Object.entries(categoriasDoMes).forEach(([categoriaId, valor]) => {
      if (!categorias[categoriaId]) {
        categorias[categoriaId] = {
          id: categoriaId,
          gastosMensais: [],
          total: 0,
          count: 0
        };
      }
      
      categorias[categoriaId].gastosMensais.push(valor);
      categorias[categoriaId].total += valor;
      categorias[categoriaId].count++;
    });
  });
  
  // Calcular crescimento para cada categoria
  const resultado = Object.values(categorias).map(categoria => {
    // Precisa de pelo menos 2 meses de dados
    if (categoria.gastosMensais.length < 2) {
      return {
        id: categoria.id,
        crescimento: 0,
        valorMedio: categoria.total / categoria.count
      };
    }
    
    // Calcular média dos primeiros meses vs. últimos meses
    const meio = Math.floor(categoria.gastosMensais.length / 2);
    const primeirosMeses = categoria.gastosMensais.slice(0, meio);
    const ultimosMeses = categoria.gastosMensais.slice(meio);
    
    const mediaPrimeiros = primeirosMeses.reduce((a, b) => a + b, 0) / primeirosMeses.length;
    const mediaUltimos = ultimosMeses.reduce((a, b) => a + b, 0) / ultimosMeses.length;
    
    // Calcular crescimento percentual
    let crescimento = 0;
    if (mediaPrimeiros > 0) {
      crescimento = ((mediaUltimos - mediaPrimeiros) / mediaPrimeiros) * 100;
    }
    
    return {
      id: categoria.id,
      crescimento,
      valorMedio: categoria.total / categoria.count
    };
  });
  
  // Ordenar por crescimento (do maior para o menor)
  return resultado.sort((a, b) => b.crescimento - a.crescimento);
}

/**
 * Exibe sugestões de economia na interface
 */
function exibirSugestoesEconomia(sugestoes) {
  if (sugestoes.length === 0) return;
  
  // Exibir toast com a sugestão mais importante
  const sugestaoPrincipal = sugestoes[0];
  exibirToast(sugestaoPrincipal.mensagem, sugestaoPrincipal.tipo === 'alerta' ? 'danger' : 'warning');
  
  // Adicionar todas as sugestões à seção de previsões
  const tabelaElement = document.getElementById('novo_tabelaPrevisao');
  if (!tabelaElement) return;
  
  let html = '<h3 class="mb-3 mt-4">Sugestões de Economia</h3>';
  
  sugestoes.forEach(sugestao => {
    const tipoClasse = sugestao.tipo === 'alerta' ? 'text-danger' : 'text-warning';
    const icone = sugestao.tipo === 'alerta' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    html += `
      <div class="card mb-3">
        <div class="d-flex gap-2 align-center">
          <div class="${tipoClasse}" style="font-size: 1.5rem;">
            <i class="fas ${icone}"></i>
          </div>
          <div>
            <p>${sugestao.mensagem}</p>
            <p class="text-success">
              <strong>Economia potencial: R$ ${sugestao.economia.toFixed(2)}</strong>
            </p>
          </div>
        </div>
      </div>
    `;
  });
  
  // Adicionar ao elemento após a tabela
  tabelaElement.innerHTML += html;
}

/**
 * Retorna o nome do mês a partir do índice (0-11)
 */
function obterNomeMes(indice) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return meses[indice] || '';
}
