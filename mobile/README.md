# 📱 CellSync Mobile

> Aplicativo mobile para o sistema de gestão CellSync - React Native + Expo

## 🎯 Status do Projeto

**Versão:** 1.0.0-alpha  
**Status:** Em Desenvolvimento (Base Criada)  
**Plataformas:** iOS e Android

### ✅ O que já está pronto:

- ✅ Estrutura completa de pastas
- ✅ Configuração do Expo e React Native
- ✅ Tipos TypeScript para todos os modelos
- ✅ Utilitários de formatação (moeda, data, telefone, etc.)
- ✅ Serviço de armazenamento local (AsyncStorage)
- ✅ Cliente tRPC configurado
- ✅ Contexto de autenticação
- ✅ Contexto do carrinho de compras
- ✅ Tema e cores do app
- ✅ App.tsx principal com providers
- ✅ Documentação completa (MOBILE_APP_DOCUMENTATION.md)

### 🚧 O que falta implementar:

- [ ] Componentes visuais (botões, cards, inputs)
- [ ] Telas de autenticação (Login, Splash)
- [ ] Navegação (React Navigation)
- [ ] Telas do PDV
- [ ] Telas de Estoque
- [ ] Telas de Ordem de Serviço
- [ ] Telas de Clientes
- [ ] Dashboard
- [ ] Scanner de código de barras
- [ ] Notificações push

---

## 📁 Estrutura Criada

```
mobile/
├── src/
│   ├── components/          # Componentes reutilizáveis (a criar)
│   │   ├── common/
│   │   ├── pdv/
│   │   ├── stock/
│   │   └── orders/
│   ├── screens/             # Telas do app (a criar)
│   │   ├── auth/
│   │   ├── pdv/
│   │   ├── stock/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   └── profile/
│   ├── navigation/          # Navegação (a criar)
│   ├── services/            # ✅ Serviços prontos
│   │   ├── api/
│   │   │   └── trpc.ts
│   │   └── storage/
│   │       └── AsyncStorageService.ts
│   ├── contexts/            # ✅ Contextos prontos
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── utils/               # ✅ Utilitários prontos
│   │   ├── constants.ts
│   │   └── formatters.ts
│   ├── types/               # ✅ Tipos prontos
│   │   └── models.types.ts
│   └── theme/               # ✅ Tema pronto
│       └── colors.ts
├── assets/                  # Assets (imagens, ícones, fontes)
├── App.tsx                  # ✅ App principal configurado
├── package.json
└── README.md               # Este arquivo
```

---

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (para testar no celular)

### Instalação

```bash
cd /home/ubuntu/okcells/mobile

# Instalar dependências
npm install --legacy-peer-deps

# Iniciar o servidor de desenvolvimento
npm start
```

### Executar no Dispositivo

1. Instale o **Expo Go** no seu celular (iOS ou Android)
2. Execute `npm start`
3. Escaneie o QR Code com o Expo Go
4. O app será carregado no seu celular

### Executar no Emulador

```bash
# Android
npm run android

# iOS (apenas macOS)
npm run ios
```

---

## 📚 Documentação Completa

Consulte o arquivo **MOBILE_APP_DOCUMENTATION.md** para:

- Arquitetura detalhada
- Especificação de todas as funcionalidades
- Fluxos de telas
- Guia de desenvolvimento completo
- Estimativa de custos
- Roadmap

---

## 🛠️ Próximos Passos para Continuar o Desenvolvimento

### 1. Criar Navegação (Prioridade Alta)

```bash
# Criar arquivo de navegação principal
touch src/navigation/AppNavigator.tsx
touch src/navigation/AuthNavigator.tsx
touch src/navigation/TabNavigator.tsx
```

**Conteúdo sugerido para AppNavigator.tsx:**

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
```

### 2. Criar Tela de Login (Prioridade Alta)

```bash
touch src/screens/auth/LoginScreen.tsx
touch src/screens/auth/SplashScreen.tsx
```

### 3. Criar Componentes Comuns (Prioridade Alta)

```bash
touch src/components/common/Button.tsx
touch src/components/common/Card.tsx
touch src/components/common/Input.tsx
touch src/components/common/Loading.tsx
```

### 4. Implementar Telas Principais

Siga a ordem:
1. **Auth** → Login, Splash
2. **PDV** → Lista de produtos, Carrinho, Checkout
3. **Estoque** → Lista, Detalhes, Scanner
4. **OS** → Lista, Criar, Detalhes
5. **Outros** → Clientes, Dashboard, Perfil

---

## 🎨 Design System

### Cores Principais

```typescript
primary: '#6366f1'      // Indigo
secondary: '#a855f7'    // Purple
accent: '#ec4899'       // Pink
success: '#10b981'      // Green
warning: '#f59e0b'      // Orange
error: '#ef4444'        // Red
```

### Componentes UI

Use **React Native Paper** para componentes prontos:
- Button, Card, TextInput
- List, Chip, Badge
- Dialog, Snackbar, Menu

---

## 🔌 Integração com API

O cliente tRPC já está configurado e pronto para uso:

```typescript
import { trpc } from '../services/api/trpc';

