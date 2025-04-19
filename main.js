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
      if (contaMes && !despesa.contaMes) return;
      
      if (despesa.formaPagamento === "avista") {
        const option = document.createElement("option");
        option.value = child.key;
        const dataExibicao = despesa.dataCompra;
        const valorExibido = despesa.valor ? "R$ " + parseFloat(despesa.valor).toFixed(2) : "";
        option.text = despesa.descricao + " " + valorExibido + " - " + dataExibicao;
        despesaSelect.appendChild(option);
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            const option = document.createElement("option");
            option.value = child.key + "|" + index;
            option.text = `${despesa.descricao} - Parcela ${index+1} de ${despesa.parcelas.length} - Venc: ${parcela.vencimento} - R$ ${parseFloat(parcela.valor).toFixed(2)}`;
            despesaSelect.appendChild(option);
          }
        });
      }
    });
  });
}

/**
 * Carrega todas as despesas não pagas no select
 */
function loadDespesasNaoPagasSelect() {
  const despesaSelect = document.getElementById("despesaSelect");
  despesaSelect.innerHTML = "";
  
  db.ref("despesas").orderByChild("pago").equalTo(false).once("value").then(snapshot => {
    snapshot.forEach(child => {
      const despesa = child.val();
      if (despesa.formaPagamento === "avista") {
        const option = document.createElement("option");
        option.value = child.key;
        const dataExibicao = despesa.dataCompra;
        const valorExibido = despesa.valor ? "R$ " + parseFloat(despesa.valor).toFixed(2) : "";
        option.text = despesa.descricao + " " + valorExibido + " - " + dataExibicao;
        despesaSelect.appendChild(option);
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            const option = document.createElement("option");
            option.value = child.key + "|" + index;
            option.text = `${despesa.descricao} - Parcela ${index+1} de ${despesa.parcelas.length} - Venc: ${parcela.vencimento} - R$ ${parseFloat(parcela.valor).toFixed(2)}`;
            despesaSelect.appendChild(option);
          }
        });
      }
    });
  });
}

/**
 * Atualiza o select de categorias
 */
function updateCategoriaSelect() {
  const select = document.getElementById("categoriaDespesa");
  select.innerHTML = '<option value="">Selecione a Categoria</option>';
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = categoria.nome;
      select.appendChild(option);
      
      // Atualizar mapa global de categorias
      window.novo_categoriasMap[child.key] = categoria.nome;
    });
  });
}

/**
 * Carrega as categorias para o filtro
 */
function loadCategoriasFiltro() {
  const select = document.getElementById("categoriaFiltro");
  select.innerHTML = '<option value="">Todas as Categorias</option>';
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = categoria.nome;
      select.appendChild(option);
    });
  });
}

/**
 * Atualiza o select de cartões
 */
function updateCartaoSelect() {
  const select = document.getElementById("cartaoDespesa");
  select.innerHTML = '<option value="">Selecione o Cartão</option>';
  
  db.ref("cartoes").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const cartao = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = cartao.nome;
      option.setAttribute("data-fatura", cartao.diaFatura);
      option.setAttribute("data-fechamento", cartao.diaFechamento);
      select.appendChild(option);
    });
  });
}

/**
 * Carrega as categorias
 */
function loadCategorias() {
  const categoriasLista = document.getElementById("categoriasLista");
  categoriasLista.innerHTML = "";
  
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const div = document.createElement("div");
      div.className = "categoria-item";
      div.innerHTML = `
        <div class="categoria-nome">${categoria.nome}</div>
        <button class="btn-icon btn-danger" onclick="excluirCategoria('${child.key}')">
          <i class="fas fa-trash"></i>
        </button>
      `;
      categoriasLista.appendChild(div);
    });
  });
}

/**
 * Carrega os cartões
 */
function loadCartoes() {
  const cartoesLista = document.getElementById("cartoesLista");
  cartoesLista.innerHTML = "";
  
  db.ref("cartoes").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const cartao = child.val();
      const div = document.createElement("div");
      div.className = "cartao-item";
      div.innerHTML = `
        <div class="cartao-info">
          <div class="cartao-nome">${cartao.nome}</div>
          <div class="cartao-detalhe">Limite: R$ ${parseFloat(cartao.limite).toFixed(2)}</div>
          <div class="cartao-detalhe">Fechamento: Dia ${cartao.diaFechamento} | Vencimento: Dia ${cartao.diaFatura}</div>
        </div>
        <button class="btn-icon btn-danger" onclick="excluirCartao('${child.key}')">
          <i class="fas fa-trash"></i>
        </button>
      `;
      cartoesLista.appendChild(div);
    });
  });
}

/**
 * Salva uma despesa
 */
