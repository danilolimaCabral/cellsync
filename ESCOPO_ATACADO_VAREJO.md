# Sistema Atacado/Varejo - Escopo Detalhado

## 📋 Visão Geral

Implementar sistema de preços diferenciados para vendas no atacado e varejo, permitindo que a loja ofereça descontos automáticos para compras em quantidade, mantendo margem de lucro adequada e competitividade no mercado.

---

## 🎯 Objetivos

### Objetivo Principal
Permitir que o sistema aplique automaticamente preços diferenciados baseado no tipo de venda (atacado ou varejo) e quantidade de produtos, facilitando vendas em volume e aumentando o ticket médio.

### Objetivos Específicos
1. Cadastrar preços de atacado para cada produto
2. Definir quantidade mínima para atacado
3. Aplicar preço correto automaticamente no PDV
4. Registrar tipo de venda no histórico
5. Gerar relatórios separados por tipo de venda

---

## 📊 Requisitos Funcionais

### RF01 - Cadastro de Preços
**Descrição**: Sistema deve permitir cadastrar preço de atacado além do preço de varejo

**Campos necessários na tabela `products`:**
- `wholesalePrice` (INTEGER) - Preço de atacado em centavos
- `minWholesaleQty` (INTEGER) - Quantidade mínima para atacado (padrão: 5)

**Regras:**
- Preço de atacado deve ser menor que preço de varejo
- Preço de atacado deve ser maior que preço de custo
- Quantidade mínima deve ser >= 2
- Se wholesalePrice for NULL, produto não tem preço de atacado

**Validações:**
```
wholesalePrice < salePrice
wholesalePrice > costPrice
minWholesaleQty >= 2
```

---

### RF02 - Configuração Global
**Descrição**: Permitir configurar regras globais de atacado

**Configurações:**
- Quantidade mínima padrão para atacado (ex: 5 unidades)
- Percentual de desconto padrão (ex: 10%)
- Permitir atacado misto (produtos diferentes somando quantidade)

**Tela**: Configurações > Vendas > Atacado/Varejo

---

### RF03 - Seleção de Tipo de Venda no PDV
**Descrição**: Vendedor deve poder selecionar tipo de venda antes de adicionar produtos

**Interface:**
```
┌─────────────────────────────────────┐
│  Tipo de Venda:                     │
│  ○ Varejo    ○ Atacado              │
└─────────────────────────────────────┘
```

**Comportamento:**
- Toggle/Radio button no topo do PDV
- Ao selecionar "Atacado", sistema verifica quantidade automaticamente
- Se quantidade < mínima, mostra alerta mas permite continuar
- Preço é aplicado conforme seleção + quantidade

**Regras:**
- Modo Varejo: sempre aplica `salePrice`
- Modo Atacado: 
  - Se qty >= minWholesaleQty → aplica `wholesalePrice`
  - Se qty < minWholesaleQty → mostra alerta mas permite vender com `salePrice`

---

### RF04 - Cálculo Automático de Preço
**Descrição**: Sistema calcula preço automaticamente baseado em tipo + quantidade

**Lógica:**
```typescript
function calcularPreco(produto, quantidade, tipoVenda) {
  if (tipoVenda === 'atacado' && 
      produto.wholesalePrice && 
      quantidade >= produto.minWholesaleQty) {
    return produto.wholesalePrice;
  }
  return produto.salePrice;
}
```

**Exemplos:**

| Produto | Qty | Tipo | Preço Varejo | Preço Atacado | Min Qty | Preço Aplicado |
|---------|-----|------|--------------|---------------|---------|----------------|
| iPhone 15 | 3 | Varejo | R$ 5.000 | R$ 4.500 | 5 | R$ 5.000 |
| iPhone 15 | 3 | Atacado | R$ 5.000 | R$ 4.500 | 5 | R$ 5.000 (alerta) |
| iPhone 15 | 6 | Atacado | R$ 5.000 | R$ 4.500 | 5 | R$ 4.500 |
| iPhone 15 | 10 | Varejo | R$ 5.000 | R$ 4.500 | 5 | R$ 5.000 |

---

### RF05 - Alertas e Validações no PDV
**Descrição**: Sistema deve alertar vendedor sobre condições de atacado

**Alertas:**

1. **Quantidade insuficiente para atacado:**
```
⚠️ Atenção!
Quantidade atual: 3 unidades
Mínimo para atacado: 5 unidades

Adicione mais 2 unidades para obter preço de atacado
(R$ 4.500 por unidade ao invés de R$ 5.000)
```

