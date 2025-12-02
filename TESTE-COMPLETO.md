# Guia de Teste Completo End-to-End - CellSync

**Autor:** Manus AI  
**Data:** Dezembro 2024  
**Versão:** 1.0

---

## Introdução

Este documento apresenta um roteiro completo de testes end-to-end para o sistema **CellSync**, cobrindo todos os módulos principais desde a configuração inicial da loja até a emissão de documentos fiscais. O objetivo é validar o fluxo completo de operação de uma loja de celulares, incluindo cadastros, vendas, assistência técnica e gestão financeira.

O teste foi estruturado para simular um cenário real de uso, onde um lojista configura seu sistema, cadastra produtos com auxílio de IA, registra clientes, realiza vendas (varejo e atacado), gerencia estoque com controle de IMEI, presta serviços técnicos e emite documentos fiscais.

---

## Pré-requisitos

Antes de iniciar os testes, certifique-se de que o sistema está devidamente configurado:

**Ambiente de desenvolvimento:**
- Servidor de desenvolvimento rodando (`pnpm dev`)
- Banco de dados MySQL/TiDB conectado e acessível
- Variáveis de ambiente configuradas corretamente

**Dados iniciais:**
- Execute o script de seed para popular o sistema com dados de exemplo:
  ```bash
  node scripts/seed-complete-system.mjs
  ```

**Credenciais de acesso:**
- **Admin:** admin@techcell.com / 123456
- **Vendedor 1:** joao@techcell.com / 123456
- **Vendedor 2:** maria@techcell.com / 123456
- **Técnico:** pedro@techcell.com / 123456

---

## Módulo 1: Configuração da Loja

O primeiro passo para utilizar o sistema é configurar os dados cadastrais da loja, que serão utilizados em todos os documentos fiscais e recibos.

### 1.1 Acessar Configuração da Loja

**Passos:**
1. Faça login como **Admin** (admin@techcell.com / 123456)
2. No menu lateral, clique em **"Configuração da Loja"**
3. Verifique se a página carrega corretamente com todos os campos

**Resultado esperado:**
- Página "Configuração da Loja" deve carregar com formulário completo
- Campos devem estar organizados em seções: Dados Básicos, Endereço, Contatos
- Se já houver dados (do seed), eles devem aparecer preenchidos

### 1.2 Preencher Dados Cadastrais

**Passos:**
1. Preencha ou verifique os seguintes campos:

**Dados Básicos:**
- Nome Fantasia: `TechCell - Loja de Celulares`
- CNPJ: `12.345.678/0001-90`
- Razão Social: `TechCell Comércio de Eletrônicos LTDA`
- Inscrição Estadual: `123.456.789.012`
- Inscrição Municipal: `12345678`
- Regime Tributário: `Simples Nacional`

**Endereço:**
- CEP: `01310-100` (deve preencher automaticamente)
- Logradouro: `Avenida Paulista`
- Número: `1578`
- Complemento: `Loja 15`
- Bairro: `Bela Vista`
- Cidade: `São Paulo`
- Estado: `SP`

**Contatos:**
- Telefone: `(11) 3456-7890`
- Celular: `(11) 98765-4321`
- Email: `contato@techcell.com.br`
- Website: `https://www.techcell.com.br`

2. Clique em **"Salvar Configurações"**

**Resultado esperado:**
- Validação de CNPJ deve funcionar (formato correto)
- Busca automática de CEP deve preencher endereço
- Mensagem de sucesso: "Dados da loja atualizados com sucesso!"
- Dados devem ser salvos no banco de dados

### 1.3 Validações

**Teste de validação de CNPJ inválido:**
1. Tente salvar com CNPJ: `11.111.111/1111-11`
2. Sistema deve exibir: "CNPJ inválido"

**Teste de busca de CEP:**
1. Limpe o endereço
2. Digite CEP: `01310-100`
3. Aguarde 1 segundo
4. Campos de endereço devem ser preenchidos automaticamente

---

## Módulo 2: Cadastro de Produtos com Assistente IA

O sistema possui um assistente de IA que analisa fotos de produtos e preenche automaticamente os dados cadastrais.

### 2.1 Cadastrar Produto Manualmente