function salvarDespesa() {
  const descricao = document.getElementById("despesaDescricao").value;
  const valor = parseFloat(document.getElementById("despesaValor").value);
  const dataCompra = document.getElementById("dataCompra").value;
  const categoria = document.getElementById("categoriaDespesa").value;
  const formaPagamento = document.getElementById("formaPagamento").value;
  const despesasRef = db.ref("despesas");
  
  if (!descricao) {
    exibirToast("Preencha a descrição da despesa.", "warning");
    return;
  }
  
  if (isNaN(valor) || valor <= 0) {
    exibirToast("O valor da despesa deve ser um número válido maior que zero.", "warning");
    return;
  }
  
  if (!dataCompra) {
    exibirToast("Selecione a data da compra.", "warning");
    return;
  }
  
  if (!categoria) {
    exibirToast("Selecione uma categoria.", "warning");
    return;
  }
  
  if (formaPagamento === "cartao") {
    const selectCartao = document.getElementById("cartaoDespesa");
    if (!selectCartao.value) {
      exibirToast("Selecione um cartão para despesas no cartão.", "warning");
      return;
    }
    
    const numParcelas = parseInt(document.getElementById("numParcelasDespesa").value);
    if (isNaN(numParcelas) || numParcelas < 1) {
      exibirToast("O número de parcelas deve ser pelo menos 1.", "warning");
      return;
    }
    
    const cardOption = selectCartao.selectedOptions[0];
    const diaFatura = parseInt(cardOption.getAttribute("data-fatura"));
    const diaFechamento = parseInt(cardOption.getAttribute("data-fechamento"));
    let parcelas = [];
    const purchaseDate = new Date(dataCompra);
    let firstDueDate = new Date(purchaseDate);
    
    if (purchaseDate.getDate() > diaFechamento) {
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
      firstDueDate.setDate(diaFatura);
    } else {
      firstDueDate.setDate(diaFatura);
    }
    
    const valorParcela = parseFloat((valor / numParcelas).toFixed(2));
    let ajuste = valor - (valorParcela * numParcelas);
    
    for (let i = 0; i < numParcelas; i++) {
      let parcelaDate = new Date(firstDueDate);
      parcelaDate.setMonth(parcelaDate.getMonth() + i);
      
      // Ajustar o valor da última parcela para compensar arredondamentos
      let valorParcelaAtual = valorParcela;
      if (i === numParcelas - 1) {
        valorParcelaAtual += ajuste;
      }
      
      parcelas.push({
        valor: valorParcelaAtual,
        vencimento: parcelaDate.toISOString().split("T")[0],
        pago: false
      });
    }
    
    const despesaData = {
      descricao,
      formaPagamento,
      dataCompra,
      categoria,
      parcelas,
      cartao: {
        id: selectCartao.value,
        nome: selectCartao.selectedOptions[0].text,
        diaFatura,
        diaFechamento
      },
      pago: false,
      timestamp: new Date().toISOString()
    };
    
    despesasRef.push(despesaData)
      .then(() => {
        exibirToast("Despesa com cartão cadastrada com sucesso!", "success");
        document.getElementById("despesaDescricao").value = "";
        document.getElementById("despesaValor").value = "";
        document.getElementById("dataCompra").value = new Date().toISOString().split("T")[0];
        document.getElementById("categoriaDespesa").value = "";
        document.getElementById("formaPagamento").value = "avista";
        document.getElementById("cartaoDespesa").value = "";
        document.getElementById("numParcelasDespesa").value = "1";
        toggleParcelamento();
        
        // Atualizar componentes
        filtrarDespesas();
        renderCalendar();
        updateCartaoSelect();
        atualizarDashboard();
        carregarPainelDespesasMes();
        
        // Fechar modal
        fecharModal('cadastroDespesaModal');
      })
      .catch(err => {
        console.error("Erro ao salvar despesa:", err);
        exibirToast("Erro ao cadastrar despesa: " + err.message, "danger");
      });
  } else {
    const despesaData = {
      descricao,
      valor,
      dataCompra,
      formaPagamento,
      categoria,
      pago: false,
      timestamp: new Date().toISOString()
    };
    
    despesasRef.push(despesaData)
      .then(() => {
        exibirToast("Despesa à vista cadastrada com sucesso!", "success");
        document.getElementById("despesaDescricao").value = "";
        document.getElementById("despesaValor").value = "";
        document.getElementById("dataCompra").value = new Date().toISOString().split("T")[0];
        document.getElementById("categoriaDespesa").value = "";
        
        // Atualizar componentes
        filtrarDespesas();
        renderCalendar();
        atualizarDashboard();
        carregarPainelDespesasMes();
        
        // Fechar modal
        fecharModal('cadastroDespesaModal');
      })
      .catch(err => {
        console.error("Erro ao salvar despesa:", err);
        exibirToast("Erro ao cadastrar despesa: " + err.message, "danger");
      });
  }
}

/**
 * Alterna a exibição do parcelamento
 */
