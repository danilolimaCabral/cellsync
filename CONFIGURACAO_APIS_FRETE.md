# 📮 Guia de Configuração - APIs de Frete

Este documento explica como configurar as APIs gratuitas de cálculo de frete e rastreamento de encomendas no sistema OKCells.

---

## 🎯 Visão Geral

O sistema OKCells integra duas APIs gratuitas para cálculo de frete:

1. **API dos Correios** (oficial) - PAC, SEDEX, rastreamento
2. **Melhor Envio** (agregador) - Correios, Jadlog, Azul Cargo, Loggi e outras

Ambas as APIs são **100% gratuitas** e não exigem pagamento para uso básico.

---

## 📦 1. API dos Correios (Oficial)

### Passo 1: Criar Conta no Meu Correios

1. Acesse: https://www.correios.com.br/
2. Clique em "Meu Correios" → "Cadastre-se"
3. Preencha seus dados e confirme o e-mail

### Passo 2: Obter Token de API

1. Faça login no Meu Correios
2. Acesse: https://www.correios.com.br/atendimento/developers
3. Clique em "Solicitar Acesso à API"
4. Aceite os termos de uso
5. Copie seu **Token de API** (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Passo 3: Configurar no Sistema

No painel de **Settings → Secrets** do Manus, adicione:

```
CORREIOS_API_KEY=seu_token_aqui
```

**Exemplo:**
```
CORREIOS_API_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Funcionalidades Disponíveis

✅ Cálculo de frete (PAC, SEDEX)  
✅ Consulta de prazo de entrega  
✅ Rastreamento de encomendas  
✅ Consulta de CEP  

---

## 🚚 2. Melhor Envio API

### Passo 1: Criar Conta no Melhor Envio

1. Acesse: https://melhorenvio.com.br/
2. Clique em "Criar conta grátis"
3. Preencha seus dados empresariais
4. Confirme o e-mail

### Passo 2: Criar Aplicação

1. Faça login no Melhor Envio
2. Acesse: https://melhorenvio.com.br/painel/gerenciar/tokens
3. Clique em "Criar novo token"
4. Dê um nome (ex: "OKCells")
5. Marque as permissões:
   - ✅ `shipping-calculate` (calcular frete)
   - ✅ `shipping-preview` (visualizar cotações)
   - ✅ `orders-read` (ler pedidos)
   - ✅ `tracking-read` (rastrear encomendas)
6. Clique em "Gerar token"
7. Copie o **Access Token** gerado

### Passo 3: Configurar no Sistema

No painel de **Settings → Secrets** do Manus, adicione:

```
MELHOR_ENVIO_ACCESS_TOKEN=seu_token_aqui
```

**Exemplo:**
```
MELHOR_ENVIO_ACCESS_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

### Funcionalidades Disponíveis

✅ Cotação de múltiplas transportadoras simultaneamente  
✅ Correios (PAC, SEDEX, PAC Mini)  
✅ Jadlog (Package, .COM)  
✅ Azul Cargo (AMANHÃ, ECOMMERCE)  
✅ Loggi  
✅ Rastreamento unificado  
✅ Webhooks para notificações automáticas  

---

## ⚙️ 3. Como Usar no Sistema

### Calculadora de Frete

1. Acesse: **Menu → Calculadora de Frete**
2. Preencha:
   - CEP de origem
   - CEP de destino
   - Peso (em gramas)
   - Dimensões (comprimento, largura, altura em cm)
3. Clique em **"Calcular Frete"**
4. O sistema mostrará:
   - Todas as opções disponíveis
   - Badge "Mais Barato" na opção mais econômica
   - Badge "Mais Rápido" na opção com menor prazo
   - Preço e prazo de cada transportadora

### Rastreamento de Envios

1. Acesse: **Menu → Rastreamento de Envios**
2. Digite o código de rastreamento (ex: `AA123456789BR`)
3. Clique em **"Rastrear"**
4. Veja o histórico completo de eventos:
   - Data e hora de cada movimentação
   - Status atual
   - Local de cada evento
   - Origem e destino

### Integração com Vendas

O sistema salva automaticamente:
- Histórico de todas as cotações realizadas
- Envios criados com código de rastreamento
- Eventos de rastreamento

---

## 🔍 4. Verificar Configuração

Para verificar se as APIs estão configuradas corretamente:

1. Acesse: **Calculadora de Frete**
2. No topo da página, veja o status:
   - ✅ **Correios: Configurado** - API dos Correios OK
   - ✅ **Melhor Envio: Configurado** - Melhor Envio OK
   - ❌ **Não configurado** - Falta configurar

Se aparecer "Não configurado", verifique:
- Se adicionou a variável de ambiente correta
- Se o token está completo (sem espaços)
- Se reiniciou o servidor após adicionar

---

## 💡 5. Dicas Importantes

### Limites das APIs Gratuitas

**Correios:**
- ✅ Uso ilimitado para cálculo de frete
- ✅ Uso ilimitado para rastreamento
- ⚠️ Rate limit: ~100 requisições/minuto

**Melhor Envio:**
- ✅ Cotações ilimitadas
- ✅ Rastreamento ilimitado
- ⚠️ Para gerar etiquetas oficiais, precisa adicionar créditos
- ⚠️ Rate limit: ~60 requisições/minuto

### Validações Automáticas

O sistema valida automaticamente:
- ✅ CEPs devem ter 8 dígitos
- ✅ Peso mínimo: 1 grama
- ✅ Dimensões mínimas: 1 cm
- ✅ Limites dos Correios:
  - Peso máximo: 30kg
  - Comprimento: 16-105 cm
  - Largura: 11-105 cm
  - Altura: 2-105 cm
  - Soma (C+L+A): máximo 200 cm

### Transportadoras Disponíveis via Melhor Envio

- **Correios**: PAC, SEDEX, PAC Mini, SEDEX 10, SEDEX 12
- **Jadlog**: Package, .COM, Corporate
- **Azul Cargo**: AMANHÃ, ECOMMERCE
- **Loggi**: Loggi
- **ViaBrasil**: Rodoviário, Aéreo

---

## 🆘 6. Solução de Problemas

### "Nenhuma cotação disponível"

**Causa:** Nenhuma API configurada  
**Solução:** Configure pelo menos uma das APIs (Correios ou Melhor Envio)

### "CEPs inválidos"

**Causa:** CEP com formato incorreto  
**Solução:** Use apenas números, 8 dígitos (ex: `01310100`)

### "Dimensões inválidas"

**Causa:** Pacote fora dos limites dos Correios  
**Solução:** Verifique peso e dimensões. Máximo 30kg, soma das dimensões até 200cm

### "Código de rastreamento não encontrado"

**Causa:** Código ainda não foi postado ou está incorreto  
**Solução:** 
- Aguarde algumas horas após a postagem
- Verifique se o código está correto
- Códigos dos Correios têm formato: `AA123456789BR`

### Token inválido

**Causa:** Token expirado ou incorreto  
**Solução:**
1. Gere um novo token no site da API
2. Atualize em Settings → Secrets
3. Reinicie o servidor

---

## 📊 7. Dados Salvos no Banco

O sistema salva automaticamente:

### Tabela `shipping_quotes`
- Todas as cotações realizadas
- Preço, prazo, transportadora
- CEPs de origem e destino
- Dimensões do pacote
- Fonte (Correios ou Melhor Envio)

### Tabela `shipments`
- Envios criados
- Código de rastreamento
- Status atual
- Dados do remetente e destinatário
- Custo do frete
- Previsão de entrega

### Tabela `shipment_events`
- Histórico de rastreamento
- Data e hora de cada evento
- Local, status e descrição

---

## 🚀 8. Próximos Passos

Funcionalidades futuras planejadas:

- [ ] Geração automática de etiquetas via Melhor Envio
- [ ] Webhooks para notificações de mudança de status
- [ ] Integração direta com vendas (calcular frete ao criar venda)
- [ ] Dashboard de análise de frete
- [ ] Comparativo de custos por transportadora
- [ ] Alertas de atraso na entrega

---

## 📞 Suporte

Em caso de dúvidas sobre as APIs:

**Correios:**
- Site: https://www.correios.com.br/atendimento/developers
- Suporte: https://www.correios.com.br/falecomoscorreios

**Melhor Envio:**
- Documentação: https://docs.melhorenvio.com.br
- Suporte: https://melhorenvio.com.br/contato
- Discord: https://discord.gg/melhorenvio

---

**Última atualização:** Dezembro 2024  
**Versão do Sistema:** 1.0.0
