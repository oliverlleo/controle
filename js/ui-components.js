/**
 * Módulo de Componentes UI para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Sistema de navegação aprimorado com submenus
 * - Tabs dentro das seções
 * - Componentes de UI reutilizáveis
 */

'use strict';

/**
 * Inicializa os componentes de UI aprimorados
 */
function initUIComponents() {
  setupNavigation();
  setupSectionTabs();
  setupResponsiveMenu();
}

/**
 * Configura o sistema de navegação com submenus
 */
function setupNavigation() {
  // Adicionar listeners para os itens de menu com submenu
  document.querySelectorAll('.nav-link-with-submenu').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Toggle classe expanded no link
      this.classList.toggle('expanded');
      
      // Toggle submenu
      const submenu = this.nextElementSibling;
      if (submenu && submenu.classList.contains('submenu')) {
        submenu.classList.toggle('open');
      }
    });
  });
  
  // Ativar link atual baseado na URL ou seção ativa
  activateCurrentNavLink();
}

/**
 * Ativa o link de navegação atual baseado na seção ativa
 */
function activateCurrentNavLink() {
  // Encontrar seção ativa
  const activeSection = document.querySelector('main > section[style*="display: block"]');
  if (!activeSection) return;
  
  const sectionId = activeSection.id;
  
  // Remover classe active de todos os links
  document.querySelectorAll('.nav-link, .submenu-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Ativar link correspondente
  const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
  if (navLink) {
    navLink.classList.add('active');
    
    // Se for um submenu, abrir o menu pai
    const parentSubmenu = navLink.closest('.submenu');
    if (parentSubmenu) {
      parentSubmenu.classList.add('open');
      const parentLink = parentSubmenu.previousElementSibling;
      if (parentLink) {
        parentLink.classList.add('expanded');
      }
    }
  } else {
    // Verificar se é um submenu-link
    const submenuLink = document.querySelector(`.submenu-link[data-section="${sectionId}"]`);
    if (submenuLink) {
      submenuLink.classList.add('active');
      
      // Abrir o menu pai
      const parentSubmenu = submenuLink.closest('.submenu');
      if (parentSubmenu) {
        parentSubmenu.classList.add('open');
        const parentLink = parentSubmenu.previousElementSibling;
        if (parentLink) {
          parentLink.classList.add('expanded');
        }
      }
    }
  }
}

/**
 * Configura as tabs dentro das seções
 */
function setupSectionTabs() {
  document.querySelectorAll('.section-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabGroup = this.closest('.section-tabs');
      const contentId = this.dataset.content;
      
      // Desativar todas as tabs no grupo
      tabGroup.querySelectorAll('.section-tab').forEach(t => {
        t.classList.remove('active');
      });
      
      // Ativar tab atual
      this.classList.add('active');
      
      // Esconder todos os conteúdos relacionados
      const tabContents = document.querySelectorAll(`.tab-content[data-tab-group="${tabGroup.dataset.tabGroup}"]`);
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      
      // Mostrar conteúdo selecionado
      const selectedContent = document.getElementById(contentId);
      if (selectedContent) {
        selectedContent.style.display = 'block';
      }
    });
  });
  
  // Ativar primeira tab em cada grupo por padrão
  document.querySelectorAll('.section-tabs').forEach(tabGroup => {
    const firstTab = tabGroup.querySelector('.section-tab');
    if (firstTab) {
      firstTab.click();
    }
  });
}

/**
 * Configura o menu responsivo para dispositivos móveis
 */
function setupResponsiveMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('expanded');
      this.classList.toggle('active');
    });
  }
  
  // Fechar menu ao clicar em um link (em dispositivos móveis)
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  if (mediaQuery.matches) {
    document.querySelectorAll('#sidebar .nav-link, #sidebar .submenu-link').forEach(link => {
      link.addEventListener('click', function() {
        if (!this.classList.contains('nav-link-with-submenu')) {
          sidebar.classList.remove('expanded');
          if (menuToggle) {
            menuToggle.classList.remove('active');
          }
        }
      });
    });
  }
}

/**
 * Mostra uma seção específica e esconde as demais
 * Versão aprimorada da função original
 * @param {string} sectionId - ID da seção a ser mostrada
 */
