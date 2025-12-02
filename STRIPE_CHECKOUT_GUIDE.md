# 🎯 Guia de Teste do Checkout Stripe - CellSync

## ✅ Configuração Concluída

Os produtos foram criados com sucesso no Stripe:

### Plano Básico
- **Product ID:** `prod_TX2XvNItWWHrsN`
- **Price ID Mensal:** `price_1SZyS2Pzi7uvFYwOlXpj43yz` (R$ 99,00/mês)
- **Price ID Anual:** `price_1SZyS2Pzi7uvFYwOgCdpz4gh` (R$ 990,00/ano)

### Plano Profissional
- **Product ID:** `prod_TX2XDNcHBxnfny`
- **Price ID Mensal:** `price_1SZyS3Pzi7uvFYwOisoDN90T` (R$ 199,00/mês)
- **Price ID Anual:** `price_1SZyS3Pzi7uvFYwOP4Xzv5Pt` (R$ 1.990,00/ano)

### Plano Enterprise
- **Product ID:** `prod_TX2XsDFdxYMnX3`
- **Price ID Mensal:** `price_1SZyS3Pzi7uvFYwO6tGiJgzA` (R$ 399,00/mês)
- **Price ID Anual:** `price_1SZyS3Pzi7uvFYwOhzKFBUyC` (R$ 3.990,00/ano)

---

## 🧪 Como Testar o Checkout

### Passo 1: Acessar a Página de Planos
1. Acesse: https://3000-iob7ye059hwvp4sz9bjn9-f9914a8d.manusvm.computer/planos
2. Faça login no sistema (se necessário)

### Passo 2: Escolher um Plano
1. Escolha entre **Mensal** ou **Anual** no toggle
2. Clique em **"Assinar Agora"** em qualquer plano

### Passo 3: Preencher Dados no Stripe Checkout
Você será redirecionado para a página de checkout do Stripe. Use os seguintes dados de teste:

#### 💳 Cartão de Teste - Aprovado
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura (ex: 12/25)
CVC: Qualquer 3 dígitos (ex: 123)
CEP: Qualquer CEP (ex: 12345-678)
```

#### ❌ Cartão de Teste - Recusado
```
Número: 4000 0000 0000 0002
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
```

#### 🔐 Cartão de Teste - Requer Autenticação 3D Secure
```
Número: 4000 0025 0000 3155
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
```

### Passo 4: Confirmar Pagamento
1. Preencha os dados do cartão de teste
2. Clique em **"Assinar"**
3. Você será redirecionado para `/assinatura/sucesso`

---

## 🎉 Opção Alternativa: Trial Gratuito

Se preferir testar sem passar pelo checkout:

1. Na página de planos, clique em **"🎉 Iniciar Trial Grátis (14 dias)"**
2. Você será redirecionado imediatamente para o dashboard
3. Sem necessidade de cartão de crédito!

---

## 📊 Verificar no Stripe Dashboard

Após fazer um teste de pagamento:

1. Acesse: https://dashboard.stripe.com/acct_1SZcQBPzi7uvFYwO/test/dashboard
2. Vá em **"Pagamentos"** para ver as transações
3. Vá em **"Clientes"** para ver os clientes criados
4. Vá em **"Assinaturas"** para ver as assinaturas ativas

---

## 🔔 Webhooks (Próximo Passo)

Para receber notificações de eventos do Stripe (pagamento confirmado, assinatura cancelada, etc.):

1. Configure o webhook endpoint: `https://seu-dominio.com/api/stripe/webhook`
2. Eventos importantes:
   - `checkout.session.completed` - Pagamento concluído
   - `customer.subscription.updated` - Assinatura atualizada
   - `customer.subscription.deleted` - Assinatura cancelada
   - `invoice.payment_succeeded` - Pagamento recorrente bem-sucedido
   - `invoice.payment_failed` - Falha no pagamento recorrente

---

## 💡 Dicas

- **Modo Teste:** Todas as transações são simuladas e gratuitas
- **Sem Cobranças Reais:** Nenhum dinheiro real é movimentado
- **Cartões de Teste:** Use apenas os cartões fornecidos acima
- **Logs:** Verifique os logs no Stripe Dashboard para debug

---

## 🚀 Próximos Passos

1. ✅ Testar checkout com cartão aprovado
2. ✅ Testar checkout com cartão recusado
3. ✅ Verificar redirecionamento após pagamento
4. ⏳ Configurar webhooks para eventos do Stripe
5. ⏳ Implementar página de sucesso personalizada
6. ⏳ Adicionar portal de gerenciamento de assinatura

---

**Documentação Oficial do Stripe:**
- Cartões de Teste: https://stripe.com/docs/testing
- Checkout: https://stripe.com/docs/payments/checkout
- Webhooks: https://stripe.com/docs/webhooks
