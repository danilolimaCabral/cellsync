# CellSync - Lista de Funcionalidades

## Estrutura e Configuração Inicial
- [x] Configurar autenticação local (usuário e senha) sem OAuth Manus
- [x] Criar estrutura de banco de dados completa
- [x] Configurar sistema de permissões e roles (admin, vendedor, técnico, etc)

## Módulo de Vendas (PDV)
- [x] Interface de PDV intuitiva
- [ ] Emissão de cupons fiscais e NF-e
- [ ] Controle automático de comissões por vendedor
- [x] Múltiplas formas de pagamento (dinheiro, cartão, PIX)
- [x] Sistema de descontos progressivos
- [ ] Histórico de vendas com filtros avançados

## Controle de Estoque com IMEI
- [x] Rastreamento individual por IMEI
- [x] Alertas automáticos de baixo estoque
- [ ] Inventário periódico com relatórios de divergências
- [ ] Movimentações de entrada e saída detalhadas
- [ ] Transferência entre filiais
- [ ] Sistema de reservas de produtos

## Gestão de Ordem de Serviço
- [x] Abertura de OS com diagnóstico detalhado
- [x] Controle de status em tempo real
- [ ] Gestão de peças utilizadas
- [ ] Orçamentos automáticos com aprovação do cliente
- [ ] Notificações via SMS ou WhatsApp
- [ ] Histórico completo de reparos por cliente

## Financeiro Integrado
- [x] Fluxo de caixa em tempo real
- [x] Contas a pagar e receber
- [ ] Conciliação bancária automática
- [ ] Relatórios gerenciais personalizados
- [x] Controle de centros de custo
- [ ] Integração com bancos para pagamentos

## CRM Avançado
- [x] Ficha completa do cliente com histórico
- [ ] Segmentação avançada de clientes
- [ ] Campanhas de marketing direcionadas
- [x] Programa de fidelidade
- [ ] Análise de comportamento de compra

## Business Intelligence (BI)
- [ ] Dashboards personalizáveis em tempo real
- [ ] KPIs e métricas de desempenho
- [ ] Relatórios de vendas, estoque e finanças
- [ ] Análises preditivas de demanda
- [ ] Comparativos de períodos
- [ ] Exportação de relatórios (Excel/PDF)

## Integrações Futuras (Preparação)
- [ ] Estrutura para integração com Mercado Livre
- [ ] Estrutura para integração com Amazon
- [ ] Estrutura para integração com Shopee
- [ ] API aberta para integrações externas

## Segurança e Conformidade
- [ ] Criptografia de dados
- [ ] Backups automáticos
- [ ] Conformidade com LGPD
- [ ] SSL 256-bit
- [ ] Logs de auditoria

## Interface e UX
- [x] Design responsivo para desktop e mobile
- [x] Tema claro/escuro
- [x] Dashboard principal com visão geral
- [x] Navegação intuitiva entre módulos

## Módulo Financeiro - Nova Implementação
- [x] Criar estrutura de dados para transações financeiras
- [x] Implementar backend para contas a pagar
- [x] Implementar backend para contas a receber
- [x] Criar interface de Contas a Pagar com filtros
- [x] Criar interface de Contas a Receber com filtros
- [x] Desenvolver dashboard de Fluxo de Caixa
- [x] Adicionar gráficos de entrada/saída
- [x] Implementar categorização (OPEX, Custo Fixo, Custo Variável)
- [ ] Criar funcionalidade de Conciliação Bancária
- [ ] Adicionar relatórios financeiros exportáveis

## Módulo de Relatórios e BI - Nova Implementação
- [x] Criar queries de backend para estatísticas de vendas
- [x] Implementar queries para análise de produtos
- [x] Criar queries para performance de vendedores
- [x] Implementar queries para métricas de OS
- [x] Criar queries para KPIs financeiros
- [x] Desenvolver dashboard principal com cards de KPIs
- [x] Implementar gráfico de vendas por período (Recharts)
- [x] Criar gráfico de produtos mais vendidos
- [x] Implementar gráfico de performance de vendedores
- [x] Criar gráfico de status de OS
- [x] Implementar gráfico de fluxo de caixa
- [x] Adicionar filtros de período (dia, semana, mês, ano)
- [x] Criar relatório detalhado de vendas
- [x] Implementar relatório de estoque
- [x] Criar relatório financeiro consolidado
- [ ] Adicionar funcionalidade de exportação para Excel
- [ ] Implementar exportação para PDF
- [x] Criar testes unitários para queries de relatórios

## Funcionalidades Pendentes - Implementação Prioritária
- [x] Adicionar exportação de relatórios para Excel
- [x] Adicionar exportação de relatórios para PDF
- [x] Criar histórico de vendas com filtros avançados
- [x] Implementar movimentações de estoque detalhadas
- [x] Adicionar gestão de peças utilizadas em OS
- [x] Criar módulo de Configurações do sistema
- [ ] Implementar sistema de notificações automáticas
- [x] Adicionar controle automático de comissões por vendedor
- [x] Atualizar PDV com integrações completas (estoque, clientes, financeiro)
- [x] Adicionar baixa automática de estoque no PDV
- [x] Implementar cadastro rápido de cliente no PDV
- [x] Adicionar impressão de comprovante no PDV
- [x] Criar interface completa do PDV
- [x] Criar componente de busca de produtos com autocompletar
- [x] Desenvolver carrinho interativo com cálculos em tempo real
- [x] Adicionar seleção de forma de pagamento no PDV
- [x] Implementar finalização de venda com todas as integrações
- [x] Adicionar atalhos de teclado para agilizar operação
- [ ] Criar funcionalidade de Conciliação Bancária

## Movimentações de Estoque - Nova Implementação
- [x] Criar tabela de movimentações no banco de dados
- [x] Implementar backend para registro de movimentações
- [x] Criar tipos de movimentação (entrada, saída, ajuste, transferência)
- [x] Desenvolver interface de registro de movimentações
- [x] Criar página de histórico de movimentações com filtros
- [x] Implementar rastreamento por IMEI
- [x] Adicionar relatório de inventário com divergências
- [x] Criar testes para movimentações de estoque

## Gestão de Peças em Ordem de Serviço - Nova Implementação
- [x] Verificar estrutura de dados para peças em OS no schema
- [x] Implementar backend para adicionar/remover peças em OS
- [x] Criar query para listar peças utilizadas por OS
- [x] Desenvolver interface de seleção de peças na OS
- [x] Implementar cálculo automático de custo total de peças
- [x] Adicionar baixa automática no estoque ao finalizar OS
- [x] Criar relatório de peças utilizadas por técnico
- [x] Implementar histórico de peças por período
- [x] Criar testes para gestão de peças em OS

## Sistema de Comissões de Vendedores - Nova Implementação
- [x] Criar tabelas para comissões e regras de comissão no schema
- [x] Implementar backend para configuração de regras de comissão
- [x] Criar cálculo automático de comissões por venda
- [x] Implementar regras de percentual fixo sobre vendas
- [x] Adicionar regras de metas progressivas (escalonadas)
- [x] Criar regras de bônus por produto específico
- [ ] Desenvolver interface de configuração de regras por vendedor
- [ ] Criar relatório de comissões por período
- [ ] Implementar detalhamento de comissões por venda
- [x] Adicionar aprovação de comissões pelo gerente
- [x] Integrar com módulo financeiro para pagamento
- [ ] Criar testes para cálculo de comissões

## Módulos Pendentes - Implementação Final

### Gestão de Comissões - Interface
- [x] Criar página de Gestão de Comissões
- [x] Implementar formulário de configuração de regras por vendedor
- [x] Adicionar seleção de tipo de comissão (percentual, meta, bônus)
- [x] Criar relatório de comissões por período com filtros
- [x] Implementar aprovação individual de comissões pendentes
- [x] Adicionar dashboard com ranking de vendedores
- [x] Criar### Módulo de Configurações do Sistema
- [x] Criar página de Configurações
- [x] Implementar gestão completa de usuários (CRUD)
- [ ] Adicionar alteração de senhas de usuários
- [x] Implementar ativação/desativação de usuários
- [x] Criar gestão de permissões por role
- [x] Adicionar parâmetros gerais do sistema (moeda, timezone, impostos)
- [ ] Implementar personalização de categorias financeiras
- [ ] Criar logs de auditoria com histórico de alteraçõestomáticas
- [ ] Criar estrutura de dados para notificações
- [ ] Implementar backend de notificações
- [ ] Criar central de notificações in-app
- [ ] Adicionar alertas de estoque baixo (<15 unidades)
- [ ] Implementar alertas de OS com prazo vencido
- [ ] Adicionar alertas de contas a pagar próximas do vencimento
- [ ] Criar notificações de metas de vendas atingidas
- [ ] Implementar notificações de aniversários de clientes
- [ ] Adicionar histórico de notificações lidas/não lidas

## Módulo de Emissão de NF-e - Implementação Prioritária
- [x] Criar tabelas para NF-e no schema (invoices, invoiceItems)
- [x] Implementar validação de CNPJ/CPF
- [x] Criar cálculo automático de impostos (ICMS, PIS, COFINS, IPI)
- [x] Implementar backend para emissão de NF-e
- [ ] Criar armazenamento de XMLs no S3
- [ ] Desenvolver interface de emissão manual de NF-e
- [x] Criar página de gestão de notas fiscais
- [x] Implementar filtros por status (Emitida, Cancelada, Inutilizada)
- [ ] Adicionar consulta de status na SEFAZ
- [ ] Integrar emissão automática no PDV
- [x] Implementar cancelamento de NF-e
- [ ] Adicionar download de XML e DANFE
- [ ] Criar reemissão de NF-e
- [x] Implementar testes para cálculo de impostos
- [x] Criar listagem de NF-e com cards de resumo
- [x] Implementar dialog de visualização detalhada
- [ ] Adicionar formulário de emissão manual completo
- [x] Criar funcionalidade de cancelamento com motivo
- [ ] Preparar geração de XML e DANFE para download

