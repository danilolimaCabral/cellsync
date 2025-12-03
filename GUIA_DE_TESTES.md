# 🧪 Guia Completo de Testes - CellSync

**Sistema:** CellSync - Gestão para Lojas de Celular  
**Status:** ✅ Online e Funcionando  
**Data:** 03/12/2025

---

## 🌐 Acesso ao Sistema

### URL Principal
**https://3002-iutan8xhm9xqbp3744rrj-8518b105.manusvm.computer**

### Páginas Disponíveis

| Página | URL | Descrição |
|--------|-----|-----------|
| **Home** | `/` | Página inicial do CellSync |
| **Planos** | `/planos` | Página de assinatura (✅ Testada) |
| **Login** | `/login` | Acesso ao sistema |
| **Cadastro** | `/cadastro` | Criar nova conta |
| **Dashboard** | `/dashboard` | Painel administrativo (requer login) |

---

## 🧪 Testes Recomendados

### Teste 1: Visualizar Planos ✅ PRONTO

**Passo a passo:**
1. Acesse: https://3002-iutan8xhm9xqbp3744rrj-8518b105.manusvm.computer/planos
2. Verifique se os 3 planos aparecem:
   - ✅ Plano Básico - R$ 97,00/mês
   - ✅ Plano Profissional - R$ 197,00/mês
   - ✅ Plano Empresarial - R$ 397,00/mês

**Status:** ✅ Funcionando perfeitamente

---

### Teste 2: Checkout do Stripe ✅ PRONTO

**Passo a passo:**
1. Na página de planos, clique em **"Assinar Agora"** em qualquer plano
2. Você será redirecionado para o Stripe Checkout
3. Verifique se aparece:
   - Nome do produto correto
   - Valor correto em BRL
   - Formulário de pagamento completo

**Dados de teste do cartão:**
```
Número: 4242 4242 4242 4242
Validade: 12/34
CVV: 123
Nome: Seu Nome
Email: seu@email.com
```

**Status:** ✅ Funcionando perfeitamente

---

### Teste 3: Fluxo Completo de Assinatura

**Passo a passo:**

#### 3.1 Escolher Plano
1. Acesse `/planos`
2. Clique em **"Assinar Agora"** no Plano Profissional

#### 3.2 Preencher Checkout
1. **Email:** teste@cellsync.com.br
2. **Cartão:** 4242 4242 4242 4242
3. **Validade:** 12/34
4. **CVV:** 123
5. **Nome:** João Silva
6. **País:** Brazil
7. **CEP:** 01310-100
8. Clique em **"Subscribe"**

#### 3.3 Verificar Redirecionamento
- Após pagamento, você será redirecionado de volta ao CellSync
- Deverá aparecer página de sucesso ou formulário de cadastro

**Status:** 🔄 Pronto para testar

---

### Teste 4: Criar Conta no Sistema

**Passo a passo:**
1. Após completar assinatura, preencha:
   - **Email:** teste@cellsync.com.br
   - **Senha:** Senha@123
   - **Nome da Loja:** Loja Teste
   - **CNPJ:** 12.345.678/0001-90
   - **Responsável:** João Silva
2. Clique em **"Criar Conta"**

**Status:** 🔄 Pronto para testar

---

### Teste 5: Fazer Login

**Passo a passo:**
1. Acesse: `/login`
2. Use as credenciais criadas:
   - **Email:** teste@cellsync.com.br
   - **Senha:** Senha@123
3. Clique em **"Entrar"**
4. Verifique se redireciona para `/dashboard`

**Status:** 🔄 Pronto para testar

---

### Teste 6: Explorar Dashboard

**Passo a passo:**
1. Após login, explore as funcionalidades:
   - ✅ PDV (Ponto de Venda)
   - ✅ Estoque
   - ✅ Clientes
   - ✅ Produtos
   - ✅ Vendas
   - ✅ Relatórios
   - ✅ Ordens de Serviço
   - ✅ Financeiro

**Status:** 🔄 Pronto para testar

---

## 💳 Cartões de Teste do Stripe

### Cartões que Funcionam

| Número | Tipo | Resultado |
|--------|------|-----------|
| 4242 4242 4242 4242 | Visa | ✅ Sucesso |
| 5555 5555 5555 4444 | Mastercard | ✅ Sucesso |
| 3782 822463 10005 | American Express | ✅ Sucesso |

