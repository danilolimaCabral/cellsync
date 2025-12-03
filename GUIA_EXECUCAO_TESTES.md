# 📘 Guia de Execução dos Testes de Cancelamento e Reembolso

**Sistema:** CellSync  
**Ambiente:** Stripe Live Mode  
**Autor:** Manus AI

---

## 🎯 Objetivo

Este guia fornece instruções passo a passo para executar os testes de cancelamento de assinatura e reembolso no ambiente de produção do CellSync, utilizando tanto testes manuais quanto o script automatizado.

---

## 📋 Pré-requisitos

Antes de iniciar os testes, certifique-se de ter:

1. **Node.js 18+** instalado no seu sistema
2. **Acesso ao Stripe Dashboard** (Live Mode)
3. **Acesso ao Railway Dashboard** para monitorar logs
4. **Uma assinatura ativa** criada com cartão de crédito real
5. **Um pagamento bem-sucedido** para testar reembolso

---

## 🚀 Opção 1: Teste Manual (Recomendado para Primeira Execução)

### Passo 1: Preparar o Ambiente de Teste

1. Acesse o Stripe Dashboard: https://dashboard.stripe.com
2. Certifique-se de estar em **Live Mode** (toggle desativado)
3. Navegue até **Customers > Subscriptions**
4. Identifique uma assinatura ativa para teste
5. Anote o **Subscription ID** (começa com `sub_...`)

### Passo 2: Executar Cancelamento Manual

1. No painel do CellSync, faça login como `master@cellsync.com`
2. Navegue até o módulo de gerenciamento de clientes
3. Localize o cliente com a assinatura ativa
4. Clique em "Cancelar Assinatura"
5. Confirme a operação

### Passo 3: Verificar Resultados

1. **No CellSync:** O status do usuário deve mudar para "Inativo"
2. **No Stripe:** A assinatura deve ter status "Canceled"
3. **Nos Logs do Railway:** Deve haver registro do webhook `customer.subscription.deleted`

### Passo 4: Executar Reembolso Manual

1. No Stripe Dashboard, vá para **Payments**
2. Localize o pagamento da assinatura cancelada
3. Clique no pagamento e selecione "Refund"
4. Escolha "Full refund" ou insira um valor parcial
5. Confirme o reembolso

### Passo 5: Verificar Reembolso

1. O status do pagamento deve mudar para "Refunded"
2. O cliente receberá um email do Stripe confirmando o reembolso
3. O estorno aparecerá na fatura do cartão em alguns dias úteis

---

## 🤖 Opção 2: Teste Automatizado (Script Node.js)

### Passo 1: Instalar Dependências

Abra um terminal na pasta do projeto e execute:

```bash
cd /home/ubuntu/cellsync
npm install stripe node-fetch
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto ou configure as variáveis diretamente:

```bash
export STRIPE_SECRET_KEY="sk_live_51SZyPlQ68qKoVWUM..."
export CELLSYNC_API_URL="https://cellsync-production.up.railway.app"
export ADMIN_EMAIL="master@cellsync.com"
export ADMIN_PASSWORD="Master@123"
export SUBSCRIPTION_ID="sub_1234567890"  # ID da assinatura para cancelar
export PAYMENT_INTENT_ID="pi_1234567890"  # ID do pagamento para reembolsar
```

### Passo 3: Obter IDs Necessários

#### Para obter o Subscription ID:

1. Acesse o Stripe Dashboard
2. Vá para **Customers > Subscriptions**
3. Clique na assinatura desejada
4. Copie o ID que aparece no topo (ex: `sub_1SaJi5Q68qKoVWUM...`)

#### Para obter o Payment Intent ID:

1. No Stripe Dashboard, vá para **Payments**
2. Clique no pagamento que deseja reembolsar
3. Copie o "Payment Intent ID" (ex: `pi_1SaJi5Q68qKoVWUM...`)

### Passo 4: Executar o Script

```bash
node test-cancelamento-reembolso.mjs
```

### Passo 5: Interpretar os Resultados

O script exibirá logs coloridos para cada etapa:

- **[INFO]** (azul): Informações gerais
- **[✓]** (verde): Operação bem-sucedida
- **[✗]** (vermelho): Operação falhou
- **[!]** (amarelo): Aviso ou atenção necessária
- **[→]** (ciano): Próxima etapa

#### Exemplo de Saída Bem-Sucedida:

```
[→] 2025-12-03T15:30:00.000Z - Autenticando no CellSync...
[✓] 2025-12-03T15:30:01.234Z - Autenticação bem-sucedida!

========================================
TESTE 1: CANCELAMENTO DE ASSINATURA
========================================

