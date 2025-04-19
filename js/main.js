/**
 * Script principal para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este arquivo contém as funções principais do sistema e integra
 * as novas funcionalidades com o código existente.
 */

'use strict';

let rendaVisivel = false;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let rangeStart = null;
let rangeEnd = null;

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

// Mapa global de categorias
window.novo_categoriasMap = {};

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
  // Carregar categorias
  db.ref("categorias").once("value").then(snapshot => {
    snapshot.forEach(child => {
      window.novo_categoriasMap[child.key] = child.val().nome;
    });
  });
  
  // Configurar DateRangePicker
  configurarDateRangePicker();
  
  // Preencher seletores de ano
  preencherDashboardAno();
  preencherCalendarioAnos();
  
  // Configurar menu mobile
  configurarMenuMobile();
  
  // Atualizar dashboard inicial
  atualizarDashboard();
  
  // Carregar cartões para o formulário de despesas
  carregarCartoes();
  
  // Inicializar gráficos
  inicializarGraficos();
});

/**
 * Configura o DateRangePicker para seleção de períodos
 */
function configurarDateRangePicker() {
  $('#dataRange').mask('00/00/0000 - 00/00/0000', {
    placeholder: "00/00/0000 - 00/00/0000",
    clearIfNotMatch: false,
    selectOnFocus: true
  });
  
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
  
  $('#dataRange').on('show.daterangepicker', function(ev, picker) {
    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/**
 * Configura o menu mobile
 */
function configurarMenuMobile() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
    });
    
    // Fechar menu ao clicar em um link
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('show');
        }
      });
    });
  }
}

/**
 * Preenche o seletor de ano do dashboard
 */
function preencherDashboardAno() {
  const selectAno = document.getElementById("dashboardYear");
  if (!selectAno) return;
  
  selectAno.innerHTML = "";
  const currentYear = new Date().getFullYear();
  
  for(let y = currentYear - 5; y <= currentYear + 5; y++){
    let option = document.createElement("option");
    option.value = y;
    option.text = y;
    if(y === currentYear) option.selected = true;
    selectAno.appendChild(option);
  }
}

/**
 * Preenche o seletor de ano do calendário
 */
function preencherCalendarioAnos() {
  const selectAno = document.getElementById("selectYear");
  if (!selectAno) return;
  
  selectAno.innerHTML = "";
  const currentYear = new Date().getFullYear();
  
  for(let y = currentYear - 5; y <= currentYear + 5; y++){
    let option = document.createElement("option");
    option.value = y;
    option.text = y;
    if(y === currentYear) option.selected = true;
    selectAno.appendChild(option);
  }
}

/**
 * Inicializa os gráficos do sistema
 */
function inicializarGraficos() {
  // Inicializar gráfico de despesas do dashboard
  const graficoDespesasElement = document.getElementById('graficoDespesas');
  if (graficoDespesasElement) {
    const options = {
      series: [{
        name: 'Despesas',
        data: []
      }],
      chart: {
        height: 350,
        type: 'bar',
        toolbar: {
          show: false
        }
      },
      colors: ['var(--primary)'],
      plotOptions: {
        bar: {
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return 'R$ ' + val.toFixed(2);
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["var(--text-color)"]
        }
      },
      xaxis: {
        categories: [],
        position: 'bottom',
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: 'Valor (R$)'
        }
      }
    };

    window.graficoDespesas = new ApexCharts(graficoDespesasElement, options);
    window.graficoDespesas.render();
  }
  
  // Inicializar gráfico de categorias
  const graficoCategorias = document.getElementById('graficoCategorias');
  if (graficoCategorias) {
    const options = {
      series: [],
      chart: {
        height: 350,
        type: 'pie'
      },
      labels: [],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }],
      colors: ['#4361ee', '#f72585', '#4cc9f0', '#f8961e', '#90e0ef', '#3a0ca3']
    };

    window.graficoCategoriasPie = new ApexCharts(graficoCategorias, options);
    window.graficoCategoriasPie.render();
  }
}

/**
 * Exibe a seção selecionada e oculta as demais
 */
function showSection(sectionId) {
  const sections = document.querySelectorAll('main > section');
  sections.forEach(sec => sec.style.display = 'none');
  
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = 'block';
  }
  
  // Atualizar classe ativa no menu
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
      link.classList.add('active');
    }
  });
  
  // Carregar dados específicos da seção
  if (sectionId === 'dashboardSection') {
    atualizarDashboard();
  } else if (sectionId === 'despesasSection') {
    carregarTodasDespesas();
  } else if (sectionId === 'relatorioSection') {
    loadRelatorioMensal();
  } else if (sectionId === 'categoriasSection') {
    loadCategorias();
  } else if (sectionId === 'cartoesSection') {
    loadCartoes();
  } else if (sectionId === 'rendaSection') {
    loadRendas();
  } else if (sectionId === 'previsaoSection') {
    novo_calcularPrevisoes();
  } else if (sectionId === 'alertasSection') {
    verificarContasProximasVencimento();
    verificarLimitesGastos();
  }
}

/**
 * Abre um modal
 */
