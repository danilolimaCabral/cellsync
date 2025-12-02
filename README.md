# 📱 OKCells - Sistema de Gestão para Lojas de Celular

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js)

Sistema completo de gestão para **lojas de celular**, **assistências técnicas** e **importadoras**. Desenvolvido com React 19, TypeScript, tRPC, Tailwind CSS 4 e MySQL/TiDB.

---

## 🚀 Funcionalidades Principais

### 💰 PDV (Ponto de Venda)
- Interface moderna e responsiva
- Busca rápida de produtos
- Cálculo automático de troco
- Múltiplas formas de pagamento
- Impressão de comprovantes

### 📦 Gestão de Estoque
- Controle completo de produtos
- Movimentações (entrada/saída)
- Alertas de estoque baixo
- Relatórios avançados
- Importação via XML (NF-e)
- Importação via CSV/Planilha
- **Assistente IA** para importação inteligente

### 🔧 Ordem de Serviço (OS)
- Cadastro de serviços técnicos
- Acompanhamento de status
- Controle de peças utilizadas
- Histórico completo
- **Diagnóstico com IA**

### 👥 CRM (Gestão de Clientes)
- Cadastro completo de clientes
- Histórico de compras
- Análise de comportamento
- Segmentação de clientes

### 💵 Financeiro
- Contas a pagar e receber
- Fluxo de caixa
- Relatórios financeiros
- Comissões de vendedores
- Integração com Stripe

### 📮 Frete e Rastreamento
- **Calculadora de Frete** - Compara preços de múltiplas transportadoras
- Integração com **API dos Correios** (PAC, SEDEX)
- Integração com **Melhor Envio** (Jadlog, Azul Cargo, Loggi)
- **Rastreamento em tempo real**
- Geração de etiquetas de envio

### 📊 Relatórios e Analytics
- Dashboard com métricas em tempo real
- Relatórios de vendas
- Análise de estoque
- Performance de vendedores
- Gráficos interativos

### 🤖 Inteligência Artificial
- Chatbot para atendimento
- Análise de imagens de produtos
- Diagnóstico automático de problemas
- Importação inteligente de dados
- Análise de tickets de suporte

### 🔐 Multi-Tenant
- Sistema preparado para SaaS
- Isolamento total de dados
- Planos e assinaturas
- Subdomínios personalizados
- Integração com Stripe

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **tRPC** - Type-safe API
- **Wouter** - Roteamento
- **Shadcn/ui** - Componentes
- **Framer Motion** - Animações

### Backend
- **Node.js 22** - Runtime
- **Express 4** - Servidor HTTP
- **tRPC 11** - API type-safe
- **Drizzle ORM** - Database ORM
- **MySQL/TiDB** - Banco de dados
- **JWT** - Autenticação

### Integrações
- **Stripe** - Pagamentos
- **API dos Correios** - Frete e rastreamento
- **Melhor Envio** - Múltiplas transportadoras
- **OpenAI** - Inteligência Artificial
- **S3** - Armazenamento de arquivos

---

## 📋 Pré-requisitos

- **Node.js** 22.x ou superior
- **pnpm** 9.x ou superior
- **MySQL** 8.x ou **TiDB** (compatível com MySQL)
- Conta no **Manus** (para hospedagem e deploy)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/danilolimaCabral/okcells-system.git
cd okcells-system
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# JWT
JWT_SECRET=seu_secret_jwt_aqui

# Manus OAuth (opcional, se não usar Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=seu_app_id

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# APIs de Frete (opcional)
CORREIOS_API_KEY=seu_token_correios
MELHOR_ENVIO_ACCESS_TOKEN=seu_token_melhor_envio

# Manus Built-in APIs (opcional)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=seu_token_manus
```

### 4. Execute as migrações do banco

```bash
pnpm db:push
```

### 5. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

O sistema estará disponível em: `http://localhost:3000`

---

## 📦 Build para Produção

```bash
pnpm build
pnpm start
```

---

## 🗄️ Estrutura do Banco de Dados

O sistema possui 32 tabelas principais:

- **users** - Usuários do sistema
- **tenants** - Lojas/empresas (multi-tenant)
- **products** - Produtos
- **customers** - Clientes
- **sales** - Vendas
- **saleItems** - Itens das vendas
- **stockItems** - Itens de estoque
- **stockMovements** - Movimentações de estoque
- **serviceOrders** - Ordens de serviço
- **invoices** - Notas fiscais
- **accountsPayable** - Contas a pagar
- **accountsReceivable** - Contas a receber
- **commissions** - Comissões
- **shipments** - Envios
- **shippingQuotes** - Cotações de frete
- **chatbot_conversations** - Conversas do chatbot
- **support_tickets** - Tickets de suporte
- E mais...

---

## 📮 Configuração das APIs de Frete

### API dos Correios

1. Crie uma conta em: https://www.correios.com.br/
2. Acesse: https://www.correios.com.br/atendimento/developers
3. Solicite acesso à API e copie seu token
4. Adicione ao `.env`: `CORREIOS_API_KEY=seu_token`

### Melhor Envio

1. Crie uma conta em: https://melhorenvio.com.br/
2. Acesse: https://melhorenvio.com.br/painel/gerenciar/tokens
3. Crie um novo token com permissões de cálculo e rastreamento
4. Adicione ao `.env`: `MELHOR_ENVIO_ACCESS_TOKEN=seu_token`

**Documentação completa:** Veja o arquivo `CONFIGURACAO_APIS_FRETE.md`

---

## 🎨 Capturas de Tela

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### PDV
![PDV](docs/screenshots/pdv.png)

### Calculadora de Frete
![Calculadora de Frete](docs/screenshots/calculadora-frete.png)

### Rastreamento
![Rastreamento](docs/screenshots/rastreamento.png)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Danilo Lima Cabral**

- GitHub: [@danilolimaCabral](https://github.com/danilolimaCabral)
- Email: contato@okcells.com.br

---

## 🙏 Agradecimentos

- [Manus](https://manus.im) - Plataforma de desenvolvimento e hospedagem
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Lucide Icons](https://lucide.dev/) - Ícones
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [tRPC](https://trpc.io/) - Type-safe APIs

---

## 📞 Suporte

Para dúvidas ou suporte:

- 📧 Email: suporte@okcells.com.br
- 💬 Discord: [OKCells Community](https://discord.gg/okcells)
- 📖 Documentação: [docs.okcells.com.br](https://docs.okcells.com.br)

---

## 🗺️ Roadmap

- [ ] App mobile (React Native)
- [ ] Integração com marketplaces (Mercado Livre, OLX)
- [ ] Sistema de fidelidade
- [ ] Programa de afiliados
- [ ] API pública para integrações
- [ ] Webhooks para eventos
- [ ] Dashboard de BI avançado
- [ ] Integração com ERP

---

**Desenvolvido com ❤️ para lojas de celular do Brasil**
