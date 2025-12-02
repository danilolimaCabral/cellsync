# Pesquisa: APIs dos Correios e Transportadoras Gratuitas

## 📮 APIs dos Correios (Oficiais)

### Informações Gerais
- **Portal**: https://www.correios.com.br/atendimento/developers
- **Plataforma**: Correios Web Service (CWS)
- **Acesso**: Requer cadastro no "Meu Correios" (gratuito)
- **Tipos de API**: Públicas (gratuitas) e Privadas (requerem contrato)

### APIs Disponíveis (Identificadas)

#### 1. API de Preço (Cálculo de Frete)
- **Função**: Calcular automaticamente o valor do frete
- **Serviços**: PAC, SEDEX e outros serviços postais
- **Uso**: Integração com e-commerce e sistemas logísticos
- **Categoria**: Negócios/Postagem
- **Documentação**: Disponível no CWS após login

#### 2. API de Prazo (Estimativa de Entrega)
- **Função**: Consultar prazo estimado de entrega
- **Tempo Real**: Cálculo automatizado e em tempo real
- **Serviços**: Diferentes modalidades de envio
- **Categoria**: Negócios/Pré-postagem
- **Documentação**: Disponível no CWS após login

#### 3. API de CEP (Consulta de Endereços)
- **Função**: Consultar endereços completos a partir do CEP
- **Dados**: Logradouro, bairro, cidade, UF
- **Precisão**: Informações oficiais e atualizadas
- **Confiabilidade**: Dados em todo o Brasil
- **Categoria**: Negócios/Atendimento
- **Documentação**: Disponível no CWS após login

#### 4. API Rastro (Rastreamento)
- **Função**: Rastreamento de encomendas
- **Segurança**: Nova implementação com medidas de cibersegurança
- **Restrição**: Consulta restrita aos objetos vinculados ao contrato do remetente
- **Acesso**: Requer autenticação
- **Categoria**: Negócios/Atendimento
- **Nota**: API antiga (Link&Track) foi descontinuada

### Autenticação e Chaves de Acesso
- **Sistema**: Chaves de API geradas no CWS
- **Validade**: Até 180 dias
- **Renovação**: Não é possível renovar, deve criar nova chave
- **Subdelegação**: Possível delegar acesso a terceiros
- **Aviso**: E-mail de aviso antes da expiração

### Limitações e Requisitos
- **Validações**: A partir de 15/09/2025, chave da NF-e será validada
- **Declaração de Conteúdo**: Obrigatória mesmo com NF-e informada
- **Conteúdo**: Descrição clara com no mínimo 5 caracteres
- **Itens Restritos**: Deve informar adicional 095 para transporte aéreo

### Como Acessar
1. Criar conta no "Meu Correios" (gratuito)
2. Fazer login no CWS
3. Acessar "Gestão de acesso a API's"
4. Gerar chave de API (apikey)
5. Consultar documentação das APIs autorizadas

### Custos
- **APIs Públicas**: Gratuitas (requer apenas login Meu Correios)
- **APIs Privadas**: Requerem contrato com os Correios
- **Sem Taxas**: Não há cobrança de mensalidade para uso das APIs públicas

---

## 📦 Melhor Envio API (Alternativa Gratuita)

### Informações Gerais
- **Site**: https://melhorenvio.com.br
- **Documentação**: https://docs.melhorenvio.com.br
- **Tipo**: API pública e gratuita
- **Custo**: Sem taxas ou mensalidades

### Funcionalidades
- **Cotação de Frete**: Múltiplas transportadoras simultaneamente
- **Transportadoras**: Correios, Jadlog, Azul Cargo, Loggi, e outras
- **Comparação**: Preços e prazos lado a lado
- **Geração de Etiquetas**: Etiquetas oficiais das transportadoras
- **Rastreamento**: Unificado para todas as transportadoras
- **Webhook**: Notificações de mudança de status

### Vantagens
- Integração única para múltiplas transportadoras
- Comparação automática de preços
- Sem necessidade de contrato com cada transportadora
- Dashboard para gerenciamento
- Suporte técnico

### Como Integrar
1. Criar conta no Melhor Envio (gratuito)
2. Obter token de API no painel
3. Consultar documentação da API
4. Implementar endpoints de cotação e etiquetas
5. Configurar webhooks para rastreamento

