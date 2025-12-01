# 📅 Cronograma Detalhado - Sprint 1 (OkCells)

**Duração Total:** 16 horas (2 dias úteis)  
**Período:** 02/12/2025 - 03/12/2025  
**Objetivo:** Implementar funcionalidades de alta prioridade com backend já pronto

---

## 📋 Visão Geral da Sprint

| # | Funcionalidade | Tempo | Status Backend | Prioridade |
|---|----------------|-------|----------------|------------|
| 1 | Frontend Notificações In-App | 4h | ✅ 100% (10 testes) | 🔴 CRÍTICA |
| 2 | Frontend Relatório Avançado Estoque | 6h | ✅ 100% (queries prontas) | 🔴 ALTA |
| 3 | Interface Gestão de Comissões | 5h | ✅ 100% (backend completo) | 🔴 ALTA |
| **TOTAL** | **3 funcionalidades** | **15h** | **Checkpoint: 1h** | - |

---

## 🗓️ DIA 1 - Segunda-feira (02/12/2025) - 8 horas

### 🔔 **TAREFA 1: Frontend de Notificações In-App** (4 horas)
**Horário:** 09:00 - 13:00  
**Responsável:** Desenvolvedor Frontend  
**Status Backend:** ✅ Completo (10 testes passando)

#### **Subtarefas:**

**1.1 Criar Componente NotificationBell** (1h 30min)
- [ ] Criar arquivo `client/src/components/NotificationBell.tsx`
- [ ] Implementar ícone de sino com badge de contador
- [ ] Adicionar query tRPC `notifications.getUnreadCount`
- [ ] Criar dropdown com lista de notificações
- [ ] Implementar scroll infinito (últimas 10 notificações)
- [ ] Adicionar botão "Marcar todas como lidas"
- [ ] Estilizar com Tailwind CSS (tema escuro/claro)

**Dependências:** Nenhuma  
**Arquivos:** `NotificationBell.tsx`

---

**1.2 Integrar NotificationBell no DashboardLayout** (30min)
- [ ] Abrir `client/src/components/DashboardLayout.tsx`
- [ ] Importar componente NotificationBell
- [ ] Adicionar no header ao lado do perfil do usuário
- [ ] Testar responsividade mobile

**Dependências:** 1.1  
**Arquivos:** `DashboardLayout.tsx`

---

**1.3 Criar Página Central de Notificações** (1h 30min)
- [ ] Criar arquivo `client/src/pages/Notificacoes.tsx`
- [ ] Implementar lista completa de notificações
- [ ] Adicionar filtros (Todas, Não Lidas, Lidas)
- [ ] Implementar paginação (25 por página)
- [ ] Adicionar cards coloridos por tipo:
  - 🟡 Estoque Baixo (amarelo)
  - 🔴 OS Vencida (vermelho)
  - 🔵 Conta a Pagar (azul)
  - 🟢 Meta Atingida (verde)
- [ ] Implementar ação de marcar como lida ao clicar
- [ ] Adicionar timestamp relativo ("há 2 horas")

**Dependências:** 1.1  
**Arquivos:** `Notificacoes.tsx`

---

**1.4 Adicionar Rota e Testar** (30min)
- [ ] Adicionar rota `/notificacoes` em `client/src/App.tsx`
- [ ] Testar fluxo completo:
  - Badge de contador atualiza
  - Dropdown abre/fecha corretamente
  - Marcar como lida funciona
  - Central de notificações carrega
  - Filtros funcionam
- [ ] Testar em diferentes resoluções

**Dependências:** 1.1, 1.2, 1.3  
**Arquivos:** `App.tsx`

---

**✅ Entrega 1:** Sistema de notificações in-app 100% funcional  
**Checkpoint:** 13:00

---

### 📦 **TAREFA 2: Frontend Relatório Avançado de Estoque** (4 horas)
**Horário:** 14:00 - 18:00  
**Responsável:** Desenvolvedor Frontend  
**Status Backend:** ✅ Completo (queries otimizadas prontas)

