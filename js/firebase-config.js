const firebaseConfig = {
   apiKey: "AIzaSyAG6LktPXGe6F-vSTHV2Y3n95vSwhpXch8",
   authDomain: "controlegasto-df3f1.firebaseapp.com",
   databaseURL: "https://controlegasto-df3f1-default-rtdb.firebaseio.com",
   projectId: "controlegasto-df3f1",
   storageBucket: "controlegasto-df3f1.firebasestorage.app",
   messagingSenderId: "1034936676414",
   appId: "1:1034936676414:web:61c67ce39c3ab71a07a16f",
   measurementId: "G-PTN43GZHGR"
 };
 
 // Inicializar Firebase
 firebase.initializeApp(firebaseConfig);
 
 // Exportar instâncias do Firebase
 const db = firebase.database();
 const auth = firebase.auth();
 

// Login de usuário
function login(email, senha) {
  return auth.signInWithEmailAndPassword(email, senha);
}

// Registro de novo usuário
function registrar(email, senha, nome) {
  return auth.createUserWithEmailAndPassword(email, senha)
    .then(userCredential => {
      const user = userCredential.user;
      return db.ref(`users/${user.uid}`).set({
        nome: nome,
        email: email,
        dataCadastro: new Date().toISOString()
      });
    });
}

// Verificar estado de autenticação
function checkAuth() {
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'login.html';
    } else {
      // Usuário autenticado, carregar dados
      carregarDadosUsuario(user.uid);
    }
  });
}

// Logout
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}
```

### Operações de Dados
As operações de dados são realizadas diretamente com o Firebase Realtime Database:

```javascript
// Exemplo de leitura de dados
function carregarDespesas() {
  const userId = auth.currentUser.uid;
  return db.ref(`despesas/${userId}`).once('value')
    .then(snapshot => {
      const despesas = [];
      snapshot.forEach(childSnapshot => {
        despesas.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return despesas;
    });
}

// Exemplo de escrita de dados
function adicionarDespesa(despesa) {
  const userId = auth.currentUser.uid;
  return db.ref(`despesas/${userId}`).push({
    ...despesa,
    dataCriacao: new Date().toISOString()
  });
}

// Exemplo de atualização de dados
function atualizarDespesa(despesaId, despesa) {
  const userId = auth.currentUser.uid;
  return db.ref(`despesas/${userId}/${despesaId}`).update(despesa);
}

// Exemplo de exclusão de dados
function excluirDespesa(despesaId) {
  const userId = auth.currentUser.uid;
  return db.ref(`despesas/${userId}/${despesaId}`).remove();
}
```

## Segurança e Permissões

O Firebase Realtime Database utiliza regras de segurança para controlar o acesso aos dados:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "despesas": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "receitas": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "categorias": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "cartoes": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "orcamentos": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "metas": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
