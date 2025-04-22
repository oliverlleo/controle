'use strict';

/**
 * Sistema de Gerenciamento de Contas Pessoais - Versão Unificada
 * Todos os módulos JavaScript unificados em um único arquivo
 */

// ===================== VARIÁVEIS GLOBAIS =====================
let rendaVisivel = false;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let rangeStart = null;
let rangeEnd = null;
let currentUser = null;

// Mapa de categorias para uso global
window.novo_categoriasMap = {};

// ===================== CONFIGURAÇÃO DO FIREBASE =====================
const firebaseConfig = {
  apiKey: "AIzaSyAG6LktPXGe6F-vSTHV2Y3n95vSwhpXch8",
  authDomain: "controlegasto-df3f1.firebaseapp.com",
  databaseURL: "https://controlegasto-df3f1-default-rtdb.firebaseio.com",
  projectId: "controlegasto-df3f1",
  storageBucket: "controlegasto-df3f1.firebasestorage.app",
  messagingSenderId: "1034936676414",
  appId: "1:1034936676414:web:61c67ce39c3ab71a07a16f",
  measurementId: "G-PTN43GZHGR"
};

// Inicialização do Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
// Definindo db como variável global para ser acessível em todas as funções
var db = firebase.database();

// ===================== FUNÇÕES DE UTILIDADE =====================

/**
 * Inicializa o menu toggle para dispositivos móveis
 */
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
    
    // Fechar menu ao clicar em um link do menu em dispositivos móveis
    const navLinks = document.querySelectorAll('#sidebar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      });
    });
    
    // Ajustar menu ao redimensionar a janela
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
      }
    });
  }
  
  // Inicializar a seção de configurações com a aba de rendas ativa
  if (document.getElementById('configuracoesSection')) {
    showConfigTab('rendaTab');
  }
});

/**
 * A função exibirToast foi movida para utils.js
 * Esta referência é mantida para compatibilidade com código existente
 */
function exibirToast(mensagem, tipo = 'primary') {
  // Chama a função unificada com o estilo 'desktop'
  if (typeof window.utilsExibirToast === 'function') {
    window.utilsExibirToast(mensagem, tipo, 'desktop');
  } else {
    // Fallback para caso a função unificada não esteja disponível
    Toastify({
      text: mensagem,
      duration: 3000,
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
}

/**
 * Mostra uma seção específica e esconde as demais
 * @param {string} sectionId - ID da seção a ser mostrada
 */
function showSection(sectionId) {
  const sections = document.querySelectorAll('main > section');
  sections.forEach(sec => sec.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';
  
  // Atualizar navegação
  document.querySelectorAll('#sidebar .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Encontrar e ativar o link correspondente
  const links = document.querySelectorAll('#sidebar .nav-link');
  for (let i = 0; i < links.length; i++) {
    if (links[i].getAttribute('onclick') && links[i].getAttribute('onclick').includes(sectionId)) {
      links[i].classList.add('active');
      break;
    }
  }
  
  // Inicializar componentes específicos da seção
  if (sectionId === 'previsaoSection') {
    novo_calcularPrevisoes();
  } else if (sectionId === 'alertasSection') {
    novo_verificarAlertas();
  } else if (sectionId === 'configuracoesSection') {
    // Carregar dados para as abas de configurações
    loadRendas();
    loadCategorias();
    loadCartoes();
  }
}

/**
 * Mostra uma aba específica na seção de configurações
 * @param {string} tabId - ID da aba a ser mostrada
 */
function showConfigTab(tabId) {
  // Esconder todas as abas
  const tabPanes = document.querySelectorAll('.config-tab-pane');
  tabPanes.forEach(pane => pane.style.display = 'none');
  
  // Mostrar a aba selecionada
  document.getElementById(tabId).style.display = 'block';
  
  // Atualizar botões de navegação
  const tabButtons = document.querySelectorAll('.config-tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Encontrar e ativar o botão correspondente
  const buttons = document.querySelectorAll('.config-tab-btn');
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].getAttribute('onclick') && buttons[i].getAttribute('onclick').includes(tabId)) {
      buttons[i].classList.add('active');
      break;
    }
  }
  
  // Carregar dados específicos da aba
  if (tabId === "configCategoriasTab") {
    loadCategorias();
  } else if (tabId === 'rendaTab') {
    loadRendas();
  } else if (tabId === 'cartoesTab') {
    loadCartoes();
  }
}

/**
 * Abre um modal
 * @param {string} id - ID do modal a ser aberto
 */
window.abrirModal = function(id) {
  document.getElementById(id).style.display = "flex";
  
  // Inicializar componentes específicos do modal
  if (id === "fonteModal") loadUsuarios();
  if (id === "categoriasModal") loadCategorias();
  if (id === "cartaoModal") loadCartoes();
  if (id === "calendarModal") {
    document.getElementById("calendarTitulo").innerText = "Calendário de Despesas";
    renderCalendar();
  }
  if (id === "pagarDespesaModal") filtrarDespesas();
  if (id === "novo_limitesModal") novo_carregarLimites();
};

/**
 * Filtra as despesas não pagas para o modal de pagamento
 */
function filtrarDespesas() {
  const despesaSelect = document.getElementById("despesaSelect");
  despesaSelect.innerHTML = "<option value=''>Selecione a Despesa</option>";
  document.getElementById("parcelasDiv").classList.add("hidden");
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const key = child.key;
      const despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && !despesa.pago) {
        const option = document.createElement("option");
        option.value = key;
        option.text = `${despesa.descricao} - R$ ${parseFloat(despesa.valor).toFixed(2)} - ${new Date(despesa.dataCompra).toLocaleDateString()}`;
        despesaSelect.appendChild(option);
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        // Verificar se há parcelas não pagas
        let temParcelaNaoPaga = false;
        despesa.parcelas.forEach(parcela => {
          if (!parcela.pago) temParcelaNaoPaga = true;
        });
        
        if (temParcelaNaoPaga) {
          const option = document.createElement("option");
          option.value = key;
          option.text = `${despesa.descricao} - Cartão`;
          despesaSelect.appendChild(option);
        }
      }
    });
  }).catch(error => {
    console.error("Erro ao filtrar despesas:", error);
    exibirToast("Erro ao carregar despesas. Tente novamente.", "danger");
  });
}

/**
 * Fecha um modal
 * @param {string} id - ID do modal a ser fechado
 */
window.fecharModal = function(id) {
  document.getElementById(id).style.display = "none";
};

/**
 * Exporta os dados para um arquivo CSV
 */
function exportData() {
  db.ref("despesas").once("value").then(snapshot => {
    let csv = "Descrição,Valor,Data,Forma de Pagamento\n";
    snapshot.forEach(child => {
      const despesa = child.val();
      if (despesa.formaPagamento === "avista") {
        csv += `${despesa.descricao},${despesa.valor},${despesa.dataCompra},${despesa.formaPagamento}\n`;
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          csv += `${despesa.descricao} - Parcela ${index+1},${parcela.valor},${parcela.vencimento},${despesa.formaPagamento}\n`;
        });
      }
    });
    
    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "despesas.csv";
    a.click();
    
    exibirToast("Dados exportados com sucesso!", "success");
  }).catch(error => {
    console.error("Erro ao exportar dados:", error);
    exibirToast("Erro ao exportar dados. Tente novamente.", "danger");
  });
}

// ===================== MÓDULO PRINCIPAL =====================

/**
 * Preenche o select de ano do dashboard
 */
function preencherDashboardAno() {
  const selectAno = document.getElementById("dashboardYear");
  selectAno.innerHTML = "";
  const currentYear = new Date().getFullYear();
  
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    let option = document.createElement("option");
    option.value = y;
    option.text = y;
    if (y === currentYear) option.selected = true;
    selectAno.appendChild(option);
  }
}

/**
 * Atualiza o dashboard com os dados atuais
 */
function atualizarDashboard() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  let saldo = 0;
  let hoje = new Date();
  
  db.ref("pessoas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      let pessoa = child.val();
      saldo += parseFloat(pessoa.saldoInicial) || 0;
      
      if (pessoa.pagamentos) {
        pessoa.pagamentos.forEach(pag => { 
          let pagamentoDia = parseInt(pag.dia);
          if (pagamentoDia <= hoje.getDate()) {
            saldo += parseFloat(pag.valor) || 0;
          }
        });
      }
    });
    
    db.ref("despesas").once("value").then(snapshot2 => {
      snapshot2.forEach(child => {
        let despesa = child.val();
        if (despesa.pago) {
          if (despesa.formaPagamento === "avista") {
            saldo -= parseFloat(despesa.valor) || 0;
          } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
            despesa.parcelas.forEach(parcela => {
              if (parcela.pago) {
                saldo -= parseFloat(parcela.valor) || 0;
              }
            });
          }
        }
      });
      
      document.getElementById("saldoAtual").innerText = "R$ " + saldo.toFixed(2);
      atualizarDespesasMes();
      currentCalendarMonth = dashboardMonth;
      currentCalendarYear = dashboardYear;
      atualizarGrafico();
      updateProximosVencimentos();
    });
  });
}

/**
 * Atualiza os próximos vencimentos
 */
function updateProximosVencimentos() {
  const hoje = new Date();
  let proximoVencimento = null;
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      let despesa = child.val();
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        let dataCompra = new Date(despesa.dataCompra);
        if (dataCompra >= hoje) {
          if (proximoVencimento === null || dataCompra < proximoVencimento) {
            proximoVencimento = dataCompra;
          }
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (!parcela.pago) {
            let venc = new Date(parcela.vencimento);
            if (venc >= hoje) {
              if (proximoVencimento === null || venc < proximoVencimento) {
                proximoVencimento = venc;
              }
            }
          }
        });
      }
    });
    
    if (proximoVencimento) {
      const diffTime = proximoVencimento - hoje;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      document.getElementById("proximosVencimentos").innerText = diffDays;
    } else {
      document.getElementById("proximosVencimentos").innerText = 0;
    }
  });
}