#### **Subtarefas:**

**2.1 Criar Estrutura da Página** (1h)
- [ ] Criar arquivo `client/src/pages/RelatorioAvancadoEstoque.tsx`
- [ ] Implementar layout com 3 seções:
  - Painel de métricas (topo)
  - Filtros avançados (lateral)
  - Tabela de dados (principal)
- [ ] Adicionar query tRPC `reports.advancedStock`
- [ ] Adicionar query tRPC `reports.stockMetrics`
- [ ] Adicionar query tRPC `reports.filterOptions`

**Dependências:** Nenhuma  
**Arquivos:** `RelatorioAvancadoEstoque.tsx`

---

**2.2 Implementar Painel de Métricas** (30min)
- [ ] Criar 4 cards de resumo:
  - 📦 Total de Itens em Estoque
  - 💰 Valor Total em Estoque (R$)
  - 📊 Média de Dias em Estoque
  - ⚠️ Itens com Defeito
- [ ] Estilizar com cores e ícones
- [ ] Adicionar loading skeletons

**Dependências:** 2.1  
**Arquivos:** `RelatorioAvancadoEstoque.tsx`

---

**2.3 Implementar Filtros Avançados** (1h)
- [ ] Criar sidebar de filtros com:
  - 📅 Período (Data Entrada)
  - 🏢 Fornecedor (select)
  - 📍 Almoxarifado (select)
  - 🎨 Grade (select)
  - ✅ Apto para Venda (checkbox)
  - ⚠️ Com Defeito (checkbox)
  - 🔋 Bateria (range: 0-100%)
  - 📦 Dias em Estoque (range: 0-365)
- [ ] Implementar lógica de aplicar filtros
- [ ] Adicionar botão "Limpar Filtros"
- [ ] Mostrar contador de filtros ativos

**Dependências:** 2.1  
**Arquivos:** `RelatorioAvancadoEstoque.tsx`

---

**2.4 Implementar Tabela de Dados** (1h)
- [ ] Criar tabela com colunas:
  - Data Entrada
  - IMEI
  - Produto
  - Quantidade
  - Custo (R$)
  - Preço Varejo (R$)
  - Preço Atacado (R$)
  - Grade
  - Almoxarifado
  - Fornecedor
  - Bateria (%)
  - Defeito
  - Apto Venda
  - Dias em Estoque
- [ ] Implementar ordenação por colunas (clique no header)
- [ ] Adicionar paginação (25, 50, 100 itens)
- [ ] Estilizar com cores condicionais:
  - 🟢 Apto para venda
  - 🔴 Com defeito
  - 🟡 Estoque > 90 dias

**Dependências:** 2.1, 2.3  
**Arquivos:** `RelatorioAvancadoEstoque.tsx`

---

**2.5 Adicionar Exportação e Testar** (30min)
- [ ] Adicionar botões de exportação:
  - 📊 Exportar Excel
  - 📄 Exportar PDF
- [ ] Implementar exportação usando bibliotecas existentes
- [ ] Adicionar rota `/relatorio-avancado-estoque` em `App.tsx`
- [ ] Testar fluxo completo:
  - Métricas carregam
  - Filtros funcionam
  - Tabela ordena corretamente
  - Paginação funciona
  - Exportação gera arquivos

**Dependências:** 2.1, 2.2, 2.3, 2.4  
**Arquivos:** `RelatorioAvancadoEstoque.tsx`, `App.tsx`

---

**✅ Entrega 2:** Relatório avançado de estoque 100% funcional  
**Checkpoint:** 18:00

---

## 🗓️ DIA 2 - Terça-feira (03/12/2025) - 7 horas

### 💰 **TAREFA 3: Interface de Gestão de Comissões** (5 horas)
**Horário:** 09:00 - 14:00  
**Responsável:** Desenvolvedor Frontend  
**Status Backend:** ✅ Completo (backend de comissões pronto)

