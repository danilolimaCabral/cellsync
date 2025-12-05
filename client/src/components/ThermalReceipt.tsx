// formatCurrency helper
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

interface ThermalReceiptProps {
  saleId: number;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cpf?: string;
  timestamp: Date;
  companyName?: string;
  companyDocument?: string;
  companyAddress?: string;
  companyPhone?: string;
  customerCpf?: string;
  customerCnpj?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
}

/**
 * Componente para renderizar recibo em formato de impressora térmica (80mm)
 * Otimizado para impressoras térmicas de cupom fiscal
 */
export const ThermalReceipt = ({
  saleId,
  customerName,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  cpf,
  timestamp,
  companyName = "LOJA PADRÃO",
  companyDocument = "00.000.000/0000-00",
  companyAddress = "",
  companyPhone = "",
  customerCpf,
  customerCnpj,
  customerAddress,
  customerPhone,
  customerEmail,
}: ThermalReceiptProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      dinheiro: "DINHEIRO",
      pix: "PIX",
      credito: "CARTÃO CRÉDITO",
      debito: "CARTÃO DÉBITO",
    };
    return methods[method] || method.toUpperCase();
  };

  return (
    <div
      id="thermal-receipt"
      style={{
        width: "80mm",
        fontFamily: "monospace",
        fontSize: "12px",
        lineHeight: "1.2",
        padding: "0",
        margin: "0",
        backgroundColor: "white",
        color: "black",
      }}
    >
      {/* Cabeçalho com Dados da Empresa */}
      <div style={{ textAlign: "center", marginBottom: "8px", borderBottom: "1px dashed #000", paddingBottom: "8px" }}>
        <div style={{ fontWeight: "bold", fontSize: "14px" }}>{companyName}</div>
        <div style={{ fontSize: "10px" }}>CNPJ: {companyDocument}</div>
        {companyAddress && <div style={{ fontSize: "9px", marginTop: "2px", wordBreak: "break-word" }}>{companyAddress}</div>}
        {companyPhone && <div style={{ fontSize: "9px" }}>Tel: {companyPhone}</div>}
        <div style={{ fontSize: "10px", marginTop: "4px" }}>NFC-e - CUPOM FISCAL</div>
      </div>

      {/* Informações da Venda */}
      <div style={{ marginBottom: "8px", fontSize: "11px" }}>
        <div>Cupom: {String(saleId).padStart(6, "0")}</div>
        <div>{formatDate(timestamp)}</div>
      </div>

      {/* Separador */}
      <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>

      {/* Dados do Cliente */}
      <div style={{ marginBottom: "8px", fontSize: "10px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>CLIENTE:</div>
        <div>{customerName}</div>
        {(customerCpf || customerCnpj) && (
          <div>{customerCpf ? `CPF: ${customerCpf}` : `CNPJ: ${customerCnpj}`}</div>
        )}
        {customerAddress && <div style={{ wordBreak: "break-word", marginTop: "2px" }}>{customerAddress}</div>}
        {customerPhone && <div>Tel: {customerPhone}</div>}
        {customerEmail && <div style={{ wordBreak: "break-word" }}>{customerEmail}</div>}
      </div>

      {/* Separador */}
      <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>

      {/* Itens */}
      <div style={{ marginBottom: "8px" }}>
        {items.map((item, index) => (
          <div key={index}>
            {/* Nome do Produto */}
            <div style={{ fontWeight: "bold", wordBreak: "break-word" }}>
              {item.name.substring(0, 40)}
            </div>

            {/* Quantidade x Preço = Subtotal */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span>{item.quantity}x {formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Separador */}
      <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>

      {/* Totalizações */}
      <div style={{ marginBottom: "8px", fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", color: "#d32f2f" }}>
            <span>Desconto:</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "13px",
            marginTop: "4px",
            borderTop: "1px dashed #000",
            paddingTop: "4px",
          }}
        >
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div style={{ marginBottom: "8px", fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Forma de Pagamento:</span>
          <span style={{ fontWeight: "bold" }}>{getPaymentMethodLabel(paymentMethod)}</span>
        </div>
      </div>

      {/* Separador */}
      <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}></div>

      {/* Rodapé */}
      <div style={{ textAlign: "center", fontSize: "10px", marginBottom: "4px" }}>
        <div>Obrigado pela compra!</div>
        <div style={{ marginTop: "4px" }}>Volte sempre!</div>
      </div>

      {/* Código de Barras (simulado) */}
      <div style={{ textAlign: "center", marginTop: "8px", fontSize: "9px" }}>
        <div style={{ fontFamily: "Arial, sans-serif", letterSpacing: "2px" }}>
          ||||| ||| |||| ||| |||||
        </div>
        <div>{String(saleId).padStart(12, "0")}</div>
      </div>
    </div>
  );
};

/**
 * Hook para imprimir o recibo em impressora térmica
 */
export const useThermalPrinter = () => {
  const printThermalReceipt = () => {
    const receiptElement = document.getElementById("thermal-receipt");
    if (!receiptElement) {
      console.error("Elemento de recibo não encontrado");
      return;
    }

    const printWindow = window.open("", "", "width=300,height=600");
    if (!printWindow) {
      console.error("Não foi possível abrir janela de impressão");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cupom Fiscal</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: monospace;
              width: 80mm;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${receiptElement.innerHTML}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Aguardar o carregamento do conteúdo
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return { printThermalReceipt };
};
