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

// Importar módulos de autenticação do Firebase
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

// Mapa global de categorias
window.novo_categoriasMap = {};

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
  // Monitorar estado de autenticação
  onAuthStateChanged(auth, user => {
    if (user) {
      // Usuário logado: iniciar sistema
      inicializarSistema();
    } else {
      // Usuário deslogado: redirecionar para tela de login
      // Comentado por enquanto para não interromper o desenvolvimento
      // window.location.href = 'login.html';
      inicializarSistema(); // Remover esta linha quando o login estiver implementado
    }
  });
});

/**
 * Inicializa o sistema após autenticação
 */
function inicializarSistema() {
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
  
  // Restaurar inicialização de componentes que foi removida
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
  
  // Adicionar listeners que foram removidos
  document.getElementById("dashboardMonth").addEventListener("change", carregarPainelDespesasMes);
  document.getElementById("dashboardYear").addEventListener("change", carregarPainelDespesasMes);
  
  // Adicionar listeners para filtros de despesas
  const btnFiltrarDespesas = document.querySelector('#despesasSection button.btn-primary[onclick="filtrarTodasDespesas()"]');
  if (btnFiltrarDespesas) {
    btnFiltrarDespesas.addEventListener('click', filtrarDespesas);
  }
  
  const mesFiltro = document.getElementById('mesFiltro');
  const anoFiltro = document.getElementById('anoFiltro');
  const filtroDescricao = document.getElementById('filtroDescricao');
  
  if (mesFiltro) mesFiltro.addEventListener('input', filtrarDespesas);
  if (anoFiltro) anoFiltro.addEventListener('input', filtrarDespesas);
  if (filtroDescricao) filtroDescricao.addEventListener('input', filtrarDespesas);
}

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
    // Chamar novo_calcularPrevisoes ao entrar na seção de previsões
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
      
      // Função para processar uma despesa e adicionar ao total da categoria
      const processarDespesa = (valor, data, categoria) => {
        const dataVencimento = new Date(data);
        
        // Verificar se é do mês selecionado
        if (dataVencimento.getMonth() === dashboardMonth && dataVencimento.getFullYear() === dashboardYear) {
          // Inicializar categoria se não existir
          if (!despesasPorCategoria[categoria]) {
            despesasPorCategoria[categoria] = 0;
          }
          
          // Adicionar valor ao total da categoria
          despesasPorCategoria[categoria] += parseFloat(valor);
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
    
    // Preparar dados para o gráfico
    const categorias = [];
    const valores = [];
    
    // Obter nomes das categorias
    db.ref("categorias").once("value").then(snapshotCategorias => {
      const categoriasMap = {};
      
      snapshotCategorias.forEach(child => {
        categoriasMap[child.key] = child.val().nome;
      });
      
      // Processar dados para o gráfico
      Object.entries(despesasPorCategoria).forEach(([categoriaId, valor]) => {
        const nomeCategoria = categoriasMap[categoriaId] || 'Sem categoria';
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
    });
  });
}

/**
 * Atualiza o contador de próximos vencimentos
 */
function updateProximosVencimentos() {
  const hoje = new Date();
  let proximoVencimento = null;
  
  db.ref("despesas").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Verificar despesas à vista não pagas
      if (despesa.formaPagamento === "avista" && !despesa.pago && despesa.dataCompra) {
        const dataVencimento = new Date(despesa.dataCompra);
        
        if (dataVencimento >= hoje && (!proximoVencimento || dataVencimento < proximoVencimento)) {
          proximoVencimento = dataVencimento;
        }
      } 
      // Verificar parcelas de cartão não pagas
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach(parcela => {
          if (!parcela.pago && parcela.vencimento) {
            const dataVencimento = new Date(parcela.vencimento);
            
            if (dataVencimento >= hoje && (!proximoVencimento || dataVencimento < proximoVencimento)) {
              proximoVencimento = dataVencimento;
            }
          }
        });
      }
    });
    
    // Atualizar contador
    if (proximoVencimento) {
      const diffDias = Math.ceil((proximoVencimento - hoje) / (1000 * 60 * 60 * 24));
      document.getElementById("proximosVencimentos").innerText = diffDias;
    } else {
      document.getElementById("proximosVencimentos").innerText = "0";
    }
  });
}

