/**
 * bridge.js - Script de ponte entre a nova interface e as funcionalidades existentes
 * 
 * Este arquivo contém funções específicas para garantir a compatibilidade
 * entre o novo layout e as funcionalidades originais do sistema.
 */

// Mapeamento de funções antigas para novas
document.addEventListener('DOMContentLoaded', function() {
  // Compatibilidade com sistema de navegação antigo
  window.showSection = function(sectionId) {
    // Mapear seções antigas para novas abas
    const sectionToTab = {
      'dashboardSection': 'dashboard-tab',
      'despesasSection': 'despesas-tab',
      'relatorioSection': 'relatorio-tab',
      'previsaoSection': 'previsao-tab',
      'categoriasSection': 'categorias-tab',
      'cartoesSection': 'cartoes-tab',
      'rendaSection': 'renda-tab',
      'alertasSection': 'previsao-tab'
    };
    
    if (sectionToTab[sectionId]) {
      activateTab(sectionToTab[sectionId]);
    }
  };
  
  // Sobrescrever funções críticas para garantir compatibilidade
  
  // Função original para exibir toast (corrigida para usar style.background)
  const originalExibirToast = window.exibirToast;
  window.exibirToast = function(mensagem, tipo = 'success') {
    let backgroundColor;
    
    switch (tipo) {
      case 'success':
        backgroundColor = 'var(--success)';
        break;
      case 'error':
        backgroundColor = 'var(--danger)';
        break;
      case 'warning':
        backgroundColor = 'var(--warning)';
        break;
      default:
        backgroundColor = 'var(--primary)';
    }
    
    Toastify({
      text: mensagem,
      duration: 3000,
      close: true,
      gravity: "bottom",
      position: "right",
      style: {
        background: backgroundColor
      },
      onClick: function(){}
    }).showToast();
  };
  
  // Garantir que a função filtrarTodasDespesas esteja disponível
  if (!window.filtrarTodasDespesas) {
    window.filtrarTodasDespesas = function() {
      const filtro = document.getElementById('filtroDescricao').value.toLowerCase();
      const despesas = JSON.parse(localStorage.getItem('despesas')) || [];
      
      const despesasFiltradas = despesas.filter(despesa => 
        despesa.descricao.toLowerCase().includes(filtro)
      );
      
      renderizarTabelaDespesas(despesasFiltradas);
    };
  }
  
  // Garantir que a função de inicialização do calendário seja chamada
  const originalRenderCalendar = window.renderCalendar;
  if (originalRenderCalendar) {
    window.renderCalendar = function() {
      originalRenderCalendar();
      
      // Garantir que as classes corretas sejam usadas
      const calendarDays = document.querySelectorAll('#calendarDays .calendar-day');
      calendarDays.forEach(day => {
        day.addEventListener('click', function() {
          if (this.dataset.date) {
            showBalanceForDate(this.dataset.date);
          }
        });
      });
    };
  }
  
  // Garantir que a função de cálculo de previsões seja chamada automaticamente
  if (typeof novo_calcularPrevisoes === 'function') {
    const originalActivateTab = window.activateTab;
    window.activateTab = function(tabId) {
      originalActivateTab(tabId);
      
      // Chamar novo_calcularPrevisoes quando a aba de previsões for ativada
      if (tabId === 'previsao-tab') {
        setTimeout(() => {
          novo_calcularPrevisoes();
        }, 100);
      }
    };
  }
  
  // Corrigir o problema do saldo inicial exibindo NaN
  const originalAtualizarDashboard = window.atualizarDashboard;
  if (originalAtualizarDashboard) {
    window.atualizarDashboard = function() {
      originalAtualizarDashboard();
      
      // Verificar se o saldo atual está exibindo NaN e corrigir
      const saldoAtualElement = document.getElementById('saldoAtual');
      if (saldoAtualElement && saldoAtualElement.textContent.includes('NaN')) {
        saldoAtualElement.textContent = 'R$ 0.00';
      }
    };
  }
  
  // Garantir que os alertas sejam verificados na inicialização
  if (typeof novo_verificarAlertas === 'function') {
    // Chamar a função após um pequeno delay para garantir que todos os componentes estejam carregados
    setTimeout(() => {
      novo_verificarAlertas();
    }, 500);
    
    // Adicionar alertas ao mini-painel de alertas
    const originalMostrarAlerta = window.novo_mostrarAlerta;
    if (originalMostrarAlerta) {
      window.novo_mostrarAlerta = function(titulo, mensagem, tipo) {
        originalMostrarAlerta(titulo, mensagem, tipo);
        
        // Adicionar ao mini-painel de alertas
        const miniAlertas = document.getElementById('mini-alertas');
        if (miniAlertas) {
          const alertaItem = createAlertItem(titulo, mensagem, tipo);
          miniAlertas.prepend(alertaItem);
          
          // Limitar a 3 alertas no mini-painel
          while (miniAlertas.children.length > 3) {
            miniAlertas.removeChild(miniAlertas.lastChild);
          }
        }
      };
    }
  }
  
  // Inicializar componentes após autenticação
  if (typeof checkAuthState === 'function') {
    // Chamar checkAuthState para verificar autenticação
    checkAuthState();
  } else {
    // Se não estiver usando autenticação, inicializar componentes diretamente
    if (typeof initComponents === 'function') {
      initComponents();
    }
  }
});

// Função auxiliar para criar um item de alerta
function createAlertItem(titulo, descricao, tipo = 'normal', data = null) {
  const alertaItem = document.createElement('div');
  alertaItem.className = `alerta-item ${tipo === 'vencimento' ? 'alerta-vencimento' : ''}`;
  
  const icon = tipo === 'vencimento' ? 'fa-exclamation-circle' : 'fa-bell';
  
  alertaItem.innerHTML = `
    <div class="alerta-icon">
      <i class="fas ${icon}"></i>
    </div>
    <div class="alerta-content">
      <div class="alerta-title">${titulo}</div>
      <div class="alerta-details">
        <span>${descricao}</span>
        ${data ? `<span>${data}</span>` : ''}
      </div>
    </div>
  `;
  
  return alertaItem;
}
