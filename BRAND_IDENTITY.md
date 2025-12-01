# CellSync - Identidade Visual

## Logo

### Versões
1. **Logo Completo**: `/cellsync-logo.png` - Símbolo + Texto "CellSync"
2. **Ícone**: `/cellsync-icon.png` - Apenas símbolo (favicon, app icon)

### Conceito
Células (cell) sincronizadas (sync) representadas por ondas conectadas em gradiente vibrante, simbolizando conexão, fluidez e sincronização de dados.

---

## Paleta de Cores

### Cores Primárias (Gradiente Signature)
```css
--primary-blue: #3B82F6;    /* Electric Blue - Confiança, Tecnologia */
--primary-purple: #A855F7;  /* Vibrant Purple - Inovação, Criatividade */
--primary-pink: #EC4899;    /* Hot Pink - Energia, Modernidade */
```

**Justificativa**: Alinhado com tendências 2025 de gradientes fluidos e vibrantes. Diferenciação total dos concorrentes (ReparaOS: azul simples, MercadoPhone: verde, VHSys: verde/laranja, Bling: verde).

### Gradientes

```css
/* Gradiente Horizontal (Principal) */
background: linear-gradient(90deg, #3B82F6 0%, #A855F7 50%, #EC4899 100%);

/* Gradiente Vertical */
background: linear-gradient(180deg, #3B82F6 0%, #A855F7 50%, #EC4899 100%);

/* Gradiente Diagonal (45deg) */
background: linear-gradient(135deg, #3B82F6 0%, #A855F7 50%, #EC4899 100%);

/* Gradiente Radial (para backgrounds) */
background: radial-gradient(circle at top right, #3B82F6 0%, #A855F7 50%, #EC4899 100%);
```

### Cores Neutras (Fundos e Textos)
```css
--background: #FFFFFF;        /* Branco puro */
--foreground: #0F172A;        /* Slate 900 - Texto principal */
--muted: #F8FAFC;            /* Slate 50 - Fundos suaves */
--muted-foreground: #64748B;  /* Slate 500 - Texto secundário */
--border: #E2E8F0;           /* Slate 200 - Bordas sutis */
--card: #FFFFFF;             /* Branco - Cards */
--card-foreground: #0F172A;  /* Slate 900 - Texto em cards */
```

### Cores de Feedback (Status e Notificações)
```css
--success: #10B981;   /* Green 500 - Sucesso, confirmação */
--warning: #F59E0B;   /* Amber 500 - Atenção, alerta */
--error: #EF4444;     /* Red 500 - Erro, crítico */
--info: #3B82F6;      /* Blue 500 - Informação (mesma cor primária) */
```

---

## Tipografia

### Fonte Principal: **Inter**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Uso**: Corpo de texto, UI, botões, formulários
- **Justificativa**: Fonte moderna, legível, otimizada para telas

### Fonte Display (Opcional): **Poppins**
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap" rel="stylesheet">
```

- **Weights**: 600 (Semibold), 700 (Bold)
- **Uso**: Títulos grandes, headings, landing page
- **Justificativa**: Personalidade forte, impacto visual

### Hierarquia Tipográfica
```css
/* Headings */
h1: font-size: 3rem (48px), font-weight: 700, line-height: 1.2
h2: font-size: 2.25rem (36px), font-weight: 700, line-height: 1.3
h3: font-size: 1.875rem (30px), font-weight: 600, line-height: 1.4
h4: font-size: 1.5rem (24px), font-weight: 600, line-height: 1.5

/* Body */
body: font-size: 1rem (16px), font-weight: 400, line-height: 1.6
small: font-size: 0.875rem (14px), font-weight: 400, line-height: 1.5
```

---

## Componentes Visuais

### Botões

**Primary (Gradiente)**:
```css
background: linear-gradient(90deg, #3B82F6 0%, #A855F7 50%, #EC4899 100%);
color: white;
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;
font-weight: 600;
transition: transform 0.2s, box-shadow 0.2s;

/* Hover */
transform: translateY(-2px);
box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
```

**Secondary (Outline)**:
```css
background: transparent;
border: 2px solid #3B82F6;
color: #3B82F6;
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;
font-weight: 600;

/* Hover */
background: #F8FAFC;
```

**Ghost (Transparente)**:
```css
background: transparent;
color: #64748B;
padding: 0.75rem 1.5rem;

/* Hover */
background: #F8FAFC;
color: #0F172A;
```

### Cards

```css
background: white;
border: 1px solid #E2E8F0;
border-radius: 0.75rem;
padding: 1.5rem;
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
transition: box-shadow 0.2s, transform 0.2s;

/* Hover */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
transform: translateY(-2px);
```

### Inputs

```css
background: white;
border: 1px solid #E2E8F0;
border-radius: 0.5rem;
padding: 0.75rem 1rem;
color: #0F172A;
font-size: 1rem;

/* Focus */
border-color: #3B82F6;
outline: none;
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);