**Passos:**
1. No menu lateral, clique em **"Estoque"**
2. Clique no botão **"+ Cadastrar Produto"**
3. Preencha manualmente:
   - Nome: `iPhone 16 Pro 256GB Titânio`
   - Marca: `Apple`
   - Modelo: `iPhone 16 Pro`
   - Categoria: `Smartphone`
   - SKU: `IPH16P256TIT`
   - Preço de Custo: `R$ 7.200,00`
   - Preço de Venda: `R$ 9.499,00`
   - Preço Atacado: `R$ 8.999,00`
   - Qtd Mínima Atacado: `5`
   - Estoque Mínimo: `10`
   - Requer IMEI: ✅ Sim
4. Clique em **"Salvar Produto"**

**Resultado esperado:**
- Produto deve ser cadastrado com sucesso
- Mensagem: "Produto cadastrado com sucesso!"
- Produto deve aparecer na lista de estoque

### 2.2 Cadastrar Produto com Assistente IA

**Passos:**
1. Clique em **"+ Cadastrar Produto"**
2. Clique no ícone do **Assistente IA** (ícone de robô/estrela)
3. No chat do assistente, clique em **"📸 Enviar foto do produto"**
4. Faça upload de uma foto de um celular (pode ser da internet)
5. Aguarde a análise da IA

**Resultado esperado:**
- IA deve analisar a imagem e retornar:
  - Marca identificada
  - Modelo identificado
  - Especificações técnicas
  - Sugestão de preço
  - Categoria sugerida
- Botão **"✨ Preencher Formulário"** deve aparecer
- Ao clicar, todos os campos devem ser preenchidos automaticamente

### 2.3 Interação com Assistente

**Perguntas para testar:**
1. "Qual o melhor preço para este produto?"
2. "Como devo categorizar este item?"
3. "Qual a margem de lucro ideal?"

**Resultado esperado:**
- Assistente deve responder contextualizando com o produto
- Respostas devem ser relevantes e úteis
- Histórico de conversa deve ser mantido

---

## Módulo 3: Cadastro de Clientes com Assistente IA

Similar ao cadastro de produtos, o cadastro de clientes também possui assistente IA para extração automática de dados de documentos.

### 3.1 Cadastrar Cliente Manualmente

**Passos:**
1. No menu lateral, clique em **"Clientes"**
2. Clique em **"+ Novo Cliente"**
3. Preencha:
   - Nome: `Fernando Souza`
   - CPF: `111.222.333-44`
   - Telefone: `(11) 99999-8888`
   - Email: `fernando@email.com`
   - Endereço: `Rua Augusta, 2000`
   - Cidade: `São Paulo`
   - Estado: `SP`
4. Clique em **"Salvar Cliente"**

**Resultado esperado:**
- Cliente cadastrado com sucesso
- Aparece na lista de clientes

### 3.2 Cadastrar Cliente com Assistente IA

**Passos:**
1. Clique em **"+ Novo Cliente"**
2. Abra o **Assistente IA**
3. Clique em **"📄 Enviar documento (RG/CNH/CPF)"**
4. Faça upload de uma foto de documento
5. Aguarde extração automática

**Resultado esperado:**
- IA extrai: Nome, CPF, RG, Data de Nascimento
- Campos são preenchidos automaticamente
- Validação de CPF funciona

---

## Módulo 4: Gestão de Estoque com IMEI

O sistema controla individualmente cada aparelho através do IMEI, permitindo rastreabilidade completa.

### 4.1 Adicionar Produto ao Estoque

**Passos:**
1. Vá em **"Estoque"**
2. Clique em um produto que requer IMEI (ex: iPhone 15 Pro Max)
3. Clique em **"+ Adicionar ao Estoque"**
4. Digite o IMEI: `351234567890123`
5. Selecione status: `Disponível`
6. Clique em **"Adicionar"**

**Resultado esperado:**
- Item adicionado ao estoque com IMEI único
- Quantidade em estoque aumenta em 1
- IMEI não pode ser duplicado

### 4.2 Movimentações de Estoque

**Passos:**
1. Clique em **"Movimentações"** no menu
2. Verifique histórico de entradas e saídas
3. Filtre por produto
4. Filtre por período

**Resultado esperado:**
- Todas as movimentações são registradas
- Filtros funcionam corretamente
- Detalhes incluem: data, tipo, quantidade, usuário responsável

---

