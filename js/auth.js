/**
 * Módulo de Autenticação para o Sistema de Gerenciamento de Contas Pessoais
 * 
 * Este módulo implementa:
 * - Autenticação com Firebase (Email/Senha e Google)
 * - Gerenciamento de estado de autenticação
 * - Proteção de rotas
 * - Banco de dados por usuário
 */

'use strict';

// Referência global para o usuário atual
let currentUser = null;

// Inicialização do módulo de autenticação
document.addEventListener('DOMContentLoaded', () => {
  // Verificar estado de autenticação
  firebase.auth().onAuthStateChanged(handleAuthStateChanged);
  
  // Adicionar botão de logout ao menu
  adicionarBotaoLogout();
});

/**
 * Manipula mudanças no estado de autenticação
 */
function handleAuthStateChanged(user) {
  if (user) {
    // Usuário está logado
    currentUser = user;
    
    // Atualizar referência do banco de dados para o usuário atual
    atualizarReferenciaDB(user.uid);
    
    // Exibir informações do usuário
    exibirInfoUsuario(user);
    
    // Carregar dados do usuário
    carregarDadosUsuario();
  } else {
    // Usuário não está logado, redirecionar para a página de login
    if (!window.location.href.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }
}

/**
 * Atualiza a referência do banco de dados para o usuário atual
 */
function atualizarReferenciaDB(userId) {
  // Criar referência para o banco de dados do usuário
  window.userDB = firebase.database().ref(`users/${userId}/data`);
  
  // Substituir referências globais para usar o banco de dados do usuário
  window.db = {
    ref: function(path) {
      return window.userDB.child(path);
    }
  };
}

/**
 * Exibe informações do usuário logado
 */
function exibirInfoUsuario(user) {
  // Verificar se estamos na página principal
  if (document.getElementById('sidebar')) {
    // Criar ou atualizar elemento de informações do usuário
    let userInfoElement = document.getElementById('userInfo');
    
    if (!userInfoElement) {
      userInfoElement = document.createElement('div');
      userInfoElement.id = 'userInfo';
      userInfoElement.className = 'user-info';
      
      // Inserir antes do primeiro link no sidebar
      const sidebar = document.getElementById('sidebar');
      const firstLink = sidebar.querySelector('a');
      sidebar.insertBefore(userInfoElement, firstLink);
    }
    
    // Atualizar conteúdo
    userInfoElement.innerHTML = `
      <div class="user-avatar">
        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || user.email)}" alt="Avatar">
      </div>
      <div class="user-details">
        <div class="user-name">${user.displayName || 'Usuário'}</div>
        <div class="user-email">${user.email}</div>
      </div>
    `;
    
    // Adicionar estilos se ainda não existirem
    if (!document.getElementById('userInfoStyles')) {
      const style = document.createElement('style');
      style.id = 'userInfoStyles';
      style.textContent = `
        .user-info {
          display: flex;
          align-items: center;
          padding: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          margin-right: 0.75rem;
        }
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-details {
          flex: 1;
        }
        .user-name {
          font-weight: 500;
          color: var(--text-color);
        }
        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

/**
 * Adiciona botão de logout ao menu
 */
function adicionarBotaoLogout() {
  // Verificar se estamos na página principal
  if (document.getElementById('sidebar')) {
    // Verificar se o botão já existe
    if (!document.getElementById('logoutButton')) {
      // Criar link de logout
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.id = 'logoutButton';
      logoutLink.className = 'nav-link';
      logoutLink.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i><span>Sair</span>';
      logoutLink.addEventListener('click', fazerLogout);
      
      // Adicionar ao final do sidebar
      document.getElementById('sidebar').appendChild(logoutLink);
    }
  }
}

/**
 * Realiza o logout do usuário
 */
function fazerLogout() {
  firebase.auth().signOut()
    .then(() => {
      // Logout bem-sucedido
      exibirToast('Logout realizado com sucesso!', 'success');
      window.location.href = 'login.html';
    })
    .catch((error) => {
      // Erro ao fazer logout
      console.error('Erro ao fazer logout:', error);
      exibirToast('Erro ao fazer logout. Tente novamente.', 'danger');
    });
}

/**
 * Carrega dados iniciais para um novo usuário
 */
function carregarDadosUsuario() {
  // Verificar se o usuário já tem dados
  window.userDB.once('value')
    .then((snapshot) => {
      if (!snapshot.exists()) {
        // Usuário novo, criar dados iniciais
        criarDadosIniciais();
      }
    })
    .catch((error) => {
      console.error('Erro ao verificar dados do usuário:', error);
    });
}

/**
 * Cria dados iniciais para um novo usuário
 */
function criarDadosIniciais() {
  // Criar categorias padrão
  const categoriasPadrao = {
    'categoria1': { nome: 'Fixo' },
    'categoria2': { nome: 'Casa' },
    'categoria3': { nome: 'Carro' },
    'categoria4': { nome: 'Alimentação' },
    'categoria5': { nome: 'Pet' },
    'categoria6': { nome: 'Lazer' }
  };
  
  // Salvar categorias padrão
  window.userDB.child('categorias').set(categoriasPadrao)
    .then(() => {
      console.log('Categorias padrão criadas com sucesso!');
      
      // Atualizar mapa global de categorias
      if (window.novo_categoriasMap) {
        Object.keys(categoriasPadrao).forEach(key => {
          window.novo_categoriasMap[key] = categoriasPadrao[key].nome;
        });
      }
      
      // Recarregar componentes que dependem das categorias
      if (typeof updateCategoriaSelect === 'function') {
        updateCategoriaSelect();
      }
      
      if (typeof loadCategoriasFiltro === 'function') {
        loadCategoriasFiltro();
      }
    })
    .catch((error) => {
      console.error('Erro ao criar categorias padrão:', error);
    });
  
  // Criar limites padrão
  const limitesPadrao = {
    global: 5000,
    diasAlerta: 5
  };
  
  // Salvar limites padrão
  window.userDB.child('limites').set(limitesPadrao)
    .catch((error) => {
      console.error('Erro ao criar limites padrão:', error);
    });
}

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} True se o usuário estiver autenticado, false caso contrário
 */
function usuarioAutenticado() {
  return currentUser !== null;
}

/**
 * Obtém o ID do usuário atual
 * @returns {string|null} ID do usuário atual ou null se não estiver autenticado
 */
function obterUsuarioId() {
  return currentUser ? currentUser.uid : null;
}

/**
 * Obtém o nome do usuário atual
 * @returns {string} Nome do usuário atual ou 'Usuário' se não tiver nome
 */
function obterUsuarioNome() {
  return currentUser ? (currentUser.displayName || 'Usuário') : 'Usuário';
}

/**
 * Obtém o email do usuário atual
 * @returns {string|null} Email do usuário atual ou null se não estiver autenticado
 */
function obterUsuarioEmail() {
  return currentUser ? currentUser.email : null;
}

/**
 * Obtém a foto do usuário atual
 * @returns {string} URL da foto do usuário ou URL de avatar gerado
 */
function obterUsuarioFoto() {
  if (!currentUser) return null;
  
  return currentUser.photoURL || 
    'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName || currentUser.email);
}