2. **Produto sem preço de atacado:**
```
ℹ️ Informação
Este produto não possui preço de atacado cadastrado.
Será vendido pelo preço de varejo.
```

3. **Economia no atacado:**
```
✅ Atacado Aplicado!
Economia: R$ 3.000,00 (10% de desconto)
Preço unitário: R$ 4.500 (ao invés de R$ 5.000)
```

---

### RF06 - Registro de Tipo de Venda
**Descrição**: Salvar tipo de venda no banco de dados

**Alteração na tabela `sales`:**
- Adicionar campo `saleType` ENUM('retail', 'wholesale')
- Adicionar campo `appliedDiscount` (INTEGER) - desconto total em centavos

**Campos em `saleItems`:**
- Adicionar campo `unitPriceType` ENUM('retail', 'wholesale')
- Manter `unitPrice` com o preço realmente aplicado

---

### RF07 - Relatórios por Tipo de Venda
**Descrição**: Gerar relatórios separados de vendas atacado vs varejo

**Métricas:**
- Total de vendas no varejo (quantidade + valor)
- Total de vendas no atacado (quantidade + valor)
- Ticket médio varejo vs atacado
- Margem de lucro varejo vs atacado
- Produtos mais vendidos no atacado
- Clientes que mais compram no atacado

**Visualização:**
```
┌──────────────────────────────────────────┐
│  Vendas por Tipo - Novembro 2024        │
├──────────────────────────────────────────┤
│  Varejo:                                 │
│    Vendas: 150                           │
│    Valor: R$ 450.000,00                  │
│    Ticket Médio: R$ 3.000,00             │
│    Margem: 35%                           │
│                                          │
│  Atacado:                                │
│    Vendas: 25                            │
│    Valor: R$ 300.000,00                  │
│    Ticket Médio: R$ 12.000,00            │
│    Margem: 28%                           │
└──────────────────────────────────────────┘
```

---

### RF08 - Atualização em Massa de Preços
**Descrição**: Permitir atualizar preços de atacado em lote

**Funcionalidade:**
- Selecionar múltiplos produtos
- Aplicar percentual de desconto sobre preço de varejo
- Definir quantidade mínima em massa
- Visualizar preview antes de salvar

**Exemplo:**
```
Atualizar Preços de Atacado em Lote

Produtos selecionados: 47 iPhones

Desconto sobre varejo: [10]%
Quantidade mínima: [5] unidades

Preview:
- iPhone 15 Pro Max: R$ 7.200 → R$ 6.480 (min: 5)
- iPhone 15 Pro: R$ 6.500 → R$ 5.850 (min: 5)
- iPhone 15: R$ 5.000 → R$ 4.500 (min: 5)

[Cancelar] [Aplicar]
```

---

### RF09 - Recibo com Tipo de Venda
**Descrição**: Recibo deve indicar tipo de venda e economia

**Informações adicionais no recibo:**
```
─────────────────────────────────────
TIPO DE VENDA: ATACADO
─────────────────────────────────────

Produtos:
iPhone 15 Pro Max 256GB
Quantidade: 6 unidades
Preço unitário: R$ 6.480,00
Subtotal: R$ 38.880,00

─────────────────────────────────────
Economia no Atacado: R$ 4.320,00
(Preço varejo seria: R$ 43.200,00)
─────────────────────────────────────
```

---

### RF10 - Histórico de Preços
**Descrição**: Registrar histórico de alterações de preços

**Tabela nova: `priceHistory`**
```sql
CREATE TABLE priceHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT NOT NULL,
  priceType ENUM('cost', 'retail', 'wholesale'),
  oldPrice INT,
  newPrice INT NOT NULL,
  changedBy INT NOT NULL, -- userId
  changedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);
```

---

## 🎨 Interface do Usuário

### 1. Formulário de Cadastro de Produto (Estoque)

**Adicionar seção "Preços":**
```
┌─────────────────────────────────────────┐
│  Preços                                 │
├─────────────────────────────────────────┤
│  Preço de Custo (R$) *                  │
│  [1.500,00]                             │
│                                         │
│  Preço de Varejo (R$) *                 │
│  [5.000,00]                             │
│                                         │
│  ☑ Habilitar venda no atacado           │
│                                         │
│  Preço de Atacado (R$)                  │
│  [4.500,00]                             │
│  💡 10% de desconto sobre varejo        │
│                                         │
│  Quantidade Mínima para Atacado         │
│  [5] unidades                           │
└─────────────────────────────────────────┘
```