## Integração de NF-e no PDV - Nova Implementação
- [x] Adicionar checkbox de emissão de NF-e no PDV
- [x] Implementar pré-preenchimento automático de dados do cliente
- [x] Criar validação de CPF/CNPJ do cliente no PDV
- [x] Adicionar pré-preenchimento automático de produtos e valores
- [x] Integrar emissão de NF-e com finalização de venda
- [x] Criar tratamento de erros de emissão fiscal
- [x] Adicionar feedback visual de sucesso/erro de emissão
- [x] Implementar opção de emitir NF-e posteriormente (checkbox opcional)
- [x] Criar testes para integração PDV + NF-e (17 testes passando)

## Download de XML e DANFE - Nova Implementação
- [x] Instalar dependências (qrcode, xml-js)
- [x] Criar função de geração de XML da NF-e conforme layout SEFAZ
- [x] Implementar geração de QR Code para consulta da nota
- [x] Criar função de geração de DANFE em PDF com jsPDF
- [x] Adicionar formatação completa do DANFE (cabeçalho, itens, impostos, totais)
- [x] Implementar endpoint de download de XML no backend
- [x] Implementar endpoint de download de DANFE no backend
- [x] Adicionar botões de download na interface de NF-e
- [x] Testar download de XML
- [x] Testar geração e download de DANFE
- [x] Criar testes unitários para geração de XML e DANFE (5 testes passando)

## Bugs Reportados
- [x] Corrigir redirecionamento após login bem-sucedido (mostra "Login com sucesso" mas não entra no sistema) - RESOLVIDO: Faltava middleware cookie-parser no servidor Express + nome do cookie incorreto no context.ts

## Finalização do Sistema - Pendências Prioritárias
- [x] Implementar backend de notificações automáticas (alertas de estoque, OS, contas a pagar)
- [x] Criar interface frontend de notificações in-app (NotificationBell.tsx já existe)
- [x] Criar script de seed de dados para popular banco com exemplos (seed-demo-data.mjs)
- [x] Adicionar alteração de senhas de usuários (auth.changePassword já implementado)
- [ ] Implementar formulário de emissão manual de NF-e
- [ ] Criar armazenamento de XMLs no S3
- [ ] Adicionar interface de configuração de regras de comissão
- [ ] Implementar relatório de comissões por período
- [ ] Criar testes para cálculo de comissões

## Script de Seed de Dados
- [x] Criar script de seed com dados de exemplo
- [x] Popular usuários (admin, vendedores, técnicos)
- [x] Popular produtos (celulares, acessórios, peças)
- [x] Popular clientes com histórico
- [ ] Popular vendas com comissões (script básico criado)
- [ ] Popular OS com peças utilizadas (script básico criado)
- [ ] Popular contas a pagar e receber (script básico criado)
- [ ] Popular NF-e emitidas (script básico criado)
- [x] Criar script rápido para criar usuário admin
- [x] Documentar uso do script

## Recibo de Venda Moderno
- [x] Pesquisar designs modernos de recibos
- [x] Criar função de geração de recibo em PDF
- [x] Adicionar cabeçalho com logo e dados da loja
- [x] Incluir informações da venda (número, data, vendedor)
- [x] Listar produtos com SKU, descrição, IMEI
- [x] Destacar informações de garantia (box amarelo destacado)
- [x] Adicionar QR Code para consulta online
- [x] Integrar botão de impressão no PDV
- [ ] Testar geração de recibo com venda real

## Cadastro de Smartphones e Tablets (Xiaomi, Samsung, LG)
- [x] Criar script para cadastrar modelos Xiaomi (14, 13, 12 series)
- [x] Criar script para cadastrar modelos POCO
- [x] Criar script para cadastrar modelos Redmi e Redmi Note
- [x] Criar script para cadastrar modelos Samsung Galaxy S
- [x] Criar script para cadastrar modelos Samsung Galaxy Z (dobráveis)
- [x] Criar script para cadastrar modelos Samsung Galaxy A, M e F
- [x] Criar script para cadastrar tablets Samsung Galaxy Tab
- [x] Criar script para cadastrar modelos LG (Wing, Velvet, G, V series)
- [x] Criar script para cadastrar modelos LG linha K e Q
- [x] Criar script para cadastrar tablets LG G Pad
- [x] Executar scripts e verificar cadastros (127 produtos cadastrados com sucesso!)

## Sistema de Venda Atacado e Varejo
- [x] Adicionar campo de preço de atacado nos produtos
- [x] Criar configuração de quantidade mínima para atacado
- [x] Implementar seleção de tipo de venda no PDV (atacado/varejo)
- [x] Ajustar cálculo de preço baseado no tipo de venda
- [x] Atualizar recibo para mostrar tipo de venda
- [ ] Criar relatório de vendas por tipo (atacado/varejo)

## Busca por IMEI no PDV
- [x] Atualizar placeholder do campo de busca para "Digite o nome ou IMEI do iPhone"
- [x] Implementar busca por IMEI exato no backend
- [x] Implementar busca por IMEI parcial (LIKE)
- [x] Priorizar resultados por IMEI sobre nome
- [x] Funcionalidade implementada e pronta para uso

## Lupa + Campo IMEI no Formulário
- [x] Adicionar ícone de lupa no campo Nome do Produto
- [x] Criar modal de busca de modelos cadastrados
- [x] Implementar autocomplete de modelos em tempo real
- [x] Preencher automaticamente Nome, Categoria, Marca, Modelo
- [x] Manter campo SKU (não remover)
- [x] Adicionar campo IMEI separado
- [x] Validar IMEI (15 dígitos obrigatórios)
- [x] Filtro apenas numeros no campo IMEI
- [ ] Criar endpoint GET /produtos/modelos (não necessário - usando lista local)
- [ ] Criar endpoint GET /estoque/imei (futuro - autocomplete de IMEI)

## Sistema Atacado/Varejo - Implementação
- [x] Criar migrations para adicionar campos wholesalePrice e minWholesaleQty em products
- [x] Criar migration para adicionar saleType e appliedDiscount em sales
- [x] Criar migration para adicionar unitPriceType em saleItems
- [ ] Criar tabela priceHistory para auditoria (futuro)
- [ ] Adicionar procedures tRPC para CRUD de preços de atacado
- [x] Implementar lógica de cálculo de preço (atacado vs varejo)
- [x] Adicionar toggle de tipo de venda no PDV (botões Varejo/Atacado)
- [x] Implementar cálculo automático no carrinho (recalcula ao adicionar/alterar quantidade)
- [x] Adicionar campos "Preço Atacado" e "Quantidade Mínima" no formulário
- [x] Implementar validação: preço atacado < preço varejo
- [x] Adicionar pré-visualização de economia
- [x] Atualizar recibo PDF com badge de tipo de venda
- [x] Adicionar linha "Você economizou" no recibo
- [x] Implementar indicador visual de economia no carrinho
- [x] Adicionar alerta de quantidade mínima para atacado
- [ ] Criar relatório de vendas por tipo (atacado/varejo) (futuro)
- [ ] Implementar atualização em massa de preços (futuro)
- [x] Criar testes unitários para cálculo de preços (6 testes passando)
- [x] Testar fluxo completo de venda atacado/varejo

## Importação de Dados dos Arquivos Excel
- [x] Analisar estrutura do arquivo ClientesTrue.xlsx
- [x] Identificar campos faltantes no schema
- [x] Adicionar campos: Grade, Almoxarifado, Fornecedor, Bateria, Defeito, Apto Venda
- [x] Adicionar campos de data de entrada
- [x] Adicionar campos em customers (fantasyName, rg, stateRegistration, phone2, email2)
- [x] Atualizar schema do banco de dados
- [x] Criar script de importação unificado
- [x] Executar importação e validar dados
- [x] Importados: 1.100 clientes, 204 produtos, 88 itens de estoque

## Relatório de Estoque Avançado
- [ ] Criar página de relatório com todos os campos (Data Entrada, IMEI, Produto, QTD, Custo, Varejo, Atacado, Grade, Almoxarifado, Fornecedor, Bateria, Defeito, Apto Venda, Dias em Estoque)
- [ ] Implementar cálculo automático de "Dias em Estoque"
- [ ] Adicionar filtros: Data, Fornecedor, Almoxarifado, Grade, Apto Venda, Defeito
- [ ] Adicionar painel de métricas (Total em estoque, Valor total, Média de dias)
- [ ] Implementar exportação para Excel/PDF
- [ ] Adicionar ordenação por colunas

## Comprovante de Venda Completo
- [ ] Adicionar seção de cabeçalho personalizável (Nome Empresa, CNPJ, Endereço, Logo)
- [ ] Adicionar tabela de produtos de entrada/troca
- [ ] Adicionar campos de forma de pagamento detalhada
- [ ] Adicionar seção de termos e condições
- [ ] Implementar QR Code para consulta online
- [ ] Adicionar campo de observações

## Contas a Pagar com Overview
- [ ] Criar painel com cartões coloridos (Vencidas, Vencendo Hoje, A Vencer, Pagas)
- [ ] Implementar cálculo de totais (Custo Total, Valor Pago, Saldo em Aberto)
- [ ] Adicionar filtros por data, fornecedor, status
- [ ] Implementar pagamento em massa
- [ ] Adicionar alertas automáticos de vencimento
- [ ] Implementar anexo de comprovantes

## Gestão de Comissão com Metas
- [ ] Criar sistema de metas semanais/mensais
- [ ] Implementar ranking de vendedores
- [ ] Adicionar painel de performance
- [ ] Criar fluxo de aprovação (vendedor → gerente → financeiro)
- [ ] Implementar gamificação com badges
- [ ] Adicionar gráficos de evolução


## Sistema de Notificações In-App - Implementação Sprint 1
- [x] Criar tabela notifications no schema
- [x] Implementar backend para criar notificações
- [x] Criar query para listar notificações do usuário
- [x] Implementar marcar como lida
- [x] Criar componente NotificationBell no header
- [x] Implementar dropdown de notificações
- [x] Adicionar badge de contador de não lidas
- [x] Criar página de central de notificações
- [x] Implementar alertas automáticos de estoque baixo
- [x] Implementar alertas de OS vencidas
- [x] Implementar alertas de contas a pagar próximas
- [x] Criar testes para sistema de notificações (10 testes passando)