## Módulo 5: Vendas no PDV

O PDV suporta dois tipos de venda: **Varejo** (preço normal) e **Atacado** (preço reduzido para quantidades maiores).

### 5.1 Venda Varejo com IMEI

**Passos:**
1. Faça login como **Vendedor** (joao@techcell.com / 123456)
2. Vá em **"Vendas (PDV)"**
3. Selecione cliente: `Fernando Souza`
4. Adicione produto: `iPhone 15 Pro Max 256GB`
5. Sistema deve solicitar seleção de IMEI
6. Selecione um IMEI disponível
7. Verifique o preço: deve ser o preço de **varejo**
8. Método de pagamento: `PIX`
9. Clique em **"Finalizar Venda"**

**Resultado esperado:**
- Venda registrada com sucesso
- IMEI marcado como "vendido" no estoque
- Quantidade em estoque reduz em 1
- Comissão do vendedor calculada automaticamente
- Opção de **"Imprimir Recibo"** disponível

### 5.2 Venda Atacado (Desconto Automático)

**Passos:**
1. No PDV, adicione produto: `Capinha Silicone Premium`
2. Quantidade: `50` (acima do mínimo para atacado)
3. Sistema deve **automaticamente** aplicar preço de atacado
4. Verifique badge: **"ATACADO"** deve aparecer
5. Verifique desconto aplicado
6. Método de pagamento: `Cartão de Crédito`
7. Finalize a venda

**Resultado esperado:**
- Preço unitário muda automaticamente para preço atacado
- Badge "ATACADO" visível
- Campo "Economia" mostra quanto o cliente economizou
- Venda registrada como tipo "wholesale"

### 5.3 Venda com Múltiplos Itens

**Passos:**
1. Adicione 3 produtos diferentes ao carrinho
2. Aplique desconto manual de R$ 50,00
3. Finalize a venda

**Resultado esperado:**
- Total calculado corretamente
- Desconto aplicado no valor final
- Todos os itens registrados na venda

---

## Módulo 6: Recibo de Venda

Após finalizar uma venda, o sistema gera um recibo em PDF com os dados da loja configurados.

### 6.1 Gerar e Verificar Recibo

**Passos:**
1. Após finalizar uma venda, clique em **"Imprimir Recibo"**
2. PDF deve ser gerado e baixado
3. Abra o PDF

**Resultado esperado - Cabeçalho do Recibo:**
- Nome da loja: `TechCell - Loja de Celulares`
- CNPJ: `12.345.678/0001-90`
- Endereço: `Avenida Paulista, 1578 - Loja 15 - São Paulo/SP`
- Telefone: `(11) 3456-7890`

**Resultado esperado - Corpo do Recibo:**
- Número da venda
- Data e hora
- Nome do vendedor
- Dados do cliente
- Lista de produtos com IMEI (se aplicável)
- Subtotal, desconto, total
- Método de pagamento
- Badge de tipo de venda (VAREJO ou ATACADO)
- QR Code para consulta

**Validação:**
- Todos os dados da loja devem estar corretos
- Formatação profissional
- QR Code funcional

---

## Módulo 7: Histórico de Vendas

### 7.1 Consultar Vendas

**Passos:**
1. Vá em **"Histórico de Vendas"**
2. Verifique lista de todas as vendas
3. Use filtros:
   - Por período
   - Por vendedor
   - Por cliente
   - Por tipo (varejo/atacado)

**Resultado esperado:**
- Todas as vendas listadas
- Filtros funcionam corretamente
- Detalhes incluem: número, data, cliente, vendedor, total, status

### 7.2 Detalhes da Venda

**Passos:**
1. Clique em uma venda
2. Visualize detalhes completos

**Resultado esperado:**
- Todos os itens da venda
- IMEIs vendidos
- Comissão calculada
- Opção de reimprimir recibo
- Opção de emitir NF-e

---

## Módulo 8: Ordem de Serviço (OS)

O sistema gerencia serviços técnicos com controle de peças, diagnóstico e orçamento.

### 8.1 Criar Ordem de Serviço

**Passos:**
1. Faça login como **Técnico** (pedro@techcell.com / 123456)
2. Vá em **"Ordem de Serviço"**
3. Clique em **"+ Nova OS"**
4. Preencha:
   - Cliente: `Ana Paula Costa`
   - Marca: `Samsung`
   - Modelo: `Galaxy S23`
   - Defeito Relatado: `Não liga, bateria descarrega rápido`
