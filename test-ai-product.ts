import { analyzeProductWithAI } from './server/ai-product-assistant';

async function testAI() {
  console.log('🤖 Testando IA de Análise de Produtos\n');
  console.log('═══════════════════════════════════════\n');

  const productName = 'Notebook Dell Inspiron 15 5000';

  console.log(`📦 Produto: "${productName}"\n`);
  console.log('⏳ Analisando com IA...\n');

  try {
    const result = await analyzeProductWithAI(productName);
    
    console.log('✅ Análise Concluída!\n');
    console.log('═══════════════════════════════════════\n');
    console.log(`📋 Marca: ${result.brand || '(não identificada)'}`);
    console.log(`📱 Modelo: ${result.model || '(não identificado)'}`);
    console.log(`🏷️  Categoria: ${result.category}`);
    console.log(`📊 Confiança: ${result.confidence}`);
    console.log(`💡 Sugestões: ${result.suggestions || 'Nenhuma'}`);
    console.log('\n═══════════════════════════════════════\n');
    
    // Testar mais exemplos
    const examples = [
      'iPhone 14 Pro Max 256GB',
      'Samsung Galaxy S23 Ultra',
      'Xiaomi Redmi Note 12 Pro',
      'Carregador USB-C 20W',
      'Fone JBL Tune 510BT',
      'Película de Vidro Temperado'
    ];
    
    console.log('📚 Testando mais exemplos:\n');
    
    for (const example of examples) {
      const res = await analyzeProductWithAI(example);
      console.log(`• ${example}`);
      console.log(`  → Marca: ${res.brand || '-'} | Categoria: ${res.category} | Confiança: ${res.confidence}\n`);
    }
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }
}

testAI();
