/**
 * Sistema de Alertas para o Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Alertas para contas próximas do vencimento
 * - Avisos quando gastos ultrapassam limites definidos
 * - Configuração de limites por categoria
 */

'use strict';

// Configurações padrão para limites
const LIMITES_PADRAO = {
  global: 5000,
  diasAlerta: 5
};

// Inicialização do módulo de alertas
document.addEventListener('DOMContentLoaded', () => {
  // Verificar alertas ao carregar a página
  setTimeout(() => {
    verificarContasProximasVencimento();
    verificarLimitesGastos();
  }, 2000);
  
  // Configurar verificação periódica de alertas (a cada 1 hora)
  setInterval(() => {
    verificarContasProximasVencimento();
    verificarLimitesGastos();
  }, 3600000);
});

/**
 * Verifica contas próximas do vencimento e exibe alertas
 */
function verificarContasProximasVencimento() {
  const hoje = new Date();
  const diasAlerta = obterDiasAlerta();
  
  db.ref("despesas").once("value").then(snapshot => {
    let contasProximas = [];
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Verificar despesas à vista não pagas
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const dataVencimento = new Date(despesa.dataCompra);
        const diffDias = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
        
        if (diffDias >= 0 && diffDias <= diasAlerta) {
          contasProximas.push({
            id: child.key,
            descricao: despesa.descricao,
            valor: despesa.valor,
            vencimento: dataVencimento,
            diasRestantes: diffDias
          });
        }
      } 
      // Verificar parcelas de cartão não pagas
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            const diffDias = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
            
            if (diffDias >= 0 && diffDias <= diasAlerta) {
              contasProximas.push({
                id: `${child.key}|${index}`,
                descricao: `${despesa.descricao} - Parcela ${index + 1}`,
                valor: parcela.valor,
                vencimento: dataVencimento,
                diasRestantes: diffDias
              });
            }
          }
        });
      }
    });
    
    // Exibir alertas para contas próximas do vencimento
    if (contasProximas.length > 0) {
      // Ordenar por proximidade de vencimento
      contasProximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
      
      // Exibir alerta para a conta mais próxima do vencimento
      const contaUrgente = contasProximas[0];
      const mensagem = contaUrgente.diasRestantes === 0 
        ? `Vence hoje: ${contaUrgente.descricao} - R$ ${parseFloat(contaUrgente.valor).toFixed(2)}`
        : `Vence em ${contaUrgente.diasRestantes} dia(s): ${contaUrgente.descricao} - R$ ${parseFloat(contaUrgente.valor).toFixed(2)}`;
      
      exibirToast(mensagem, 'warning');
      
      // Atualizar seção de alertas
      atualizarSecaoAlertas(contasProximas);
    }
  });
}

/**
 * Verifica se os gastos ultrapassaram os limites definidos
 */