5. Clique em **"Salvar OS"**

**Resultado esperado:**
- OS criada com status "Aguardando Diagnóstico"
- Número da OS gerado automaticamente

### 8.2 Adicionar Diagnóstico com IA

**Passos:**
1. Abra a OS criada
2. Clique em **"Assistente de Diagnóstico IA"**
3. Descreva o problema: `"Cliente relata que aparelho não liga e bateria descarrega muito rápido"`
4. IA deve sugerir diagnóstico e soluções

**Resultado esperado:**
- IA analisa sintomas
- Sugere possíveis causas
- Recomenda testes e procedimentos
- Estima custo de reparo

### 8.3 Adicionar Peças e Finalizar

**Passos:**
1. Adicione peça: `Bateria Samsung Galaxy S23`
2. Defina custo estimado: `R$ 250,00`
3. Prazo estimado: `3 dias`
4. Altere status para: `Em Andamento`
5. Após "reparo", altere status para: `Concluído`

**Resultado esperado:**
- Peças adicionadas ao orçamento
- Cliente pode ser notificado
- Histórico de status registrado

---

## Módulo 9: Nota Fiscal Eletrônica (NF-e)

### 9.1 Emitir NF-e de uma Venda

**Passos:**
1. Vá em **"Notas Fiscais"**
2. Clique em **"+ Emitir NF-e"**
3. Selecione uma venda do histórico
4. Dados do emitente devem ser preenchidos automaticamente:
   - CNPJ da loja
   - Razão Social
   - Endereço completo
5. Dados do destinatário (cliente) também preenchidos
6. Produtos da venda carregados automaticamente
7. Preencha campos fiscais:
   - CFOP: `5102`
   - Natureza da Operação: `Venda de mercadoria`
   - Forma de Pagamento: `À vista`
8. Clique em **"Gerar NF-e"**

**Resultado esperado:**
- NF-e criada com status "Rascunho"
- Número sequencial gerado
- Todos os dados da loja aparecem corretamente no emitente
- XML pode ser gerado (simulado)

### 9.2 Consultar NF-e Emitidas

**Passos:**
1. Liste todas as NF-e
2. Filtre por status
3. Visualize detalhes de uma NF-e

**Resultado esperado:**
- Todas as NF-e listadas
- Status: Rascunho, Autorizada, Cancelada
- Detalhes completos disponíveis

---

## Módulo 10: Gestão Financeira

### 10.1 Contas a Receber

**Passos:**
1. Vá em **"Financeiro"**
2. Aba **"Contas a Receber"**
3. Verifique vendas registradas automaticamente
4. Marque uma conta como "Recebida"

**Resultado esperado:**
- Vendas aparecem como contas a receber
- Status: Pendente, Recebida, Atrasada
- Filtros por período funcionam

### 10.2 Contas a Pagar

**Passos:**
1. Aba **"Contas a Pagar"**
2. Clique em **"+ Nova Conta"**
3. Preencha:
   - Descrição: `Fornecedor - Compra de Estoque`
   - Valor: `R$ 15.000,00`
   - Vencimento: `10 dias`
   - Categoria: `Custo Variável`
4. Salve

**Resultado esperado:**
- Conta registrada
- Aparece na lista de pendentes
- Alerta de vencimento próximo (se aplicável)

### 10.3 Fluxo de Caixa

**Passos:**
1. Aba **"Fluxo de Caixa"**
2. Visualize entradas e saídas
3. Verifique saldo atual
4. Filtre por período

**Resultado esperado:**
- Gráfico de fluxo de caixa
- Entradas (vendas, recebimentos)
- Saídas (contas pagas)
- Saldo calculado automaticamente

---

## Módulo 11: Comissões

### 11.1 Configurar Regra de Comissão

**Passos:**
1. Vá em **"Comissões"**
2. Clique em **"+ Nova Regra"**
3. Preencha:
   - Vendedor: `João Santos`
   - Tipo: `Percentual`
   - Valor: `5%`
   - Categoria: `Smartphone`
4. Salve

**Resultado esperado:**
- Regra criada
- Aplicada automaticamente em vendas futuras

