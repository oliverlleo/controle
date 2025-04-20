/**
 * Módulo de Alertas para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Verificação de despesas próximas do vencimento
 * - Alertas de limites de gastos por categoria
 * - Notificações de despesas vencidas
 */

'use strict';

/**
 * Verifica alertas de despesas e limites
 */
function novo_verificarAlertas() {
  const hoje = new Date();
  const alertaLista = document.getElementById("novo_listaAlertas");
  alertaLista.innerHTML = "";
  
  // Criar container para os alertas
  const alertasContainer = document.createElement("div");
  alertasContainer.className = "alertas-container";
  
  // Verificar despesas próximas do vencimento
  verificarDespesasProximasVencimento(hoje, alertasContainer);
  
  // Verificar limites de categorias
  verificarLimitesCategorias(alertasContainer);
  
  // Verificar despesas vencidas
  verificarDespesasVencidas(alertasContainer);
  
  // Adicionar container ao DOM
  alertaLista.appendChild(alertasContainer);
}

/**
 * Verifica despesas próximas do vencimento
 * @param {Date} hoje - Data atual
 * @param {HTMLElement} container - Container para adicionar os alertas
 */
function verificarDespesasProximasVencimento(hoje, container) {
  db.ref("despesas").once("value").then(snapshot => {
    let alertasVencimento = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        let dataCompra = new Date(despesa.dataCompra);
        let diffDays = Math.ceil((dataCompra - hoje) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 5) {
          alertasVencimento.push({
            tipo: "vencimento",
            mensagem: `Despesa "${despesa.descricao}" vence em ${diffDays} dias.`,
            data: dataCompra,
            dias: diffDays,
            valor: parseFloat(despesa.valor) || 0
          });
        }
      } 
      // Verificar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            let venc = new Date(parcela.vencimento);
            let diffDays = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays <= 5) {
              alertasVencimento.push({
                tipo: "vencimento",
                mensagem: `Parcela ${index+1} de "${despesa.descricao}" vence em ${diffDays} dias.`,
                data: venc,
                dias: diffDays,
                valor: parseFloat(parcela.valor) || 0
              });
            }
          }
        });
      }
    });
    
    // Ordenar alertas por data de vencimento
    alertasVencimento.sort((a, b) => a.dias - b.dias);
    
    // Adicionar alertas ao container
    if (alertasVencimento.length > 0) {
      const section = document.createElement("div");
      section.className = "alertas-section";
      
      const header = document.createElement("h3");
      header.className = "alertas-header";
      header.innerHTML = '<i class="fas fa-calendar-alt"></i> Próximos Vencimentos';
      section.appendChild(header);
      
      alertasVencimento.forEach(alerta => {
        const alertaEl = document.createElement("div");
        alertaEl.className = "alerta-item alerta-vencimento";
        
        const diasText = alerta.dias === 0 ? "hoje" : 
                        alerta.dias === 1 ? "amanhã" : 
                        `em ${alerta.dias} dias`;
        
        alertaEl.innerHTML = `
          <div class="alerta-icon"><i class="fas fa-exclamation-circle"></i></div>
          <div class="alerta-content">
            <div class="alerta-title">${alerta.mensagem}</div>
            <div class="alerta-details">
              <span>Vencimento: ${alerta.data.toLocaleDateString()}</span>
              <span>Valor: R$ ${alerta.valor.toFixed(2)}</span>
            </div>
          </div>
        `;
        
        section.appendChild(alertaEl);
        
        // Registrar alerta no histórico
        registrarAlertaHistorico("vencimento", alerta.mensagem);
      });
      
      container.appendChild(section);
    }
  });
}

/**
 * Verifica limites de gastos por categoria
 * @param {HTMLElement} container - Container para adicionar os alertas
 */