/**
 * Carrega todas as despesas na seção de despesas
 */
function carregarTodasDespesas() {
  const todasDespesasBody = document.getElementById('todasDespesasBody');
  if (!todasDespesasBody) return;
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesas = [];
    
    snapshot.forEach(child => {
      const despesa = child.val();
      despesa.id = child.key;
      despesas.push(despesa);
    });
    
    // Ordenar por data (mais recentes primeiro)
    despesas.sort((a, b) => {
      const dataA = new Date(a.dataCompra || '2000-01-01');
      const dataB = new Date(b.dataCompra || '2000-01-01');
      return dataB - dataA;
    });
    
    // Gerar HTML
    let html = '';
    
    despesas.forEach(despesa => {
      const dataFormatada = despesa.dataCompra ? new Date(despesa.dataCompra).toLocaleDateString('pt-BR') : '-';
      const categoria = window.novo_categoriasMap[despesa.categoria] || 'Sem categoria';
      const status = despesa.pago ? 'Pago' : 'Pendente';
      const statusClass = despesa.pago ? 'text-success' : 'text-warning';
      
      html += `
        <tr>
          <td>${despesa.descricao}</td>
          <td>R$ ${parseFloat(despesa.valor).toFixed(2)}</td>
          <td>${dataFormatada}</td>
          <td>${categoria}</td>
          <td class="${statusClass}">${status}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="editarDespesa('${despesa.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirDespesa('${despesa.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    todasDespesasBody.innerHTML = html;
  });
}

/**
 * Filtra despesas com base nos critérios informados
 */
function filtrarDespesas() {
  const mesFiltro = document.getElementById('mesFiltro')?.value.toUpperCase() || '';
  const anoFiltro = document.getElementById('anoFiltro')?.value || '';
  const descricaoFiltro = document.getElementById('despesaSearch')?.value.toLowerCase() || '';
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasNaoPagas = [];
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Verificar despesas à vista não pagas
      if (despesa.formaPagamento === "avista" && !despesa.pago) {
        const dataCompra = new Date(despesa.dataCompra);
        const mesStr = obterNomeMes(dataCompra.getMonth()).substring(0, 3).toUpperCase();
        const anoStr = dataCompra.getFullYear().toString();
        
        // Aplicar filtros
        if ((mesFiltro === '' || mesStr.includes(mesFiltro)) &&
            (anoFiltro === '' || anoStr.includes(anoFiltro)) &&
            (descricaoFiltro === '' || despesa.descricao.toLowerCase().includes(descricaoFiltro))) {
          
          despesasNaoPagas.push({
            id: child.key,
            descricao: despesa.descricao,
            valor: parseFloat(despesa.valor) || 0,
            data: dataCompra,
            categoria: despesa.categoria
          });
        }
      } 
      // Verificar parcelas de cartão não pagas
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            const dataVencimento = new Date(parcela.vencimento);
            const mesStr = obterNomeMes(dataVencimento.getMonth()).substring(0, 3).toUpperCase();
            const anoStr = dataVencimento.getFullYear().toString();
            
            // Aplicar filtros
            if ((mesFiltro === '' || mesStr.includes(mesFiltro)) &&
                (anoFiltro === '' || anoStr.includes(anoFiltro)) &&
                (descricaoFiltro === '' || despesa.descricao.toLowerCase().includes(descricaoFiltro))) {
              
              despesasNaoPagas.push({
                id: `${child.key}|${index}`,
                descricao: `${despesa.descricao} - Parcela ${index + 1}`,
                valor: parseFloat(parcela.valor) || 0,
                data: dataVencimento,
                categoria: despesa.categoria
              });
            }
          }
        });
      }
    });
    
    // Ordenar por data
    despesasNaoPagas.sort((a, b) => a.data - b.data);
    
    // Atualizar select de despesas não pagas
    const despesaSelect = document.getElementById('despesaSelect');
    if (despesaSelect) {
      despesaSelect.innerHTML = '<option value="">Selecione a Despesa</option>';
      
      despesasNaoPagas.forEach(despesa => {
        const dataFormatada = despesa.data.toLocaleDateString('pt-BR');
        const option = document.createElement('option');
        option.value = despesa.id;
        option.text = `${despesa.descricao} - R$ ${despesa.valor.toFixed(2)} (${dataFormatada})`;
        despesaSelect.appendChild(option);
      });
    }
  });
}

/**
 * Carrega as categorias para o filtro de despesas
 */
function loadCategoriasFiltro() {
  const categoriaFiltro = document.getElementById('categoriaFiltro');
  if (!categoriaFiltro) return;
  
  db.ref("categorias").once("value").then(snapshot => {
    categoriaFiltro.innerHTML = '<option value="">Todas as Categorias</option>';
    
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement('option');
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
  const categoriaDespesa = document.getElementById('categoriaDespesa');
  if (!categoriaDespesa) return;
  
  db.ref("categorias").once("value").then(snapshot => {
    categoriaDespesa.innerHTML = '<option value="">Selecione a Categoria</option>';
    
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement('option');
      option.value = child.key;
      option.text = categoria.nome;
      categoriaDespesa.appendChild(option);
    });
  });
}

/**
 * Atualiza o select de cartões
 */
function updateCartaoSelect() {
  const cartaoDespesa = document.getElementById('cartaoDespesa');
  if (!cartaoDespesa) return;
  
  db.ref("cartoes").once("value").then(snapshot => {
    cartaoDespesa.innerHTML = '<option value="">Selecione o Cartão</option>';
    
    snapshot.forEach(child => {
      const cartao = child.val();
      const option = document.createElement('option');
      option.value = child.key;
      option.text = cartao.nome;
      cartaoDespesa.appendChild(option);
    });
  });
}

/**
 * Carrega as despesas não pagas para o select
 */
function loadDespesasNaoPagasSelect() {
  const despesaSelect = document.getElementById('despesaSelect');
  if (!despesaSelect) return;
  
  db.ref("despesas").once("value").then(snapshot => {
    let despesasNaoPagas = [];
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Verificar despesas à vista não pagas
      if (despesa.formaPagamento === "avista" && !despesa.pago) {
        despesasNaoPagas.push({
          id: child.key,
          descricao: despesa.descricao,
          valor: parseFloat(despesa.valor) || 0,
          data: new Date(despesa.dataCompra)
        });
      } 
      // Verificar parcelas de cartão não pagas
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (!parcela.pago) {
            despesasNaoPagas.push({
              id: `${child.key}|${index}`,
              descricao: `${despesa.descricao} - Parcela ${index + 1}`,
              valor: parseFloat(parcela.valor) || 0,
              data: new Date(parcela.vencimento)
            });
          }
        });
      }
    });
    
    // Ordenar por data
    despesasNaoPagas.sort((a, b) => a.data - b.data);
    
    // Atualizar select
    despesaSelect.innerHTML = '<option value="">Selecione a Despesa</option>';
    
    despesasNaoPagas.forEach(despesa => {
      const dataFormatada = despesa.data.toLocaleDateString('pt-BR');
      const option = document.createElement('option');
      option.value = despesa.id;
      option.text = `${despesa.descricao} - R$ ${despesa.valor.toFixed(2)} (${dataFormatada})`;
      despesaSelect.appendChild(option);
    });
  });
}

/**
 * Carrega as categorias
 */
function loadCategorias() {
  const categoriasLista = document.getElementById('categoriasListaPrincipal');
  if (!categoriasLista) return;
  
  db.ref("categorias").once("value").then(snapshot => {
    let html = '<div class="table-container"><table><thead><tr>' +
               '<th>Nome</th><th>Descrição</th><th>Ações</th>' +
               '</tr></thead><tbody>';
    
    snapshot.forEach(child => {
      const categoria = child.val();
      
      html += `
        <tr>
          <td>${categoria.nome}</td>
          <td>${categoria.descricao || '-'}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="editarCategoria('${child.key}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirCategoria('${child.key}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    categoriasLista.innerHTML = html;
  });
}