function toggleParcelamento() {
  const forma = document.getElementById("formaPagamento").value;
  document.getElementById("parcelamentoDiv").style.display = forma === "cartao" ? "block" : "none";
}

/**
 * Paga uma despesa selecionada
 */
function pagarDespesaSelecionada() {
  const despesaSelect = document.getElementById("despesaSelect");
  const selectedValue = despesaSelect.value;
  
  if (!selectedValue) {
    exibirToast("Selecione uma despesa/parcela!", "warning");
    return;
  }
  
  const saldoAtualText = document.getElementById("saldoAtual").innerText;
  const saldoAtual = parseFloat(saldoAtualText.replace("R$", "").replace(",", ".").trim());
  const optionText = despesaSelect.options[despesaSelect.selectedIndex].text;
  const match = optionText.match(/R\$\s*([\d.,]+)/);
  
  if (match) {
    const despesaValor = parseFloat(match[1].replace(",", "."));
    if (saldoAtual < despesaValor) {
      exibirToast("Saldo insuficiente para pagar esta despesa.", "danger");
      return;
    }
  }
  
  if (selectedValue.indexOf("|") === -1) {
    // Despesa à vista
    db.ref("despesas").child(selectedValue).update({ pago: true })
      .then(() => {
        exibirToast("Despesa paga com sucesso!", "success");
        filtrarDespesas();
        renderCalendar();
        atualizarDashboard();
        carregarPainelDespesasMes();
        
        // Fechar modal
        fecharModal('pagarDespesaModal');
      })
      .catch(err => {
        console.error("Erro ao pagar despesa:", err);
        exibirToast("Erro ao pagar a despesa: " + err.message, "danger");
      });
  } else {
    // Parcela de cartão
    const [expenseKey, parcelIndex] = selectedValue.split("|");
    const parcelaRef = db.ref("despesas/" + expenseKey + "/parcelas/" + parcelIndex);
    
    parcelaRef.update({ pago: true })
      .then(() => {
        // Verificar se todas as parcelas foram pagas
        db.ref("despesas/" + expenseKey + "/parcelas").once("value").then(snapshot => {
          let allPaid = true;
          snapshot.forEach(child => { 
            if (!child.val().pago) { 
              allPaid = false; 
            } 
          });
          
          if (allPaid) { 
            db.ref("despesas").child(expenseKey).update({ pago: true }); 
          }
        });
        
        exibirToast("Parcela paga com sucesso!", "success");
        filtrarDespesas();
        renderCalendar();
        atualizarDashboard();
        carregarPainelDespesasMes();
        
        // Fechar modal
        fecharModal('pagarDespesaModal');
      })
      .catch(err => {
        console.error("Erro ao pagar parcela:", err);
        exibirToast("Erro ao pagar a parcela: " + err.message, "danger");
      });
  }
}

/**
 * Carrega o relatório mensal
 */