/**
 * Atualiza as despesas do mês
 */
function atualizarDespesasMes() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  let despesasMes = 0;
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      let despesa = child.val();
      if (despesa.pago) return;
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        let dt = new Date(despesa.dataCompra);
        if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
          despesasMes += parseFloat(despesa.valor) || 0;
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          let dt = new Date(parcela.vencimento);
          if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
            despesasMes += parseFloat(parcela.valor) || 0;
          }
        });
      }
    });
    
    document.getElementById("despesasMes").innerText = "R$ " + despesasMes.toFixed(2);
    document.getElementById("despesasMesTitle").innerText = new Date(dashboardYear, dashboardMonth, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  });
}

/**
 * Carrega o painel de despesas do mês
 */
function carregarPainelDespesasMes() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  const listaContainer = document.getElementById("listaDespesasMes");
  listaContainer.innerHTML = "";
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      let despesa = child.val();
      if (despesa.pago) return;
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        let dt = new Date(despesa.dataCompra);
        if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
          let divDespesa = document.createElement("div");
          divDespesa.className = "despesa-item";
          divDespesa.innerHTML = `
            <div class="despesa-info">
              <div class="despesa-titulo">${despesa.descricao}</div>
              <div class="despesa-detalhe">À Vista - ${dt.toLocaleDateString()}</div>
            </div>
            <div class="despesa-valor">R$ ${parseFloat(despesa.valor).toFixed(2)}</div>
          `;
          listaContainer.appendChild(divDespesa);
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        let totalParcelas = despesa.parcelas.length;
        despesa.parcelas.forEach((parcela, index) => {
          let dt = new Date(parcela.vencimento);
          if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
            let divDespesa = document.createElement("div");
            divDespesa.className = "despesa-item";
            divDespesa.innerHTML = `
              <div class="despesa-info">
                <div class="despesa-titulo">${despesa.descricao}</div>
                <div class="despesa-detalhe">Parcela ${index+1}/${totalParcelas} - ${dt.toLocaleDateString()}</div>
              </div>
              <div class="despesa-valor">R$ ${parseFloat(parcela.valor).toFixed(2)}</div>
            `;
            listaContainer.appendChild(divDespesa);
          }
        });
      }
    });
    
    // Verificar despesas vencidas
    novo_verificarDespesasVencidas();
  });
}

/**
 * Atualiza o gráfico de despesas
 */
function atualizarGrafico() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  
  // Obter despesas por categoria
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorCategoria = {};
    let categorias = [];
    
    // Primeiro, obter todas as categorias
    db.ref("categorias").once("value").then(catSnapshot => {
      catSnapshot.forEach(catChild => {
        const categoria = catChild.val();
        categorias.push({
          id: catChild.key,
          nome: categoria.nome
        });
        despesasPorCategoria[catChild.key] = 0;
      });
      
      // Depois, calcular despesas por categoria
      snapshot.forEach(child => {
        const despesa = child.val();
        if (despesa.pago) return;
        
        const categoriaId = despesa.categoria;
        if (!categoriaId) return;
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          let dt = new Date(despesa.dataCompra);
          if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
            despesasPorCategoria[categoriaId] = (despesasPorCategoria[categoriaId] || 0) + parseFloat(despesa.valor);
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            let dt = new Date(parcela.vencimento);
            if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
              despesasPorCategoria[categoriaId] = (despesasPorCategoria[categoriaId] || 0) + parseFloat(parcela.valor);
            }
          });
        }
      });
      
      // Preparar dados para o gráfico
      let series = [];
      let labels = [];
      
      categorias.forEach(cat => {
        if (despesasPorCategoria[cat.id] > 0) {
          series.push(despesasPorCategoria[cat.id]);
          labels.push(cat.nome);
        }
      });
      
      // Criar gráfico
      const options = {
        series: series,
        chart: {
          type: 'donut',
          height: 300
        },
        labels: labels,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              height: 250
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
        colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#795548'],
        tooltip: {
          y: {
            formatter: function(value) {
              return value !== null && value !== undefined ? "R$ " + value.toFixed(2) : "R$ 0.00";
            }
          }
        }
      };
      
      // Destruir gráfico anterior se existir
      if (window.despesasChart) {
        window.despesasChart.destroy();
      }
      
      // Criar novo gráfico
      window.despesasChart = new ApexCharts(document.getElementById("graficoDespesas"), options);
      window.despesasChart.render();
      
      // Carregar painel de despesas do mês
      carregarPainelDespesasMes();
    });
  });
}

/**
 * Verifica se uma despesa é do mês atual
 * @param {Object} despesa - Objeto da despesa
 * @returns {boolean} Verdadeiro se a despesa for do mês atual
 */
function isDespesaDoMesAtual(despesa) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
    const dataCompra = new Date(despesa.dataCompra);
    return dataCompra.getMonth() === mesAtual && dataCompra.getFullYear() === anoAtual;
  } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
    for (let i = 0; i < despesa.parcelas.length; i++) {
      const parcela = despesa.parcelas[i];
      if (!parcela.pago) {
        const dataVencimento = new Date(parcela.vencimento);
        if (dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Avança para o próximo mês no dashboard
 */
function nextDashboardMonth() {
  const selectMes = document.getElementById("dashboardMonth");
  const selectAno = document.getElementById("dashboardYear");
  
  let mes = parseInt(selectMes.value);
  let ano = parseInt(selectAno.value);
  
  mes++;
  if (mes > 11) {
    mes = 0;
    ano++;
  }
  
  selectMes.value = mes;
  selectAno.value = ano;
  
  atualizarDashboard();
}

/**
 * Volta para o mês anterior no dashboard
 */
function prevDashboardMonth() {
  const selectMes = document.getElementById("dashboardMonth");
  const selectAno = document.getElementById("dashboardYear");
  
  let mes = parseInt(selectMes.value);
  let ano = parseInt(selectAno.value);
  
  mes--;
  if (mes < 0) {
    mes = 11;
    ano--;
  }
  
  selectMes.value = mes;
  selectAno.value = ano;
  
  atualizarDashboard();
}

/**
 * Alterna a exibição do parcelamento
 */
function toggleParcelamento() {
  const formaPagamento = document.getElementById("formaPagamento").value;
  const parcelamentoDiv = document.getElementById("parcelamentoDiv");
  
  if (formaPagamento === "cartao") {
    parcelamentoDiv.classList.remove("hidden");
  } else {
    parcelamentoDiv.classList.add("hidden");
  }
}

/**
 * Cadastra uma nova despesa
 */
function cadastrarDespesa() {
  const descricao = document.getElementById("despesaDescricao").value;
  const valor = parseFloat(document.getElementById("despesaValor").value);
  const dataCompra = document.getElementById("dataCompra").value;
  const categoria = document.getElementById("categoriaDespesa").value;
  const formaPagamento = document.getElementById("formaPagamento").value;
  
  if (!descricao || isNaN(valor) || valor <= 0 || !dataCompra) {
    exibirToast("Preencha todos os campos obrigatórios.", "warning");
    return;
  }
  
  const novaDespesa = {
    descricao: descricao,
    valor: valor,
    dataCompra: dataCompra,
    categoria: categoria,
    formaPagamento: formaPagamento,
    pago: false
  };
  
  if (formaPagamento === "cartao") {
    const cartaoElement = document.getElementById("cartaoDespesa");
    // Validação para evitar erro de elemento null
    if (!cartaoElement) {
      console.error("Elemento cartaoDespesa não encontrado");
      exibirToast("Erro ao processar formulário. Tente novamente.", "danger");
      return;
    }
    const cartao = cartaoElement.value;
    
    // Correção: usando o ID correto "numeroParcelas" em vez de "numParcelasDespesa"
    const numeroParcelasElement = document.getElementById("numeroParcelas");
    // Validação para evitar erro de elemento null
    if (!numeroParcelasElement) {
      console.error("Elemento numeroParcelas não encontrado");
      exibirToast("Erro ao processar formulário. Tente novamente.", "danger");
      return;
    }
    const numParcelas = parseInt(numeroParcelasElement.value);
    
    if (!cartao || isNaN(numParcelas) || numParcelas <= 0) {
      exibirToast("Preencha os dados do cartão e parcelas.", "warning");
      return;
    }
    
    novaDespesa.cartao = cartao;
    novaDespesa.parcelas = [];
    
    // Calcular parcelas
    const valorParcela = valor / numParcelas;
    const dataBase = new Date(dataCompra);
    
    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(dataBase);
      dataVencimento.setMonth(dataBase.getMonth() + i);
      
      novaDespesa.parcelas.push({
        valor: valorParcela,
        vencimento: dataVencimento.toISOString().split("T")[0],
        pago: false
      });
    }
  }
  
  db.ref("despesas").push(novaDespesa)
    .then(() => {
      exibirToast("Despesa cadastrada com sucesso!", "success");
      fecharModal("cadastroDespesaModal");
      atualizarDashboard();
      filtrarTodasDespesas();
    })
    .catch(error => {
      console.error("Erro ao cadastrar despesa:", error);
      exibirToast("Erro ao cadastrar despesa. Tente novamente.", "danger");
    });
}

/**
 * Paga uma despesa selecionada
 */
function pagarDespesa() {
  const despesaId = document.getElementById("despesaSelect").value;
  
  if (!despesaId) {
    exibirToast("Selecione uma despesa para pagar.", "warning");
    return;
  }
  
  db.ref("despesas").child(despesaId).once("value").then(snapshot => {
    const despesa = snapshot.val();
    
    if (despesa.formaPagamento === "avista") {
      db.ref("despesas").child(despesaId).update({
        pago: true
      }).then(() => {
        exibirToast("Despesa paga com sucesso!", "success");
        fecharModal("pagarDespesaModal");
        atualizarDashboard();
        filtrarTodasDespesas();
      });
    } else if (despesa.formaPagamento === "cartao") {
      const parcelaIndex = parseInt(document.getElementById("parcelaSelect").value);
      
      if (isNaN(parcelaIndex)) {
        exibirToast("Selecione uma parcela para pagar.", "warning");
        return;
      }
      
      db.ref(`despesas/${despesaId}/parcelas/${parcelaIndex}`).update({
        pago: true
      }).then(() => {
        exibirToast("Parcela paga com sucesso!", "success");
        fecharModal("pagarDespesaModal");
        atualizarDashboard();
        filtrarTodasDespesas();
      });
    }
  });
}

/**
 * Carrega as parcelas de uma despesa
 */
function carregarParcelas() {
  const despesaId = document.getElementById("despesaSelect").value;
  const parcelaSelect = document.getElementById("parcelaSelect");
  parcelaSelect.innerHTML = "";
  
  if (!despesaId) return;
  
  db.ref("despesas").child(despesaId).once("value").then(snapshot => {
    const despesa = snapshot.val();
    
    if (despesa.formaPagamento === "avista") {
      document.getElementById("parcelasDiv").classList.add("hidden");
    } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
      document.getElementById("parcelasDiv").classList.remove("hidden");
      
      despesa.parcelas.forEach((parcela, index) => {
        if (!parcela.pago) {
          const option = document.createElement("option");
          option.value = index;
          option.text = `Parcela ${index+1} - Venc: ${parcela.vencimento} - R$ ${parseFloat(parcela.valor).toFixed(2)}`;
          parcelaSelect.appendChild(option);
        }
      });
    }
  });
}

/**
 * Filtra todas as despesas
 */
function filtrarTodasDespesas() {
  const filtroDescricao = document.getElementById("filtroDescricao").value.toLowerCase();
  const tbody = document.getElementById("todasDespesasBody");
  tbody.innerHTML = "";
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const key = child.key;
      const despesa = child.val();
      
      if (filtroDescricao && !despesa.descricao.toLowerCase().includes(filtroDescricao)) {
        return;
      }
      
      if (despesa.formaPagamento === "avista") {
        const tr = document.createElement("tr");
        const dataCompra = new Date(despesa.dataCompra);
        
        tr.innerHTML = `
          <td>${despesa.descricao}</td>
          <td>R$ ${parseFloat(despesa.valor).toFixed(2)}</td>
          <td>${dataCompra.toLocaleDateString()}</td>
          <td>${getCategoriaName(despesa.categoria)}</td>
          <td>${despesa.pago ? '<span class="badge bg-success">Pago</span>' : '<span class="badge bg-warning">Pendente</span>'}</td>
          <td>
            <button class="btn-icon" onclick="excluirDespesa('${key}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        
        tbody.appendChild(tr);
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          const tr = document.createElement("tr");
          const dataVencimento = new Date(parcela.vencimento);
          
          tr.innerHTML = `
            <td>${despesa.descricao} - Parcela ${index+1}/${despesa.parcelas.length}</td>
            <td>R$ ${parseFloat(parcela.valor).toFixed(2)}</td>
            <td>${dataVencimento.toLocaleDateString()}</td>
            <td>${getCategoriaName(despesa.categoria)}</td>
            <td>${parcela.pago ? '<span class="badge bg-success">Pago</span>' : '<span class="badge bg-warning">Pendente</span>'}</td>
            <td>
              <button class="btn-icon" onclick="excluirDespesa('${key}')">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          
          tbody.appendChild(tr);
        });
      }
    });
  });
}