function showSectionEnhanced(sectionId) {
  const sections = document.querySelectorAll('main > section');
  sections.forEach(sec => sec.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';
  
  // Atualizar navegação
  activateCurrentNavLink();
  
  // Inicializar componentes específicos da seção
  if (sectionId === 'previsaoSection') {
    if (typeof novo_calcularPrevisoes === 'function') {
      novo_calcularPrevisoes();
    }
  } else if (sectionId === 'alertasSection') {
    if (typeof novo_verificarAlertas === 'function') {
      novo_verificarAlertas();
    }
  } else if (sectionId === 'financasSection') {
    // Inicializar componentes da nova seção de finanças
    if (typeof initFinancasSection === 'function') {
      initFinancasSection();
    }
  } else if (sectionId === 'metasSection') {
    // Inicializar componentes da nova seção de metas
    if (typeof initMetasSection === 'function') {
      initMetasSection();
    }
  }
}

/**
 * Cria um card de dashboard
 * @param {Object} options - Opções do card
 * @returns {HTMLElement} - Elemento do card
 */
function createDashboardCard(options) {
  const card = document.createElement('div');
  card.className = 'dashboard-card';
  
  if (options.color) {
    card.style.borderLeftColor = options.color;
  }
  
  const header = document.createElement('div');
  header.className = 'dashboard-card-header';
  
  const title = document.createElement('div');
  title.className = 'dashboard-card-title';
  title.textContent = options.title || '';
  
  header.appendChild(title);
  
  if (options.icon) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'dashboard-card-icon';
    
    const icon = document.createElement('i');
    icon.className = options.icon;
    
    iconContainer.appendChild(icon);
    header.appendChild(iconContainer);
  }
  
  card.appendChild(header);
  
  const value = document.createElement('div');
  value.className = 'dashboard-card-value';
  value.textContent = options.value || '';
  card.appendChild(value);
  
  if (options.label) {
    const label = document.createElement('div');
    label.className = 'dashboard-card-label';
    label.textContent = options.label;
    card.appendChild(label);
  }
  
  return card;
}

/**
 * Cria um card de meta
 * @param {Object} options - Opções do card de meta
 * @returns {HTMLElement} - Elemento do card de meta
 */
function createMetaCard(options) {
  const card = document.createElement('div');
  card.className = 'meta-card';
  
  const header = document.createElement('div');
  header.className = 'meta-header';
  
  const title = document.createElement('div');
  title.className = 'meta-title';
  title.textContent = options.title || '';
  
  const value = document.createElement('div');
  value.className = 'meta-value';
  value.textContent = options.value || '';
  
  header.appendChild(title);
  header.appendChild(value);
  card.appendChild(header);
  
  const progress = document.createElement('div');
  progress.className = 'meta-progress';
  
  const progressBar = document.createElement('div');
  progressBar.className = 'meta-progress-bar';
  progressBar.style.width = `${options.progress || 0}%`;
  
  progress.appendChild(progressBar);
  card.appendChild(progress);
  
  const details = document.createElement('div');
  details.className = 'meta-details';
  
  const current = document.createElement('div');
  current.textContent = options.current || '';
  
  const target = document.createElement('div');
  target.textContent = options.target || '';
  
  details.appendChild(current);
  details.appendChild(target);
  card.appendChild(details);
  
  return card;
}

/**
 * Cria um badge
 * @param {string} text - Texto do badge
 * @param {string} type - Tipo do badge (primary, success, warning, danger)
 * @returns {HTMLElement} - Elemento do badge
 */
function createBadge(text, type = 'primary') {
  const badge = document.createElement('span');
  badge.className = `badge badge-${type}`;
  badge.textContent = text;
  return badge;
}

/**
 * Cria um alerta
 * @param {Object} options - Opções do alerta
 * @returns {HTMLElement} - Elemento do alerta
 */
function createAlerta(options) {
  const alerta = document.createElement('div');
  alerta.className = `alerta-item alerta-${options.tipo || 'primary'}`;
  
  if (options.critico) {
    alerta.classList.add('alerta-critico');
  }
  
  const icon = document.createElement('div');
  icon.className = 'alerta-icon';
  
  const iconElement = document.createElement('i');
  iconElement.className = options.icon || 'fas fa-info-circle';
  
  icon.appendChild(iconElement);
  alerta.appendChild(icon);
  
  const content = document.createElement('div');
  content.className = 'alerta-content';
  
  const title = document.createElement('div');
  title.className = 'alerta-title';
  title.textContent = options.titulo || '';
  
  content.appendChild(title);
  
  if (options.detalhes) {
    const details = document.createElement('div');
    details.className = 'alerta-details';
    
    options.detalhes.forEach(detalhe => {
      const span = document.createElement('span');
      span.textContent = detalhe;
      details.appendChild(span);
    });
    
    content.appendChild(details);
  }
  
  alerta.appendChild(content);
  
  return alerta;
}

// Exportar funções
window.initUIComponents = initUIComponents;
window.showSectionEnhanced = showSectionEnhanced;
window.createDashboardCard = createDashboardCard;
window.createMetaCard = createMetaCard;
window.createBadge = createBadge;
window.createAlerta = createAlerta;
