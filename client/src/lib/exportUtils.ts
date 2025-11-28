import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

export const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
};

// ============= EXPORTAÇÃO PARA EXCEL =============

export const exportToExcel = (data: any[], filename: string, sheetName: string = "Dados") => {
  try {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Criar worksheet a partir dos dados
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Gerar arquivo
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    return false;
  }
};

// ============= EXPORTAÇÃO PARA PDF =============

export const exportToPDF = (
  title: string,
  headers: string[],
  data: any[][],
  filename: string,
  orientation: "portrait" | "landscape" = "portrait"
) => {
  try {
    // Criar documento PDF
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    // Adicionar título
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Adicionar data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 22);

    // Adicionar tabela
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Azul
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
    });

    // Salvar arquivo
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error("Erro ao exportar para PDF:", error);
    return false;
  }
};

// ============= EXPORTAÇÕES ESPECÍFICAS =============

export const exportSalesReport = (salesData: any[], period: string) => {
  const excelData = salesData.map((sale) => ({
    Data: formatDate(sale.saleDate || sale.createdAt),
    Cliente: sale.customerName || "Cliente não identificado",
    Vendedor: sale.sellerName || "N/A",
    "Valor Total": formatCurrency(sale.finalAmount || sale.totalAmount),
    "Forma de Pagamento": sale.paymentMethod || "N/A",
    Status: sale.status,
  }));

  const pdfData = salesData.map((sale) => [
    formatDate(sale.saleDate || sale.createdAt),
    sale.customerName || "Cliente não identificado",
    sale.sellerName || "N/A",
    formatCurrency(sale.finalAmount || sale.totalAmount),
    sale.paymentMethod || "N/A",
    sale.status,
  ]);

  const headers = ["Data", "Cliente", "Vendedor", "Valor Total", "Pagamento", "Status"];

  return {
    toExcel: () => exportToExcel(excelData, `relatorio-vendas-${period}`, "Vendas"),
    toPDF: () =>
      exportToPDF(
        `Relatório de Vendas - ${period}`,
        headers,
        pdfData,
        `relatorio-vendas-${period}`,
        "landscape"
      ),
  };
};

export const exportProductsReport = (productsData: any[], period: string) => {
  const excelData = productsData.map((product) => ({
    Produto: product.productName || product.name,
    Quantidade: product.quantity || product.currentStock,
    Receita: formatCurrency(product.revenue || product.salePrice * (product.quantity || product.currentStock)),
    "Preço Unitário": formatCurrency(product.unitPrice || product.salePrice),
  }));

  const pdfData = productsData.map((product) => [
    product.productName || product.name,
    String(product.quantity || product.currentStock),
    formatCurrency(product.revenue || product.salePrice * (product.quantity || product.currentStock)),
    formatCurrency(product.unitPrice || product.salePrice),
  ]);

  const headers = ["Produto", "Quantidade", "Receita", "Preço Unitário"];

  return {
    toExcel: () => exportToExcel(excelData, `relatorio-produtos-${period}`, "Produtos"),
    toPDF: () =>
      exportToPDF(
        `Relatório de Produtos - ${period}`,
        headers,
        pdfData,
        `relatorio-produtos-${period}`,
        "portrait"
      ),
  };
};

export const exportFinancialReport = (financialData: any, period: string) => {
  const excelData = [
    {
      Métrica: "Receitas Totais",
      Valor: formatCurrency(financialData.totalRevenue || 0),
    },
    {
      Métrica: "Despesas Totais",
      Valor: formatCurrency(financialData.totalExpenses || 0),
    },
    {
      Métrica: "Lucro Líquido",
      Valor: formatCurrency(financialData.netProfit || 0),
    },
    {
      Métrica: "Margem de Lucro",
      Valor: `${financialData.profitMargin?.toFixed(2) || 0}%`,
    },
  ];

  const pdfData = excelData.map((item) => [item.Métrica, item.Valor]);

  const headers = ["Métrica", "Valor"];

  return {
    toExcel: () => exportToExcel(excelData, `relatorio-financeiro-${period}`, "Financeiro"),
    toPDF: () =>
      exportToPDF(
        `Relatório Financeiro - ${period}`,
        headers,
        pdfData,
        `relatorio-financeiro-${period}`,
        "portrait"
      ),
  };
};

export const exportInventoryReport = (inventoryData: any[]) => {
  const excelData = inventoryData.map((item) => ({
    Produto: item.name,
    SKU: item.sku || "N/A",
    "Estoque Atual": item.currentStock,
    "Estoque Mínimo": item.minStock,
    "Preço de Custo": formatCurrency(item.costPrice),
    "Preço de Venda": formatCurrency(item.salePrice),
    Status: item.currentStock <= item.minStock ? "Baixo" : "Normal",
  }));

  const pdfData = inventoryData.map((item) => [
    item.name,
    item.sku || "N/A",
    String(item.currentStock),
    String(item.minStock),
    formatCurrency(item.costPrice),
    formatCurrency(item.salePrice),
    item.currentStock <= item.minStock ? "Baixo" : "Normal",
  ]);

  const headers = ["Produto", "SKU", "Estoque Atual", "Estoque Mínimo", "Custo", "Venda", "Status"];

  return {
    toExcel: () => exportToExcel(excelData, "relatorio-estoque", "Estoque"),
    toPDF: () =>
      exportToPDF("Relatório de Estoque", headers, pdfData, "relatorio-estoque", "landscape"),
  };
};
