import { generateFiscalReceipt, generatePrintFile } from './server/fiscal-printer.ts';

// Dados de teste de uma venda
const saleData = {
  id: 150002,
  saleDate: new Date('2025-12-02T01:52:39.000Z'),
  items: [
    {
      productName: 'iPhone 15 Pro Max 256GB',
      quantity: 1,
      unitPrice: 760000, // R$ 7.600,00
      totalPrice: 760000
    },
    {
      productName: 'Capinha Silicone Transparente',
      quantity: 2,
      unitPrice: 3500, // R$ 35,00
      totalPrice: 7000
    },
    {
      productName: 'Película de Vidro 3D',
      quantity: 1,
      unitPrice: 5000, // R$ 50,00
      totalPrice: 5000
    }
  ],
  subtotal: 772000,
  discount: 12000, // R$ 120,00 de desconto
  totalAmount: 760000,
  paymentMethod: 'credito',
  customerName: 'João da Silva',
  customerDocument: '12345678900',
  sellerName: 'Maria Vendedora',
  tenantName: 'CellSync Loja Centro',
  tenantDocument: '12345678000190',
  tenantAddress: 'Rua das Flores, 123 - Centro - São Paulo/SP'
};

const options = {
  paperWidth: 80,
  includeQRCode: true
};

console.log('🧾 Testando geração de cupom fiscal...\n');
console.log('📋 Dados da venda:');
console.log(`   ID: ${saleData.id}`);
console.log(`   Cliente: ${saleData.customerName}`);
console.log(`   Vendedor: ${saleData.sellerName}`);
console.log(`   Total: R$ ${(saleData.totalAmount / 100).toFixed(2)}`);
console.log(`   Itens: ${saleData.items.length}`);
console.log('');

try {
  // Gerar cupom fiscal
  const receipt = generateFiscalReceipt(saleData, options);
  
  console.log('✅ Cupom fiscal gerado com sucesso!');
  console.log(`   Tamanho: ${receipt.length} bytes`);
  console.log('');
  
  // Verificar comandos ESC/POS
  const hasInit = receipt.includes('\x1B@');
  const hasCenter = receipt.includes('\x1Ba\x01');
  const hasBold = receipt.includes('\x1BE\x01');
  const hasCut = receipt.includes('\x1DV');
  
  console.log('🔍 Comandos ESC/POS detectados:');
  console.log(`   INIT (inicialização): ${hasInit ? '✓' : '✗'}`);
  console.log(`   ALIGN_CENTER: ${hasCenter ? '✓' : '✗'}`);
  console.log(`   BOLD: ${hasBold ? '✓' : '✗'}`);
  console.log(`   CUT (corte): ${hasCut ? '✓' : '✗'}`);
  console.log('');
  
  // Verificar conteúdo
  const hasCompanyName = receipt.includes('CellSync');
  const hasCupomNumber = receipt.includes('#150002');
  const hasItems = receipt.includes('iPhone');
  const hasTotal = receipt.includes('TOTAL:');
  const hasPayment = receipt.includes('Pagamento:');
  
  console.log('📄 Conteúdo do cupom:');
  console.log(`   Nome da empresa: ${hasCompanyName ? '✓' : '✗'}`);
  console.log(`   Número do cupom: ${hasCupomNumber ? '✓' : '✗'}`);
  console.log(`   Itens da venda: ${hasItems ? '✓' : '✗'}`);
  console.log(`   Total: ${hasTotal ? '✓' : '✗'}`);
  console.log(`   Forma de pagamento: ${hasPayment ? '✓' : '✗'}`);
  console.log('');
  
  // Gerar arquivo para impressão
  const printFile = generatePrintFile(saleData, options);
  console.log('💾 Arquivo de impressão gerado:');
  console.log(`   Tamanho: ${printFile.length} bytes`);
  console.log(`   Tipo: Buffer binário`);
  console.log('');
  
  // Mostrar preview do cupom (sem comandos de controle)
  console.log('👁️  Preview do cupom (texto legível):');
  console.log('━'.repeat(50));
  const preview = receipt
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove comandos de controle
    .split('\n')
    .filter(line => line.trim())
    .join('\n');
  console.log(preview);
  console.log('━'.repeat(50));
  console.log('');
  
  console.log('✅ Teste concluído com sucesso!');
  console.log('');
  console.log('📝 Próximos passos:');
  console.log('   1. Conectar impressora térmica via USB');
  console.log('   2. Enviar arquivo .prn para a impressora');
  console.log('   3. Verificar impressão física do cupom');
  
} catch (error) {
  console.error('❌ Erro ao gerar cupom:', error.message);
  process.exit(1);
}
