'use strict';

/**
 * Módulo principal do Sistema de Gerenciamento de Contas Pessoais
 * Contém as funções principais para manipulação de despesas, dashboard e componentes
 */

// Variáveis globais
let rendaVisivel = false;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let rangeStart = null;
let rangeEnd = null;

// Mapa de categorias para uso global
window.novo_categoriasMap = {};

// Configuração do Firebase
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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/**
 * Exibe uma notificação toast
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo de notificação (success, danger, warning, primary)
 */
function exibirToast(mensagem, tipo = 'primary') {
  // Usar apenas Toastify para evitar duplicação
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
    document.getElementById("despesasMesTitle").innerText = new Date(dashboardYear, dashboardMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    carregarPainelDespesasMes();
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
              return "R$ " + value.toFixed(2);
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
    });
  });
}

/**
 * Filtra as despesas com base nos critérios selecionados
 */
function filtrarDespesas() {
  const searchText = document.getElementById("despesaSearch").value.toLowerCase();
  const mesFiltro = document.getElementById("mesFiltro").value.toUpperCase();
  const anoFiltro = document.getElementById("anoFiltro").value;
  const categoriaFiltro = document.getElementById("categoriaFiltro").value;
  const contaMes = document.getElementById("contaMesFiltro").checked;
  const despesaSelect = document.getElementById("despesaSelect");
  despesaSelect.innerHTML = "";
  
  const mesesAbreviados = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const despesa = child.val();
      if (despesa.pago) return;
      if (searchText && !despesa.descricao.toLowerCase().includes(searchText)) return;
      
      let data = null;
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        data = new Date(despesa.dataCompra);
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas && despesa.parcelas.length > 0) {
        data = new Date(despesa.parcelas[0].vencimento);
      }
      
      if (mesFiltro && data) {
        const mesAbrev = mesesAbreviados[data.getMonth()];
        if (mesAbrev !== mesFiltro) return;
      }
      
      if (anoFiltro && data) {
        if (data.getFullYear().toString() !== anoFiltro) return;
      }
      
      if (categoriaFiltro && despesa.categoria !== categoriaFiltro) return;
      
      if (contaMes && data) {
        const hoje = new Date();
        if (data.getMonth() !== hoje.getMonth() || data.getFullYear() !== hoje.getFullYear()) return;
      }
      
      // Adicionar despesa ao select
      let option = document.createElement("option");
      option.value = child.key;
      option.text = `${despesa.descricao} - ${despesa.formaPagamento === "avista" ? "À Vista" : "Cartão"}`;
      despesaSelect.appendChild(option);
    });
  }).catch(error => {
    console.error("Erro ao filtrar despesas:", error);
    exibirToast("Erro ao filtrar despesas. Tente novamente.", "danger");
  });
}

/**
 * Carrega as categorias para o modal de categorias
 */
function loadCategorias() {
  const categoriaSelect = document.getElementById("categoriaSelect");
  categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      let option = document.createElement("option");
      option.value = child.key;
      option.text = categoria.nome;
      categoriaSelect.appendChild(option);
    });
  }).catch(error => {
    console.error("Erro ao carregar categorias:", error);
    exibirToast("Erro ao carregar categorias. Tente novamente.", "danger");
  });
}

/**
 * Carrega os usuários para o modal de fontes
 */
function loadUsuarios() {
  const usuarioSelect = document.getElementById("fonteSelect");
  usuarioSelect.innerHTML = '<option value="">Selecione uma fonte</option>';
  
  db.ref("pessoas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const pessoa = child.val();
      let option = document.createElement("option");
      option.value = child.key;
      option.text = pessoa.nome;
      usuarioSelect.appendChild(option);
    });
  }).catch(error => {
    console.error("Erro ao carregar usuários:", error);
    exibirToast("Erro ao carregar usuários. Tente novamente.", "danger");
  });
}

/**
 * Carrega os cartões para o modal de cartões
 */
function loadCartoes() {
  const cartaoSelect = document.getElementById("cartaoSelect");
  cartaoSelect.innerHTML = '<option value="">Selecione um cartão</option>';
  
  db.ref("cartoes").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const cartao = child.val();
      let option = document.createElement("option");
      option.value = child.key;
      option.text = cartao.nome;
      cartaoSelect.appendChild(option);
    });
  }).catch(error => {
    console.error("Erro ao carregar cartões:", error);
    exibirToast("Erro ao carregar cartões. Tente novamente.", "danger");
  });
}

/**
 * Salva uma nova despesa
 */
