/**
 * Módulo de Compatibilidade entre Navegadores para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Polyfills para navegadores antigos
 * - Correções específicas para diferentes navegadores
 * - Detecção de recursos do navegador
 */

'use strict';

/**
 * Inicializa as correções de compatibilidade entre navegadores
 */
function initBrowserCompatibility() {
  addPolyfills();
  fixCssCompatibility();
  fixDateHandling();
  detectBrowserFeatures();
}

/**
 * Adiciona polyfills para navegadores antigos
 */
function addPolyfills() {
  // Polyfill para o método forEach em NodeList
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  
  // Polyfill para o método includes em Array
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      
      var o = Object(this);
      var len = o.length >>> 0;
      
      if (len === 0) {
        return false;
      }
      
      var n = fromIndex | 0;
      var k = Math.max(n >= 0 ? n : len + n, 0);
      
      while (k < len) {
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }
      
      return false;
    };
  }
  
  // Polyfill para o método find em Array
  if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      
      var o = Object(this);
      var len = o.length >>> 0;
      
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      
      var thisArg = arguments[1];
      var k = 0;
      
      while (k < len) {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        k++;
      }
      
      return undefined;
    };
  }
  
  // Polyfill para Element.matches
  if (!Element.prototype.matches) {
    Element.prototype.matches = 
      Element.prototype.matchesSelector || 
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector || 
      Element.prototype.oMatchesSelector || 
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }
  
  // Polyfill para Element.closest
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      var el = this;
      
      do {
        if (el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      
      return null;
    };
  }
}

/**
 * Corrige problemas de compatibilidade CSS
 */
function fixCssCompatibility() {
  // Detectar navegador
  const isIE = !!document.documentMode;
  const isEdgeLegacy = !isIE && !!window.StyleMedia;
  const isFirefox = typeof InstallTrigger !== 'undefined';
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Adicionar classes ao body para estilos específicos de navegador
  if (isIE) document.body.classList.add('ie-browser');
  if (isEdgeLegacy) document.body.classList.add('edge-legacy-browser');
  if (isFirefox) document.body.classList.add('firefox-browser');
  if (isSafari) document.body.classList.add('safari-browser');
  
  // Corrigir problemas de flexbox em navegadores antigos
  if (isIE || isEdgeLegacy) {
    document.querySelectorAll('.dashboard-cards, .grafico-painel-container').forEach(container => {
      if (container.children.length > 0) {
        const childWidth = 100 / container.children.length;
        Array.from(container.children).forEach(child => {
          child.style.width = `${childWidth}%`;
          child.style.flexBasis = `${childWidth}%`;
        });
      }
    });
  }
  
  // Corrigir problemas de grid em navegadores antigos
  if (isIE) {
    document.querySelectorAll('.calendar-grid').forEach(grid => {
      const children = Array.from(grid.children);
      for (let i = 0; i < children.length; i++) {
        const row = Math.floor(i / 7);
        const col = i % 7;
        children[i].style.position = 'absolute';
        children[i].style.left = `${col * (100 / 7)}%`;
        children[i].style.top = `${row * 40}px`;
        children[i].style.width = `${100 / 7}%`;
        children[i].style.height = '40px';
      }
      grid.style.position = 'relative';
      grid.style.height = `${Math.ceil(children.length / 7) * 40}px`;
    });
  }
}

/**
 * Corrige problemas de manipulação de datas
 */