---

## 🚚 Outras APIs Gratuitas Identificadas

### 1. Brasil API
- **Rastreamento Correios**: Endpoint público
- **URL**: https://brasilapi.com.br
- **Status**: Discussão sobre implementação de cálculo de frete

### 2. CEP Certo
- **Função**: Cálculo de frete dos Correios
- **Site**: https://www.cepcerto.com
- **Recursos**: PAC e SEDEX
- **Integração**: Simples e rápida

### 3. Seu Rastreio
- **Função**: Rastreamento de encomendas
- **Site**: https://seurastreio.com.br
- **API**: Gratuita para consultas
- **Atualização**: Instantânea

---

## 📋 Recomendações para Implementação

### Estratégia Sugerida
1. **Implementar API dos Correios** (oficial e gratuita)
   - Cálculo de frete (PAC, SEDEX)
   - Consulta de prazo
   - Rastreamento básico
   
2. **Integrar Melhor Envio** (comparação e múltiplas transportadoras)
   - Cotação de múltiplas transportadoras
   - Geração de etiquetas oficiais
   - Rastreamento unificado

3. **Fallback com Brasil API** (backup)
   - Rastreamento alternativo
   - Consulta de CEP

### Funcionalidades a Implementar
- [ ] Cadastro automático no Meu Correios (orientar usuário)
- [ ] Armazenamento seguro de API keys
- [ ] Cálculo de frete com múltiplas opções
- [ ] Comparação de preços e prazos
- [ ] Seleção automática da melhor opção
- [ ] Geração de etiquetas com código de rastreamento real
- [ ] Rastreamento automático de envios
- [ ] Notificações de mudança de status
- [ ] Histórico de cotações e envios

### Campos Necessários no Formulário
- Peso do pacote (kg)
- Dimensões (altura, largura, comprimento em cm)
- CEP origem (pré-preenchido com dados da loja)
- CEP destino
- Valor declarado (para seguro)
- Tipo de serviço (PAC, SEDEX, etc)

---

## ⚠️ Observações Importantes

1. **API dos Correios**: Requer cadastro e geração de chave, mas é gratuita
2. **Melhor Envio**: Totalmente gratuito, sem necessidade de contrato
3. **Validade das Chaves**: Correios tem validade de 180 dias
4. **Segurança**: Nunca expor chaves de API em código público
5. **Testes**: Ambas as APIs possuem ambiente de teste (sandbox)
6. **Documentação**: Completa e atualizada em ambas as plataformas

---

**Fontes:**
- https://www.correios.com.br/atendimento/developers
- https://docs.melhorenvio.com.br
- https://brasilapi.com.br
- https://www.cepcerto.com
- https://seurastreio.com.br


---

## 🔐 Autenticação Melhor Envio - Detalhes Técnicos

### Processo de Autenticação
- **Padrão**: OAuth2
- **Tipo de Token**: Bearer Token (JWT)
- **Validade**: 30 dias
- **Renovação**: Através de refresh token

### Passos para Integração

#### 1. Criar Aplicativo no Painel Melhor Envio
- Acessar painel do Melhor Envio
- Criar novo aplicativo
- Preencher todos os campos obrigatórios
- **URL de Callback**: Deve ser um endereço válido na aplicação (importante!)

#### 2. Fluxo de Autorização OAuth2
1. Usuário autoriza o aplicativo
2. Melhor Envio redireciona para URL de callback
3. Aplicação recebe código de autorização
4. Aplicação troca código por Bearer Token
5. Token é usado nas requisições à API

#### 3. Gerenciamento de Tokens
- **Armazenamento**: Backend deve armazenar tokens de forma segura
- **Renovação**: Implementar refresh token antes da expiração
- **Segurança**: Usuários finais não devem ter acesso aos tokens
- **Transparência**: Plataforma gerencia tokens automaticamente

### Observações Importantes
- Um único aplicativo serve toda a base de usuários
- Informações do aplicativo devem ser mantidas em segredo
- Tokens devem ser renovados automaticamente antes de expirar
- Usuários apenas autorizam, não gerenciam tokens

---

**Fonte**: https://docs.melhorenvio.com.br/docs/autenticacao
