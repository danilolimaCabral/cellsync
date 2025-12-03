# 🔐 Como Adicionar Cabeçalhos de Segurança ao CellSync

Os cabeçalhos de segurança HTTP são essenciais para proteger seu site contra ataques comuns. Este guia mostra como adicionar os principais cabeçalhos de segurança ao CellSync.

---

## 📋 Cabeçalhos Recomendados

| Cabeçalho | Função | Prioridade |
|:---|:---|:---|
| **Strict-Transport-Security (HSTS)** | Força o uso de HTTPS | 🔴 Alta |
| **X-Content-Type-Options** | Previne ataques de MIME sniffing | 🟠 Média |
| **X-Frame-Options** | Protege contra clickjacking | 🟠 Média |
| **X-XSS-Protection** | Ativa proteção contra XSS no navegador | 🟡 Baixa |
| **Content-Security-Policy (CSP)** | Controla recursos carregados | 🟡 Baixa |

---

## 🛠️ Implementação no CellSync

### Passo 1: Editar o arquivo do servidor

Abra o arquivo `/home/ubuntu/cellsync/server/_core/index.ts` e adicione os cabeçalhos de segurança logo após a configuração do body parser.

### Passo 2: Adicionar o middleware de segurança

Adicione o seguinte código após a linha 44 (`app.use(cookieParser());`):

```typescript
// Security headers
app.use((req, res, next) => {
  // HSTS: Force HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
  
  next();
});
```

### Passo 3: Commit e Push

Após adicionar o código, faça o commit e push para o GitHub:

```bash
cd /home/ubuntu/cellsync
git add server/_core/index.ts
git commit -m "feat: adicionar cabeçalhos de segurança HTTP"
git push origin main
```

O Railway vai detectar a mudança e fazer o deploy automaticamente.

---

## ✅ Como Verificar

Após o deploy, use uma ferramenta online para verificar os cabeçalhos:

1.  **Acesse:** [https://securityheaders.com/](https://securityheaders.com/)
2.  **Digite:** `https://www.cellsync.com.br`
3.  **Clique em:** "Scan"

**Resultado Esperado:** Uma nota **"A"** ou superior.

---

## 📚 Referências

*   [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
*   [MDN Web Docs - HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)

---

Com esses cabeçalhos implementados, seu CellSync estará muito mais seguro contra ataques comuns da web!