/**
 * Obtém o nome da categoria pelo ID
 * @param {string} categoriaId - ID da categoria
 * @returns {string} Nome da categoria ou "Sem categoria"
 */
function getCategoriaName(categoriaId) {
  if (!categoriaId) return "Sem categoria";
  return window.novo_categoriasMap[categoriaId] || "Categoria não encontrada";
}

/**
 * Exclui uma despesa
 * @param {string} despesaId - ID da despesa
 */
function excluirDespesa(despesaId) {
  if (confirm("Tem certeza que deseja excluir esta despesa?")) {
    db.ref("despesas").child(despesaId).remove()
      .then(() => {
        exibirToast("Despesa excluída com sucesso!", "success");
        atualizarDashboard();
        filtrarTodasDespesas();
      })
      .catch(error => {
        console.error("Erro ao excluir despesa:", error);
        exibirToast("Erro ao excluir despesa. Tente novamente.", "danger");
      });
  }
}

/**
 * Renderiza o calendário
 */
function renderCalendar() {
  const calendarContainer = document.getElementById("calendarContainer");
  calendarContainer.innerHTML = "";
  
  const monthYearElem = document.getElementById("calendarMonthYear");
  const date = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
  const firstDayOfMonth = date.getDay();
  
  monthYearElem.innerText = `${date.toLocaleString('pt-BR', { month: 'long' })} ${currentCalendarYear}`;
  
  // Criar grid do calendário
  const calendarGrid = document.createElement("div");
  calendarGrid.className = "calendar-grid";
  
  // Adicionar cabeçalhos dos dias da semana
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  daysOfWeek.forEach(day => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "calendar-day-header";
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });
  
  // Adicionar espaços vazios para os dias antes do primeiro dia do mês
  for (let i = 0; i < firstDayOfMonth; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day";
    calendarGrid.appendChild(emptyDay);
  }
  
  // Buscar despesas do mês
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorDia = {};
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const data = new Date(despesa.dataCompra);
        if (data.getMonth() === currentCalendarMonth && data.getFullYear() === currentCalendarYear) {
          const dia = data.getDate();
          if (!despesasPorDia[dia]) despesasPorDia[dia] = [];
          despesasPorDia[dia].push(despesa);
        }
      }
      // Parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago && parcela.vencimento) {
            const data = new Date(parcela.vencimento);
            if (data.getMonth() === currentCalendarMonth && data.getFullYear() === currentCalendarYear) {
              const dia = data.getDate();
              if (!despesasPorDia[dia]) despesasPorDia[dia] = [];
              despesasPorDia[dia].push({
                ...despesa,
                parcela: index + 1,
                totalParcelas: despesa.parcelas.length,
                valorParcela: parcela.valor
              });
            }
          }
        });
      }
    });
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";
      dayElement.textContent = day;
      
      // Verificar se há despesas neste dia
      if (despesasPorDia[day] && despesasPorDia[day].length > 0) {
        dayElement.classList.add("has-events");
        dayElement.addEventListener("click", () => showDayDetails(day, despesasPorDia[day]));
      }
      
      calendarGrid.appendChild(dayElement);
    }
    
    calendarContainer.appendChild(calendarGrid);
  });
}

/**
 * Mostra detalhes das despesas de um dia
 * @param {number} day - Dia do mês
 * @param {Array} despesas - Lista de despesas do dia
 */
function showDayDetails(day, despesas) {
  const date = new Date(currentCalendarYear, currentCalendarMonth, day);
  document.getElementById("calendarTitulo").innerText = `Despesas de ${date.toLocaleDateString()}`;
  
  const calendarContainer = document.getElementById("calendarContainer");
  calendarContainer.innerHTML = "";
  
  const backButton = document.createElement("button");
  backButton.className = "btn btn-outline mb-3";
  backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar ao Calendário';
  backButton.addEventListener("click", renderCalendar);
  calendarContainer.appendChild(backButton);
  
  const totalElement = document.createElement("div");
  totalElement.className = "mb-3";
  let totalDia = 0;
  despesas.forEach(d => {
    if (d.formaPagamento === "avista") {
      totalDia += parseFloat(d.valor) || 0;
    } else if (d.valorParcela) {
      totalDia += parseFloat(d.valorParcela) || 0;
    }
  });
  totalElement.innerHTML = `<strong>Total do dia:</strong> R$ ${totalDia.toFixed(2)}`;
  calendarContainer.appendChild(totalElement);
  
  const listElement = document.createElement("div");
  listElement.className = "despesas-lista";
  
  despesas.forEach(despesa => {
    const despesaElement = document.createElement("div");
    despesaElement.className = "despesa-item";
    
    if (despesa.formaPagamento === "avista") {
      despesaElement.innerHTML = `
        <div class="despesa-info">
          <div class="despesa-titulo">${despesa.descricao}</div>
          <div class="despesa-detalhe">À Vista - ${getCategoriaName(despesa.categoria)}</div>
        </div>
        <div class="despesa-valor">R$ ${parseFloat(despesa.valor).toFixed(2)}</div>
      `;
    } else {
      despesaElement.innerHTML = `
        <div class="despesa-info">
          <div class="despesa-titulo">${despesa.descricao}</div>
          <div class="despesa-detalhe">Parcela ${despesa.parcela}/${despesa.totalParcelas} - ${getCategoriaName(despesa.categoria)}</div>
        </div>
        <div class="despesa-valor">R$ ${parseFloat(despesa.valorParcela).toFixed(2)}</div>
      `;
    }
    
    listElement.appendChild(despesaElement);
  });
  
  calendarContainer.appendChild(listElement);
}