function loadRelatorioMensal() {
  let dataInicial = rangeStart ? rangeStart.toISOString().split("T")[0] : "";
  let dataFinal = rangeEnd ? rangeEnd.toISOString().split("T")[0] : "";
  const container = document.getElementById("relatorioMensalContainer");
  container.innerHTML = "";
  
  db.ref("despesas").once("value").then(snapshot => {
    let rows = [];
    snapshot.forEach(child => {
      const despesa = child.val();
      function getTime(dateStr) { return new Date(dateStr).getTime(); }
      
      if (despesa.formaPagamento === "avista" && despesa.pago) {
        let dt = despesa.dataCompra;
        if ((!dataInicial || getTime(dt) >= getTime(dataInicial)) && (!dataFinal || getTime(dt) <= getTime(dataFinal))) {
          rows.push({ 
            descricao: despesa.descricao, 
            data: dt, 
            valor: despesa.valor, 
            forma: "À Vista",
            categoria: window.novo_categoriasMap[despesa.categoria] || "Sem categoria"
          });
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (parcela.pago) {
            let dt = parcela.vencimento;
            if ((!dataInicial || getTime(dt) >= getTime(dataInicial)) && (!dataFinal || getTime(dt) <= getTime(dataFinal))) {
              rows.push({ 
                descricao: `${despesa.descricao} - Parcela ${index+1}`, 
                data: dt, 
                valor: parcela.valor, 
                forma: "Cartão",
                categoria: window.novo_categoriasMap[despesa.categoria] || "Sem categoria"
              });
            }
          }
        });
      }
    });
    
    if (rows.length > 0) {
      // Criar tabela
      let table = document.createElement("table");
      table.className = "table";
      let header = document.createElement("tr");
      ["Descrição", "Data", "Valor", "Forma", "Categoria"].forEach(col => {
        let th = document.createElement("th");
        th.innerText = col;
        header.appendChild(th);
      });
      table.appendChild(header);
      
      // Ordenar por data
      rows.sort((a, b) => new Date(a.data) - new Date(b.data));
      
      // Adicionar linhas
      rows.forEach(r => {
        let tr = document.createElement("tr");
        
        let tdDesc = document.createElement("td");
        tdDesc.innerText = r.descricao;
        
        let tdData = document.createElement("td");
        tdData.innerText = new Date(r.data).toLocaleDateString();
        
        let tdValor = document.createElement("td");
        tdValor.innerText = "R$ " + parseFloat(r.valor).toFixed(2);
        
        let tdForma = document.createElement("td");
        tdForma.innerText = r.forma;
        
        let tdCategoria = document.createElement("td");
        tdCategoria.innerText = r.categoria;
        
        tr.appendChild(tdDesc);
        tr.appendChild(tdData);
        tr.appendChild(tdValor);
        tr.appendChild(tdForma);
        tr.appendChild(tdCategoria);
        table.appendChild(tr);
      });
      
      // Adicionar total
      let totalRow = document.createElement("tr");
      totalRow.className = "total-row";
      
      let tdTotal = document.createElement("td");
      tdTotal.colSpan = 2;
      tdTotal.innerText = "Total";
      tdTotal.style.textAlign = "right";
      tdTotal.style.fontWeight = "bold";
      
      let tdTotalValor = document.createElement("td");
      const totalValor = rows.reduce((sum, row) => sum + parseFloat(row.valor), 0);
      tdTotalValor.innerText = "R$ " + totalValor.toFixed(2);
      tdTotalValor.style.fontWeight = "bold";
      
      let tdEmpty1 = document.createElement("td");
      let tdEmpty2 = document.createElement("td");
      
      totalRow.appendChild(tdTotal);
      totalRow.appendChild(tdTotalValor);
      totalRow.appendChild(tdEmpty1);
      totalRow.appendChild(tdEmpty2);
      table.appendChild(totalRow);
      
      container.appendChild(table);
      
      // Criar gráfico de categorias
      criarGraficoCategorias(rows);
    } else {
      container.innerHTML = "<p class='text-center'>Nenhum registro encontrado para o período selecionado.</p>";
    }
  });
}

/**
 * Cria o gráfico de categorias para o relatório
 */
function criarGraficoCategorias(rows) {
  // Agrupar por categoria
  let categorias = {};
  rows.forEach(row => {
    if (!categorias[row.categoria]) {
      categorias[row.categoria] = 0;
    }
    categorias[row.categoria] += parseFloat(row.valor);
  });
  
  // Preparar dados para o gráfico
  let series = [];
  let labels = [];
  
  Object.keys(categorias).forEach(categoria => {
    series.push(categorias[categoria]);
    labels.push(categoria);
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
          return "R$ " + value.toFixed(2);
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
}

/**
 * Renderiza o calendário
 */
function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  calendarGrid.innerHTML = "";
  const monthYearElem = document.getElementById("calendarMonthYear");
  const date = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
  monthYearElem.innerText = `${date.toLocaleString('pt-BR', { month: 'long' })} ${currentCalendarYear}`;
  
  db.ref("despesas").once("value").then(snapshot => {
    let expensesPerDay = {};
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Despesas à vista:
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const d = new Date(despesa.dataCompra);
        if (d.getMonth() === currentCalendarMonth && d.getFullYear() === currentCalendarYear) {
          const day = d.getDate();
          const valor = parseFloat(despesa.valor) || 0;
          
          // Se a despesa estiver paga, subtrai; se não, soma
          if (!expensesPerDay[day]) {
            expensesPerDay[day] = { total: 0, items: [] };
          }
          
          expensesPerDay[day].total += (despesa.pago ? -valor : valor);
          expensesPerDay[day].items.push({
            descricao: despesa.descricao,
            valor: valor,
            pago: despesa.pago,
            tipo: 'avista'
          });
        }
      }
      // Despesas no cartão:
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          const d = new Date(parcela.vencimento);
          if (d.getMonth() === currentCalendarMonth && d.getFullYear() === currentCalendarYear) {
            const day = d.getDate();
            const valor = parseFloat(parcela.valor) || 0;
            
            if (!expensesPerDay[day]) {
              expensesPerDay[day] = { total: 0, items: [] };
            }
            
            expensesPerDay[day].total += (parcela.pago ? -valor : valor);
            expensesPerDay[day].items.push({
              descricao: `${despesa.descricao} - Parcela ${index+1}`,
              valor: valor,
              pago: parcela.pago,
              tipo: 'cartao'
            });
          }
        });
      }
    });
    
    // Criar tabela do calendário
    let table = document.createElement("table");
    table.className = "calendar-table";
    
    // Cabeçalho com dias da semana
    let headerRow = document.createElement("tr");
    const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    weekDays.forEach(weekday => {
      let th = document.createElement("th");
      th.innerText = weekday;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Células do calendário
    let row = document.createElement("tr");
    
    // Preencher espaços vazios no início do mês
    for (let i = 0; i < date.getDay(); i++) {
      let cell = document.createElement("td");
      cell.className = "calendar-day empty";
      row.appendChild(cell);
    }
    
    // Preencher dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      if (row.children.length === 7) {
        table.appendChild(row);
        row = document.createElement("tr");
      }
      
      let cell = document.createElement("td");
      cell.className = "calendar-day";
      
      // Verificar se é o dia atual
      const today = new Date();
      if (day === today.getDate() && currentCalendarMonth === today.getMonth() && currentCalendarYear === today.getFullYear()) {
        cell.classList.add("today");
      }
      
      // Adicionar conteúdo da célula
      let dayInfo = document.createElement("div");
      dayInfo.className = "day-number";
      dayInfo.innerText = day;
      
      let dayAmount = document.createElement("div");
      dayAmount.className = "day-amount";
      
      if (expensesPerDay[day]) {
        const totalDia = expensesPerDay[day].total;
        dayAmount.innerText = "R$ " + totalDia.toFixed(2);
        
        // Adicionar classe baseada no valor
        if (totalDia > 0) {
          cell.classList.add("has-expenses");
        }
      } else {
        dayAmount.innerText = "R$ 0.00";
      }
      
      cell.appendChild(dayInfo);
      cell.appendChild(dayAmount);
      
      // Adicionar evento de clique
      cell.addEventListener("click", function() { 
        showBalanceForDate(day); 
      });
      
      row.appendChild(cell);
    }
    
    // Adicionar última linha
    table.appendChild(row);
    
    // Adicionar tabela ao grid
    calendarGrid.appendChild(table);
  });
}