function fixDateHandling() {
  // Função segura para formatação de data
  window.formatDate = function(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      // Verificar se é uma data ISO válida
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date)) {
        date = new Date(date);
      } 
      // Verificar se é uma data no formato YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const parts = date.split('-');
        date = new Date(parts[0], parts[1] - 1, parts[2]);
      }
      // Verificar se é uma data no formato DD/MM/YYYY
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const parts = date.split('/');
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
      else {
        date = new Date(date);
      }
    }
    
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  // Função segura para parsing de data
  window.parseDate = function(dateString) {
    if (!dateString) return null;
    
    let date;
    
    // Tentar formato ISO
    date = new Date(dateString);
    
    // Se não for válido, tentar formato DD/MM/YYYY
    if (isNaN(date.getTime()) && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      date = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    // Se não for válido, tentar formato YYYY-MM-DD
    if (isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    }
    
    return isNaN(date.getTime()) ? null : date;
  };
  
  // Corrigir inputs de data para navegadores que não suportam input[type="date"]
  if (!supportsDateInput()) {
    document.querySelectorAll('input[type="date"]').forEach(input => {
      // Manter o tipo como "date" para navegadores que suportam
      // Mas adicionar um fallback para navegadores que não suportam
      input.addEventListener('focus', function() {
        if (this.type === 'date') {
          return;
        }
        
        // Mostrar placeholder para formato de data
        this.placeholder = 'DD/MM/AAAA';
      });
      
      input.addEventListener('blur', function() {
        if (this.type === 'date') {
          return;
        }
        
        // Validar e formatar a data inserida
        const value = this.value;
        if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const parts = value.split('/');
          const date = new Date(parts[2], parts[1] - 1, parts[0]);
          
          if (!isNaN(date.getTime())) {
            // Converter para formato YYYY-MM-DD para compatibilidade
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            this.setAttribute('data-value', formattedDate);
          }
        }
      });
    });
  }
}

/**
 * Detecta recursos do navegador
 */
function detectBrowserFeatures() {
  const features = {
    flexbox: supportsFlex(),
    grid: supportsGrid(),
    dateInput: supportsDateInput(),
    inputRange: supportsInputRange(),
    webp: false // Será atualizado assincronamente
  };
  
  // Detectar suporte a WebP
  checkWebpSupport().then(supported => {
    features.webp = supported;
    document.body.classList.toggle('webp-support', supported);
  });
  
  // Adicionar classes ao body para recursos suportados
  document.body.classList.toggle('flex-support', features.flexbox);
  document.body.classList.toggle('grid-support', features.grid);
  document.body.classList.toggle('date-input-support', features.dateInput);
  document.body.classList.toggle('range-input-support', features.inputRange);
  
  // Disponibilizar objeto de recursos globalmente
  window.browserFeatures = features;
}

/**
 * Verifica se o navegador suporta flexbox
 * @returns {boolean} True se suportar, false caso contrário
 */
function supportsFlex() {
  const div = document.createElement('div');
  div.style.display = 'flex';
  return div.style.display === 'flex';
}

/**
 * Verifica se o navegador suporta grid
 * @returns {boolean} True se suportar, false caso contrário
 */
function supportsGrid() {
  const div = document.createElement('div');
  div.style.display = 'grid';
  return div.style.display === 'grid';
}

/**
 * Verifica se o navegador suporta input[type="date"]
 * @returns {boolean} True se suportar, false caso contrário
 */
function supportsDateInput() {
  const input = document.createElement('input');
  input.setAttribute('type', 'date');
  return input.type === 'date';
}

/**
 * Verifica se o navegador suporta input[type="range"]
 * @returns {boolean} True se suportar, false caso contrário
 */
function supportsInputRange() {
  const input = document.createElement('input');
  input.setAttribute('type', 'range');
  return input.type === 'range';
}

/**
 * Verifica se o navegador suporta imagens WebP
 * @returns {Promise<boolean>} Promise que resolve para true se suportar, false caso contrário
 */
function checkWebpSupport() {
  return new Promise(resolve => {
    const webpImage = new Image();
    webpImage.onload = function() {
      resolve(webpImage.width === 1);
    };
    webpImage.onerror = function() {
      resolve(false);
    };
    webpImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
}

// Exportar funções
window.initBrowserCompatibility = initBrowserCompatibility;
window.formatDate = window.formatDate || function() {};
window.parseDate = window.parseDate || function() {};
