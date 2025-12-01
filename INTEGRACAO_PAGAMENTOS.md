# Integração de Gateways de Pagamento - CellSync

## 📋 Resumo Executivo

Este documento descreve a integração de gateways de pagamento (Mercado Pago, PagSeguro) no sistema CellSync para aceitar **cartão de crédito/débito** e **PIX** automaticamente.

---

## 🎯 Objetivo

Permitir que o sistema CellSync processe pagamentos automaticamente através de:
- **PIX** (QR Code e Copia e Cola)
- **Cartão de Crédito** (parcelado)
- **Cartão de Débito**

---

## 🔧 Gateways Suportados

### 1. **Mercado Pago** (Recomendado)
- ✅ PIX instantâneo
- ✅ Cartão de crédito (até 12x)
- ✅ Cartão de débito
- ✅ Taxa: 4,99% + R$ 0,40 por transação
- ✅ Recebimento: D+14 ou D+30
- ✅ SDK JavaScript oficial
- ✅ Documentação completa em português

### 2. **PagSeguro** (Alternativa)
- ✅ PIX instantâneo
- ✅ Cartão de crédito (até 18x)
- ✅ Boleto bancário
- ✅ Taxa: 4,99% + R$ 0,40 por transação
- ✅ Recebimento: D+14 ou D+30

---

## 📦 Arquitetura da Integração

```
┌─────────────────┐
│   Frontend      │
│   (PDV)         │
│                 │
│ - Seleção de    │
│   método        │
│ - Formulário    │
│   de pagamento  │
│ - QR Code PIX   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │
│   (tRPC)        │
│                 │
│ - Criar         │
│   pagamento     │
│ - Webhook       │
│ - Validação     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mercado Pago   │
│  API            │
│                 │
│ - Processar     │
│   pagamento     │
│ - Notificar     │
│   status        │
└─────────────────┘
```

---

## 🔑 Credenciais Necessárias

### Mercado Pago

**1. Public Key** (Frontend)
```
TEST-xxx-xxx-xxx (Sandbox)
APP_USR-xxx-xxx-xxx (Produção)
```

**2. Access Token** (Backend)
```
TEST-xxx-xxx-xxx (Sandbox)
APP_USR-xxx-xxx-xxx (Produção)
```

**Como obter:**
1. Criar conta em https://www.mercadopago.com.br
2. Acessar https://www.mercadopago.com.br/developers/panel
3. Criar aplicação
4. Copiar credenciais de teste/produção

---

## 💻 Implementação

### Fase 1: Backend (Server-side)

**Arquivo:** `server/payment-gateway.ts`

```typescript
import axios from 'axios';

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

export interface CreatePaymentInput {
  amount: number;
  paymentMethod: 'pix' | 'credit_card' | 'debit_card';
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    identification: {
      type: string;
      number: string;
    };
  };
  description: string;
  saleId: number;
}

export interface PaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  statusDetail: string;
  qrCode?: string; // Para PIX
  qrCodeBase64?: string; // Para PIX
  ticketUrl?: string; // Para PIX
  transactionId?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<PaymentResponse> {
  const response = await axios.post(
    'https://api.mercadopago.com/v1/payments',
    {
      transaction_amount: input.amount,
      payment_method_id: input.paymentMethod === 'pix' ? 'pix' : input.paymentMethod,
      payer: {
        email: input.payer.email,
        first_name: input.payer.firstName,
        last_name: input.payer.lastName,
        identification: {
          type: input.payer.identification.type,
          number: input.payer.identification.number,
        },
      },
      description: input.description,
      external_reference: `sale_${input.saleId}`,
    },
    {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${input.saleId}_${Date.now()}`,
      },
    }
  );

  const payment = response.data;

  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
    ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url,
    transactionId: payment.point_of_interaction?.transaction_data?.transaction_id,
  };
}

export async function getPaymentStatus(paymentId: number): Promise<PaymentResponse> {
  const response = await axios.get(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    }
  );

  const payment = response.data;

  return {
    id: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    transactionId: payment.transaction_details?.transaction_id,
  };
}
```

---

### Fase 2: Frontend (Client-side)

**Arquivo:** `client/src/pages/Vendas.tsx`

Adicionar seção de pagamento:

```tsx
// Adicionar ao estado
const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit_card' | 'debit_card'>('cash');
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [qrCodePix, setQrCodePix] = useState<string | null>(null);

// Adicionar mutation de pagamento
const createPaymentMutation = trpc.payments.create.useMutation({
  onSuccess: (data) => {
    if (data.qrCodeBase64) {
      setQrCodePix(data.qrCodeBase64);
      setShowPaymentModal(true);
    }
    toast.success('Pagamento iniciado!');
  },
  onError: (error) => {
    toast.error(`Erro ao processar pagamento: ${error.message}`);
  },
});