/**
 * Mostra o saldo para uma data específica
 */
function showBalanceForDate(day) {
  let selectedDate = new Date(currentCalendarYear, currentCalendarMonth, day);
  
  // Atualizar título do calendário
  document.getElementById("calendarTitulo").innerText = `Despesas de ${selectedDate.toLocaleDateString()}`;
  
  // Buscar despesas do dia
  db.ref("despesas").once("value").then(snapshot => {
    let despesasDia = [];
    let totalDespesasDia = 0;
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        const dataCompra = new Date(despesa.dataCompra);
        if (dataCompra.getDate() === day && dataCompra.getMonth() === currentCalendarMonth && dataCompra.getFullYear() === currentCalendarYear) {
          despesasDia.push({
            descricao: despesa.descricao,
            valor: parseFloat(despesa.valor) || 0,
            pago: despesa.pago,
            tipo: "À Vista"
          });
          
          if (!despesa.pago) {
            totalDespesasDia += parseFloat(despesa.valor) || 0;
          }
        }
      }
      // Parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          const dataVencimento = new Date(parcela.vencimento);
          if (dataVencimento.getDate() === day && dataVencimento.getMonth() === currentCalendarMonth && dataVencimento.getFullYear() === currentCalendarYear) {
            despesasDia.push({
              descricao: `${despesa.descricao} - Parcela ${index+1}`,
              valor: parseFloat(parcela.valor) || 0,
              pago: parcela.pago,
              tipo: "Cartão"
            });
            
            if (!parcela.pago) {
              totalDespesasDia += parseFloat(parcela.valor) || 0;
            }
          }
        });
      }
    });
    
    // Atualizar informações de despesas do dia
    document.getElementById("despesasDia").innerText = "R$ " + totalDespesasDia.toFixed(2);
    
    // Calcular saldo disponível
    db.ref("pessoas").once("value").then(snapshot => {
      let totalIncome = 0;
      snapshot.forEach(child => {
        let pessoa = child.val();
        totalIncome += parseFloat(pessoa.saldoInicial) || 0;
        
        if (pessoa.pagamentos) {
          pessoa.pagamentos.forEach(pag => {
            let pagamentoDia = parseInt(pag.dia);
            if (pagamentoDia <= day) {
              totalIncome += parseFloat(pag.valor) || 0;
            }
          });
        }
      });
      
      // Calcular despesas pagas até a data
      let totalExpensesPaid = 0;
      db.ref("despesas").once("value").then(snapshot => {
        snapshot.forEach(child => {
          let despesa = child.val();
          
          if (despesa.formaPagamento === "avista" && despesa.pago && despesa.dataCompra) {
            let dataCompra = new Date(despesa.dataCompra);
            if (dataCompra <= selectedDate) {
              totalExpensesPaid += parseFloat(despesa.valor) || 0;
            }
          } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
            despesa.parcelas.forEach(parcela => {
              if (parcela.pago) {
                let dataVencimento = new Date(parcela.vencimento);
                if (dataVencimento <= selectedDate) {
                  totalExpensesPaid += parseFloat(parcela.valor) || 0;
                }
              }
            });
          }
        });
        
        // Calcular saldo disponível
        let saldoDisponivel = totalIncome - totalExpensesPaid;
        document.getElementById("saldoDisponivel").innerText = "R$ " + saldoDisponivel.toFixed(2);
      });
    });
  });
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