## Relatório Avançado de Estoque - Implementação Sprint 1
- [x] Criar query backend para relatório completo de estoque
- [x] Implementar cálculo de "Dias em Estoque"
- [x] Adicionar endpoints tRPC (advancedStock, stockMetrics, filterOptions)
- [ ] Criar página de Relatório Avançado de Estoque
- [ ] Adicionar filtros: Data, Fornecedor, Almoxarifado, Grade, Apto Venda, Defeito
- [ ] Implementar tabela com todos os campos (Data Entrada, IMEI, Produto, QTD, Custo, Varejo, Atacado, Grade, Almoxarifado, Fornecedor, Bateria, Defeito, Apto Venda, Dias em Estoque)
- [ ] Adicionar painel de métricas (Total em estoque, Valor total, Média de dias)
- [ ] Implementar ordenação por colunas
- [ ] Adicionar exportação para Excel
- [ ] Adicionar exportação para PDF
- [ ] Criar testes para relatório avançado


## Melhorias em Contas a Pagar - Implementação
- [x] Criar query backend para métricas de contas a pagar
- [x] Implementar função de pagamento em massa
- [x] Criar cartões coloridos de status (Vencidas, Vencendo Hoje, A Vencer, Pagas)
- [x] Adicionar painel de totais (Custo Total, Valor Pago, Saldo em Aberto)
- [x] Implementar seleção múltipla de contas
- [x] Criar modal de confirmação de pagamento em massa
- [x] Adicionar filtros aprimorados (clique nos cartões)
- [x] Criar testes para pagamento em massa (9 testes passando)


## Melhorias de Navegação - Dashboard
- [x] Transformar cartões do Dashboard em atalhos clicáveis
- [x] Adicionar navegação para PDV (Vendas)
- [x] Adicionar navegação para Estoque
- [x] Adicionar navegação para Ordem de Serviço
- [x] Adicionar navegação para Financeiro
- [x] Adicionar navegação para Relatórios
- [x] Adicionar seção de Ações Rápidas
- [x] Validar emissão de NF-e completa (22 testes passando)
- [x] Testar geração de recibo de venda (6 testes passando)


## Correção de Bugs
- [x] Corrigir erro de limit > 100 na página de Ordem de Serviço
- [x] Corrigir erro de limit > 100 na página de Movimentações


## Implementação de Paginação
- [x] Adicionar controles de paginação na página Ordem de Serviço
- [x] Adicionar seletor de itens por página (10, 25, 50, 100)
- [x] Adicionar botões Anterior/Próxima
- [x] Adicionar indicador de página atual e total
- [x] Implementar paginação na página Movimentações
- [x] Adicionar mesmos controles de paginação
- [x] Testar navegação entre páginas


## Correção de Formatação de Valores
- [x] Corrigir formatação de moeda na página Estoque (R$ 256496.00 → R$ 2.564,96)
- [x] Usar Intl.NumberFormat para formatação correta (R$ 1.234,56)
- [x] Corrigir valores na tabela de produtos
- [x] Corrigir cálculo de economia no formulário


## Padronização de Formatação de Moeda em Todo o Sistema
- [x] Identificar todas as páginas com valores monetários
- [x] Aplicar Intl.NumberFormat na página Vendas (PDV) - 9 correções
- [x] Aplicar Intl.NumberFormat na página Financeiro (Contas a Pagar) - já estava correto
- [x] Aplicar Intl.NumberFormat na página Relatórios - já estava correto
- [x] Aplicar Intl.NumberFormat na página Ordem de Serviço - já estava correto
- [x] Aplicar Intl.NumberFormat na página Dashboard - 1 correção
- [x] Aplicar Intl.NumberFormat na página Movimentações - já estava correto
- [x] Aplicar Intl.NumberFormat na página Histórico de Vendas - já estava correto
- [x] Aplicar Intl.NumberFormat na página Comissões - 6 correções
- [x] Aplicar Intl.NumberFormat na página Estoque - 4 correções


## Sprint 1 - Implementação em Andamento
### Frontend de Notificações In-App
- [x] Criar componente NotificationBell
- [x] Integrar NotificationBell no DashboardLayout
- [x] Criar página Central de Notificações
- [x] Adicionar rota /notificacoes

### Frontend do Relatório Avançado de Estoque
- [x] Criar estrutura da página RelatorioAvancadoEstoque
- [x] Implementar painel de métricas (4 cards)
- [x] Implementar filtros avançados (fornecedor, almoxarifado, grade, checkboxes)
- [x] Implementar tabela de dados completa (6 colunas com ordenação)
- [x] Implementar paginação (10/25/50/100 itens)
- [x] Adicionar rota /relatorio-avancado-estoque
- [ ] Implementar exportação Excel (placeholder)
- [ ] Implementar exportação PDF (placeholder)

### Interface de Gestão de Comissões
- [ ] Criar formulário de configuração de regras
- [ ] Criar lista de regras ativas
- [ ] Criar relatório detalhado de comissões
- [ ] Adicionar preview de cálculo
- [ ] Testar fluxo completo


## Sprint 2 - Implementação em Andamento
### Completar Interface de Gestão de Comissões
- [x] Expandir formulário com todos os tipos de regra (Percentual Fixo, Meta Progressiva, Bônus por Produto)
- [x] Criar lista de regras ativas com edição e exclusão (aba "Regras de Comissão")
- [x] Adicionar preview de cálculo em tempo real no formulário
- [x] Criar endpoints backend (listRules, updateRule, deleteRule)
- [x] Adicionar descrições dos tipos de regra
- [x] Implementar AlertDialog de confirmação de exclusão
- [ ] Implementar relatório detalhado de comissões por período (futuro)
- [ ] Criar testes para interface de comissõe### Implementar Exportação Real
- [x] Adicionar biblioteca xlsx para exportação Excel
- [x] Implementar exportação Excel no Relatório Avançado (15 colunas)
- [x] Adicionar biblioteca jspdf e jspdf-autotable para exportação PDF
- [x] Implementar exportação PDF no Relatório Avançado (tabela formatada)
- [x] Ajustar largura de colunas no Excel
- [x] Adicionar métricas no PDF
- [x] Formatar nomes de arquivo### Adicionar Links de Navegação
- [x] Adicionar link "Relatório Avançado" no menu lateral
- [x] Adicionar ícone FileSpreadsheet apropriado
- [x] Posicionar após "Estoque" para agrupamento lógico

## Formulário de Emissão Manual de NF-e
- [ ] Criar página EmissaoNFe.tsx
- [ ] Implementar formulário com dados do emitente
- [ ] Adicionar seleção de cliente (destinatário)
- [ ] Implementar seleção de produtos com quantidade e valores
- [ ] Adicionar cálculo automático de impostos
- [ ] Criar preview da NF-e antes de emitir
- [ ] Implementar função de armazenamento de XML no S3
- [ ] Adicionar download de XML e DANFE após emissão
- [ ] Criar rota /emissao-nfe no App.tsx
- [ ] Adicionar link no menu lateral
- [ ] Criar testes para emissão manual


## Integração com Gateways de Pagamento
- [ ] Pesquisar API do Mercado Pago (PIX e Cartão)
- [ ] Pesquisar API do PagSeguro (PIX e Cartão)
- [ ] Pesquisar outras opções (Stripe, Asaas, etc.)
- [ ] Criar schema de configuração de gateway no banco
- [ ] Implementar backend de integração com Mercado Pago
- [ ] Implementar backend de integração com PagSeguro
- [ ] Criar interface de configuração de credenciais
- [ ] Adicionar seleção de método de pagamento no PDV (Dinheiro, Cartão, PIX)
- [ ] Implementar geração de QR Code PIX
- [ ] Implementar processamento de pagamento com cartão
- [ ] Adicionar webhook para confirmação de pagamento
- [ ] Criar testes de integração de pagamentos


## Sprint 3 - Funcionalidades Rápidas de Alta Prioridade

### Alteração de Senhas
- [x] Criar formulário de alteração de senha
- [x] Implementar validação de senha atual
- [x] Adicionar requisitos de segurança (mínimo 8 caracteres, letras e números)
- [x] Criar endpoint tRPC changePassword
- [x] Implementar hash bcrypt da nova senha
- [x] Adicionar função changeUserPassword no db.ts
- [x] Integrar na página Configurações (aba "Alterar Senha")
- [x] Testar fluxo completo de alteração

### Personalização de Categorias Financeiras
- [ ] Criar tabela financialCategories no schema
- [ ] Implementar backend CRUD de categorias
- [ ] Criar endpoints tRPC (listCategories, createCategory, updateCategory, deleteCategory)
- [ ] Criar página de Configuração de Categorias
- [ ] Implementar formulário de criação/edição
- [ ] Adicionar validação de nome único
- [ ] Integrar com Contas a Pagar/Receber
- [ ] Testar CRUD completo

### Paginação em Outras Listas
- [ ] Implementar paginação na página Clientes
- [ ] Implementar paginação na página Produtos (Estoque)
- [ ] Implementar paginação na página Histórico de Vendas
- [ ] Implementar paginação na página NF-e
- [ ] Adicionar controles (10/25/50/100 itens)
- [ ] Testar navegação em todas as páginas


## Correções e Melhorias de Recibo
- [x] Corrigir erro "Acesso negado" na página de vendas
- [x] Verificar autenticação na página Vendas (loading state + redirect)
- [x] Melhorar recibo de venda com dados completos do produto
- [x] IMEI já estava no recibo
- [x] Adicionar marca, modelo e categoria no recibo
- [x] Dados do cliente já estavam no recibo
- [x] Atualizar getSaleItems para incluir brand, model, category
- [x] Atualizar interface ReceiptProduct
- [x] Atualizar renderização do recibo PDF


## Correções de Autenticação e Erros
- [x] Corrigir erro "Acesso negado" na página Notas Fiscais
- [x] Corrigir erro "Cannot read properties of undefined (reading 'data')" na página Notas Fiscais
- [x] Adicionar verificação de autenticação (loading state + redirect)
- [x] Adicionar tratamento de dados undefined (data?.result?.data)