/**
 * Navega para o mês anterior no calendário
 */
function prevMonth() {
  currentCalendarMonth--;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderCalendar();
}

/**
 * Navega para o próximo mês no calendário
 */
function nextMonth() {
  currentCalendarMonth++;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  renderCalendar();
}

// ===================== MÓDULO DE AUTENTICAÇÃO =====================

/**
 * Faz logout do usuário
 */
function fazerLogout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = 'login.html';
    })
    .catch((error) => {
      console.error('Erro ao fazer logout:', error);
      exibirToast("Erro ao fazer logout. Tente novamente.", "danger");
    });
}

/**
 * Carrega os dados do usuário
 */
function carregarDadosUsuario() {
  if (!currentUser) return;
  
  // Verificar se o usuário tem dados
  db.ref(`users/${currentUser.uid}/data`).once("value")
    .then((snapshot) => {
      if (!snapshot.exists()) {
        // Criar estrutura inicial de dados
        criarDadosIniciais();
      } else {
        // Carregar categorias
        loadCategorias();
        
        // Carregar dados do dashboard
        atualizarDashboard();
        
        // Carregar filtros
        loadCategoriasFiltro();
        
        // Atualizar select de cartões
        updateCartaoSelect();
      }
    })
    .catch((error) => {
      console.error('Erro ao verificar dados do usuário:', error);
      exibirToast("Erro ao carregar dados. Tente novamente.", "danger");
    });
}

/**
 * Cria dados iniciais para o usuário
 */
function criarDadosIniciais() {
  // Criar categorias padrão
  const categoriasIniciais = {
    "cat1": { nome: "Alimentação" },
    "cat2": { nome: "Transporte" },
    "cat3": { nome: "Moradia" },
    "cat4": { nome: "Saúde" },
    "cat5": { nome: "Educação" },
    "cat6": { nome: "Lazer" },
    "cat7": { nome: "Outros" }
  };
  
  db.ref(`users/${currentUser.uid}/data/categorias`).set(categoriasIniciais)
    .then(() => {
      // Criar limites padrão
      const limitesIniciais = {
        "cat1": { limite: 1000 },
        "cat2": { limite: 500 },
        "cat3": { limite: 2000 },
        "cat4": { limite: 500 },
        "cat5": { limite: 500 },
        "cat6": { limite: 300 },
        "cat7": { limite: 200 }
      };
      
      return db.ref(`users/${currentUser.uid}/data/limites_categorias`).set(limitesIniciais);
    })
    .then(() => {
      exibirToast("Dados iniciais criados com sucesso!", "success");
      loadCategorias();
      loadCategoriasFiltro();
    })
    .catch((error) => {
      console.error('Erro ao criar categorias padrão:', error);
      exibirToast("Erro ao criar dados iniciais. Tente novamente.", "danger");
    });
}

/**
 * Obtém o ID do usuário atual
 * @returns {string|null} ID do usuário atual ou null se não estiver autenticado
 */
function obterUsuarioId() {
  return currentUser ? currentUser.uid : null;
}

/**
 * Obtém o nome do usuário atual
 * @returns {string} Nome do usuário atual ou 'Usuário' se não tiver nome
 */
function obterUsuarioNome() {
  return currentUser ? (currentUser.displayName || 'Usuário') : 'Usuário';
}

/**
 * Obtém o email do usuário atual
 * @returns {string|null} Email do usuário atual ou null se não estiver autenticado
 */
function obterUsuarioEmail() {
  return currentUser ? currentUser.email : null;
}

/**
 * Obtém a foto do usuário atual
 * @returns {string} URL da foto do usuário ou URL de avatar gerado
 */
function obterUsuarioFoto() {
  if (!currentUser) return null;
  
  return currentUser.photoURL || 
    'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName || currentUser.email);
}

/**
 * Inicializa o DateRangePicker
 */
function initDateRangePicker() {
  if (typeof $ !== 'undefined' && $.fn.daterangepicker) {
    $('#dataRange').daterangepicker({
      opens: 'left',
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
        monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        firstDay: 0
      },
      ranges: {
        'Hoje': [moment(), moment()],
        'Ontem': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
        'Últimos 7 Dias': [moment().subtract(6, 'days'), moment()],
        'Últimos 30 Dias': [moment().subtract(29, 'days'), moment()],
        'Este Mês': [moment().startOf('month'), moment().endOf('month')],
        'Mês Passado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
      }
    }, function(start, end) {
      rangeStart = start.format('YYYY-MM-DD');
      rangeEnd = end.format('YYYY-MM-DD');
      atualizarRelatorios();
    });
  }
}

/**
 * Atualiza os relatórios com base no período selecionado
 */
function atualizarRelatorios() {
  if (!rangeStart || !rangeEnd) return;
  
  const inicio = new Date(rangeStart);
  const fim = new Date(rangeEnd);
  
  // Atualizar relatório mensal
  atualizarRelatorioMensal(inicio, fim);
  
  // Atualizar gráfico de categorias
  atualizarGraficoCategorias(inicio, fim);
}

/**
 * Atualiza o relatório mensal
 * @param {Date} inicio - Data de início
 * @param {Date} fim - Data de fim
 */
function atualizarRelatorioMensal(inicio, fim) {
  const container = document.getElementById("relatorioMensalContainer");
  container.innerHTML = "";
  
  // Buscar despesas no período
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorMes = {};
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const data = new Date(despesa.dataCompra);
        if (data >= inicio && data <= fim) {
          const mesAno = `${data.getFullYear()}-${data.getMonth() + 1}`;
          if (!despesasPorMes[mesAno]) {
            despesasPorMes[mesAno] = {
              total: 0,
              pagas: 0,
              pendentes: 0
            };
          }
          
          const valor = parseFloat(despesa.valor) || 0;
          despesasPorMes[mesAno].total += valor;
          
          if (despesa.pago) {
            despesasPorMes[mesAno].pagas += valor;
          } else {
            despesasPorMes[mesAno].pendentes += valor;
          }
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          const data = new Date(parcela.vencimento);
          if (data >= inicio && data <= fim) {
            const mesAno = `${data.getFullYear()}-${data.getMonth() + 1}`;
            if (!despesasPorMes[mesAno]) {
              despesasPorMes[mesAno] = {
                total: 0,
                pagas: 0,
                pendentes: 0
              };
            }
            
            const valor = parseFloat(parcela.valor) || 0;
            despesasPorMes[mesAno].total += valor;
            
            if (parcela.pago) {
              despesasPorMes[mesAno].pagas += valor;
            } else {
              despesasPorMes[mesAno].pendentes += valor;
            }
          }
        });
      }
    });
    
    // Criar tabela de relatório
    const table = document.createElement("table");
    table.className = "table";
    
    // Cabeçalho
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    const thMes = document.createElement("th");
    thMes.textContent = "Mês";
    headerRow.appendChild(thMes);
    
    const thTotal = document.createElement("th");
    thTotal.textContent = "Total";
    headerRow.appendChild(thTotal);
    
    const thPagas = document.createElement("th");
    thPagas.textContent = "Pagas";
    headerRow.appendChild(thPagas);
    
    const thPendentes = document.createElement("th");
    thPendentes.textContent = "Pendentes";
    headerRow.appendChild(thPendentes);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo da tabela
    const tbody = document.createElement("tbody");
    
    // Ordenar meses
    const meses = Object.keys(despesasPorMes).sort();
    
    meses.forEach(mesAno => {
      const [ano, mes] = mesAno.split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const mesFormatado = data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      
      const row = document.createElement("tr");
      
      const tdMes = document.createElement("td");
      tdMes.textContent = mesFormatado;
      row.appendChild(tdMes);
      
      const tdTotal = document.createElement("td");
      tdTotal.textContent = `R$ ${despesasPorMes[mesAno].total.toFixed(2)}`;
      row.appendChild(tdTotal);
      
      const tdPagas = document.createElement("td");
      tdPagas.textContent = `R$ ${despesasPorMes[mesAno].pagas.toFixed(2)}`;
      row.appendChild(tdPagas);
      
      const tdPendentes = document.createElement("td");
      tdPendentes.textContent = `R$ ${despesasPorMes[mesAno].pendentes.toFixed(2)}`;
      row.appendChild(tdPendentes);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
  });
}

/**
 * Atualiza o gráfico de categorias
 * @param {Date} inicio - Data de início
 * @param {Date} fim - Data de fim
 */
function atualizarGraficoCategorias(inicio, fim) {
  // Buscar despesas no período
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorCategoria = {};
    
    snapshot.forEach(child => {
      const despesa = child.val();
      const categoriaId = despesa.categoria;
      
      if (!categoriaId) return;
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const data = new Date(despesa.dataCompra);
        if (data >= inicio && data <= fim) {
          if (!despesasPorCategoria[categoriaId]) {
            despesasPorCategoria[categoriaId] = 0;
          }
          despesasPorCategoria[categoriaId] += parseFloat(despesa.valor) || 0;
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          const data = new Date(parcela.vencimento);
          if (data >= inicio && data <= fim) {
            if (!despesasPorCategoria[categoriaId]) {
              despesasPorCategoria[categoriaId] = 0;
            }
            despesasPorCategoria[categoriaId] += parseFloat(parcela.valor) || 0;
          }
        });
      }
    });
    
    // Buscar nomes das categorias
    db.ref("categorias").once("value").then(snapshot => {
      let categorias = {};
      
      snapshot.forEach(child => {
        categorias[child.key] = child.val().nome;
      });
      
      // Preparar dados para o gráfico
      let series = [];
      let labels = [];
      
      Object.keys(despesasPorCategoria).forEach(categoriaId => {
        if (despesasPorCategoria[categoriaId] > 0) {
          series.push(despesasPorCategoria[categoriaId]);
          labels.push(categorias[categoriaId] || "Categoria Desconhecida");
        }
      });
      
      // Criar gráfico
      const options = {
        series: series,
        chart: {
          type: 'pie',
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
        colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#795548'],
        tooltip: {
          y: {
            formatter: function(value) {
              return value !== null && value !== undefined ? "R$ " + value.toFixed(2) : "R$ 0.00";
            }
          }
        }
      };
      
      // Destruir gráfico anterior se existir
      if (window.categoriasChart) {
        window.categoriasChart.destroy();
      }
      
      // Criar novo gráfico
      window.categoriasChart = new ApexCharts(document.getElementById("graficoCategorias"), options);
      window.categoriasChart.render();
    });
  });
}

