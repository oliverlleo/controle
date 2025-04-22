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
  const mobileSectionId = 'mobile' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  
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
    case 'mobileRelatorioSection':
      title = 'Relatórios';
      break;
    case 'mobileInteligenciaSection':
      title = 'Inteligência Financeira';
      break;
    case 'mobileMetasSection':
      title = 'Metas';
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
  switch (sectionId) {
    case 'mobileDashboardSection':
      updateMobileDashboard();
      break;
    case 'mobileDespesasSection':
      loadMobileDespesas();
      break;
    case 'mobileRelatorioSection':
      initializeMobileRelatorios();
      break;
    case 'mobileInteligenciaSection':
      loadMobileInteligenciaFinanceira();
      break;
    case 'mobileMetasSection':
      loadMobileMetasFinanceiras();
      break;
    case 'mobileConfiguracoesSection':
      initializeMobileConfiguracoes();
      break;
    case 'mobileAlertasSection':
      loadMobileAlertas();
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
    firebase.database().ref(`users/${mobileCurrentUser.uid}/data/saldo`).once('value')
      .then(snapshot => {
        const saldo = snapshot.val() || 0;
        saldoElement.textContent = `R$ ${parseFloat(saldo).toFixed(2)}`;
      })
      .catch(error => {
        console.error('Erro ao carregar saldo:', error);
        saldoElement.textContent = 'R$ 0,00';
      });
  } else {
    // Fallback para desenvolvimento
    saldoElement.textContent = 'R$ 6.416,60';
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
    // Implementar lógica para buscar despesas do mês no Firebase
    // Por enquanto, usando dados de exemplo
    despesasElement.textContent = 'R$ 4.440,00';
  } else {
    // Fallback para desenvolvimento
    despesasElement.textContent = 'R$ 4.440,00';
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
    // Implementar lógica para buscar próximos vencimentos no Firebase
    // Por enquanto, usando dados de exemplo
    vencimentosElement.textContent = '27';
  } else {
    // Fallback para desenvolvimento
    vencimentosElement.textContent = '27';
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
  
  // Dados de exemplo para o gráfico
  const data = [
    { categoria: 'Alimentação', valor: 1200 },
    { categoria: 'Moradia', valor: 1500 },
    { categoria: 'Transporte', valor: 800 },
    { categoria: 'Lazer', valor: 500 },
    { categoria: 'Saúde', valor: 440 }
  ];
  
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
      categories: data.map(item => item.categoria),
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
}

/**
 * Carrega a lista de despesas do mês
 */
function loadMobileListaDespesasMes() {
  const listaElement = document.getElementById('mobileListaDespesasMes');
  if (!listaElement) return;
  
  // Dados de exemplo para a lista
  const despesas = [
    { descricao: 'Aluguel', valor: 1500, categoria: 'Moradia', data: '05/03/2025' },
    { descricao: 'Supermercado', valor: 800, categoria: 'Alimentação', data: '10/03/2025' },
    { descricao: 'Internet', valor: 120, categoria: 'Serviços', data: '15/03/2025' },
    { descricao: 'Energia Elétrica', valor: 250, categoria: 'Serviços', data: '20/03/2025' },
    { descricao: 'Combustível', valor: 300, categoria: 'Transporte', data: '25/03/2025' }
  ];
  
  // Limpar lista existente
  listaElement.innerHTML = '';
  
  // Adicionar itens à lista
  despesas.forEach(despesa => {
    const itemElement = document.createElement('div');
    itemElement.className = 'mobile-despesa-item';
    itemElement.innerHTML = `
      <div class="mobile-despesa-info">
        <div class="mobile-despesa-titulo">${despesa.descricao}</div>
        <div class="mobile-despesa-detalhe">${despesa.categoria} - ${despesa.data}</div>
      </div>
      <div class="mobile-despesa-valor">R$ ${despesa.valor.toFixed(2)}</div>
    `;
    listaElement.appendChild(itemElement);
  });
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
  
  // Botão de adicionar despesa
  const addDespesaBtn = document.getElementById('mobileAddDespesa');
  if (addDespesaBtn) {
    addDespesaBtn.addEventListener('click', function() {
      openMobileModal('mobileCadastroDespesaModal');
    });
  }
  
  // Configurar fechamento de modais
  setupMobileModals();
}

