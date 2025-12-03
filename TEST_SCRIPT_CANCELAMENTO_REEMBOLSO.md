
_Este documento foi gerado pelo Manus AI em 03/12/2025._

# 🧪 Roteiro de Testes: Cancelamento de Assinatura e Reembolso (Stripe Live Mode)

**Sistema:** CellSync - Gestão de Assistência Técnica  
**Ambiente:** Produção (Live Mode)  
**URL:** https://cellsync-production.up.railway.app

---

## 🎯 Objetivo

Validar de ponta a ponta o fluxo de **cancelamento de assinatura** e **reembolso de pagamento** no ambiente de produção do CellSync, garantindo que a integração com o Stripe Live Mode funcione conforme o esperado, os webhooks sejam processados corretamente e o status do usuário seja atualizado no banco de dados.

---

## 📋 Pré-requisitos

Antes de iniciar os testes, certifique-se de que os seguintes requisitos foram atendidos:

1.  **Conta Stripe Ativada:** O perfil da empresa no Stripe foi completamente preenchido e a conta está habilitada para transações em Live Mode.
2.  **Webhook Live Configurado:** O webhook de produção foi criado no Stripe Dashboard e o *Signing Secret* (`whsec_...`) foi atualizado na variável de ambiente `STRIPE_WEBHOOK_SECRET` no Railway.
    *   **URL do Endpoint:** `https://cellsync-production.up.railway.app/api/webhooks/stripe`
    *   **Eventos Ativos:** `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`.
3.  **Assinatura Ativa para Teste:** Um usuário de teste realizou uma assinatura em um dos planos (Básico, Profissional ou Empresarial) com um **cartão de crédito real**. A assinatura deve estar com o status "Ativa".
4.  **Acesso de Administrador:** Acesso à conta `master@cellsync.com` para realizar as operações de cancelamento e reembolso no painel do CellSync.
5.  **Acesso ao Stripe Dashboard:** Acesso à conta do Stripe para monitorar transações, assinaturas e eventos em tempo real.

---

## Parte 1: Teste de Cancelamento de Assinatura

Este teste valida o processo de cancelamento de uma assinatura ativa diretamente pelo painel administrativo do CellSync.

### Cenário 1: Cancelamento Imediato

| Passo | Ação | Resultado Esperado |
| :--- | :--- | :--- |
| 1 | **Login no CellSync:** Acesse a aplicação com o usuário `master@cellsync.com`. | O dashboard principal é exibido com sucesso. |
| 2 | **Acessar Módulo de Clientes:** No menu lateral, navegue até o módulo de Clientes (ou Usuários) onde as assinaturas são gerenciadas. | A lista de clientes/usuários com assinaturas ativas é exibida. |
| 3 | **Localizar Assinatura de Teste:** Encontre o usuário cuja assinatura foi criada durante os pré-requisitos. | O usuário é encontrado e seu status de assinatura está como "Ativo". |
| 4 | **Iniciar Cancelamento:** Clique na opção "Cancelar Assinatura" para este usuário. | Um modal de confirmação aparece, perguntando se deseja prosseguir com o cancelamento. |
| 5 | **Confirmar Cancelamento:** Confirme a operação de cancelamento. | A aplicação envia uma requisição para a API do Stripe para cancelar a assinatura. A interface do CellSync deve atualizar o status do usuário para "Cancelado" ou "Inativo". |
| 6 | **Verificar no Stripe Dashboard:** Acesse o Stripe Dashboard e navegue até a seção **Customers > Subscriptions**. | A assinatura correspondente ao usuário de teste deve ter o status alterado para **"Canceled"**. O cancelamento deve ser imediato. |
| 7 | **Verificar Webhook:** No Stripe Dashboard, vá para **Developers > Webhooks**. Selecione o endpoint de produção. | Um evento `customer.subscription.deleted` deve ter sido enviado com sucesso (Status `200 OK`). |
| 8 | **Verificar Logs do Railway:** Acesse os logs da aplicação no Railway. | Deve haver um registro de log confirmando o recebimento do webhook `customer.subscription.deleted` e a atualização do status do usuário no banco de dados. |
| 9 | **Verificar Acesso do Usuário:** Tente acessar uma funcionalidade restrita ao plano assinado com a conta do usuário de teste. | O acesso deve ser **bloqueado**, e o usuário deve ser redirecionado ou notificado sobre a falta de uma assinatura ativa. |

---

## Parte 2: Teste de Reembolso de Pagamento

Este teste valida o processo de reembolso (parcial ou total) de uma transação realizada.

### Cenário 2: Reembolso Total via Stripe Dashboard

| Passo | Ação | Resultado Esperado |
| :--- | :--- | :--- |
| 1 | **Login no Stripe Dashboard:** Acesse a conta Stripe em Live Mode. | O dashboard principal é exibido. |
| 2 | **Localizar Pagamento:** Navegue até **Payments** e encontre a transação original da assinatura do usuário de teste. | O pagamento é encontrado com o status **"Succeeded"**. |
| 3 | **Iniciar Reembolso:** Clique no pagamento para ver os detalhes e selecione a opção **"Refund"**. | Um modal para configurar o reembolso é exibido. |
| 4 | **Configurar Reembolso Total:** Mantenha o valor total do pagamento e selecione um motivo (ex: "Requested by customer"). | O valor a ser reembolsado corresponde ao valor total da transação. |
| 5 | **Confirmar Reembolso:** Clique no botão para confirmar o reembolso. | O Stripe processa o reembolso. O status do pagamento no dashboard muda para **"Refunded"**. O cliente final recebe uma notificação por e-mail do Stripe sobre o reembolso. |
| 6 | **Verificar Saldo do Cliente:** O valor reembolsado deve ser estornado para o limite do cartão de crédito do cliente em alguns dias úteis. | (Verificação externa) O cliente confirma o recebimento do estorno na fatura do cartão. |
| 7 | **Verificar Webhook (Opcional):** No Stripe, vá para **Developers > Webhooks**. | Um evento `charge.refunded` deve ter sido enviado com sucesso. *Nota: O CellSync pode ou não ter uma lógica para tratar este evento. Se não houver, nenhum erro deve ser gerado.* |
| 8 | **Verificar Logs do Railway:** Monitore os logs da aplicação no Railway. | A aplicação não deve apresentar erros ao receber o evento `charge.refunded`. Se houver lógica associada, o log deve indicar a ação executada. |

