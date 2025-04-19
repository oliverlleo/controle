/**
 * Módulo de Validação de Formulários para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Validação de campos de formulário
 * - Feedback visual para erros de validação
 * - Prevenção de submissão de dados inválidos
 */

'use strict';

/**
 * Inicializa o sistema de validação de formulários
 */
function initFormValidation() {
  setupFormValidators();
  enhanceInputFields();
}

/**
 * Configura validadores para os formulários principais
 */
function setupFormValidators() {
  // Validador para o formulário de despesas
  if (document.getElementById('cadastroDespesaModal')) {
    const salvarDespesaBtn = document.querySelector('#cadastroDespesaModal .btn-primary');
    if (salvarDespesaBtn) {
      const originalOnClick = salvarDespesaBtn.onclick;
      
      salvarDespesaBtn.onclick = function(event) {
        if (validateDespesaForm()) {
          if (typeof originalOnClick === 'function') {
            return originalOnClick.call(this, event);
          }
        } else {
          event.preventDefault();
          return false;
        }
      };
    }
  }
  
  // Validador para o formulário de metas
  if (document.getElementById('novaMetaModal')) {
    const salvarMetaBtn = document.getElementById('salvarMetaBtn');
    if (salvarMetaBtn) {
      const originalOnClick = salvarMetaBtn.onclick;
      
      salvarMetaBtn.onclick = function(event) {
        if (validateMetaForm()) {
          if (typeof originalOnClick === 'function') {
            return originalOnClick.call(this, event);
          }
        } else {
          event.preventDefault();
          return false;
        }
      };
    }
  }
  
  // Validador para o formulário de renda
  if (document.getElementById('cadastroForm')) {
    const form = document.getElementById('cadastroForm');
    form.addEventListener('submit', function(event) {
      if (!validateRendaForm()) {
        event.preventDefault();
        return false;
      }
    });
  }
}

/**
 * Melhora os campos de entrada com validação em tempo real
 */
function enhanceInputFields() {
  // Adicionar validação em tempo real para campos numéricos
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', function() {
      validateNumericField(this);
    });
    
    input.addEventListener('blur', function() {
      validateNumericField(this, true);
    });
  });
  
  // Adicionar validação em tempo real para campos de data
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.addEventListener('change', function() {
      validateDateField(this);
    });
    
    input.addEventListener('blur', function() {
      validateDateField(this, true);
    });
  });
  
  // Adicionar validação em tempo real para campos de texto obrigatórios
  document.querySelectorAll('input[type="text"][required], input[type="email"][required]').forEach(input => {
    input.addEventListener('input', function() {
      validateRequiredField(this);
    });
    
    input.addEventListener('blur', function() {
      validateRequiredField(this, true);
    });
  });
}

/**
 * Valida o formulário de despesas
 * @returns {boolean} True se o formulário for válido, false caso contrário
 */