window.abrirModal = function(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  
  modal.style.display = "flex";
  
  // Carregar dados específicos do modal
  if (id === 'fonteModal') {
    loadUsuarios();
  } else if (id === 'categoriasModal') {
    loadCategorias();
  } else if (id === 'cartaoModal') {
    loadCartoes();
  } else if (id === 'calendarModal') {
    document.getElementById("calendarTitulo").innerText = "Calendário de Despesas";
    renderCalendar();
  } else if (id === 'pagarDespesaModal') {
    filtrarDespesas();
  } else if (id === 'novo_limitesModal') {
    novo_carregarLimites();
  }
};

/**
 * Fecha um modal
 */
window.fecharModal = function(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  
  modal.style.display = "none";
};

/**
 * Exporta os dados para CSV
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
    
    // Criar e baixar o arquivo
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "despesas.csv";
    a.click();
    
    // Notificar usuário
    exibirToast('Dados exportados com sucesso!', 'success');
  });
}

/**
 * Atualiza o dashboard com os dados mais recentes
 */
function atualizarDashboard() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  let saldo = 0;
  let hoje = new Date();
  
  // Atualizar título do mês
  document.getElementById("despesasMesTitle").innerText = 
    obterNomeMes(dashboardMonth) + ' de ' + dashboardYear;
  
  // Calcular saldo atual
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
    
    // Subtrair despesas pagas
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
      
      // Atualizar saldo no dashboard
      document.getElementById("saldoAtual").innerText = "R$ " + saldo.toFixed(2);
      
      // Atualizar outros componentes do dashboard
      atualizarDespesasMes();
      currentCalendarMonth = dashboardMonth;
      currentCalendarYear = dashboardYear;
      atualizarGrafico();
      updateProximosVencimentos();
    });
  });
}

/**
 * Atualiza o valor de despesas do mês selecionado
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
    
    // Atualizar valor no dashboard
    document.getElementById("despesasMes").innerText = "R$ " + despesasMes.toFixed(2);
    
    // Atualizar lista de despesas do mês
    atualizarListaDespesasMes(dashboardMonth, dashboardYear);
  });
}

/**
 * Atualiza a lista de despesas do mês no dashboard
 */
function atualizarListaDespesasMes(mes, ano) {
  const listaDespesasElement = document.getElementById('listaDespesasMes');
  if (!listaDespesasElement) return;
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasMes = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        let dt = new Date(despesa.dataCompra);
        if (dt.getMonth() === mes && dt.getFullYear() === ano) {
          despesasMes.push({
            id: child.key,
            descricao: despesa.descricao,
            valor: parseFloat(despesa.valor) || 0,
            data: dt,
            pago: despesa.pago
          });
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          let dt = new Date(parcela.vencimento);
          if (dt.getMonth() === mes && dt.getFullYear() === ano) {
            despesasMes.push({
              id: `${child.key}|${index}`,
              descricao: `${despesa.descricao} - Parcela ${index + 1}`,
              valor: parseFloat(parcela.valor) || 0,
              data: dt,
              pago: parcela.pago
            });
          }
        });
      }
    });
    
    // Ordenar por data
    despesasMes.sort((a, b) => a.data - b.data);
    
    // Gerar HTML
    let html = '';
    
    if (despesasMes.length === 0) {
      html = '<p>Não há despesas cadastradas para este mês.</p>';
    } else {
      html = '<ul class="despesas-lista">';
      
      despesasMes.forEach(despesa => {
        const dataFormatada = despesa.data.toLocaleDateString('pt-BR');
        const statusClass = despesa.pago ? 'text-success' : '';
        const statusIcon = despesa.pago ? 'fa-check-circle' : 'fa-clock';
        
        html += `
          <li class="despesa-item ${statusClass}">
            <div class="despesa-info">
              <div class="despesa-descricao">${despesa.descricao}</div>
              <div class="despesa-valor">R$ ${despesa.valor.toFixed(2)}</div>
            </div>
            <div class="despesa-data">
              <span>${dataFormatada}</span>
              <i class="fas ${statusIcon}"></i>
            </div>
          </li>
        `;
      });
      
      html += '</ul>';
    }
    
    listaDespesasElement.innerHTML = html;
  });
}

/**
 * Atualiza o gráfico de despesas por categoria
 */
function atualizarGrafico() {
  if (!window.graficoDespesas) return;
  
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  
  // Obter despesas por categoria
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorCategoria = {};
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Função para processar uma despesa
      const processarDespesa = (valor, data, categoria) => {
        const dt = new Date(data);
        
        if (dt.getMonth() === dashboardMonth && dt.getFullYear() === dashboardYear) {
          if (!despesasPorCategoria[categoria]) {
            despesasPorCategoria[categoria] = 0;
          }
          
          despesasPorCategoria[categoria] += parseFloat(valor) || 0;
        }
      };
      
      // Processar despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        processarDespesa(despesa.valor, despesa.dataCompra, despesa.categoria);
      } 
      // Processar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (parcela.vencimento) {
            processarDespesa(parcela.valor, parcela.vencimento, despesa.categoria);
          }
        });
      }
    });
    
    // Preparar dados para o gráfico
    const categorias = [];
    const valores = [];
    
    Object.entries(despesasPorCategoria).forEach(([categoriaId, valor]) => {
      const nomeCategoria = window.novo_categoriasMap[categoriaId] || 'Categoria';
      categorias.push(nomeCategoria);
      valores.push(valor);
    });
    
    // Atualizar gráfico
    window.graficoDespesas.updateOptions({
      xaxis: {
        categories: categorias
      }
    });
    
    window.graficoDespesas.updateSeries([{
      name: 'Despesas',
      data: valores
    }]);
    
    // Atualizar gráfico de categorias se estiver na seção de relatórios
    if (document.getElementById('relatorioSection').style.display !== 'none' && window.graficoCategoriasPie) {
      window.graficoCategoriasPie.updateOptions({
        labels: categorias
      });
      
      window.graficoCategoriasPie.updateSeries(valores);
    }
  });
}

