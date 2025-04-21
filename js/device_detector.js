/**
 * device_detector.js - Script para detecção de dispositivos e redirecionamento
 * Sistema de Gerenciamento de Contas Pessoais - Integração Web/Mobile
 * 
 * Este arquivo contém a lógica para detectar o tipo de dispositivo (desktop ou mobile)
 * e redirecionar para a interface apropriada.
 */

// Função para detectar se o dispositivo é móvel
function isMobileDevice() {
  // Verificar a largura da janela (abordagem responsiva)
  if (window.innerWidth <= 768) {
    return true;
  }
  
  // Verificar User Agent (abordagem complementar)
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
}

// Função para redirecionar para a interface apropriada
function redirectToAppropriateInterface() {
  // Verificar se é um dispositivo móvel
  const isMobile = isMobileDevice();
  
  // Obter o caminho atual
  const currentPath = window.location.pathname;
  
  // Obter o nome do arquivo atual
  const pathParts = currentPath.split('/');
  const fileName = pathParts[pathParts.length - 1] || 'index.html';
  
  // Verificar se já estamos na pasta mobile
  const inMobileFolder = currentPath.includes('/mobile/');
  
  // Redirecionar conforme necessário
  if (isMobile && !inMobileFolder) {
    // Se for mobile e não estiver na pasta mobile, redirecionar para a versão mobile
    window.location.href = 'mobile/' + fileName;
  } else if (!isMobile && inMobileFolder) {
    // Se for desktop e estiver na pasta mobile, redirecionar para a versão desktop
    window.location.href = '../' + fileName;
  }
}

// Executar a detecção e redirecionamento quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  redirectToAppropriateInterface();
});

// Também verificar quando a janela for redimensionada
window.addEventListener('resize', function() {
  // Usar debounce para evitar múltiplas chamadas durante o redimensionamento
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(function() {
    redirectToAppropriateInterface();
  }, 250);
});
