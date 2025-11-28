/**
 * Script para cadastrar todos os smartphones e tablets
 * Xiaomi, Samsung e LG
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products } from "../drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Função para gerar código de barras aleatório
function generateBarcode() {
  return Math.floor(Math.random() * 9000000000000) + 1000000000000;
}

// ============= XIAOMI =============

const xiaomiProducts = [
  // Linha Xiaomi 14
  { name: "Xiaomi 14", price: 450000, cost: 380000, desc: "Snapdragon 8 Gen 3, 8GB RAM, 256GB, Câmera 50MP Leica" },
  { name: "Xiaomi 14 Pro", price: 550000, cost: 470000, desc: "Snapdragon 8 Gen 3, 12GB RAM, 512GB, Câmera 50MP Leica tripla" },
  { name: "Xiaomi 14 Ultra", price: 750000, cost: 640000, desc: "Snapdragon 8 Gen 3, 16GB RAM, 512GB, Câmera 50MP Leica quad" },
  
  // Linha Xiaomi 13
  { name: "Xiaomi 13", price: 380000, cost: 320000, desc: "Snapdragon 8 Gen 2, 8GB RAM, 256GB, Câmera 50MP Leica" },
  { name: "Xiaomi 13 Pro", price: 480000, cost: 410000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 256GB, Câmera 50MP Leica tripla" },
  { name: "Xiaomi 13 Ultra", price: 650000, cost: 550000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 512GB, Câmera 50MP Leica quad" },
  { name: "Xiaomi 13T", price: 280000, cost: 240000, desc: "Dimensity 8200, 8GB RAM, 256GB, Câmera 50MP" },
  { name: "Xiaomi 13T Pro", price: 350000, cost: 300000, desc: "Dimensity 9200+, 12GB RAM, 512GB, Câmera 50MP Leica" },
  
  // Linha Xiaomi 12
  { name: "Xiaomi 12", price: 320000, cost: 270000, desc: "Snapdragon 8 Gen 1, 8GB RAM, 256GB, Câmera 50MP" },
  { name: "Xiaomi 12X", price: 280000, cost: 240000, desc: "Snapdragon 870, 8GB RAM, 256GB, Câmera 50MP" },
  { name: "Xiaomi 12 Pro", price: 420000, cost: 360000, desc: "Snapdragon 8 Gen 1, 12GB RAM, 256GB, Câmera 50MP tripla" },
  { name: "Xiaomi 12T", price: 250000, cost: 210000, desc: "Dimensity 8100, 8GB RAM, 128GB, Câmera 108MP" },
  { name: "Xiaomi 12T Pro", price: 320000, cost: 270000, desc: "Snapdragon 8+ Gen 1, 8GB RAM, 256GB, Câmera 200MP" },
  
  // POCO F Series
  { name: "POCO F4", price: 220000, cost: 185000, desc: "Snapdragon 870, 8GB RAM, 256GB, Câmera 64MP" },
  { name: "POCO F5", price: 260000, cost: 220000, desc: "Snapdragon 7+ Gen 2, 8GB RAM, 256GB, Câmera 64MP" },
  { name: "POCO F5 Pro", price: 320000, cost: 270000, desc: "Snapdragon 8+ Gen 1, 12GB RAM, 256GB, Câmera 64MP" },
  { name: "POCO F6", price: 300000, cost: 255000, desc: "Snapdragon 8s Gen 3, 12GB RAM, 256GB, Câmera 50MP" },
  { name: "POCO F6 Pro", price: 380000, cost: 320000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 512GB, Câmera 50MP" },
  
  // POCO X Series
  { name: "POCO X5", price: 150000, cost: 125000, desc: "Snapdragon 695, 6GB RAM, 128GB, Câmera 48MP" },
  { name: "POCO X5 Pro", price: 200000, cost: 170000, desc: "Snapdragon 778G, 8GB RAM, 256GB, Câmera 108MP" },
  { name: "POCO X6", price: 180000, cost: 150000, desc: "Snapdragon 7s Gen 2, 8GB RAM, 256GB, Câmera 64MP" },
  { name: "POCO X6 Pro", price: 250000, cost: 210000, desc: "Dimensity 8300 Ultra, 12GB RAM, 512GB, Câmera 64MP" },
  { name: "POCO X7", price: 200000, cost: 170000, desc: "Dimensity 7300, 8GB RAM, 256GB, Câmera 50MP" },
  { name: "POCO X7 Pro", price: 280000, cost: 240000, desc: "Dimensity 8400, 12GB RAM, 512GB, Câmera 50MP" },
  
  // POCO M Series
  { name: "POCO M5", price: 90000, cost: 75000, desc: "Helio G99, 4GB RAM, 128GB, Câmera 50MP" },
  { name: "POCO M5s", price: 110000, cost: 92000, desc: "Helio G95, 6GB RAM, 128GB, Câmera 64MP" },
  { name: "POCO M6", price: 100000, cost: 85000, desc: "Helio G91, 6GB RAM, 128GB, Câmera 50MP" },
  { name: "POCO M6 Pro", price: 130000, cost: 110000, desc: "Helio G99 Ultra, 8GB RAM, 256GB, Câmera 64MP" },
  { name: "POCO M6 4G", price: 95000, cost: 80000, desc: "Helio G91, 6GB RAM, 128GB, Câmera 50MP" },
  { name: "POCO M6 5G", price: 120000, cost: 100000, desc: "Dimensity 6100+, 6GB RAM, 128GB, Câmera 50MP" },
  
  // Redmi Note 13
  { name: "Redmi Note 13", price: 120000, cost: 100000, desc: "Snapdragon 685, 6GB RAM, 128GB, Câmera 108MP" },
  { name: "Redmi Note 13 5G", price: 140000, cost: 118000, desc: "Dimensity 6080, 8GB RAM, 256GB, Câmera 108MP" },
  { name: "Redmi Note 13 Pro", price: 180000, cost: 150000, desc: "Helio G99 Ultra, 8GB RAM, 256GB, Câmera 200MP" },
  { name: "Redmi Note 13 Pro 5G", price: 220000, cost: 185000, desc: "Snapdragon 7s Gen 2, 8GB RAM, 256GB, Câmera 200MP" },
  { name: "Redmi Note 13 Pro+ 5G", price: 260000, cost: 220000, desc: "Dimensity 7200 Ultra, 12GB RAM, 512GB, Câmera 200MP" },
  
  // Redmi Note 12
  { name: "Redmi Note 12", price: 110000, cost: 92000, desc: "Snapdragon 685, 4GB RAM, 128GB, Câmera 50MP" },
  { name: "Redmi Note 12 5G", price: 130000, cost: 110000, desc: "Snapdragon 4 Gen 1, 6GB RAM, 128GB, Câmera 48MP" },
  { name: "Redmi Note 12 Pro", price: 160000, cost: 135000, desc: "Dimensity 1080, 8GB RAM, 256GB, Câmera 50MP" },
  { name: "Redmi Note 12 Pro 5G", price: 190000, cost: 160000, desc: "Dimensity 1080, 8GB RAM, 256GB, Câmera 50MP OIS" },
  { name: "Redmi Note 12 Pro+ 5G", price: 230000, cost: 195000, desc: "Dimensity 1080, 8GB RAM, 256GB, Câmera 200MP" },
  
  // Redmi
  { name: "Redmi 12", price: 85000, cost: 70000, desc: "Helio G88, 4GB RAM, 128GB, Câmera 50MP" },
  { name: "Redmi 12 5G", price: 105000, cost: 88000, desc: "Snapdragon 4 Gen 2, 4GB RAM, 128GB, Câmera 50MP" },
  { name: "Redmi 12C", price: 75000, cost: 62000, desc: "Helio G85, 4GB RAM, 64GB, Câmera 50MP" },
  { name: "Redmi 13", price: 95000, cost: 80000, desc: "Helio G91 Ultra, 6GB RAM, 128GB, Câmera 108MP" },
  { name: "Redmi 13C", price: 80000, cost: 67000, desc: "Helio G85, 4GB RAM, 128GB, Câmera 50MP" },
  { name: "Redmi 13C 5G", price: 100000, cost: 85000, desc: "Dimensity 6100+, 4GB RAM, 128GB, Câmera 50MP" },
];

// ============= SAMSUNG =============

const samsungProducts = [
  // Galaxy S24 Series
  { name: "Samsung Galaxy S24", price: 480000, cost: 410000, desc: "Exynos 2400, 8GB RAM, 256GB, Câmera 50MP tripla, Galaxy AI" },
  { name: "Samsung Galaxy S24+", price: 580000, cost: 495000, desc: "Exynos 2400, 12GB RAM, 256GB, Câmera 50MP tripla, Galaxy AI" },
  { name: "Samsung Galaxy S24 Ultra", price: 850000, cost: 725000, desc: "Snapdragon 8 Gen 3, 12GB RAM, 512GB, Câmera 200MP quad, S Pen" },
  
  // Galaxy S23 Series
  { name: "Samsung Galaxy S23", price: 420000, cost: 360000, desc: "Snapdragon 8 Gen 2, 8GB RAM, 256GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy S23+", price: 520000, cost: 445000, desc: "Snapdragon 8 Gen 2, 8GB RAM, 256GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy S23 Ultra", price: 750000, cost: 640000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 512GB, Câmera 200MP quad, S Pen" },
  { name: "Samsung Galaxy S23 FE", price: 350000, cost: 300000, desc: "Exynos 2200, 8GB RAM, 256GB, Câmera 50MP tripla" },
  
  // Galaxy S22 Series
  { name: "Samsung Galaxy S22", price: 360000, cost: 305000, desc: "Snapdragon 8 Gen 1, 8GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy S22+", price: 450000, cost: 385000, desc: "Snapdragon 8 Gen 1, 8GB RAM, 256GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy S22 Ultra", price: 650000, cost: 555000, desc: "Snapdragon 8 Gen 1, 12GB RAM, 512GB, Câmera 108MP quad, S Pen" },
  
  // Galaxy Z Fold
  { name: "Samsung Galaxy Z Fold 4", price: 850000, cost: 725000, desc: "Snapdragon 8+ Gen 1, 12GB RAM, 512GB, Tela dobrável 7.6\"" },
  { name: "Samsung Galaxy Z Fold 5", price: 950000, cost: 810000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 512GB, Tela dobrável 7.6\"" },
  { name: "Samsung Galaxy Z Fold 6", price: 1100000, cost: 940000, desc: "Snapdragon 8 Gen 3, 12GB RAM, 512GB, Tela dobrável 7.6\" Galaxy AI" },
  
  // Galaxy Z Flip
  { name: "Samsung Galaxy Z Flip 4", price: 550000, cost: 470000, desc: "Snapdragon 8+ Gen 1, 8GB RAM, 256GB, Tela dobrável 6.7\"" },
  { name: "Samsung Galaxy Z Flip 5", price: 650000, cost: 555000, desc: "Snapdragon 8 Gen 2, 8GB RAM, 256GB, Tela dobrável 6.7\"" },
  { name: "Samsung Galaxy Z Flip 6", price: 750000, cost: 640000, desc: "Snapdragon 8 Gen 3, 12GB RAM, 512GB, Tela dobrável 6.7\" Galaxy AI" },
  
  // Galaxy A Series
  { name: "Samsung Galaxy A55", price: 280000, cost: 240000, desc: "Exynos 1480, 8GB RAM, 256GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A35", price: 220000, cost: 185000, desc: "Exynos 1380, 8GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A25", price: 160000, cost: 135000, desc: "Exynos 1280, 6GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A15", price: 120000, cost: 100000, desc: "Helio G99, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A15 5G", price: 140000, cost: 118000, desc: "Dimensity 6100+, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A05", price: 75000, cost: 62000, desc: "Helio G85, 4GB RAM, 64GB, Câmera 50MP dual" },
  { name: "Samsung Galaxy A05s", price: 90000, cost: 75000, desc: "Snapdragon 680, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A14", price: 110000, cost: 92000, desc: "Exynos 850, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A14 5G", price: 130000, cost: 110000, desc: "Dimensity 700, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A24", price: 150000, cost: 125000, desc: "Helio G99, 6GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy A34", price: 200000, cost: 170000, desc: "Dimensity 1080, 8GB RAM, 256GB, Câmera 48MP tripla" },
  { name: "Samsung Galaxy A54", price: 250000, cost: 210000, desc: "Exynos 1380, 8GB RAM, 256GB, Câmera 50MP tripla" },
  
  // Galaxy M Series
  { name: "Samsung Galaxy M14", price: 115000, cost: 97000, desc: "Exynos 1330, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy M15", price: 135000, cost: 113000, desc: "Dimensity 6100+, 6GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy M34", price: 180000, cost: 150000, desc: "Exynos 1280, 8GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy M54", price: 230000, cost: 195000, desc: "Exynos 1380, 8GB RAM, 256GB, Câmera 108MP tripla" },
  
  // Galaxy F Series
  { name: "Samsung Galaxy F14", price: 110000, cost: 92000, desc: "Exynos 1330, 4GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy F15", price: 130000, cost: 110000, desc: "Dimensity 6100+, 6GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy F34", price: 175000, cost: 147000, desc: "Exynos 1280, 8GB RAM, 128GB, Câmera 50MP tripla" },
  { name: "Samsung Galaxy F54", price: 225000, cost: 190000, desc: "Exynos 1380, 8GB RAM, 256GB, Câmera 108MP tripla" },
  
  // Galaxy Tab S9 Series
  { name: "Samsung Galaxy Tab S9", price: 480000, cost: 410000, desc: "Snapdragon 8 Gen 2, 8GB RAM, 128GB, Tela 11\" AMOLED, S Pen" },
  { name: "Samsung Galaxy Tab S9+", price: 650000, cost: 555000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 256GB, Tela 12.4\" AMOLED, S Pen" },
  { name: "Samsung Galaxy Tab S9 Ultra", price: 950000, cost: 810000, desc: "Snapdragon 8 Gen 2, 12GB RAM, 512GB, Tela 14.6\" AMOLED, S Pen" },
  { name: "Samsung Galaxy Tab S9 FE", price: 320000, cost: 270000, desc: "Exynos 1380, 6GB RAM, 128GB, Tela 10.9\" LCD, S Pen" },
  { name: "Samsung Galaxy Tab S9 FE+", price: 420000, cost: 360000, desc: "Exynos 1380, 8GB RAM, 256GB, Tela 12.4\" LCD, S Pen" },
  
  // Galaxy Tab S8 Series
  { name: "Samsung Galaxy Tab S8", price: 420000, cost: 360000, desc: "Snapdragon 8 Gen 1, 8GB RAM, 128GB, Tela 11\" AMOLED, S Pen" },
  { name: "Samsung Galaxy Tab S8+", price: 580000, cost: 495000, desc: "Snapdragon 8 Gen 1, 8GB RAM, 256GB, Tela 12.4\" AMOLED, S Pen" },
  { name: "Samsung Galaxy Tab S8 Ultra", price: 850000, cost: 725000, desc: "Snapdragon 8 Gen 1, 12GB RAM, 512GB, Tela 14.6\" AMOLED, S Pen" },
  
  // Galaxy Tab A Series
  { name: "Samsung Galaxy Tab A9", price: 120000, cost: 100000, desc: "Helio G99, 4GB RAM, 64GB, Tela 8.7\" LCD" },
  { name: "Samsung Galaxy Tab A9+", price: 160000, cost: 135000, desc: "Snapdragon 695, 4GB RAM, 64GB, Tela 11\" LCD" },
  { name: "Samsung Galaxy Tab A7 Lite", price: 95000, cost: 80000, desc: "Helio P22T, 3GB RAM, 32GB, Tela 8.7\" LCD" },
  
  // Galaxy Tab Active
  { name: "Samsung Galaxy Tab Active 4 Pro", price: 650000, cost: 555000, desc: "Snapdragon 778G, 6GB RAM, 128GB, Tela 10.1\" resistente, S Pen" },
];

// ============= LG =============

const lgProducts = [
  // Flagship Series
  { name: "LG Wing", price: 380000, cost: 320000, desc: "Snapdragon 765G, 8GB RAM, 256GB, Tela giratória dupla 6.8\" + 3.9\"" },
  { name: "LG Velvet", price: 280000, cost: 240000, desc: "Snapdragon 765G, 6GB RAM, 128GB, Câmera 48MP tripla" },
  
  // G Series
  { name: "LG G8 ThinQ", price: 320000, cost: 270000, desc: "Snapdragon 855, 6GB RAM, 128GB, Câmera 12MP dual, Hand ID" },
  { name: "LG G8S ThinQ", price: 300000, cost: 255000, desc: "Snapdragon 855, 6GB RAM, 128GB, Câmera 13MP tripla" },
  { name: "LG G7 ThinQ", price: 260000, cost: 220000, desc: "Snapdragon 845, 4GB RAM, 64GB, Câmera 16MP dual" },
  
  // V Series
  { name: "LG V60 ThinQ", price: 420000, cost: 360000, desc: "Snapdragon 865, 8GB RAM, 128GB, Câmera 64MP tripla, Dual Screen" },
  { name: "LG V50 ThinQ", price: 350000, cost: 300000, desc: "Snapdragon 855, 6GB RAM, 128GB, Câmera 12MP tripla, 5G" },
  { name: "LG V40 ThinQ", price: 300000, cost: 255000, desc: "Snapdragon 845, 6GB RAM, 128GB, Câmera 12MP tripla" },
  { name: "LG V35 ThinQ", price: 280000, cost: 240000, desc: "Snapdragon 845, 6GB RAM, 64GB, Câmera 16MP dual" },
  { name: "LG V30", price: 250000, cost: 210000, desc: "Snapdragon 835, 4GB RAM, 64GB, Câmera 16MP dual" },
  { name: "LG V30+", price: 270000, cost: 230000, desc: "Snapdragon 835, 4GB RAM, 128GB, Câmera 16MP dual" },
  
  // K Series
  { name: "LG K22", price: 85000, cost: 70000, desc: "Helio P35, 2GB RAM, 32GB, Câmera 13MP dual" },
  { name: "LG K41S", price: 105000, cost: 88000, desc: "Helio P60, 3GB RAM, 32GB, Câmera 13MP quad" },
  { name: "LG K42", price: 110000, cost: 92000, desc: "Helio P22, 3GB RAM, 64GB, Câmera 13MP quad" },
  { name: "LG K50", price: 95000, cost: 80000, desc: "Helio P22, 3GB RAM, 32GB, Câmera 13MP dual" },
  { name: "LG K51S", price: 115000, cost: 97000, desc: "Helio P35, 3GB RAM, 64GB, Câmera 32MP quad" },
  { name: "LG K52", price: 125000, cost: 105000, desc: "Helio P35, 4GB RAM, 64GB, Câmera 48MP quad" },
  { name: "LG K61", price: 135000, cost: 113000, desc: "Helio P35, 4GB RAM, 128GB, Câmera 48MP quad" },
  { name: "LG K62", price: 145000, cost: 122000, desc: "Helio P35, 4GB RAM, 128GB, Câmera 48MP quad" },
  { name: "LG K62+", price: 160000, cost: 135000, desc: "Helio P35, 6GB RAM, 128GB, Câmera 48MP quad" },
  { name: "LG K71", price: 175000, cost: 147000, desc: "Helio P35, 6GB RAM, 128GB, Câmera 48MP quad" },
  
  // Q Series
  { name: "LG Q6", price: 90000, cost: 75000, desc: "Snapdragon 435, 3GB RAM, 32GB, Câmera 13MP" },
  { name: "LG Q7", price: 105000, cost: 88000, desc: "Snapdragon 450, 3GB RAM, 32GB, Câmera 13MP" },
  { name: "LG Q7+", price: 120000, cost: 100000, desc: "Snapdragon 450, 4GB RAM, 64GB, Câmera 16MP" },
  { name: "LG Q Stylo 4", price: 115000, cost: 97000, desc: "Snapdragon 450, 3GB RAM, 32GB, Câmera 13MP, Stylus" },
  { name: "LG Q Stylo 5", price: 130000, cost: 110000, desc: "Snapdragon 450, 3GB RAM, 32GB, Câmera 13MP, Stylus" },
  
  // Tablets G Pad
  { name: "LG G Pad 5 10.1", price: 180000, cost: 150000, desc: "Snapdragon 821, 4GB RAM, 32GB, Tela 10.1\" Full HD" },
  { name: "LG G Pad X 8.0", price: 120000, cost: 100000, desc: "Snapdragon 617, 2GB RAM, 32GB, Tela 8\" Full HD" },
  { name: "LG G Pad X 10.1", price: 150000, cost: 125000, desc: "Snapdragon 800, 2GB RAM, 32GB, Tela 10.1\" Full HD" },
  { name: "LG G Pad III 8.0", price: 135000, cost: 113000, desc: "Snapdragon 617, 2GB RAM, 16GB, Tela 8\" WXGA" },
  { name: "LG G Pad III 10.1", price: 165000, cost: 138000, desc: "Snapdragon 617, 2GB RAM, 32GB, Tela 10.1\" Full HD" },
  { name: "LG G Pad II 8.0", price: 125000, cost: 105000, desc: "Snapdragon 615, 2GB RAM, 16GB, Tela 8\" WXGA" },
  { name: "LG G Pad II 10.1", price: 155000, cost: 130000, desc: "Snapdragon 800, 2GB RAM, 16GB, Tela 10.1\" Full HD" },
];

// ============= CADASTRAR PRODUTOS =============

async function cadastrarProdutos() {
  console.log("🚀 Iniciando cadastro de produtos...\n");
  
  let sucessos = 0;
  let erros = 0;
  let duplicados = 0;
  
  const allProducts = [
    ...xiaomiProducts.map(p => ({ ...p, brand: "Xiaomi", category: "Smartphone" })),
    ...samsungProducts.map(p => ({ 
      ...p, 
      brand: "Samsung", 
      category: p.name.includes("Tab") ? "Tablet" : "Smartphone" 
    })),
    ...lgProducts.map(p => ({ 
      ...p, 
      brand: "LG", 
      category: p.name.includes("Pad") ? "Tablet" : "Smartphone" 
    })),
  ];
  
  console.log(`📊 Total de produtos a cadastrar: ${allProducts.length}\n`);
  
  for (const product of allProducts) {
    try {
      // Gerar SKU curto (máximo 100 caracteres)
      const brandCode = product.brand.substring(0, 3).toUpperCase();
      const modelCode = product.name
        .replace(/Samsung|Galaxy|Xiaomi|Redmi|POCO|LG|Tab|Pad/gi, "")
        .replace(/\s+/g, "")
        .substring(0, 20)
        .toUpperCase();
      const sku = `${brandCode}-${modelCode}-${Date.now().toString().substring(8)}`;
      const barcode = generateBarcode().toString();
      
      await db.insert(products).values({
        name: product.name,
        description: product.desc,
        sku: sku,
        barcode: barcode,
        category: product.category,
        brand: product.brand,
        model: sku,
        costPrice: product.cost,
        salePrice: product.price,
        currentStock: 0,
        minStock: 5,
        active: true,
        requiresImei: product.category === "Smartphone",
      });
      
      sucessos++;
      console.log(`✅ ${product.brand} ${product.name} - R$ ${(product.price / 100).toFixed(2)}`);
      
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        duplicados++;
        console.log(`⚠️  ${product.brand} ${product.name} - Já cadastrado`);
      } else {
        erros++;
        console.error(`❌ Erro ao cadastrar ${product.brand} ${product.name}:`, error.message);
      }
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 RESUMO DO CADASTRO:`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`⚠️  Duplicados: ${duplicados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📦 Total processado: ${sucessos + duplicados + erros}`);
  console.log("\n" + "=".repeat(60));
}

// Executar
cadastrarProdutos()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });
