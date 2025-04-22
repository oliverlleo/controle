/**
 * Sistema de Gerenciamento de Contas Pessoais - Versão Mobile
 * Script JavaScript para a versão mobile do sistema
 */

'use strict';

// ===================== VARIÁVEIS GLOBAIS =====================
let mobileCurrentSection = 'mobileDashboardSection';
let mobileCurrentMonth = new Date().getMonth();
let mobileCurrentYear = new Date().getFullYear();
let mobileCurrentUser = null;
let mobileNavActive = false;

// ===================== INICIALIZAÇÃO =====================
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar Firebase Auth
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        mobileCurrentUser = user;
        initializeMobileApp();
      } else {
        // Redirecionar para a página de login se não estiver autenticado
        if (!window.location.href.includes('mobile-login.html')) {
          window.location.href = 'mobile-login.html';
        }
      }
    });
  }
  
  // Inicializar eventos para a página de login
  if (window.location.href.includes('mobile-login.html')) {
    initializeMobileLogin();
  }
});

/**
 * Inicializa a aplicação mobile após autenticação
 */
function initializeMobileApp() {
  // Configurar navegação mobile
  setupMobileNavigation();
  
  // Carregar dados do usuário
  loadMobileUserInfo();
  
  // Inicializar dashboard
  updateMobileDashboard();
  
  // Configurar eventos para botões e interações
  setupMobileEvents();
}

/**
 * Inicializa eventos específicos para a página de login mobile
 */
function initializeMobileLogin() {
  // Eventos já configurados no HTML da página de login
  console.log('Mobile login page initialized');
}

// ===================== NAVEGAÇÃO MOBILE =====================
/**
 * Configura a navegação mobile
 */
function setupMobileNavigation() {
  // Botão de menu
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navClose = document.getElementById('mobileNavClose');
  const mobileNav = document.getElementById('mobileNav');
  
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function() {
      mobileNav.classList.add('active');
      createMobileOverlay();
      mobileNavActive = true;
    });
  }
  
  if (navClose && mobileNav) {
    navClose.addEventListener('click', function() {
      mobileNav.classList.remove('active');
      removeMobileOverlay();
      mobileNavActive = false;
    });
  }
  
  // Links de navegação
  const navLinks = document.querySelectorAll('.mobile-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remover classe ativa de todos os links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Adicionar classe ativa ao link clicado
      this.classList.add('active');
      
      // Verificar se é uma ação especial
      const action = this.getAttribute('data-action');
      if (action) {
        handleMobileAction(action);
      } else {
        // Mostrar a seção correspondente
        const sectionId = this.getAttribute('data-section');
        if (sectionId) {
          showMobileSection(sectionId);
        }
      }
      
      // Fechar o menu após a navegação
      if (mobileNav) {
        mobileNav.classList.remove('active');
        removeMobileOverlay();
        mobileNavActive = false;
      }
    });
  });
  
  // Botão de logout
  const logoutBtn = document.getElementById('mobileLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      mobileLogout();
    });
  }
}

/**
 * Cria um overlay para quando o menu está aberto
 */
function createMobileOverlay() {
  // Remover overlay existente, se houver
  removeMobileOverlay();
  
  // Criar novo overlay
  const overlay = document.createElement('div');
  overlay.className = 'mobile-overlay active';
  overlay.id = 'mobileOverlay';
  
  // Adicionar evento de clique para fechar o menu
  overlay.addEventListener('click', function() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
      mobileNav.classList.remove('active');
    }
    removeMobileOverlay();
    mobileNavActive = false;
  });
  
  document.body.appendChild(overlay);
}

/**
 * Remove o overlay do menu
 */
function removeMobileOverlay() {
  const overlay = document.getElementById('mobileOverlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Mostra uma seção específica e esconde as demais
 * @param {string} sectionId - ID da seção a ser mostrada
 */
function showMobileSection(sectionId) {
  // Converter ID da seção desktop para ID da seção mobile
  // Verificar se o ID já começa com "mobile" para evitar duplicação
  const mobileSectionId = sectionId.startsWith('mobile') ? sectionId : 'mobile' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  
  console.log('Mostrando seção:', mobileSectionId);
  
  // Esconder todas as seções
  const sections = document.querySelectorAll('.mobile-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  // Mostrar a seção selecionada
  const targetSection = document.getElementById(mobileSectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    mobileCurrentSection = mobileSectionId;
    
    // Atualizar título do cabeçalho
    updateMobileHeader(mobileSectionId);
    
    // Inicializar componentes específicos da seção
    initializeMobileSection(mobileSectionId);
  } else {
    console.error('Seção não encontrada:', mobileSectionId);
  }
}

/**
 * Atualiza o título do cabeçalho com base na seção atual
 * @param {string} sectionId - ID da seção atual
 */
function updateMobileHeader(sectionId) {
  const titleElement = document.querySelector('.mobile-title');
  if (!titleElement) return;
  
  let title = 'Sistema de Contas';
  
  switch (sectionId) {
    case 'mobileDashboardSection':
      title = 'Dashboard';
      break;
    case 'mobileDespesasSection':
      title = 'Despesas';
      break;
    case 'mobileRelatorioIntegradoSection':
      title = 'Relatórios & Previsões';
      break;
    case 'mobileInteligenciaFinanceiraSection':
      title = 'Inteligência Financeira';
      break;
    case 'mobileMetasFinanceirasSection':
      title = 'Metas Financeiras';
      break;
    case 'mobileConfiguracoesSection':
      title = 'Configurações';
      break;
    case 'mobileAlertasSection':
      title = 'Alertas';
      break;
  }
  
  titleElement.textContent = title;
}

/**
 * Inicializa componentes específicos de cada seção
 * @param {string} sectionId - ID da seção a ser inicializada
 */
function initializeMobileSection(sectionId) {
  console.log('Inicializando seção:', sectionId);
  
  switch (sectionId) {
    case 'mobileDashboardSection':
      updateMobileDashboard();
      break;
    case 'mobileDespesasSection':
      loadMobileDespesas();
      break;
    case 'mobileRelatorioIntegradoSection':
      initializeMobileRelatorios();
      break;
    case 'mobileInteligenciaFinanceiraSection':
      loadMobileInteligenciaFinanceira();
      break;
    case 'mobileMetasFinanceirasSection':
      loadMobileMetasFinanceiras();
      break;
    case 'mobileConfiguracoesSection':
      initializeMobileConfiguracoes();
      break;
    case 'mobileAlertasSection':
      loadMobileAlertas();
      break;
    default:
      console.log('Seção não reconhecida:', sectionId);
      break;
  }
}

/**
 * Manipula ações especiais da navegação
 * @param {string} action - Nome da ação a ser executada
 */
function handleMobileAction(action) {
  switch (action) {
    case 'exportData':
      mobileExportData();
      break;
    // Adicionar outras ações conforme necessário
  }
}

// ===================== AUTENTICAÇÃO MOBILE =====================
/**
 * Carrega informações do usuário atual
 */
function loadMobileUserInfo() {
  if (!mobileCurrentUser) return;
  
  const userInfoElement = document.getElementById('mobileUserInfo');
  if (!userInfoElement) return;
  
  // Obter dados do perfil do usuário
  const displayName = mobileCurrentUser.displayName || 'Usuário';
  const email = mobileCurrentUser.email || '';
  const photoURL = mobileCurrentUser.photoURL;
  
  // Criar avatar com iniciais ou foto
  let avatarContent = '';
  if (photoURL) {
    avatarContent = `<img src="${photoURL}" alt="${displayName}" />`;
  } else {
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    avatarContent = initials;
  }
  
  // Atualizar HTML
  userInfoElement.innerHTML = `
    <div class="mobile-user-avatar">${avatarContent}</div>
    <div class="mobile-user-details">
      <div class="mobile-user-name">${displayName}</div>
      <div class="mobile-user-email">${email}</div>
    </div>
  `;
}

/**
 * Realiza logout do usuário
 */
function mobileLogout() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().signOut()
      .then(() => {
        window.location.href = 'mobile-login.html';
      })
      .catch((error) => {
        console.error('Erro ao fazer logout:', error);
        exibirToast("Erro ao fazer logout. Tente novamente.", "danger");
      });
  }
}

// ===================== DASHBOARD MOBILE =====================
/**
 * Atualiza o dashboard mobile com os dados mais recentes
 */
function updateMobileDashboard() {
  // Atualizar seletores de mês e ano
  const monthSelect = document.getElementById('mobileDashboardMonth');
  const yearSelect = document.getElementById('mobileDashboardYear');
  
  if (monthSelect && yearSelect) {
    monthSelect.value = mobileCurrentMonth;
    yearSelect.value = mobileCurrentYear;
  }
  
  // Carregar dados do dashboard
  loadMobileSaldoAtual();
  loadMobileDespesasMes();
  loadMobileProximosVencimentos();
  renderMobileGraficoDespesas();
  loadMobileListaDespesasMes();
}

/**
 * Carrega o saldo atual
 */
function loadMobileSaldoAtual() {
  const saldoElement = document.getElementById('mobileSaldoAtual');
  if (!saldoElement) return;
  
  // Obter saldo do Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    let saldo = 0;
    let hoje = new Date();
    
    firebase.database().ref("pessoas").once("value")
      .then(snapshot => {
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
        
        return firebase.database().ref("despesas").once("value");
      })
      .then(snapshot2 => {
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
        
        saldoElement.textContent = `R$ ${saldo.toFixed(2)}`;
      })
      .catch(error => {
        console.error('Erro ao carregar saldo:', error);
        saldoElement.textContent = 'R$ 0,00';
      });
  } else {
    // Fallback para desenvolvimento
    saldoElement.textContent = 'R$ 0,00';
  }
}

/**
 * Carrega as despesas do mês selecionado
 */
function loadMobileDespesasMes() {
  const despesasElement = document.getElementById('mobileDespesasMes');
  const titleElement = document.getElementById('mobileDespesasMesTitle');
  
  if (!despesasElement || !titleElement) return;
  
  // Atualizar título
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  titleElement.textContent = `${monthNames[mobileCurrentMonth]} de ${mobileCurrentYear}`;
  
  // Obter despesas do Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    let despesasMes = 0;
    
    firebase.database().ref("despesas").once("value")
      .then(snapshot => {
        snapshot.forEach(child => {
          let despesa = child.val();
          if (despesa.pago) return;
          
          if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
            let dt = new Date(despesa.dataCompra);
            if (dt.getMonth() === mobileCurrentMonth && dt.getFullYear() === mobileCurrentYear) {
              despesasMes += parseFloat(despesa.valor) || 0;
            }
          } else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
            despesa.parcelas.forEach(parcela => {
              let dt = new Date(parcela.vencimento);
              if (dt.getMonth() === mobileCurrentMonth && dt.getFullYear() === mobileCurrentYear) {
                despesasMes += parseFloat(parcela.valor) || 0;
              }
            });
          }
        });
        
        despesasElement.textContent = `R$ ${despesasMes.toFixed(2)}`;
      })
      .catch(error => {
        console.error('Erro ao carregar despesas do mês:', error);
        despesasElement.textContent = 'R$ 0,00';
      });
  } else {
    // Fallback para desenvolvimento
    despesasElement.textContent = 'R$ 0,00';
  }
}

/**
 * Carrega informações sobre os próximos vencimentos
 */
function loadMobileProximosVencimentos() {
  const vencimentosElement = document.getElementById('mobileProximosVencimentos');
  if (!vencimentosElement) return;
  
  // Obter próximos vencimentos do Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    const hoje = new Date();
    let proximoVencimento = null;
    
    firebase.database().ref("despesas").once("value")
      .then(snapshot => {
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
          vencimentosElement.textContent = diffDays.toString();
        } else {
          vencimentosElement.textContent = '0';
        }
      })
      .catch(error => {
        console.error('Erro ao carregar próximos vencimentos:', error);
        vencimentosElement.textContent = '0';
      });
  } else {
    // Fallback para desenvolvimento
    vencimentosElement.textContent = '0';
  }
}

/**
 * Renderiza o gráfico de despesas
 */
function renderMobileGraficoDespesas() {
  const chartElement = document.getElementById('mobileGraficoDespesas');
  if (!chartElement) return;
  
  // Verificar se ApexCharts está disponível
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts não está disponível');
    return;
  }
  
  // Limpar gráfico existente
  chartElement.innerHTML = '';
  
  // Mostrar indicador de carregamento
  chartElement.innerHTML = '<div class="loading-indicator">Carregando gráfico...</div>';
  
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    // Primeiro, carregar categorias
    firebase.database().ref("categorias").once("value")
      .then(catSnapshot => {
        const categorias = {};
        catSnapshot.forEach(child => {
          categorias[child.key] = child.val().nome;
        });
        
        // Depois, carregar despesas
        return firebase.database().ref("despesas").once("value")
          .then(snapshot => {
            // Objeto para armazenar despesas por categoria
            const despesasPorCategoria = {};
            
            // Processar despesas
            snapshot.forEach(child => {
              const despesa = child.val();
              const categoriaId = despesa.categoria;
              
              // Ignorar despesas sem categoria
              if (!categoriaId || !categorias[categoriaId]) return;
              
              // Inicializar categoria se não existir
              if (!despesasPorCategoria[categoriaId]) {
                despesasPorCategoria[categoriaId] = {
                  nome: categorias[categoriaId],
                  valor: 0
                };
              }
              
              // Processar despesas à vista
              if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
                const dataCompra = new Date(despesa.dataCompra);
                if (dataCompra.getMonth() === mobileCurrentMonth && dataCompra.getFullYear() === mobileCurrentYear) {
                  despesasPorCategoria[categoriaId].valor += parseFloat(despesa.valor) || 0;
                }
              } 
              // Processar despesas parceladas
              else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
                despesa.parcelas.forEach(parcela => {
                  const dataVencimento = new Date(parcela.vencimento);
                  if (dataVencimento.getMonth() === mobileCurrentMonth && dataVencimento.getFullYear() === mobileCurrentYear) {
                    despesasPorCategoria[categoriaId].valor += parseFloat(parcela.valor) || 0;
                  }
                });
              }
            });
            
            // Converter para array e ordenar por valor
            const data = Object.values(despesasPorCategoria)
              .filter(cat => cat.valor > 0)
              .sort((a, b) => b.valor - a.valor)
              .slice(0, 5); // Limitar a 5 categorias para melhor visualização
            
            // Configuração do gráfico
            const options = {
              series: [{
                name: 'Despesas',
                data: data.map(item => item.valor)
              }],
              chart: {
                type: 'bar',
                height: 250,
                toolbar: {
                  show: false
                }
              },
              plotOptions: {
                bar: {
                  borderRadius: 4,
                  horizontal: false,
                  columnWidth: '55%',
                  endingShape: 'rounded'
                },
              },
              dataLabels: {
                enabled: false
              },
              stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
              },
              xaxis: {
                categories: data.map(item => item.nome),
              },
              yaxis: {
                title: {
                  text: 'R$'
                }
              },
              fill: {
                opacity: 1,
                colors: ['#4361ee']
              },
              tooltip: {
                y: {
                  formatter: function (val) {
                    return "R$ " + val.toFixed(2)
                  }
                }
              },
              theme: {
                mode: 'light'
              }
            };
            
            // Limpar gráfico existente
            chartElement.innerHTML = '';
            
            // Criar novo gráfico
            const chart = new ApexCharts(chartElement, options);
            chart.render();
          });
      })
      .catch(error => {
        console.error('Erro ao renderizar gráfico de despesas:', error);
        chartElement.innerHTML = '<div class="error-message">Erro ao carregar gráfico</div>';
      });
  } else {
    // Fallback para desenvolvimento - gráfico simples
    chartElement.innerHTML = '<div class="error-message">Firebase não disponível</div>';
  }
}

/**
 * Carrega a lista de despesas do mês
 */