function salvarDespesa() {
  const descricao = document.getElementById("despesaDescricao").value;
  const valor = parseFloat(document.getElementById("despesaValor").value);
  const dataCompra = document.getElementById("despesaData").value;
  const formaPagamento = document.getElementById("formaPagamento").value;
  const categoria = document.getElementById("categoriaSelect").value;
  const cartao = document.getElementById("cartaoSelect").value;
  const parcelas = parseInt(document.getElementById("despesaParcelas").value) || 1;
  
  if (!descricao || !valor || !dataCompra || !formaPagamento || !categoria) {
    exibirToast("Preencha todos os campos obrigatórios.", "danger");
    return;
  }
  
  const despesa = {
    descricao: descricao,
    valor: valor,
    dataCompra: dataCompra,
    formaPagamento: formaPagamento,
    categoria: categoria,
    pago: false,
    userId: obterUsuarioId() || "default"
  };
  
  if (formaPagamento === "cartao") {
    if (!cartao || parcelas < 1) {
      exibirToast("Selecione um cartão e informe o número de parcelas.", "danger");
      return;
    }
    
    despesa.cartao = cartao;
    despesa.parcelas = [];
    
    const valorParcela = valor / parcelas;
    const dataVencimento = new Date(dataCompra);
    
    for (let i = 0; i < parcelas; i++) {
      dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      despesa.parcelas.push({
        valor: valorParcela.toFixed(2),
        vencimento: dataVencimento.toISOString().split("T")[0],
        pago: false
      });
    }
  }
  
  db.ref("despesas").push(despesa)
    .then(() => {
      exibirToast("Despesa cadastrada com sucesso!", "success");
      fecharModal("cadastroDespesaModal");
      atualizarDashboard();
      novo_verificarAlertas();
    })
    .catch(error => {
      console.error("Erro ao salvar despesa:", error);
      exibirToast("Erro ao salvar despesa. Tente novamente.", "danger");
    });
}

/**
 * Marca uma despesa como paga
 */
function pagarDespesa() {
  const despesaId = document.getElementById("despesaSelect").value;
  const parcelaIndex = parseInt(document.getElementById("parcelaSelect").value) || -1;
  
  if (!despesaId) {
    exibirToast("Selecione uma despesa para pagar.", "danger");
    return;
  }
  
  const despesaRef = db.ref("despesas").child(despesaId);
  
  despesaRef.once("value").then(snapshot => {
    const despesa = snapshot.val();
    
    if (despesa.formaPagamento === "avista") {
      despesaRef.update({ pago: true })
        .then(() => {
          exibirToast("Despesa marcada como paga!", "success");
          fecharModal("pagarDespesaModal");
          atualizarDashboard();
        })
        .catch(error => {
          console.error("Erro ao marcar despesa como paga:", error);
          exibirToast("Erro ao marcar despesa como paga. Tente novamente.", "danger");
        });
    } else if (despesa.formaPagamento === "cartao" && parcelaIndex >= 0) {
      despesa.parcelas[parcelaIndex].pago = true;
      despesaRef.update({ parcelas: despesa.parcelas })
        .then(() => {
          exibirToast(`Parcela ${parcelaIndex + 1} marcada como paga!`, "success");
          fecharModal("pagarDespesaModal");
          atualizarDashboard();
        })
        .catch(error => {
          console.error("Erro ao marcar parcela como paga:", error);
          exibirToast("Erro ao marcar parcela como paga. Tente novamente.", "danger");
        });
    }
  });
}

/**
 * Renderiza o calendário de despesas
 */
function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  calendarGrid.innerHTML = "";
  
  const primeiroDia = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const ultimoDia = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
  const primeiroDiaSemana = primeiroDia.getDay();
  const diasNoMes = ultimoDia.getDate();
  
  // Adicionar dias vazios para alinhar o primeiro dia
  for (let i = 0; i < primeiroDiaSemana; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day empty";
    calendarGrid.appendChild(emptyDay);
  }
  
  // Obter despesas para marcar eventos
  db.ref("despesas").once("value").then(snapshot => {
    const eventos = {};
    
    snapshot.forEach(child => {
      const despesa = child.val();
      if (despesa.pago) return;
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const data = new Date(despesa.dataCompra);
        const key = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
        eventos[key] = eventos[key] || [];
        eventos[key].push({ tipo: "expense" });
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (!parcela.pago) {
            const data = new Date(parcela.vencimento);
            const key = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
            eventos[key] = eventos[key] || [];
            eventos[key].push({ tipo: "expense" });
          }
        });
      }
    });
    
    // Adicionar dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const calendarDay = document.createElement("div");
      calendarDay.className = "calendar-day";
      
      const data = new Date(currentCalendarYear, currentCalendarMonth, dia);
      const key = `${currentCalendarYear}-${currentCalendarMonth}-${dia}`;
      
      if (eventos[key]) {
        calendarDay.classList.add("has-events");
      }
      
      calendarDay.innerHTML = `
        <span class="calendar-day-number">${dia}</span>
        <div class="calendar-day-events">
          ${eventos[key] ? eventos[key].map(() => '<span class="calendar-event-dot event-expense"></span>').join("") : ""}
        </div>
      `;
      
      calendarGrid.appendChild(calendarDay);
    }
    
    // Atualizar título do calendário
    document.getElementById("calendarTitulo").innerText = 
      new Date(currentCalendarYear, currentCalendarMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  });
}

