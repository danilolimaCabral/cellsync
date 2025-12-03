# 🌐 Configuração DNS para www.cellsync.com.br

**Data:** 03 de Dezembro de 2025  
**Status:** ⚠️ **Aguardando Configuração DNS**

---

## ✅ Domínio Adicionado no Railway

O domínio **www.cellsync.com.br** foi adicionado com sucesso no Railway!

Agora você precisa configurar o DNS no seu provedor de domínio para que o domínio aponte para o Railway.

---

## 📋 Informações para Configuração DNS

Acesse o painel de controle do seu provedor de domínio (onde você registrou cellsync.com.br) e adicione o seguinte registro DNS:

| Campo | Valor | Descrição |
|-------|-------|-----------|
| **Tipo** | `CNAME` | Tipo de registro DNS |
| **Nome (Host)** | `www` | Subdomínio (para www.cellsync.com.br) |
| **Valor (Aponta para)** | `wyakit8x.up.railway.app` | Endereço do Railway |
| **TTL** | `3600` ou `Automático` | Tempo de vida do cache |

---

## 🔧 Passo a Passo no Provedor de Domínio

### 1. Acesse o Painel DNS

Faça login no painel do seu provedor de domínio (ex: Registro.br, GoDaddy, HostGator, Hostinger, etc.).

### 2. Encontre a Seção de DNS

Procure por uma das seguintes opções:
- "Gerenciamento de DNS"
- "Editor de Zona DNS"
- "DNS Settings"
- "Manage DNS"

### 3. Adicione o Registro CNAME

Clique em "Adicionar Registro" ou "Add Record" e preencha:

```
Tipo: CNAME
Nome: www
Valor: wyakit8x.up.railway.app
TTL: 3600 (ou deixe automático)
```

### 4. Salve as Alterações

Clique em "Salvar" ou "Save" para aplicar as mudanças.

---

## ⏱️ Tempo de Propagação

⚠️ **IMPORTANTE:** As mudanças de DNS podem levar de alguns minutos até **72 horas** para propagar completamente pela internet.

**Normalmente:**
- ✅ 15 minutos a 1 hora: Propagação inicial
- ✅ 24 horas: Propagação completa na maioria dos servidores
- ✅ 72 horas: Propagação global garantida

---

## 🔍 Como Verificar se o DNS Está Configurado

### Opção 1: Usar DNS Checker Online

Acesse: [https://dnschecker.org/](https://dnschecker.org/)

1. Digite: `www.cellsync.com.br`
2. Selecione tipo: `CNAME`
3. Clique em "Search"
4. Verifique se o resultado mostra: `wyakit8x.up.railway.app`

### Opção 2: Usar Terminal (Linux/Mac)

```bash
dig www.cellsync.com.br CNAME
```

### Opção 3: Usar CMD (Windows)

```cmd
nslookup -type=CNAME www.cellsync.com.br
```

---

## 🔐 Certificado SSL (HTTPS)

✅ **Automático!** Assim que o DNS estiver configurado corretamente, o Railway irá:

1. Detectar automaticamente a configuração DNS
2. Emitir um certificado SSL gratuito via Let's Encrypt
3. Ativar HTTPS para seu domínio

**Você não precisa fazer nada!** O processo é 100% automático.

---

## ✅ Status Atual no Railway

- 🟢 **Domínio adicionado:** www.cellsync.com.br
- 🟡 **DNS configurado:** ⚠️ **Aguardando** (você precisa fazer isso no provedor)
- 🔴 **SSL ativo:** Não (será ativado automaticamente após DNS)

---

## 📞 Próximos Passos

1. ✅ **Configure o DNS** no seu provedor seguindo as instruções acima
2. ⏱️ **Aguarde a propagação** (15 minutos a 72 horas)
3. 🔍 **Verifique** se o DNS está apontando corretamente
4. 🔐 **Aguarde o SSL** ser emitido automaticamente pelo Railway
5. 🎉 **Acesse** https://www.cellsync.com.br e comemore!

---

## 🆘 Problemas Comuns

### "O domínio não está acessível após 24 horas"

**Solução:** Verifique se o registro CNAME foi criado corretamente:
- Nome deve ser exatamente `www`
- Valor deve ser exatamente `wyakit8x.up.railway.app`
- Tipo deve ser `CNAME` (não A, AAAA ou TXT)

### "Erro de certificado SSL"

**Solução:** Aguarde mais tempo. O SSL pode levar até 24 horas para ser emitido após o DNS estar correto.

### "Não encontro onde configurar DNS no meu provedor"

**Solução:** Entre em contato com o suporte do seu provedor de domínio e peça ajuda para adicionar um registro CNAME.

---

**🎉 Boa sorte com a configuração! Em breve seu CellSync estará acessível em www.cellsync.com.br!**