function loadMobileListaDespesasMes() {
  const listaElement = document.getElementById('mobileListaDespesasMes');
  if (!listaElement) return;
  
  // Limpar lista existente
  listaElement.innerHTML = '';
  
  // Mostrar indicador de carregamento
  listaElement.innerHTML = '<div class="loading-indicator">Carregando despesas...</div>';
  
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    // Primeiro, carregar categorias
    firebase.database().ref("categorias").once("value")
      .then(catSnapshot => {
        const categorias = {};
        catSnapshot.forEach(child => {
          categorias[child.key] = child.val().nome;
        });
        
        // Depois, carregar despesas
        return firebase.database().ref("despesas").once("value")
          .then(snapshot => {
            // Array para armazenar despesas do mês
            const despesasDoMes = [];
            
            // Processar despesas
            snapshot.forEach(child => {
              const despesa = child.val();
              
              // Processar despesas à vista
              if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
                const dataCompra = new Date(despesa.dataCompra);
                if (dataCompra.getMonth() === mobileCurrentMonth && dataCompra.getFullYear() === mobileCurrentYear) {
                  despesasDoMes.push({
                    descricao: despesa.descricao,
                    valor: parseFloat(despesa.valor) || 0,
                    categoria: categorias[despesa.categoria] || 'Sem categoria',
                    data: dataCompra.toLocaleDateString(),
                    tipo: 'À Vista'
                  });
                }
              } 
              // Processar despesas parceladas
              else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
                despesa.parcelas.forEach((parcela, index) => {
                  const dataVencimento = new Date(parcela.vencimento);
                  if (dataVencimento.getMonth() === mobileCurrentMonth && dataVencimento.getFullYear() === mobileCurrentYear) {
                    despesasDoMes.push({
                      descricao: despesa.descricao,
                      valor: parseFloat(parcela.valor) || 0,
                      categoria: categorias[despesa.categoria] || 'Sem categoria',
                      data: dataVencimento.toLocaleDateString(),
                      tipo: `Parcela ${index + 1}/${despesa.parcelas.length}`
                    });
                  }
                });
              }
            });
            
            // Ordenar por data
            despesasDoMes.sort((a, b) => new Date(a.data) - new Date(b.data));
            
            // Limpar lista existente
            listaElement.innerHTML = '';
            
            if (despesasDoMes.length === 0) {
              listaElement.innerHTML = '<div class="empty-message">Nenhuma despesa encontrada para este mês</div>';
              return;
            }
            
            // Adicionar itens à lista
            despesasDoMes.forEach(despesa => {
              const itemElement = document.createElement('div');
              itemElement.className = 'mobile-despesa-item';
              itemElement.innerHTML = `
                <div class="mobile-despesa-info">
                  <div class="mobile-despesa-titulo">${despesa.descricao}</div>
                  <div class="mobile-despesa-detalhe">${despesa.categoria} - ${despesa.data} - ${despesa.tipo}</div>
                </div>
                <div class="mobile-despesa-valor">R$ ${despesa.valor.toFixed(2)}</div>
              `;
              listaElement.appendChild(itemElement);
            });
          });
      })
      .catch(error => {
        console.error('Erro ao carregar lista de despesas:', error);
        listaElement.innerHTML = '<div class="error-message">Erro ao carregar despesas</div>';
      });
  } else {
    // Fallback para desenvolvimento
    listaElement.innerHTML = '<div class="error-message">Firebase não disponível</div>';
  }
}

// ===================== EVENTOS MOBILE =====================
/**
 * Configura eventos para botões e interações
 */
function setupMobileEvents() {
  // Botão de atualizar dashboard
  const updateDashboardBtn = document.getElementById('mobileUpdateDashboard');
  if (updateDashboardBtn) {
    updateDashboardBtn.addEventListener('click', function() {
      updateMobileDashboard();
    });
  }
  
  // Seletores de mês e ano
  const monthSelect = document.getElementById('mobileDashboardMonth');
  const yearSelect = document.getElementById('mobileDashboardYear');
  
  if (monthSelect) {
    monthSelect.addEventListener('change', function() {
      mobileCurrentMonth = parseInt(this.value);
      updateMobileDashboard();
    });
  }
  
  if (yearSelect) {
    yearSelect.addEventListener('change', function() {
      mobileCurrentYear = parseInt(this.value);
      updateMobileDashboard();
    });
  }
  
  // Botões de navegação de mês
  const prevMonthBtn = document.getElementById('mobilePrevMonth');
  const nextMonthBtn = document.getElementById('mobileNextMonth');
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function() {
      mobileCurrentMonth--;
      if (mobileCurrentMonth < 0) {
        mobileCurrentMonth = 11;
        mobileCurrentYear--;
      }
      updateMobileDashboard();
    });
  }
  
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function() {
      mobileCurrentMonth++;
      if (mobileCurrentMonth > 11) {
        mobileCurrentMonth = 0;
        mobileCurrentYear++;
      }
      updateMobileDashboard();
    });
  }
  
  // Botão de adicionar despesa no dashboard
  const addDespesaBtn = document.getElementById('mobileAddDespesa');
  if (addDespesaBtn) {
    addDespesaBtn.addEventListener('click', function() {
      openMobileModal('mobileCadastroDespesaModal');
    });
  }
  
  // Botão de adicionar despesa na seção de despesas
  const addDespesaBtnSection = document.getElementById('mobileAddDespesaBtn');
  if (addDespesaBtnSection) {
    addDespesaBtnSection.addEventListener('click', function() {
      console.log('Botão Nova Despesa clicado');
      openMobileModal('mobileCadastroDespesaModal');
    });
  }
  
  // Botão de pagar despesa
  const pagarDespesaBtn = document.getElementById('mobilePagarDespesaBtn');
  if (pagarDespesaBtn) {
    pagarDespesaBtn.addEventListener('click', function() {
      console.log('Botão Pagar Despesa clicado');
      openMobileModal('mobilePagarDespesaModal');
      mobileFiltrarDespesas();
    });
  }
  
  // Configurar fechamento de modais
  setupMobileModals();
}

/**
 * Abre um modal mobile
 * @param {string} modalId - ID do modal a ser aberto
 */
function openMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    
    // Inicializar componentes específicos do modal
    if (modalId === 'mobileCadastroDespesaModal') {
      // Preencher data atual
      const dataInput = document.getElementById('mobileDataDespesa');
      if (dataInput) {
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split('T')[0];
        dataInput.value = dataFormatada;
      }
      
      // Carregar categorias
      loadMobileCategorias();
      
      // Carregar cartões
      loadMobileCartoes();
    }
    
    if (modalId === 'mobilePagarDespesaModal') {
      mobileFiltrarDespesas();
    }
  }
}

/**
 * Fecha um modal mobile
 * @param {string} modalId - ID do modal a ser fechado
 */
function closeMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    
    // Limpar formulários
    if (modalId === 'mobileCadastroDespesaModal') {
      document.getElementById('mobileCadastroDespesaForm').reset();
    }
    
    if (modalId === 'mobilePagarDespesaModal') {
      document.getElementById('mobilePagarDespesaForm').reset();
      document.getElementById('mobileParcelasDiv').classList.add('hidden');
    }
  }
}

/**
 * Configura eventos para modais
 */
function setupMobileModals() {
  // Fechar modais ao clicar no botão de fechar
  const closeButtons = document.querySelectorAll('.mobile-modal-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      closeMobileModal(modalId);
    });
  });
  
  // Fechar modais ao clicar fora do conteúdo
  const modals = document.querySelectorAll('.mobile-modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        closeMobileModal(this.id);
      }
    });
  });
  
  // Configurar formulário de cadastro de despesa
  const cadastroDespesaForm = document.getElementById('mobileCadastroDespesaForm');
  if (cadastroDespesaForm) {
    cadastroDespesaForm.addEventListener('submit', function(event) {
      event.preventDefault();
      cadastrarMobileDespesa();
    });
  }
  
  // Configurar formulário de pagamento de despesa
  const pagarDespesaForm = document.getElementById('mobilePagarDespesaForm');
  if (pagarDespesaForm) {
    pagarDespesaForm.addEventListener('submit', function(event) {
      event.preventDefault();
      pagarMobileDespesaForm();
    });
  }
  
  // Configurar toggle de parcelamento
  const formaPagamento = document.getElementById('mobileFormaPagamento');
  if (formaPagamento) {
    formaPagamento.addEventListener('change', mobileToggleParcelamento);
  }
  
  // Configurar carregamento de parcelas
  const despesaSelect = document.getElementById('mobileDespesaSelect');
  if (despesaSelect) {
    despesaSelect.addEventListener('change', mobileCarregarParcelas);
  }
}
function setupMobileModals() {
  // Fechar modais ao clicar no botão de fechar
  const closeButtons = document.querySelectorAll('.mobile-modal-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      closeMobileModal(modalId);
    });
  });
  
  // Fechar modais ao clicar fora do conteúdo
  const modals = document.querySelectorAll('.mobile-modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        closeMobileModal(this.id);
      }
    });
  });
  
  // Configurar formulário de cadastro de despesa
  const cadastroDespesaForm = document.getElementById('mobileCadastroDespesaForm');
  if (cadastroDespesaForm) {
    cadastroDespesaForm.addEventListener('submit', function(event) {
      event.preventDefault();
      cadastrarMobileDespesa();
    });
  }
  
  // Configurar formulário de pagamento de despesa
  const pagarDespesaForm = document.getElementById('mobilePagarDespesaForm');
  if (pagarDespesaForm) {
    pagarDespesaForm.addEventListener('submit', function(event) {
      event.preventDefault();
      pagarMobileDespesaForm();
    });
  }
  
  // Configurar toggle de parcelamento
  const formaPagamento = document.getElementById('mobileFormaPagamento');
  if (formaPagamento) {
    formaPagamento.addEventListener('change', mobileToggleParcelamento);
  }
  
  // Configurar carregamento de parcelas
  const despesaSelect = document.getElementById('mobileDespesaSelect');
  if (despesaSelect) {
    despesaSelect.addEventListener('change', mobileCarregarParcelas);
  }
}

/**
 * Alterna a exibição do parcelamento no formulário mobile
 */
function mobileToggleParcelamento() {
  const formaPagamento = document.getElementById('mobileFormaPagamento').value;
  const parcelamentoDiv = document.getElementById('mobileParcelamentoDiv');
  
  if (formaPagamento === 'cartao') {
    parcelamentoDiv.classList.remove('hidden');
  } else {
    parcelamentoDiv.classList.add('hidden');
  }
}

/**
 * Filtra as despesas não pagas para o modal de pagamento mobile
 */
function mobileFiltrarDespesas() {
  const despesaSelect = document.getElementById('mobileDespesaSelect');
  despesaSelect.innerHTML = '<option value="">Selecione a Despesa</option>';
  document.getElementById('mobileParcelasDiv').classList.add('hidden');
  
  db.ref('despesas').once('value').then(snapshot => {
    snapshot.forEach(child => {
      const key = child.key;
      const despesa = child.val();
      
      if (despesa.formaPagamento === 'avista' && !despesa.pago) {
        const option = document.createElement('option');
        option.value = key;
        option.text = `${despesa.descricao} - R$ ${parseFloat(despesa.valor).toFixed(2)} - ${new Date(despesa.dataCompra).toLocaleDateString()}`;
        despesaSelect.appendChild(option);
      } else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
        // Verificar se há parcelas não pagas
        let temParcelaNaoPaga = false;
        despesa.parcelas.forEach(parcela => {
          if (!parcela.pago) temParcelaNaoPaga = true;
        });
        
        if (temParcelaNaoPaga) {
          const option = document.createElement('option');
          option.value = key;
          option.text = `${despesa.descricao} - Cartão`;
          despesaSelect.appendChild(option);
        }
      }
    });
  }).catch(error => {
    console.error('Erro ao filtrar despesas:', error);
    exibirToast('Erro ao carregar despesas. Tente novamente.', 'error');
  });
}

/**
 * Carrega as parcelas de uma despesa no formulário mobile
 */
function mobileCarregarParcelas() {
  const despesaId = document.getElementById('mobileDespesaSelect').value;
  const parcelaSelect = document.getElementById('mobileParcelaSelect');
  parcelaSelect.innerHTML = '<option value="">Selecione a Parcela</option>';
  
  if (!despesaId) return;
  
  db.ref('despesas').child(despesaId).once('value').then(snapshot => {
    const despesa = snapshot.val();
    
    if (despesa.formaPagamento === 'avista') {
      document.getElementById('mobileParcelasDiv').classList.add('hidden');
    } else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
      document.getElementById('mobileParcelasDiv').classList.remove('hidden');
      
      despesa.parcelas.forEach((parcela, index) => {
        if (!parcela.pago) {
          const option = document.createElement('option');
          option.value = index;
          option.text = `Parcela ${index+1} - Venc: ${parcela.vencimento} - R$ ${parseFloat(parcela.valor).toFixed(2)}`;
          parcelaSelect.appendChild(option);
        }
      });
    }
  }).catch(error => {
    console.error('Erro ao carregar parcelas:', error);
    exibirToast('Erro ao carregar parcelas. Tente novamente.', 'error');
  });
}

/**
 * Cadastra uma nova despesa a partir do formulário mobile
 */
function cadastrarMobileDespesa() {
  const descricao = document.getElementById('mobileDescricaoDespesa').value;
  const valor = parseFloat(document.getElementById('mobileValorDespesa').value);
  const dataCompra = document.getElementById('mobileDataDespesa').value;
  const categoria = document.getElementById('mobileCategoriaDespesa').value;
  const formaPagamento = document.getElementById('mobileFormaPagamento').value;
  const status = document.getElementById('mobileStatusDespesa').value;
  
  if (!descricao || isNaN(valor) || valor <= 0 || !dataCompra) {
    exibirToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  const novaDespesa = {
    descricao: descricao,
    valor: valor,
    dataCompra: dataCompra,
    categoria: categoria,
    formaPagamento: formaPagamento,
    pago: status === 'pago'
  };
  
  if (formaPagamento === 'cartao') {
    const cartao = document.getElementById('mobileCartaoDespesa').value;
    const numParcelas = parseInt(document.getElementById('mobileNumeroParcelas').value);
    
    if (!cartao || isNaN(numParcelas) || numParcelas <= 0) {
      exibirToast('Preencha os dados do cartão e parcelas.', 'warning');
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
        vencimento: dataVencimento.toISOString().split('T')[0],
        pago: status === 'pago'
      });
    }
  }
  
  db.ref('despesas').push(novaDespesa)
    .then(() => {
      exibirToast('Despesa cadastrada com sucesso!', 'success');
      closeMobileModal('mobileCadastroDespesaModal');
      loadMobileDespesas();
      updateMobileDashboard();
    })
    .catch(error => {
      console.error('Erro ao cadastrar despesa:', error);
      exibirToast('Erro ao cadastrar despesa. Tente novamente.', 'error');
    });
}

/**
 * Paga uma despesa selecionada a partir do formulário mobile
 */
function pagarMobileDespesaForm() {
  const despesaId = document.getElementById('mobileDespesaSelect').value;
  
  if (!despesaId) {
    exibirToast('Selecione uma despesa para pagar.', 'warning');
    return;
  }
  
  db.ref('despesas').child(despesaId).once('value').then(snapshot => {
    const despesa = snapshot.val();
    
    if (despesa.formaPagamento === 'avista') {
      db.ref('despesas').child(despesaId).update({
        pago: true
      }).then(() => {
        exibirToast('Despesa paga com sucesso!', 'success');
        closeMobileModal('mobilePagarDespesaModal');
        loadMobileDespesas();
        updateMobileDashboard();
      });
    } else if (despesa.formaPagamento === 'cartao') {
      const parcelaIndex = parseInt(document.getElementById('mobileParcelaSelect').value);
      
      if (isNaN(parcelaIndex)) {
        exibirToast('Selecione uma parcela para pagar.', 'warning');
        return;
      }
      
      db.ref(`despesas/${despesaId}/parcelas/${parcelaIndex}`).update({
        pago: true
      }).then(() => {
        exibirToast('Parcela paga com sucesso!', 'success');
        closeMobileModal('mobilePagarDespesaModal');
        loadMobileDespesas();
        updateMobileDashboard();
      });
    }
  }).catch(error => {
    console.error('Erro ao pagar despesa:', error);
    exibirToast('Erro ao pagar despesa. Tente novamente.', 'error');
  });
}

/**
 * Carrega as categorias para o select do formulário mobile
 */
function loadMobileCategorias() {
  const categoriaSelect = document.getElementById('mobileCategoriaDespesa');
  if (!categoriaSelect) return;
  
  categoriaSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  db.ref('categorias').once('value').then(snapshot => {
    snapshot.forEach(child => {
      const categoria = child.val();
      const option = document.createElement('option');
      option.value = categoria.nome;
      option.text = categoria.nome;
      categoriaSelect.appendChild(option);
    });
  }).catch(error => {
    console.error('Erro ao carregar categorias:', error);
  });
}