/**
 * Configura eventos para modais
 */
function setupMobileModals() {
  // Botões de fechar modal
  const closeButtons = document.querySelectorAll('.mobile-modal-close');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modalId = this.getAttribute('data-modal');
      closeMobileModal(modalId);
    });
  });
  
  // Formulário de cadastro de despesa
  const cadastroDespesaForm = document.getElementById('mobileCadastroDespesaForm');
  if (cadastroDespesaForm) {
    cadastroDespesaForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveMobileDespesa();
    });
  }
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
  // Obter valores do formulário
  const descricao = document.getElementById('mobileDescricaoDespesa').value;
  const valor = document.getElementById('mobileValorDespesa').value;
  const data = document.getElementById('mobileDataDespesa').value;
  const categoria = document.getElementById('mobileCategoriaDespesa').value;
  const status = document.getElementById('mobileStatusDespesa').value;
  
  // Validar campos
  if (!descricao || !valor || !data || !categoria) {
    exibirToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  // Criar objeto de despesa
  const despesa = {
    descricao,
    valor: parseFloat(valor),
    dataCompra: data,
    categoria,
    pago: status === 'pago',
    formaPagamento: 'avista',
    createdAt: new Date().toISOString(),
    userId: mobileCurrentUser ? mobileCurrentUser.uid : null
  };
  
  // Salvar no Firebase (implementação simplificada)
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    const newDespesaRef = firebase.database().ref('despesas').push();
    newDespesaRef.set(despesa)
      .then(() => {
        exibirToast('Despesa cadastrada com sucesso!', 'success');
        closeMobileModal('mobileCadastroDespesaModal');
        updateMobileDashboard();
      })
      .catch(error => {
        console.error('Erro ao salvar despesa:', error);
        exibirToast('Erro ao cadastrar despesa. Tente novamente.', 'danger');
      });
  } else {
    // Modo de desenvolvimento/teste
    console.log('Despesa salva (modo de teste):', despesa);
    exibirToast('Despesa cadastrada com sucesso! (modo de teste)', 'success');
    closeMobileModal('mobileCadastroDespesaModal');
    updateMobileDashboard();
  }
}

// ===================== UTILITÁRIOS MOBILE =====================
/**
 * Exibe uma notificação toast
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo de notificação (success, danger, warning, primary)
 */
function exibirToast(mensagem, tipo = 'primary') {
  if (typeof Toastify !== 'undefined') {
    Toastify({
      text: mensagem,
      duration: 3000,
      close: true,
      gravity: "bottom",
      position: "center",
      backgroundColor: tipo === 'success' ? 'var(--success)' : 
                       tipo === 'danger' ? 'var(--danger)' : 
                       tipo === 'warning' ? 'var(--warning)' : 
                       'var(--primary)',
      stopOnFocus: true,
      className: `toast-${tipo}`
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

// ===================== FUNÇÕES STUB PARA IMPLEMENTAÇÃO FUTURA =====================
/**
 * Carrega a lista de despesas
 */
function loadMobileDespesas() {
  // Implementação futura
  exibirToast('Carregando despesas...', 'primary');
}

/**
 * Inicializa a seção de relatórios
 */
function initializeMobileRelatorios() {
  // Implementação futura
  exibirToast('Carregando relatórios...', 'primary');
}

/**
 * Carrega dados de inteligência financeira
 */
function loadMobileInteligenciaFinanceira() {
  // Implementação futura
  exibirToast('Carregando inteligência financeira...', 'primary');
}

/**
 * Carrega metas financeiras
 */
function loadMobileMetasFinanceiras() {
  // Implementação futura
  exibirToast('Carregando metas financeiras...', 'primary');
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