/**
 * Atualiza o indicador de próximos vencimentos
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
 * Carrega todas as despesas para a seção de despesas
 */
function carregarTodasDespesas() {
  const todasDespesasBody = document.getElementById('todasDespesasBody');
  if (!todasDespesasBody) return;
  
  db.ref("despesas").once("value").then(snapshot => {
    let todasDespesas = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      if (despesa.formaPagamento === "avista") {
        todasDespesas.push({
          id: child.key,
          descricao: despesa.descricao,
          valor: parseFloat(despesa.valor) || 0,
          data: new Date(despesa.dataCompra),
          categoria: despesa.categoria,
          pago: despesa.pago,
          tipo: 'avista'
        });
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          todasDespesas.push({
            id: `${child.key}|${index}`,
            descricao: `${despesa.descricao} - Parcela ${index + 1}`,
            valor: parseFloat(parcela.valor) || 0,
            data: new Date(parcela.vencimento),
            categoria: despesa.categoria,
            pago: parcela.pago,
            tipo: 'cartao'
          });
        });
      }
    });
    
    // Ordenar por data (mais recentes primeiro)
    todasDespesas.sort((a, b) => b.data - a.data);
    
    // Gerar HTML
    let html = '';
    
    todasDespesas.forEach(despesa => {
      const dataFormatada = despesa.data.toLocaleDateString('pt-BR');
      const nomeCategoria = window.novo_categoriasMap[despesa.categoria] || 'Categoria';
      const statusClass = despesa.pago ? 'text-success' : 'text-danger';
      const statusText = despesa.pago ? 'Pago' : 'Pendente';
      
      html += `
        <tr>
          <td>${despesa.descricao}</td>
          <td>R$ ${despesa.valor.toFixed(2)}</td>
          <td>${dataFormatada}</td>
          <td>${nomeCategoria}</td>
          <td class="${statusClass}">${statusText}</td>
          <td>
            <button class="btn btn-sm ${despesa.pago ? 'btn-outline' : 'btn-success'}" 
                    onclick="alterarStatusDespesa('${despesa.id}', ${!despesa.pago})" 
                    ${despesa.pago ? 'disabled' : ''}>
              <i class="fas ${despesa.pago ? 'fa-check' : 'fa-money-bill-wave'}"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    todasDespesasBody.innerHTML = html;
  });
}

/**
 * Altera o status de pagamento de uma despesa
 */
function alterarStatusDespesa(id, pago) {
  // Verificar se é uma parcela de cartão
  if (id.includes('|')) {
    const [despesaId, parcelaIndex] = id.split('|');
    
    db.ref(`despesas/${despesaId}/parcelas/${parcelaIndex}`).update({
      pago: pago,
      dataPagamento: pago ? new Date().toISOString().split('T')[0] : null
    }).then(() => {
      exibirToast(`Parcela ${pago ? 'paga' : 'marcada como não paga'} com sucesso!`, 'success');
      carregarTodasDespesas();
      atualizarDashboard();
    }).catch(error => {
      console.error("Erro ao alterar status da parcela:", error);
      exibirToast('Erro ao alterar status da parcela. Tente novamente.', 'danger');
    });
  } else {
    // Despesa à vista
    db.ref(`despesas/${id}`).update({
      pago: pago,
      dataPagamento: pago ? new Date().toISOString().split('T')[0] : null
    }).then(() => {
      exibirToast(`Despesa ${pago ? 'paga' : 'marcada como não paga'} com sucesso!`, 'success');
      carregarTodasDespesas();
      atualizarDashboard();
    }).catch(error => {
      console.error("Erro ao alterar status da despesa:", error);
      exibirToast('Erro ao alterar status da despesa. Tente novamente.', 'danger');
    });
  }
}

/**
 * Filtra despesas no modal de pagamento
 */
function filtrarDespesas() {
  const despesaSearch = document.getElementById('despesaSearch').value.toLowerCase();
  const mesFiltro = document.getElementById('mesFiltro').value.toUpperCase();
  const anoFiltro = document.getElementById('anoFiltro').value;
  const despesaSelect = document.getElementById('despesaSelect');
  
  if (!despesaSelect) return;
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasFiltradas = [];
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const dataCompra = new Date(despesa.dataCompra);
        const mesStr = obterNomeMes(dataCompra.getMonth()).substring(0, 3).toUpperCase();
        const anoStr = dataCompra.getFullYear().toString();
        
        if (
          despesa.descricao.toLowerCase().includes(despesaSearch) &&
          (mesFiltro === '' || mesStr.includes(mesFiltro)) &&
          (anoFiltro === '' || anoStr.includes(anoFiltro))
        ) {
          despesasFiltradas.push({
            id: child.key,
            descricao: despesa.descricao,
            valor: parseFloat(despesa.valor) || 0,
            data: dataCompra,
            tipo: 'avista'
          });
        }
      } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            const mesStr = obterNomeMes(dataVencimento.getMonth()).substring(0, 3).toUpperCase();
            const anoStr = dataVencimento.getFullYear().toString();
            
            if (
              despesa.descricao.toLowerCase().includes(despesaSearch) &&
              (mesFiltro === '' || mesStr.includes(mesFiltro)) &&
              (anoFiltro === '' || anoStr.includes(anoFiltro))
            ) {
              despesasFiltradas.push({
                id: `${child.key}|${index}`,
                descricao: `${despesa.descricao} - Parcela ${index + 1} de ${despesa.parcelas.length}`,
                valor: parseFloat(parcela.valor) || 0,
                data: dataVencimento,
                tipo: 'cartao'
              });
            }
          }
        });
      }
    });
    
    // Ordenar por data
    despesasFiltradas.sort((a, b) => a.data - b.data);
    
    // Limpar e preencher select
    despesaSelect.innerHTML = '';
    
    despesasFiltradas.forEach(despesa => {
      const dataFormatada = despesa.data.toISOString().split('T')[0];
      const option = document.createElement('option');
      option.value = despesa.id;
      option.text = `${despesa.descricao} - R$ ${despesa.valor.toFixed(2)} - ${dataFormatada}`;
      despesaSelect.appendChild(option);
    });
  });
}

/**
 * Paga a despesa selecionada no modal de pagamento
 */
function pagarDespesaSelecionada() {
  const despesaSelect = document.getElementById('despesaSelect');
  
  if (!despesaSelect || despesaSelect.selectedIndex === -1) {
    exibirToast('Selecione uma despesa para pagar.', 'warning');
    return;
  }
  
  const despesaId = despesaSelect.value;
  
  // Verificar se é uma parcela de cartão
  if (despesaId.includes('|')) {
    const [id, parcelaIndex] = despesaId.split('|');
    
    db.ref(`despesas/${id}/parcelas/${parcelaIndex}`).update({
      pago: true,
      dataPagamento: new Date().toISOString().split('T')[0]
    }).then(() => {
      exibirToast('Parcela paga com sucesso!', 'success');
      filtrarDespesas();
      atualizarDashboard();
      fecharModal('pagarDespesaModal');
    }).catch(error => {
      console.error("Erro ao pagar parcela:", error);
      exibirToast('Erro ao pagar parcela. Tente novamente.', 'danger');
    });
  } else {
    // Despesa à vista
    db.ref(`despesas/${despesaId}`).update({
      pago: true,
      dataPagamento: new Date().toISOString().split('T')[0]
    }).then(() => {
      exibirToast('Despesa paga com sucesso!', 'success');
      filtrarDespesas();
      atualizarDashboard();
      fecharModal('pagarDespesaModal');
    }).catch(error => {
      console.error("Erro ao pagar despesa:", error);
      exibirToast('Erro ao pagar despesa. Tente novamente.', 'danger');
    });
  }
}

/**
 * Renderiza o calendário de despesas
 */
function renderCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarMonthYear = document.getElementById('calendarMonthYear');
  
  if (!calendarGrid || !calendarMonthYear) return;
  
  // Atualizar título do mês/ano
  calendarMonthYear.innerText = `${obterNomeMes(currentCalendarMonth)} ${currentCalendarYear}`;
  
  // Obter primeiro dia do mês e último dia do mês
  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
  
  // Obter dia da semana do primeiro dia (0 = Domingo, 6 = Sábado)
  const firstDayOfWeek = firstDay.getDay();
  
  // Limpar grid
  calendarGrid.innerHTML = '';
  
  // Adicionar cabeçalhos dos dias da semana
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  diasSemana.forEach(dia => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = dia;
    calendarGrid.appendChild(dayHeader);
  });
  
  // Adicionar dias vazios antes do primeiro dia do mês
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Obter despesas do mês
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorDia = {};
    
    // Processar despesas
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Função para processar uma despesa
      const processarDespesa = (valor, data, pago) => {
        const dataVencimento = new Date(data);
        
        if (
          dataVencimento.getMonth() === currentCalendarMonth && 
          dataVencimento.getFullYear() === currentCalendarYear
        ) {
          const dia = dataVencimento.getDate();
          
          if (!despesasPorDia[dia]) {
            despesasPorDia[dia] = {
              total: 0,
              pagas: 0,
              pendentes: 0
            };
          }
          
          despesasPorDia[dia].total += parseFloat(valor) || 0;
          
          if (pago) {
            despesasPorDia[dia].pagas += parseFloat(valor) || 0;
          } else {
            despesasPorDia[dia].pendentes += parseFloat(valor) || 0;
          }
        }
      };
      
      // Processar despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        processarDespesa(despesa.valor, despesa.dataCompra, despesa.pago);
      } 
      // Processar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (parcela.vencimento) {
            processarDespesa(parcela.valor, parcela.vencimento, parcela.pago);
          }
        });
      }
    });
    
    // Adicionar dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = i;
      
      // Verificar se há despesas neste dia
      if (despesasPorDia[i]) {
        day.classList.add('has-events');
        
        // Adicionar informações de despesas como atributos de dados
        day.dataset.total = despesasPorDia[i].total.toFixed(2);
        day.dataset.pagas = despesasPorDia[i].pagas.toFixed(2);
        day.dataset.pendentes = despesasPorDia[i].pendentes.toFixed(2);
        
        // Adicionar evento de clique para mostrar detalhes
        day.addEventListener('click', function() {
          document.getElementById('despesasDia').innerText = `R$ ${this.dataset.total}`;
          
          // Destacar dia selecionado
          document.querySelectorAll('.calendar-day.active').forEach(el => {
            el.classList.remove('active');
          });
          this.classList.add('active');
        });
      }
      
      calendarGrid.appendChild(day);
    }
    
    // Atualizar saldo disponível
    db.ref("pessoas").once("value").then(snapshot => {
      let saldo = 0;
      
      snapshot.forEach(child => {
        let pessoa = child.val();
        saldo += parseFloat(pessoa.saldoInicial) || 0;
        
        if (pessoa.pagamentos) {
          pessoa.pagamentos.forEach(pag => {
            saldo += parseFloat(pag.valor) || 0;
          });
        }
      });
      
      // Subtrair despesas pagas
      db.ref("despesas").once("value").then(snapshot => {
        snapshot.forEach(child => {
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
        
        // Atualizar saldo no calendário
        document.getElementById('saldoDisponivel').innerText = `R$ ${saldo.toFixed(2)}`;
      });
    });
  });
}

/**
 * Avança para o próximo mês no calendário
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
 * Volta para o mês anterior no calendário
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
 * Alterna a visibilidade do seletor de mês/ano no calendário
 */
function toggleMonthYearSelect() {
  const monthYearSelect = document.getElementById('monthYearSelect');
  
  if (monthYearSelect.style.display === 'none' || !monthYearSelect.style.display) {
    monthYearSelect.style.display = 'flex';
    
    // Atualizar seletores com valores atuais
    document.getElementById('selectMonth').value = currentCalendarMonth;
    document.getElementById('selectYear').value = currentCalendarYear;
  } else {
    monthYearSelect.style.display = 'none';
    
    // Atualizar calendário com novos valores
    currentCalendarMonth = parseInt(document.getElementById('selectMonth').value);
    currentCalendarYear = parseInt(document.getElementById('selectYear').value);
    renderCalendar();
  }
}

/**
 * Avança para o próximo mês no dashboard
 */
function nextDashboardMonth() {
  const dashboardMonth = document.getElementById('dashboardMonth');
  const dashboardYear = document.getElementById('dashboardYear');
  
  let mes = parseInt(dashboardMonth.value);
  let ano = parseInt(dashboardYear.value);
  
  mes++;
  
  if (mes > 11) {
    mes = 0;
    ano++;
  }
  
  dashboardMonth.value = mes;
  dashboardYear.value = ano;
  
  atualizarDashboard();
}

/**
 * Volta para o mês anterior no dashboard
 */
function prevDashboardMonth() {
  const dashboardMonth = document.getElementById('dashboardMonth');
  const dashboardYear = document.getElementById('dashboardYear');
  
  let mes = parseInt(dashboardMonth.value);
  let ano = parseInt(dashboardYear.value);
  
  mes--;
  
  if (mes < 0) {
    mes = 11;
    ano--;
  }
  
  dashboardMonth.value = mes;
  dashboardYear.value = ano;
  
  atualizarDashboard();
}

/**
 * Carrega o relatório mensal
 */
function loadRelatorioMensal() {
  const relatorioContainer = document.getElementById('relatorioMensalContainer');
  if (!relatorioContainer) return;
  
  // Definir período padrão se não estiver definido
  if (!rangeStart || !rangeEnd) {
    const hoje = new Date();
    rangeStart = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    rangeEnd = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    // Atualizar campo de data
    $('#dataRange').val(
      rangeStart.toLocaleDateString('pt-BR') + ' - ' + 
      rangeEnd.toLocaleDateString('pt-BR')
    );
  }
  
  // Obter despesas no período
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPeriodo = [];
    let totalPeriodo = 0;
    let despesasPorCategoria = {};
    
    snapshot.forEach(child => {
      let despesa = child.val();
      
      // Função para processar uma despesa
      const processarDespesa = (id, descricao, valor, data, categoria, pago) => {
        const dataVencimento = new Date(data);
        
        if (dataVencimento >= rangeStart && dataVencimento <= rangeEnd) {
          despesasPeriodo.push({
            id,
            descricao,
            valor: parseFloat(valor) || 0,
            data: dataVencimento,
            categoria,
            pago
          });
          
          totalPeriodo += parseFloat(valor) || 0;
          
          // Adicionar à categoria
          if (!despesasPorCategoria[categoria]) {
            despesasPorCategoria[categoria] = 0;
          }
          
          despesasPorCategoria[categoria] += parseFloat(valor) || 0;
        }
      };
      
      // Processar despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        processarDespesa(
          child.key,
          despesa.descricao,
          despesa.valor,
          despesa.dataCompra,
          despesa.categoria,
          despesa.pago
        );
      } 
      // Processar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (parcela.vencimento) {
            processarDespesa(
              `${child.key}|${index}`,
              `${despesa.descricao} - Parcela ${index + 1}`,
              parcela.valor,
              parcela.vencimento,
              despesa.categoria,
              parcela.pago
            );
          }
        });
      }
    });
    
    // Ordenar por data
    despesasPeriodo.sort((a, b) => a.data - b.data);
    
    // Gerar HTML
    let html = `
      <div class="mb-3">
        <h3>Resumo do Período</h3>
        <p>Total de despesas: <strong>R$ ${totalPeriodo.toFixed(2)}</strong></p>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Categoria</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    despesasPeriodo.forEach(despesa => {
      const dataFormatada = despesa.data.toLocaleDateString('pt-BR');
      const nomeCategoria = window.novo_categoriasMap[despesa.categoria] || 'Categoria';
      const statusClass = despesa.pago ? 'text-success' : 'text-danger';
      const statusText = despesa.pago ? 'Pago' : 'Pendente';
      
      html += `
        <tr>
          <td>${despesa.descricao}</td>
          <td>R$ ${despesa.valor.toFixed(2)}</td>
          <td>${dataFormatada}</td>
          <td>${nomeCategoria}</td>
          <td class="${statusClass}">${statusText}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    relatorioContainer.innerHTML = html;
    
    // Atualizar gráfico de categorias
    if (window.graficoCategoriasPie) {
      const categorias = [];
      const valores = [];
      
      Object.entries(despesasPorCategoria).forEach(([categoriaId, valor]) => {
        const nomeCategoria = window.novo_categoriasMap[categoriaId] || 'Categoria';
        categorias.push(nomeCategoria);
        valores.push(valor);
      });
      
      window.graficoCategoriasPie.updateOptions({
        labels: categorias
      });
      
      window.graficoCategoriasPie.updateSeries(valores);
    }
  });
}

/**
 * Carrega as categorias
 */
function loadCategorias() {
  const categoriasLista = document.getElementById('categoriasLista');
  const categoriasListaPrincipal = document.getElementById('categoriasListaPrincipal');
  
  // Função para gerar HTML da lista de categorias
  const gerarListaCategorias = (container) => {
    if (!container) return;
    
    db.ref("categorias").once("value").then(snapshot => {
      let html = '<div class="table-container"><table><thead><tr>' +
                '<th>Nome</th><th>Ações</th>' +
                '</tr></thead><tbody>';
      
      snapshot.forEach(child => {
        const categoria = child.val();
        
        html += `
          <tr>
            <td>${categoria.nome}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="excluirCategoria('${child.key}')">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
      
      container.innerHTML = html;
    });
  };
  
  // Carregar para ambos os containers se existirem
  if (categoriasLista) gerarListaCategorias(categoriasLista);
  if (categoriasListaPrincipal) gerarListaCategorias(categoriasListaPrincipal);
}

