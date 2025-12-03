# 🧪 Scripts de Teste - CellSync

Este diretório contém scripts e documentação para testar o fluxo de **cancelamento de assinatura** e **reembolso de pagamento** no ambiente de produção do CellSync com Stripe Live Mode.

---

## 📁 Arquivos Incluídos

| Arquivo | Descrição |
|---------|-----------|
| `TEST_SCRIPT_CANCELAMENTO_REEMBOLSO.md` | Roteiro completo de testes manuais com passo a passo detalhado |
| `test-cancelamento-reembolso.mjs` | Script automatizado Node.js para executar testes via API |
| `GUIA_EXECUCAO_TESTES.md` | Guia prático de como executar os testes (manual e automatizado) |
| `package-test.json` | Dependências do Node.js para o script automatizado |
| `README_TESTES.md` | Este arquivo (visão geral) |

---

## 🚀 Quick Start

### Opção 1: Teste Manual (Recomendado para Iniciantes)

1. Abra o arquivo `TEST_SCRIPT_CANCELAMENTO_REEMBOLSO.md`
2. Siga o passo a passo da **Parte 1** (Cancelamento) e **Parte 2** (Reembolso)
3. Use a checklist de validação ao final

### Opção 2: Teste Automatizado (Para Usuários Avançados)

1. Instale as dependências:
   ```bash
   npm install --prefix . --package-lock-only
   npm install stripe node-fetch
   ```

2. Configure as variáveis de ambiente:
   ```bash
   export SUBSCRIPTION_ID="sub_..."  # ID da assinatura para cancelar
   export PAYMENT_INTENT_ID="pi_..."  # ID do pagamento para reembolsar
   ```

3. Execute o script:
   ```bash
   node test-cancelamento-reembolso.mjs
   ```

4. Consulte o `GUIA_EXECUCAO_TESTES.md` para detalhes completos

---

## 📋 Pré-requisitos

- **Node.js 18+** instalado
- **Stripe Live Mode** ativado e configurado
- **Webhook Live** configurado no Stripe Dashboard
- **Uma assinatura ativa** para teste de cancelamento
- **Um pagamento bem-sucedido** para teste de reembolso

---

## 🎯 O Que Será Testado

### 1. Cancelamento de Assinatura
- ✅ Cancelamento via API do Stripe
- ✅ Atualização de status no banco de dados
- ✅ Processamento do webhook `customer.subscription.deleted`
- ✅ Revogação de acesso do usuário

### 2. Reembolso de Pagamento
- ✅ Criação de reembolso via API do Stripe
- ✅ Processamento do reembolso (total ou parcial)
- ✅ Envio de notificação ao cliente
- ✅ Estabilidade da aplicação durante o processo

### 3. Verificação de Webhooks
- ✅ Entrega bem-sucedida de eventos
- ✅ Processamento correto no backend
- ✅ Logs sem erros

---

## 📊 Estrutura dos Testes

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE TESTES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. TESTE DE CANCELAMENTO                                   │
│     ├─ Buscar assinatura ativa                              │
│     ├─ Cancelar via API do Stripe                           │
│     ├─ Verificar webhook recebido                           │
│     └─ Validar status no CellSync                           │
│                                                             │
│  2. TESTE DE REEMBOLSO                                      │
│     ├─ Buscar pagamento bem-sucedido                        │
│     ├─ Criar reembolso via API                              │
│     ├─ Verificar processamento                              │
│     └─ Validar notificação ao cliente                       │
│                                                             │
│  3. VERIFICAÇÃO DE WEBHOOKS                                 │
│     ├─ Listar últimos eventos                               │
│     ├─ Verificar eventos críticos                           │
│     └─ Validar entrega bem-sucedida                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting Rápido

| Problema | Solução Rápida |
|----------|----------------|
| Script não executa | Execute `npm install stripe node-fetch` |
| Erro de autenticação | Verifique credenciais no arquivo de configuração |
| Webhook não recebido | Verifique URL e Signing Secret no Railway |
| Assinatura não cancela | Verifique se o ID está correto e a assinatura está ativa |
| Reembolso falha | Verifique se o pagamento tem status "succeeded" |

Para troubleshooting detalhado, consulte o `GUIA_EXECUCAO_TESTES.md`.

---

## 📞 Recursos Adicionais

### Documentação
- [Stripe API - Subscriptions](https://stripe.com/docs/api/subscriptions)
- [Stripe API - Refunds](https://stripe.com/docs/api/refunds)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

### Dashboards
- **CellSync:** https://cellsync-production.up.railway.app
- **Railway:** https://railway.com/project/007b56c1-c85b-4e3d-93a1-acbd3d777e06
- **Stripe:** https://dashboard.stripe.com

---

## ✅ Checklist Pós-Teste

Após executar todos os testes, verifique:

- [ ] Todos os testes passaram sem erros
- [ ] Webhooks estão sendo entregues com sucesso (HTTP 200)
- [ ] Logs do Railway não mostram erros
- [ ] Status no Stripe Dashboard está correto
- [ ] Status no CellSync está correto
- [ ] Usuário perdeu acesso após cancelamento
- [ ] Cliente recebeu notificação de reembolso

---

## 🎉 Conclusão

Com estes scripts e documentação, você pode validar completamente o fluxo de cancelamento e reembolso no CellSync, garantindo que a integração com o Stripe Live Mode funcione perfeitamente em produção.

**Próximos passos:**
1. Execute os testes seguindo o guia
2. Documente os resultados
3. Configure monitoramento contínuo
4. Treine a equipe nos procedimentos

---

*Documentação criada por Manus AI - 03/12/2025*
