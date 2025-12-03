# 📱 CellSync Mobile - Documentação Completa

## Sistema de Gestão para Lojas de Celular - Versão Mobile

**Versão:** 1.0  
**Data:** 02 de Dezembro de 2025  
**Plataformas:** iOS e Android  
**Tecnologia:** React Native + Expo

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do App](#arquitetura-do-app)
3. [Funcionalidades](#funcionalidades)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estrutura de Pastas](#estrutura-de-pastas)
6. [Telas e Fluxos](#telas-e-fluxos)
7. [Integração com API](#integração-com-api)
8. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
9. [Estimativa de Custo](#estimativa-de-custo)
10. [Roadmap](#roadmap)

---

## 🎯 Visão Geral

O **CellSync Mobile** é a versão mobile do sistema de gestão CellSync, desenvolvida para permitir que vendedores, técnicos e gerentes acessem as principais funcionalidades do sistema em qualquer lugar, diretamente de seus smartphones.

### Objetivos do App:

- ✅ Permitir vendas rápidas via PDV mobile
- ✅ Consultar estoque em tempo real
- ✅ Gerenciar ordens de serviço em campo
- ✅ Acessar informações de clientes
- ✅ Visualizar dashboard e métricas
- ✅ Receber notificações em tempo real
- ✅ Scanner de código de barras e IMEI

### Público-Alvo:

- **Vendedores:** PDV mobile para vendas em qualquer lugar
- **Técnicos:** Gestão de OS e consulta de peças
- **Gerentes:** Dashboard e relatórios em tempo real
- **Proprietários:** Visão geral do negócio

---

## 🏗️ Arquitetura do App

### Arquitetura de Alto Nível

```
┌─────────────────────────────────────────┐
│         CellSync Mobile App             │
│  (React Native + Expo + TypeScript)     │
└─────────────────────────────────────────┘
                    │
                    │ tRPC Client
                    │ (Type-safe API)
                    ▼
┌─────────────────────────────────────────┐
│       CellSync Backend API              │
│    (Express + tRPC + MySQL/TiDB)        │
└─────────────────────────────────────────┘
```

### Camadas da Aplicação

**1. Presentation Layer (UI)**
- Componentes React Native
- Navegação (React Navigation)
- Temas e estilos (React Native Paper)
- Gerenciamento de estado local

**2. Business Logic Layer**
- Hooks customizados
- Validações de formulário
- Lógica de negócio
- Formatação de dados

**3. Data Layer**
- Cliente tRPC
- Cache (React Query)
- Armazenamento local (AsyncStorage)
- Sincronização offline

**4. Integration Layer**
- API do CellSync (tRPC)
- Scanner de código de barras
- Câmera
- Notificações push

---

## ⚡ Funcionalidades

### 1. Autenticação 🔐

**Descrição:** Sistema de login seguro com credenciais do CellSync

**Funcionalidades:**
- Login com email e senha
- Manter sessão ativa (Remember Me)
- Logout
- Recuperação de senha (futuro)
- Biometria (Touch ID / Face ID) - futuro

**Telas:**
- `LoginScreen`: Tela de login
- `SplashScreen`: Tela de carregamento inicial

---

### 2. PDV Mobile 💰

**Descrição:** Ponto de venda simplificado para vendas rápidas em qualquer lugar

**Funcionalidades:**
- Busca de produtos por nome, código ou IMEI
- Scanner de código de barras integrado
- Carrinho de compras
- Seleção de cliente
- Múltiplas formas de pagamento
- Cálculo de desconto
- Finalização de venda
- Geração de recibo (compartilhar via WhatsApp/Email)
- Histórico de vendas do dia

**Telas:**
- `PDVScreen`: Tela principal do PDV
- `ProductSearchScreen`: Busca de produtos
- `CartScreen`: Carrinho de compras
- `CheckoutScreen`: Finalização da venda
- `ReceiptScreen`: Visualização do recibo

**Fluxo:**
```
PDV → Buscar Produto → Adicionar ao Carrinho → Selecionar Cliente
→ Escolher Pagamento → Finalizar Venda → Gerar Recibo
```

---

### 3. Estoque 📦

**Descrição:** Consulta e gestão de estoque em tempo real

**Funcionalidades:**
- Listar produtos em estoque
- Busca avançada (nome, IMEI, categoria)
- Scanner de IMEI para consulta rápida
- Visualizar detalhes do produto
- Ver histórico de movimentações
- Alertas de estoque baixo
- Filtros por categoria e marca

**Telas:**
- `StockScreen`: Lista de produtos
- `ProductDetailScreen`: Detalhes do produto
- `StockMovementsScreen`: Histórico de movimentações
- `ScannerScreen`: Scanner de IMEI/código de barras

---

### 4. Ordem de Serviço 🔧

**Descrição:** Gestão completa de ordens de serviço em campo

**Funcionalidades:**
- Listar OS (abertas, em andamento, concluídas)
- Criar nova OS
- Atualizar status da OS
- Adicionar observações e fotos
- Registrar peças utilizadas
- Gerar orçamento
- Notificar cliente
- Histórico de OS por cliente

**Telas:**
- `ServiceOrdersScreen`: Lista de OS
- `CreateServiceOrderScreen`: Criar nova OS
- `ServiceOrderDetailScreen`: Detalhes da OS
- `AddPartsScreen`: Adicionar peças
- `CameraScreen`: Tirar fotos do aparelho

**Fluxo:**
```
Lista de OS → Criar Nova OS → Adicionar Fotos → Selecionar Peças
→ Gerar Orçamento → Atualizar Status → Notificar Cliente
```

---

### 5. Clientes (CRM) 👥

**Descrição:** Consulta e gestão de clientes

**Funcionalidades:**
- Listar clientes
- Buscar por nome, CPF ou telefone
- Visualizar detalhes do cliente
- Ver histórico de compras
- Ver histórico de OS
- Programa de fidelidade (pontos)
- Ligar ou enviar WhatsApp direto do app

**Telas:**
- `CustomersScreen`: Lista de clientes
- `CustomerDetailScreen`: Detalhes do cliente
- `CustomerHistoryScreen`: Histórico completo

---

### 6. Dashboard 📊

**Descrição:** Visão geral do negócio com métricas em tempo real

**Funcionalidades:**
- KPIs principais (vendas do dia, mês, lucro)
- Gráficos de vendas
- Ranking de produtos mais vendidos
- Ranking de vendedores
- Alertas importantes
- Metas e performance

**Telas:**
- `DashboardScreen`: Dashboard principal
- `ReportsScreen`: Relatórios detalhados

---

### 7. Notificações 🔔

**Descrição:** Central de notificações e alertas

**Funcionalidades:**
- Notificações push
- Alertas de estoque baixo
- Alertas de OS vencidas
- Alertas de contas a vencer
- Notificações de vendas (para gerentes)
- Histórico de notificações

**Telas:**
- `NotificationsScreen`: Lista de notificações

---

### 8. Perfil e Configurações ⚙️

**Descrição:** Configurações do usuário e do app

**Funcionalidades:**
- Visualizar perfil
- Alterar senha
- Configurações de notificações
- Tema (claro/escuro)
- Idioma
- Sobre o app
- Logout

**Telas:**
- `ProfileScreen`: Perfil do usuário
- `SettingsScreen`: Configurações

---

## 🛠️ Stack Tecnológico

### Core

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React Native | 0.76.x | Framework mobile |
| Expo | ~52.x | Plataforma de desenvolvimento |
| TypeScript | 5.x | Tipagem estática |
| React Navigation | 7.x | Navegação |

### State Management & Data

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| tRPC Client | 11.x | Cliente API type-safe |
| React Query | 5.x | Cache e sincronização |
| AsyncStorage | 1.x | Armazenamento local |
| Superjson | 2.x | Serialização de dados |

### UI & UX

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React Native Paper | 5.x | Componentes Material Design |
| React Native Vector Icons | 10.x | Ícones |
| React Native Reanimated | 3.x | Animações |

### Features

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Expo Camera | ~16.x | Câmera e scanner |
| Expo Barcode Scanner | ~14.x | Scanner de código de barras |
| Expo Notifications | ~0.29.x | Notificações push |
| React Native Share | 11.x | Compartilhamento |

---

## 📁 Estrutura de Pastas

```
mobile/
├── app/                          # Expo Router (opcional)
├── src/
│   ├── components/               # Componentes reutilizáveis
│   │   ├── common/              # Componentes comuns
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── pdv/                 # Componentes do PDV
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── PaymentMethod.tsx
│   │   ├── stock/               # Componentes de estoque
│   │   │   ├── StockCard.tsx
│   │   │   └── StockFilter.tsx
│   │   └── orders/              # Componentes de OS
│   │       ├── OrderCard.tsx
│   │       └── OrderStatus.tsx
│   │
│   ├── screens/                 # Telas do app
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SplashScreen.tsx
│   │   ├── pdv/
│   │   │   ├── PDVScreen.tsx
│   │   │   ├── CartScreen.tsx
│   │   │   └── CheckoutScreen.tsx
│   │   ├── stock/
│   │   │   ├── StockScreen.tsx
│   │   │   ├── ProductDetailScreen.tsx
│   │   │   └── ScannerScreen.tsx
│   │   ├── orders/
│   │   │   ├── ServiceOrdersScreen.tsx
│   │   │   ├── CreateServiceOrderScreen.tsx
│   │   │   └── ServiceOrderDetailScreen.tsx
│   │   ├── customers/
│   │   │   ├── CustomersScreen.tsx
│   │   │   └── CustomerDetailScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── notifications/
│   │   │   └── NotificationsScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── navigation/              # Configuração de navegação
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   │
│   ├── services/                # Serviços e integrações
│   │   ├── api/
│   │   │   ├── trpc.ts         # Cliente tRPC
│   │   │   └── apiClient.ts
│   │   ├── storage/
│   │   │   └── AsyncStorageService.ts
│   │   ├── notifications/
│   │   │   └── NotificationService.ts
│   │   └── scanner/
│   │       └── BarcodeService.ts
│   │
│   ├── hooks/                   # Hooks customizados
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useCart.ts
│   │   ├── useOrders.ts
│   │   └── useCustomers.ts
│   │
│   ├── contexts/                # Contextos React
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── utils/                   # Utilitários
│   │   ├── formatters.ts       # Formatação de dados
│   │   ├── validators.ts       # Validações
│   │   ├── constants.ts        # Constantes
│   │   └── helpers.ts          # Funções auxiliares
│   │
│   ├── types/                   # Tipos TypeScript
│   │   ├── api.types.ts
│   │   ├── navigation.types.ts
│   │   └── models.types.ts
│   │
│   └── theme/                   # Tema e estilos
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
│
├── assets/                      # Assets estáticos
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── app.json                     # Configuração do Expo
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎨 Telas e Fluxos

### Fluxo de Autenticação

```
[Splash Screen]
      ↓
[Login Screen] → [Main App]
      ↓
[Logout] → [Login Screen]
```

### Fluxo Principal (Tabs)

```
┌─────────────────────────────────────────┐
│          Bottom Tab Navigator           │
├─────────────────────────────────────────┤
│  [PDV]  [Estoque]  [OS]  [Mais]        │
└─────────────────────────────────────────┘
```

### Fluxo de Venda (PDV)

```
[PDV Screen]
    ↓
[Buscar Produto] → [Scanner]
    ↓
[Adicionar ao Carrinho]
    ↓
[Ver Carrinho]
    ↓
[Selecionar Cliente]
    ↓
[Checkout]
    ↓
[Selecionar Pagamento]
    ↓
[Finalizar Venda]
    ↓
[Recibo] → [Compartilhar]
```

### Fluxo de Ordem de Serviço

```
[Lista de OS]
    ↓
[Criar Nova OS]
    ↓
[Preencher Dados]
    ↓
[Tirar Fotos]
    ↓
[Adicionar Peças]
    ↓
[Gerar Orçamento]
    ↓
[Salvar OS]
    ↓
[Atualizar Status]
```

---

## 🔌 Integração com API

### Cliente tRPC

O app mobile usa o mesmo backend do CellSync web através do tRPC, garantindo type-safety completo.

**Configuração do Cliente:**

```typescript
// src/services/api/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://api.cellsync.com/api/trpc',
      headers: async () => {
        const token = await AsyncStorage.getItem('auth_token');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
  transformer: superjson,
});
```

### Principais Endpoints Utilizados:

**Autenticação:**
- `auth.login`
- `auth.logout`
- `auth.me`

**PDV:**
- `products.list`
- `products.getById`
- `products.searchByImei`
- `sales.create`
- `sales.list`

**Estoque:**
- `stock.list`
- `stock.getByImei`
- `stock.movements`

**Ordem de Serviço:**
- `serviceOrders.list`
- `serviceOrders.create`
- `serviceOrders.update`
- `serviceOrders.getById`

**Clientes:**
- `customers.list`
- `customers.getById`
- `customers.history`

**Dashboard:**
- `dashboard.getKPIs`
- `dashboard.getSalesChart`

---

## 🚀 Guia de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para Android)
- Xcode (para iOS - apenas macOS)
- Dispositivo físico ou emulador

### Instalação

```bash
# Clonar o repositório
cd /home/ubuntu/okcells/mobile

# Instalar dependências
npm install --legacy-peer-deps

# Configurar variáveis de ambiente
cp .env.example .env
```

### Configuração do .env

```env
# API
API_URL=https://api.cellsync.com
API_TRPC_URL=https://api.cellsync.com/api/trpc

# App
APP_NAME=CellSync Mobile
APP_VERSION=1.0.0

# Features
ENABLE_BIOMETRIC_AUTH=false
ENABLE_OFFLINE_MODE=false
```

### Executar o App

```bash
# Iniciar o servidor de desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS (apenas macOS)
npm run ios

# Executar no navegador (para testes)
npm run web
```

### Build para Produção

**Android (APK):**
```bash
# Build de desenvolvimento
eas build --platform android --profile development

# Build de produção
eas build --platform android --profile production
```

**iOS (IPA):**
```bash
# Build de desenvolvimento
eas build --platform ios --profile development

# Build de produção
eas build --platform ios --profile production
```

### Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes E2E
npm run test:e2e
```

---

## 💰 Estimativa de Custo

### Desenvolvimento do App Mobile

| Fase | Horas | Custo (R$) |
|------|-------|------------|
| **1. Setup e Configuração** | 40h | R$ 4.000 - R$ 6.000 |
| - Configuração do projeto | 10h | |
| - Configuração de navegação | 10h | |
| - Integração com API | 20h | |
| **2. Autenticação** | 30h | R$ 3.000 - R$ 4.500 |
| - Tela de login | 15h | |
| - Gestão de sessão | 10h | |
| - Biometria (futuro) | 5h | |
| **3. PDV Mobile** | 80h | R$ 8.000 - R$ 12.000 |
| - Busca de produtos | 20h | |
| - Carrinho de compras | 20h | |
| - Checkout | 25h | |
| - Recibo e compartilhamento | 15h | |
| **4. Estoque** | 60h | R$ 6.000 - R$ 9.000 |
| - Lista de produtos | 20h | |
| - Scanner de IMEI | 20h | |
| - Detalhes e movimentações | 20h | |
| **5. Ordem de Serviço** | 80h | R$ 8.000 - R$ 12.000 |
| - Lista de OS | 20h | |
| - Criar/editar OS | 30h | |
| - Câmera e fotos | 15h | |
| - Gestão de peças | 15h | |
| **6. Clientes (CRM)** | 40h | R$ 4.000 - R$ 6.000 |
| - Lista de clientes | 15h | |
| - Detalhes do cliente | 15h | |
| - Histórico | 10h | |
| **7. Dashboard** | 50h | R$ 5.000 - R$ 7.500 |
| - KPIs | 20h | |
| - Gráficos | 20h | |
| - Relatórios | 10h | |
| **8. Notificações** | 40h | R$ 4.000 - R$ 6.000 |
| - Push notifications | 25h | |
| - Central de notificações | 15h | |
| **9. Perfil e Configurações** | 30h | R$ 3.000 - R$ 4.500 |
| - Perfil do usuário | 15h | |
| - Configurações | 15h | |
| **10. Testes e QA** | 80h | R$ 8.000 - R$ 12.000 |
| - Testes unitários | 30h | |
| - Testes de integração | 30h | |
| - Testes E2E | 20h | |
| **11. Design UI/UX** | 60h | R$ 6.000 - R$ 9.000 |
| - Design de telas | 40h | |
| - Prototipação | 20h | |
| **12. Build e Deploy** | 30h | R$ 3.000 - R$ 4.500 |
| - Configuração de build | 15h | |
| - Publicação nas stores | 15h | |
| **TOTAL** | **620h** | **R$ 62.000 - R$ 93.000** |

### Custos Adicionais

| Item | Custo Anual |
|------|-------------|
| Apple Developer Account | R$ 500 |
| Google Play Developer Account | R$ 130 (único) |
| Expo EAS Build (Pro) | R$ 1.500 |
| Certificados e assinaturas | R$ 300 |
| **TOTAL** | **R$ 2.430/ano** |

### **Custo Total Estimado:**

- **Desenvolvimento:** R$ 62.000 - R$ 93.000
- **Custos anuais:** R$ 2.430
- **Valor médio:** **R$ 75.000 - R$ 80.000**

### Tempo de Desenvolvimento:

- **Equipe completa (3 devs):** 3-4 meses
- **Equipe reduzida (2 devs):** 5-6 meses
- **Desenvolvedor solo:** 10-12 meses

---

## 🗺️ Roadmap

### Fase 1: MVP (3 meses)
- ✅ Autenticação
- ✅ PDV básico
- ✅ Consulta de estoque
- ✅ Lista de clientes
- ✅ Dashboard simples

### Fase 2: Funcionalidades Avançadas (2 meses)
- ✅ Ordem de Serviço completa
- ✅ Scanner de IMEI
- ✅ Notificações push
- ✅ Compartilhamento de recibos

### Fase 3: Otimizações (1 mês)
- ✅ Modo offline
- ✅ Biometria
- ✅ Performance
- ✅ Testes completos

### Fase 4: Publicação (2 semanas)
- ✅ Build de produção
- ✅ Publicação na Google Play
- ✅ Publicação na App Store
- ✅ Documentação final

### Futuro (Roadmap Estendido)
- 🔄 Sincronização offline avançada
- 🌐 Suporte a múltiplos idiomas
- 🎨 Temas personalizáveis
- 📊 Relatórios avançados
- 🔗 Integração com marketplaces
- 💬 Chat integrado
- 📸 Reconhecimento de imagem (IA)

---

## 📞 Suporte e Contato

**Documentação:** https://docs.cellsync.com  
**API:** https://api.cellsync.com  
**GitHub:** https://github.com/danilolimaCabral/okcells-system

---

**Desenvolvido com ❤️ para o CellSync**  
**Versão:** 1.0  
**Data:** 02/12/2025