### 2. PDV - Seleção de Tipo de Venda

**No topo do PDV, antes da busca:**
```
┌─────────────────────────────────────────┐
│  Tipo de Venda:                         │
│  ┌─────────┐  ┌─────────┐              │
│  │ Varejo  │  │ Atacado │              │
│  │   🛒    │  │   📦    │              │
│  └─────────┘  └─────────┘              │
└─────────────────────────────────────────┘
```

### 3. Carrinho com Indicador de Tipo

**Cada item no carrinho mostra o preço aplicado:**
```
┌─────────────────────────────────────────┐
│  iPhone 15 Pro Max 256GB                │
│  Quantidade: 6                          │
│  Preço: R$ 4.500,00 (ATACADO) 📦        │
│  Subtotal: R$ 27.000,00                 │
│  Economia: R$ 3.000,00                  │
└─────────────────────────────────────────┘
```

### 4. Tela de Configurações

**Nova seção em Configurações > Vendas:**
```
┌─────────────────────────────────────────┐
│  Configurações de Atacado/Varejo       │
├─────────────────────────────────────────┤
│  Quantidade mínima padrão               │
│  [5] unidades                           │
│                                         │
│  Desconto padrão sobre varejo           │
│  [10]%                                  │
│                                         │
│  ☐ Permitir atacado misto               │
│  (somar produtos diferentes)            │
│                                         │
│  ☑ Mostrar economia no recibo           │
│                                         │
│  ☑ Alertar quando próximo do mínimo     │
│                                         │
│  [Salvar Configurações]                 │
└─────────────────────────────────────────┘
```

---

## 🗄️ Alterações no Banco de Dados

### Migration 1: Adicionar campos de atacado em products
```sql
ALTER TABLE products 
ADD COLUMN wholesalePrice INT NULL COMMENT 'Preço de atacado em centavos',
ADD COLUMN minWholesaleQty INT DEFAULT 5 COMMENT 'Quantidade mínima para atacado';
```

### Migration 2: Adicionar tipo de venda em sales
```sql
ALTER TABLE sales
ADD COLUMN saleType ENUM('retail', 'wholesale') DEFAULT 'retail' COMMENT 'Tipo de venda',
ADD COLUMN appliedDiscount INT DEFAULT 0 COMMENT 'Desconto total aplicado em centavos';
```

### Migration 3: Adicionar tipo de preço em saleItems
```sql
ALTER TABLE saleItems
ADD COLUMN unitPriceType ENUM('retail', 'wholesale') DEFAULT 'retail' COMMENT 'Tipo de preço aplicado';
```

### Migration 4: Criar tabela de histórico de preços
```sql
CREATE TABLE priceHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  productId INT NOT NULL,
  priceType ENUM('cost', 'retail', 'wholesale') NOT NULL,
  oldPrice INT NULL,
  newPrice INT NOT NULL,
  changedBy INT NOT NULL,
  changedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (changedBy) REFERENCES users(id)
);
```

---

## 🔄 Fluxo de Uso

### Fluxo 1: Cadastrar Produto com Atacado
1. Usuário acessa Estoque > Novo Produto
2. Preenche dados básicos do produto
3. Define preço de custo: R$ 1.500
4. Define preço de varejo: R$ 5.000
5. Marca checkbox "Habilitar venda no atacado"
6. Define preço de atacado: R$ 4.500 (10% desconto)
7. Define quantidade mínima: 5 unidades
8. Salva produto

### Fluxo 2: Venda no Varejo (Normal)
1. Vendedor abre PDV
2. Tipo de venda já está em "Varejo" (padrão)
3. Busca produto "iPhone 15"
4. Adiciona 2 unidades ao carrinho
5. Sistema aplica preço de varejo: R$ 5.000/un
6. Total: R$ 10.000
7. Finaliza venda normalmente

### Fluxo 3: Venda no Atacado (Com Quantidade Suficiente)
1. Vendedor abre PDV
2. Seleciona tipo de venda: "Atacado"
3. Busca produto "iPhone 15"
4. Adiciona 6 unidades ao carrinho
5. Sistema detecta qty >= 5 (mínimo)
6. Aplica preço de atacado: R$ 4.500/un
7. Mostra economia: R$ 3.000 (6 × R$ 500)
8. Total: R$ 27.000
9. Finaliza venda com tipo "atacado"

