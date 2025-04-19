# Design de UI/UX Melhorado para o Sistema de Gestão Financeira

## Esquema de Cores

### Paleta Principal
- **Cor primária**: `#4361ee` (Azul royal) - Substitui o verde atual para uma aparência mais moderna e financeira
- **Cor secundária**: `#3f37c9` (Azul índigo) - Para elementos de destaque e botões de ação
- **Cor de sucesso**: `#4cc9f0` (Azul ciano) - Para indicadores positivos e confirmações
- **Cor de alerta**: `#f72585` (Rosa vibrante) - Para alertas e notificações importantes
- **Cor de erro**: `#e63946` (Vermelho coral) - Para erros e ações destrutivas

### Tons Neutros
- **Fundo claro**: `#f8f9fa` - Substitui o gradiente atual por um fundo mais limpo
- **Fundo de cartões**: `#ffffff` - Para cartões e containers
- **Texto principal**: `#212529` - Para textos principais
- **Texto secundário**: `#6c757d` - Para textos de menor importância
- **Bordas e divisores**: `#dee2e6` - Para separação sutil de elementos

### Tema Escuro (Novo)
- **Fundo escuro**: `#121212` - Fundo principal no tema escuro
- **Fundo de cartões escuro**: `#1e1e1e` - Para cartões no tema escuro
- **Texto claro**: `#f8f9fa` - Para textos no tema escuro
- **Texto secundário escuro**: `#adb5bd` - Para textos secundários no tema escuro

## Tipografia

- **Fonte principal**: 'Inter', sans-serif - Substitui Roboto por uma fonte mais moderna e legível
- **Hierarquia de tamanhos**:
  - Títulos principais: 2rem (32px)
  - Subtítulos: 1.5rem (24px)
  - Texto normal: 1rem (16px)
  - Texto pequeno: 0.875rem (14px)
  - Texto muito pequeno: 0.75rem (12px)

## Layout e Componentes

### Dashboard Redesenhado
- **Visão geral financeira**: Cards maiores e mais visuais para saldo, despesas e próximos vencimentos
- **Gráficos interativos**: Implementação de gráficos com animações e interatividade
- **Resumo de categorias**: Visualização rápida das principais categorias de gastos
- **Calendário financeiro**: Visualização de eventos financeiros em formato de calendário mais intuitivo
- **Indicadores de progresso**: Barras de progresso para metas e limites de gastos

### Menu Lateral Aprimorado
- **Perfil do usuário**: Área para foto e nome do usuário logado
- **Navegação por ícones**: Menu colapsável que se transforma em ícones em telas menores
- **Categorização**: Agrupamento de itens relacionados (ex: Despesas, Relatórios e Previsões)
- **Indicadores visuais**: Badges para notificações e alertas importantes
- **Acesso rápido**: Atalhos para ações frequentes

### Cards e Containers
- **Design Neumórfico suavizado**: Manter o estilo neumórfico atual, mas mais sutil e moderno
- **Sombras dinâmicas**: Sombras que respondem a interações do usuário
- **Bordas arredondadas**: Raio de 12px para todos os containers
- **Espaçamento consistente**: Padding interno de 24px para todos os containers
- **Estados de hover**: Feedback visual ao passar o mouse sobre elementos interativos

### Formulários e Inputs
- **Campos flutuantes**: Labels que flutuam acima do campo quando preenchido
- **Validação em tempo real**: Feedback visual imediato durante preenchimento
- **Autocompletar inteligente**: Sugestões baseadas em entradas anteriores
- **Seleção de data aprimorada**: Calendário mais intuitivo para seleção de datas
- **Botões contextuais**: Botões que mudam de aparência conforme o contexto

### Tabelas e Listas
- **Linhas alternadas**: Cores alternadas sutis para melhor legibilidade
- **Ordenação visual**: Indicadores claros de ordenação de colunas
- **Paginação moderna**: Controles de paginação mais intuitivos
- **Ações em linha**: Botões de ação diretamente nas linhas da tabela
- **Estados de linha**: Diferentes estilos para diferentes estados (vencido, pago, etc.)

## Responsividade

### Desktop (>1200px)
- Layout completo com menu lateral expandido
- Visualização de múltiplos gráficos lado a lado
- Tabelas com todas as colunas visíveis

### Tablet (768px - 1199px)
- Menu lateral colapsável (ícones + texto ao expandir)
- Reorganização de gráficos em layout de grade
- Tabelas com scroll horizontal para colunas menos importantes

### Mobile (< 767px)
- Menu inferior com ícones para navegação principal
- Menu lateral acessível via botão de hambúrguer
- Cards em layout de coluna única
- Visualizações simplificadas de gráficos
- Tabelas adaptativas com visualização de cartão

## Novas Funcionalidades na Interface

### Sistema de Login
- **Tela de login**: Design minimalista com opções de email e Google
- **Onboarding**: Tutorial rápido para novos usuários
- **Perfil de usuário**: Área para gerenciar informações pessoais e preferências

### Metas Financeiras
- **Criação de metas**: Interface intuitiva para definir objetivos financeiros
- **Acompanhamento visual**: Barras de progresso e countdown para metas
- **Celebração de conquistas**: Animações e notificações para metas alcançadas

### Orçamento Mensal
- **Definição de orçamentos**: Interface para definir limites por categoria
- **Acompanhamento em tempo real**: Indicadores visuais de progresso do orçamento
- **Alertas personalizáveis**: Configuração de alertas quando se aproximar do limite

### Análise de Tendências
- **Gráficos comparativos**: Visualização de gastos ao longo do tempo
- **Previsões visuais**: Representação gráfica de tendências futuras
- **Insights automáticos**: Cards com observações sobre padrões de gastos

## Micro-interações e Feedback

- **Animações de transição**: Transições suaves entre telas e estados
- **Feedback tátil**: Vibrações sutis em dispositivos móveis para ações importantes
- **Toasts personalizados**: Notificações temporárias com design consistente
- **Estados de carregamento**: Indicadores visuais durante operações assíncronas
- **Confirmações visuais**: Animações para confirmar ações bem-sucedidas

## Acessibilidade

- **Alto contraste**: Opção para aumentar o contraste para usuários com deficiência visual
- **Tamanho de texto ajustável**: Controles para aumentar o tamanho da fonte
- **Suporte a leitores de tela**: Atributos ARIA para compatibilidade com tecnologias assistivas
- **Navegação por teclado**: Suporte completo para uso sem mouse
- **Mensagens de erro claras**: Feedback de erro específico e acionável