function verificarLimitesCategorias(container) {
  // Primeiro, obter os limites configurados
  db.ref("limites_categorias").once("value").then(snapshotLimites => {
    if (!snapshotLimites.exists()) return;
    
    let limites = {};
    snapshotLimites.forEach(child => {
      limites[child.key] = child.val().limite;
    });
    
    // Depois, calcular gastos por categoria
    db.ref("despesas").once("value").then(snapshot => {
      let gastosCategoria = {};
      let hoje = new Date();
      let primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      snapshot.forEach(child => {
        let despesa = child.val();
        if (despesa.pago) return;
        
        let cat = despesa.categoria;
        if (!cat) return;
        
        let valor = 0;
        
        // Despesas à vista
        if (despesa.formaPagamento === "avista") {
          let dataCompra = new Date(despesa.dataCompra);
          if (dataCompra >= primeiroDiaMes) {
            valor = parseFloat(despesa.valor) || 0;
          }
        } 
        // Parcelas de cartão
        else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            if (!parcela.pago) {
              let dataVencimento = new Date(parcela.vencimento);
              if (dataVencimento >= primeiroDiaMes && dataVencimento <= hoje) {
                valor += parseFloat(parcela.valor) || 0;
              }
            }
          });
        }
        
        if (valor > 0) {
          gastosCategoria[cat] = (gastosCategoria[cat] || 0) + valor;
        }
      });
      
      // Verificar categorias que ultrapassaram o limite
      let alertasLimite = [];
      
      Object.keys(limites).forEach(categoriaId => {
        let limite = limites[categoriaId];
        let gasto = gastosCategoria[categoriaId] || 0;
        let percentual = (gasto / limite) * 100;
        
        if (percentual >= 80) {
          let categoriaNome = window.novo_categoriasMap[categoriaId] || categoriaId;
          
          alertasLimite.push({
            tipo: "limite",
            categoria: categoriaNome,
            percentual: percentual,
            gasto: gasto,
            limite: limite,
            mensagem: `Categoria "${categoriaNome}" atingiu ${percentual.toFixed(0)}% do limite.`
          });
        }
      });
      
      // Ordenar alertas por percentual (decrescente)
      alertasLimite.sort((a, b) => b.percentual - a.percentual);
      
      // Adicionar alertas ao container
      if (alertasLimite.length > 0) {
        const section = document.createElement("div");
        section.className = "alertas-section";
        
        const header = document.createElement("h3");
        header.className = "alertas-header";
        header.innerHTML = '<i class="fas fa-chart-pie"></i> Limites de Categorias';
        section.appendChild(header);
        
        alertasLimite.forEach(alerta => {
          const alertaEl = document.createElement("div");
          alertaEl.className = "alerta-item alerta-limite";
          
          // Definir classe baseada no percentual
          if (alerta.percentual >= 100) {
            alertaEl.classList.add("alerta-critico");
          } else if (alerta.percentual >= 90) {
            alertaEl.classList.add("alerta-alto");
          }
          
          alertaEl.innerHTML = `
            <div class="alerta-icon"><i class="fas fa-chart-line"></i></div>
            <div class="alerta-content">
              <div class="alerta-title">${alerta.mensagem}</div>
              <div class="alerta-details">
                <span>Gasto: R$ ${alerta.gasto.toFixed(2)} de R$ ${alerta.limite.toFixed(2)}</span>
              </div>
              <div class="alerta-progress">
                <div class="progress-bar" style="width: ${Math.min(100, alerta.percentual)}%"></div>
              </div>
            </div>
          `;
          
          section.appendChild(alertaEl);
          
          // Registrar alerta no histórico
          registrarAlertaHistorico("limite_excedido", alerta.mensagem);
        });
        
        container.appendChild(section);
      }
    });
  });
}

/**
 * Verifica despesas vencidas
 * @param {HTMLElement} container - Container para adicionar os alertas
 */
function verificarDespesasVencidas(container) {
  const hoje = new Date();
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasVencidas = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        let dataCompra = new Date(despesa.dataCompra);
        let diffDays = Math.ceil((hoje - dataCompra) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          despesasVencidas.push({
            tipo: "vencida",
            mensagem: `Despesa "${despesa.descricao}" está vencida há ${diffDays} dias.`,
            data: dataCompra,
            dias: diffDays,
            valor: parseFloat(despesa.valor) || 0
          });
        }
      } 
      // Verificar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            let venc = new Date(parcela.vencimento);
            let diffDays = Math.ceil((hoje - venc) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              despesasVencidas.push({
                tipo: "vencida",
                mensagem: `Parcela ${index+1} de "${despesa.descricao}" está vencida há ${diffDays} dias.`,
                data: venc,
                dias: diffDays,
                valor: parseFloat(parcela.valor) || 0
              });
            }
          }
        });
      }
    });
    
    // Ordenar despesas vencidas por dias (decrescente)
    despesasVencidas.sort((a, b) => b.dias - a.dias);
    
    // Adicionar alertas ao container
    if (despesasVencidas.length > 0) {
      const section = document.createElement("div");
      section.className = "alertas-section";
      
      const header = document.createElement("h3");
      header.className = "alertas-header";
      header.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Despesas Vencidas';
      section.appendChild(header);
      
      despesasVencidas.forEach(alerta => {
        const alertaEl = document.createElement("div");
        alertaEl.className = "alerta-item alerta-vencida";
        
        alertaEl.innerHTML = `
          <div class="alerta-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="alerta-content">
            <div class="alerta-title">${alerta.mensagem}</div>
            <div class="alerta-details">
              <span>Vencimento: ${alerta.data.toLocaleDateString()}</span>
              <span>Valor: R$ ${alerta.valor.toFixed(2)}</span>
            </div>
          </div>
        `;
        
        section.appendChild(alertaEl);
        
        // Registrar alerta no histórico
        registrarAlertaHistorico("vencida", alerta.mensagem);
      });
      
      container.appendChild(section);
    }
  });
}