### Fluxo 4: Tentativa de Atacado com Quantidade Insuficiente
1. Vendedor abre PDV
2. Seleciona tipo de venda: "Atacado"
3. Busca produto "iPhone 15"
4. Adiciona 3 unidades ao carrinho
5. Sistema detecta qty < 5 (mínimo)
6. Mostra alerta: "Adicione mais 2 unidades para atacado"
7. Vendedor pode:
   - Adicionar mais unidades → preço atacado
   - Continuar com 3 → preço varejo

### Fluxo 5: Atualizar Preços em Massa
1. Usuário acessa Estoque
2. Seleciona múltiplos produtos (ex: todos iPhones)
3. Clica em "Ações em Lote" > "Atualizar Preços de Atacado"
4. Define desconto: 10%
5. Define quantidade mínima: 5
6. Visualiza preview
7. Confirma atualização
8. Sistema salva histórico de alterações

---

## 📈 Métricas e KPIs

### Métricas de Negócio
- **Taxa de conversão atacado**: % vendas em atacado vs total
- **Ticket médio atacado vs varejo**: Comparação de valores
- **Margem de lucro por tipo**: Rentabilidade de cada canal
- **Produtos mais vendidos no atacado**: Top 10
- **Clientes atacadistas**: Lista de clientes recorrentes

### Métricas de Sistema
- **Tempo de resposta do cálculo**: < 100ms
- **Taxa de erro em cálculos**: 0%
- **Uso de preço atacado**: % produtos com atacado habilitado

---

## ✅ Critérios de Aceitação

### CA01 - Cadastro de Preços
- [ ] Produto pode ter preço de atacado opcional
- [ ] Validação: atacado < varejo < custo
- [ ] Quantidade mínima >= 2
- [ ] Interface mostra desconto percentual automaticamente

### CA02 - Seleção no PDV
- [ ] Toggle Varejo/Atacado visível e funcional
- [ ] Seleção persiste durante toda a venda
- [ ] Mudança de tipo recalcula preços do carrinho

### CA03 - Cálculo Automático
- [ ] Preço correto aplicado baseado em tipo + quantidade
- [ ] Alertas mostrados quando aplicável
- [ ] Economia calculada e exibida

### CA04 - Registro de Venda
- [ ] Tipo de venda salvo no banco
- [ ] Desconto total registrado
- [ ] Tipo de preço salvo por item

### CA05 - Relatórios
- [ ] Relatório separado por tipo de venda
- [ ] Métricas de comparação varejo vs atacado
- [ ] Exportação Excel/PDF funcional

### CA06 - Recibo
- [ ] Tipo de venda indicado claramente
- [ ] Economia mostrada (se atacado)
- [ ] Preços unitários corretos

---

## 🚀 Estimativa de Implementação

### Fase 1: Backend (2 dias)
- Migrations do banco de dados
- Procedures tRPC para CRUD de preços
- Lógica de cálculo de preço
- Validações e regras de negócio

### Fase 2: Frontend PDV (1 dia)
- Toggle de tipo de venda
- Cálculo automático no carrinho
- Alertas e validações
- Indicadores visuais

### Fase 3: Frontend Estoque (1 dia)
- Formulário com campos de atacado
- Atualização em massa
- Validações de interface

### Fase 4: Relatórios (1 dia)
- Relatório por tipo de venda
- Métricas e comparações
- Exportação

### Fase 5: Recibo e Testes (1 dia)
- Atualizar geração de recibo
- Testes unitários
- Testes de integração

**Total estimado: 6 dias úteis**

---

## 🎯 Próximos Passos

1. Validar escopo com stakeholders
2. Aprovar design de interface
3. Iniciar implementação fase 1 (Backend)
4. Testes em ambiente de homologação
5. Deploy em produção
6. Treinamento de usuários
7. Monitoramento de métricas

---

## 📝 Observações

- Sistema deve ser retrocompatível (produtos sem atacado continuam funcionando)
- Migração de dados não necessária (novos campos são opcionais)
- Performance deve ser mantida (cálculos em tempo real)
- Auditoria completa de alterações de preços
- Possibilidade de expansão futura (atacado por faixa de quantidade, descontos progressivos, etc)