/**
 * Navega para o mês anterior no calendário
 */
function prevCalendarMonth() {
  currentCalendarMonth--;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderCalendar();
}

/**
 * Navega para o mês seguinte no calendário
 */
function nextCalendarMonth() {
  currentCalendarMonth++;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  renderCalendar();
}

/**
 * Navega para o mês anterior no dashboard
 */
function prevDashboardMonth() {
  let month = parseInt(document.getElementById("dashboardMonth").value);
  let year = parseInt(document.getElementById("dashboardYear").value);
  
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  
  document.getElementById("dashboardMonth").value = month;
  document.getElementById("dashboardYear").value = year;
  atualizarDashboard();
}

/**
 * Navega para o mês seguinte no dashboard
 */
function nextDashboardMonth() {
  let month = parseInt(document.getElementById("dashboardMonth").value);
  let year = parseInt(document.getElementById("dashboardYear").value);
  
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  
  document.getElementById("dashboardMonth").value = month;
  document.getElementById("dashboardYear").value = year;
  atualizarDashboard();
}

/**
 * Inicializa os componentes da página
 */
function init() {
  // Preencher select de ano
  preencherDashboardAno();
  
  // Configurar eventos de navegação
  document.querySelectorAll('#sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('data-section');
      if (sectionId) {
        showSection(sectionId);
      }
    });
  });
  
  // Inicializar dashboard
  atualizarDashboard();
  
  // Carregar categorias no mapa global
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      window.novo_categoriasMap[child.key] = child.val().nome;
    });
  });
  
  // Configurar eventos dos modais
  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      const modal = closeBtn.closest('.modal');
      if (modal) {
        fecharModal(modal.id);
      }
    });
  });
  
  // Configurar formulário de despesa
  document.getElementById("cadastroDespesaForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    salvarDespesa();
  });
  
  // Configurar formulário de pagamento
  document.getElementById("pagarDespesaForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    pagarDespesa();
  });
  
  // Configurar exportação
  document.getElementById("exportDataBtn")?.addEventListener("click", exportData);
}

/**
 * Calcula previsões financeiras
 */
function novo_calcularPrevisoes() {
  const previsaoContainer = document.getElementById("previsaoContainer");
  previsaoContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando previsões...</div>';
  
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasFuturas = [];
    
    snapshot.forEach(child => {
      const despesa = child.val();
      if (despesa.pago) return;
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const data = new Date(despesa.dataCompra);
        if (data > hoje) {
          despesasFuturas.push({
            descricao: despesa.descricao,
            valor: parseFloat(despesa.valor) || 0,
            data: data
          });
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            const data = new Date(parcela.vencimento);
            if (data > hoje) {
              despesasFuturas.push({
                descricao: `${despesa.descricao} - Parcela ${index + 1}`,
                valor: parseFloat(parcela.valor) || 0,
                data: data
              });
            }
          }
        });
      }
    });
    
    // Agrupar por mês
    const previsoesPorMes = {};
    despesasFuturas.forEach(despesa => {
      const mesKey = `${despesa.data.getFullYear()}-${despesa.data.getMonth()}`;
      if (!previsoesPorMes[mesKey]) {
        previsoesPorMes[mesKey] = {
          total: 0,
          despesas: []
        };
      }
      previsoesPorMes[mesKey].total += despesa.valor;
      previsoesPorMes[mesKey].despesas.push(despesa);
    });
    
    // Renderizar previsões
    previsaoContainer.innerHTML = "";
    Object.keys(previsoesPorMes).sort().forEach(mesKey => {
      const [ano, mes] = mesKey.split("-").map(Number);
      const section = document.createElement("div");
      section.className = "content-section";
      
      section.innerHTML = `
        <div class="content-header">
          <h3 class="content-title">${new Date(ano, mes).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
          <div class="content-total">Total: R$ ${previsoesPorMes[mesKey].total.toFixed(2)}</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${previsoesPorMes[mesKey].despesas.map(d => `
                <tr>
                  <td>${d.descricao}</td>
                  <td>R$ ${d.valor.toFixed(2)}</td>
                  <td>${d.data.toLocaleDateString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      
      previsaoContainer.appendChild(section);
    });
    
    if (Object.keys(previsoesPorMes).length === 0) {
      previsaoContainer.innerHTML = '<p class="text-muted">Nenhuma despesa futura registrada.</p>';
    }
  }).catch(error => {
    console.error("Erro ao calcular previsões:", error);
    exibirToast("Erro ao calcular previsões. Tente novamente.", "danger");
  });
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);