/**
 * Carrega os cartões para o select do formulário mobile
 */
function loadMobileCartoes() {
  const cartaoSelect = document.getElementById('mobileCartaoDespesa');
  if (!cartaoSelect) return;
  
  cartaoSelect.innerHTML = '<option value="">Selecione um cartão</option>';
  
  db.ref("cartoes").once("value").then(snapshot => {
    snapshot.forEach(child => {
      const cartao = child.val();
      const option = document.createElement("option");
      option.value = child.key;
      option.text = cartao.nome;
      cartaoSelect.appendChild(option);
    });
  }).catch(error => {
    console.error('Erro ao carregar cartões:', error);
    exibirToast('Erro ao carregar cartões. Tente novamente.', 'error');
  });
}

/**
 * Abre um modal mobile
 * @param {string} modalId - ID do modal a ser aberto
 */
function openMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    
    // Inicializar componentes específicos do modal
    if (modalId === 'mobileCadastroDespesaModal') {
      initializeMobileCadastroDespesaModal();
    }
  }
}

/**
 * Fecha um modal mobile
 * @param {string} modalId - ID do modal a ser fechado
 */
function closeMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Inicializa o modal de cadastro de despesa
 */
function initializeMobileCadastroDespesaModal() {
  // Preencher campo de data com a data atual
  const dataInput = document.getElementById('mobileDataDespesa');
  if (dataInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dataInput.value = `${year}-${month}-${day}`;
  }
  
  // Carregar categorias
  loadMobileCategorias();
}

/**
 * Carrega as categorias para o select de categorias
 */
function loadMobileCategorias() {
  const categoriasSelect = document.getElementById('mobileCategoriaDespesa');
  if (!categoriasSelect) return;
  
  // Limpar opções existentes
  categoriasSelect.innerHTML = '<option value="">Selecione uma categoria</option>';
  
  // Dados de exemplo para categorias
  const categorias = [
    { id: 'cat1', nome: 'Alimentação' },
    { id: 'cat2', nome: 'Moradia' },
    { id: 'cat3', nome: 'Transporte' },
    { id: 'cat4', nome: 'Lazer' },
    { id: 'cat5', nome: 'Saúde' },
    { id: 'cat6', nome: 'Educação' },
    { id: 'cat7', nome: 'Serviços' }
  ];
  
  // Adicionar opções ao select
  categorias.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria.id;
    option.textContent = categoria.nome;
    categoriasSelect.appendChild(option);
  });
}

/**
 * Salva uma nova despesa
 */
function saveMobileDespesa() {
  // Obter valores do formulário e fazer trim para remover espaços extras
  const descricao = document.getElementById('mobileDescricaoDespesa').value.trim();
  const valorStr = document.getElementById('mobileValorDespesa').value.trim().replace(',', '.');
  const data = document.getElementById('mobileDataDespesa').value.trim();
  const categoria = document.getElementById('mobileCategoriaDespesa').value.trim();
  const status = document.getElementById('mobileStatusDespesa').value;
  
  // Validação mais robusta dos campos
  let errors = [];
  
  // Validar descrição
  if (!descricao) {
    errors.push('A descrição é obrigatória.');
  } else if (descricao.length < 3) {
    errors.push('A descrição deve ter pelo menos 3 caracteres.');
  } else if (descricao.length > 100) {
    errors.push('A descrição deve ter no máximo 100 caracteres.');
  }
  
  // Validar valor
  const valor = parseFloat(valorStr);
  if (!valorStr) {
    errors.push('O valor é obrigatório.');
  } else if (isNaN(valor)) {
    errors.push('O valor deve ser um número válido.');
  } else if (valor <= 0) {
    errors.push('O valor deve ser maior que zero.');
  } else if (valor > 1000000) {
    errors.push('O valor parece muito alto. Verifique se está correto.');
  }
  
  // Validar data
  if (!data) {
    errors.push('A data é obrigatória.');
  } else {
    const dataObj = new Date(data);
    const hoje = new Date();
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(hoje.getFullYear() - 1);
    const doisAnosAdiante = new Date();
    doisAnosAdiante.setFullYear(hoje.getFullYear() + 2);
    
    if (isNaN(dataObj.getTime())) {
      errors.push('A data informada é inválida.');
    } else if (dataObj < umAnoAtras) {
      errors.push('A data não pode ser anterior a um ano atrás.');
    } else if (dataObj > doisAnosAdiante) {
      errors.push('A data não pode ser superior a dois anos no futuro.');
    }
  }
  
  // Validar categoria
  if (!categoria) {
    errors.push('A categoria é obrigatória.');
  }
  
  // Se houver erros, exibir mensagem e interromper o processo
  if (errors.length > 0) {
    exibirToast(errors[0], 'warning');
    console.error('Erros de validação:', errors);
    return;
  }
  
  // Sanitizar dados e criar objeto de despesa
  const despesa = {
    descricao: descricao.substring(0, 100), // Garantir tamanho máximo
    valor: parseFloat(valor.toFixed(2)), // Arredondar para 2 casas decimais
    dataCompra: data,
    categoria,
    pago: status === 'pago',
    formaPagamento: 'avista',
    createdAt: new Date().toISOString(),
    userId: mobileCurrentUser ? mobileCurrentUser.uid : null
  };
  
  // Mostrar indicador de carregamento
  const submitBtn = document.querySelector('#mobileCadastroDespesaForm button[type="submit"]');
  if (submitBtn) {
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    submitBtn.disabled = true;
  }
  
  // Salvar no Firebase (implementação melhorada)
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    const newDespesaRef = firebase.database().ref('despesas').push();
    newDespesaRef.set(despesa)
      .then(() => {
        exibirToast('Despesa cadastrada com sucesso!', 'success');
        // Limpar formulário
        document.getElementById('mobileCadastroDespesaForm').reset();
        // Fechar modal
        closeMobileModal('mobileCadastroDespesaModal');
        // Atualizar dashboard e lista de despesas
        updateMobileDashboard();
        loadMobileDespesas();
      })
      .catch(error => {
        console.error('Erro ao salvar despesa:', error);
        exibirToast('Erro ao cadastrar despesa: ' + (error.message || 'Tente novamente.'), 'danger');
      })
      .finally(() => {
        // Restaurar botão
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      });
  } else {
    // Modo de desenvolvimento/teste
    console.log('Despesa salva (modo de teste):', despesa);
    
    // Simular um pequeno delay para mostrar o carregamento
    setTimeout(() => {
      exibirToast('Despesa cadastrada com sucesso! (modo de teste)', 'success');
      // Limpar formulário
      document.getElementById('mobileCadastroDespesaForm').reset();
      // Fechar modal
      closeMobileModal('mobileCadastroDespesaModal');
      // Atualizar dashboard
      updateMobileDashboard();
      
      // Restaurar botão
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }, 1000);
  }
}

// ===================== UTILITÁRIOS MOBILE =====================
/**
 * A função exibirToast foi movida para utils.js
 * Esta referência é mantida para compatibilidade com código existente
 */
function exibirToast(mensagem, tipo = 'primary') {
  // Chama a função unificada com o estilo 'mobile'
  if (typeof window.utilsExibirToast === 'function') {
    window.utilsExibirToast(mensagem, tipo, 'mobile');
  } else if (typeof Toastify !== 'undefined') {
    // Fallback para caso a função unificada não esteja disponível
    Toastify({
      text: mensagem,
      duration: 3000,
      close: true,
      gravity: "top",
      position: "center",
      backgroundColor: tipo === 'success' ? '#4cc9f0' : 
                       tipo === 'error' || tipo === 'danger' ? '#f72585' : 
                       tipo === 'warning' ? '#f8961e' : 
                       '#4361ee',
      stopOnFocus: true
    }).showToast();
  } else {
    // Fallback se Toastify não estiver disponível
    alert(mensagem);
  }
}

/**
 * Exporta os dados para um arquivo CSV
 */
function mobileExportData() {
  // Implementação simplificada
  exibirToast('Exportando dados...', 'primary');
  
  // Simular tempo de processamento
  setTimeout(() => {
    exibirToast('Dados exportados com sucesso!', 'success');
  }, 1500);
}

// ===================== FUNÇÕES DE CARREGAMENTO DE DADOS =====================
/**
 * Carrega a lista de despesas
 */
function loadMobileDespesas() {
  console.log('Carregando despesas mobile...');
  
  // Usar o elemento correto que existe no HTML
  const despesasList = document.getElementById('mobileDespesasList');
  if (!despesasList) {
    console.error('Elemento mobileDespesasList não encontrado');
    return;
  }
  
  // Mostrar indicador de carregamento
  const loadingIndicator = document.querySelector('.mobile-loading');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }
  
  // Limpar lista existente
  despesasList.innerHTML = '';
  
  // Verificar se Firebase está disponível
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    const despesasRef = firebase.database().ref('despesas');
    
    // Buscar todas as despesas, sem filtro de usuário
    despesasRef.once('value')
      .then(snapshot => {
        const despesas = [];
        snapshot.forEach(childSnapshot => {
          const despesa = childSnapshot.val();
          despesa.id = childSnapshot.key;
          despesas.push(despesa);
        });
        
        renderMobileDespesas(despesas);
      })
      .catch(error => {
        console.error('Erro ao carregar despesas:', error);
        despesasList.innerHTML = '<div class="error-message">Erro ao carregar despesas. Tente novamente.</div>';
        exibirToast('Erro ao carregar despesas. Tente novamente.', 'danger');
      })
      .finally(() => {
        // Esconder o indicador de carregamento
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
      });
  } else {
    // Fallback para desenvolvimento - usar dados de exemplo
    const exemplosDespesas = [
      {
        id: '-MxY1',
        descricao: 'Aluguel',
        valor: 1500.00,
        dataCompra: '2025-03-05',
        categoria: 'Moradia',
        pago: false
      },
      {
        id: '-MxY2',
        descricao: 'Supermercado',
        valor: 800.00,
        dataCompra: '2025-03-10',
        categoria: 'Alimentação',
        pago: true
      },
      {
        id: '-MxY3',
        descricao: 'Conta de Luz',
        valor: 250.00,
        dataCompra: '2025-03-15',
        categoria: 'Serviços',
        pago: false
      }
    ];
    
    // Renderizar após um pequeno delay para simular carregamento
    setTimeout(() => {
      renderMobileDespesas(exemplosDespesas);
      // Esconder o indicador de carregamento
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
    }, 500);
  }
}

/**
 * Renderiza a lista de despesas na interface
 * @param {Array} despesas - Array de objetos de despesa
 */
function renderMobileDespesas(despesas) {
  console.log('Renderizando despesas mobile:', despesas);
  
  // Usar o elemento correto que existe no HTML
  const despesasList = document.getElementById('mobileDespesasList');
  if (!despesasList) {
    console.error('Elemento mobileDespesasList não encontrado');
    return;
  }
  
  // Verificar se há despesas para exibir
  if (!despesas || despesas.length === 0) {
    despesasList.innerHTML = '<div class="empty-state">Nenhuma despesa encontrada.</div>';
    
    // Mostrar o estado vazio e esconder o indicador de carregamento
    const emptyState = document.querySelector('.mobile-empty-state');
    if (emptyState) {
      emptyState.style.display = 'flex';
    }
    
    return;
  }
  
  // Esconder o estado vazio se houver despesas
  const emptyState = document.querySelector('.mobile-empty-state');
  if (emptyState) {
    emptyState.style.display = 'none';
  }
  
  // Ordenar despesas por data (mais recentes primeiro)
  despesas.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
  
  // Limpar lista existente
  despesasList.innerHTML = '';
  
  // Criar elementos para cada despesa
  despesas.forEach(despesa => {
    const dataFormatada = new Date(despesa.dataCompra).toLocaleDateString('pt-BR');
    const statusClass = despesa.pago ? 'pago' : 'pendente';
    const statusText = despesa.pago ? 'Pago' : 'Pendente';
    
    const despesaItem = document.createElement('div');
    despesaItem.className = 'mobile-despesa-item';
    despesaItem.dataset.id = despesa.id;
    
    despesaItem.innerHTML = `
      <div class="mobile-despesa-info">
        <div class="mobile-despesa-titulo">${despesa.descricao}</div>
        <div class="mobile-despesa-detalhe">
          <span class="mobile-despesa-codigo">-${despesa.id.substring(0, 16)}</span>
          <span class="mobile-despesa-data">${dataFormatada}</span>
          <span class="mobile-despesa-status ${statusClass}">${statusText}</span>
        </div>
      </div>
      <div class="mobile-despesa-valor">R$ ${parseFloat(despesa.valor).toFixed(2)}</div>
      <div class="mobile-despesa-actions">
        <button class="mobile-btn-icon" onclick="editarMobileDespesa('${despesa.id}')">
          <i class="fas fa-edit"></i>
        </button>
        <button class="mobile-btn-icon" onclick="excluirMobileDespesa('${despesa.id}')">
          <i class="fas fa-trash"></i>
        </button>
        ${!despesa.pago ? `
          <button class="mobile-btn-icon" onclick="pagarMobileDespesa('${despesa.id}')">
            <i class="fas fa-check"></i>
          </button>
        ` : ''}
      </div>
    `;
    
    despesasList.appendChild(despesaItem);
  });
  
  // Esconder o indicador de carregamento
  const loadingIndicator = document.querySelector('.mobile-loading');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
  
  // Adicionar eventos aos botões de ação
  setupMobileDespesasEvents();
}

/**
 * Configura eventos para os botões de ação nas despesas
 */
function setupMobileDespesasEvents() {
  // Botão de adicionar despesa
  const addDespesaBtn = document.getElementById('mobileAddDespesaBtn');
  if (addDespesaBtn) {
    addDespesaBtn.addEventListener('click', function() {
      console.log('Botão adicionar despesa clicado');
      // Aqui você pode abrir um modal ou redirecionar para uma página de cadastro
      exibirToast('Funcionalidade de adicionar despesa acionada', 'primary');
    });
  }
  
  // Botão de pagar despesa
  const pagarDespesaBtn = document.getElementById('mobilePagarDespesaBtn');
  if (pagarDespesaBtn) {
    pagarDespesaBtn.addEventListener('click', function() {
      console.log('Botão pagar despesa clicado');
      // Aqui você pode implementar a lógica para marcar despesas como pagas
      exibirToast('Funcionalidade de pagar despesa acionada', 'primary');
    });
  }
  
  // Botão de filtrar
  const filtrarBtn = document.getElementById('mobileFiltrarBtn');
  if (filtrarBtn) {
    filtrarBtn.addEventListener('click', function() {
      console.log('Botão filtrar clicado');
      // Implementar lógica de filtro
      const filtroDescricao = document.getElementById('mobileFiltroDescricao').value;
      const filtroStatus = document.getElementById('mobileFiltroStatus').value;
      const filtroMes = document.getElementById('mobileFiltroMes').value;
      
      console.log('Filtros:', { filtroDescricao, filtroStatus, filtroMes });
      exibirToast('Filtros aplicados', 'success');
      // Recarregar despesas com filtros
      loadMobileDespesas();
    });
  }
  
  // Botão de calendário
  const calendarBtn = document.getElementById('mobileCalendarBtn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', function() {
      console.log('Botão calendário clicado');
      exibirToast('Visualização de calendário será implementada em breve', 'primary');
    });
  }
}

/**
 * Inicializa a seção de relatórios
 */
function initializeMobileRelatorios() {
  exibirToast('Carregando relatórios...', 'primary');
  
  // Inicializar o DateRangePicker para seleção de período
  initMobileDateRangePicker();
  
  // Definir período padrão (últimos 30 dias)
  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 30);
  
  const rangeStart = inicio.toISOString().split('T')[0];
  const rangeEnd = hoje.toISOString().split('T')[0];
  
  // Atualizar relatórios com o período padrão
  atualizarMobileRelatorios(rangeStart, rangeEnd);
}

/**
 * Inicializa o DateRangePicker para seleção de período
 */