function verificarLimitesGastos() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Obter limites configurados
  db.ref("limites").once("value").then(snapshotLimites => {
    const limites = snapshotLimites.val() || { global: LIMITES_PADRAO.global };
    
    // Calcular gastos do mês atual por categoria
    db.ref("despesas").once("value").then(snapshot => {
      let gastosPorCategoria = {};
      let gastoTotal = 0;
      
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Função para processar uma despesa e adicionar ao total da categoria
        const processarDespesa = (valor, data, categoria) => {
          const dataVencimento = new Date(data);
          
          // Verificar se é do mês atual
          if (dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual) {
            // Inicializar categoria se não existir
            if (!gastosPorCategoria[categoria]) {
              gastosPorCategoria[categoria] = 0;
            }
            
            // Adicionar valor aos totais
            gastosPorCategoria[categoria] += parseFloat(valor);
            gastoTotal += parseFloat(valor);
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
      
      // Verificar limites por categoria
      let alertasLimites = [];
      
      // Verificar limite global
      if (gastoTotal > limites.global) {
        alertasLimites.push({
          categoria: 'Global',
          gasto: gastoTotal,
          limite: limites.global,
          percentual: Math.round((gastoTotal / limites.global) * 100)
        });
      }
      
      // Verificar limites por categoria
      Object.keys(gastosPorCategoria).forEach(categoriaId => {
        if (limites[categoriaId] && gastosPorCategoria[categoriaId] > limites[categoriaId]) {
          alertasLimites.push({
            categoria: window.novo_categoriasMap[categoriaId] || 'Categoria',
            gasto: gastosPorCategoria[categoriaId],
            limite: limites[categoriaId],
            percentual: Math.round((gastosPorCategoria[categoriaId] / limites[categoriaId]) * 100)
          });
        }
      });
      
      // Exibir alertas de limites excedidos
      if (alertasLimites.length > 0) {
        // Ordenar por percentual excedido (do maior para o menor)
        alertasLimites.sort((a, b) => b.percentual - a.percentual);
        
        // Exibir alerta para o limite mais excedido
        const limiteExcedido = alertasLimites[0];
        const mensagem = `Limite excedido: ${limiteExcedido.categoria} - ${limiteExcedido.percentual}% do limite (R$ ${limiteExcedido.gasto.toFixed(2)} de R$ ${limiteExcedido.limite.toFixed(2)})`;
        
        exibirToast(mensagem, 'danger');
        
        // Atualizar seção de alertas com limites excedidos
        atualizarSecaoAlertasLimites(alertasLimites);
      }
    });
  });
}

/**
 * Atualiza a seção de alertas com contas próximas do vencimento
 */
function atualizarSecaoAlertas(contasProximas) {
  const listaAlertas = document.getElementById('novo_listaAlertas');
  if (!listaAlertas) return;
  
  let html = '<h3 class="mb-3">Contas Próximas do Vencimento</h3>';
  
  if (contasProximas.length === 0) {
    html += '<p>Não há contas próximas do vencimento.</p>';
  } else {
    html += '<div class="table-container"><table><thead><tr>' +
            '<th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Dias Restantes</th><th>Ações</th>' +
            '</tr></thead><tbody>';
    
    contasProximas.forEach(conta => {
      const dataFormatada = conta.vencimento.toLocaleDateString('pt-BR');
      const classeAlerta = conta.diasRestantes === 0 ? 'text-danger' : (conta.diasRestantes <= 2 ? 'text-warning' : '');
      
      html += `<tr>
                <td>${conta.descricao}</td>
                <td>R$ ${parseFloat(conta.valor).toFixed(2)}</td>
                <td>${dataFormatada}</td>
                <td class="${classeAlerta}">${conta.diasRestantes} dia(s)</td>
                <td><button class="btn btn-success btn-sm" onclick="pagarDespesaPorId('${conta.id}')">Pagar</button></td>
              </tr>`;
    });
    
    html += '</tbody></table></div>';
  }
  
  // Adicionar ao conteúdo existente (não substituir completamente)
  listaAlertas.innerHTML = html + (listaAlertas.innerHTML.includes('Limites Excedidos') ? listaAlertas.innerHTML.split('<h3 class="mb-3 mt-4">Limites Excedidos</h3>')[1] : '');
}

/**
 * Atualiza a seção de alertas com limites excedidos
 */
function atualizarSecaoAlertasLimites(alertasLimites) {
  const listaAlertas = document.getElementById('novo_listaAlertas');
  if (!listaAlertas) return;
  
  let html = '';
  
  if (alertasLimites.length > 0) {
    html += '<h3 class="mb-3 mt-4">Limites Excedidos</h3>';
    html += '<div class="table-container"><table><thead><tr>' +
            '<th>Categoria</th><th>Gasto Atual</th><th>Limite</th><th>Percentual</th>' +
            '</tr></thead><tbody>';
    
    alertasLimites.forEach(alerta => {
      const classeAlerta = alerta.percentual >= 120 ? 'text-danger' : 'text-warning';
      
      html += `<tr>
                <td>${alerta.categoria}</td>
                <td>R$ ${alerta.gasto.toFixed(2)}</td>
                <td>R$ ${alerta.limite.toFixed(2)}</td>
                <td class="${classeAlerta}">${alerta.percentual}%</td>
              </tr>`;
    });
    
    html += '</tbody></table></div>';
  }
  
  // Se já existe conteúdo de contas próximas, manter e adicionar limites
  if (listaAlertas.innerHTML.includes('Contas Próximas do Vencimento')) {
    listaAlertas.innerHTML = listaAlertas.innerHTML.split('<h3 class="mb-3 mt-4">Limites Excedidos</h3>')[0] + html;
  } else {
    listaAlertas.innerHTML += html;
  }
}

/**
 * Carrega e exibe a interface de configuração de limites
 */
function novo_carregarLimites() {
  const limitesContainer = document.getElementById('novo_limitesContainer');
  if (!limitesContainer) return;
  
  // Obter categorias
  db.ref("categorias").once("value").then(snapshotCategorias => {
    // Obter limites atuais
    db.ref("limites").once("value").then(snapshotLimites => {
      const limites = snapshotLimites.val() || { 
        global: LIMITES_PADRAO.global,
        diasAlerta: LIMITES_PADRAO.diasAlerta
      };
      
      let html = `
        <div class="form-group">
          <label class="form-label">Limite Global Mensal (R$):</label>
          <input type="number" id="limiteGlobal" class="form-control" value="${limites.global || LIMITES_PADRAO.global}" min="0" step="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">Dias para Alerta de Vencimento:</label>
          <input type="number" id="diasAlerta" class="form-control" value="${limites.diasAlerta || LIMITES_PADRAO.diasAlerta}" min="1" max="30">
        </div>
        <h3 class="mb-3 mt-4">Limites por Categoria</h3>
      `;
      
      // Adicionar campos para cada categoria
      snapshotCategorias.forEach(child => {
        const categoria = child.val();
        const categoriaId = child.key;
        const limiteCategoria = limites[categoriaId] || '';
        
        html += `
          <div class="form-group">
            <label class="form-label">${categoria.nome}:</label>
            <input type="number" id="limite_${categoriaId}" class="form-control" value="${limiteCategoria}" min="0" step="0.01" placeholder="Sem limite">
          </div>
        `;
      });
      
      limitesContainer.innerHTML = html;
    });
  });
}

/**
 * Salva os limites configurados
 */
function novo_salvarLimites() {
  const limiteGlobal = parseFloat(document.getElementById('limiteGlobal').value) || LIMITES_PADRAO.global;
  const diasAlerta = parseInt(document.getElementById('diasAlerta').value) || LIMITES_PADRAO.diasAlerta;
  
  let limites = {
    global: limiteGlobal,
    diasAlerta: diasAlerta
  };
  
  // Obter limites por categoria
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoriaId = child.key;
      const inputLimite = document.getElementById(`limite_${categoriaId}`);
      
      if (inputLimite && inputLimite.value) {
        limites[categoriaId] = parseFloat(inputLimite.value);
      }
    });
    
    // Salvar limites no Firebase
    db.ref("limites").set(limites).then(() => {
      exibirToast('Limites salvos com sucesso!', 'success');
      fecharModal('novo_limitesModal');
      
      // Verificar limites após salvar
      verificarLimitesGastos();
    }).catch(error => {
      console.error("Erro ao salvar limites:", error);
      exibirToast('Erro ao salvar limites. Tente novamente.', 'danger');
    });
  });
}