---

## ✅ Checklist de Validação Final

Utilize esta checklist para confirmar que todos os pontos críticos foram validados com sucesso.

### Cancelamento
- [ ] O status da assinatura no painel do CellSync foi atualizado para "Cancelado"?
- [ ] O status da assinatura no Stripe Dashboard foi atualizado para "Canceled"?
- [ ] O evento `customer.subscription.deleted` foi recebido com sucesso (HTTP 200) pelo webhook?
- [ ] O acesso do usuário a recursos pagos foi revogado imediatamente após o cancelamento?

### Reembolso
- [ ] O status do pagamento no Stripe Dashboard foi atualizado para "Refunded"?
- [ ] O valor correto foi estornado para o cliente?
- [ ] A aplicação CellSync permaneceu estável e sem erros após o evento de reembolso?

---

## 🔍 Guia de Troubleshooting

| Problema | Causa Provável | Solução |
| :--- | :--- | :--- |
| **A assinatura não é cancelada no Stripe.** | Erro de comunicação com a API do Stripe ou chave de API incorreta. | 1. Verifique os logs do Railway em busca de erros de API. 2. Confirme se a `STRIPE_SECRET_KEY` no Railway está correta e é uma chave de **Live Mode**. |
| **O status do usuário não muda no CellSync após o cancelamento.** | O webhook não foi recebido ou falhou ao ser processado. | 1. No Stripe, verifique se o evento `customer.subscription.deleted` foi enviado e se houve erro (não-200). 2. Verifique a URL do endpoint no Stripe. 3. Confirme se o `STRIPE_WEBHOOK_SECRET` no Railway está correto. |
| **O acesso do usuário não é bloqueado após o cancelamento.** | A lógica de verificação de permissões na aplicação está falhando. | Revise o middleware ou a função que verifica o status da assinatura do usuário antes de permitir o acesso a rotas protegidas. |
| **O reembolso falha no Stripe.** | O pagamento não é reembolsável (ex: muito antigo) ou não há saldo suficiente na conta Stripe. | Verifique as políticas de reembolso do Stripe e o saldo disponível na conta. Tente um reembolso parcial. |


---

## Parte 3: Teste Automatizado via API (Node.js)

Para agilizar os testes e permitir a execução repetida, um script automatizado em Node.js foi preparado. Ele se comunica diretamente com a API do Stripe para realizar as operações de cancelamento e reembolso.

### Cenário 3: Execução do Script Automatizado

| Passo | Ação | Resultado Esperado |
| :--- | :--- | :--- |
| 1 | **Configurar o Ambiente:** Abra o arquivo `test-cancelamento-reembolso.mjs` em um editor de texto. | O conteúdo do script é exibido. |
| 2 | **Definir IDs de Teste:** No início do script, localize a seção `CONFIG`. Você precisará fornecer o `SUBSCRIPTION_ID` da assinatura ativa que deseja cancelar e o `PAYMENT_INTENT_ID` do pagamento que deseja reembolsar. | As variáveis `SUBSCRIPTION_ID` e `PAYMENT_INTENT_ID` estão preenchidas com os IDs corretos do ambiente Live do Stripe. |
| 3 | **Instalar Dependências:** Abra um terminal na pasta do projeto e execute `npm install stripe node-fetch`. | As bibliotecas `stripe` e `node-fetch` são instaladas com sucesso. |
| 4 | **Executar o Script:** No terminal, execute o comando `node test-cancelamento-reembolso.mjs`. | O script inicia a execução, exibindo logs coloridos para cada etapa: autenticação, busca de dados, cancelamento e reembolso. |
| 5 | **Monitorar a Saída:** Acompanhe os logs no terminal. O script informará o status de cada operação. | O script deve reportar "✓ Teste de cancelamento PASSOU!" e "✓ Teste de reembolso PASSOU!". |
| 6 | **Verificar Relatório Final:** Ao final da execução, o script exibirá um resumo dos resultados. | O relatório final deve indicar que todos os testes foram concluídos com sucesso. Em caso de falha, ele apontará qual etapa falhou. |
| 7 | **Verificação Manual (Opcional):** Após a execução do script, verifique manualmente o Stripe Dashboard para confirmar que a assinatura está "Canceled" e o pagamento está "Refunded". | As alterações realizadas pelo script são refletidas corretamente na interface do Stripe. |

---

## Referências e Documentação Adicional

Para um aprofundamento técnico, consulte as seguintes documentações oficiais:

- **Stripe API - Cancelar Assinaturas:** [https://stripe.com/docs/api/subscriptions/cancel](https://stripe.com/docs/api/subscriptions/cancel)
- **Stripe API - Reembolsar Pagamentos:** [https://stripe.com/docs/api/refunds/create](https://stripe.com/docs/api/refunds/create)
- **Stripe Webhooks - Eventos:** [https://stripe.com/docs/webhooks/events/types](https://stripe.com/docs/webhooks/events/types)