/**
 * Salva uma nova categoria
 */
function salvarCategoria() {
  const categoriaNome = document.getElementById('categoriaNome').value.trim();
  
  if (!categoriaNome) {
    exibirToast('Digite o nome da categoria.', 'warning');
    return;
  }
  
  const novaCategoria = {
    nome: categoriaNome
  };
  
  db.ref("categorias").push(novaCategoria).then(() => {
    exibirToast('Categoria salva com sucesso!', 'success');
    document.getElementById('categoriaNome').value = '';
    loadCategorias();
    
    // Atualizar mapa de categorias
    db.ref("categorias").once("value").then(snapshot => {
      window.novo_categoriasMap = {};
      snapshot.forEach(child => {
        window.novo_categoriasMap[child.key] = child.val().nome;
      });
    });
  }).catch(error => {
    console.error("Erro ao salvar categoria:", error);
    exibirToast('Erro ao salvar categoria. Tente novamente.', 'danger');
  });
}

/**
 * Exclui uma categoria
 */
function excluirCategoria(categoriaId) {
  if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
  
  db.ref(`categorias/${categoriaId}`).remove().then(() => {
    exibirToast('Categoria excluída com sucesso!', 'success');
    loadCategorias();
    
    // Atualizar mapa de categorias
    db.ref("categorias").once("value").then(snapshot => {
      window.novo_categoriasMap = {};
      snapshot.forEach(child => {
        window.novo_categoriasMap[child.key] = child.val().nome;
      });
    });
  }).catch(error => {
    console.error("Erro ao excluir categoria:", error);
    exibirToast('Erro ao excluir categoria. Tente novamente.', 'danger');
  });
}

