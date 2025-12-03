# 🔴 DIAGNÓSTICO: Problema na API de Planos

## ❌ PROBLEMA IDENTIFICADO

A API `/api/trpc/plans.list` está retornando **erro 500** (Internal Server Error) mesmo após adicionar parâmetros SSL na DATABASE_URL.

### Evidências

**HTTP Logs mostram:**
- ✅ GET /planos → 200 OK (página carrega)
- ✅ GET /assets/... → 200 OK (arquivos estáticos)
- ❌ GET /api/trpc/plans.list → **500 ERROR** (busca de planos falha)

**Deploy Logs mostram:**
- ✅ Servidor rodando em http://localhost:3001/
- ✅ Stripe webhook configurado
- ✅ Container iniciado com sucesso
- ⚠️ OAUTH_SERVER_URL não configurado (não crítico)

### DATABASE_URL Atual

```
mysql://root:AwBxYmxtNKHVHMelMsFQXoSRqNrNOuXl@mysql.railway.internal:3306/railway?ssl={"rejectUnauthorized":true}
```

---

## 🔍 POSSÍVEIS CAUSAS

### 1. Problema de Conectividade Interna
O Railway pode estar tendo problemas para conectar via `mysql.railway.internal`.

**Solução:** Usar URL pública do MySQL

### 2. Formato Incorreto dos Parâmetros SSL
O formato JSON nos parâmetros SSL pode não estar sendo interpretado corretamente.

**Solução:** Tentar formato alternativo: `?ssl=true` ou `?sslmode=require`

### 3. Problema no Código da API
O código da API `plans.list` pode ter um bug ou estar esperando um formato diferente de dados.

**Solução:** Investigar o código fonte da API

### 4. Drizzle ORM não está configurado corretamente
O ORM pode não estar conseguindo se conectar ao MySQL.

**Solução:** Verificar configuração do Drizzle

---

## 🔧 PRÓXIMAS AÇÕES

### Opção A: Usar URL Pública do MySQL ⭐ (RECOMENDADO)
```
mysql://root:AwBxYmxtNKHVHMelMsFQXoSRqNrNOuXl@autorack.proxy.rlwy.net:PORT/railway
```

### Opção B: Simplificar Parâmetros SSL
```
mysql://root:AwBxYmxtNKHVHMelMsFQXoSRqNrNOuXl@mysql.railway.internal:3306/railway?ssl=true
```

### Opção C: Investigar Código da API
- Verificar arquivo `server/api/trpc/plans.ts` ou similar
- Adicionar logs de debug
- Testar conexão diretamente

### Opção D: Usar PostgreSQL em vez de MySQL
O Railway tem melhor suporte para PostgreSQL.

---

## 📊 STATUS ATUAL

✅ **Funcionando:**
- Site no ar: https://cellsync-production.up.railway.app
- Servidor rodando
- Banco de dados MySQL criado
- 30 tabelas criadas
- 3 planos populados no banco
- Stripe integrado

❌ **Não Funcionando:**
- API de busca de planos (erro 500)
- Planos não aparecem na interface

---

## 💡 RECOMENDAÇÃO

**Tentar Opção A primeiro** (usar URL pública do MySQL), pois é a solução mais comum para problemas de conectividade no Railway.

Se não funcionar, partir para Opção C (investigar código da API) para entender o erro exato que está ocorrendo.