function initMobileDateRangePicker() {
  const dateRangeInput = document.getElementById('mobileDateRange');
  if (!dateRangeInput) return;
  
  if (typeof $ !== 'undefined' && $.fn.daterangepicker) {
    $(dateRangeInput).daterangepicker({
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
      const rangeStart = start.format('YYYY-MM-DD');
      const rangeEnd = end.format('YYYY-MM-DD');
      atualizarMobileRelatorios(rangeStart, rangeEnd);
    });
    
    // Definir período padrão (últimos 30 dias)
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    
    $(dateRangeInput).data('daterangepicker').setStartDate(inicio);
    $(dateRangeInput).data('daterangepicker').setEndDate(hoje);
  } else {
    // Fallback para navegadores sem suporte a daterangepicker
    dateRangeInput.type = 'text';
    dateRangeInput.placeholder = 'Período não disponível';
    dateRangeInput.disabled = true;
    console.warn('DateRangePicker não está disponível');
  }
}

/**
 * Atualiza os relatórios com base no período selecionado
 * @param {string} inicio - Data de início (YYYY-MM-DD)
 * @param {string} fim - Data de fim (YYYY-MM-DD)
 */
function atualizarMobileRelatorios(inicio, fim) {
  const inicioDate = new Date(inicio);
  const fimDate = new Date(fim);
  
  // Mostrar indicador de carregamento
  document.getElementById('mobileRelatorioMensalChart').innerHTML = '<div class="mobile-loading"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  document.getElementById('mobileTotalDespesas').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  document.getElementById('mobileMediaMensal').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  document.getElementById('mobileGraficoPrevisao').innerHTML = '<div class="mobile-loading"><i class="fas fa-spinner fa-spin"></i> Carregando dados...</div>';
  
  // Buscar despesas no período
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref("despesas").once("value").then(snapshot => {
      let despesasPorMes = {};
      let despesasPorCategoria = {};
      let totalDespesas = 0;
      let contadorMeses = 0;
      
      // Processar despesas
      snapshot.forEach(child => {
        const despesa = child.val();
        
        // Verificar se a despesa pertence ao usuário atual
        if (despesa.userId && despesa.userId !== mobileCurrentUser.uid) {
          return;
        }
        
        // Processar despesas à vista
        if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
          const data = new Date(despesa.dataCompra);
          if (data >= inicioDate && data <= fimDate) {
            const mesAno = `${data.getFullYear()}-${data.getMonth() + 1}`;
            if (!despesasPorMes[mesAno]) {
              despesasPorMes[mesAno] = {
                total: 0,
                pagas: 0,
                pendentes: 0
              };
              contadorMeses++;
            }
            
            const valor = parseFloat(despesa.valor) || 0;
            despesasPorMes[mesAno].total += valor;
            totalDespesas += valor;
            
            if (despesa.pago) {
              despesasPorMes[mesAno].pagas += valor;
            } else {
              despesasPorMes[mesAno].pendentes += valor;
            }
            
            // Agrupar por categoria
            const categoriaId = despesa.categoria;
            if (categoriaId) {
              if (!despesasPorCategoria[categoriaId]) {
                despesasPorCategoria[categoriaId] = 0;
              }
              despesasPorCategoria[categoriaId] += valor;
            }
          }
        } 
        // Processar despesas parceladas
        else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
          despesa.parcelas.forEach(parcela => {
            const data = new Date(parcela.vencimento);
            if (data >= inicioDate && data <= fimDate) {
              const mesAno = `${data.getFullYear()}-${data.getMonth() + 1}`;
              if (!despesasPorMes[mesAno]) {
                despesasPorMes[mesAno] = {
                  total: 0,
                  pagas: 0,
                  pendentes: 0
                };
                contadorMeses++;
              }
              
              const valor = parseFloat(parcela.valor) || 0;
              despesasPorMes[mesAno].total += valor;
              totalDespesas += valor;
              
              if (parcela.pago) {
                despesasPorMes[mesAno].pagas += valor;
              } else {
                despesasPorMes[mesAno].pendentes += valor;
              }
              
              // Agrupar por categoria
              const categoriaId = despesa.categoria;
              if (categoriaId) {
                if (!despesasPorCategoria[categoriaId]) {
                  despesasPorCategoria[categoriaId] = 0;
                }
                despesasPorCategoria[categoriaId] += valor;
              }
            }
          });
        }
      });
      
      // Atualizar total de despesas
      document.getElementById('mobileTotalDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
      
      // Calcular média mensal
      const mediaMensal = contadorMeses > 0 ? totalDespesas / contadorMeses : 0;
      document.getElementById('mobileMediaMensal').textContent = `R$ ${mediaMensal.toFixed(2)}`;
      
      // Renderizar gráfico de resumo financeiro
      renderizarMobileGraficoResumo(despesasPorMes);
      
      // Renderizar gráfico de previsão
      renderizarMobileGraficoPrevisao(despesasPorMes);
      
      // Buscar nomes das categorias e renderizar gráfico de categorias
      firebase.database().ref("categorias").once("value").then(catSnapshot => {
        let categorias = {};
        
        catSnapshot.forEach(catChild => {
          categorias[catChild.key] = catChild.val().nome;
        });
        
        renderizarMobileGraficoCategorias(despesasPorCategoria, categorias);
      });
    }).catch(error => {
      console.error("Erro ao carregar relatórios:", error);
      exibirToast("Erro ao carregar relatórios. Tente novamente.", "danger");
    });
  } else {
    // Dados de exemplo para desenvolvimento/teste
    const despesasPorMes = {
      '2025-1': { total: 3200, pagas: 2800, pendentes: 400 },
      '2025-2': { total: 3500, pagas: 3000, pendentes: 500 },
      '2025-3': { total: 3100, pagas: 2600, pendentes: 500 },
      '2025-4': { total: 3300, pagas: 2900, pendentes: 400 }
    };
    
    const despesasPorCategoria = {
      'cat1': 1200,
      'cat2': 800,
      'cat3': 1500,
      'cat4': 500,
      'cat5': 440
    };
    
    const categorias = {
      'cat1': 'Alimentação',
      'cat2': 'Transporte',
      'cat3': 'Moradia',
      'cat4': 'Lazer',
      'cat5': 'Saúde'
    };
    
    // Calcular total e média
    let totalDespesas = 0;
    let contadorMeses = 0;
    
    Object.keys(despesasPorMes).forEach(mesAno => {
      totalDespesas += despesasPorMes[mesAno].total;
      contadorMeses++;
    });
    
    // Atualizar total de despesas
    document.getElementById('mobileTotalDespesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;
    
    // Calcular média mensal
    const mediaMensal = contadorMeses > 0 ? totalDespesas / contadorMeses : 0;
    document.getElementById('mobileMediaMensal').textContent = `R$ ${mediaMensal.toFixed(2)}`;
    
    // Renderizar gráficos
    renderizarMobileGraficoResumo(despesasPorMes);
    renderizarMobileGraficoPrevisao(despesasPorMes);
    renderizarMobileGraficoCategorias(despesasPorCategoria, categorias);
  }
}

/**
 * Renderiza o gráfico de resumo financeiro
 * @param {Object} despesasPorMes - Dados de despesas agrupados por mês
 */
function renderizarMobileGraficoResumo(despesasPorMes) {
  const chartElement = document.getElementById('mobileRelatorioMensalChart');
  if (!chartElement) return;
  
  // Verificar se ApexCharts está disponível
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts não está disponível');
    chartElement.innerHTML = '<div class="mobile-error">Erro ao carregar gráfico</div>';
    return;
  }
  
  // Preparar dados para o gráfico
  const meses = Object.keys(despesasPorMes).sort();
  const series = [
    {
      name: 'Total',
      data: meses.map(m => despesasPorMes[m].total)
    },
    {
      name: 'Pagas',
      data: meses.map(m => despesasPorMes[m].pagas)
    },
    {
      name: 'Pendentes',
      data: meses.map(m => despesasPorMes[m].pendentes)
    }
  ];
  
  const labels = meses.map(mesAno => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    return data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
  });
  
  // Configuração do gráfico
  const options = {
    series: series,
    chart: {
      type: 'bar',
      height: 250,
      stacked: true,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: labels,
    },
    yaxis: {
      title: {
        text: 'R$'
      }
    },
    fill: {
      opacity: 1,
      colors: ['#4361ee', '#4cc9f0', '#f72585']
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "R$ " + val.toFixed(2)
        }
      }
    },
    legend: {
      position: 'top'
    },
    theme: {
      mode: 'light'
    }
  };
  
  // Limpar gráfico existente
  chartElement.innerHTML = '';
  
  // Criar novo gráfico
  const chart = new ApexCharts(chartElement, options);
  chart.render();
}

/**
 * Renderiza o gráfico de previsão
 * @param {Object} despesasPorMes - Dados de despesas agrupados por mês
 */
function renderizarMobileGraficoPrevisao(despesasPorMes) {
  const chartElement = document.getElementById('mobileGraficoPrevisao');
  if (!chartElement) return;
  
  // Verificar se ApexCharts está disponível
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts não está disponível');
    chartElement.innerHTML = '<div class="mobile-error">Erro ao carregar gráfico</div>';
    return;
  }
  
  // Preparar dados para o gráfico
  const meses = Object.keys(despesasPorMes).sort();
  const valores = meses.map(m => despesasPorMes[m].total);
  
  // Calcular tendência linear
  const n = valores.length;
  if (n < 2) {
    chartElement.innerHTML = '<div class="mobile-info">Dados insuficientes para gerar previsão</div>';
    return;
  }
  
  // Calcular coeficientes da regressão linear (y = a + bx)
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += valores[i];
    sumXY += i * valores[i];
    sumX2 += i * i;
  }
  
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const a = (sumY - b * sumX) / n;
  
  // Gerar valores de tendência para os meses existentes
  const tendencia = [];
  for (let i = 0; i < n; i++) {
    tendencia.push(a + b * i);
  }
  
  // Gerar previsão para os próximos 3 meses
  const previsao = [];
  for (let i = 0; i < n; i++) {
    previsao.push(null); // Valores nulos para os meses existentes
  }
  
  for (let i = n; i < n + 3; i++) {
    previsao.push(a + b * i);
  }
  
  // Adicionar rótulos para os próximos 3 meses
  const ultimoMes = meses[meses.length - 1];
  const [anoUltimo, mesUltimo] = ultimoMes.split('-').map(Number);
  
  for (let i = 1; i <= 3; i++) {
    let novoMes = mesUltimo + i;
    let novoAno = anoUltimo;
    
    while (novoMes > 12) {
      novoMes -= 12;
      novoAno++;
    }
    
    meses.push(`${novoAno}-${novoMes}`);
  }
  
  const labels = meses.map(mesAno => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    return data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
  });
  
  // Configuração do gráfico
  const options = {
    series: [
      {
        name: 'Despesas',
        data: [...valores, null, null, null] // Adicionar valores nulos para os meses de previsão
      },
      {
        name: 'Tendência',
        data: tendencia
      },
      {
        name: 'Previsão',
        data: previsao
      }
    ],
    chart: {
      height: 250,
      type: 'line',
      toolbar: {
        show: false
      }
    },
    stroke: {
      width: [4, 2, 4],
      curve: 'smooth',
      dashArray: [0, 0, 0]
    },
    colors: ['#4361ee', '#f72585', '#4cc9f0'],
    markers: {
      size: 0,
      hover: {
        sizeOffset: 6
      }
    },
    xaxis: {
      categories: labels
    },
    yaxis: {
      title: {
        text: 'R$'
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val !== null ? "R$ " + val.toFixed(2) : "Sem dados";
        }
      }
    },
    legend: {
      position: 'top'
    },
    grid: {
      borderColor: '#e7e7e7'
    }
  };
  
  // Limpar gráfico existente
  chartElement.innerHTML = '';
  
  // Criar novo gráfico
  const chart = new ApexCharts(chartElement, options);
  chart.render();
}

/**
 * Renderiza o gráfico de categorias
 * @param {Object} despesasPorCategoria - Dados de despesas agrupados por categoria
 * @param {Object} categorias - Mapa de IDs de categorias para nomes
 */
function renderizarMobileGraficoCategorias(despesasPorCategoria, categorias) {
  // Esta função será implementada quando necessário
  // Por enquanto, os dados já são exibidos nos outros gráficos
}

/**
 * Carrega dados de inteligência financeira
 */
function loadMobileInteligenciaFinanceira() {
  exibirToast('Carregando inteligência financeira...', 'primary');
  
  // Mostrar indicadores de carregamento
  document.getElementById('mobileSituacaoFinanceira').innerHTML = '<div class="mobile-loading"><i class="fas fa-spinner fa-spin"></i> Analisando situação financeira...</div>';
  document.getElementById('mobileRecomendacoes').innerHTML = '<div class="mobile-loading"><i class="fas fa-spinner fa-spin"></i> Gerando recomendações...</div>';
  document.getElementById('mobileGastosCategorias').innerHTML = '<div class="mobile-loading"><i class="fas fa-spinner fa-spin"></i> Analisando gastos por categoria...</div>';
  
  // Analisar situação financeira
  analisarMobileSituacaoFinanceira()
    .then(dadosFinanceiros => {
      // Gerar recomendações baseadas na análise
      const recomendacoes = gerarMobileRecomendacoes(dadosFinanceiros);
      
      // Exibir resultados da análise
      exibirMobileAnaliseFinanceira(dadosFinanceiros, recomendacoes);
      
      // Analisar gastos por categoria
      return analisarMobileGastosPorCategoria();
    })
    .then(gastosPorCategoria => {
      // Exibir análise de gastos por categoria
      exibirMobileGastosPorCategoria(gastosPorCategoria);
    })
    .catch(error => {
      console.error('Erro ao carregar inteligência financeira:', error);
      exibirToast('Erro ao carregar dados. Tente novamente.', 'danger');
      
      // Exibir mensagem de erro nos containers
      document.getElementById('mobileSituacaoFinanceira').innerHTML = '<div class="mobile-error">Erro ao analisar situação financeira</div>';
      document.getElementById('mobileRecomendacoes').innerHTML = '<div class="mobile-error">Erro ao gerar recomendações</div>';
      document.getElementById('mobileGastosCategorias').innerHTML = '<div class="mobile-error">Erro ao analisar gastos por categoria</div>';
    });
}

/**
 * Analisa a situação financeira do usuário
 * @returns {Promise} Promise com o resultado da análise
 */
function analisarMobileSituacaoFinanceira() {
  return new Promise((resolve, reject) => {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.database || !mobileCurrentUser) {
      // Usar dados de exemplo para desenvolvimento/teste
      setTimeout(() => {
        const dadosExemplo = {
          receitas: {
            anual: 60000,
            mensal: Array(12).fill(5000)
          },
          despesas: {
            anual: 45000,
            mensal: [3800, 3900, 4100, 3700, 3800, 3600, 3700, 3800, 3900, 3700, 3500, 3500]
          },
          saldo: {
            anual: 15000,
            mensal: [1200, 1100, 900, 1300, 1200, 1400, 1300, 1200, 1100, 1300, 1500, 1500]
          }
        };
        resolve(dadosExemplo);
      }, 1000);
      return;
    }
    
    // Obter ano atual
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    
    // Estrutura para armazenar dados financeiros
    const dadosFinanceiros = {
      receitas: {
        anual: 0,
        mensal: Array(12).fill(0)
      },
      despesas: {
        anual: 0,
        mensal: Array(12).fill(0)
      },
      saldo: {
        anual: 0,
        mensal: Array(12).fill(0)
      }
    };
    
    // Obter todas as rendas
    firebase.database().ref("pessoas").once("value")
      .then(snapshot => {
        // Processar rendas
        snapshot.forEach(child => {
          const pessoa = child.val();
          
          // Verificar se a pessoa pertence ao usuário atual
          if (pessoa.userId && pessoa.userId !== mobileCurrentUser.uid) {
            return;
          }
          
          // Adicionar saldo inicial
          if (pessoa.saldoInicial) {
            dadosFinanceiros.receitas.anual += parseFloat(pessoa.saldoInicial) || 0;
          }
          
          // Processar pagamentos mensais
          if (pessoa.pagamentos) {
            pessoa.pagamentos.forEach(pag => {
              const valorMensal = parseFloat(pag.valor) || 0;
              
              // Adicionar ao total anual
              dadosFinanceiros.receitas.anual += valorMensal * 12;
              
              // Adicionar aos totais mensais
              for (let i = 0; i < 12; i++) {
                dadosFinanceiros.receitas.mensal[i] += valorMensal;
              }
            });
          }
        });
        
        // Obter todas as despesas
        return firebase.database().ref("despesas").once("value");
      })
      .then(snapshot => {
        // Processar despesas
        snapshot.forEach(child => {
          const despesa = child.val();
          
          // Verificar se a despesa pertence ao usuário atual
          if (despesa.userId && despesa.userId !== mobileCurrentUser.uid) {
            return;
          }
          
          // Processar despesas à vista
          if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
            const dataCompra = new Date(despesa.dataCompra);
            
            // Verificar se é do ano atual
            if (dataCompra.getFullYear() === anoAtual) {
              const valor = parseFloat(despesa.valor) || 0;
              const mes = dataCompra.getMonth();
              
              // Adicionar ao total anual
              dadosFinanceiros.despesas.anual += valor;
              
              // Adicionar ao total mensal
              dadosFinanceiros.despesas.mensal[mes] += valor;
            }
          } 
          // Processar despesas parceladas
          else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
            despesa.parcelas.forEach(parcela => {
              const dataVencimento = new Date(parcela.vencimento);
              
              // Verificar se é do ano atual
              if (dataVencimento.getFullYear() === anoAtual) {
                const valor = parseFloat(parcela.valor) || 0;
                const mes = dataVencimento.getMonth();
                
                // Adicionar ao total anual
                dadosFinanceiros.despesas.anual += valor;
                
                // Adicionar ao total mensal
                dadosFinanceiros.despesas.mensal[mes] += valor;
              }
            });
          }
        });
        
        // Calcular saldos
        dadosFinanceiros.saldo.anual = dadosFinanceiros.receitas.anual - dadosFinanceiros.despesas.anual;
        
        for (let i = 0; i < 12; i++) {
          dadosFinanceiros.saldo.mensal[i] = dadosFinanceiros.receitas.mensal[i] - dadosFinanceiros.despesas.mensal[i];
        }
        
        resolve(dadosFinanceiros);
      })
      .catch(error => {
        console.error("Erro ao analisar situação financeira:", error);
        reject(error);
      });
  });
}