// Exemplo de uso em um componente
function ProductList() {
  const { data, isLoading } = trpc.products.list.useQuery();
  
  if (isLoading) return <Loading />;
  
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  );
}
```

### Endpoints Disponíveis

Todos os endpoints do CellSync web estão disponíveis:

- `auth.login`, `auth.logout`, `auth.me`
- `products.list`, `products.getById`
- `stock.list`, `stock.getByImei`
- `sales.create`, `sales.list`
- `serviceOrders.list`, `serviceOrders.create`
- `customers.list`, `customers.getById`
- `dashboard.getKPIs`

---

## 📱 Funcionalidades Planejadas

### MVP (Fase 1)

1. **Autenticação** ✅ (Base pronta)
   - Login com email/senha
   - Manter sessão
   - Logout

2. **PDV Mobile**
   - Buscar produtos
   - Adicionar ao carrinho ✅ (Contexto pronto)
   - Finalizar venda
   - Gerar recibo

3. **Consulta de Estoque**
   - Listar produtos
   - Buscar por IMEI
   - Ver detalhes

4. **Clientes**
   - Listar clientes
   - Ver histórico

### Fase 2

- Ordem de Serviço completa
- Scanner de código de barras
- Dashboard com gráficos
- Notificações push

### Fase 3

- Modo offline
- Biometria
- Relatórios
- Exportação de dados

---

## 💰 Estimativa de Desenvolvimento

### Tempo Estimado por Módulo

| Módulo | Horas | Prioridade |
|--------|-------|------------|
| Navegação + Auth | 40h | Alta |
| PDV Mobile | 80h | Alta |
| Estoque | 60h | Alta |
| Ordem de Serviço | 80h | Média |
| Clientes | 40h | Média |
| Dashboard | 50h | Baixa |
| Notificações | 40h | Baixa |
| Testes e QA | 80h | Alta |
| **TOTAL** | **470h** | |

### Custo Estimado

- **Desenvolvedor Júnior:** R$ 40-60/h = R$ 18.800 - R$ 28.200
- **Desenvolvedor Pleno:** R$ 80-120/h = R$ 37.600 - R$ 56.400
- **Desenvolvedor Sênior:** R$ 150-200/h = R$ 70.500 - R$ 94.000

**Recomendado:** Desenvolvedor Pleno = **R$ 45.000 - R$ 50.000**

---

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar com coverage
npm run test:coverage
```

---

## 📦 Build para Produção

### Android (APK/AAB)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Configurar build
eas build:configure

# Build de desenvolvimento
eas build --platform android --profile development

# Build de produção
eas build --platform android --profile production
```

### iOS (IPA)

```bash
# Build de desenvolvimento
eas build --platform ios --profile development

# Build de produção (requer Apple Developer Account)
eas build --platform ios --profile production
```

---

## 📖 Recursos Úteis

### Documentação

- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [tRPC](https://trpc.io/)

### Tutoriais Recomendados

1. [React Native Tutorial](https://reactnative.dev/docs/tutorial)
2. [Expo Tutorial](https://docs.expo.dev/tutorial/introduction/)
3. [React Navigation Tutorial](https://reactnavigation.org/docs/getting-started)

---

## 🤝 Contribuindo

Para contribuir com o desenvolvimento:

1. Leia a documentação completa (MOBILE_APP_DOCUMENTATION.md)
2. Siga a estrutura de pastas estabelecida
3. Use TypeScript para type-safety
4. Siga os padrões de código (ESLint + Prettier)
5. Escreva testes para novas funcionalidades

---

## 📞 Suporte

**Repositório:** https://github.com/danilolimaCabral/okcells-system  
**Documentação Web:** https://docs.cellsync.com  
**API:** https://3000-iob7ye059hwvp4sz9bjn9-f9914a8d.manusvm.computer

---

## 📝 Licença

Propriet ário - CellSync © 2025

---

**Desenvolvido com ❤️ para o CellSync**  
**Versão:** 1.0.0-alpha  
**Data:** 02/12/2025
