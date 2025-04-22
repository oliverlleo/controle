// Adicionar no início do arquivo, após as variáveis globais
const mobilePerformance = {
  lastDataFetch: {},
  cache: {},
  debounceTimers: {}
};

// Substituir a função initializeMobileApp
function initializeMobileApp() {
  // Configurações iniciais
  setupMobileNavigation();
  loadMobileUserInfo();
  setupMobileEvents();
  
  // Carregar apenas a seção ativa inicialmente
  initializeMobileSection(mobileCurrentSection);
  
  // Configurar gestos
  setupMobileGestures();
  
  // Configurar pull-to-refresh
  setupPullToRefresh();
  
  // Verificar conexão
  checkConnection();
}

// Nova função para verificar conexão
function checkConnection() {
  const connectionInfo = document.createElement('div');
  connectionInfo.id = 'mobileConnectionInfo';
  connectionInfo.style.position = 'fixed';
  connectionInfo.style.bottom = '10px';
  connectionInfo.style.left = '50%';
  connectionInfo.style.transform = 'translateX(-50%)';
  connectionInfo.style.padding = '5px 10px';
  connectionInfo.style.borderRadius = '20px';
  connectionInfo.style.backgroundColor = '#4cc9f0';
  connectionInfo.style.color = 'white';
  connectionInfo.style.fontSize = '12px';
  connectionInfo.style.zIndex = '1000';
  connectionInfo.style.display = 'none';
  document.body.appendChild(connectionInfo);

  function updateConnectionStatus() {
    const isOnline = navigator.onLine;
    const connectionElement = document.getElementById('mobileConnectionInfo');
    
    if (!isOnline) {
      connectionElement.textContent = 'Você está offline';
      connectionElement.style.backgroundColor = '#f72585';
      connectionElement.style.display = 'block';
      
      // Tentar reconexão a cada 5 segundos
      setTimeout(checkConnection, 5000);
    } else {
      connectionElement.textContent = 'Conexão restabelecida';
      connectionElement.style.backgroundColor = '#4cc9f0';
      
      setTimeout(() => {
        connectionElement.style.display = 'none';
      }, 3000);
    }
  }

  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();
}

// Nova função para pull-to-refresh
function setupPullToRefresh() {
  let startY;
  const mainElement = document.querySelector('.mobile-main');
  
  if (!mainElement) return;

  mainElement.addEventListener('touchstart', (e) => {
    if (window.scrollY <= 0) {
      startY = e.touches[0].pageY;
    }
  }, { passive: true });

  mainElement.addEventListener('touchmove', (e) => {
    if (startY && e.touches[0].pageY > startY + 50) {
      // Atualizar a seção atual quando o usuário puxar para baixo
      initializeMobileSection(mobileCurrentSection);
      startY = null;
    }
  }, { passive: true });
}

// Atualizar a função showMobileSection para carregamento lazy
function showMobileSection(sectionId) {
  // Converter ID da seção desktop para ID da seção mobile
  const mobileSectionId = 'mobile' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  
  // Se já é a seção atual, não fazer nada
  if (mobileCurrentSection === mobileSectionId) return;
  
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
    
    updateMobileHeader(mobileSectionId);
    initializeMobileSection(mobileSectionId);
    
    // Rastrear navegação para analytics
    trackNavigation(mobileSectionId);
  }
}

// Nova função para trackear navegação
function trackNavigation(sectionId) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'navigation', {
      'section': sectionId.replace('mobile', '').replace('Section', ''),
      'user_id': mobileCurrentUser ? mobileCurrentUser.uid : 'anonymous'
    });
  }
}

// Implementar gestos de deslize
function setupMobileGestures() {
  let startX, startY;
  const mainElement = document.querySelector('.mobile-main');
  const sectionsOrder = [
    'mobileDashboardSection',
    'mobileDespesasSection',
    'mobileRelatorioIntegradoSection',
    'mobileInteligenciaFinanceiraSection',
    'mobileMetasFinanceirasSection',
    'mobileConfiguracoesSection',
    'mobileAlertasSection'
  ];
  
  if (!mainElement) return;

  mainElement.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  mainElement.addEventListener('touchmove', (e) => {
    if (!startX || !startY) return;
    
    const diffX = e.touches[0].clientX - startX;
    const diffY = e.touches[0].clientY - startY;
    
    // Verificar se é um deslize horizontal (não vertical)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault(); // Prevenir scroll vertical
    }
  });

  mainElement.addEventListener('touchend', (e) => {
    if (!startX || !startY) return;
    
    const diffX = e.changedTouches[0].clientX - startX;
    const diffY = e.changedTouches[0].clientY - startY;
    
    // Verificar se é um deslize horizontal significativo
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      const currentIndex = sectionsOrder.indexOf(mobileCurrentSection);
      
      if (diffX > 0 && currentIndex > 0) {
        // Deslize para a direita - ir para seção anterior
        const prevSection = document.querySelector(`[data-section="${sectionsOrder[currentIndex-1].replace('mobile', '').replace('Section', '')}"]`);
        if (prevSection) prevSection.click();
      } else if (diffX < 0 && currentIndex < sectionsOrder.length - 1) {
        // Deslize para a esquerda - ir para próxima seção
        const nextSection = document.querySelector(`[data-section="${sectionsOrder[currentIndex+1].replace('mobile', '').replace('Section', '')}"]`);
        if (nextSection) nextSection.click();
      }
    }
    
    startX = null;
    startY = null;
  }, { passive: true });
}