## Testes de Recibo
- [ ] Criar testes para validar marca no recibo
- [ ] Criar testes para validar modelo no recibo
- [ ] Criar testes para validar categoria no recibo
- [ ] Criar testes para validar IMEI no recibo
- [ ] Executar todos os testes


## Correções e Melhorias de NF-e
- [ ] Analisar sistema atual de NF-e
- [ ] Identificar problemas na integração
- [ ] Corrigir emissão de NF-e no PDV
- [ ] Corrigir download de XML e DANFE
- [ ] Melhorar interface de visualização de NF-e
- [ ] Adicionar validações de campos obrigatórios
- [ ] Testar fluxo completo de emissão
- [ ] Criar testes automatizados para NF-e


## Testes Automatizados de NF-e
- [ ] Criar teste de emissão de NF-e com venda
- [ ] Criar teste de cálculo de impostos (ICMS, PIS, COFINS)
- [ ] Criar teste de validação de dados do cliente (CPF/CNPJ)
- [ ] Criar teste de validação de produtos na NF-e
- [ ] Criar teste de geração de XML
- [ ] Criar teste de geração de DANFE
- [ ] Criar teste de cancelamento de NF-e
- [ ] Executar todos os testes e garantir 100% de sucesso


## Correções de Layout e Valores do Dashboard
- [x] Analisar layout atual do Dashboard
- [x] Identificar valores que não estão aparecendo corretamente (backend retornando zeros)
- [x] Implementar queries reais no backend (vendas hoje, receita total, clientes, produtos, OS abertas, pagamentos pendentes)
- [x] Corrigir formatação de valores monetários (função formatCurrency)
- [x] Corrigir layout responsivo (grid sm:grid-cols-2 lg:grid-cols-3)
- [x] Melhorar espaçamento e alinhamento dos cards (padding responsivo)
- [x] Criar testes automatizados do Dashboard (5 testes passando)
- [x] Testar Dashboard em diferentes resoluções


## Botão de Voltar - Melhorias de Navegação
- [ ] Identificar páginas que precisam de botão voltar
- [ ] Adicionar botão voltar no cabeçalho das páginas
- [ ] Implementar navegação com router.back() ou rota específica
- [ ] Testar navegação em todas as páginas
- [ ] Garantir que botão voltar funciona corretamente


## Bug: Erro de Autenticação em Configurações
- [ ] Corrigir erro "Acesso negado" na página /configuracoes
- [ ] Adicionar verificação de autenticação (useAuth)
- [ ] Adicionar loading state e redirect
- [ ] Testar acesso à página após correção


## Análise de Mercado e Precificação
- [ ] Pesquisar sistemas concorrentes (Tiny ERP, Bling, Omie, etc)
- [ ] Comparar funcionalidades do CellSync com concorrentes
- [ ] Analisar modelos de precificação do mercado
- [ ] Criar relatório de análise competitiva
- [ ] Sugerir estratégia de precificação para CellSync


## Análise de Mercado e Precificação - Concluída
- [x] Pesquisar sistemas concorrentes no mercado brasileiro (ReparaOS, MercadoPhone, VHSys, Bling)
- [x] Analisar funcionalidades e preços dos concorrentes
- [x] Comparar funcionalidades do CellSync com concorrentes
- [x] Criar relatório completo de análise de mercado (analise_mercado_precificacao.md)
- [x] Definir estratégia de precificação (3 planos: Starter R$ 79,90, Professional R$ 129,90, Enterprise R$ 199,90)
- [x] Projetar receita e viabilidade financeira
- [x] Definir estratégias de go-to-market