/**
 * Carrega os cartões
 */
function loadCartoes() {
  const cartoesLista = document.getElementById('cartoesListaPrincipal');
  if (!cartoesLista) return;
  
  db.ref("cartoes").once("value").then(snapshot => {
    let html = '<div class="table-container"><table><thead><tr>' +
               '<th>Nome</th><th>Limite</th><th>Dia de Fechamento</th><th>Dia de Vencimento</th><th>Ações</th>' +
               '</tr></thead><tbody>';
    
    snapshot.forEach(child => {
      const cartao = child.val();
      
      html += `
        <tr>
          <td>${cartao.nome}</td>
          <td>R$ ${parseFloat(cartao.limite).toFixed(2)}</td>
          <td>${cartao.diaFechamento}</td>
          <td>${cartao.diaVencimento}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="editarCartao('${child.key}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirCartao('${child.key}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    cartoesLista.innerHTML = html;
  });
}

/**
 * Carrega as rendas
 */
function loadRendas() {
  const rendasLista = document.getElementById('usuariosListaPrincipal');
  if (!rendasLista) return;
  
  db.ref("pessoas").once("value").then(snapshot => {
    let html = '<div class="table-container"><table><thead><tr>' +
               '<th>Nome</th><th>Salário Líquido</th><th>Saldo Inicial</th><th>Ações</th>' +
               '</tr></thead><tbody>';
    
    snapshot.forEach(child => {
      const pessoa = child.val();
      
      html += `
        <tr>
          <td>${pessoa.nome}</td>
          <td>R$ ${parseFloat(pessoa.salarioLiquido || 0).toFixed(2)}</td>
          <td>R$ ${parseFloat(pessoa.saldoInicial || 0).toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="editarPessoa('${child.key}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirPessoa('${child.key}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    rendasLista.innerHTML = html;
  });
}

/**
 * Atualiza o título das despesas do mês
 */
function updateDespesasMesTitle() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  
  document.getElementById("despesasMesTitle").innerText = 
    obterNomeMes(dashboardMonth) + ' de ' + dashboardYear;
}

/**
 * Carrega o painel de despesas do mês
 */
function carregarPainelDespesasMes() {
  const dashboardMonth = parseInt(document.getElementById("dashboardMonth").value);
  const dashboardYear = parseInt(document.getElementById("dashboardYear").value);
  
  updateDespesasMesTitle();
  atualizarListaDespesasMes(dashboardMonth, dashboardYear);
}

/**
 * Alterna para o mês anterior no dashboard
 */
function prevDashboardMonth() {
  const dashboardMonth = document.getElementById("dashboardMonth");
  const dashboardYear = document.getElementById("dashboardYear");
  
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
 * Alterna para o próximo mês no dashboard
 */
function nextDashboardMonth() {
  const dashboardMonth = document.getElementById("dashboardMonth");
  const dashboardYear = document.getElementById("dashboardYear");
  
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
 * Renderiza o calendário de despesas
 */
function renderCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  if (!calendarGrid) return;
  
  const selectMonth = document.getElementById('selectMonth');
  const selectYear = document.getElementById('selectYear');
  
  if (!selectMonth || !selectYear) return;
  
  const mes = parseInt(selectMonth.value);
  const ano = parseInt(selectYear.value);
  
  // Obter o primeiro dia do mês
  const primeiroDia = new Date(ano, mes, 1);
  // Obter o último dia do mês
  const ultimoDia = new Date(ano, mes + 1, 0);
  
  // Obter o dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
  const primeiroDiaSemana = primeiroDia.getDay();
  
  // Criar tabela do calendário
  let html = '<table class="calendar-table">';
  html += '<thead><tr>';
  html += '<th class="calendar-day-header">Dom</th>';
  html += '<th class="calendar-day-header">Seg</th>';
  html += '<th class="calendar-day-header">Ter</th>';
  html += '<th class="calendar-day-header">Qua</th>';
  html += '<th class="calendar-day-header">Qui</th>';
  html += '<th class="calendar-day-header">Sex</th>';
  html += '<th class="calendar-day-header">Sáb</th>';
  html += '</tr></thead>';
  html += '<tbody>';
  
  // Obter despesas do mês
  db.ref("despesas").once("value").then(snapshot => {
    let despesasPorDia = {};
    
    snapshot.forEach(child => {
      const despesa = child.val();
      
      // Função para processar uma despesa e adicionar ao dia
      const processarDespesa = (descricao, valor, data, pago) => {
        const dataVencimento = new Date(data);
        
        // Verificar se é do mês e ano selecionados
        if (dataVencimento.getMonth() === mes && dataVencimento.getFullYear() === ano) {
          const dia = dataVencimento.getDate();
          
          // Inicializar array para o dia se não existir
          if (!despesasPorDia[dia]) {
            despesasPorDia[dia] = [];
          }
          
          // Adicionar despesa ao dia
          despesasPorDia[dia].push({
            descricao,
            valor,
            pago
          });
        }
      };
      
      // Verificar despesas à vista
      if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
        processarDespesa(despesa.descricao, despesa.valor, despesa.dataCompra, despesa.pago);
      } 
      // Verificar parcelas de cartão
      else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
        despesa.parcelas.forEach((parcela, index) => {
          if (parcela.vencimento) {
            processarDespesa(
              `${despesa.descricao} - Parcela ${index + 1}`,
              parcela.valor,
              parcela.vencimento,
              parcela.pago
            );
          }
        });
      }
    });
    
    // Criar linhas do calendário
    let dia = 1;
    let totalDias = ultimoDia.getDate();
    
    // Criar 6 linhas (máximo possível para um mês)
    for (let i = 0; i < 6; i++) {
      html += '<tr>';
      
      // Criar 7 colunas (dias da semana)
      for (let j = 0; j < 7; j++) {
        // Verificar se estamos em um dia válido do mês
        if ((i === 0 && j < primeiroDiaSemana) || dia > totalDias) {
          html += '<td class="calendar-cell"></td>';
        } else {
          // Verificar se há despesas para este dia
          const despesasDoDia = despesasPorDia[dia] || [];
          const totalDespesas = despesasDoDia.length;
          const totalValor = despesasDoDia.reduce((total, d) => total + parseFloat(d.valor), 0);
          
          // Verificar se há despesas não pagas
          const temDespesasNaoPagas = despesasDoDia.some(d => !d.pago);
          
          // Definir classe para destacar dias com despesas
          let classeDestaque = '';
          if (totalDespesas > 0) {
            classeDestaque = temDespesasNaoPagas ? 'calendar-day-with-unpaid' : 'calendar-day-with-paid';
          }
          
          html += `<td class="calendar-cell ${classeDestaque}">`;
          html += `<div class="calendar-day">${dia}</div>`;
          
          if (totalDespesas > 0) {
            html += `<div class="calendar-day-info">`;
            html += `<span class="calendar-day-count">${totalDespesas} despesa(s)</span>`;
            html += `<span class="calendar-day-total">R$ ${totalValor.toFixed(2)}</span>`;
            html += `</div>`;
          }
          
          html += '</td>';
          dia++;
        }
      }
      
      html += '</tr>';
      
      // Se já passamos do último dia, não precisamos de mais linhas
      if (dia > totalDias) break;
    }
    
    html += '</tbody></table>';
    calendarGrid.innerHTML = html;
  });
}

/**
 * Exibe uma notificação toast
 */
function exibirToast(mensagem, tipo = 'primary') {
  // Usar apenas Toastify para exibir notificação
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
 * Retorna o nome do mês a partir do índice (0-11)
 */
function obterNomeMes(indice) {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return meses[indice] || '';
}

/**
 * Alterna a visibilidade do div de parcelamento
 */
function toggleParcelamento() {
  const formaPagamento = document.getElementById('formaPagamento').value;
  const parcelamentoDiv = document.getElementById('parcelamentoDiv');
  
  if (formaPagamento === 'cartao') {
    parcelamentoDiv.classList.remove('hidden');
  } else {
    parcelamentoDiv.classList.add('hidden');
  }
}

/**
 * Filtra todas as despesas na seção de despesas
 */
function filtrarTodasDespesas() {
  const filtroDescricao = document.getElementById('filtroDescricao')?.value.toLowerCase() || '';
  
  const todasDespesasBody = document.getElementById('todasDespesasBody');
  if (!todasDespesasBody) return;
  
  // Obter todas as linhas da tabela
  const linhas = todasDespesasBody.querySelectorAll('tr');
  
  // Filtrar linhas
  linhas.forEach(linha => {
    const descricao = linha.querySelector('td:first-child').textContent.toLowerCase();
    
    if (filtroDescricao === '' || descricao.includes(filtroDescricao)) {
      linha.style.display = '';
    } else {
      linha.style.display = 'none';
    }
  });
}