#### **Subtarefas:**

**3.1 Criar Página de Configuração de Regras** (2h)
- [ ] Abrir arquivo existente `client/src/pages/Comissoes.tsx`
- [ ] Adicionar nova aba "Configuração de Regras"
- [ ] Criar formulário de criação de regra:
  - 👤 Vendedor (select)
  - 📊 Tipo de Comissão (select):
    - Percentual Fixo
    - Meta Progressiva
    - Bônus por Produto
  - 💵 Valor/Percentual (input)
  - 📦 Produto (select - se bônus por produto)
  - 📅 Data Início (date)
  - 📅 Data Fim (date - opcional)
  - ✅ Ativa (checkbox)
- [ ] Implementar validações:
  - Percentual entre 0-100%
  - Datas válidas
  - Vendedor obrigatório
- [ ] Adicionar mutation tRPC `commissions.createRule`

**Dependências:** Nenhuma  
**Arquivos:** `Comissoes.tsx`

---

**3.2 Criar Lista de Regras Ativas** (1h 30min)
- [ ] Implementar tabela de regras configuradas:
  - Vendedor
  - Tipo
  - Valor/Percentual
  - Produto (se aplicável)
  - Período
  - Status (Ativa/Inativa)
  - Ações (Editar, Desativar, Excluir)
- [ ] Adicionar query tRPC `commissions.getRules`
- [ ] Implementar ações:
  - ✏️ Editar regra (modal)
  - 🔴 Desativar regra
  - 🗑️ Excluir regra (confirmação)
- [ ] Adicionar filtros:
  - Por vendedor
  - Por tipo
  - Por status

**Dependências:** 3.1  
**Arquivos:** `Comissoes.tsx`

---

**3.3 Criar Relatório Detalhado de Comissões** (1h)
- [ ] Adicionar nova aba "Relatório Detalhado"
- [ ] Implementar filtros:
  - 📅 Período (data início/fim)
  - 👤 Vendedor (select)
  - 📊 Status (Pendente, Aprovada, Paga)
- [ ] Criar tabela de comissões:
  - Data
  - Vendedor
  - Venda #
  - Cliente
  - Valor Base (R$)
  - % Comissão
  - Valor Comissão (R$)
  - Regra Aplicada
  - Status
- [ ] Adicionar totalizadores:
  - Total de Comissões
  - Total Pendente
  - Total Aprovado
  - Total Pago
- [ ] Implementar exportação (Excel/PDF)

**Dependências:** 3.1, 3.2  
**Arquivos:** `Comissoes.tsx`

---

**3.4 Adicionar Preview de Cálculo** (30min)
- [ ] Criar componente de preview ao criar/editar regra
- [ ] Mostrar simulação de cálculo:
  - "Para uma venda de R$ 1.000,00"
  - "Comissão seria: R$ XX,XX (Y%)"
- [ ] Atualizar preview em tempo real ao alterar valores
- [ ] Adicionar exemplos de cálculo por tipo de regra

**Dependências:** 3.1  
**Arquivos:** `Comissoes.tsx`

---

**3.5 Testar Fluxo Completo** (1h)
- [ ] Testar criação de regra:
  - Percentual fixo (5%)
  - Meta progressiva (3% até R$ 10k, 5% acima)
  - Bônus por produto (R$ 50 por iPhone)
- [ ] Testar edição de regra existente
- [ ] Testar desativação de regra
- [ ] Testar exclusão de regra
- [ ] Verificar cálculo automático em vendas
- [ ] Testar relatório detalhado com filtros
- [ ] Testar exportação de relatório
- [ ] Verificar responsividade mobile

**Dependências:** 3.1, 3.2, 3.3, 3.4  
**Arquivos:** `Comissoes.tsx`

---

**✅ Entrega 3:** Interface de gestão de comissões 100% funcional  
**Checkpoint:** 14:00

---