/**
 * Alterna a exibição do seletor de mês/ano
 */
function toggleMonthYearSelect() {
  let selectDiv = document.getElementById("monthYearSelect");
  selectDiv.style.display = (selectDiv.style.display === "none" || selectDiv.style.display === "") ? "block" : "none";
  
  if (selectDiv.style.display === "block") {
    let selectYear = document.getElementById("selectYear");
    if (selectYear.options.length === 0) {
      for (let y = currentCalendarYear - 5; y <= currentCalendarYear + 5; y++) {
        let option = document.createElement("option");
        option.value = y;
        option.text = y;
        if (y === currentCalendarYear) option.selected = true;
        selectYear.appendChild(option);
      }
    }
    document.getElementById("selectMonth").value = currentCalendarMonth;
  }
}

/**
 * Atualiza o calendário a partir do seletor
 */
function updateCalendarFromSelect() {
  let selectMonth = document.getElementById("selectMonth").value;
  let selectYear = document.getElementById("selectYear").value;
  currentCalendarMonth = parseInt(selectMonth);
  currentCalendarYear = parseInt(selectYear);
  toggleMonthYearSelect();
  renderCalendar();
}

/**
 * Alterna a exibição dos campos de CLT
 */
function toggleClt() {
  document.getElementById("cltFields").style.display =
    document.getElementById("cltCheckbox").checked ? "block" : "none";
}

/**
 * Atualiza o salário líquido
 */
function atualizarSalarioLiquido() {
  let salarioBruto = parseFloat(document.getElementById("salarioBruto").value) || 0;
  let inss = calcularINSS(salarioBruto);
  let irrf = calcularIRRF(salarioBruto - inss);
  let salarioLiquido = salarioBruto - inss - irrf;
  
  document.getElementById("salarioLiquido").value = salarioLiquido.toFixed(2);
}

/**
 * Calcula o INSS
 */
function calcularINSS(salarioBruto) {
  // Tabela INSS 2023
  if (salarioBruto <= 1320.00) {
    return salarioBruto * 0.075;
  } else if (salarioBruto <= 2571.29) {
    return 1320.00 * 0.075 + (salarioBruto - 1320.00) * 0.09;
  } else if (salarioBruto <= 3856.94) {
    return 1320.00 * 0.075 + (2571.29 - 1320.00) * 0.09 + (salarioBruto - 2571.29) * 0.12;
  } else if (salarioBruto <= 7507.49) {
    return 1320.00 * 0.075 + (2571.29 - 1320.00) * 0.09 + (3856.94 - 2571.29) * 0.12 + (salarioBruto - 3856.94) * 0.14;
  } else {
    return 877.24; // Teto INSS 2023
  }
}

/**
 * Calcula o IRRF
 */
function calcularIRRF(baseCalculo) {
  // Tabela IRRF 2023
  if (baseCalculo <= 2112.00) {
    return 0;
  } else if (baseCalculo <= 2826.65) {
    return (baseCalculo * 0.075) - 158.40;
  } else if (baseCalculo <= 3751.05) {
    return (baseCalculo * 0.15) - 370.40;
  } else if (baseCalculo <= 4664.68) {
    return (baseCalculo * 0.225) - 651.73;
  } else {
    return (baseCalculo * 0.275) - 884.96;
  }
}

/**
 * Gera os campos de pagamentos
 */
function gerarCamposPagamentos() {
  const numPagamentos = parseInt(document.getElementById("numPagamentos").value) || 0;
  const container = document.getElementById("pagamentosContainer");
  container.innerHTML = "";
  
  for (let i = 1; i <= numPagamentos; i++) {
    const div = document.createElement("div");
    div.className = "form-group";
    div.innerHTML = `
      <label class="form-label">Pagamento ${i}:</label>
      <div class="d-flex gap-2">
        <input type="number" id="pagamentoDia${i}" class="form-control" placeholder="Dia" min="1" max="31">
        <input type="number" id="pagamentoValor${i}" class="form-control" placeholder="Valor" step="0.01">
      </div>
    `;
    container.appendChild(div);
  }
}

/**
 * Salva uma categoria
 */
function salvarCategoria() {
  const categoriaNome = document.getElementById("categoriaNome").value;
  
  if (!categoriaNome) {
    exibirToast("Digite o nome da categoria.", "warning");
    return;
  }
  
  db.ref("categorias").push({
    nome: categoriaNome
  }).then(() => {
    exibirToast("Categoria salva com sucesso!", "success");
    document.getElementById("categoriaNome").value = "";
    loadCategorias();
    updateCategoriaSelect();
    loadCategoriasFiltro();
  }).catch(err => {
    console.error("Erro ao salvar categoria:", err);
    exibirToast("Erro ao salvar categoria: " + err.message, "danger");
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
        updateCategoriaSelect();
        loadCategoriasFiltro();
      })
      .catch(err => {
        console.error("Erro ao excluir categoria:", err);
        exibirToast("Erro ao excluir categoria: " + err.message, "danger");
      });
  }
}