/**
 * Carrega os cartões
 */
function loadCartoes() {
  const cartoesLista = document.getElementById('cartoesLista');
  const cartoesListaPrincipal = document.getElementById('cartoesListaPrincipal');
  const cartaoDespesa = document.getElementById('cartaoDespesa');
  
  // Função para gerar HTML da lista de cartões
  const gerarListaCartoes = (container) => {
    if (!container) return;
    
    db.ref("cartoes").once("value").then(snapshot => {
      let html = '<div class="table-container"><table><thead><tr>' +
                '<th>Nome</th><th>Dia da Fatura</th><th>Dia do Fechamento</th><th>Limite</th><th>Ações</th>' +
                '</tr></thead><tbody>';
      
      snapshot.forEach(child => {
        const cartao = child.val();
        
        html += `
          <tr>
            <td>${cartao.nome}</td>
            <td>${cartao.diaFatura}</td>
            <td>${cartao.diaFechamento}</td>
            <td>R$ ${parseFloat(cartao.limite).toFixed(2)}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="excluirCartao('${child.key}')">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div>';
      
      container.innerHTML = html;
    });
  };
  
  // Carregar para ambos os containers se existirem
  if (cartoesLista) gerarListaCartoes(cartoesLista);
  if (cartoesListaPrincipal) gerarListaCartoes(cartoesListaPrincipal);
  
  // Preencher select de cartões no formulário de despesas
  if (cartaoDespesa) {
    cartaoDespesa.innerHTML = '<option value="">Selecione o Cartão</option>';
    
    db.ref("cartoes").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const cartao = child.val();
        const option = document.createElement('option');
        option.value = child.key;
        option.text = cartao.nome;
        cartaoDespesa.appendChild(option);
      });
    });
  }
}

/**
 * Salva um novo cartão
 */
function salvarCartao() {
  const nomeCartao = document.getElementById('nomeCartao').value.trim();
  const diaFatura = document.getElementById('diaFatura').value;
  const diaFechamento = document.getElementById('diaFechamento').value;
  const limiteCartao = document.getElementById('limiteCartao').value;
  
  if (!nomeCartao) {
    exibirToast('Digite o nome do cartão.', 'warning');
    return;
  }
  
  if (!diaFatura || isNaN(diaFatura) || diaFatura < 1 || diaFatura > 31) {
    exibirToast('Digite um dia de fatura válido (1-31).', 'warning');
    return;
  }
  
  if (!diaFechamento || isNaN(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
    exibirToast('Digite um dia de fechamento válido (1-31).', 'warning');
    return;
  }
  
  if (!limiteCartao || isNaN(limiteCartao) || limiteCartao <= 0) {
    exibirToast('Digite um limite válido.', 'warning');
    return;
  }
  
  const novoCartao = {
    nome: nomeCartao,
    diaFatura: parseInt(diaFatura),
    diaFechamento: parseInt(diaFechamento),
    limite: parseFloat(limiteCartao)
  };
  
  db.ref("cartoes").push(novoCartao).then(() => {
    exibirToast('Cartão salvo com sucesso!', 'success');
    document.getElementById('nomeCartao').value = '';
    document.getElementById('diaFatura').value = '';
    document.getElementById('diaFechamento').value = '';
    document.getElementById('limiteCartao').value = '';
    loadCartoes();
  }).catch(error => {
    console.error("Erro ao salvar cartão:", error);
    exibirToast('Erro ao salvar cartão. Tente novamente.', 'danger');
  });
}

/**
 * Exclui um cartão
 */
function excluirCartao(cartaoId) {
  if (!confirm('Tem certeza que deseja excluir este cartão?')) return;
  
  db.ref(`cartoes/${cartaoId}`).remove().then(() => {
    exibirToast('Cartão excluído com sucesso!', 'success');
    loadCartoes();
  }).catch(error => {
    console.error("Erro ao excluir cartão:", error);
    exibirToast('Erro ao excluir cartão. Tente novamente.', 'danger');
  });
}

/**
 * Alterna a visibilidade do formulário de parcelamento
 */
function toggleParcelamento() {
  const formaPagamento = document.getElementById('formaPagamento').value;
  const parcelamentoDiv = document.getElementById('parcelamentoDiv');
  
  if (formaPagamento === 'cartao') {
    parcelamentoDiv.style.display = 'block';
  } else {
    parcelamentoDiv.style.display = 'none';
  }
}

/**
 * Salva uma nova despesa
 */
function salvarDespesa() {
  const descricao = document.getElementById('despesaDescricao').value.trim();
  const valor = document.getElementById('despesaValor').value;
  const dataCompra = document.getElementById('dataCompra').value;
  const categoria = document.getElementById('categoriaDespesa').value;
  const formaPagamento = document.getElementById('formaPagamento').value;
  
  // Validações básicas
  if (!descricao) {
    exibirToast('Digite a descrição da despesa.', 'warning');
    return;
  }
  
  if (!valor || isNaN(valor) || valor <= 0) {
    exibirToast('Digite um valor válido.', 'warning');
    return;
  }
  
  if (!dataCompra) {
    exibirToast('Selecione a data da compra.', 'warning');
    return;
  }
  
  if (!categoria) {
    exibirToast('Selecione uma categoria.', 'warning');
    return;
  }
  
  // Objeto base da despesa
  const novaDespesa = {
    descricao,
    valor: parseFloat(valor),
    dataCompra,
    categoria,
    formaPagamento,
    pago: false
  };
  
  // Verificar se é parcelado
  if (formaPagamento === 'cartao') {
    const cartaoDespesa = document.getElementById('cartaoDespesa').value;
    const numParcelas = document.getElementById('numParcelasDespesa').value;
    
    if (!cartaoDespesa) {
      exibirToast('Selecione um cartão.', 'warning');
      return;
    }
    
    if (!numParcelas || isNaN(numParcelas) || numParcelas < 1) {
      exibirToast('Digite um número de parcelas válido.', 'warning');
      return;
    }
    
    novaDespesa.cartao = cartaoDespesa;
    
    // Obter informações do cartão para calcular vencimentos
    db.ref(`cartoes/${cartaoDespesa}`).once("value").then(snapshot => {
      const cartao = snapshot.val();
      
      if (!cartao) {
        exibirToast('Cartão não encontrado.', 'danger');
        return;
      }
      
      // Calcular parcelas
      const valorParcela = parseFloat(valor) / parseInt(numParcelas);
      const parcelas = [];
      
      // Data da compra
      const dataCompraObj = new Date(dataCompra);
      
      // Calcular vencimentos
      for (let i = 0; i < parseInt(numParcelas); i++) {
        // Calcular mês de vencimento
        let mesVencimento = dataCompraObj.getMonth() + i + 1; // +1 porque a primeira parcela vence no mês seguinte
        let anoVencimento = dataCompraObj.getFullYear();
        
        // Ajustar ano se necessário
        while (mesVencimento > 11) {
          mesVencimento -= 12;
          anoVencimento++;
        }
        
        // Criar data de vencimento
        const dataVencimento = new Date(anoVencimento, mesVencimento, cartao.diaFatura);
        
        parcelas.push({
          valor: valorParcela,
          vencimento: dataVencimento.toISOString().split('T')[0],
          pago: false
        });
      }
      
      novaDespesa.parcelas = parcelas;
      
      // Salvar despesa
      db.ref("despesas").push(novaDespesa).then(() => {
        exibirToast('Despesa salva com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('despesaDescricao').value = '';
        document.getElementById('despesaValor').value = '';
        document.getElementById('dataCompra').value = '';
        document.getElementById('categoriaDespesa').value = '';
        document.getElementById('formaPagamento').value = 'avista';
        document.getElementById('cartaoDespesa').value = '';
        document.getElementById('numParcelasDespesa').value = '';
        
        toggleParcelamento();
        fecharModal('cadastroDespesaModal');
        atualizarDashboard();
      }).catch(error => {
        console.error("Erro ao salvar despesa:", error);
        exibirToast('Erro ao salvar despesa. Tente novamente.', 'danger');
      });
    });
  } else {
    // Despesa à vista
    db.ref("despesas").push(novaDespesa).then(() => {
      exibirToast('Despesa salva com sucesso!', 'success');
      
      // Limpar formulário
      document.getElementById('despesaDescricao').value = '';
      document.getElementById('despesaValor').value = '';
      document.getElementById('dataCompra').value = '';
      document.getElementById('categoriaDespesa').value = '';
      
      fecharModal('cadastroDespesaModal');
      atualizarDashboard();
    }).catch(error => {
      console.error("Erro ao salvar despesa:", error);
      exibirToast('Erro ao salvar despesa. Tente novamente.', 'danger');
    });
  }
}

/**
 * Carrega as rendas cadastradas
 */
function loadRendas() {
  const usuariosListaPrincipal = document.getElementById('usuariosListaPrincipal');
  if (!usuariosListaPrincipal) return;
  
  db.ref("pessoas").once("value").then(snapshot => {
    let html = '<div class="table-container"><table><thead><tr>' +
              '<th>Nome</th><th>Parentesco</th><th>Saldo Inicial</th><th>Salário</th><th>Ações</th>' +
              '</tr></thead><tbody>';
    
    snapshot.forEach(child => {
      const pessoa = child.val();
      
      html += `
        <tr>
          <td>${pessoa.nome}</td>
          <td>${pessoa.parentesco}</td>
          <td>R$ ${parseFloat(pessoa.saldoInicial).toFixed(2)}</td>
          <td>R$ ${pessoa.salarioLiquido ? parseFloat(pessoa.salarioLiquido).toFixed(2) : '0.00'}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="excluirRenda('${child.key}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    
    usuariosListaPrincipal.innerHTML = html;
  });
}

/**
 * Exclui uma renda
 */
function excluirRenda(rendaId) {
  if (!confirm('Tem certeza que deseja excluir esta renda?')) return;
  
  db.ref(`pessoas/${rendaId}`).remove().then(() => {
    exibirToast('Renda excluída com sucesso!', 'success');
    loadRendas();
    atualizarDashboard();
  }).catch(error => {
    console.error("Erro ao excluir renda:", error);
    exibirToast('Erro ao excluir renda. Tente novamente.', 'danger');
  });
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