// Adicionar UI de seleção de método
<div className="space-y-4">
  <label className="block text-sm font-medium">Método de Pagamento</label>
  <div className="grid grid-cols-2 gap-4">
    <Button
      type="button"
      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
      onClick={() => setPaymentMethod('cash')}
    >
      💵 Dinheiro
    </Button>
    <Button
      type="button"
      variant={paymentMethod === 'pix' ? 'default' : 'outline'}
      onClick={() => setPaymentMethod('pix')}
    >
      🔲 PIX
    </Button>
    <Button
      type="button"
      variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
      onClick={() => setPaymentMethod('credit_card')}
    >
      💳 Crédito
    </Button>
    <Button
      type="button"
      variant={paymentMethod === 'debit_card' ? 'default' : 'outline'}
      onClick={() => setPaymentMethod('debit_card')}
    >
      💳 Débito
    </Button>
  </div>
</div>

// Modal de QR Code PIX
{showPaymentModal && qrCodePix && (
  <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Pagamento via PIX</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center space-y-4">
        <img 
          src={`data:image/png;base64,${qrCodePix}`} 
          alt="QR Code PIX"
          className="w-64 h-64"
        />
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code com o app do seu banco
        </p>
        <Button onClick={() => setShowPaymentModal(false)}>
          Fechar
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}
```

---

### Fase 3: Webhook (Notificações)

**Arquivo:** `server/webhooks.ts`

```typescript
import express from 'express';
import { db } from './db';

export const webhookRouter = express.Router();

webhookRouter.post('/mercadopago', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    
    // Buscar status do pagamento
    const payment = await getPaymentStatus(paymentId);
    
    if (payment.status === 'approved') {
      // Atualizar venda como paga
      await db.updateSalePaymentStatus(payment.id, 'paid');
    }
  }

  res.status(200).send('OK');
});
```

---

## 📝 Checklist de Implementação

### Backend
- [ ] Criar `server/payment-gateway.ts`
- [ ] Adicionar variáveis de ambiente (MERCADOPAGO_ACCESS_TOKEN)
- [ ] Criar endpoints tRPC (payments.create, payments.getStatus)
- [ ] Implementar webhook `/api/webhooks/mercadopago`
- [ ] Adicionar campo `paymentMethod` na tabela `sales`
- [ ] Adicionar campo `paymentStatus` na tabela `sales`
- [ ] Criar tabela `payments` para rastrear transações

### Frontend
- [ ] Adicionar SDK MercadoPago.js no `index.html`
- [ ] Criar componente de seleção de método de pagamento
- [ ] Criar modal de QR Code PIX
- [ ] Criar formulário de cartão de crédito
- [ ] Integrar com mutation de pagamento
- [ ] Adicionar loading states
- [ ] Adicionar tratamento de erros

### Testes
- [ ] Testar pagamento PIX (sandbox)
- [ ] Testar pagamento cartão de crédito (sandbox)
- [ ] Testar webhook de aprovação
- [ ] Testar webhook de rejeição
- [ ] Testar timeout de pagamento PIX (24h)

---

## ⚠️ Considerações Importantes

1. **Credenciais**: Nunca commitar credenciais no código. Usar variáveis de ambiente.
2. **Webhook**: Configurar URL pública para receber notificações (usar ngrok em dev).
3. **Idempotência**: Usar X-Idempotency-Key para evitar pagamentos duplicados.
4. **Timeout PIX**: Por padrão, PIX expira em 24h. Pode ser configurado entre 30min e 30 dias.
5. **Taxas**: Verificar taxas atuais no painel do Mercado Pago.
6. **Certificação PCI DSS**: Não armazenar dados de cartão no banco de dados.

---

## 🚀 Próximos Passos

1. **Obter credenciais** do Mercado Pago (sandbox primeiro)
2. **Implementar backend** (payment-gateway.ts + tRPC endpoints)
3. **Implementar frontend** (UI de seleção + modal PIX)
4. **Configurar webhook** (ngrok para testes)
5. **Testar fluxo completo** (sandbox)
6. **Migrar para produção** (credenciais reais)

---

## 📚 Referências

- [Mercado Pago - Checkout API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing)
- [Mercado Pago - PIX](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/integrate-with-pix)
- [Mercado Pago - Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [PagSeguro - API](https://dev.pagseguro.uol.com.br/reference/api-de-pagamentos)

---

**Status:** Documentação completa ✅  
**Implementação:** Pendente (requer credenciais do usuário)
