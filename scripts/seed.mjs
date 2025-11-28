import { drizzle } from "drizzle-orm/mysql2";
import { products, customers, users } from "../drizzle/schema.js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // Criar usuário admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      email: "admin@okcells.com",
      password: hashedPassword,
      name: "Administrador",
      role: "admin",
      active: true,
    });
    console.log("✅ Usuário admin criado");

    // Criar clientes de exemplo
    const customersData = [
      {
        name: "João Silva",
        email: "joao@email.com",
        phone: "(11) 98765-4321",
        cpf: "123.456.789-00",
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
      },
      {
        name: "Maria Santos",
        email: "maria@email.com",
        phone: "(11) 91234-5678",
        cpf: "987.654.321-00",
        address: "Av. Paulista, 1000",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
      },
      {
        name: "Pedro Oliveira",
        email: "pedro@email.com",
        phone: "(21) 99876-5432",
        cpf: "456.789.123-00",
        address: "Rua do Comércio, 456",
        city: "Rio de Janeiro",
        state: "RJ",
        zipCode: "20040-020",
      },
    ];

    for (const customer of customersData) {
      await db.insert(customers).values(customer);
    }
    console.log("✅ Clientes criados");

    // Criar produtos de exemplo
    const productsData = [
      {
        name: "iPhone 15 Pro Max 256GB",
        description: "Smartphone Apple iPhone 15 Pro Max com 256GB de armazenamento",
        category: "Smartphones",
        brand: "Apple",
        model: "iPhone 15 Pro Max",
        sku: "IPH15PM256",
        barcode: "7891234567890",
        costPrice: 550000, // R$ 5.500,00 em centavos
        salePrice: 750000, // R$ 7.500,00
        minStock: 5,
        requiresImei: true,
      },
      {
        name: "Samsung Galaxy S24 Ultra 512GB",
        description: "Smartphone Samsung Galaxy S24 Ultra com 512GB",
        category: "Smartphones",
        brand: "Samsung",
        model: "Galaxy S24 Ultra",
        sku: "SAMS24U512",
        barcode: "7891234567891",
        costPrice: 480000, // R$ 4.800,00
        salePrice: 680000, // R$ 6.800,00
        minStock: 5,
        requiresImei: true,
      },
      {
        name: "Xiaomi Redmi Note 13 Pro 256GB",
        description: "Smartphone Xiaomi Redmi Note 13 Pro",
        category: "Smartphones",
        brand: "Xiaomi",
        model: "Redmi Note 13 Pro",
        sku: "XIARN13P256",
        barcode: "7891234567892",
        costPrice: 120000, // R$ 1.200,00
        salePrice: 180000, // R$ 1.800,00
        minStock: 10,
        requiresImei: true,
      },
      {
        name: "Capinha Silicone iPhone 15",
        description: "Capinha de silicone para iPhone 15",
        category: "Acessórios",
        brand: "Genérico",
        sku: "CAP-IPH15",
        barcode: "7891234567893",
        costPrice: 1500, // R$ 15,00
        salePrice: 4900, // R$ 49,00
        minStock: 50,
        requiresImei: false,
      },
      {
        name: "Película de Vidro Universal",
        description: "Película de vidro temperado universal",
        category: "Acessórios",
        brand: "Genérico",
        sku: "PEL-UNIV",
        barcode: "7891234567894",
        costPrice: 800, // R$ 8,00
        salePrice: 2900, // R$ 29,00
        minStock: 100,
        requiresImei: false,
      },
      {
        name: "Carregador Turbo 65W USB-C",
        description: "Carregador rápido 65W com cabo USB-C",
        category: "Acessórios",
        brand: "Genérico",
        sku: "CARR-65W",
        barcode: "7891234567895",
        costPrice: 3500, // R$ 35,00
        salePrice: 8900, // R$ 89,00
        minStock: 30,
        requiresImei: false,
      },
      {
        name: "Fone de Ouvido Bluetooth TWS",
        description: "Fone de ouvido sem fio Bluetooth TWS",
        category: "Acessórios",
        brand: "Genérico",
        sku: "FONE-TWS",
        barcode: "7891234567896",
        costPrice: 4500, // R$ 45,00
        salePrice: 12900, // R$ 129,00
        minStock: 20,
        requiresImei: false,
      },
      {
        name: "Motorola Edge 40 Neo 256GB",
        description: "Smartphone Motorola Edge 40 Neo",
        category: "Smartphones",
        brand: "Motorola",
        model: "Edge 40 Neo",
        sku: "MOTE40N256",
        barcode: "7891234567897",
        costPrice: 140000, // R$ 1.400,00
        salePrice: 220000, // R$ 2.200,00
        minStock: 8,
        requiresImei: true,
      },
    ];

    for (const product of productsData) {
      await db.insert(products).values(product);
    }
    console.log("✅ Produtos criados");

    console.log("\n🎉 Seed concluído com sucesso!");
    console.log("\n📝 Credenciais de acesso:");
    console.log("   Email: admin@okcells.com");
    console.log("   Senha: admin123");
    
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  }

  process.exit(0);
}

seed();