## Rebrand: CellSync → CellSync
- [x] Criar logo profissional do CellSync (cellsync-logo.png, cellsync-icon.png)
- [x] Pesquisar tendências de cores 2025 (paletas suaves + acentos ousados, gradientes fluidos)
- [x] Definir paleta de cores moderna (azul #3B82F6, roxo #A855F7, rosa #EC4899)
- [x] Redesenhar landing page (Home.tsx) com nova identidade visual moderna
- [x] Atualizar CSS global (index.css) com cores do CellSync
- [x] Renomear "CellSync" para "CellSync" em todo o código
- [x] Atualizar favicon e meta tags (cellsync-icon.png, Google Fonts Inter)
- [x] Atualizar documentação (todos os .md files)
- [x] Criar documento de identidade visual (BRAND_IDENTITY.md)
- [x] Verificar landing page com nova identidade (gradiente azul→roxo→rosa funcionando perfeitamente)

**Nota**: VITE_APP_TITLE e VITE_APP_LOGO devem ser atualizados manualmente via Settings → General no painel web


## Animações e Ícones Modernos - Landing Page
- [x] Instalar Framer Motion
- [x] Modernizar ícones com animações (hover rotate 360°, scale 1.1)
- [x] Aplicar gradientes vibrantes nos ícones e cards (azul→roxo→rosa)
- [x] Implementar fade-in + slide-up no Hero Section (logo, título, CTAs)
- [x] Adicionar stagger animations nos cards de features (delay progressivo)
- [x] Implementar scroll-triggered animations (whileInView)
- [x] Adicionar micro-interações (hover scale, y-offset, gradiente reverso)
- [x] Adicionar loading spinner animado com gradiente


## Bug: Layout da Página Vendas (PDV)
- [x] Corrigir sobreposição de texto dos atalhos sobre o botão "Atacado"
- [x] Reorganizar header da página (PageHeader separado + barra de controles)
- [x] Modernizar botões Varejo/Atacado com gradiente azul→roxo
- [x] Criar badges visuais para atalhos de teclado (F2, F3, F4, ESC)
- [x] Garantir responsividade dos atalhos em mobile (flex-wrap)


## Bug: Erro de Autenticação em Vendas
- [x] Corrigir queries sendo executadas sem autenticação
- [x] Adicionar enabled: !!user nas queries tRPC (products.list, customers.list)

## Modernização do Dashboard Interno
- [x] Aplicar gradientes coloridos nos 6 cards (azul→cyan, verde→esmeralda, roxo→rosa, laranja→âmbar, vermelho→rose, amarelo→laranja)
- [x] Modernizar ícones com backgrounds em gradiente
- [x] Adicionar animações Framer Motion (fade-in, slide-up, hover y:-8px, rotate 360°)
- [x] Adicionar sombras modernas (hover:shadow-2xl) e bordas arredondadas (rounded-2xl)
- [x] Criar seção de Insights Rápidos (Taxa de Conversão, Ticket Médio, Taxa de Ocupação)
- [x] Loading skeleton com gradiente animado
- [ ] Criar seletor de tema (claro/escuro/colorido) - próxima fase
- [ ] Permitir personalização de cores de fundo - próxima fase


## Modernização da Sidebar (DashboardLayout)
- [x] Aplicar gradientes coloridos nos 11 ícones da navegação
- [x] Criar backgrounds coloridos para cada item (11 gradientes únicos)
- [x] Adicionar animações hover (scale 1.1, rotate 5°, shadow)
- [x] Destacar item ativo com gradiente vibrante + barra lateral colorida
- [x] Implementar transições suaves com Framer Motion (fade-in, slide-in, layoutId)
- [x] Melhorar espaçamento e padding dos itens (h-11, space-y-1)
- [x] Ícone branco em fundo gradiente quando ativo
- [x] Hover effect com gradiente suave em itens inativos


## Bug: Erros de Autenticação em Múltiplas Páginas
- [x] Corrigir Financeiro (3 queries)
- [x] Corrigir Clientes (1 query)
- [x] Corrigir Comissoes (3 queries)
- [x] Corrigir Estoque (1 query)
- [x] Corrigir Movimentacoes (3 queries)
- [x] Corrigir NotasFiscais (2 queries)
- [x] Corrigir Notificacoes (2 queries)
- [x] Corrigir RelatorioAvancadoEstoque (3 queries)
- [x] Corrigir Relatorios (6 queries)
- [x] Total: 24 queries protegidas com autenticação!

## Modernizar Página de Login
- [x] Substituir logo "OK" azul pelo logo CellSync com gradiente (/cellsync-icon.png)
- [x] Aplicar gradientes coloridos (azul→roxo→rosa) no fundo e título
- [x] Adicionar animações Framer Motion (fade-in, slide-up, scale)
- [x] Modernizar botão "Entrar" com gradiente vibrante + hover scale
- [x] Atualizar fundo com gradiente suave + círculos animados
- [x] Inputs com focus roxo (border-purple-500)

## Renomear CellSync → CellSync (Completo)
- [ ] Verificar se ainda existem referências a "CellSync" no código
- [ ] Renomear todas as ocorrências restantes
- [ ] Atualizar variáveis de ambiente via webdev_edit_secrets (VITE_APP_TITLE)

## Dark Mode Implementation
- [ ] Criar ThemeContext para gerenciar tema globalmente
- [ ] Implementar toggle button (Sol/Lua) no DashboardLayout header
- [ ] Salvar preferência no localStorage
- [ ] Ajustar paleta de cores para dark mode (slate-900, slate-800)
- [ ] Ajustar gradientes para versões mais vibrantes em dark
- [ ] Adicionar transições suaves ao alternar temas
- [ ] Testar dark mode em todas as páginas


## Finalização do Sistema - Pendências Prioritárias

### Script de Seed de Dados
- [x] Criar script de seed com dados de exemplo
- [x] Popular usuários (admin, vendedores, técnicos)
- [x] Popular produtos (celulares, acessórios, peças)
- [x] Popular clientes com histórico
- [ ] Completar popular vendas com comissões
- [ ] Completar popular OS com peças utilizadas
- [ ] Completar popular contas a pagar e receber
- [ ] Completar popular NF-e emitidas

### Interface de Notificações
- [x] Backend de notificações automáticas implementado
- [ ] Criar interface frontend de notificações in-app
- [ ] Adicionar dropdown de notificações no header
- [ ] Implementar página completa de notificações
- [ ] Adicionar badges de contagem na sidebar

### Gestão de Usuários
- [ ] Implementar alteração de senhas de usuários
- [ ] Criar formulário de troca de senha
- [ ] Adicionar validação de senha forte

### Notas Fiscais
- [ ] Implementar formulário de emissão manual de NF-e
- [ ] Criar armazenamento de XMLs no S3
- [ ] Adicionar download de XML e PDF

### Comissões
- [ ] Adicionar interface de configuração de regras de comissão
- [ ] Implementar relatório de comissões por período
- [ ] Criar testes para cálculo de comissões


## Formulário de Emissão Manual de NF-e
- [x] Criar backend para emissão manual (procedure nfe.emit)
- [x] Implementar armazenamento de XMLs no S3 (storagePut integrado)
- [x] Criar formulário multi-step (5 etapas: Emitente, Destinatário, Produtos, Impostos, Confirmação)
- [x] Implementar validações de campos obrigatórios por etapa
- [x] Adicionar cálculo automático de totais (ICMS 18%, PIS 1.65%, COFINS 7.6%)
- [x] Criar preview completo da nota antes de emitir (etapa 5)
- [x] Implementar geração de XML (usa generateNFeXML existente)
- [x] Adicionar upload automático do XML para S3 após emissão
- [x] Geração de chave de acesso (44 dígitos)
- [x] Adicionar rota /emitir-nfe no App.tsx
- [x] Adicionar botão "Emissão Manual" com gradiente na página Notas Fiscais
- [x] Animações Framer Motion no stepper e transições
- [x] Adicionar/remover itens dinamicamente
- [ ] Testar emissão completa com dados reais


## Criar Usuário Admin para Bruno
- [ ] Criar script para adicionar usuário Bruno com senha admin
- [ ] Executar script e validar criação
- [ ] Testar login com credenciais do Bruno

## Renomeação Completa: CellSync → CellSync
- [ ] Buscar todas as referências "CellSync" no código
- [x] Buscar todas as referências "okcells" (minúsculas)
- [ ] Renomear em arquivos .ts, .tsx, .js, .mjs
- [ ] Renomear em arquivos de configuração (.json, .env)
- [ ] Atualizar comentários e documentação
- [ ] Atualizar credenciais de seed (admin@cellsync.com)
- [ ] Atualizar variáveis de ambiente via webdev_edit_secrets
- [ ] Testar sistema completo após renomeação

## Bug Reportado - Login não redireciona
- [x] Investigar por que login mostra sucesso mas não redireciona para dashboard
- [x] Verificar se cookie está sendo salvo corretamente
- [x] Verificar se useAuth está lendo o cookie
- [x] Ajustar sameSite de "none" para "lax" no cookie
- [ ] Testar fluxo completo de autenticação com Bruno

## Implementação de Dark Mode Completo
- [x] Verificar ThemeContext existente
- [x] Criar toggle de Dark Mode no header do DashboardLayout
- [x] Adicionar ícones de sol/lua com animações
- [x] Implementar persistência no localStorage
- [x] Atualizar variáveis CSS para dark mode (.dark)
- [x] Testar dark mode em todas as páginas principais
- [x] Garantir contraste adequado em todos os componentes
- [x] Adicionar transições suaves entre temas

## IA Assistente para Cadastro de Produtos
- [x] Criar módulo backend ai-product-assistant.ts com função de análise
- [x] Integrar invokeLLM para análise inteligente de produtos
- [x] Criar endpoint tRPC ai.analyzeProduct
- [x] Adicionar botão "Preencher com IA" no formulário de produtos
- [x] Implementar loading state durante análise
- [x] Preencher automaticamente marca, modelo e categoria
- [x] Adicionar feedback visual de sucesso/erro
- [ ] Testar com diferentes tipos de produtos (iPhone, Samsung, Xiaomi, acessórios)
- [ ] Criar testes unitários para análise de IA

## Interface de Importação de Produtos
- [x] Criar endpoint tRPC products.importBulk
- [x] Criar página ImportarProdutos.tsx
- [x] Adicionar textarea para colar dados CSV
- [x] Implementar parser de CSV/TSV
- [x] Adicionar preview dos dados antes de importar
- [x] Implementar validação de campos
- [x] Adicionar feedback de progresso
- [x] Adicionar rota no menu lateral
- [ ] Testar importação com dados reais

## IA Assistente para Diagnóstico de OS
- [x] Criar módulo backend ai-os-assistant.ts
- [x] Integrar invokeLLM para análise de problemas
- [x] Criar endpoint tRPC ai.diagnoseServiceOrder
- [x] Adicionar suporte a análise de imagem (foto do aparelho)
- [x] Atualizar endpoint para aceitar URL de imagem
- [x] Adicionar upload de foto no formulário de OS
- [x] Adicionar botão "Diagnosticar com IA" no formulário de OS
- [x] Implementar sugestões de defeito, solução e peças
- [x] Adicionar estimativa de tempo e custo
- [x] Implementar loading state durante análise
- [x] Adicionar feedback visual com nível de confiança
- [ ] Testar com diferentes tipos de problemas (tela quebrada, bateria, software, água)
- [ ] Testar análise com fotos de aparelhos danificados

## Importação Automática de Planilhas
- [x] Criar script Node.js para ler CSV
- [x] Importar dados de RelatóriodoEstoque(1).csv
- [x] Verificar dados importados no banco
- [x] Confirmar total de produtos cadastrados (41 produtos)

## Sistema de Geração de Etiquetas
- [x] Instalar bibliotecas: bwip-js (código de barras), qrcode (QR code)
- [x] Criar endpoint tRPC para gerar código de barras
- [x] Criar endpoint tRPC para gerar QR code
- [x] Criar página GerarEtiquetas.tsx
- [x] Implementar seleção de produtos para etiquetas
- [x] Adicionar 3 templates de tamanho (Pequena, Média, Vitrine)
- [x] Implementar preview em tempo real
- [x] Adicionar opção de quantidade de cópias por produto
- [x] Implementar impressão direta (window.print)
- [x] Criar rota no menu lateral
- [ ] Testar impressão em diferentes tamanhos com produtos reais

## Atualização de Preços e Estoque
- [x] Verificar se tabela products tem campos wholesalePrice e currentStock
- [x] Criar script de atualização update-prices-stock.mjs
- [x] Ler Produtos(2).csv e extrair preços de atacado/varejo e quantidade
- [x] Atualizar 153 produtos com preços corretos
- [x] Atualizar saldos de estoque
- [x] Verificar dados atualizados no banco

## Bug - Login no Mobile não Redireciona
- [ ] Investigar por que login mostra sucesso no celular mas não redireciona
- [ ] Verificar se cookie está sendo salvo no navegador mobile
- [ ] Verificar se useAuth está detectando usuário logado no mobile
- [ ] Testar redirecionamento após login no mobile
- [ ] Verificar se há diferença entre desktop e mobile
- [ ] Corrigir problema de redirecionamento mobile

## Problema - Módulos não aparecem no menu
- [ ] Verificar se "Gerar Etiquetas" está no menu lateral
- [ ] Verificar se "Importar Produtos" está no menu lateral
- [ ] Verificar ordem dos itens no menu
- [ ] Garantir que todos os módulos implementados apareçam

## Melhorias no Estilo das Etiquetas
- [x] Melhorar layout do preview das etiquetas
- [x] Aumentar destaque do preço (fonte maior e negrito)
- [x] Melhorar posicionamento do código de barras
- [x] Melhorar visibilidade do QR Code (borda e arredondamento)
- [x] Ajustar espaçamento e cores (gradientes sutis)
- [x] Tornar layout mais profissional (caixa de preço destacada)

## Sistema Multi-Tenant + Pagamento Stripe
- [x] Adicionar feature Stripe ao projeto (webdev_add_feature)
- [x] Criar tabela tenants (id, nome, subdomínio, plano, status)
- [x] Criar tabela plans (id, nome, preço, limites)
- [x] Criar tabela subscriptions (tenant_id, stripe_subscription_id, status)
- [x] Definir 3 planos baseados em pesquisa:
  * Básico: R$ 97/mês - 1 usuário, 500 produtos
  * Profissional: R$ 197/mês - 5 usuários, ilimitado + IA
  * Empresarial: R$ 397/mês - ilimitado, white-label
- [x] Popular planos no banco de dados (seed-plans.mjs)
- [x] Criar integração com Stripe (stripe-integration.ts)
- [x] Criar endpoints tRPC para listar planos
- [x] Criar endpoint tRPC para checkout
- [x] Criar página de planos (/planos) com design moderno
- [x] Implementar toggle mensal/anual com desconto de 17%
- [x] Adicionar cards de planos com features e limites
- [ ] Configurar produtos no Stripe Dashboard
- [ ] Testar checkout completo com cartão de teste
- [ ] Adicionar campo tenant_id em todas as tabelas principais (futuro)
- [ ] Implementar middleware de isolamento de dados por tenant (futuro)
- [ ] Criar webhooks Stripe para renovação/cancelamento (futuro)
- [ ] Criar painel administrativo de tenants (futuro)
- [ ] Implementar métricas de receita MRR, churn (futuro)

## Bug - Planos não aparecem na página /planos
- [x] Verificar se planos foram salvos no banco de dados (3 planos encontrados)
- [x] Verificar se endpoint tRPC está funcionando (erro: db.select is not a function)
- [x] Corrigir db-plans.ts para usar getDb() ao invés de import direto
- [x] Testar endpoint novamente (funcionando!)
- [x] Validar exibição dos planos

## Revisão Completa do Módulo de Comissões
- [ ] Verificar se página de comissões está acessível
- [ ] Testar cálculo automático de comissões nas vendas
- [ ] Verificar relatório de comissões por vendedor
- [ ] Testar aprovação de comissões
- [ ] Verificar integração com financeiro
- [ ] Validar dashboard de ranking de vendedores
- [ ] Corrigir problemas encontrados

## Painel Admin Master (Multi-Tenant)
- [ ] Criar role "master_admin" no schema de usuários
- [ ] Criar endpoints tRPC para admin master
- [ ] Endpoint: admin.getTenants (listar todos os clientes)
- [ ] Endpoint: admin.getMetrics (MRR, ARR, churn, total clientes)
- [ ] Endpoint: admin.activateTenant / deactivateTenant
- [ ] Endpoint: admin.getSubscriptions (status de pagamentos)
- [ ] Criar página AdminMaster.tsx com dashboard
- [ ] Adicionar métricas: Total clientes, MRR, Novos este mês, Churn
- [ ] Adicionar gráfico de crescimento de clientes
- [ ] Adicionar gráfico de receita mensal
- [ ] Criar tabela de clientes com filtros
- [ ] Adicionar ações: Ativar, Desativar, Editar, Ver detalhes
- [ ] Criar middleware de proteção (apenas master_admin)
- [ ] Adicionar rota /admin-master no App.tsx
- [ ] Testar acesso restrito

## Arquitetura Multi-Tenant Robusta e Escalável
- [x] Adicionar campo tenantId em TODAS as tabelas principais
- [x] Criar índices compostos (tenantId + id) para performance
- [x] Criar middleware de isolamento automático de dados
- [ ] Implementar identificação de tenant por subdomínio/URL
- [ ] Adicionar validação de limites por plano (usuários, produtos, storage)
- [ ] Criar sistema de onboarding self-service
- [ ] Implementar trial automático de 14 dias
- [ ] Adicionar row-level security no banco
- [ ] Criar logs de auditoria por tenant
- [ ] Implementar rate limiting por tenant
- [ ] Adicionar cache por tenant (Redis-ready)
- [x] Finalizar painel AdminMaster com rota protegida
- [x] Promover usuário Bruno para master_admin
- [ ] Testar isolamento completo de dados

## Correção Página de Planos para Lançamento
- [x] Verificar por que página /planos não estava aparecendo (erro de JSON.parse)
- [x] Corrigir erros de carregamento de dados (backend parseando features)
- [x] Testar exibição dos 3 planos (Básico, Profissional, Empresarial)
- [x] Verificar botões de contratação (funcionando)
- [x] Testar responsividade mobile (OK)
- [x] Preparar sistema para lançamento (PRONTO)

## Pop-up de Confirmação na Contratação de Planos
- [x] Adicionar Dialog de confirmação com shadcn/ui
- [x] Mostrar resumo do plano selecionado (nome, preço, período)
- [x] Adicionar botões "Cancelar" e "Confirmar Contratação"
- [x] Integrar com função handleConfirmSubscribe
- [x] Testar fluxo completo de confirmação

## Substituir Alert por Toast Elegante
- [x] Remover alert() da função handleConfirmSubscribe
- [x] Adicionar toast do sonner
- [x] Implementar toast de sucesso ao redirecionar para Stripe
- [x] Implementar toast de erro em caso de falha
- [x] Toasts implementados com título e descrição

## Email de Boas-vindas Automático
- [x] Criar template HTML de email de boas-vindas (email-templates.ts)
- [x] Incluir credenciais de acesso (email + senha temporária)
- [x] Adicionar tutorial rápido (5 passos com ícones numerados)
- [x] Incluir link para suporte
- [x] Implementar função sendWelcomeEmail no backend (email.ts)
- [x] Criar função generateTemporaryPassword
- [ ] Integrar com criação de novo usuário (futuro)
- [ ] Testar envio de email real

## Página de Onboarding Self-Service
- [x] Criar página /cadastro pública (sem autenticação)
- [x] Formulário multi-step (dados pessoais → dados da loja → escolha de plano)
- [x] Validação de email único (checkEmail query)
- [x] Criar tenant automaticamente (onboarding.ts)
- [x] Criar usuário admin do tenant
- [x] Gerar senha temporária (generateTemporaryPassword)
- [x] Enviar email de boas-vindas (sendWelcomeEmail)
- [x] Redirecionar para login após cadastro
- [x] Adicionar trial de 14 dias automático
- [x] Stepper visual com progresso
- [x] Botão "Criar Conta Grátis" na Home
- [ ] Testar fluxo completo de cadastro

## Painel de Gerenciamento de Tenants (Admin Master)
- [x] Criar procedures tRPC para listar tenants (tenant-management.ts)
- [x] Adicionar filtros (status, plano, data de criação)
- [x] Implementar busca por nome/subdomain
- [x] Criar tabela com informações dos tenants
- [x] Adicionar badges de status (trial, active, suspended, cancelled)
- [x] Mostrar dias restantes de trial
- [x] Adicionar ações: visualizar detalhes, suspender, reativar
- [x] Implementar paginação
- [x] Adicionar estatísticas (total de tenants, por status, por plano)
- [x] Dialog de detalhes com lista de usuários
- [x] Testar todas as funcionalidades

## Upgrade/Downgrade de Planos (Admin Master)
- [x] Criar procedure tRPC para alterar plano de um tenant (changePlan)
- [x] Buscar todos os planos disponíveis (listPlans)
- [x] Validar mudança de plano (não permitir downgrade se exceder limites)
- [x] Atualizar planId no tenant
- [x] Atualizar Stripe subscription (TODO: implementar quando necessário)
- [x] Adicionar botão "Alterar Plano" no dialog de detalhes
- [x] Criar dialog de seleção de plano
- [x] Mostrar comparação entre plano atual e novo plano
- [x] Exibir aviso se for downgrade
- [x] Badges de Upgrade/Downgrade nos planos
- [x] Mostrar limites de cada plano (usuários, produtos, storage)
- [ ] Testar upgrade de plano
- [ ] Testar downgrade de plano


## 🚀 FASE 1: CRÍTICO PARA LANÇAMENTO (MVP)

### Importação Automática de Dados
- [ ] Parser de XML de NF-e de fornecedores
- [ ] Extração automática de produtos (nome, preço, código, NCM)
- [ ] Importação em lote de múltiplos XMLs
- [ ] Validação e detecção de duplicatas
- [ ] Preview antes de importar
- [ ] Mapeamento de categorias automático
- [ ] Template padrão de importação Excel/CSV (produtos, clientes, estoque)
- [ ] Validação de dados (IMEI, CPF/CNPJ, preços)
- [ ] Importação de produtos com IMEI
- [ ] Importação de clientes com histórico
- [ ] Importação de estoque inicial
- [ ] Relatório de erros e sucessos de importação
- [ ] Upload de XML de NF-e de compra
- [ ] Extração automática de fornecedor
- [ ] Cadastro automático de produtos novos
- [ ] Atualização de preços de custo
- [ ] Entrada automática no estoque
- [ ] Registro no financeiro (contas a pagar)

### Integração Contábil Profissional
- [ ] Relatório de Entradas e Saídas (formato SPED)
- [ ] Livro Caixa digital
- [ ] Relatório de Notas Fiscais emitidas
- [ ] Relatório de Notas Fiscais recebidas
- [ ] DRE (Demonstrativo de Resultado do Exercício)
- [ ] Balancete mensal
- [ ] Exportação em formato compatível com sistemas contábeis (XML, TXT, Excel)
- [ ] Estrutura de plano de contas padrão
- [ ] Classificação automática de transações
- [ ] Centro de custos por departamento
- [ ] Rateio de despesas
- [ ] Conciliação bancária automática

### Emissão Fiscal Completa (Produção)
- [ ] Integração real com SEFAZ (ambiente de homologação)
- [ ] Suporte a Certificado digital A1/A3
- [ ] Armazenamento de XMLs no S3
- [ ] Consulta de status na SEFAZ
- [ ] Carta de Correção Eletrônica (CC-e)
- [ ] Inutilização de numeração

### Sistema de Notificações Automáticas
- [ ] Estrutura de dados para notificações
- [ ] Backend de notificações
- [ ] Central de notificações in-app
- [ ] Alertas de estoque baixo (<15 unidades)
- [ ] Alertas de OS com prazo vencido
- [ ] Alertas de contas a pagar próximas do vencimento
- [ ] Notificações de metas de vendas atingidas
- [ ] Notificações de aniversários de clientes
- [ ] Histórico de notificações lidas/não lidas

### Segurança e Conformidade LGPD
- [ ] Criptografia de dados sensíveis (AES-256)
- [ ] Backups automáticos diários
- [ ] Conformidade com LGPD (política de privacidade)
- [ ] Logs de auditoria completos
- [ ] Termos de uso
- [ ] Consentimento de coleta de dados

## 🎯 FASE 2: IMPORTANTE PARA COMPETITIVIDADE

### Business Intelligence Avançado
- [ ] Dashboards personalizáveis por usuário
- [ ] KPIs customizáveis
- [ ] Análises preditivas de demanda
- [ ] Alertas de anomalias (vendas, estoque)

### CRM Avançado
- [ ] Segmentação avançada de clientes
- [ ] Campanhas de marketing direcionadas
- [ ] Análise de comportamento de compra
- [ ] Score de clientes (RFM - Recência, Frequência, Monetário)
- [ ] Automação de follow-up

### Conciliação Bancária Automática
- [ ] Importação de OFX/CSV de bancos
- [ ] Conciliação automática de transações
- [ ] Sugestões inteligentes de matching
- [ ] Relatório de divergências

## 🎯 FASE 3: DIFERENCIAL COMPETITIVO

### Integrações com Marketplaces
- [ ] Integração com Mercado Livre
- [ ] Integração com Amazon
- [ ] Integração com Shopee
- [ ] Sincronização automática de estoque
- [ ] Importação de pedidos
- [ ] Atualização de preços em massa

### Transferência entre Filiais
- [ ] Solicitação de transferência
- [ ] Aprovação de transferência
- [ ] Rastreamento de produtos em trânsito
- [ ] Baixa automática em origem e entrada em destino
- [ ] Relatório de transferências

### Sistema de Reservas de Produtos
- [ ] Reserva de produtos para clientes
- [ ] Prazo de validade da reserva
- [ ] Notificações de reserva expirada
- [ ] Conversão de reserva em venda

### Inventário Periódico Automatizado
- [ ] Agendamento de inventários
- [ ] Contagem por código de barras
- [ ] Relatório de divergências
- [ ] Ajustes automáticos de estoque
- [ ] Histórico de inventários

## 🎯 FASE 4: EXPANSÃO E ESCALABILIDADE

### API Aberta para Integrações
- [ ] Documentação completa da API
- [ ] Autenticação via OAuth 2.0
- [ ] Rate limiting
- [ ] Webhooks para eventos
- [ ] SDK em JavaScript/Python

### Aplicativo Mobile Nativo
- [ ] App iOS nativo
- [ ] App Android nativo
- [ ] PDV mobile
- [ ] Consulta de estoque mobile
- [ ] Aprovação de OS mobile

### WhatsApp Business Integration
- [ ] Notificações de OS via WhatsApp
- [ ] Envio de comprovantes via WhatsApp
- [ ] Chatbot para consultas
- [ ] Campanhas de marketing via WhatsApp


## 🔒 Segurança e LGPD - Detalhamento Técnico (Fase 1 - Crítico)

### 1. Criptografia de Dados
- [ ] Configurar certificado SSL/TLS válido (Let's Encrypt ou similar)
- [ ] Forçar HTTPS em todas as rotas (redirecionamento 301)
- [ ] Habilitar HSTS (HTTP Strict Transport Security) com 1 ano
- [ ] Desabilitar protocolos inseguros (SSLv2, SSLv3, TLS 1.0, TLS 1.1)
- [ ] Implementar criptografia AES-256-GCM para dados sensíveis
- [ ] Criar funções encrypt() e decrypt() com IV único
- [ ] Armazenar chave mestra em variável de ambiente
- [ ] Criptografar CPF/CNPJ no banco de dados
- [ ] Criptografar números de telefone
- [ ] Criptografar endereços completos
- [ ] Implementar hash bcrypt para senhas (12 rounds mínimo)
- [ ] Validar força de senha (mínimo 8 caracteres, letras, números, símbolos)

### 2. Backups Automáticos
- [ ] Configurar backup diário completo (03:00 AM UTC)
- [ ] Configurar backup incremental a cada 6 horas
- [ ] Implementar script de backup do banco de dados (mysqldump)
- [ ] Implementar backup de arquivos de upload
- [ ] Configurar upload automático para S3
- [ ] Configurar retenção de 30 dias para backups completos
- [ ] Configurar retenção de 7 dias para backups incrementais
- [ ] Implementar snapshot de BD antes de migrations (retenção 90 dias)
- [ ] Criar procedimento de teste mensal de restauração
- [ ] Documentar RTO (Recovery Time Objective: < 4 horas)
- [ ] Documentar RPO (Recovery Point Objective: < 6 horas)
- [ ] Configurar alertas de falha de backup

### 3. Conformidade com LGPD
- [ ] Criar Política de Privacidade completa
- [ ] Criar Termos de Uso do sistema
- [ ] Implementar modal de consentimento de cookies
- [ ] Criar opções granulares de consentimento (analíticos, marketing)
- [ ] Implementar endpoint `/api/gdpr/my-data` (acesso a dados)
- [ ] Implementar endpoint `/api/gdpr/export-data` (portabilidade)
- [ ] Criar função de anonimização de dados
- [ ] Implementar "Excluir Minha Conta" com anonimização
- [ ] Criar interface "Meus Dados" para clientes finais
- [ ] Implementar revogação de consentimento de marketing
- [ ] Manter dados de NF-e por 5 anos (obrigação fiscal)
- [ ] Criar registro de consentimento com timestamp
- [ ] Implementar versionamento da Política de Privacidade
- [ ] Criar sistema de notificação de mudanças na política
- [ ] Designar encarregado de dados (DPO)
- [ ] Criar email dpo@cellsync.com.br

### 4. Logs de Auditoria
- [ ] Criar tabela `audit_logs` no banco de dados
- [ ] Implementar log de login bem-sucedido
- [ ] Implementar log de login falhado
- [ ] Implementar log de logout
- [ ] Implementar log de alteração de senha
- [ ] Implementar log de acesso negado
- [ ] Implementar log de visualização de CPF/CNPJ
- [ ] Implementar log de exportação de dados
- [ ] Implementar log de criação/cancelamento de venda
- [ ] Implementar log de emissão/cancelamento de NF-e
- [ ] Implementar log de alteração de configurações
- [ ] Implementar log de criação/exclusão de usuário
- [ ] Adicionar índices em `timestamp`, `userId`, `eventType`
- [ ] Implementar rotação de logs (arquivar > 90 dias em S3)
- [ ] Configurar retenção de 6 meses online, 5 anos em arquivo
- [ ] Implementar hash SHA-256 para proteção contra alteração
- [ ] Criar dashboard de logs em tempo real (Grafana)
- [ ] Configurar alertas de atividades suspeitas

### 5. Controle de Acesso
- [ ] Implementar autenticação JWT com validade de 8 horas
- [ ] Implementar refresh token com validade de 30 dias
- [ ] Implementar logout em todos os dispositivos ao trocar senha
- [ ] Implementar bloqueio de conta após 5 tentativas falhadas
- [ ] Implementar desbloqueio automático após 30 minutos
- [ ] Implementar middleware de autorização RBAC
- [ ] Validar role no backend em todas as rotas protegidas
- [ ] Implementar princípio do menor privilégio
- [ ] Testar isolamento multi-tenant (usuário A não acessa dados de B)
- [ ] Criar índices compostos `(tenantId, id)` em todas as tabelas

### 6. Proteção contra Vulnerabilidades
- [ ] Configurar Content Security Policy (CSP)
- [ ] Configurar header X-Frame-Options
- [ ] Configurar header X-Content-Type-Options
- [ ] Desabilitar mensagens de erro detalhadas em produção
- [ ] Remover endpoints de debug
- [ ] Implementar rate limiting (100 req/min por IP)
- [ ] Implementar tokens CSRF em formulários
- [ ] Configurar SameSite cookies
- [ ] Implementar CAPTCHA após 3 tentativas de login falhadas
- [ ] Sanitizar HTML com DOMPurify
- [ ] Validar entrada com Zod em todas as rotas
- [ ] Executar `npm audit` e corrigir vulnerabilidades críticas
- [ ] Configurar Snyk ou Dependabot para monitoramento de CVEs
- [ ] Implementar whitelist de domínios para integrações externas

### 7. Monitoramento e Alertas
- [ ] Configurar alerta de 5+ tentativas de login falhadas em 10min
- [ ] Configurar alerta de acesso a 100+ registros em 1min
- [ ] Configurar alerta de alteração de permissões fora do horário
- [ ] Configurar alerta de emissão de NF-e acima de R$ 50.000
- [ ] Configurar alerta de exclusão em massa (50+ registros)
- [ ] Implementar notificações via email/SMS para admins

### 8. Plano de Resposta a Incidentes
- [ ] Documentar procedimento de detecção de incidentes
- [ ] Documentar procedimento de contenção
- [ ] Documentar procedimento de investigação
- [ ] Documentar procedimento de notificação (ANPD, titulares)
- [ ] Documentar procedimento de recuperação
- [ ] Criar template de relatório de incidente
- [ ] Treinar equipe em resposta a incidentes

### 9. Testes de Segurança
- [ ] Realizar teste de SSL Labs (score mínimo A+)
- [ ] Realizar teste de restauração de backup
- [ ] Realizar teste de isolamento multi-tenant
- [ ] Realizar scan de vulnerabilidades com npm audit
- [ ] Realizar penetration testing (empresa especializada)
- [ ] Validar criptografia de dados sensíveis
- [ ] Validar logs de auditoria
- [ ] Validar rate limiting
- [ ] Validar bloqueio de conta após tentativas falhadas

### 10. Documentação e Treinamento
- [ ] Publicar Política de Privacidade no site
- [ ] Publicar Termos de Uso no site
- [ ] Criar FAQ sobre LGPD para lojistas
- [ ] Criar guia de boas práticas de segurança
- [ ] Treinar equipe em LGPD e segurança da informação
- [ ] Documentar responsabilidades de Controlador vs Operador


## ✅ Progresso da Implementação (Sessão Atual)

### Importação de XML de NF-e (70% concluído)
- [x] Instalar dependência fast-xml-parser
- [x] Criar parser de XML de NF-e (xml-parser.ts)
- [x] Criar procedures tRPC (xml-import.ts)
- [x] Integrar xmlImportRouter no routers.ts
- [ ] Criar interface frontend de upload de XML
- [ ] Criar página de preview antes de importar
- [ ] Testar importação completa

### Próximas Prioridades Imediatas
1. Finalizar interface de importação XML
2. Implementar exportação contábil (SPED, DRE, Balancete)
3. Implementar segurança básica (SSL, criptografia, backups)


## Interface de Importação de XML (Frontend)
- [x] Criar página ImportarXML.tsx
- [x] Implementar drag-and-drop de múltiplos arquivos
- [x] Validar extensão .xml
- [x] Mostrar lista de arquivos selecionados
- [x] Implementar preview dos produtos antes de importar
- [x] Mostrar produtos novos vs existentes
- [x] Opções: criar novos produtos, atualizar preços
- [x] Implementar importação com loading state
- [x] Mostrar relatório de sucesso/erros
- [x] Adicionar rota /importar-xml no App.tsx
- [x] Adicionar menu "Importar XML (NF-e)" no DashboardLayout
- [x] Testar interface (drag-and-drop, botão, menu funcionando)
- [ ] Testar importação completa com XML real de NF-e


## Importação via Excel/CSV
- [x] Instalar dependência papaparse para parse de CSV
- [x] Criar procedures tRPC (previewCSV, importProducts, importCustomers)
- [x] Criar templates de download (produtos-template.csv, clientes-template.csv)
- [x] Criar página ImportarPlanilha.tsx separada
- [x] Tabs para Produtos e Clientes
- [x] Botões de download de templates
- [x] Upload de arquivo CSV
- [x] Preview de dados antes de importar
- [x] Validação de campos obrigatórios
- [x] Relatório de erros por linha
- [x] Estatísticas (total, válidos, inválidos)
- [x] Opção de atualizar registros existentes
- [x] Adicionar rota /importar-planilha
- [x] Adicionar menu "Importar Planilha (CSV)"
- [x] Testar interface (tabs, templates, upload funcionando)
- [ ] Testar importação real de produtos com CSV
- [ ] Testar importação real de clientes com CSV


## Finalização do Sistema - Pendências Prioritárias
- [x] Implementar backend de notificações automáticas (alertas de estoque, OS, contas a pagar)
- [x] Criar interface frontend de notificações in-app (NotificationBell.tsx já existe)
- [x] Criar script de seed de dados para popular banco com exemplos (seed-demo-data.mjs)
- [x] Adicionar alteração de senhas de usuários (auth.changePassword já implementado)
- [ ] Implementar formulário de emissão manual de NF-e
- [ ] Criar armazenamento de XMLs no S3
- [ ] Adicionar interface de configuração de regras de comissão
- [ ] Implementar relatório de comissões por período
- [ ] Criar testes para cálculo de comissões

## Sistema de Backup Automático
- [x] Criar módulo server/backup.ts com função de backup do MySQL usando mysqldump
- [x] Implementar upload de backup para S3 com nome timestamped
- [x] Criar função de limpeza de backups com mais de 30 dias
- [x] Implementar notificações por email de sucesso/falha
- [x] Criar endpoint tRPC backup.runNow para execução manual
- [x] Configurar cron job para executar às 3h AM diariamente
- [x] Adicionar página de gerenciamento de backups no Admin Master
- [x] Testar backup manual e agendado

## Dashboard de Monitoramento de Backups
- [x] Criar gráfico de linha mostrando tamanho dos backups ao longo do tempo
- [x] Criar gráfico de barras mostrando frequência de backups por dia
- [x] Adicionar gráfico de área mostrando crescimento acumulado
- [x] Implementar cards de estatísticas (total de backups, tamanho total, média)
- [x] Adicionar indicador de taxa de sucesso vs falha
- [x] Criar visualização de tendência de crescimento do banco
- [x] Integrar gráficos na página de Gerenciar Backups
- [x] Adicionar filtros de período (7 dias, 30 dias, 90 dias)

## Adaptação Multi-Tenant do Sistema de Backup
- [x] Criar tabela backupHistory no schema para registrar histórico de backups
- [x] Adicionar campo tenantId na estrutura de backups
- [x] Modificar nomenclatura de arquivos S3 para incluir tenantId (backups/tenant-{tenantId}/backup-{timestamp}.sql)
- [x] Backup completo do banco (todos os tenants) com registro por tenant
- [x] Criar procedures tRPC para listar backups filtrados por tenantId
- [x] Atualizar frontend para mostrar backups do tenant atual
- [x] Master_admin pode visualizar backups de todos os tenants
- [x] Adicionar registro de histórico no banco após cada backup
- [x] Sistema preparado para isolamento entre tenants
- [x] Testar funcionamento do sistema multi-tenant

## Correção de Visualização de Backups
- [x] Verificar se backups estão sendo listados corretamente no painel Admin Master
- [x] Testar endpoint tRPC backup.list
- [x] Garantir que dados do banco estão sendo retornados
- [x] Sistema pronto - backups aparecerão após primeira execução

## Correção de WebSocket Vite HMR
- [x] Configurar Vite HMR para funcionar em ambiente proxy
- [x] Ajustar configuração de server.hmr no vite.config.ts
- [x] Testar hot reload após correção

## Dashboard BI e Relatórios
- [x] Criar procedures tRPC para KPIs de vendas (total, média, crescimento)
- [x] Criar procedures tRPC para KPIs de estoque (valor total, itens disponíveis, defeitos)
- [x] Criar procedures tRPC para KPIs financeiros (receita, despesas, lucro)
- [x] Implementar página Dashboard BI com cards de KPIs
- [x] Adicionar gráfico de vendas por período (linha)
- [x] Adicionar gráfico de produtos mais vendidos (barras)
- [x] Adicionar gráfico de receita vs despesas (barras)
- [x] Implementar filtros de período (hoje, semana, mês, ano)
- [x] Adicionar comparativo com período anterior
- [ ] Criar função de exportação para Excel
- [ ] Criar função de exportação para PDF
- [ ] Adicionar relatório de vendas detalhado
- [ ] Adicionar relatório de estoque detalhado
- [ ] Adicionar relatório financeiro detalhado

## Emissão de Cupom Fiscal
- [x] Criar template de cupom fiscal com dados da venda
- [x] Implementar formatação ESC/POS para impressoras térmicas
- [x] Adicionar suporte para impressoras Epson, Bematech, Daruma
- [x] Criar endpoint tRPC para gerar cupom fiscal
- [x] Implementar download de arquivo .prn para impressão
- [x] Adicionar botão "Cupom Fiscal" na tela de vendas
- [x] Configurar largura do papel (58mm ou 80mm)
- [x] Estrutura para logo da empresa no cabeçalho
- [x] Incluir QR Code com dados da venda
- [x] Sistema pronto para impressão em impressoras térmicas padrão

## Sistema de Controle de Comissões
- [x] Criar procedures tRPC para listar comissões por status
- [x] Criar procedure para aprovar comissões (apenas gerentes)
- [x] Criar procedure para registrar pagamento de comissões
- [x] Criar procedure para obter estatísticas de comissões por vendedor
- [x] Implementar página de Controle de Comissões
- [x] Adicionar tabela de comissões pendentes com botão de aprovar
- [x] Adicionar tabela de comissões aprovadas com botão de pagar
- [x] Adicionar histórico de comissões pagas
- [x] Criar dashboard de comissões por vendedor
- [x] Adicionar filtros por período, vendedor e status
- [x] Implementar cards com totais (pendente, aprovado, pago)
- [ ] Adicionar gráfico de comissões ao longo do tempo
- [x] Integrar com sistema financeiro (contas a pagar)

## Testes Automatizados End-to-End (E2E)
- [ ] Configurar Playwright para testes E2E
- [ ] Criar teste de fluxo completo de cadastro e onboarding
- [ ] Criar teste de fluxo de vendas (adicionar produto, cliente, finalizar)
- [ ] Criar teste de fluxo de estoque (entrada, movimentação, baixa)
- [ ] Criar teste de fluxo de ordem de serviço (criar, atualizar, finalizar)
- [ ] Criar teste de fluxo financeiro (contas a pagar/receber)
- [ ] Criar teste de fluxo de comissões (gerar, aprovar, pagar)
- [ ] Criar teste de backup automático
- [ ] Criar teste de relatórios e dashboard BI
- [ ] Criar teste de emissão de cupom fiscal
- [ ] Executar todos os testes E2E e validar cobertura

## Sistema de Permissões e Liberação de Módulos
- [x] Criar tabela de módulos no banco (código, nome, descrição, rota)
- [x] Criar tabela de módulos contratados por tenant
- [x] Criar tabela de planos de assinatura
- [x] Criar tabela de permissões por role e módulo
- [x] Implementar helpers de verificação de acesso a módulos
- [x] Criar interface de gestão de módulos (master_admin)
- [x] Adicionar página de configuração de módulos por cliente
- [x] Implementar bloqueio de rotas baseado em módulos contratados
- [x] Criar sistema de planos (Básico R$99, Profissional R$199, Enterprise R$399)
- [x] Adicionar funcionalidade de aplicar plano completo
- [x] Implementar ativação/desativação individual de módulos
- [x] Criar relatório de módulos por tenant
- [x] Sistema preparado para permissões por role

## Consulta Automática de CNPJ (Receita Federal)
- [x] Integrar API de consulta de CNPJ da Receita Federal
- [x] Criar endpoint tRPC para consulta de CNPJ
- [x] Adicionar campos de dados da empresa no schema (tenants)
- [x] Criar interface de configuração da empresa com consulta automática
- [x] Integrar dados da empresa no cupom fiscal
- [ ] Integrar dados da empresa na emissão de NF-e
- [ ] Integrar dados da empresa em cotações
- [x] Validar e testar consulta automática de CNPJ


## Sistema de Acesso Multi-Tenant para Manutenção Remota
- [x] Criar sistema de impersonação de tenant (tenant switching)
- [x] Adicionar endpoint para master admin trocar de tenant
- [x] Criar interface de seleção de tenant no dashboard master
- [x] Adicionar indicador visual de tenant ativo no header
- [x] Adaptar importações (produtos, XML, planilhas) para tenant selecionado
- [x] Garantir isolamento de dados entre tenants
- [x] Criar log de auditoria de acesso entre tenants
- [x] Testar fluxo completo de manutenção remota


## Dashboard BI Avançado (Superior ao Concorrente)
- [x] Criar sistema de metas por vendedor e produto
- [x] Implementar indicadores visuais de progresso de meta (barras)
- [x] Redesenhar layout com cards gradiente verde/azul moderno
- [x] Adicionar gráficos de barras horizontais comparativos
- [x] Implementar filtros avançados (data, empresa, cliente, vendedor, estado)
- [x] Criar widget de resumo de vendas por vendedor com ranking
- [x] Implementar grade de produtos por modelo com estoque em tempo real
- [x] Adicionar comparação visual vendas vs produtos em garantia
- [x] Criar gráfico de produtos mais vendidos por modelo
- [x] Adicionar indicadores de performance (KPIs) destacados
- [x] Implementar modo responsivo para mobile
- [ ] Adicionar exportação de relatórios em PDF/Excel


## Sistema de Gestão de Vendedores e Comissões
- [x] Adicionar campos de comissão no schema de users (vendedores)
- [x] Criar endpoints de cadastro e edição de vendedores
- [x] Criar página de cadastro/listagem de vendedores
- [x] Adicionar seleção de vendedor no PDV
- [ ] Criar PDV mobile responsivo (para usar no celular)
- [x] Criar relatório de vendas por vendedor com filtros avançados
- [x] Implementar gráfico de produtos vendidos por vendedor
- [x] Implementar gráfico de vendas vs garantias por vendedor
- [ ] Integrar cálculo automático de comissões nas vendas
- [ ] Adicionar histórico de comissões por vendedor
- [ ] Testar fluxo completo de venda com comissão