[→] 2025-12-03T15:30:02.000Z - Buscando informações da assinatura sub_123...
[INFO] 2025-12-03T15:30:03.000Z - Status atual: active
[→] 2025-12-03T15:30:04.000Z - Cancelando assinatura...
[✓] 2025-12-03T15:30:05.000Z - Assinatura cancelada! Novo status: canceled
[✓] 2025-12-03T15:30:10.000Z - ✓ Teste de cancelamento PASSOU!

========================================
TESTE 2: REEMBOLSO DE PAGAMENTO
========================================

[→] 2025-12-03T15:30:12.000Z - Buscando informações do pagamento pi_123...
[INFO] 2025-12-03T15:30:13.000Z - Valor: 97.00 BRL
[→] 2025-12-03T15:30:14.000Z - Processando reembolso...
[✓] 2025-12-03T15:30:15.000Z - Reembolso criado! ID: re_123
[✓] 2025-12-03T15:30:18.000Z - ✓ Teste de reembolso PASSOU!

╔════════════════════════════════════════════════════════════╗
║                    RELATÓRIO FINAL                        ║
╚════════════════════════════════════════════════════════════╝

[✓] Teste de Cancelamento: ✓ PASSOU
[✓] Teste de Reembolso: ✓ PASSOU
[✓] Verificação de Webhooks: ✓ PASSOU

🎉 TODOS OS TESTES PASSARAM!
```

---

## 🔍 Troubleshooting

### Problema: "Erro na autenticação"

**Causa:** Credenciais incorretas ou API do CellSync indisponível.

**Solução:**
1. Verifique se o email e senha estão corretos
2. Teste o login manualmente no navegador
3. Verifique se a aplicação está rodando no Railway

### Problema: "Assinatura não está ativa"

**Causa:** A assinatura já foi cancelada ou está com status diferente de "active".

**Solução:**
1. Crie uma nova assinatura de teste
2. Verifique o status no Stripe Dashboard
3. Use um Subscription ID diferente

### Problema: "Pagamento não pode ser reembolsado"

**Causa:** O pagamento não foi bem-sucedido ou já foi reembolsado.

**Solução:**
1. Verifique o status do pagamento no Stripe Dashboard
2. Certifique-se de que o Payment Intent ID está correto
3. Use um pagamento diferente que tenha status "succeeded"

### Problema: "Webhook não encontrado"

**Causa:** O webhook ainda não foi processado ou não está configurado.

**Solução:**
1. Aguarde alguns segundos e tente novamente
2. Verifique se o webhook está configurado no Stripe Dashboard
3. Verifique os logs do Railway para erros de processamento

### Problema: Script falha com "MODULE_NOT_FOUND"

**Causa:** Dependências não foram instaladas.

**Solução:**
```bash
npm install stripe node-fetch
```

---

## 📊 Checklist de Validação Completa

Use esta checklist após executar os testes:

### Cancelamento de Assinatura
- [ ] Status da assinatura no CellSync mudou para "Inativo"
- [ ] Status da assinatura no Stripe mudou para "Canceled"
- [ ] Evento `customer.subscription.deleted` foi recebido (HTTP 200)
- [ ] Logs do Railway mostram processamento do webhook
- [ ] Usuário perdeu acesso a recursos pagos
- [ ] Nenhum erro foi gerado na aplicação

### Reembolso de Pagamento
- [ ] Status do pagamento no Stripe mudou para "Refunded"
- [ ] Valor correto foi reembolsado
- [ ] Cliente recebeu email de confirmação do Stripe
- [ ] Evento `charge.refunded` foi enviado (se aplicável)
- [ ] Logs do Railway não mostram erros
- [ ] Aplicação permaneceu estável

### Webhooks
- [ ] Endpoint do webhook está configurado corretamente
- [ ] URL do webhook está acessível publicamente
- [ ] Signing Secret está correto no Railway
- [ ] Eventos estão sendo entregues com sucesso (HTTP 200)
- [ ] Logs mostram processamento correto dos eventos

---

## 📞 Suporte

Se você encontrar problemas durante os testes:

1. **Verifique os logs do Railway:** https://railway.com/project/007b56c1-c85b-4e3d-93a1-acbd3d777e06
2. **Verifique os logs do Stripe:** https://dashboard.stripe.com/logs
3. **Verifique os webhooks do Stripe:** https://dashboard.stripe.com/webhooks
4. **Consulte a documentação:** `TEST_SCRIPT_CANCELAMENTO_REEMBOLSO.md`

---

## ✅ Conclusão

Após executar todos os testes e validar a checklist, o sistema CellSync estará completamente validado para processar cancelamentos e reembolsos em ambiente de produção.

**Próximos passos recomendados:**
1. Documentar os resultados dos testes
2. Criar um processo de monitoramento contínuo
3. Configurar alertas para falhas de webhook
4. Treinar a equipe nos procedimentos de cancelamento e reembolso

---

*Documento gerado por Manus AI - 03/12/2025*