/**
 * Salva um cartão
 */
function salvarCartao() {
  const nomeCartao = document.getElementById("nomeCartao").value;
  const diaFatura = parseInt(document.getElementById("diaFatura").value);
  const diaFechamento = parseInt(document.getElementById("diaFechamento").value);
  const limiteCartao = parseFloat(document.getElementById("limiteCartao").value);
  
  if (!nomeCartao) {
    exibirToast("Digite o nome do cartão.", "warning");
    return;
  }
  
  if (isNaN(diaFatura) || diaFatura < 1 || diaFatura > 31) {
    exibirToast("O dia da fatura deve ser um número entre 1 e 31.", "warning");
    return;
  }
  
  if (isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
    exibirToast("O dia do fechamento deve ser um número entre 1 e 31.", "warning");
    return;
  }
  
  if (isNaN(limiteCartao) || limiteCartao <= 0) {
    exibirToast("O limite do cartão deve ser um número maior que zero.", "warning");
    return;
  }
  
  db.ref("cartoes").push({
    nome: nomeCartao,
    diaFatura: diaFatura,
    diaFechamento: diaFechamento,
    limite: limiteCartao
  }).then(() => {
    exibirToast("Cartão salvo com sucesso!", "success");
    document.getElementById("nomeCartao").value = "";
    document.getElementById("diaFatura").value = "";
    document.getElementById("diaFechamento").value = "";
    document.getElementById("limiteCartao").value = "";
    loadCartoes();
    updateCartaoSelect();
  }).catch(err => {
    console.error("Erro ao salvar cartão:", err);
    exibirToast("Erro ao salvar cartão: " + err.message, "danger");
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
 * Carrega as rendas
 */
function loadRendas() {
  const rendaList = document.getElementById("usuariosListaPrincipal");
  rendaList.innerHTML = "";
  
  db.ref("pessoas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const key = child.key;
      const pessoa = child.val();
      const div = document.createElement("div");
      div.className = "renda-item";
      
      let pagamentosInfo = "";
      if (pessoa.pagamentos) {
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
            <strong>Saldo Inicial:</strong> R$ ${parseFloat(pessoa.saldoInicial).toFixed(2)} | 
            <strong>Salário Líquido:</strong> R$ ${parseFloat(pessoa.salarioLiquido || 0).toFixed(2)}
          </div>
          ${pagamentosInfo}
        </div>
        <button class="btn-icon btn-danger" onclick="deleteRenda('${key}')">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      rendaList.appendChild(div);
    });
    
    rendaVisivel = true;
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
 * Navega para o mês anterior no dashboard
 */
function prevDashboardMonth() {
  let selectMonth = document.getElementById("dashboardMonth");
  let selectYear = document.getElementById("dashboardYear");
  let currentMonth = parseInt(selectMonth.value);
  
  if (currentMonth === 0) {
    currentMonth = 11;
    selectYear.value = parseInt(selectYear.value) - 1;
  } else {
    currentMonth--;
  }
  
  selectMonth.value = currentMonth;
  atualizarDashboard();
  updateDespesasMesTitle();
  carregarPainelDespesasMes();
}

/**
 * Navega para o próximo mês no dashboard
 */
function nextDashboardMonth() {
  let selectMonth = document.getElementById("dashboardMonth");
  let selectYear = document.getElementById("dashboardYear");
  let currentMonth = parseInt(selectMonth.value);
  
  if (currentMonth === 11) {
    currentMonth = 0;
    selectYear.value = parseInt(selectYear.value) + 1;
  } else {
    currentMonth++;
  }
  
  selectMonth.value = currentMonth;
  atualizarDashboard();
  updateDespesasMesTitle();
  carregarPainelDespesasMes();
}

/**
 * Atualiza o título do mês no dashboard
 */
function updateDespesasMesTitle() {
  let selectMonth = document.getElementById("dashboardMonth");
  let selectYear = document.getElementById("dashboardYear");
  let monthIndex = parseInt(selectMonth.value);
  let year = parseInt(selectYear.value);
  let monthName = new Date(2020, monthIndex).toLocaleString('pt-BR', { month: 'long' });
  document.getElementById("despesasMesTitle").innerText = monthName.charAt(0).toUpperCase() + monthName.slice(1) + " de " + year;
}

/**
 * Inicialização quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
  // Configurar daterangepicker
  $('#dataRange').daterangepicker({
    autoUpdateInput: false,
    locale: {
      format: 'DD/MM/YYYY',
      applyLabel: 'Aplicar',
      cancelLabel: 'Cancelar',
      fromLabel: 'Data Inicial',
      toLabel: 'Data Final',
      customRangeLabel: 'Personalizado',
      weekLabel: 'S',
      daysOfWeek: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
      monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
      firstDay: 0
    }
  });
  
  $('#dataRange').on('apply.daterangepicker', function(ev, picker) {
    rangeStart = picker.startDate.toDate();
    rangeEnd = picker.endDate.toDate();
    $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
    loadRelatorioMensal();
  });
  
  $('#dataRange').on('cancel.daterangepicker', function(ev, picker) {
    $(this).val('');
    rangeStart = null;
    rangeEnd = null;
    loadRelatorioMensal();
  });
  
  // Inicializar componentes
  document.getElementById("dataCompra").value = new Date().toISOString().split("T")[0];
  updateCategoriaSelect();
  updateCartaoSelect();
  loadDespesasNaoPagasSelect();
  loadCategorias();
  loadCartoes();
  loadCategoriasFiltro();
  preencherDashboardAno();
  document.getElementById("dashboardMonth").value = new Date().getMonth();
  atualizarDashboard();
  updateDespesasMesTitle();
  carregarPainelDespesasMes();
  
  // Adicionar event listeners
  document.getElementById("dashboardMonth").addEventListener("change", carregarPainelDespesasMes);
  document.getElementById("dashboardYear").addEventListener("change", carregarPainelDespesasMes);
  document.querySelector("button[onclick='atualizarDashboard()']").addEventListener("click", function() {
    setTimeout(carregarPainelDespesasMes, 500);
  });
  
  // Inicializar menu mobile
  document.getElementById("menuToggle").addEventListener("click", function() {
    document.getElementById("sidebar").classList.toggle("active");
  });
  
  // Inicializar formulário de cadastro de renda
  document.getElementById("cadastroForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const nome = document.getElementById("nome").value;
    const parentesco = document.getElementById("parentesco").value;
    const saldoInicial = parseFloat(document.getElementById("saldoInicial").value);
    const isCLT = document.getElementById("cltCheckbox").checked;
    const isPJ = document.getElementById("pjCheckbox").checked;
    
    if (!nome) {
      exibirToast("Digite o nome.", "warning");
      return;
    }
    
    if (isNaN(saldoInicial)) {
      exibirToast("Digite um saldo inicial válido.", "warning");
      return;
    }
    
    let pessoaData = {
      nome,
      parentesco,
      saldoInicial
    };
    
    if (isCLT) {
      const salarioBruto = parseFloat(document.getElementById("salarioBruto").value);
      const salarioLiquido = parseFloat(document.getElementById("salarioLiquido").value);
      const numPagamentos = parseInt(document.getElementById("numPagamentos").value);
      
      if (isNaN(salarioBruto) || salarioBruto <= 0) {
        exibirToast("Digite um salário bruto válido.", "warning");
        return;
      }
      
      if (isNaN(numPagamentos) || numPagamentos < 1) {
        exibirToast("Digite um número de pagamentos válido.", "warning");
        return;
      }
      
      pessoaData.salarioBruto = salarioBruto;
      pessoaData.salarioLiquido = salarioLiquido;
      
      let pagamentos = [];
      let totalPagamentos = 0;
      
      for (let i = 1; i <= numPagamentos; i++) {
        const dia = parseInt(document.getElementById("pagamentoDia" + i).value);
        const valor = parseFloat(document.getElementById("pagamentoValor" + i).value);
        
        if (isNaN(dia) || dia < 1 || dia > 31) {
          exibirToast(`Digite um dia válido para o pagamento ${i}.`, "warning");
          return;
        }
        
        if (isNaN(valor) || valor <= 0) {
          exibirToast(`Digite um valor válido para o pagamento ${i}.`, "warning");
          return;
        }
        
        pagamentos.push({ dia, valor });
        totalPagamentos += valor;
      }
      
      if (Math.abs(totalPagamentos - salarioLiquido) > 0.01) {
        document.getElementById("avisoErro").style.display = "block";
        return;
      }
      
      pessoaData.pagamentos = pagamentos;
    }
    
    db.ref("pessoas").push(pessoaData)
      .then(() => {
        exibirToast("Renda cadastrada com sucesso!", "success");
        document.getElementById("cadastroForm").reset();
        document.getElementById("cltFields").style.display = "none";
        document.getElementById("avisoErro").style.display = "none";
        document.getElementById("pagamentosContainer").innerHTML = "";
        fecharModal("cadastroModal");
        loadRendas();
        atualizarDashboard();
      })
      .catch(err => {
        console.error("Erro ao cadastrar renda:", err);
        exibirToast("Erro ao cadastrar renda: " + err.message, "danger");
      });
  });
});