### Cartões que Falham (para testar erros)

| Número | Resultado |
|--------|-----------|
| 4000 0000 0000 0002 | ❌ Cartão recusado |
| 4000 0000 0000 9995 | ❌ Fundos insuficientes |

**Importante:** Use qualquer data futura para validade e qualquer CVV de 3 dígitos.

---

## 🔍 Verificar no Stripe

Após fazer um pagamento de teste, você pode verificar no Stripe:

1. **Pagamentos:** https://dashboard.stripe.com/test/payments
2. **Clientes:** https://dashboard.stripe.com/test/customers
3. **Assinaturas:** https://dashboard.stripe.com/test/subscriptions
4. **Webhooks:** https://dashboard.stripe.com/test/webhooks

---

## 📊 Status Atual do Sistema

### ✅ Funcionalidades Implementadas

- [x] Página inicial (Home)
- [x] Página de planos
- [x] Integração com Stripe
- [x] Checkout de assinatura
- [x] Webhook configurado
- [x] Banco de dados MySQL
- [x] 30 tabelas criadas
- [x] 3 planos populados
- [x] Servidor rodando

### 🔄 Funcionalidades para Testar

- [ ] Fluxo completo de assinatura
- [ ] Criação de conta após pagamento
- [ ] Login no sistema
- [ ] Dashboard e funcionalidades
- [ ] PDV
- [ ] Gestão de estoque
- [ ] Cadastro de produtos
- [ ] Ordens de serviço
- [ ] Relatórios

---

## 🚀 Como Começar a Testar AGORA

### Opção 1: Teste Rápido (5 minutos)

1. **Abra o link:** https://3002-iutan8xhm9xqbp3744rrj-8518b105.manusvm.computer/planos
2. **Clique em** "Assinar Agora" no Plano Profissional
3. **Preencha com cartão de teste:** 4242 4242 4242 4242
4. **Complete o processo**

### Opção 2: Teste Completo (15 minutos)

1. **Siga todos os testes** de 1 a 6 acima
2. **Explore o dashboard** completo
3. **Teste funcionalidades** de PDV, estoque, etc.

---

## 🆘 Problemas Comuns

### Problema: Página não carrega
**Solução:** Verifique se o servidor está rodando. O servidor deve estar ativo na porta 3002.

### Problema: Checkout não abre
**Solução:** Verifique se as chaves do Stripe estão configuradas corretamente no `.env`.

### Problema: Pagamento não processa
**Solução:** Use os cartões de teste fornecidos acima. Não use cartões reais em modo teste.

### Problema: Webhook não funciona
**Solução:** O webhook está configurado. Verifique os logs do servidor para ver se está recebendo eventos.

---

## 📝 Notas Importantes

### Modo Teste (Sandbox)
- ⚠️ Sistema está em **modo teste**
- ⚠️ Nenhum pagamento real será processado
- ⚠️ Use apenas cartões de teste do Stripe
- ✅ Todos os dados são de teste

### Dados de Teste
- Todos os dados criados são de teste
- Podem ser deletados a qualquer momento
- Não use informações reais

### Próximos Passos
- Após testes, o sistema pode ser publicado em produção
- Será necessário ativar modo Live no Stripe
- Webhook precisará ser atualizado com URL de produção

---

## 🎯 Checklist de Testes

Use este checklist para acompanhar seus testes:

- [ ] Acessei a página inicial
- [ ] Visualizei os planos
- [ ] Cliquei em "Assinar Agora"
- [ ] Fui redirecionado para Stripe
- [ ] Preenchi dados do cartão de teste
- [ ] Completei o pagamento
- [ ] Fui redirecionado de volta
- [ ] Criei uma conta
- [ ] Fiz login
- [ ] Acessei o dashboard
- [ ] Testei funcionalidades básicas
- [ ] Verifiquei pagamento no Stripe

---

## 📞 Suporte

Se encontrar algum problema durante os testes, me avise! Posso:
- Verificar logs do servidor
- Debugar erros
- Ajustar configurações
- Adicionar funcionalidades

---

**Sistema pronto para testes!** 🚀  
**Comece agora:** https://3002-iutan8xhm9xqbp3744rrj-8518b105.manusvm.computer/planos