function validateDespesaForm() {
  let isValid = true;
  
  // Validar descrição
  const descricao = document.getElementById('despesaDescricao');
  if (!validateRequiredField(descricao, true)) {
    isValid = false;
  }
  
  // Validar valor
  const valor = document.getElementById('despesaValor');
  if (!validateNumericField(valor, true)) {
    isValid = false;
  }
  
  // Validar data
  const data = document.getElementById('dataCompra');
  if (!validateDateField(data, true)) {
    isValid = false;
  }
  
  // Validar categoria
  const categoria = document.getElementById('categoriaDespesa');
  if (categoria.value === '') {
    showFieldError(categoria, 'Selecione uma categoria');
    isValid = false;
  } else {
    clearFieldError(categoria);
  }
  
  // Validar cartão se for pagamento parcelado
  const formaPagamento = document.getElementById('formaPagamento');
  if (formaPagamento.value === 'cartao') {
    const cartao = document.getElementById('cartaoDespesa');
    if (cartao.value === '') {
      showFieldError(cartao, 'Selecione um cartão');
      isValid = false;
    } else {
      clearFieldError(cartao);
    }
    
    const parcelas = document.getElementById('numParcelasDespesa');
    if (!validateNumericField(parcelas, true, 1, 24)) {
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Valida o formulário de metas
 * @returns {boolean} True se o formulário for válido, false caso contrário
 */
function validateMetaForm() {
  let isValid = true;
  
  // Validar título
  const titulo = document.getElementById('metaTitulo');
  if (!validateRequiredField(titulo, true)) {
    isValid = false;
  }
  
  // Validar valor da meta
  const valorMeta = document.getElementById('metaValor');
  if (!validateNumericField(valorMeta, true, 0.01)) {
    isValid = false;
  }
  
  // Validar valor atual
  const valorAtual = document.getElementById('metaValorAtual');
  if (!validateNumericField(valorAtual, true, 0)) {
    isValid = false;
  }
  
  // Validar data (opcional)
  const prazo = document.getElementById('metaPrazo');
  if (prazo.value !== '' && !validateDateField(prazo, true)) {
    isValid = false;
  }
  
  return isValid;
}

/**
 * Valida o formulário de renda
 * @returns {boolean} True se o formulário for válido, false caso contrário
 */
function validateRendaForm() {
  let isValid = true;
  
  // Validar nome
  const nome = document.getElementById('nome');
  if (!validateRequiredField(nome, true)) {
    isValid = false;
  }
  
  // Validar parentesco
  const parentesco = document.getElementById('parentesco');
  if (parentesco.value === '') {
    showFieldError(parentesco, 'Selecione o parentesco');
    isValid = false;
  } else {
    clearFieldError(parentesco);
  }
  
  // Validar saldo inicial
  const saldoInicial = document.getElementById('saldoInicial');
  if (!validateNumericField(saldoInicial, true, 0)) {
    isValid = false;
  }
  
  // Validar campos CLT se estiver marcado
  const cltCheckbox = document.getElementById('cltCheckbox');
  if (cltCheckbox.checked) {
    // Validar salário bruto
    const salarioBruto = document.getElementById('salarioBruto');
    if (!validateNumericField(salarioBruto, true, 0.01)) {
      isValid = false;
    }
    
    // Validar salário líquido
    const salarioLiquido = document.getElementById('salarioLiquido');
    if (!validateNumericField(salarioLiquido, true, 0.01)) {
      isValid = false;
    }
    
    // Validar número de pagamentos
    const numPagamentos = document.getElementById('numPagamentos');
    if (!validateNumericField(numPagamentos, true, 1, 5)) {
      isValid = false;
    }
    
    // Validar valores dos pagamentos
    const pagamentosContainer = document.getElementById('pagamentosContainer');
    const pagamentosInputs = pagamentosContainer.querySelectorAll('input[type="number"]');
    
    pagamentosInputs.forEach(input => {
      if (!validateNumericField(input, true, 0.01)) {
        isValid = false;
      }
    });
  }
  
  return isValid;
}

/**
 * Valida um campo numérico
 * @param {HTMLElement} field - Campo a ser validado
 * @param {boolean} showError - Se deve mostrar erro visual
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @returns {boolean} True se o campo for válido, false caso contrário
 */
function validateNumericField(field, showError = false, min = null, max = null) {
  if (!field) return false;
  
  const value = field.value.trim();
  
  // Verificar se está vazio e é obrigatório
  if (value === '' && field.hasAttribute('required')) {
    if (showError) {
      showFieldError(field, 'Este campo é obrigatório');
    }
    return false;
  }
  
  // Se não for obrigatório e estiver vazio, é válido
  if (value === '' && !field.hasAttribute('required')) {
    if (showError) {
      clearFieldError(field);
    }
    return true;
  }
  
  // Verificar se é um número válido
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    if (showError) {
      showFieldError(field, 'Digite um número válido');
    }
    return false;
  }
  
  // Verificar valor mínimo
  if (min !== null && numValue < min) {
    if (showError) {
      showFieldError(field, `O valor mínimo é ${min}`);
    }
    return false;
  }
  
  // Verificar valor máximo
  if (max !== null && numValue > max) {
    if (showError) {
      showFieldError(field, `O valor máximo é ${max}`);
    }
    return false;
  }
  
  if (showError) {
    clearFieldError(field);
  }
  
  return true;
}

/**
 * Valida um campo de data
 * @param {HTMLElement} field - Campo a ser validado
 * @param {boolean} showError - Se deve mostrar erro visual
 * @returns {boolean} True se o campo for válido, false caso contrário
 */
function validateDateField(field, showError = false) {
  if (!field) return false;
  
  const value = field.value.trim();
  
  // Verificar se está vazio e é obrigatório
  if (value === '' && field.hasAttribute('required')) {
    if (showError) {
      showFieldError(field, 'Este campo é obrigatório');
    }
    return false;
  }
  
  // Se não for obrigatório e estiver vazio, é válido
  if (value === '' && !field.hasAttribute('required')) {
    if (showError) {
      clearFieldError(field);
    }
    return true;
  }
  
  // Verificar se é uma data válida
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    if (showError) {
      showFieldError(field, 'Data inválida');
    }
    return false;
  }
  
  if (showError) {
    clearFieldError(field);
  }
  
  return true;
}

/**
 * Valida um campo obrigatório
 * @param {HTMLElement} field - Campo a ser validado
 * @param {boolean} showError - Se deve mostrar erro visual
 * @returns {boolean} True se o campo for válido, false caso contrário
 */
function validateRequiredField(field, showError = false) {
  if (!field) return false;
  
  const value = field.value.trim();
  
  if (value === '') {
    if (showError) {
      showFieldError(field, 'Este campo é obrigatório');
    }
    return false;
  }
  
  if (showError) {
    clearFieldError(field);
  }
  
  return true;
}

/**
 * Mostra erro visual em um campo
 * @param {HTMLElement} field - Campo com erro
 * @param {string} message - Mensagem de erro
 */
function showFieldError(field, message) {
  // Adicionar classe de erro ao campo
  field.classList.add('is-invalid');
  
  // Verificar se já existe mensagem de erro
  let errorElement = field.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('error-message')) {
    // Criar elemento de mensagem de erro
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }
  
  // Atualizar mensagem de erro
  errorElement.textContent = message;
}

/**
 * Remove erro visual de um campo
 * @param {HTMLElement} field - Campo a ser limpo
 */
function clearFieldError(field) {
  // Remover classe de erro do campo
  field.classList.remove('is-invalid');
  
  // Remover mensagem de erro se existir
  const errorElement = field.nextElementSibling;
  if (errorElement && errorElement.classList.contains('error-message')) {
    errorElement.remove();
  }
}

// Exportar funções
window.initFormValidation = initFormValidation;
window.validateDespesaForm = validateDespesaForm;
window.validateMetaForm = validateMetaForm;
window.validateRendaForm = validateRendaForm;