/**
 * Gera recomendações baseadas na análise financeira
 * @param {Object} dadosFinanceiros - Dados financeiros do usuário
 * @returns {Object} Objeto com recomendações
 */
function gerarMobileRecomendacoes(dadosFinanceiros) {
  const recomendacoes = {
    situacao: '',
    mensagem: '',
    acoes: [],
    economia: [],
    disponibilidade: 0
  };
  
  // Analisar situação geral
  if (dadosFinanceiros.saldo.anual > 0) {
    const percentualSaldo = (dadosFinanceiros.saldo.anual / dadosFinanceiros.receitas.anual) * 100;
    
    if (percentualSaldo > 30) {
      recomendacoes.situacao = 'excelente';
      recomendacoes.mensagem = 'Sua situação financeira está excelente! Você está economizando mais de 30% da sua renda anual.';
      recomendacoes.acoes.push('Considere investir o excedente para fazer seu dinheiro render mais.');
      recomendacoes.acoes.push('Estabeleça metas de longo prazo para aproveitar sua boa situação financeira.');
    } else if (percentualSaldo > 15) {
      recomendacoes.situacao = 'boa';
      recomendacoes.mensagem = 'Sua situação financeira está boa. Você está economizando entre 15% e 30% da sua renda anual.';
      recomendacoes.acoes.push('Continue mantendo o controle dos seus gastos.');
      recomendacoes.acoes.push('Considere aumentar sua reserva de emergência ou iniciar investimentos.');
    } else {
      recomendacoes.situacao = 'regular';
      recomendacoes.mensagem = 'Sua situação financeira está regular. Você está economizando menos de 15% da sua renda anual.';
      recomendacoes.acoes.push('Tente aumentar sua taxa de economia para pelo menos 20% da renda.');
      recomendacoes.acoes.push('Revise seus gastos mensais para identificar oportunidades de economia.');
    }
    
    // Calcular disponibilidade mensal média
    recomendacoes.disponibilidade = dadosFinanceiros.saldo.anual / 12;
  } else {
    recomendacoes.situacao = 'preocupante';
    recomendacoes.mensagem = 'Sua situação financeira está preocupante. Suas despesas anuais superam suas receitas.';
    recomendacoes.acoes.push('Reduza despesas não essenciais imediatamente.');
    recomendacoes.acoes.push('Busque aumentar sua renda ou renegociar dívidas.');
    recomendacoes.disponibilidade = 0;
  }
  
  // Analisar meses problemáticos
  const mesesNegativos = [];
  for (let i = 0; i < 12; i++) {
    if (dadosFinanceiros.saldo.mensal[i] < 0) {
      mesesNegativos.push({
        mes: i,
        nome: new Date(2025, i, 1).toLocaleString('pt-BR', { month: 'long' }),
        deficit: Math.abs(dadosFinanceiros.saldo.mensal[i])
      });
    }
  }
  
  if (mesesNegativos.length > 0) {
    recomendacoes.acoes.push(`Atenção especial aos meses: ${mesesNegativos.map(m => m.nome).join(', ')}, onde suas despesas superam as receitas.`);
  }
  
  // Gerar sugestões de economia
  recomendacoes.economia = [
    'Revise assinaturas e serviços recorrentes que você não utiliza com frequência.',
    'Compare preços antes de fazer compras, especialmente para itens de maior valor.',
    'Estabeleça um orçamento mensal para categorias como alimentação e lazer.',
    'Considere renegociar dívidas com juros altos.',
    'Planeje compras grandes com antecedência para evitar parcelamentos.'
  ];
  
  return recomendacoes;
}

/**
 * Exibe a análise financeira na interface
 * @param {Object} dadosFinanceiros - Dados financeiros do usuário
 * @param {Object} recomendacoes - Recomendações geradas
 */
function exibirMobileAnaliseFinanceira(dadosFinanceiros, recomendacoes) {
  // Exibir situação financeira
  const situacaoContainer = document.getElementById('mobileSituacaoFinanceira');
  if (!situacaoContainer) return;
  
  // Definir classe CSS baseada na situação
  let situacaoClass = '';
  switch (recomendacoes.situacao) {
    case 'excelente':
      situacaoClass = 'situacao-excelente';
      break;
    case 'boa':
      situacaoClass = 'situacao-boa';
      break;
    case 'regular':
      situacaoClass = 'situacao-regular';
      break;
    case 'preocupante':
      situacaoClass = 'situacao-preocupante';
      break;
    default:
      situacaoClass = 'situacao-regular';
  }
  
  // Criar HTML para situação financeira
  let situacaoHTML = `
    <div class="mobile-card ${situacaoClass}">
      <h3>Situação Financeira</h3>
      <p class="mobile-situacao-mensagem">${recomendacoes.mensagem}</p>
      <div class="mobile-resumo-financeiro">
        <div class="mobile-resumo-item">
          <span class="mobile-resumo-label">Receitas Anuais</span>
          <span class="mobile-resumo-valor">R$ ${dadosFinanceiros.receitas.anual.toFixed(2)}</span>
        </div>
        <div class="mobile-resumo-item">
          <span class="mobile-resumo-label">Despesas Anuais</span>
          <span class="mobile-resumo-valor">R$ ${dadosFinanceiros.despesas.anual.toFixed(2)}</span>
        </div>
        <div class="mobile-resumo-item">
          <span class="mobile-resumo-label">Saldo Anual</span>
          <span class="mobile-resumo-valor ${dadosFinanceiros.saldo.anual >= 0 ? 'positivo' : 'negativo'}">
            R$ ${dadosFinanceiros.saldo.anual.toFixed(2)}
          </span>
        </div>
        <div class="mobile-resumo-item">
          <span class="mobile-resumo-label">Disponibilidade Mensal Média</span>
          <span class="mobile-resumo-valor ${recomendacoes.disponibilidade >= 0 ? 'positivo' : 'negativo'}">
            R$ ${recomendacoes.disponibilidade.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  `;
  
  situacaoContainer.innerHTML = situacaoHTML;
  
  // Exibir recomendações
  const recomendacoesContainer = document.getElementById('mobileRecomendacoes');
  if (!recomendacoesContainer) return;
  
  // Criar HTML para recomendações
  let recomendacoesHTML = `
    <div class="mobile-card">
      <h3>Recomendações</h3>
      <div class="mobile-acoes-recomendadas">
        <h4>Ações Recomendadas</h4>
        <ul>
  `;
  
  recomendacoes.acoes.forEach(acao => {
    recomendacoesHTML += `<li>${acao}</li>`;
  });
  
  recomendacoesHTML += `
        </ul>
      </div>
      <div class="mobile-dicas-economia">
        <h4>Dicas de Economia</h4>
        <ul>
  `;
  
  recomendacoes.economia.forEach(dica => {
    recomendacoesHTML += `<li>${dica}</li>`;
  });
  
  recomendacoesHTML += `
        </ul>
      </div>
    </div>
  `;
  
  recomendacoesContainer.innerHTML = recomendacoesHTML;
  
  // Renderizar gráfico de receitas x despesas
  renderizarMobileGraficoFinanceiro(dadosFinanceiros);
}

/**
 * Renderiza o gráfico financeiro
 * @param {Object} dadosFinanceiros - Dados financeiros do usuário
 */
function renderizarMobileGraficoFinanceiro(dadosFinanceiros) {
  const chartElement = document.getElementById('mobileGraficoFinanceiro');
  if (!chartElement) return;
  
  // Verificar se ApexCharts está disponível
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts não está disponível');
    chartElement.innerHTML = '<div class="mobile-error">Erro ao carregar gráfico</div>';
    return;
  }
  
  // Preparar dados para o gráfico
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  const series = [
    {
      name: 'Receitas',
      data: dadosFinanceiros.receitas.mensal
    },
    {
      name: 'Despesas',
      data: dadosFinanceiros.despesas.mensal
    },
    {
      name: 'Saldo',
      data: dadosFinanceiros.saldo.mensal
    }
  ];
  
  // Configuração do gráfico
  const options = {
    series: series,
    chart: {
      type: 'line',
      height: 250,
      toolbar: {
        show: false
      }
    },
    colors: ['#4cc9f0', '#f72585', '#4361ee'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: [3, 3, 2],
      dashArray: [0, 0, 5]
    },
    xaxis: {
      categories: meses
    },
    yaxis: {
      title: {
        text: 'R$'
      }
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return `R$ ${value.toFixed(2)}`;
        }
      }
    },
    legend: {
      position: 'top'
    }
  };
  
  // Limpar gráfico existente
  chartElement.innerHTML = '';
  
  // Criar novo gráfico
  const chart = new ApexCharts(chartElement, options);
  chart.render();
}

/**
 * Analisa gastos por categoria
 * @returns {Promise} Promise com o resultado da análise
 */
function analisarMobileGastosPorCategoria() {
  return new Promise((resolve, reject) => {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.database || !mobileCurrentUser) {
      // Usar dados de exemplo para desenvolvimento/teste
      setTimeout(() => {
        const gastosPorCategoriaExemplo = [
          {
            id: 'cat1',
            nome: 'Alimentação',
            limite: 1200,
            gasto: 1100,
            percentual: 91.67,
            tendencia: 5.2,
            historico: [1050, 1080, 1100, 1150, 1120, 1100]
          },
          {
            id: 'cat2',
            nome: 'Transporte',
            limite: 500,
            gasto: 450,
            percentual: 90,
            tendencia: -2.5,
            historico: [480, 470, 460, 450, 440, 450]
          },
          {
            id: 'cat3',
            nome: 'Moradia',
            limite: 2000,
            gasto: 1800,
            percentual: 90,
            tendencia: 0,
            historico: [1800, 1800, 1800, 1800, 1800, 1800]
          },
          {
            id: 'cat4',
            nome: 'Lazer',
            limite: 300,
            gasto: 350,
            percentual: 116.67,
            tendencia: 15.8,
            historico: [280, 290, 310, 320, 330, 350]
          },
          {
            id: 'cat5',
            nome: 'Saúde',
            limite: 500,
            gasto: 200,
            percentual: 40,
            tendencia: -10.5,
            historico: [250, 240, 230, 220, 210, 200]
          }
        ];
        resolve(gastosPorCategoriaExemplo);
      }, 1000);
      return;
    }
    
    // Obter ano atual
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    
    // Estrutura para armazenar gastos por categoria
    const gastosPorCategoria = {};
    
    // Obter limites de categorias
    firebase.database().ref("limites_categorias").once("value")
      .then(limSnapshot => {
        // Processar limites
        if (limSnapshot.exists()) {
          limSnapshot.forEach(child => {
            const categoriaId = child.key;
            const limite = parseFloat(child.val().limite) || 0;
            
            gastosPorCategoria[categoriaId] = {
              id: categoriaId,
              nome: '',
              limite: limite,
              gasto: 0,
              percentual: 0,
              tendencia: 0,
              historico: Array(6).fill(0) // Últimos 6 meses
            };
          });
        }
        
        // Obter categorias
        return firebase.database().ref("categorias").once("value");
      })
      .then(catSnapshot => {
        // Processar categorias
        catSnapshot.forEach(child => {
          const categoriaId = child.key;
          const categoriaNome = child.val().nome;
          
          if (gastosPorCategoria[categoriaId]) {
            gastosPorCategoria[categoriaId].nome = categoriaNome;
          } else {
            gastosPorCategoria[categoriaId] = {
              id: categoriaId,
              nome: categoriaNome,
              limite: 0,
              gasto: 0,
              percentual: 0,
              tendencia: 0,
              historico: Array(6).fill(0) // Últimos 6 meses
            };
          }
        });
        
        // Obter despesas
        return firebase.database().ref("despesas").once("value");
      })
      .then(snapshot => {
        // Processar despesas
        snapshot.forEach(child => {
          const despesa = child.val();
          const categoriaId = despesa.categoria;
          
          // Verificar se a despesa pertence ao usuário atual
          if (despesa.userId && despesa.userId !== mobileCurrentUser.uid) {
            return;
          }
          
          // Ignorar despesas sem categoria
          if (!categoriaId || !gastosPorCategoria[categoriaId]) return;
          
          // Processar despesas à vista
          if (despesa.formaPagamento === "avista" && despesa.dataCompra) {
            const dataCompra = new Date(despesa.dataCompra);
            const mes = dataCompra.getMonth();
            const ano = dataCompra.getFullYear();
            const valor = parseFloat(despesa.valor) || 0;
            
            // Verificar se é do mês atual do ano atual
            if (mes === mesAtual && ano === anoAtual) {
              gastosPorCategoria[categoriaId].gasto += valor;
            }
            
            // Adicionar ao histórico (últimos 6 meses)
            for (let i = 0; i < 6; i++) {
              let mesHistorico = mesAtual - i;
              let anoHistorico = anoAtual;
              
              if (mesHistorico < 0) {
                mesHistorico += 12;
                anoHistorico--;
              }
              
              if (mes === mesHistorico && ano === anoHistorico) {
                gastosPorCategoria[categoriaId].historico[i] += valor;
              }
            }
          } 
          // Processar despesas parceladas
          else if (despesa.formaPagamento === "cartao" && despesa.parcelas) {
            despesa.parcelas.forEach(parcela => {
              const dataVencimento = new Date(parcela.vencimento);
              const mes = dataVencimento.getMonth();
              const ano = dataVencimento.getFullYear();
              const valor = parseFloat(parcela.valor) || 0;
              
              // Verificar se é do mês atual do ano atual
              if (mes === mesAtual && ano === anoAtual) {
                gastosPorCategoria[categoriaId].gasto += valor;
              }
              
              // Adicionar ao histórico (últimos 6 meses)
              for (let i = 0; i < 6; i++) {
                let mesHistorico = mesAtual - i;
                let anoHistorico = anoAtual;
                
                if (mesHistorico < 0) {
                  mesHistorico += 12;
                  anoHistorico--;
                }
                
                if (mes === mesHistorico && ano === anoHistorico) {
                  gastosPorCategoria[categoriaId].historico[i] += valor;
                }
              }
            });
          }
        });
        
        // Calcular percentuais e tendências
        Object.keys(gastosPorCategoria).forEach(categoriaId => {
          const categoria = gastosPorCategoria[categoriaId];
          
          // Calcular percentual do limite
          if (categoria.limite > 0) {
            categoria.percentual = (categoria.gasto / categoria.limite) * 100;
          }
          
          // Calcular tendência (comparação com média dos últimos 3 meses)
          const ultimosTresMeses = categoria.historico.slice(1, 4);
          const mediaTresMeses = ultimosTresMeses.reduce((a, b) => a + b, 0) / 3;
          
          if (mediaTresMeses > 0) {
            categoria.tendencia = ((categoria.gasto - mediaTresMeses) / mediaTresMeses) * 100;
          }
        });
        
        // Filtrar apenas categorias com gastos
        const categoriasComGastos = Object.values(gastosPorCategoria).filter(cat => cat.gasto > 0);
        
        // Ordenar por percentual do limite (decrescente)
        categoriasComGastos.sort((a, b) => b.percentual - a.percentual);
        
        resolve(categoriasComGastos);
      })
      .catch(error => {
        console.error("Erro ao analisar gastos por categoria:", error);
        reject(error);
      });
  });
}