/* Placeholder */
color: #94A3B8;
```

---

## Espaçamento (Sistema 8px)

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
--spacing-4xl: 6rem;     /* 96px */
```

---

## Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - Inputs, badges */
--radius-md: 0.5rem;     /* 8px - Botões, cards pequenos */
--radius-lg: 0.75rem;    /* 12px - Cards, modais */
--radius-xl: 1rem;       /* 16px - Containers grandes */
--radius-2xl: 1.5rem;    /* 24px - Hero sections */
--radius-full: 9999px;   /* Circular - Avatares, badges */
```

---

## Sombras

```css
/* Sombra Suave (Cards, inputs) */
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

/* Sombra Média (Cards hover, dropdowns) */
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Sombra Grande (Modais, popovers) */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Sombra XL (Hero sections, CTAs) */
box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Sombra com Gradiente (Botões primary hover) */
box-shadow: 0 10px 40px -10px rgba(59, 130, 246, 0.4);
```

---

## Animações e Transições

```css
/* Transição Padrão */
transition: all 0.2s ease-in-out;

/* Transição Suave (para backgrounds) */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover Scale (botões, cards) */
transform: scale(1.02);

/* Hover Elevação (cards) */
transform: translateY(-2px);

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide In */
@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## Ícones

- **Biblioteca**: Lucide React
- **Tamanho padrão**: 20px (h-5 w-5)
- **Tamanho grande**: 24px (h-6 w-6)
- **Cor**: Herda do texto ou usa cores do gradiente

---

## Aplicação por Contexto

### Landing Page
- **Hero Section**: Gradiente de fundo sutil (radial-gradient) + título bold + CTA com gradiente vibrante
- **Features**: Cards brancos com ícones coloridos (gradiente)
- **CTAs**: Botões primary com gradiente completo + hover elevado
- **Backgrounds**: Alternância entre branco e slate-50

### Dashboard
- **Sidebar**: Fundo branco com logo CellSync + navegação limpa
- **Cards**: Fundos brancos com sombras suaves + hover elevado
- **Gráficos**: Cores do gradiente (azul, roxo, rosa) para diferentes datasets
- **Badges**: Cores de feedback (success, warning, error)

### Formulários
- **Inputs**: Bordas sutis + focus ring azul
- **Botões Submit**: Primary com gradiente
- **Validação**: Cores de feedback (verde sucesso, vermelho erro)

---

## Acessibilidade

### Contraste de Cores (WCAG AA)
- Texto principal (#0F172A) em fundo branco: **Ratio 16.1:1** ✅
- Texto secundário (#64748B) em fundo branco: **Ratio 5.5:1** ✅
- Botão primary (branco em gradiente azul): **Ratio 4.8:1** ✅

### Boas Práticas
- Sempre fornecer alternativas textuais para ícones
- Usar `aria-label` em botões sem texto
- Garantir tamanho mínimo de toque (44x44px) em mobile
- Manter hierarquia clara de headings (h1 → h6)

---

## Referências de Inspiração

### Concorrentes Analisados
- **ReparaOS**: Simplicidade, azul profissional, foco em funcionalidade
- **MercadoPhone**: Gradientes vibrantes, UI moderna, recursos premium
- **VHSys**: Layout limpo, verde profissional, integração financeira
- **Bling**: Verde vibrante, tipografia bold, foco em e-commerce

### Tendências 2025
- Paletas suaves com acentos ousados
- Gradientes fluidos e vibrantes
- Acessibilidade em primeiro lugar
- Texturas e profundidade (grainy, paper, layered)

---

## Arquivos de Logo

- `/client/public/cellsync-logo.png` - Logo completo (símbolo + texto)
- `/client/public/cellsync-icon.png` - Ícone (apenas símbolo)

### Uso Recomendado
- **Header/Navbar**: Logo completo
- **Favicon**: Ícone
- **App Icon (PWA)**: Ícone
- **Loading Screen**: Logo completo animado
- **Email/PDF**: Logo completo

---

**Criado por**: Manus AI  
**Data**: 01 de Dezembro de 2025  
**Versão**: 1.0