/**
 * Carrega as categorias
 */
function loadCategorias() {
  const categoriasLista = document.getElementById("categoriasLista");
  const categoriasListaPrincipal = document.getElementById("categoriasListaPrincipal");
  
  if (categoriasLista) categoriasLista.innerHTML = "";
  if (categoriasListaPrincipal) categoriasListaPrincipal.innerHTML = "";
  
  // Limpar mapa de categorias
  window.novo_categoriasMap = {};
  
  db.ref("categorias").once("value").then(snapshot => {
    if (categoriasLista) {
      snapshot.forEach(child => {
        const key = child.key;
        const categoria = child.val();
        const div = document.createElement("div");
        div.className = "categoria-item";
        
        div.innerHTML = `
          <div class="categoria-info">
            <div class="categoria-titulo">${categoria.nome}</div>
          </div>
          <div class="categoria-acoes">
            <button class="btn-icon btn-primary" onclick="prepararEditarCategoria('${key}', '${categoria.nome}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-danger" onclick="excluirCategoria('${key}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        
        categoriasLista.appendChild(div);
        
        // Adicionar ao mapa de categorias
        window.novo_categoriasMap[key] = categoria.nome;
      });
    }
    
    if (categoriasListaPrincipal) {
      let html = "<h3>Categorias Cadastradas</h3>";
      
      if (snapshot.exists()) {
        html += "<div class='table-container'><table><thead><tr><th>Nome</th></tr></thead><tbody>";
        
        snapshot.forEach(child => {
          const categoria = child.val();
          html += `
            <tr>
              <td>${categoria.nome}</td>
            </tr>
          `;
          
          // Adicionar ao mapa de categorias
          window.novo_categoriasMap[child.key] = categoria.nome;
        });
        
        html += "</tbody></table></div>";
      } else {
        html += "<p>Nenhuma categoria cadastrada.</p>";
      }
      
      categoriasListaPrincipal.innerHTML = html;
    }
    
    // Atualizar select de categorias
    updateCategoriaSelect();
  });
}

/**
 * Carrega as categorias para o filtro
 */
function loadCategoriasFiltro() {
  const categoriaFiltro = document.getElementById("categoriaFiltro");
  if (!categoriaFiltro) return;
  
  categoriaFiltro.innerHTML = "<option value=''>Todas as Categorias</option>";
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = categoria.nome;
      categoriaFiltro.appendChild(option);
    });
  });
}

/**
 * Atualiza o select de categorias
 */
function updateCategoriaSelect() {
  const categoriaSelect = document.getElementById("categoriaDespesa");
  if (!categoriaSelect) return;
  
  categoriaSelect.innerHTML = "<option value=''>Selecione a Categoria</option>";
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = categoria.nome;
      categoriaSelect.appendChild(option);
    });
  });
}

/**
 * Adiciona uma categoria
 */
function adicionarCategoria() {
  const novaCategoria = document.getElementById("novaCategoria").value;
  
  if (!novaCategoria) {
    exibirToast("Digite o nome da categoria.", "warning");
    return;
  }
  
  db.ref("categorias").push({
    nome: novaCategoria
  }).then(() => {
    exibirToast("Categoria adicionada com sucesso!", "success");
    document.getElementById("novaCategoria").value = "";
    loadCategorias();
    loadCategoriasFiltro();
  }).catch(err => {
    console.error("Erro ao adicionar categoria:", err);
    exibirToast("Erro ao adicionar categoria: " + err.message, "danger");
  });
}

/**
 * Exclui uma categoria
 */
function excluirCategoria(categoriaId) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    db.ref("categorias").child(categoriaId).remove()
      .then(() => {
        exibirToast("Categoria excluída com sucesso!", "success");
        loadCategorias();
        loadCategoriasFiltro();
      })
      .catch(err => {
        console.error("Erro ao excluir categoria:", err);
        exibirToast("Erro ao excluir categoria: " + err.message, "danger");
      });
  }
}

/**
 * Adiciona um cartão
 */
function adicionarCartao() {
  const nomeCartao = document.getElementById("nomeCartao").value;
  const limiteCartao = parseFloat(document.getElementById("limiteCartao").value);
  const fechamentoCartao = parseInt(document.getElementById("fechamentoCartao").value);
  const vencimentoCartao = parseInt(document.getElementById("vencimentoCartao").value);
  
  if (!nomeCartao) {
    exibirToast("Digite o nome do cartão.", "warning");
    return;
  }
  
  if (isNaN(limiteCartao) || limiteCartao <= 0) {
    exibirToast("O limite do cartão deve ser um número maior que zero.", "warning");
    return;
  }
  
  if (isNaN(fechamentoCartao) || fechamentoCartao < 1 || fechamentoCartao > 31) {
    exibirToast("O dia de fechamento deve ser um número entre 1 e 31.", "warning");
    return;
  }
  
  if (isNaN(vencimentoCartao) || vencimentoCartao < 1 || vencimentoCartao > 31) {
    exibirToast("O dia de vencimento deve ser um número entre 1 e 31.", "warning");
    return;
  }
  
  db.ref("cartoes").push({
    nome: nomeCartao,
    limite: limiteCartao,
    diaFechamento: fechamentoCartao,
    diaVencimento: vencimentoCartao
  }).then(() => {
    exibirToast("Cartão adicionado com sucesso!", "success");
    document.getElementById("nomeCartao").value = "";
    document.getElementById("limiteCartao").value = "";
    document.getElementById("fechamentoCartao").value = "";
    document.getElementById("vencimentoCartao").value = "";
    loadCartoes();
    updateCartaoSelect();
  }).catch(err => {
    console.error("Erro ao adicionar cartão:", err);
    exibirToast("Erro ao adicionar cartão: " + err.message, "danger");
  });
}

/**
 * Carrega os cartões cadastrados
 */
function loadCartoes() {
  const cartoesList = document.getElementById("cartoesLista");
  const cartoesListaPrincipal = document.getElementById("cartoesListaPrincipal");
  
  if (cartoesList) cartoesList.innerHTML = "";
  if (cartoesListaPrincipal) cartoesListaPrincipal.innerHTML = "";
  
  db.ref("cartoes").once("value").then(snapshot => {
    if (cartoesList) {
      snapshot.forEach(child => {
        const key = child.key;
        const cartao = child.val();
        const div = document.createElement("div");
        div.className = "cartao-item";
        
        div.innerHTML = `
          <div class="cartao-info">
            <div class="cartao-titulo">${cartao.nome}</div>
            <div class="cartao-detalhe">
              <strong>Limite:</strong> R$ ${parseFloat(cartao.limite).toFixed(2)} | 
              <strong>Dia de Fechamento:</strong> ${cartao.diaFechamento} | 
              <strong>Dia de Vencimento:</strong> ${cartao.diaVencimento}
            </div>
          </div>
          <button class="btn-icon btn-danger" onclick="excluirCartao('${key}')">
            <i class="fas fa-trash"></i>
          </button>
        `;
        
        cartoesList.appendChild(div);
      });
    }
    
    if (cartoesListaPrincipal) {
      let html = "<h3>Cartões Cadastrados</h3>";
      
      if (snapshot.exists()) {
        html += "<div class='table-container'><table><thead><tr><th>Nome</th><th>Limite</th><th>Dia de Fechamento</th><th>Dia de Vencimento</th></tr></thead><tbody>";
        
        snapshot.forEach(child => {
          const cartao = child.val();
          html += `
            <tr>
              <td>${cartao.nome}</td>
              <td>R$ ${parseFloat(cartao.limite).toFixed(2)}</td>
              <td>${cartao.diaFechamento}</td>
              <td>${cartao.diaVencimento}</td>
            </tr>
          `;
        });
        
        html += "</tbody></table></div>";
      } else {
        html += "<p>Nenhum cartão cadastrado.</p>";
      }
      
      cartoesListaPrincipal.innerHTML = html;
    }
  });
}

/**
 * Atualiza o select de cartões
 */
function updateCartaoSelect() {
  const cartaoSelect = document.getElementById("cartaoDespesa");
  if (!cartaoSelect) return;
  
  cartaoSelect.innerHTML = "<option value=''>Selecione o Cartão</option>";
  
  db.ref("cartoes").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const cartao = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = cartao.nome;
      cartaoSelect.appendChild(option);
    });
  });
}

/**
 * Exclui um cartão
 */
function excluirCartao(cartaoId) {
  if (confirm("Tem certeza que deseja excluir este cartão?")) {
    db.ref("cartoes").child(cartaoId).remove()
      .then(() => {
        exibirToast("Cartão excluído com sucesso!", "success");
        loadCartoes();
        updateCartaoSelect();
      })
      .catch(err => {
        console.error("Erro ao excluir cartão:", err);
        exibirToast("Erro ao excluir cartão: " + err.message, "danger");
      });
  }
}

/**
 * Adiciona um pagamento
 */
function adicionarPagamento() {
  const container = document.getElementById("pagamentosContainer");
  const div = document.createElement("div");
  div.className = "pagamento-item d-flex gap-2 mb-2";
  
  div.innerHTML = `
    <div class="form-group mb-0" style="flex: 1;">
      <input type="number" class="form-control pagamento-dia" placeholder="Dia" min="1" max="31">
    </div>
    <div class="form-group mb-0" style="flex: 2;">
      <input type="number" class="form-control pagamento-valor" placeholder="Valor" step="0.01">
    </div>
    <button class="btn-icon" onclick="removerPagamento(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  container.appendChild(div);
}

/**
 * Remove um pagamento
 */
function removerPagamento(button) {
  const pagamentoItem = button.parentElement;
  pagamentoItem.remove();
}

/**
 * Cadastra uma pessoa
 */
function cadastrarPessoa() {
  // Correção: usando o ID correto "nome" em vez de "nomePessoa"
  const nomeElement = document.getElementById("nome");
  // Validação para evitar erro de elemento null
  if (!nomeElement) {
    console.error("Elemento nome não encontrado");
    exibirToast("Erro ao processar formulário. Tente novamente.", "danger");
    return;
  }
  const nome = nomeElement.value;
  
  const saldoInicialElement = document.getElementById("saldoInicial");
  // Validação para evitar erro de elemento null
  if (!saldoInicialElement) {
    console.error("Elemento saldoInicial não encontrado");
    exibirToast("Erro ao processar formulário. Tente novamente.", "danger");
    return;
  }
  const saldoInicial = parseFloat(saldoInicialElement.value) || 0;
  
  if (!nome) {
    exibirToast("Digite o nome da pessoa.", "warning");
    return;
  }
  
  // Obter pagamentos
  const pagamentos = [];
  const pagamentoDias = document.querySelectorAll(".pagamento-dia");
  const pagamentoValores = document.querySelectorAll(".pagamento-valor");
  
  for (let i = 0; i < pagamentoDias.length; i++) {
    const dia = parseInt(pagamentoDias[i].value);
    const valor = parseFloat(pagamentoValores[i].value);
    
    if (!isNaN(dia) && !isNaN(valor) && dia >= 1 && dia <= 31 && valor > 0) {
      pagamentos.push({
        dia: dia,
        valor: valor
      });
    }
  }
  
  db.ref("pessoas").push({
    nome: nome,
    saldoInicial: saldoInicial,
    pagamentos: pagamentos
  }).then(() => {
    exibirToast("Renda cadastrada com sucesso!", "success");
    fecharModal("cadastroModal");
    loadRendas();
    atualizarDashboard();
  }).catch(err => {
    console.error("Erro ao cadastrar renda:", err);
    exibirToast("Erro ao cadastrar renda: " + err.message, "danger");
  });
}

/**
 * Carrega as rendas
 */
function loadRendas() {
  const rendaList = document.getElementById("usuariosListaPrincipal");
  rendaList.innerHTML = "";
  
  db.ref("pessoas").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      rendaList.innerHTML = "<p>Nenhuma renda cadastrada.</p>";
      return;
    }
    
    snapshot.forEach(child => {
      const key = child.key;
      const pessoa = child.val();
      const div = document.createElement("div");
      div.className = "renda-item";
      
      let pagamentosInfo = "";
      if (pessoa.pagamentos && pessoa.pagamentos.length > 0) {
        pagamentosInfo = "<div class='renda-pagamentos'><strong>Pagamentos:</strong> ";
        pessoa.pagamentos.forEach(pag => {
          pagamentosInfo += `Dia: ${pag.dia}, Valor: R$ ${parseFloat(pag.valor).toFixed(2)}; `;
        });
        pagamentosInfo += "</div>";
      }
      
      div.innerHTML = `
        <div class="renda-info">
          <div class="renda-titulo">${pessoa.nome}</div>
          <div class="renda-detalhe">
            <strong>Saldo Inicial:</strong> R$ ${parseFloat(pessoa.saldoInicial).toFixed(2)}
          </div>
          ${pagamentosInfo}
        </div>
        <button class="btn-icon btn-danger" onclick="deleteRenda('${key}')">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      rendaList.appendChild(div);
    });
  });
}

/**
 * Exclui uma renda
 */
function deleteRenda(key) {
  if (confirm("Tem certeza que deseja excluir esta renda?")) {
    db.ref("pessoas").child(key).remove()
      .then(() => {
        exibirToast("Renda excluída com sucesso!", "success");
        loadRendas();
        atualizarDashboard();
      })
      .catch(err => {
        console.error("Erro ao excluir renda:", err);
        exibirToast("Erro ao excluir renda: " + err.message, "danger");
      });
  }
}

/**
 * Atualiza a referência do banco de dados para o usuário atual
 */
function atualizarReferenciaDB(userId) {
  // Criar referência para o banco de dados do usuário
  window.userDB = firebase.database().ref(`users/${userId}/data`);
  
  // Não substituir a variável global db, apenas criar uma referência adicional
  // para manter a compatibilidade com o código existente
}

/**
 * Exibe informações do usuário logado
 */
function exibirInfoUsuario(user) {
  // Verificar se estamos na página principal
  if (document.getElementById('sidebar')) {
    // Criar ou atualizar elemento de informações do usuário
    let userInfoElement = document.getElementById('userInfo');
    
    if (!userInfoElement) {
      userInfoElement = document.createElement('div');
      userInfoElement.id = 'userInfo';
      userInfoElement.className = 'user-info';
      
      // Inserir antes do primeiro link no sidebar
      const sidebar = document.getElementById('sidebar');
      const sidebarNav = document.getElementById('sidebar-nav');
      
      if (sidebarNav) {
        // Se sidebar-nav existe, inserir antes dele
        sidebar.insertBefore(userInfoElement, sidebarNav);
      } else {
        // Se não, apenas adicionar ao início do sidebar
        sidebar.prepend(userInfoElement);
      }
    }
    
    // Atualizar conteúdo
    userInfoElement.innerHTML = `
      <div class="user-avatar">
        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email)}" alt="Avatar">
      </div>
      <div class="user-details">
        <div class="user-name">${user.displayName || 'Usuário'}</div>
        <div class="user-email">${user.email}</div>
      </div>
    `;
  }
}

/**
 * Adiciona botão de logout ao menu
 */
function adicionarBotaoLogout() {
  // Verificar se estamos na página principal
  if (document.getElementById('sidebar')) {
    // Verificar se o botão já existe
    if (!document.getElementById('logoutButton')) {
      // Criar link de logout
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.id = 'logoutButton';
      logoutLink.className = 'nav-link';
      logoutLink.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i><span>Sair</span>';
      logoutLink.addEventListener('click', fazerLogout);
      
      // Adicionar ao sidebar
      document.getElementById('sidebar').appendChild(logoutLink);
    }
  }
}

/**
 * Manipula mudanças no estado de autenticação
 */
function handleAuthStateChanged(user) {
  if (user) {
    // Usuário está logado
    currentUser = user;
    
    // Atualizar referência do banco de dados para o usuário atual
    atualizarReferenciaDB(user.uid);
    
    // Exibir informações do usuário
    exibirInfoUsuario(user);
    
    // Adicionar botão de logout
    adicionarBotaoLogout();
    
    // Carregar dados do usuário
    carregarDadosUsuario();
  } else {
    // Usuário não está logado, redirecionar para a página de login
    if (!window.location.href.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }
}

/**
 * Alterna o menu mobile
 */
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('show');
}

// ===================== MÓDULO DE ALERTAS =====================

/**
 * Verifica alertas
 */
function novo_verificarAlertas() {
  const container = document.getElementById("novo_listaAlertas");
  if (!container) return;
  
  container.innerHTML = "";
  
  const hoje = new Date();
  
  // Verificar despesas vencidas
  novo_verificarDespesasVencidas(hoje, container);
  
  // Verificar despesas próximas do vencimento
  verificarDespesasProximasVencimento(hoje, container);
  
  // Verificar limites de categorias
  verificarLimitesCategorias(container);
}

/**
 * Verifica despesas vencidas
 * @param {Date} hoje - Data atual
 * @param {HTMLElement} container - Container para adicionar os alertas
 */
function novo_verificarDespesasVencidas(hoje = new Date(), container = null) {
  if (!container) {
    container = document.getElementById("novo_listaAlertas");
    if (!container) return;
  }
  
  db.ref("despesas").once("value").then(snapshot => {
    let alertasVencidos = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        let dataCompra = new Date(despesa.dataCompra);
        if (dataCompra < hoje) {
          let diffDays = Math.ceil((hoje - dataCompra) / (1000 * 60 * 60 * 24));
          
          alertasVencidos.push({
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
            if (venc < hoje) {
              let diffDays = Math.ceil((hoje - venc) / (1000 * 60 * 60 * 24));
              
              alertasVencidos.push({
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
    
    // Ordenar alertas por dias de atraso (decrescente)
    alertasVencidos.sort((a, b) => b.dias - a.dias);
    
    // Adicionar alertas ao container
    if (alertasVencidos.length > 0) {
      const section = document.createElement("div");
      section.className = "alertas-section";
      
      const header = document.createElement("h3");
      header.className = "alertas-header";
      header.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Despesas Vencidas';
      section.appendChild(header);
      
      alertasVencidos.forEach(alerta => {
        const alertaEl = document.createElement("div");
        alertaEl.className = "alerta-item alerta-vencida";
        
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
      });
      
      container.appendChild(section);
    }
  });
}

/**
 * Verifica despesas próximas do vencimento
 * @param {Date} hoje - Data atual
 * @param {HTMLElement} container - Container para adicionar os alertas
 */
function verificarDespesasProximasVencimento(hoje = new Date(), container = null) {
  if (!container) {
    container = document.getElementById("novo_listaAlertas");
    if (!container) return;
  }
  
  db.ref("despesas").once("value").then(snapshot => {
    let alertasProximos = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        let dataCompra = new Date(despesa.dataCompra);
        if (dataCompra >= hoje) {
          let diffDays = Math.ceil((dataCompra - hoje) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) {
            alertasProximos.push({
              tipo: "proxima",
              mensagem: `Despesa "${despesa.descricao}" vence em ${diffDays} dias.`,
              data: dataCompra,
              dias: diffDays,
              valor: parseFloat(despesa.valor) || 0
            });
          }
        }
      } 
      // Verificar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            let venc = new Date(parcela.vencimento);
            if (venc >= hoje) {
              let diffDays = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 7) {
                alertasProximos.push({
                  tipo: "proxima",
                  mensagem: `Parcela ${index+1} de "${despesa.descricao}" vence em ${diffDays} dias.`,
                  data: venc,
                  dias: diffDays,
                  valor: parseFloat(parcela.valor) || 0
                });
              }
            }
          }
        });
      }
    });
    
    // Ordenar alertas por dias até vencimento (crescente)
    alertasProximos.sort((a, b) => a.dias - b.dias);
    
    // Adicionar alertas ao container
    if (alertasProximos.length > 0) {
      const section = document.createElement("div");
      section.className = "alertas-section";
      
      const header = document.createElement("h3");
      header.className = "alertas-header";
      header.innerHTML = '<i class="fas fa-clock"></i> Próximos Vencimentos';
      section.appendChild(header);
      
      alertasProximos.forEach(alerta => {
        const alertaEl = document.createElement("div");
        alertaEl.className = "alerta-item alerta-vencimento";
        
        alertaEl.innerHTML = `
          <div class="alerta-icon"><i class="fas fa-clock"></i></div>
          <div class="alerta-content">
            <div class="alerta-title">${alerta.mensagem}</div>
            <div class="alerta-details">
              <span>Vencimento: ${alerta.data.toLocaleDateString()}</span>
              <span>Valor: R$ ${alerta.valor.toFixed(2)}</span>
            </div>
          </div>
        `;
        
        section.appendChild(alertaEl);
      });
      
      container.appendChild(section);
    }
  });
}

/**
 * Verifica limites de categorias
 * @param {HTMLElement} container - Container para adicionar os alertas
 */
function verificarLimitesCategorias(container = null) {
  if (!container) {
    container = document.getElementById("novo_listaAlertas");
    if (!container) return;
  }
  
  // Obter limites de categorias
  db.ref("limites_categorias").once("value").then(limSnapshot => {
    if (!limSnapshot.exists()) return;
    
    const limites = {};
    limSnapshot.forEach(child => {
      limites[child.key] = child.val().limite;
    });
    
    // Obter despesas do mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    db.ref("despesas").once("value").then(snapshot => {
      const gastosPorCategoria = {};
      
      snapshot.forEach(child => {
        const despesa = child.val();
        const categoriaId = despesa.categoria;
        
        if (!categoriaId || !limites[categoriaId]) return;
        
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const data = new Date(despesa.dataCompra);
          if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
            if (!gastosPorCategoria[categoriaId]) gastosPorCategoria[categoriaId] = 0;
            gastosPorCategoria[categoriaId] += parseFloat(despesa.valor) || 0;
          }
        } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const data = new Date(parcela.vencimento);
            if (data.getMonth() === mesAtual && data.getFullYear() === anoAtual) {
              if (!gastosPorCategoria[categoriaId]) gastosPorCategoria[categoriaId] = 0;
              gastosPorCategoria[categoriaId] += parseFloat(parcela.valor) || 0;
            }
          });
        }
      });
      
      // Verificar categorias que ultrapassaram o limite
      const alertasLimite = [];
      
      Object.keys(limites).forEach(categoriaId => {
        const limite = parseFloat(limites[categoriaId]);
        const gasto = parseFloat(gastosPorCategoria[categoriaId] || 0);
        
        if (gasto > 0) {
          const percentual = (gasto / limite) * 100;
          
          if (percentual >= 80) {
            alertasLimite.push({
              categoriaId: categoriaId,
              limite: limite,
              gasto: gasto,
              percentual: percentual,
              tipo: percentual >= 100 ? "critico" : "alto"
            });
          }
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
          alertaEl.className = `alerta-item alerta-limite alerta-${alerta.tipo}`;
          
          const categoriaNome = window.novo_categoriasMap[alerta.categoriaId] || "Categoria";
          
          alertaEl.innerHTML = `
            <div class="alerta-icon"><i class="fas fa-chart-pie"></i></div>
            <div class="alerta-content">
              <div class="alerta-title">
                ${alerta.percentual >= 100 
                  ? `Limite de ${categoriaNome} ultrapassado!` 
                  : `${categoriaNome} próximo do limite!`}
              </div>
              <div class="alerta-details">
                <span>Gasto: R$ ${alerta.gasto.toFixed(2)} de R$ ${alerta.limite.toFixed(2)}</span>
                <span>${alerta.percentual.toFixed(0)}% do limite</span>
              </div>
              <div class="alerta-progress">
                <div class="progress-bar" style="width: ${Math.min(100, alerta.percentual)}%"></div>
              </div>
            </div>
          `;
          
          section.appendChild(alertaEl);
        });
        
        container.appendChild(section);
      }
    });
  });
}

/**
 * Carrega os limites de categorias
 */
function novo_carregarLimites() {
  const container = document.getElementById("novo_limitesContainer");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Obter categorias
  db.ref("categorias").once("value").then(snapshot => {
    if (!snapshot.exists()) {
      container.innerHTML = "<p>Nenhuma categoria cadastrada.</p>";
      return;
    }
    
    // Obter limites atuais
    db.ref("limites_categorias").once("value").then(limSnapshot => {
      const limites = {};
      
      if (limSnapshot.exists()) {
        limSnapshot.forEach(child => {
          limites[child.key] = child.val().limite;
        });
      }
      
      // Criar formulário de limites
      snapshot.forEach(child => {
        const categoriaId = child.key;
        const categoria = child.val();
        const limite = limites[categoriaId] || 0;
        
        const div = document.createElement("div");
        div.className = "form-group";
        
        div.innerHTML = `
          <label class="form-label">${categoria.nome}:</label>
          <input type="number" class="form-control limite-categoria" 
                 data-categoria="${categoriaId}" 
                 value="${limite}" 
                 step="0.01" min="0">
        `;
        
        container.appendChild(div);
      });
    });
  });
}

/**
 * Salva os limites de categorias
 */
function novo_salvarLimites() {
  const inputs = document.querySelectorAll(".limite-categoria");
  const limites = {};
  
  inputs.forEach(input => {
    const categoriaId = input.getAttribute("data-categoria");
    const valor = parseFloat(input.value) || 0;
    
    limites[categoriaId] = {
      limite: valor
    };
  });
  
  db.ref("limites_categorias").set(limites)
    .then(() => {
      exibirToast("Limites salvos com sucesso!", "success");
      fecharModal("novo_limitesModal");
      novo_verificarAlertas();
    })
    .catch(err => {
      console.error("Erro ao salvar limites:", err);
      exibirToast("Erro ao salvar limites: " + err.message, "danger");
    });
}

/**
 * Calcula previsões de gastos
 */
function novo_calcularPrevisoes() {
  const graficoContainer = document.getElementById("novo_graficoPrevisao");
  const tabelaContainer = document.getElementById("novo_tabelaPrevisao");
  
  if (!graficoContainer || !tabelaContainer) return;
  
  graficoContainer.innerHTML = "";
  tabelaContainer.innerHTML = "";
  
  // Obter despesas dos últimos 6 meses
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Criar array com os últimos 6 meses
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    let mes = mesAtual - i;
    let ano = anoAtual;
    
    if (mes < 0) {
      mes += 12;
      ano--;
    }
    
    meses.push({
      mes: mes,
      ano: ano,
      nome: new Date(ano, mes, 1).toLocaleString('pt-BR', { month: 'long' }),
      total: 0
    });
  }
  
  // Obter despesas
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const data = new Date(despesa.dataCompra);
        const mes = data.getMonth();
        const ano = data.getFullYear();
        
        // Verificar se a data está nos últimos 6 meses
        for (let i = 0; i < meses.length; i++) {
          if (meses[i].mes === mes && meses[i].ano === ano) {
            meses[i].total += parseFloat(despesa.valor) || 0;
            break;
          }
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          const data = new Date(parcela.vencimento);
          const mes = data.getMonth();
          const ano = data.getFullYear();
          
          // Verificar se a data está nos últimos 6 meses
          for (let i = 0; i < meses.length; i++) {
            if (meses[i].mes === mes && meses[i].ano === ano) {
              meses[i].total += parseFloat(parcela.valor) || 0;
              break;
            }
          }
        });
      }
    });
    
    // Calcular média e tendência
    const valores = meses.map(m => m.total);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    
    // Calcular tendência linear simples
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    
    for (let i = 0; i < valores.length; i++) {
      sumX += i;
      sumY += valores[i];
      sumXY += i * valores[i];
      sumX2 += i * i;
    }
    
    const n = valores.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcular previsões para os próximos 3 meses
    const previsoes = [];
    for (let i = 1; i <= 3; i++) {
      const previsao = intercept + slope * (n - 1 + i);
      
      let mes = (mesAtual + i) % 12;
      let ano = anoAtual + Math.floor((mesAtual + i) / 12);
      
      previsoes.push({
        mes: mes,
        ano: ano,
        nome: new Date(ano, mes, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
        valor: Math.max(0, previsao)
      });
    }
    
    // Criar gráfico
    const options = {
      series: [{
        name: 'Despesas',
        data: meses.map(m => m.total.toFixed(2))
      }, {
        name: 'Previsão',
        data: [...Array(meses.length - 1).fill(null), meses[meses.length - 1].total.toFixed(2), ...previsoes.map(p => p.valor.toFixed(2))]
      }],
      chart: {
        height: 350,
        type: 'line',
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'straight',
        width: [3, 3],
        dashArray: [0, 5]
      },
      title: {
        text: 'Tendência de Gastos',
        align: 'left'
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        },
      },
      xaxis: {
        categories: [...meses.map(m => `${m.nome} ${m.ano}`), ...previsoes.map(p => p.nome)],
      },
      yaxis: {
        labels: {
          formatter: function(val) {
            return "R$ " + val.toFixed(2);
          }
        }
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return "R$ " + parseFloat(val).toFixed(2);
          }
        }
      },
      colors: ['#4361ee', '#f72585']
    };
    
    // Criar gráfico
    const chart = new ApexCharts(graficoContainer, options);
    chart.render();
    
    // Criar tabela de previsões
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Previsão</th>
              <th>Variação</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    const ultimoMes = meses[meses.length - 1];
    
    previsoes.forEach(previsao => {
      const variacao = ((previsao.valor - ultimoMes.total) / ultimoMes.total) * 100;
      
      html += `
        <tr>
          <td>${previsao.nome}</td>
          <td>R$ ${previsao.valor.toFixed(2)}</td>
          <td class="${variacao > 0 ? 'text-danger' : 'text-success'}">
            ${variacao > 0 ? '+' : ''}${variacao.toFixed(2)}%
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
      <div class="previsao-info mt-3">
        <p><strong>Nota:</strong> Estas previsões são baseadas na tendência dos últimos 6 meses e podem variar conforme seus hábitos de consumo.</p>
      </div>
    `;
    
    tabelaContainer.innerHTML = html;
  });
}

// ===================== INICIALIZAÇÃO =====================

// Verificar estado de autenticação
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged(handleAuthStateChanged);
}

// Inicializar DateRangePicker quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar DateRangePicker
  initDateRangePicker();
  
  // Preencher select de ano do dashboard
  preencherDashboardAno();
  
  // Definir mês e ano atual no dashboard
  const hoje = new Date();
  document.getElementById("dashboardMonth").value = hoje.getMonth();
  document.getElementById("dashboardYear").value = hoje.getFullYear();
  
  // Atualizar dashboard
  atualizarDashboard();
  
  // Inicializar data de compra com a data atual
  const dataCompraInput = document.getElementById("dataCompra");
  if (dataCompraInput) {
    dataCompraInput.valueAsDate = hoje;
  }
  
  // Filtrar despesas
  filtrarTodasDespesas();
});

/**
 * Verifica se a despesa selecionada tem parcelas e exibe o seletor de parcelas
 */
function verificarParcelas() {
  const despesaId = document.getElementById("despesaSelect").value;
  const parcelasDiv = document.getElementById("parcelasDiv");
  const parcelaSelect = document.getElementById("parcelaSelect");
  
  // Limpar o select de parcelas
  parcelaSelect.innerHTML = "<option value=''>Selecione a Parcela</option>";
  
  // Esconder o div de parcelas por padrão
  parcelasDiv.classList.add("hidden");
  
  if (!despesaId) return;
  
  // Buscar a despesa selecionada
  db.ref("despesas").child(despesaId).once("value").then(snapshot => {
    const despesa = snapshot.val();
    
    // Verificar se é uma despesa parcelada
    if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
      // Mostrar o div de parcelas
      parcelasDiv.classList.remove("hidden");
      
      // Adicionar as parcelas não pagas ao select
      despesa.parcelas.forEach((parcela, index) => {
        if (!parcela.pago) {
          const option = document.createElement("option");
          option.value = index;
          option.text = `Parcela ${index+1} - Venc: ${new Date(parcela.vencimento).toLocaleDateString()} - R$ ${parseFloat(parcela.valor).toFixed(2)}`;
          parcelaSelect.appendChild(option);
        }
      });
    }
  }).catch(error => {
    console.error("Erro ao verificar parcelas:", error);
    exibirToast("Erro ao carregar parcelas. Tente novamente.", "danger");
  });
}

/**
 * Prepara o formulário para editar uma categoria
 * @param {string} categoriaId - ID da categoria a ser editada
 * @param {string} categoriaNome - Nome atual da categoria
 */
function prepararEditarCategoria(categoriaId, categoriaNome) {
  // Ocultar formulário de adição
  document.getElementById('formAdicionarCategoria').style.display = 'none';
  
  // Mostrar formulário de edição
  document.getElementById('formEditarCategoria').style.display = 'block';
  
  // Preencher campos
  document.getElementById('editarCategoriaId').value = categoriaId;
  document.getElementById('editarCategoriaNome').value = categoriaNome;
  
  // Focar no campo de nome
  document.getElementById('editarCategoriaNome').focus();
}

/**
 * Salva a edição de uma categoria
 */
function salvarEdicaoCategoria() {
  const categoriaId = document.getElementById('editarCategoriaId').value;
  const categoriaNome = document.getElementById('editarCategoriaNome').value;
  
  if (!categoriaNome) {
    exibirToast("Digite o nome da categoria.", "warning");
    return;
  }
  
  db.ref(`categorias/${categoriaId}`).update({
    nome: categoriaNome
  }).then(() => {
    exibirToast("Categoria atualizada com sucesso!", "success");
    cancelarEdicaoCategoria();
    loadCategorias();
    loadCategoriasFiltro();
  }).catch(err => {
    console.error("Erro ao atualizar categoria:", err);
    exibirToast("Erro ao atualizar categoria: " + err.message, "danger");
  });
}

/**
 * Cancela a edição de uma categoria
 */
function cancelarEdicaoCategoria() {
  // Limpar campos
  document.getElementById('editarCategoriaId').value = '';
  document.getElementById('editarCategoriaNome').value = '';
  
  // Ocultar formulário de edição
  document.getElementById('formEditarCategoria').style.display = 'none';
  
  // Mostrar formulário de adição
  document.getElementById('formAdicionarCategoria').style.display = 'block';
}

/**
 * Salva uma despesa (alias para cadastrarDespesa)
 * Esta função serve como um alias para manter compatibilidade com o botão no modal
 */
function salvarDespesa() {
  // Chama a função cadastrarDespesa que já implementa toda a lógica necessária
  cadastrarDespesa();
}

/**
 * Salva uma renda (alias para cadastrarPessoa)
 * Esta função serve como um alias para manter compatibilidade com o botão no modal
 */
function salvarRenda() {
  // Chama a função cadastrarPessoa que já implementa toda a lógica necessária
  cadastrarPessoa();
}

/**
 * Prepara o formulário para editar uma categoria
 * @param {string} categoriaId - ID da categoria a ser editada
 * @param {string} categoriaNome - Nome atual da categoria
 */
function prepararEditarCategoria(categoriaId, categoriaNome) {
  // Ocultar formulário de adição
  document.getElementById('formAdicionarCategoria').style.display = 'none';
  
  // Mostrar formulário de edição
  document.getElementById('formEditarCategoria').style.display = 'block';
  
  // Preencher campos
  document.getElementById('editarCategoriaId').value = categoriaId;
  document.getElementById('editarCategoriaNome').value = categoriaNome;
  
  // Focar no campo de nome
  document.getElementById('editarCategoriaNome').focus();
}

/**
 * Salva a edição de uma categoria
 */
function salvarEdicaoCategoria() {
  const categoriaId = document.getElementById('editarCategoriaId').value;
  const categoriaNome = document.getElementById('editarCategoriaNome').value;
  
  if (!categoriaNome) {
    exibirToast("Digite o nome da categoria.", "warning");
    return;
  }
  
  db.ref(`categorias/${categoriaId}`).update({
    nome: categoriaNome
  }).then(() => {
    exibirToast("Categoria atualizada com sucesso!", "success");
    cancelarEdicaoCategoria();
    loadCategorias();
    loadCategoriasFiltro();
  }).catch(err => {
    console.error("Erro ao atualizar categoria:", err);
    exibirToast("Erro ao atualizar categoria: " + err.message, "danger");
  });
}

/**
 * Cancela a edição de uma categoria
 */
function cancelarEdicaoCategoria() {
  // Limpar campos
  document.getElementById('editarCategoriaId').value = '';
  document.getElementById('editarCategoriaNome').value = '';
  
  // Ocultar formulário de edição
  document.getElementById('formEditarCategoria').style.display = 'none';
  
  // Mostrar formulário de adição
  document.getElementById('formAdicionarCategoria').style.display = 'block';
}

/**
 * Exclui uma categoria
 * @param {string} categoriaId - ID da categoria a ser excluída
 */
function excluirCategoria(categoriaId) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    db.ref("categorias").child(categoriaId).remove()
      .then(() => {
        exibirToast("Categoria excluída com sucesso!", "success");
        loadCategorias();
        loadCategoriasFiltro();
      })
      .catch(err => {
        console.error("Erro ao excluir categoria:", err);
        exibirToast("Erro ao excluir categoria: " + err.message, "danger");
      });
  }
}