### 📝 **TAREFA 4: Revisão e Checkpoint Final** (2 horas)
**Horário:** 14:00 - 16:00  
**Responsável:** Tech Lead / QA

#### **Subtarefas:**

**4.1 Testes de Integração** (1h)
- [ ] Testar fluxo de notificações end-to-end
- [ ] Testar relatório avançado com dados reais (1.392 registros)
- [ ] Testar gestão de comissões com múltiplas regras
- [ ] Verificar performance (carregamento < 2s)
- [ ] Testar em diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Verificar acessibilidade (WCAG 2.1)

**Dependências:** Todas as tarefas anteriores  
**Arquivos:** Todos

---

**4.2 Correção de Bugs e Ajustes** (30min)
- [ ] Corrigir bugs encontrados nos testes
- [ ] Ajustar estilos e alinhamentos
- [ ] Otimizar queries lentas
- [ ] Adicionar loading states faltantes
- [ ] Melhorar mensagens de erro

**Dependências:** 4.1  
**Arquivos:** Vários

---

**4.3 Documentação e Checkpoint** (30min)
- [ ] Atualizar `todo.md` marcando itens concluídos
- [ ] Criar checkpoint no sistema
- [ ] Documentar funcionalidades implementadas
- [ ] Criar guia rápido de uso para usuários
- [ ] Preparar demo para apresentação

**Dependências:** 4.1, 4.2  
**Arquivos:** `todo.md`, `CHANGELOG.md`

---

**✅ Entrega Final:** Sprint 1 completa com 3 funcionalidades de alta prioridade  
**Checkpoint:** 16:00

---

## 📊 Resumo de Entregas

| Funcionalidade | Arquivos Criados | Arquivos Modificados | Testes | Status |
|----------------|------------------|----------------------|--------|--------|
| Notificações In-App | 2 novos | 2 modificados | Backend: 10 ✅ | 🔴 A fazer |
| Relatório Avançado | 1 novo | 1 modificado | Backend: ✅ | 🔴 A fazer |
| Gestão de Comissões | 0 novos | 1 modificado | Backend: ✅ | 🔴 A fazer |
| **TOTAL** | **3 arquivos** | **4 arquivos** | **10+ testes** | - |

---

## 🎯 Critérios de Aceitação

### ✅ Notificações In-App
- [ ] Badge de contador atualiza em tempo real
- [ ] Dropdown abre/fecha suavemente
- [ ] Notificações são marcadas como lidas ao clicar
- [ ] Central de notificações tem paginação
- [ ] Filtros funcionam corretamente
- [ ] Responsivo em mobile

### ✅ Relatório Avançado de Estoque
- [ ] Métricas carregam em < 2 segundos
- [ ] Filtros aplicam corretamente
- [ ] Tabela ordena por qualquer coluna
- [ ] Paginação funciona (25/50/100 itens)
- [ ] Exportação Excel/PDF funciona
- [ ] Exibe todos os 1.392 registros importados

### ✅ Gestão de Comissões
- [ ] Formulário de regra valida corretamente
- [ ] Preview de cálculo atualiza em tempo real
- [ ] Lista de regras permite editar/desativar/excluir
- [ ] Relatório detalhado filtra corretamente
- [ ] Totalizadores calculam corretamente
- [ ] Exportação funciona

---

## 🚀 Próximos Passos (Sprint 2)

Após conclusão da Sprint 1, iniciar:
1. Formulário de Emissão Manual de NF-e (8h)
2. Personalização de Recibo (4h)
3. Alteração de Senhas (3h)

---

## 📞 Contatos e Suporte

**Tech Lead:** [Nome]  
**Frontend Dev:** [Nome]  
**Backend Dev:** [Nome] (suporte)  
**QA:** [Nome]

**Daily Standup:** 09:00 (15 minutos)  
**Revisão de Sprint:** 03/12 às 16:00

---

**Criado em:** 01/12/2025  
**Última atualização:** 01/12/2025  
**Versão:** 1.0