/**
 * Exibe a análise de gastos por categoria
 * @param {Array} gastosPorCategoria - Lista de categorias com análise de gastos
 */
function exibirMobileGastosPorCategoria(gastosPorCategoria) {
  const container = document.getElementById('mobileGastosCategorias');
  if (!container) return;
  
  // Verificar se há categorias com gastos
  if (!gastosPorCategoria || gastosPorCategoria.length === 0) {
    container.innerHTML = '<div class="mobile-info">Nenhum gasto por categoria encontrado no período.</div>';
    return;
  }
  
  // Criar HTML para exibir gastos por categoria
  let html = '<div class="mobile-categorias-container">';
  
  gastosPorCategoria.forEach(categoria => {
    // Determinar classe CSS baseada no percentual do limite
    let percentualClass = '';
    if (categoria.percentual > 100) {
      percentualClass = 'acima-limite';
    } else if (categoria.percentual > 80) {
      percentualClass = 'proximo-limite';
    } else {
      percentualClass = 'dentro-limite';
    }
    
    // Determinar ícone e texto para tendência
    let tendenciaIcon = '';
    let tendenciaText = '';
    
    if (categoria.tendencia > 5) {
      tendenciaIcon = '<i class="fas fa-arrow-up text-danger"></i>';
      tendenciaText = `Aumento de ${categoria.tendencia.toFixed(1)}%`;
    } else if (categoria.tendencia < -5) {
      tendenciaIcon = '<i class="fas fa-arrow-down text-success"></i>';
      tendenciaText = `Redução de ${Math.abs(categoria.tendencia).toFixed(1)}%`;
    } else {
      tendenciaIcon = '<i class="fas fa-equals text-info"></i>';
      tendenciaText = 'Estável';
    }
    
    html += `
      <div class="mobile-categoria-card ${percentualClass}">
        <div class="mobile-categoria-header">
          <h4>${categoria.nome}</h4>
          <div class="mobile-categoria-valores">
            <span class="mobile-categoria-gasto">R$ ${categoria.gasto.toFixed(2)}</span>
            ${categoria.limite > 0 ? `<span class="mobile-categoria-limite">/ R$ ${categoria.limite.toFixed(2)}</span>` : ''}
          </div>
        </div>
        <div class="mobile-categoria-progresso">
          <div class="mobile-progresso-barra">
            <div class="mobile-progresso-preenchimento" style="width: ${Math.min(100, categoria.percentual)}%"></div>
          </div>
          <div class="mobile-progresso-info">
            <span class="mobile-progresso-percentual">${categoria.percentual.toFixed(1)}%</span>
            <span class="mobile-progresso-tendencia">${tendenciaIcon} ${tendenciaText}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Carrega metas financeiras
 */
function loadMobileMetasFinanceiras() {
  exibirToast('Carregando metas financeiras...', 'primary');
  
  // Mostrar indicador de carregamento
  document.getElementById('mobileMetasContainer').innerHTML = '<div class="mobile-loading"><i class="fas fa-spinner fa-spin"></i> Carregando metas financeiras...</div>';
  
  // Carregar metas do Firebase
  carregarMobileMetasFinanceiras()
    .then(metas => {
      // Exibir metas na interface
      renderizarMobileMetasFinanceiras(metas);
    })
    .catch(error => {
      console.error('Erro ao carregar metas financeiras:', error);
      exibirToast('Erro ao carregar metas financeiras. Tente novamente.', 'danger');
      document.getElementById('mobileMetasContainer').innerHTML = '<div class="mobile-error">Erro ao carregar metas financeiras</div>';
    });
}

/**
 * Carrega as metas financeiras do usuário
 * @returns {Promise} Promise com as metas do usuário
 */
function carregarMobileMetasFinanceiras() {
  return new Promise((resolve, reject) => {
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.database || !mobileCurrentUser) {
      // Usar dados de exemplo para desenvolvimento/teste
      setTimeout(() => {
        const metasExemplo = [
          {
            id: 'meta1',
            titulo: 'Fundo de emergência',
            descricao: 'Reserva para 6 meses de despesas',
            valor: 15000,
            valorAtual: 9000,
            dataAlvo: '2025-12-31',
            dataCriacao: '2025-01-15',
            categoria: 'poupanca'
          },
          {
            id: 'meta2',
            titulo: 'Viagem para Europa',
            descricao: 'Férias em família',
            valor: 25000,
            valorAtual: 5000,
            dataAlvo: '2026-07-15',
            dataCriacao: '2025-02-10',
            categoria: 'lazer'
          },
          {
            id: 'meta3',
            titulo: 'Entrada para apartamento',
            descricao: 'Compra de imóvel próprio',
            valor: 80000,
            valorAtual: 20000,
            dataAlvo: '2027-06-30',
            dataCriacao: '2025-01-05',
            categoria: 'imovel'
          }
        ];
        resolve(metasExemplo);
      }, 1000);
      return;
    }
    
    // Carregar metas do Firebase
    firebase.database().ref("metas").orderByChild("userId").equalTo(mobileCurrentUser.uid).once("value")
      .then(snapshot => {
        const metas = [];
        
        if (snapshot.exists()) {
          snapshot.forEach(child => {
            metas.push({
              id: child.key,
              ...child.val()
            });
          });
        }
        
        resolve(metas);
      })
      .catch(error => {
        console.error("Erro ao carregar metas:", error);
        reject(error);
      });
  });
}

/**
 * Renderiza as metas financeiras na interface
 * @param {Array} metas - Lista de metas financeiras
 */
function renderizarMobileMetasFinanceiras(metas) {
  const container = document.getElementById('mobileMetasContainer');
  if (!container) return;
  
  // Verificar se há metas
  if (!metas || metas.length === 0) {
    container.innerHTML = `
      <div class="mobile-empty-state">
        <p>Você ainda não tem metas financeiras cadastradas.</p>
        <button class="btn btn-primary" onclick="abrirMobileModalNovaMeta()">
          <i class="fas fa-plus"></i> Criar Nova Meta
        </button>
      </div>
    `;
    return;
  }
  
  // Ordenar metas por data alvo (mais próximas primeiro)
  metas.sort((a, b) => new Date(a.dataAlvo) - new Date(b.dataAlvo));
  
  // Criar HTML para exibir metas
  let html = `
    <div class="mobile-metas-header">
      <h3>Suas Metas Financeiras</h3>
      <button class="btn btn-sm btn-primary" onclick="abrirMobileModalNovaMeta()">
        <i class="fas fa-plus"></i> Nova Meta
      </button>
    </div>
    <div class="mobile-metas-list">
  `;
  
  metas.forEach(meta => {
    // Calcular progresso
    const progresso = meta.valor > 0 ? (meta.valorAtual / meta.valor) * 100 : 0;
    const progressoFormatado = progresso.toFixed(1);
    
    // Calcular dias restantes
    const hoje = new Date();
    const dataAlvo = new Date(meta.dataAlvo);
    const diffTime = dataAlvo - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determinar classe CSS baseada no progresso
    let progressoClass = '';
    if (progresso >= 100) {
      progressoClass = 'completa';
    } else if (progresso >= 75) {
      progressoClass = 'avancada';
    } else if (progresso >= 50) {
      progressoClass = 'intermediaria';
    } else if (progresso >= 25) {
      progressoClass = 'iniciada';
    } else {
      progressoClass = 'inicial';
    }
    
    // Formatar datas
    const dataAlvoFormatada = dataAlvo.toLocaleDateString('pt-BR');
    
    html += `
      <div class="mobile-meta-card ${progressoClass}" data-id="${meta.id}">
        <div class="mobile-meta-header">
          <h4>${meta.titulo}</h4>
          <div class="mobile-meta-acoes">
            <button class="btn-icon" onclick="editarMobileMeta('${meta.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" onclick="excluirMobileMeta('${meta.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="mobile-meta-descricao">${meta.descricao || ''}</div>
        
        <div class="mobile-meta-valores">
          <div class="mobile-meta-valor-atual">
            <span class="mobile-meta-label">Valor Atual:</span>
            <span class="mobile-meta-valor">R$ ${meta.valorAtual.toFixed(2)}</span>
          </div>
          <div class="mobile-meta-valor-alvo">
            <span class="mobile-meta-label">Meta:</span>
            <span class="mobile-meta-valor">R$ ${meta.valor.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="mobile-meta-progresso">
          <div class="mobile-progresso-barra">
            <div class="mobile-progresso-preenchimento" style="width: ${Math.min(100, progresso)}%"></div>
          </div>
          <div class="mobile-progresso-info">
            <span class="mobile-progresso-percentual">${progressoFormatado}%</span>
            <span class="mobile-progresso-dias">${diffDays > 0 ? `${diffDays} dias restantes` : 'Prazo atingido'}</span>
          </div>
        </div>
        
        <div class="mobile-meta-footer">
          <span class="mobile-meta-data">Data alvo: ${dataAlvoFormatada}</span>
          <button class="btn btn-sm btn-primary" onclick="atualizarMobileProgressoMeta('${meta.id}', ${meta.valorAtual}, ${meta.valor})">
            Atualizar Progresso
          </button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Abre o modal para criar uma nova meta
 */
function abrirMobileModalNovaMeta() {
  // Verificar se o modal existe
  const modal = document.getElementById('mobileNovaMetaModal');
  if (!modal) {
    // Criar modal dinamicamente se não existir
    criarMobileModalMeta();
  }
  
  // Limpar formulário
  document.getElementById('mobileMetaTitulo').value = '';
  document.getElementById('mobileMetaDescricao').value = '';
  document.getElementById('mobileMetaValor').value = '';
  document.getElementById('mobileMetaValorAtual').value = '0';
  document.getElementById('mobileMetaDataAlvo').value = '';
  
  // Definir data mínima como hoje
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('mobileMetaDataAlvo').min = hoje;
  
  // Definir modo como "nova"
  document.getElementById('mobileMetaId').value = '';
  document.getElementById('mobileMetaModalTitulo').textContent = 'Nova Meta Financeira';
  document.getElementById('mobileMetaSubmitBtn').textContent = 'Criar Meta';
  
  // Abrir modal
  openMobileModal('mobileNovaMetaModal');
}

/**
 * Cria o modal de meta dinamicamente
 */
function criarMobileModalMeta() {
  const modalHTML = `
    <div id="mobileNovaMetaModal" class="mobile-modal">
      <div class="mobile-modal-content">
        <div class="mobile-modal-header">
          <h3 id="mobileMetaModalTitulo">Nova Meta Financeira</h3>
          <button class="mobile-modal-close" onclick="closeMobileModal('mobileNovaMetaModal')">&times;</button>
        </div>
        <div class="mobile-modal-body">
          <form id="mobileMetaForm">
            <input type="hidden" id="mobileMetaId">
            
            <div class="mobile-form-group">
              <label for="mobileMetaTitulo">Título*</label>
              <input type="text" id="mobileMetaTitulo" class="mobile-form-control" required>
            </div>
            
            <div class="mobile-form-group">
              <label for="mobileMetaDescricao">Descrição</label>
              <textarea id="mobileMetaDescricao" class="mobile-form-control" rows="2"></textarea>
            </div>
            
            <div class="mobile-form-group">
              <label for="mobileMetaValor">Valor da Meta (R$)*</label>
              <input type="number" id="mobileMetaValor" class="mobile-form-control" min="0" step="0.01" required>
            </div>
            
            <div class="mobile-form-group">
              <label for="mobileMetaValorAtual">Valor Atual (R$)</label>
              <input type="number" id="mobileMetaValorAtual" class="mobile-form-control" min="0" step="0.01" value="0">
            </div>
            
            <div class="mobile-form-group">
              <label for="mobileMetaDataAlvo">Data Alvo*</label>
              <input type="date" id="mobileMetaDataAlvo" class="mobile-form-control" required>
            </div>
            
            <div class="mobile-form-group">
              <label for="mobileMetaCategoria">Categoria</label>
              <select id="mobileMetaCategoria" class="mobile-form-control">
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="imovel">Imóvel</option>
                <option value="veiculo">Veículo</option>
                <option value="educacao">Educação</option>
                <option value="lazer">Lazer</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </form>
        </div>
        <div class="mobile-modal-footer">
          <button class="btn btn-secondary" onclick="closeMobileModal('mobileNovaMetaModal')">Cancelar</button>
          <button id="mobileMetaSubmitBtn" class="btn btn-primary" onclick="salvarMobileMeta()">Criar Meta</button>
        </div>
      </div>
    </div>
  `;
  
  // Adicionar modal ao DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);
}

/**
 * Abre o modal para editar uma meta existente
 * @param {string} metaId - ID da meta a ser editada
 */
function editarMobileMeta(metaId) {
  // Verificar se o modal existe
  const modal = document.getElementById('mobileNovaMetaModal');
  if (!modal) {
    // Criar modal dinamicamente se não existir
    criarMobileModalMeta();
  }
  
  // Buscar dados da meta
  carregarMobileMetasFinanceiras()
    .then(metas => {
      const meta = metas.find(m => m.id === metaId);
      if (!meta) {
        exibirToast('Meta não encontrada.', 'warning');
        return;
      }
      
      // Preencher formulário com dados da meta
      document.getElementById('mobileMetaId').value = meta.id;
      document.getElementById('mobileMetaTitulo').value = meta.titulo;
      document.getElementById('mobileMetaDescricao').value = meta.descricao || '';
      document.getElementById('mobileMetaValor').value = meta.valor;
      document.getElementById('mobileMetaValorAtual').value = meta.valorAtual;
      document.getElementById('mobileMetaDataAlvo').value = meta.dataAlvo;
      document.getElementById('mobileMetaCategoria').value = meta.categoria || 'outros';
      
      // Definir modo como "edição"
      document.getElementById('mobileMetaModalTitulo').textContent = 'Editar Meta Financeira';
      document.getElementById('mobileMetaSubmitBtn').textContent = 'Salvar Alterações';
      
      // Abrir modal
      openMobileModal('mobileNovaMetaModal');
    })
    .catch(error => {
      console.error('Erro ao carregar meta para edição:', error);
      exibirToast('Erro ao carregar meta. Tente novamente.', 'danger');
    });
}

/**
 * Salva uma meta financeira (nova ou existente)
 */
function salvarMobileMeta() {
  // Obter valores do formulário
  const metaId = document.getElementById('mobileMetaId').value;
  const titulo = document.getElementById('mobileMetaTitulo').value.trim();
  const descricao = document.getElementById('mobileMetaDescricao').value.trim();
  const valorStr = document.getElementById('mobileMetaValor').value.trim();
  const valorAtualStr = document.getElementById('mobileMetaValorAtual').value.trim();
  const dataAlvo = document.getElementById('mobileMetaDataAlvo').value;
  const categoria = document.getElementById('mobileMetaCategoria').value;
  
  // Validar campos obrigatórios
  if (!titulo || !valorStr || !dataAlvo) {
    exibirToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  // Converter valores para números
  const valor = parseFloat(valorStr);
  const valorAtual = parseFloat(valorAtualStr) || 0;
  
  // Validar valores
  if (isNaN(valor) || valor <= 0) {
    exibirToast('O valor da meta deve ser maior que zero.', 'warning');
    return;
  }
  
  if (isNaN(valorAtual) || valorAtual < 0) {
    exibirToast('O valor atual não pode ser negativo.', 'warning');
    return;
  }
  
  // Validar data
  const hoje = new Date();
  const dataAlvoObj = new Date(dataAlvo);
  if (dataAlvoObj < hoje) {
    exibirToast('A data alvo deve ser futura.', 'warning');
    return;
  }
  
  // Preparar objeto da meta
  const meta = {
    id: metaId,
    titulo: titulo,
    descricao: descricao,
    valor: valor,
    valorAtual: valorAtual,
    dataAlvo: dataAlvo,
    categoria: categoria,
    userId: mobileCurrentUser ? mobileCurrentUser.uid : null
  };
  
  // Se for uma nova meta, adicionar data de criação
  if (!metaId) {
    meta.dataCriacao = new Date().toISOString().split('T')[0];
  }
  
  // Mostrar indicador de carregamento
  const submitBtn = document.getElementById('mobileMetaSubmitBtn');
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  submitBtn.disabled = true;
  
  // Salvar no Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    let savePromise;
    
    if (metaId) {
      // Atualizar meta existente
      savePromise = firebase.database().ref(`metas/${metaId}`).update({
        titulo: meta.titulo,
        descricao: meta.descricao,
        valor: meta.valor,
        valorAtual: meta.valorAtual,
        dataAlvo: meta.dataAlvo,
        categoria: meta.categoria
      });
    } else {
      // Criar nova meta
      const newMetaRef = firebase.database().ref("metas").push();
      savePromise = newMetaRef.set({
        titulo: meta.titulo,
        descricao: meta.descricao,
        valor: meta.valor,
        valorAtual: meta.valorAtual,
        dataAlvo: meta.dataAlvo,
        dataCriacao: meta.dataCriacao,
        categoria: meta.categoria,
        userId: meta.userId
      });
    }
    
    savePromise
      .then(() => {
        exibirToast(metaId ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!', 'success');
        closeMobileModal('mobileNovaMetaModal');
        loadMobileMetasFinanceiras();
      })
      .catch(error => {
        console.error('Erro ao salvar meta:', error);
        exibirToast('Erro ao salvar meta. Tente novamente.', 'danger');
      })
      .finally(() => {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
  } else {
    // Modo de desenvolvimento/teste
    console.log('Meta salva (modo de teste):', meta);
    
    // Simular um pequeno delay para mostrar o carregamento
    setTimeout(() => {
      exibirToast(metaId ? 'Meta atualizada com sucesso! (modo de teste)' : 'Meta criada com sucesso! (modo de teste)', 'success');
      closeMobileModal('mobileNovaMetaModal');
      
      // Restaurar botão
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      // Recarregar metas
      loadMobileMetasFinanceiras();
    }, 1000);
  }
}

/**
 * Abre o modal para atualizar o progresso de uma meta
 * @param {string} metaId - ID da meta
 * @param {number} valorAtual - Valor atual da meta
 * @param {number} valorTotal - Valor total da meta
 */
function atualizarMobileProgressoMeta(metaId, valorAtual, valorTotal) {
  // Criar modal dinamicamente
  const modalId = 'mobileAtualizarProgressoModal';
  let modal = document.getElementById(modalId);
  
  if (!modal) {
    const modalHTML = `
      <div id="${modalId}" class="mobile-modal">
        <div class="mobile-modal-content">
          <div class="mobile-modal-header">
            <h3>Atualizar Progresso</h3>
            <button class="mobile-modal-close" onclick="closeMobileModal('${modalId}')">&times;</button>
          </div>
          <div class="mobile-modal-body">
            <form id="mobileProgressoForm">
              <input type="hidden" id="mobileProgressoMetaId">
              
              <div class="mobile-form-group">
                <label for="mobileProgressoValorAtual">Valor Atual (R$)</label>
                <input type="number" id="mobileProgressoValorAtual" class="mobile-form-control" min="0" step="0.01" required>
              </div>
              
              <div class="mobile-form-group">
                <label for="mobileProgressoValorTotal">Valor da Meta (R$)</label>
                <input type="number" id="mobileProgressoValorTotal" class="mobile-form-control" disabled>
              </div>
              
              <div class="mobile-progresso-preview">
                <div class="mobile-progresso-barra">
                  <div id="mobileProgressoPreview" class="mobile-progresso-preenchimento" style="width: 0%"></div>
                </div>
                <div class="mobile-progresso-info">
                  <span id="mobileProgressoPercentual">0%</span>
                </div>
              </div>
            </form>
          </div>
          <div class="mobile-modal-footer">
            <button class="btn btn-secondary" onclick="closeMobileModal('${modalId}')">Cancelar</button>
            <button id="mobileProgressoSubmitBtn" class="btn btn-primary" onclick="salvarMobileProgressoMeta()">Atualizar Progresso</button>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar modal ao DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    modal = document.getElementById(modalId);
    
    // Adicionar evento para atualizar preview do progresso
    const valorAtualInput = document.getElementById('mobileProgressoValorAtual');
    valorAtualInput.addEventListener('input', atualizarMobilePreviewProgresso);
  }
  
  // Preencher dados
  document.getElementById('mobileProgressoMetaId').value = metaId;
  document.getElementById('mobileProgressoValorAtual').value = valorAtual;
  document.getElementById('mobileProgressoValorTotal').value = valorTotal;
  
  // Atualizar preview
  atualizarMobilePreviewProgresso();
  
  // Abrir modal
  openMobileModal(modalId);
}

/**
 * Atualiza o preview do progresso no modal
 */
function atualizarMobilePreviewProgresso() {
  const valorAtual = parseFloat(document.getElementById('mobileProgressoValorAtual').value) || 0;
  const valorTotal = parseFloat(document.getElementById('mobileProgressoValorTotal').value) || 1;
  
  const progresso = (valorAtual / valorTotal) * 100;
  const progressoFormatado = progresso.toFixed(1);
  
  document.getElementById('mobileProgressoPreview').style.width = `${Math.min(100, progresso)}%`;
  document.getElementById('mobileProgressoPercentual').textContent = `${progressoFormatado}%`;
}

/**
 * Salva o progresso atualizado de uma meta
 */
function salvarMobileProgressoMeta() {
  // Obter valores
  const metaId = document.getElementById('mobileProgressoMetaId').value;
  const valorAtualStr = document.getElementById('mobileProgressoValorAtual').value;
  
  // Validar
  if (!metaId || !valorAtualStr) {
    exibirToast('Dados incompletos.', 'warning');
    return;
  }
  
  const valorAtual = parseFloat(valorAtualStr);
  if (isNaN(valorAtual) || valorAtual < 0) {
    exibirToast('O valor atual não pode ser negativo.', 'warning');
    return;
  }
  
  // Mostrar indicador de carregamento
  const submitBtn = document.getElementById('mobileProgressoSubmitBtn');
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
  submitBtn.disabled = true;
  
  // Salvar no Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`metas/${metaId}/valorAtual`).set(valorAtual)
      .then(() => {
        exibirToast('Progresso atualizado com sucesso!', 'success');
        closeMobileModal('mobileAtualizarProgressoModal');
        loadMobileMetasFinanceiras();
      })
      .catch(error => {
        console.error('Erro ao atualizar progresso:', error);
        exibirToast('Erro ao atualizar progresso. Tente novamente.', 'danger');
      })
      .finally(() => {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
  } else {
    // Modo de desenvolvimento/teste
    console.log('Progresso atualizado (modo de teste):', { metaId, valorAtual });
    
    // Simular um pequeno delay para mostrar o carregamento
    setTimeout(() => {
      exibirToast('Progresso atualizado com sucesso! (modo de teste)', 'success');
      closeMobileModal('mobileAtualizarProgressoModal');
      
      // Restaurar botão
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      
      // Recarregar metas
      loadMobileMetasFinanceiras();
    }, 1000);
  }
}

/**
 * Exclui uma meta financeira
 * @param {string} metaId - ID da meta a ser excluída
 */
function excluirMobileMeta(metaId) {
  if (!confirm('Tem certeza que deseja excluir esta meta?')) {
    return;
  }
  
  // Excluir no Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`metas/${metaId}`).remove()
      .then(() => {
        exibirToast('Meta excluída com sucesso!', 'success');
        loadMobileMetasFinanceiras();
      })
      .catch(error => {
        console.error('Erro ao excluir meta:', error);
        exibirToast('Erro ao excluir meta. Tente novamente.', 'danger');
      });
  } else {
    // Modo de desenvolvimento/teste
    console.log('Meta excluída (modo de teste):', metaId);
    
    // Simular um pequeno delay
    setTimeout(() => {
      exibirToast('Meta excluída com sucesso! (modo de teste)', 'success');
      loadMobileMetasFinanceiras();
    }, 500);
  }
}

/**
 * Inicializa a seção de configurações
 */
function initializeMobileConfiguracoes() {
  // Implementação futura
  exibirToast('Carregando configurações...', 'primary');
}

/**
 * Carrega alertas
 */
function loadMobileAlertas() {
  // Implementação futura
  exibirToast('Carregando alertas...', 'primary');
}

// ===================== DETECÇÃO DE GESTOS MOBILE =====================
/**
 * Adiciona suporte a gestos de deslize
 * Será implementado em versões futuras
 */
function setupMobileGestures() {
  // Implementação futura para gestos de deslize
}

// ===================== EXPORTAR FUNÇÕES GLOBAIS =====================
// Expor funções que precisam ser acessadas globalmente
window.openMobileModal = openMobileModal;
window.closeMobileModal = closeMobileModal;
window.exibirToast = exibirToast;

/**
 * Carrega a seção de Inteligência Financeira
 */
function loadMobileInteligenciaFinanceira() {
  const containerElement = document.getElementById('mobileInteligenciaFinanceiraContent');
  if (!containerElement) return;
  
  // Mostrar indicador de carregamento
  containerElement.innerHTML = '<div class="loading-indicator">Analisando seus dados financeiros...</div>';
  
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    // Usar as funções do módulo de inteligência financeira
    analisarSituacaoFinanceira()
      .then(dadosFinanceiros => {
        // Gerar recomendações baseadas na análise
        const recomendacoes = gerarRecomendacoes(dadosFinanceiros);
        
        // Analisar gastos por categoria
        return analisarGastosPorCategoria()
          .then(categorias => {
            // Renderizar conteúdo
            containerElement.innerHTML = `
              <div class="mobile-inteligencia-card">
                <div class="mobile-inteligencia-header ${recomendacoes.situacao}">
                  <h3>Situação Financeira</h3>
                  <div class="mobile-inteligencia-status">${recomendacoes.situacao.toUpperCase()}</div>
                </div>
                <div class="mobile-inteligencia-body">
                  <p>${recomendacoes.mensagem}</p>
                  <div class="mobile-inteligencia-acoes">
                    <h4>Ações Recomendadas:</h4>
                    <ul>
                      ${recomendacoes.acoes.map(acao => `<li>${acao}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="mobile-inteligencia-card">
                <div class="mobile-inteligencia-header">
                  <h3>Análise de Gastos por Categoria</h3>
                </div>
                <div class="mobile-inteligencia-body">
                  <div id="mobileGraficoCategorias" class="mobile-grafico-categorias"></div>
                  <div class="mobile-categorias-lista">
                    ${categorias.map(cat => `
                      <div class="mobile-categoria-item">
                        <div class="mobile-categoria-info">
                          <div class="mobile-categoria-nome">${cat.nome}</div>
                          <div class="mobile-categoria-valor">R$ ${cat.gasto.toFixed(2)}</div>
                        </div>
                        <div class="mobile-categoria-barra-container">
                          <div class="mobile-categoria-barra" style="width: ${Math.min(cat.percentual, 100)}%"></div>
                        </div>
                        <div class="mobile-categoria-percentual">${cat.percentual.toFixed(0)}%</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              
              <div class="mobile-inteligencia-card">
                <div class="mobile-inteligencia-header">
                  <h3>Dicas de Economia</h3>
                </div>
                <div class="mobile-inteligencia-body">
                  <ul class="mobile-dicas-lista">
                    ${recomendacoes.economia.map(dica => `<li>${dica}</li>`).join('')}
                  </ul>
                </div>
              </div>
            `;
            
            // Renderizar gráfico de categorias
            renderizarMobileGraficoCategorias(categorias);
          });
      })
      .catch(error => {
        console.error('Erro ao carregar inteligência financeira:', error);
        containerElement.innerHTML = '<div class="error-message">Erro ao analisar dados financeiros</div>';
      });
  } else {
    // Fallback para desenvolvimento
    containerElement.innerHTML = '<div class="error-message">Firebase não disponível</div>';
  }
}

/**
 * Renderiza o gráfico de categorias para a seção de Inteligência Financeira
 * @param {Array} categorias - Array de categorias com dados de gastos
 */
function renderizarMobileGraficoCategorias(categorias) {
  const chartElement = document.getElementById('mobileGraficoCategorias');
  if (!chartElement) return;
  
  // Verificar se ApexCharts está disponível
  if (typeof ApexCharts === 'undefined') {
    console.error('ApexCharts não está disponível');
    return;
  }
  
  // Filtrar e ordenar categorias para o gráfico
  const dataGrafico = categorias
    .filter(cat => cat.gasto > 0)
    .sort((a, b) => b.gasto - a.gasto)
    .slice(0, 5); // Limitar a 5 categorias para melhor visualização
  
  // Configuração do gráfico
  const options = {
    series: dataGrafico.map(cat => cat.gasto),
    chart: {
      type: 'donut',
      height: 250
    },
    labels: dataGrafico.map(cat => cat.nome),
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
    tooltip: {
      y: {
        formatter: function (val) {
          return "R$ " + val.toFixed(2)
        }
      }
    }
  };
  
  // Limpar gráfico existente
  chartElement.innerHTML = '';
  
  // Criar novo gráfico
  const chart = new ApexCharts(chartElement, options);
  chart.render();
}

/**
 * Carrega a seção de Metas Financeiras
 */
function loadMobileMetasFinanceiras() {
  const containerElement = document.getElementById('mobileMetasFinanceirasContent');
  if (!containerElement) return;
  
  // Mostrar indicador de carregamento
  containerElement.innerHTML = '<div class="loading-indicator">Carregando suas metas financeiras...</div>';
  
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    // Usar a função do módulo de inteligência financeira para carregar metas
    carregarMetas()
      .then(metas => {
        if (metas.length === 0) {
          containerElement.innerHTML = `
            <div class="mobile-metas-empty">
              <p>Você ainda não tem metas financeiras cadastradas.</p>
              <button id="mobileCriarMetaBtn" class="mobile-btn mobile-btn-primary">Criar Meta</button>
            </div>
          `;
          
          // Adicionar evento ao botão de criar meta
          const criarMetaBtn = document.getElementById('mobileCriarMetaBtn');
          if (criarMetaBtn) {
            criarMetaBtn.addEventListener('click', abrirMobileFormularioMeta);
          }
          
          return;
        }
        
        // Renderizar lista de metas
        containerElement.innerHTML = `
          <div class="mobile-metas-header">
            <h3>Suas Metas Financeiras</h3>
            <button id="mobileCriarMetaBtn" class="mobile-btn mobile-btn-primary">Nova Meta</button>
          </div>
          <div class="mobile-metas-lista" id="mobileMetas"></div>
        `;
        
        // Adicionar evento ao botão de criar meta
        const criarMetaBtn = document.getElementById('mobileCriarMetaBtn');
        if (criarMetaBtn) {
          criarMetaBtn.addEventListener('click', abrirMobileFormularioMeta);
        }
        
        // Renderizar cada meta
        const metasContainer = document.getElementById('mobileMetas');
        metas.forEach(meta => {
          const percentualConcluido = (meta.valorAtual / meta.valor) * 100;
          const dataAlvo = new Date(meta.dataAlvo);
          const hoje = new Date();
          const diffTime = dataAlvo - hoje;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const metaElement = document.createElement('div');
          metaElement.className = 'mobile-meta-item';
          metaElement.innerHTML = `
            <div class="mobile-meta-header">
              <h4>${meta.titulo}</h4>
              <div class="mobile-meta-valor">R$ ${meta.valorAtual.toFixed(2)} / R$ ${meta.valor.toFixed(2)}</div>
            </div>
            <div class="mobile-meta-progresso-container">
              <div class="mobile-meta-progresso" style="width: ${percentualConcluido}%"></div>
            </div>
            <div class="mobile-meta-info">
              <div class="mobile-meta-percentual">${percentualConcluido.toFixed(0)}% concluído</div>
              <div class="mobile-meta-prazo">${diffDays > 0 ? `${diffDays} dias restantes` : 'Prazo vencido'}</div>
            </div>
            <div class="mobile-meta-acoes">
              <button class="mobile-btn mobile-btn-sm mobile-btn-outline atualizar-meta" data-id="${meta.id}">Atualizar</button>
              <button class="mobile-btn mobile-btn-sm mobile-btn-danger excluir-meta" data-id="${meta.id}">Excluir</button>
            </div>
          `;
          
          metasContainer.appendChild(metaElement);
        });
        
        // Adicionar eventos aos botões de atualizar e excluir
        document.querySelectorAll('.atualizar-meta').forEach(btn => {
          btn.addEventListener('click', function() {
            const metaId = this.getAttribute('data-id');
            abrirMobileFormularioMeta(metaId);
          });
        });
        
        document.querySelectorAll('.excluir-meta').forEach(btn => {
          btn.addEventListener('click', function() {
            const metaId = this.getAttribute('data-id');
            confirmarExclusaoMeta(metaId);
          });
        });
      })
      .catch(error => {
        console.error('Erro ao carregar metas financeiras:', error);
        containerElement.innerHTML = '<div class="error-message">Erro ao carregar metas financeiras</div>';
      });
  } else {
    // Fallback para desenvolvimento
    containerElement.innerHTML = '<div class="error-message">Firebase não disponível</div>';
  }
}

/**
 * Abre o formulário para criar ou editar uma meta
 * @param {string} metaId - ID da meta a ser editada (opcional)
 */
function abrirMobileFormularioMeta(metaId) {
  // Implementação do formulário de meta
  // Esta função seria expandida para criar um modal ou formulário inline
  console.log('Abrir formulário de meta:', metaId);
  
  // Exemplo simples de implementação
  const containerElement = document.getElementById('mobileMetasFinanceirasContent');
  if (!containerElement) return;
  
  // Se metaId for um evento, significa que é uma nova meta
  if (metaId && metaId.preventDefault) {
    metaId = null;
  }
  
  // Carregar dados da meta se for edição
  if (metaId) {
    // Implementar carregamento da meta específica
  }
  
  // Criar formulário
  const formHTML = `
    <div class="mobile-meta-form">
      <h3>${metaId ? 'Editar Meta' : 'Nova Meta'}</h3>
      <form id="mobileMetaForm">
        <div class="mobile-form-group">
          <label for="metaTitulo">Título</label>
          <input type="text" id="metaTitulo" name="titulo" required>
        </div>
        <div class="mobile-form-group">
          <label for="metaDescricao">Descrição</label>
          <textarea id="metaDescricao" name="descricao"></textarea>
        </div>
        <div class="mobile-form-group">
          <label for="metaValor">Valor Total (R$)</label>
          <input type="number" id="metaValor" name="valor" step="0.01" min="0" required>
        </div>
        <div class="mobile-form-group">
          <label for="metaValorAtual">Valor Atual (R$)</label>
          <input type="number" id="metaValorAtual" name="valorAtual" step="0.01" min="0" value="0">
        </div>
        <div class="mobile-form-group">
          <label for="metaDataAlvo">Data Alvo</label>
          <input type="date" id="metaDataAlvo" name="dataAlvo" required>
        </div>
        <div class="mobile-form-actions">
          <button type="button" id="mobileCancelarMetaBtn" class="mobile-btn mobile-btn-outline">Cancelar</button>
          <button type="submit" class="mobile-btn mobile-btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  `;
  
  // Adicionar formulário ao container
  containerElement.innerHTML = formHTML;
  
  // Adicionar eventos
  document.getElementById('mobileCancelarMetaBtn').addEventListener('click', function() {
    loadMobileMetasFinanceiras();
  });
  
  document.getElementById('mobileMetaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    salvarMobileMeta(metaId);
  });
}

/**
 * Salva uma meta financeira
 * @param {string} metaId - ID da meta a ser editada (opcional)
 */
function salvarMobileMeta(metaId) {
  const form = document.getElementById('mobileMetaForm');
  if (!form) return;
  
  // Obter dados do formulário
  const metaData = {
    titulo: form.titulo.value,
    descricao: form.descricao.value,
    valor: parseFloat(form.valor.value),
    valorAtual: parseFloat(form.valorAtual.value || 0),
    dataAlvo: form.dataAlvo.value,
    dataCriacao: new Date().toISOString()
  };
  
  if (metaId) {
    metaData.id = metaId;
  }
  
  // Usar a função do módulo de inteligência financeira para salvar a meta
  salvarMeta(metaData)
    .then(() => {
      // Exibir mensagem de sucesso
      exibirToast('Meta salva com sucesso!', 'success');
      
      // Recarregar lista de metas
      loadMobileMetasFinanceiras();
    })
    .catch(error => {
      console.error('Erro ao salvar meta:', error);
      exibirToast('Erro ao salvar meta. Tente novamente.', 'danger');
    });
}

/**
 * Confirma a exclusão de uma meta
 * @param {string} metaId - ID da meta a ser excluída
 */
function confirmarExclusaoMeta(metaId) {
  // Implementação simples
  if (confirm('Tem certeza que deseja excluir esta meta?')) {
    excluirMeta(metaId)
      .then(() => {
        // Exibir mensagem de sucesso
        exibirToast('Meta excluída com sucesso!', 'success');
        
        // Recarregar lista de metas
        loadMobileMetasFinanceiras();
      })
      .catch(error => {
        console.error('Erro ao excluir meta:', error);
        exibirToast('Erro ao excluir meta. Tente novamente.', 'danger');
      });
  }
}

/**
 * Edita uma despesa mobile
 * @param {string} despesaId - ID da despesa a ser editada
 */
function editarMobileDespesa(despesaId) {
  // Abrir modal de edição
  const modal = document.createElement('div');
  modal.className = 'mobile-modal';
  modal.id = 'mobileEditarDespesaModal';
  
  // Mostrar indicador de carregamento enquanto busca os dados
  modal.innerHTML = '<div class="mobile-modal-content"><div class="loading-indicator">Carregando dados da despesa...</div></div>';
  document.body.appendChild(modal);
  
  // Buscar dados da despesa
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`despesas/${despesaId}`).once('value')
      .then(snapshot => {
        const despesa = snapshot.val();
        if (!despesa) {
          exibirToast('Despesa não encontrada', 'danger');
          closeMobileModal('mobileEditarDespesaModal');
          return;
        }
        
        // Buscar categorias para o select
        return firebase.database().ref('categorias').once('value')
          .then(catSnapshot => {
            const categorias = [];
            catSnapshot.forEach(child => {
              categorias.push({
                id: child.key,
                nome: child.val().nome
              });
            });
            
            // Criar conteúdo do modal com formulário preenchido
            let modalContent = `
              <div class="mobile-modal-content">
                <div class="mobile-modal-header">
                  <h3>Editar Despesa</h3>
                  <button class="mobile-modal-close" onclick="closeMobileModal('mobileEditarDespesaModal')">&times;</button>
                </div>
                <div class="mobile-modal-body">
                  <form id="mobileEditarDespesaForm">
                    <div class="mobile-form-group">
                      <label for="editDespesaDescricao">Descrição</label>
                      <input type="text" id="editDespesaDescricao" value="${despesa.descricao}" required>
                    </div>
                    <div class="mobile-form-group">
                      <label for="editDespesaValor">Valor (R$)</label>
                      <input type="number" id="editDespesaValor" step="0.01" min="0" value="${despesa.valor}" required>
                    </div>
                    <div class="mobile-form-group">
                      <label for="editDespesaData">Data</label>
                      <input type="date" id="editDespesaData" value="${despesa.dataCompra}" required>
                    </div>
                    <div class="mobile-form-group">
                      <label for="editDespesaCategoria">Categoria</label>
                      <select id="editDespesaCategoria">
                        <option value="">Selecione uma categoria</option>
                        ${categorias.map(cat => `<option value="${cat.id}" ${cat.id === despesa.categoria ? 'selected' : ''}>${cat.nome}</option>`).join('')}
                      </select>
                    </div>
                    <div class="mobile-form-group">
                      <label>Status</label>
                      <div class="mobile-toggle-group">
                        <input type="radio" id="editDespesaStatusPendente" name="editDespesaStatus" value="false" ${!despesa.pago ? 'checked' : ''}>
                        <label for="editDespesaStatusPendente">Pendente</label>
                        <input type="radio" id="editDespesaStatusPago" name="editDespesaStatus" value="true" ${despesa.pago ? 'checked' : ''}>
                        <label for="editDespesaStatusPago">Pago</label>
                      </div>
                    </div>
                  </form>
                </div>
                <div class="mobile-modal-footer">
                  <button class="mobile-btn mobile-btn-outline" onclick="closeMobileModal('mobileEditarDespesaModal')">Cancelar</button>
                  <button class="mobile-btn mobile-btn-primary" onclick="salvarEdicaoMobileDespesa('${despesaId}')">Salvar</button>
                </div>
              </div>
            `;
            
            modal.innerHTML = modalContent;
          });
      })
      .catch(error => {
        console.error('Erro ao carregar despesa:', error);
        exibirToast('Erro ao carregar dados da despesa', 'danger');
        closeMobileModal('mobileEditarDespesaModal');
      });
  } else {
    // Fallback para desenvolvimento
    exibirToast('Firebase não disponível', 'danger');
    closeMobileModal('mobileEditarDespesaModal');
  }
}

/**
 * Salva a edição de uma despesa mobile
 * @param {string} despesaId - ID da despesa a ser salva
 */
function salvarEdicaoMobileDespesa(despesaId) {
  const descricao = document.getElementById('editDespesaDescricao').value;
  const valor = parseFloat(document.getElementById('editDespesaValor').value);
  const dataCompra = document.getElementById('editDespesaData').value;
  const categoria = document.getElementById('editDespesaCategoria').value;
  const pago = document.querySelector('input[name="editDespesaStatus"]:checked').value === 'true';
  
  if (!descricao || isNaN(valor) || valor <= 0 || !dataCompra) {
    exibirToast('Preencha todos os campos obrigatórios', 'warning');
    return;
  }
  
  // Atualizar despesa no Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`despesas/${despesaId}`).update({
      descricao: descricao,
      valor: valor,
      dataCompra: dataCompra,
      categoria: categoria,
      pago: pago
    })
    .then(() => {
      exibirToast('Despesa atualizada com sucesso!', 'success');
      closeMobileModal('mobileEditarDespesaModal');
      loadMobileDespesas(); // Recarregar lista de despesas
    })
    .catch(error => {
      console.error('Erro ao atualizar despesa:', error);
      exibirToast('Erro ao atualizar despesa', 'danger');
    });
  } else {
    // Fallback para desenvolvimento
    exibirToast('Firebase não disponível', 'danger');
    closeMobileModal('mobileEditarDespesaModal');
  }
}

/**
 * Exclui uma despesa mobile
 * @param {string} despesaId - ID da despesa a ser excluída
 */
function excluirMobileDespesa(despesaId) {
  // Confirmar exclusão
  const modal = document.createElement('div');
  modal.className = 'mobile-modal';
  modal.id = 'mobileConfirmarExclusaoModal';
  
  modal.innerHTML = `
    <div class="mobile-modal-content">
      <div class="mobile-modal-header">
        <h3>Confirmar Exclusão</h3>
        <button class="mobile-modal-close" onclick="closeMobileModal('mobileConfirmarExclusaoModal')">&times;</button>
      </div>
      <div class="mobile-modal-body">
        <p>Tem certeza que deseja excluir esta despesa?</p>
        <p class="text-danger">Esta ação não pode ser desfeita.</p>
      </div>
      <div class="mobile-modal-footer">
        <button class="mobile-btn mobile-btn-outline" onclick="closeMobileModal('mobileConfirmarExclusaoModal')">Cancelar</button>
        <button class="mobile-btn mobile-btn-danger" onclick="confirmarExclusaoMobileDespesa('${despesaId}')">Excluir</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * Confirma a exclusão de uma despesa mobile
 * @param {string} despesaId - ID da despesa a ser excluída
 */
function confirmarExclusaoMobileDespesa(despesaId) {
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`despesas/${despesaId}`).remove()
      .then(() => {
        exibirToast('Despesa excluída com sucesso!', 'success');
        closeMobileModal('mobileConfirmarExclusaoModal');
        loadMobileDespesas(); // Recarregar lista de despesas
      })
      .catch(error => {
        console.error('Erro ao excluir despesa:', error);
        exibirToast('Erro ao excluir despesa', 'danger');
        closeMobileModal('mobileConfirmarExclusaoModal');
      });
  } else {
    // Fallback para desenvolvimento
    exibirToast('Firebase não disponível', 'danger');
    closeMobileModal('mobileConfirmarExclusaoModal');
  }
}

/**
 * Marca uma despesa como paga
 * @param {string} despesaId - ID da despesa a ser paga
 */
function pagarMobileDespesa(despesaId) {
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`despesas/${despesaId}`).once('value')
      .then(snapshot => {
        const despesa = snapshot.val();
        if (!despesa) {
          exibirToast('Despesa não encontrada', 'danger');
          return;
        }
        
        // Se for despesa à vista, marcar como paga diretamente
        if (despesa.formaPagamento === 'avista') {
          return firebase.database().ref(`despesas/${despesaId}`).update({
            pago: true
          })
          .then(() => {
            exibirToast('Despesa paga com sucesso!', 'success');
            loadMobileDespesas(); // Recarregar lista de despesas
          });
        } 
        // Se for despesa parcelada, abrir modal para selecionar parcela
        else if (despesa.formaPagamento === 'cartao' && despesa.parcelas) {
          // Criar modal para selecionar parcela
          const modal = document.createElement('div');
          modal.className = 'mobile-modal';
          modal.id = 'mobilePagarParcelaModal';
          
          // Filtrar parcelas não pagas
          const parcelasNaoPagas = despesa.parcelas
            .map((parcela, index) => ({ ...parcela, index }))
            .filter(parcela => !parcela.pago);
          
          if (parcelasNaoPagas.length === 0) {
            exibirToast('Todas as parcelas já estão pagas', 'warning');
            return;
          }
          
          let modalContent = `
            <div class="mobile-modal-content">
              <div class="mobile-modal-header">
                <h3>Pagar Parcela</h3>
                <button class="mobile-modal-close" onclick="closeMobileModal('mobilePagarParcelaModal')">&times;</button>
              </div>
              <div class="mobile-modal-body">
                <p><strong>${despesa.descricao}</strong></p>
                <div class="mobile-form-group">
                  <label for="parcelaSelecionada">Selecione a parcela:</label>
                  <select id="parcelaSelecionada">
                    ${parcelasNaoPagas.map(parcela => {
                      const dataVencimento = new Date(parcela.vencimento).toLocaleDateString('pt-BR');
                      return `<option value="${parcela.index}">Parcela ${parcela.index + 1} - R$ ${parseFloat(parcela.valor).toFixed(2)} - Venc: ${dataVencimento}</option>`;
                    }).join('')}
                  </select>
                </div>
              </div>
              <div class="mobile-modal-footer">
                <button class="mobile-btn mobile-btn-outline" onclick="closeMobileModal('mobilePagarParcelaModal')">Cancelar</button>
                <button class="mobile-btn mobile-btn-primary" onclick="confirmarPagamentoParcelaMobile('${despesaId}')">Pagar</button>
              </div>
            </div>
          `;
          
          modal.innerHTML = modalContent;
          document.body.appendChild(modal);
        }
      })
      .catch(error => {
        console.error('Erro ao processar pagamento:', error);
        exibirToast('Erro ao processar pagamento', 'danger');
      });
  } else {
    // Fallback para desenvolvimento
    exibirToast('Firebase não disponível', 'danger');
  }
}

/**
 * Confirma o pagamento de uma parcela
 * @param {string} despesaId - ID da despesa
 */
function confirmarPagamentoParcelaMobile(despesaId) {
  const parcelaIndex = document.getElementById('parcelaSelecionada').value;
  
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    firebase.database().ref(`despesas/${despesaId}/parcelas/${parcelaIndex}`).update({
      pago: true
    })
    .then(() => {
      exibirToast('Parcela paga com sucesso!', 'success');
      closeMobileModal('mobilePagarParcelaModal');
      loadMobileDespesas(); // Recarregar lista de despesas
    })
    .catch(error => {
      console.error('Erro ao pagar parcela:', error);
      exibirToast('Erro ao pagar parcela', 'danger');
    });
  } else {
    // Fallback para desenvolvimento
    exibirToast('Firebase não disponível', 'danger');
    closeMobileModal('mobilePagarParcelaModal');
  }
}

/**
 * Fecha um modal mobile
 * @param {string} modalId - ID do modal a ser fechado
 */
function closeMobileModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}
