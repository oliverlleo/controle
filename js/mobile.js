// Script mobile para o Sistema de Gerenciamento de Contas Pessoais

// Função para inicializar ajustes específicos para mobile
function initMobileAdjustments() {
  // Melhorar a experiência do menu lateral em dispositivos móveis
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    // Adicionar evento de toque para fechar o menu ao clicar fora dele
    document.addEventListener('click', function(event) {
      // Verificar se o clique foi fora do menu e se o menu está aberto
      if (!sidebar.contains(event.target) && 
          !menuToggle.contains(event.target) && 
          sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
    
    // Adicionar evento de toque para fechar o menu ao clicar no X (pseudo-elemento)
    sidebar.addEventListener('click', function(event) {
      // Calcular a posição do clique relativa ao sidebar
      const rect = sidebar.getBoundingClientRect();
      const isTopRight = (event.clientX > rect.right - 50) && (event.clientY < rect.top + 50);
      
      if (isTopRight && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
      }
    });
    
    // Fechar menu ao clicar em um link do menu
    const navLinks = document.querySelectorAll('#sidebar-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      });
    });
  }
  
  // Melhorar a experiência de tabelas em dispositivos móveis
  const tableContainers = document.querySelectorAll('.table-container');
  tableContainers.forEach(container => {
    // Adicionar indicador de rolagem apenas se a tabela for maior que o contêiner
    const table = container.querySelector('table');
    if (table && table.offsetWidth > container.offsetWidth) {
      container.classList.add('scrollable');
    }
  });
  
  // Otimizar modais para dispositivos móveis
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    // Ajustar posição do modal ao abrir
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modal.addEventListener('click', function(event) {
        // Fechar modal ao clicar fora do conteúdo
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  });
  
  // Melhorar a experiência de formulários em dispositivos móveis
  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach(group => {
    const input = group.querySelector('input, select, textarea');
    const label = group.querySelector('label');
    
    if (input && label) {
      // Garantir que o label esteja associado ao input
      if (!label.getAttribute('for') && input.id) {
        label.setAttribute('for', input.id);
      }
    }
  });
  
  // Otimizar gráficos para dispositivos móveis
  if (window.ApexCharts) {
    // Ajustar opções globais para gráficos em dispositivos móveis
    const originalInit = ApexCharts.prototype.init;
    ApexCharts.prototype.init = function() {
      // Chamar o método original primeiro
      const result = originalInit.apply(this, arguments);
      
      // Modificar opções apenas para dispositivos móveis
      if (window.innerWidth <= 768) {
        // Ajustar opções para melhor visualização em telas pequenas
        if (this.w.config.legend) {
          this.w.config.legend.position = 'bottom';
          this.w.config.legend.fontSize = '12px';
        }
        
        // Reduzir padding para maximizar área de visualização
        if (this.w.config.chart) {
          this.w.config.chart.offsetX = 0;
          this.w.config.chart.offsetY = 0;
        }
      }
      
      return result;
    };
  }
}

// Inicializar ajustes mobile quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  initMobileAdjustments();
  
  // Reinicializar ajustes ao redimensionar a janela
  window.addEventListener('resize', function() {
    initMobileAdjustments();
  });
});
