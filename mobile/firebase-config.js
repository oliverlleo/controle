/**
 * firebase-config.js - Configuração e integração com o Firebase
 * Finanças Pessoais - Versão Mobile 2025
 * 
 * Este arquivo contém a configuração do Firebase e funções para interagir com o banco de dados,
 * permitindo a sincronização entre a versão mobile e desktop.
 */

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBCZ8-vQh-GYPAf-acnUUmUmDc_dRdvjpk",
  authDomain: "financas-pessoais-app.firebaseapp.com",
  databaseURL: "https://financas-pessoais-app.firebaseio.com",
  projectId: "financas-pessoais-app",
  storageBucket: "financas-pessoais-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

// Inicialização do Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}

// Classe para gerenciar a conexão com o banco de dados
class DatabaseManager {
  constructor() {
    // Verificar se o Firebase está disponível
    if (typeof firebase === 'undefined' || !firebase.database) {
      console.error('Firebase não está disponível');
      return;
    }
    
    this.db = firebase.database();
    this.auth = firebase.auth();
    this.currentUser = null;
    
    // Observar mudanças de autenticação
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.currentUser = user;
        this.syncWithDesktopVersion();
      } else {
        this.currentUser = null;
      }
    });
  }
  
  // Obter referência ao usuário atual
  getUserRef() {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }
    
    return this.db.ref(`users/${this.currentUser.uid}`);
  }
  
  // Sincronizar com a versão desktop
  syncWithDesktopVersion() {
    if (!this.currentUser) return;
    
    // Verificar se já existe dados do usuário
    this.getUserRef().once('value')
      .then(snapshot => {
        const userData = snapshot.val();
        
        // Se não existir dados, tentar importar da versão desktop
        if (!userData) {
          this.importFromDesktop();
        }
      })
      .catch(error => {
        console.error('Erro ao verificar dados do usuário:', error);
      });
  }
  
  // Importar dados da versão desktop
  importFromDesktop() {
    // Verificar se há dados locais da versão desktop
    const desktopData = localStorage.getItem('financas_pessoais_data');
    
    if (desktopData) {
      try {
        const data = JSON.parse(desktopData);
        
        // Importar dados para o Firebase
        this.getUserRef().set(data)
          .then(() => {
            console.log('Dados importados com sucesso da versão desktop');
          })
          .catch(error => {
            console.error('Erro ao importar dados da versão desktop:', error);
          });
      } catch (error) {
        console.error('Erro ao parsear dados da versão desktop:', error);
      }
    }
  }
  
  // Exportar dados para a versão desktop
  exportToDesktop() {
    if (!this.currentUser) return;
    
    this.getUserRef().once('value')
      .then(snapshot => {
        const userData = snapshot.val();
        
        if (userData) {
          // Salvar dados no localStorage para a versão desktop
          localStorage.setItem('financas_pessoais_data', JSON.stringify(userData));
          console.log('Dados exportados com sucesso para a versão desktop');
        }
      })
      .catch(error => {
        console.error('Erro ao exportar dados para a versão desktop:', error);
      });
  }
  
  // ===== OPERAÇÕES DE DESPESAS =====
  // Obter todas as despesas
  getExpenses() {
    return this.getUserRef().child('expenses').once('value')
      .then(snapshot => {
        const expenses = [];
        
        snapshot.forEach(childSnapshot => {
          const expense = childSnapshot.val();
          expense.id = childSnapshot.key;
          expenses.push(expense);
        });
        
        return expenses;
      });
  }
  
  // Obter despesas por período
  getExpensesByPeriod(startDate, endDate) {
    return this.getUserRef().child('expenses')
      .orderByChild('date')
      .startAt(startDate)
      .endAt(endDate)
      .once('value')
      .then(snapshot => {
        const expenses = [];
        
        snapshot.forEach(childSnapshot => {
          const expense = childSnapshot.val();
          expense.id = childSnapshot.key;
          expenses.push(expense);
        });
        
        return expenses;
      });
  }
  
  // Adicionar despesa
  addExpense(expense) {
    // Gerar ID único se não for fornecido
    if (!expense.id) {
      expense.id = this.db.ref().push().key;
    }
    
    // Adicionar timestamp de criação
    expense.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    return this.getUserRef().child('expenses').child(expense.id).set(expense)
      .then(() => {
        // Atualizar saldo
        return this.updateBalance(-expense.amount);
      })
      .then(() => {
        return expense;
      });
  }
  
  // Atualizar despesa
  updateExpense(id, updatedExpense) {
    // Obter despesa atual para calcular diferença no saldo
    return this.getUserRef().child('expenses').child(id).once('value')
      .then(snapshot => {
        const currentExpense = snapshot.val();
        
        if (!currentExpense) {
          throw new Error('Despesa não encontrada');
        }
        
        // Calcular diferença no saldo
        const amountDiff = currentExpense.amount - updatedExpense.amount;
        
        // Atualizar despesa
        return this.getUserRef().child('expenses').child(id).update(updatedExpense)
          .then(() => {
            // Atualizar saldo se o valor foi alterado
            if (amountDiff !== 0) {
              return this.updateBalance(amountDiff);
            }
          })
          .then(() => {
            return updatedExpense;
          });
      });
  }
  
  // Excluir despesa
  deleteExpense(id) {
    // Obter despesa para atualizar saldo
    return this.getUserRef().child('expenses').child(id).once('value')
      .then(snapshot => {
        const expense = snapshot.val();
        
        if (!expense) {
          throw new Error('Despesa não encontrada');
        }
        
        // Excluir despesa
        return this.getUserRef().child('expenses').child(id).remove()
          .then(() => {
            // Atualizar saldo
            return this.updateBalance(expense.amount);
          });
      });
  }
  
  // ===== OPERAÇÕES DE RECEITAS =====
  // Obter todas as receitas
  getIncomes() {
    return this.getUserRef().child('incomes').once('value')
      .then(snapshot => {
        const incomes = [];
        
        snapshot.forEach(childSnapshot => {
          const income = childSnapshot.val();
          income.id = childSnapshot.key;
          incomes.push(income);
        });
        
        return incomes;
      });
  }
  
  // Obter receitas por período
  getIncomesByPeriod(startDate, endDate) {
    return this.getUserRef().child('incomes')
      .orderByChild('date')
      .startAt(startDate)
      .endAt(endDate)
      .once('value')
      .then(snapshot => {
        const incomes = [];
        
        snapshot.forEach(childSnapshot => {
          const income = childSnapshot.val();
          income.id = childSnapshot.key;
          incomes.push(income);
        });
        
        return incomes;
      });
  }
  
  // Adicionar receita
  addIncome(income) {
    // Gerar ID único se não for fornecido
    if (!income.id) {
      income.id = this.db.ref().push().key;
    }
    
    // Adicionar timestamp de criação
    income.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    return this.getUserRef().child('incomes').child(income.id).set(income)
      .then(() => {
        // Atualizar saldo
        return this.updateBalance(income.amount);
      })
      .then(() => {
        return income;
      });
  }
  
  // Atualizar receita
  updateIncome(id, updatedIncome) {
    // Obter receita atual para calcular diferença no saldo
    return this.getUserRef().child('incomes').child(id).once('value')
      .then(snapshot => {
        const currentIncome = snapshot.val();
        
        if (!currentIncome) {
          throw new Error('Receita não encontrada');
        }
        
        // Calcular diferença no saldo
        const amountDiff = updatedIncome.amount - currentIncome.amount;
        
        // Atualizar receita
        return this.getUserRef().child('incomes').child(id).update(updatedIncome)
          .then(() => {
            // Atualizar saldo se o valor foi alterado
            if (amountDiff !== 0) {
              return this.updateBalance(amountDiff);
            }
          })
          .then(() => {
            return updatedIncome;
          });
      });
  }
  
  // Excluir receita
  deleteIncome(id) {
    // Obter receita para atualizar saldo
    return this.getUserRef().child('incomes').child(id).once('value')
      .then(snapshot => {
        const income = snapshot.val();
        
        if (!income) {
          throw new Error('Receita não encontrada');
        }
        
        // Excluir receita
        return this.getUserRef().child('incomes').child(id).remove()
          .then(() => {
            // Atualizar saldo
            return this.updateBalance(-income.amount);
          });
      });
  }
  
  // ===== OPERAÇÕES DE CARTÕES =====
  // Obter todos os cartões
  getCards() {
    return this.getUserRef().child('cards').once('value')
      .then(snapshot => {
        const cards = [];
        
        snapshot.forEach(childSnapshot => {
          const card = childSnapshot.val();
          card.id = childSnapshot.key;
          cards.push(card);
        });
        
        return cards;
      });
  }
  
  // Adicionar cartão
  addCard(card) {
    // Gerar ID único se não for fornecido
    if (!card.id) {
      card.id = this.db.ref().push().key;
    }
    
    // Adicionar timestamp de criação
    card.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    return this.getUserRef().child('cards').child(card.id).set(card)
      .then(() => {
        return card;
      });
  }
  
  // Atualizar cartão
  updateCard(id, updatedCard) {
    return this.getUserRef().child('cards').child(id).update(updatedCard)
      .then(() => {
        return updatedCard;
      });
  }
  
  // Excluir cartão
  deleteCard(id) {
    return this.getUserRef().child('cards').child(id).remove();
  }
  
  // Adicionar transação ao cartão
  addCardTransaction(cardId, transaction) {
    // Gerar ID único se não for fornecido
    if (!transaction.id) {
      transaction.id = this.db.ref().push().key;
    }
    
    // Adicionar timestamp de criação
    transaction.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    return this.getUserRef().child('cards').child(cardId).child('transactions').child(transaction.id).set(transaction)
      .then(() => {
        // Atualizar limite utilizado do cartão
        return this.updateCardUsedLimit(cardId, transaction.amount);
      })
      .then(() => {
        return transaction;
      });
  }
  
  // Atualizar limite utilizado do cartão
  updateCardUsedLimit(cardId, amount) {
    return this.getUserRef().child('cards').child(cardId).once('value')
      .then(snapshot => {
        const card = snapshot.val();
        
        if (!card) {
          throw new Error('Cartão não encontrado');
        }
        
        const usedLimit = (card.usedLimit || 0) + amount;
        
        return this.getUserRef().child('cards').child(cardId).update({
          usedLimit: usedLimit
        });
      });
  }
  
  // ===== OPERAÇÕES DE METAS =====
  // Obter todas as metas
  getGoals() {
    return this.getUserRef().child('goals').once('value')
      .then(snapshot => {
        const goals = [];
        
        snapshot.forEach(childSnapshot => {
          const goal = childSnapshot.val();
          goal.id = childSnapshot.key;
          goals.push(goal);
        });
        
        return goals;
      });
  }
  
  // Adicionar meta
  addGoal(goal) {
    // Gerar ID único se não for fornecido
    if (!goal.id) {
      goal.id = this.db.ref().push().key;
    }
    
    // Adicionar timestamp de criação
    goal.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    // Inicializar valores
    goal.currentAmount = goal.initialAmount || 0;
    goal.deposits = goal.deposits || [];
    
    return this.getUserRef().child('goals').child(goal.id).set(goal)
      .then(() => {
        return goal;
      });
  }
  
  // Atualizar meta
  updateGoal(id, updatedGoal) {
    return this.getUserRef().child('goals').child(id).update(updatedGoal)
      .then(() => {
        return updatedGoal;
      });
  }
  
  // Excluir meta
  deleteGoal(id) {
    return this.getUserRef().child('goals').child(id).remove();
  }
  
  // Adicionar depósito à meta
  addGoalDeposit(goalId, deposit) {
    // Gerar ID único se não for fornecido
    if (!deposit.id) {
      deposit.id = this.db.ref().push().key;
    }
    
    // Adicionar timestamp de criação
    deposit.createdAt = firebase.database.ServerValue.TIMESTAMP;
    
    return this.getUserRef().child('goals').child(goalId).once('value')
      .then(snapshot => {
        const goal = snapshot.val();
        
        if (!goal) {
          throw new Error('Meta não encontrada');
        }
        
        // Atualizar valor atual da meta
        const currentAmount = (goal.currentAmount || 0) + deposit.amount;
        const deposits = goal.deposits || [];
        deposits.push(deposit);
        
        // Verificar se a meta foi atingida
        const isCompleted = currentAmount >= goal.targetAmount;
        
        return this.getUserRef().child('goals').child(goalId).update({
          currentAmount: currentAmount,
          deposits: deposits,
          isCompleted: isCompleted,
          completedAt: isCompleted ? firebase.database.ServerValue.TIMESTAMP : null
        });
      })
      .then(() => {
        return deposit;
      });
  }
  
  // ===== OPERAÇÕES DE SALDO =====
  // Obter saldo atual
  getBalance() {
    return this.getUserRef().child('balance').once('value')
      .then(snapshot => {
        return snapshot.val() || 0;
      });
  }
  
  // Atualizar saldo
  updateBalance(amount) {
    return this.getBalance()
      .then(currentBalance => {
        const newBalance = currentBalance + amount;
        
        return this.getUserRef().child('balance').set(newBalance)
          .then(() => {
            return newBalance;
          });
      });
  }
  
  // ===== OPERAÇÕES DE CATEGORIAS =====
  // Obter categorias de despesas
  getExpenseCategories() {
    return this.getUserRef().child('categories').child('expenses').once('value')
      .then(snapshot => {
        return snapshot.val() || [];
      });
  }
  
  // Obter categorias de receitas
  getIncomeCategories() {
    return this.getUserRef().child('categories').child('incomes').once('value')
      .then(snapshot => {
        return snapshot.val() || [];
      });
  }
  
  // Adicionar categoria de despesa
  addExpenseCategory(category) {
    return this.getExpenseCategories()
      .then(categories => {
        categories.push(category);
        
        return this.getUserRef().child('categories').child('expenses').set(categories)
          .then(() => {
            return category;
          });
      });
  }
  
  // Adicionar categoria de receita
  addIncomeCategory(category) {
    return this.getIncomeCategories()
      .then(categories => {
        categories.push(category);
        
        return this.getUserRef().child('categories').child('incomes').set(categories)
          .then(() => {
            return category;
          });
      });
  }
  
  // ===== OPERAÇÕES DE RELATÓRIOS =====
  // Obter dados para relatório por período
  getReportData(startDate, endDate) {
    return Promise.all([
      this.getExpensesByPeriod(startDate, endDate),
      this.getIncomesByPeriod(startDate, endDate)
    ])
      .then(([expenses, incomes]) => {
        // Calcular totais
        const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
        const totalIncomes = incomes.reduce((total, income) => total + income.amount, 0);
        const balance = totalIncomes - totalExpenses;
        
        // Agrupar despesas por categoria
        const expensesByCategory = {};
        expenses.forEach(expense => {
          const category = expense.category;
          
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = 0;
          }
          
          expensesByCategory[category] += expense.amount;
        });
        
        // Agrupar receitas por categoria
        const incomesByCategory = {};
        incomes.forEach(income => {
          const category = income.category;
          
          if (!incomesByCategory[category]) {
            incomesByCategory[category] = 0;
          }
          
          incomesByCategory[category] += income.amount;
        });
        
        return {
          expenses,
          incomes,
          totalExpenses,
          totalIncomes,
          balance,
          expensesByCategory,
          incomesByCategory
        };
      });
  }
  
  // ===== OPERAÇÕES DE USUÁRIO =====
  // Obter perfil do usuário
  getUserProfile() {
    return this.getUserRef().child('profile').once('value')
      .then(snapshot => {
        return snapshot.val() || {};
      });
  }
  
  // Atualizar perfil do usuário
  updateUserProfile(profile) {
    return this.getUserRef().child('profile').update(profile)
      .then(() => {
        return profile;
      });
  }
  
  // ===== OPERAÇÕES DE CONFIGURAÇÕES =====
  // Obter configurações do usuário
  getUserSettings() {
    return this.getUserRef().child('settings').once('value')
      .then(snapshot => {
        return snapshot.val() || {};
      });
  }
  
  // Atualizar configurações do usuário
  updateUserSettings(settings) {
    return this.getUserRef().child('settings').update(settings)
      .then(() => {
        return settings;
      });
  }
}

// Criar instância do gerenciador de banco de dados
const dbManager = new DatabaseManager();

// Exportar para uso global
window.dbManager = dbManager;