/**
 * Obtém o número de dias para alerta de vencimento
 */
function obterDiasAlerta() {
  // Valor padrão
  let diasAlerta = LIMITES_PADRAO.diasAlerta;
  
  // Tentar obter do localStorage para resposta imediata
  const limitesLocal = localStorage.getItem('limites');
  if (limitesLocal) {
    try {
      const limites = JSON.parse(limitesLocal);
      if (limites.diasAlerta) {
        diasAlerta = limites.diasAlerta;
      }
    } catch (e) {
      console.error("Erro ao ler limites do localStorage:", e);
    }
  }
  
  // Atualizar do Firebase de forma assíncrona
  db.ref("limites/diasAlerta").once("value").then(snapshot => {
    if (snapshot.exists()) {
      diasAlerta = snapshot.val();
      
      // Atualizar localStorage para futuras consultas rápidas
      try {
        const limitesLocal = localStorage.getItem('limites');
        const limites = limitesLocal ? JSON.parse(limitesLocal) : {};
        limites.diasAlerta = diasAlerta;
        localStorage.setItem('limites', JSON.stringify(limites));
      } catch (e) {
        console.error("Erro ao salvar limites no localStorage:", e);
      }
    }
  });
  
  return diasAlerta;
}

/**
 * Exibe uma notificação toast
 */
function exibirToast(mensagem, tipo = 'primary') {
  // Usar Toastify para exibir notificação
  Toastify({
    text: mensagem,
    duration: 5000,
    close: true,
    gravity: "bottom",
    position: "right",
    backgroundColor: tipo === 'success' ? 'var(--success)' : 
                     tipo === 'danger' ? 'var(--danger)' : 
                     tipo === 'warning' ? 'var(--warning)' : 
                     'var(--primary)',
    stopOnFocus: true,
    className: `toast-${tipo}`
  }).showToast();
}

/**
 * Paga uma despesa pelo ID
 */
function pagarDespesaPorId(id) {
  // Verificar se é uma parcela de cartão
  if (id.includes('|')) {
    const [despesaId, parcelaIndex] = id.split('|');
    
    db.ref(`despesas/${despesaId}/parcelas/${parcelaIndex}`).update({
      pago: true,
      dataPagamento: new Date().toISOString().split('T')[0]
    }).then(() => {
      exibirToast('Parcela paga com sucesso!', 'success');
      verificarContasProximasVencimento();
    }).catch(error => {
      console.error("Erro ao pagar parcela:", error);
      exibirToast('Erro ao pagar parcela. Tente novamente.', 'danger');
    });
  } else {
    // Despesa à vista
    db.ref(`despesas/${id}`).update({
      pago: true,
      dataPagamento: new Date().toISOString().split('T')[0]
    }).then(() => {
      exibirToast('Despesa paga com sucesso!', 'success');
      verificarContasProximasVencimento();
    }).catch(error => {
      console.error("Erro ao pagar despesa:", error);
      exibirToast('Erro ao pagar despesa. Tente novamente.', 'danger');
    });
  }
}