/**
 * Registra um alerta no histórico
 * @param {string} tipo - Tipo de alerta
 * @param {string} mensagem - Mensagem do alerta
 */
function registrarAlertaHistorico(tipo, mensagem) {
  const hoje = new Date();
  const dataFormatada = hoje.toISOString().split("T")[0];
  
  // Verificar se o alerta já foi registrado hoje
  db.ref("alertas_historico")
    .orderByChild("data")
    .equalTo(dataFormatada)
    .once("value")
    .then(snapshot => {
      let alertaExiste = false;
      
      snapshot.forEach(child => {
        if (child.val().mensagem === mensagem) {
          alertaExiste = true;
        }
      });
      
      // Se o alerta não existe, registrar
      if (!alertaExiste) {
        db.ref("alertas_historico").push({
          tipo: tipo,
          mensagem: mensagem,
          data: dataFormatada,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      }
    });
}

/**
 * Carrega os limites de categorias para configuração
 */
function novo_carregarLimites() {
  const container = document.getElementById("novo_limitesContainer");
  container.innerHTML = "";
  
  // Primeiro, obter todas as categorias
  db.ref("categorias").once("value").then(snapshot => {
    let categorias = [];
    
    snapshot.forEach(child => {
      categorias.push({
        id: child.key,
        nome: child.val().nome
      });
    });
    
    // Depois, obter os limites configurados
    db.ref("limites_categorias").once("value").then(snapshotLimites => {
      let limites = {};
      
      if (snapshotLimites.exists()) {
        snapshotLimites.forEach(child => {
          limites[child.key] = child.val().limite;
        });
      }
      
      // Criar formulário de limites
      categorias.forEach(categoria => {
        const div = document.createElement("div");
        div.className = "form-group";
        
        const label = document.createElement("label");
        label.className = "form-label";
        label.htmlFor = `novo_limite_${categoria.id}`;
        label.textContent = categoria.nome + ":";
        
        const input = document.createElement("input");
        input.type = "number";
        input.id = `novo_limite_${categoria.id}`;
        input.className = "form-control";
        input.placeholder = `Limite para ${categoria.nome}`;
        input.step = "0.01";
        input.min = "0";
        input.value = limites[categoria.id] || "";
        
        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
      });
    });
  });
}

/**
 * Salva os limites de categorias
 */
function novo_salvarLimites() {
  db.ref("categorias").once("value").then(snapshot => {
    let promises = [];
    
    snapshot.forEach(child => {
      const input = document.getElementById("novo_limite_" + child.key);
      
      if (input && input.value) {
        const limite = parseFloat(input.value);
        
        if (!isNaN(limite) && limite >= 0) {
          const promise = db.ref("limites_categorias").child(child.key).set({
            categoriaId: child.key,
            limite: limite,
            userId: obterUsuarioId() || "default"
          });
          
          promises.push(promise);
        }
      }
    });
    
    // Aguardar todas as promessas serem resolvidas
    Promise.all(promises)
      .then(() => {
        exibirToast("Limites salvos com sucesso!", "success");
        fecharModal("novo_limitesModal");
        novo_verificarAlertas();
      })
      .catch(error => {
        console.error("Erro ao salvar limites:", error);
        exibirToast("Erro ao salvar limites. Tente novamente.", "danger");
      });
  });
}

/**
 * Verifica despesas vencidas e exibe alertas
 */
function novo_verificarDespesasVencidas() {
  const hoje = new Date();
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasVencidas = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        let dataCompra = new Date(despesa.dataCompra);
        
        if (dataCompra < hoje) {
          despesasVencidas.push({
            descricao: despesa.descricao,
            data: dataCompra,
            valor: parseFloat(despesa.valor) || 0
          });
        }
      }