// Atualizar a função saveMobileDespesa para melhor tratamento offline
function saveMobileDespesa() {
  const descricao = document.getElementById('mobileDescricaoDespesa').value;
  const valor = document.getElementById('mobileValorDespesa').value;
  const data = document.getElementById('mobileDataDespesa').value;
  const categoria = document.getElementById('mobileCategoriaDespesa').value;
  const status = document.getElementById('mobileStatusDespesa').value;
  
  if (!descricao || !valor || !data || !categoria) {
    exibirToast('Preencha todos os campos obrigatórios.', 'warning');
    return;
  }
  
  const despesa = {
    descricao,
    valor: parseFloat(valor),
    dataCompra: data,
    categoria,
    pago: status === 'pago',
    formaPagamento: 'avista',
    createdAt: new Date().toISOString(),
    userId: mobileCurrentUser ? mobileCurrentUser.uid : null,
    syncStatus: 'pending'
  };
  
  // Verificar conexão
  if (!navigator.onLine) {
    // Salvar no IndexedDB para sincronização posterior
    saveOfflineData('despesas', despesa);
    exibirToast('Despesa salva localmente e será sincronizada quando online.', 'warning');
    closeMobileModal('mobileCadastroDespesaModal');
    return;
  }
  
  // Tentar salvar no Firebase
  if (typeof firebase !== 'undefined' && firebase.database && mobileCurrentUser) {
    const newDespesaRef = firebase.database().ref('despesas').push();
    newDespesaRef.set(despesa)
      .then(() => {
        despesa.syncStatus = 'synced';
        updateOfflineData('despesas', despesa.id, despesa);
        exibirToast('Despesa cadastrada com sucesso!', 'success');
        closeMobileModal('mobileCadastroDespesaModal');
        updateMobileDashboard();
      })
      .catch(error => {
        console.error('Erro ao salvar despesa:', error);
        saveOfflineData('despesas', despesa);
        exibirToast('Despesa salva localmente. Tentaremos sincronizar mais tarde.', 'warning');
        closeMobileModal('mobileCadastroDespesaModal');
      });
  } else {
    // Modo de desenvolvimento/teste
    console.log('Despesa salva (modo de teste):', despesa);
    exibirToast('Despesa cadastrada com sucesso! (modo de teste)', 'success');
    closeMobileModal('mobileCadastroDespesaModal');
    updateMobileDashboard();
  }
}

// Novas funções para suporte offline
function saveOfflineData(collection, data) {
  if (!('indexedDB' in window)) return;
  
  const request = indexedDB.open('MobileFinanceDB', 1);
  
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(collection)) {
      db.createObjectStore(collection, { keyPath: 'id' });
    }
  };
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(collection, 'readwrite');
    const store = transaction.objectStore(collection);
    
    // Gerar ID se não existir
    if (!data.id) {
      data.id = 'offline_' + Date.now();
    }
    
    store.put(data);
  };
}

function updateOfflineData(collection, id, data) {
  if (!('indexedDB' in window)) return;
  
  const request = indexedDB.open('MobileFinanceDB', 1);
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(collection, 'readwrite');
    const store = transaction.objectStore(collection);
    
    store.put(data);
  };
}

function syncOfflineData() {
  if (!('indexedDB' in window)) return;
  
  const request = indexedDB.open('MobileFinanceDB', 1);
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['despesas'], 'readwrite');
    const store = transaction.objectStore('despesas');
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = () => {
      const offlineData = getAllRequest.result;
      
      offlineData.forEach(data => {
        if (data.syncStatus !== 'synced' && typeof firebase !== 'undefined' && firebase.database) {
          const newDespesaRef = firebase.database().ref('despesas').push();
          newDespesaRef.set(data)
            .then(() => {
              data.syncStatus = 'synced';
              store.put(data);
            })
            .catch(error => {
              console.error('Erro ao sincronizar dados offline:', error);
            });
        }
      });
    };
  };
}

// Chamar syncOfflineData quando a conexão for restabelecida
window.addEventListener('online', syncOfflineData);