### 11.2 Consultar Comissões

**Passos:**
1. Visualize comissões calculadas
2. Filtre por vendedor
3. Filtre por período

**Resultado esperado:**
- Comissões calculadas automaticamente nas vendas
- Total por vendedor
- Detalhamento por venda

---

## Módulo 12: Relatórios

### 12.1 Relatório de Vendas

**Passos:**
1. Vá em **"Relatórios"**
2. Selecione **"Relatório de Vendas"**
3. Escolha período: Últimos 30 dias
4. Gere relatório

**Resultado esperado:**
- Total de vendas
- Ticket médio
- Produtos mais vendidos
- Vendedores com melhor desempenho
- Gráficos visuais

### 12.2 Relatório de Estoque

**Passos:**
1. Selecione **"Relatório de Estoque"**
2. Visualize:
   - Produtos em estoque
   - Produtos abaixo do mínimo
   - Valor total do estoque

**Resultado esperado:**
- Lista completa de produtos
- Alertas de estoque baixo
- Valor total investido

---

## Módulo 13: Importação de Produtos

### 13.1 Importar via XML (NF-e)

**Passos:**
1. Vá em **"Importar XML (NF-e)"**
2. Faça upload de um arquivo XML de nota fiscal
3. Sistema extrai produtos automaticamente
4. Revise dados extraídos
5. Confirme importação

**Resultado esperado:**
- Produtos extraídos do XML
- Dados preenchidos automaticamente
- Opção de editar antes de importar
- Produtos adicionados ao estoque

### 13.2 Importar via Planilha CSV

**Passos:**
1. Vá em **"Importar Planilha (CSV)"**
2. Baixe modelo de planilha
3. Preencha com produtos
4. Faça upload
5. Mapeie colunas
6. Confirme importação

**Resultado esperado:**
- Sistema lê CSV corretamente
- Validações aplicadas
- Produtos importados em lote

---

## Checklist Final de Validação

Após executar todos os testes, verifique:

### Dados da Loja
- [ ] Loja configurada com CNPJ válido
- [ ] Endereço completo cadastrado
- [ ] Dados aparecem em recibos e NF-e

### Produtos
- [ ] Cadastro manual funciona
- [ ] Assistente IA analisa fotos corretamente
- [ ] Controle de IMEI funciona
- [ ] Preços varejo e atacado configurados

### Clientes
- [ ] Cadastro manual funciona
- [ ] Assistente IA extrai dados de documentos
- [ ] Validação de CPF/CNPJ funciona

### Estoque
- [ ] Adição de produtos com IMEI
- [ ] Movimentações registradas
- [ ] Alertas de estoque baixo

### Vendas
- [ ] PDV varejo funciona
- [ ] PDV atacado aplica desconto automático
- [ ] IMEI é obrigatório para smartphones
- [ ] Comissões calculadas automaticamente

### Recibos
- [ ] Dados da loja aparecem no cabeçalho
- [ ] Formatação profissional
- [ ] QR Code gerado

### NF-e
- [ ] Dados do emitente preenchidos automaticamente
- [ ] Produtos carregados da venda
- [ ] XML gerado (simulado)

### Ordem de Serviço
- [ ] Criação de OS funciona
- [ ] Assistente IA sugere diagnóstico
- [ ] Controle de peças e custos

### Financeiro
- [ ] Contas a receber registradas automaticamente
- [ ] Contas a pagar gerenciadas
- [ ] Fluxo de caixa calculado

### Relatórios
- [ ] Relatórios gerados corretamente
- [ ] Gráficos visuais funcionam
- [ ] Filtros aplicados

---

## Conclusão

Este guia apresentou um roteiro completo de testes end-to-end para o sistema CellSync, cobrindo todos os módulos principais desde a configuração inicial até a emissão de documentos fiscais. A execução completa deste roteiro garante que o sistema está funcionando corretamente e pronto para uso em produção.

**Tempo estimado para execução completa:** 2-3 horas

**Próximos passos:**
1. Executar o script de seed: `node scripts/seed-complete-system.mjs`
2. Seguir este guia passo a passo
3. Reportar qualquer problema encontrado
4. Validar integrações com sistemas externos (quando aplicável)

---

**Documento gerado por:** Manus AI  
**Última atualização:** Dezembro 2024
