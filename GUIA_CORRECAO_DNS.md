# 🚨 Guia de Correção do DNS para www.cellsync.com.br

**Diagnóstico:** O domínio `www.cellsync.com.br` não está acessível via HTTPS porque o certificado SSL não foi emitido. Isso ocorre porque o registro CNAME no seu provedor de domínio está configurado incorretamente.

**O Problema:** O Railway detectou que o CNAME aponta para `cellsync.com.br` ao invés do valor correto.

---

## ✅ Como Corrigir (Passo a Passo)

### 1. Acesse seu Provedor de Domínio

Acesse o painel de controle do serviço onde você registrou o domínio `cellsync.com.br` (ex: GoDaddy, HostGator, Registro.br, etc.).

### 2. Encontre a Zona de DNS

Procure pela seção de "Gerenciamento de DNS", "Zona de DNS" ou "Configurações Avançadas de DNS".

### 3. Edite o Registro CNAME

Você precisa encontrar e editar o registro CNAME para `www`. A configuração atual está incorreta.

**Altere de:**

| Tipo | Nome (Host) | Valor (Aponta para) |
|:---|:---|:---|
| CNAME | `www` | `cellsync.com.br` |  ← **INCORRETO**

**Para:**

| Tipo | Nome (Host) | Valor (Aponta para) |
|:---|:---|:---|
| CNAME | `www` | `wyakit8x.up.railway.app` | ← **CORRETO**

**Observações:**
- **Nome/Host:** Use `www` (não `@` ou o domínio completo).
- **Valor/Aponta para:** Use exatamente `wyakit8x.up.railway.app`.
- **TTL (Time to Live):** Pode deixar o valor padrão (normalmente 1 hora ou 3600 segundos).

### 4. Salve as Alterações

Salve as alterações e aguarde a propagação do DNS. Isso pode levar de 15 minutos a algumas horas.

---

## 📊 Como Verificar se Funcionou

1.  **Acesse o Railway:**
    *   Vá para a aba **Settings > Networking** do seu serviço.
    *   O aviso "Incorrect DNS setup" deve desaparecer e ser substituído por um ícone verde de "OK".

2.  **Acesse o Site:**
    *   Abra `https://www.cellsync.com.br` em uma aba anônima do seu navegador.
    *   O site deve carregar com um cadeado de segurança (SSL ativo).

---

## 📞 Precisa de Ajuda?

Se você não souber como editar o DNS, entre em contato com o suporte do seu provedor de domínio e envie as seguintes informações:

> "Olá, preciso de ajuda para configurar um registro CNAME para o meu domínio `cellsync.com.br`. As informações são:
> 
> - **Tipo:** CNAME
> - **Nome/Host:** www
> - **Valor/Aponta para:** wyakit8x.up.railway.app
> 
> Por favor, podem me ajudar a configurar?"

---

Assim que você corrigir o DNS, o Railway irá emitir o certificado SSL automaticamente e o site ficará 100% funcional!
