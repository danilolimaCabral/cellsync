/**
 * Script para cadastrar modelos de iPhone
 * Uso: npx tsx scripts/add-iphones.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { products } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

console.log("📱 Cadastrando modelos de iPhone...\n");

const iphones = [
  // iPhone XR (2018)
  {
    name: "iPhone XR 64GB",
    description: "Tela Liquid Retina 6.1\", chip A12 Bionic, câmera 12MP, Face ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone XR",
    sku: "IPHXR64",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 180000, // R$ 1.800
    salePrice: 250000, // R$ 2.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone XR 128GB",
    description: "Tela Liquid Retina 6.1\", chip A12 Bionic, câmera 12MP, Face ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone XR",
    sku: "IPHXR128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 200000, // R$ 2.000
    salePrice: 280000, // R$ 2.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone XS (2018)
  {
    name: "iPhone XS 64GB",
    description: "Tela Super Retina OLED 5.8\", chip A12 Bionic, câmera dupla 12MP, Face ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone XS",
    sku: "IPHXS64",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 220000, // R$ 2.200
    salePrice: 300000, // R$ 3.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone XS 256GB",
    description: "Tela Super Retina OLED 5.8\", chip A12 Bionic, câmera dupla 12MP, Face ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone XS",
    sku: "IPHXS256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 250000, // R$ 2.500
    salePrice: 350000, // R$ 3.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone XS Max (2018)
  {
    name: "iPhone XS Max 64GB",
    description: "Tela Super Retina OLED 6.5\", chip A12 Bionic, câmera dupla 12MP, Face ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone XS Max",
    sku: "IPHXSM64",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 280000, // R$ 2.800
    salePrice: 380000, // R$ 3.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone XS Max 256GB",
    description: "Tela Super Retina OLED 6.5\", chip A12 Bionic, câmera dupla 12MP, Face ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone XS Max",
    sku: "IPHXSM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 320000, // R$ 3.200
    salePrice: 420000, // R$ 4.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 11 (2019)
  {
    name: "iPhone 11 64GB",
    description: "Tela Liquid Retina 6.1\", chip A13 Bionic, câmera dupla 12MP, modo noturno",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 11",
    sku: "IPH1164",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 250000, // R$ 2.500
    salePrice: 340000, // R$ 3.400
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 11 128GB",
    description: "Tela Liquid Retina 6.1\", chip A13 Bionic, câmera dupla 12MP, modo noturno",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 11",
    sku: "IPH11128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 280000, // R$ 2.800
    salePrice: 380000, // R$ 3.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 11 Pro (2019)
  {
    name: "iPhone 11 Pro 64GB",
    description: "Tela Super Retina XDR 5.8\", chip A13 Bionic, tripla câmera 12MP, modo noturno",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 11 Pro",
    sku: "IPH11P64",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 350000, // R$ 3.500
    salePrice: 480000, // R$ 4.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 11 Pro 256GB",
    description: "Tela Super Retina XDR 5.8\", chip A13 Bionic, tripla câmera 12MP, modo noturno",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 11 Pro",
    sku: "IPH11P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 400000, // R$ 4.000
    salePrice: 550000, // R$ 5.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 11 Pro Max (2019)
  {
    name: "iPhone 11 Pro Max 64GB",
    description: "Tela Super Retina XDR 6.5\", chip A13 Bionic, tripla câmera 12MP, modo noturno",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 11 Pro Max",
    sku: "IPH11PM64",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 400000, // R$ 4.000
    salePrice: 550000, // R$ 5.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 11 Pro Max 256GB",
    description: "Tela Super Retina XDR 6.5\", chip A13 Bionic, tripla câmera 12MP, modo noturno",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 11 Pro Max",
    sku: "IPH11PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 450000, // R$ 4.500
    salePrice: 620000, // R$ 6.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone SE 2ª geração (2020)
  {
    name: "iPhone SE (2ª geração) 64GB",
    description: "Tela Retina HD 4.7\", chip A13 Bionic, câmera 12MP, Touch ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone SE (2ª geração)",
    sku: "IPHSE264",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 180000, // R$ 1.800
    salePrice: 250000, // R$ 2.500
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone SE (2ª geração) 128GB",
    description: "Tela Retina HD 4.7\", chip A13 Bionic, câmera 12MP, Touch ID",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone SE (2ª geração)",
    sku: "IPHSE2128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 200000, // R$ 2.000
    salePrice: 280000, // R$ 2.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 12 mini (2020)
  {
    name: "iPhone 12 mini 64GB",
    description: "Tela Super Retina XDR 5.4\", chip A14 Bionic, câmera dupla 12MP, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12 mini",
    sku: "IPH12M64",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 280000, // R$ 2.800
    salePrice: 380000, // R$ 3.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 12 mini 128GB",
    description: "Tela Super Retina XDR 5.4\", chip A14 Bionic, câmera dupla 12MP, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12 mini",
    sku: "IPH12M128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 320000, // R$ 3.200
    salePrice: 430000, // R$ 4.300
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 12 (2020)
  {
    name: "iPhone 12 64GB",
    description: "Tela Super Retina XDR 6.1\", chip A14 Bionic, câmera dupla 12MP, 5G, MagSafe",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12",
    sku: "IPH1264",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 320000, // R$ 3.200
    salePrice: 430000, // R$ 4.300
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 12 128GB",
    description: "Tela Super Retina XDR 6.1\", chip A14 Bionic, câmera dupla 12MP, 5G, MagSafe",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12",
    sku: "IPH12128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 360000, // R$ 3.600
    salePrice: 480000, // R$ 4.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 12 Pro (2020)
  {
    name: "iPhone 12 Pro 128GB",
    description: "Tela Super Retina XDR 6.1\", chip A14 Bionic, tripla câmera 12MP + LiDAR, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12 Pro",
    sku: "IPH12P128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 450000, // R$ 4.500
    salePrice: 620000, // R$ 6.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 12 Pro 256GB",
    description: "Tela Super Retina XDR 6.1\", chip A14 Bionic, tripla câmera 12MP + LiDAR, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12 Pro",
    sku: "IPH12P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 500000, // R$ 5.000
    salePrice: 680000, // R$ 6.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 12 Pro Max (2020)
  {
    name: "iPhone 12 Pro Max 128GB",
    description: "Tela Super Retina XDR 6.7\", chip A14 Bionic, tripla câmera 12MP + LiDAR, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12 Pro Max",
    sku: "IPH12PM128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 500000, // R$ 5.000
    salePrice: 680000, // R$ 6.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 12 Pro Max 256GB",
    description: "Tela Super Retina XDR 6.7\", chip A14 Bionic, tripla câmera 12MP + LiDAR, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 12 Pro Max",
    sku: "IPH12PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 550000, // R$ 5.500
    salePrice: 750000, // R$ 7.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone SE 3ª geração (2022)
  {
    name: "iPhone SE (3ª geração) 64GB",
    description: "Tela Retina HD 4.7\", chip A15 Bionic, câmera 12MP, Touch ID, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone SE (3ª geração)",
    sku: "IPHSE364",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 220000, // R$ 2.200
    salePrice: 300000, // R$ 3.000
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone SE (3ª geração) 128GB",
    description: "Tela Retina HD 4.7\", chip A15 Bionic, câmera 12MP, Touch ID, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone SE (3ª geração)",
    sku: "IPHSE3128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 250000, // R$ 2.500
    salePrice: 340000, // R$ 3.400
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 13 mini (2021)
  {
    name: "iPhone 13 mini 128GB",
    description: "Tela Super Retina XDR 5.4\", chip A15 Bionic, câmera dupla 12MP, modo cinema",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13 mini",
    sku: "IPH13M128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 350000, // R$ 3.500
    salePrice: 480000, // R$ 4.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 13 mini 256GB",
    description: "Tela Super Retina XDR 5.4\", chip A15 Bionic, câmera dupla 12MP, modo cinema",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13 mini",
    sku: "IPH13M256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 400000, // R$ 4.000
    salePrice: 550000, // R$ 5.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 13 (2021)
  {
    name: "iPhone 13 128GB",
    description: "Tela Super Retina XDR 6.1\", chip A15 Bionic, câmera dupla 12MP, modo cinema, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13",
    sku: "IPH13128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 380000, // R$ 3.800
    salePrice: 520000, // R$ 5.200
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 13 256GB",
    description: "Tela Super Retina XDR 6.1\", chip A15 Bionic, câmera dupla 12MP, modo cinema, 5G",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13",
    sku: "IPH13256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 430000, // R$ 4.300
    salePrice: 580000, // R$ 5.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 13 Pro (2021)
  {
    name: "iPhone 13 Pro 128GB",
    description: "Tela Super Retina XDR ProMotion 6.1\", chip A15 Bionic, tripla câmera 12MP, modo macro",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13 Pro",
    sku: "IPH13P128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 520000, // R$ 5.200
    salePrice: 720000, // R$ 7.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 13 Pro 256GB",
    description: "Tela Super Retina XDR ProMotion 6.1\", chip A15 Bionic, tripla câmera 12MP, modo macro",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13 Pro",
    sku: "IPH13P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 580000, // R$ 5.800
    salePrice: 800000, // R$ 8.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 13 Pro Max (2021)
  {
    name: "iPhone 13 Pro Max 128GB",
    description: "Tela Super Retina XDR ProMotion 6.7\", chip A15 Bionic, tripla câmera 12MP, modo macro",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    sku: "IPH13PM128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 580000, // R$ 5.800
    salePrice: 800000, // R$ 8.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 13 Pro Max 256GB",
    description: "Tela Super Retina XDR ProMotion 6.7\", chip A15 Bionic, tripla câmera 12MP, modo macro",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    sku: "IPH13PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 650000, // R$ 6.500
    salePrice: 880000, // R$ 8.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 14 (2022)
  {
    name: "iPhone 14 128GB",
    description: "Tela Super Retina XDR 6.1\", chip A15 Bionic, câmera dupla 12MP, detecção de acidente",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14",
    sku: "IPH14128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 450000, // R$ 4.500
    salePrice: 620000, // R$ 6.200
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 14 256GB",
    description: "Tela Super Retina XDR 6.1\", chip A15 Bionic, câmera dupla 12MP, detecção de acidente",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14",
    sku: "IPH14256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 500000, // R$ 5.000
    salePrice: 680000, // R$ 6.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 14 Plus (2022)
  {
    name: "iPhone 14 Plus 128GB",
    description: "Tela Super Retina XDR 6.7\", chip A15 Bionic, câmera dupla 12MP, bateria de longa duração",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14 Plus",
    sku: "IPH14PL128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 500000, // R$ 5.000
    salePrice: 680000, // R$ 6.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 14 Plus 256GB",
    description: "Tela Super Retina XDR 6.7\", chip A15 Bionic, câmera dupla 12MP, bateria de longa duração",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14 Plus",
    sku: "IPH14PL256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 550000, // R$ 5.500
    salePrice: 750000, // R$ 7.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 14 Pro (2022)
  {
    name: "iPhone 14 Pro 128GB",
    description: "Tela Super Retina XDR ProMotion 6.1\" com Dynamic Island, chip A16 Bionic, câmera 48MP",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14 Pro",
    sku: "IPH14P128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 620000, // R$ 6.200
    salePrice: 850000, // R$ 8.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 14 Pro 256GB",
    description: "Tela Super Retina XDR ProMotion 6.1\" com Dynamic Island, chip A16 Bionic, câmera 48MP",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14 Pro",
    sku: "IPH14P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 680000, // R$ 6.800
    salePrice: 920000, // R$ 9.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 14 Pro Max (2022)
  {
    name: "iPhone 14 Pro Max 128GB",
    description: "Tela Super Retina XDR ProMotion 6.7\" com Dynamic Island, chip A16 Bionic, câmera 48MP",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14 Pro Max",
    sku: "IPH14PM128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 680000, // R$ 6.800
    salePrice: 920000, // R$ 9.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 14 Pro Max 256GB",
    description: "Tela Super Retina XDR ProMotion 6.7\" com Dynamic Island, chip A16 Bionic, câmera 48MP",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 14 Pro Max",
    sku: "IPH14PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 750000, // R$ 7.500
    salePrice: 1000000, // R$ 10.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 15 (2023)
  {
    name: "iPhone 15 128GB",
    description: "Tela Super Retina XDR 6.1\" com Dynamic Island, chip A16 Bionic, câmera 48MP, USB-C",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15",
    sku: "IPH15128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 520000, // R$ 5.200
    salePrice: 720000, // R$ 7.200
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 15 256GB",
    description: "Tela Super Retina XDR 6.1\" com Dynamic Island, chip A16 Bionic, câmera 48MP, USB-C",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15",
    sku: "IPH15256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 580000, // R$ 5.800
    salePrice: 800000, // R$ 8.000
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 15 Plus (2023)
  {
    name: "iPhone 15 Plus 128GB",
    description: "Tela Super Retina XDR 6.7\" com Dynamic Island, chip A16 Bionic, câmera 48MP, USB-C",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Plus",
    sku: "IPH15PL128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 580000, // R$ 5.800
    salePrice: 800000, // R$ 8.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 15 Plus 256GB",
    description: "Tela Super Retina XDR 6.7\" com Dynamic Island, chip A16 Bionic, câmera 48MP, USB-C",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Plus",
    sku: "IPH15PL256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 650000, // R$ 6.500
    salePrice: 880000, // R$ 8.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 15 Pro (2023)
  {
    name: "iPhone 15 Pro 128GB",
    description: "Tela Super Retina XDR ProMotion 6.1\", chip A17 Pro, câmera 48MP, titânio, USB-C 3.0",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Pro",
    sku: "IPH15P128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 680000, // R$ 6.800
    salePrice: 920000, // R$ 9.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 15 Pro 256GB",
    description: "Tela Super Retina XDR ProMotion 6.1\", chip A17 Pro, câmera 48MP, titânio, USB-C 3.0",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Pro",
    sku: "IPH15P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 750000, // R$ 7.500
    salePrice: 1000000, // R$ 10.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 15 Pro Max (2023)
  {
    name: "iPhone 15 Pro Max 256GB",
    description: "Tela Super Retina XDR ProMotion 6.7\", chip A17 Pro, câmera 48MP + zoom 5x, titânio",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    sku: "IPH15PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 820000, // R$ 8.200
    salePrice: 1100000, // R$ 11.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 15 Pro Max 512GB",
    description: "Tela Super Retina XDR ProMotion 6.7\", chip A17 Pro, câmera 48MP + zoom 5x, titânio",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    sku: "IPH15PM512",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 920000, // R$ 9.200
    salePrice: 1250000, // R$ 12.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 16 (2024)
  {
    name: "iPhone 16 128GB",
    description: "Tela Super Retina XDR 6.1\", chip A18, câmera Fusion 48MP, botão de controle de câmera",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16",
    sku: "IPH16128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 580000, // R$ 5.800
    salePrice: 800000, // R$ 8.000
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 16 256GB",
    description: "Tela Super Retina XDR 6.1\", chip A18, câmera Fusion 48MP, botão de controle de câmera",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16",
    sku: "IPH16256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 650000, // R$ 6.500
    salePrice: 880000, // R$ 8.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 16 Plus (2024)
  {
    name: "iPhone 16 Plus 128GB",
    description: "Tela Super Retina XDR 6.7\", chip A18, câmera Fusion 48MP, bateria de longa duração",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16 Plus",
    sku: "IPH16PL128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 650000, // R$ 6.500
    salePrice: 880000, // R$ 8.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 16 Plus 256GB",
    description: "Tela Super Retina XDR 6.7\", chip A18, câmera Fusion 48MP, bateria de longa duração",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16 Plus",
    sku: "IPH16PL256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 720000, // R$ 7.200
    salePrice: 980000, // R$ 9.800
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 16 Pro (2024)
  {
    name: "iPhone 16 Pro 128GB",
    description: "Tela Super Retina XDR ProMotion 6.3\", chip A18 Pro, câmera 48MP, titânio grau 5",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16 Pro",
    sku: "IPH16P128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 750000, // R$ 7.500
    salePrice: 1000000, // R$ 10.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 16 Pro 256GB",
    description: "Tela Super Retina XDR ProMotion 6.3\", chip A18 Pro, câmera 48MP, titânio grau 5",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16 Pro",
    sku: "IPH16P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 820000, // R$ 8.200
    salePrice: 1100000, // R$ 11.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // iPhone 16 Pro Max (2024)
  {
    name: "iPhone 16 Pro Max 256GB",
    description: "Tela Super Retina XDR ProMotion 6.9\", chip A18 Pro, câmera 48MP + zoom 5x tetraprism",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16 Pro Max",
    sku: "IPH16PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 920000, // R$ 9.200
    salePrice: 1250000, // R$ 12.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  {
    name: "iPhone 16 Pro Max 512GB",
    description: "Tela Super Retina XDR ProMotion 6.9\", chip A18 Pro, câmera 48MP + zoom 5x tetraprism",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16 Pro Max",
    sku: "IPH16PM512",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 1050000, // R$ 10.500
    salePrice: 1400000, // R$ 14.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: true,
  },
  
  // Modelos futuros (previsão)
  {
    name: "iPhone 16e 128GB",
    description: "Versão econômica com tela 6.1\", chip A17, câmera dupla 12MP (lançamento previsto)",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 16e",
    sku: "IPH16E128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 350000, // R$ 3.500
    salePrice: 480000, // R$ 4.800
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: false, // Inativo até lançamento
  },
  {
    name: "iPhone Air 128GB",
    description: "Design ultrafino com tela 6.6\", chip A18, câmera dupla 48MP (lançamento previsto)",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone Air",
    sku: "IPHAIR128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 520000, // R$ 5.200
    salePrice: 720000, // R$ 7.200
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: false, // Inativo até lançamento
  },
  {
    name: "iPhone 17 128GB",
    description: "Próxima geração com chip A19, tela 6.1\" (lançamento previsto 2025)",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 17",
    sku: "IPH17128",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 620000, // R$ 6.200
    salePrice: 850000, // R$ 8.500
    minStock: 5,
    currentStock: 0,
    requiresImei: true,
    active: false, // Inativo até lançamento
  },
  {
    name: "iPhone 17 Pro 256GB",
    description: "Versão Pro com chip A19 Pro, câmera 48MP (lançamento previsto 2025)",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 17 Pro",
    sku: "IPH17P256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 850000, // R$ 8.500
    salePrice: 1150000, // R$ 11.500
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: false, // Inativo até lançamento
  },
  {
    name: "iPhone 17 Pro Max 256GB",
    description: "Versão Pro Max com chip A19 Pro, tela 6.9\" (lançamento previsto 2025)",
    category: "Smartphone",
    brand: "Apple",
    model: "iPhone 17 Pro Max",
    sku: "IPH17PM256",
    barcode: `789${Math.floor(Math.random() * 1000000000)}`,
    costPrice: 950000, // R$ 9.500
    salePrice: 1300000, // R$ 13.000
    minStock: 3,
    currentStock: 0,
    requiresImei: true,
    active: false, // Inativo até lançamento
  },
];

async function addIphones() {
  try {
    let added = 0;
    let skipped = 0;
    
    for (const iphone of iphones) {
      try {
        await db.insert(products).values(iphone);
        console.log(`✅ ${iphone.name}`);
        added++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  ${iphone.name} (já existe)`);
          skipped++;
        } else {
          throw error;
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ ${added} iPhones cadastrados`);
    console.log(`   ⏭️  ${skipped} iPhones já existiam`);
    console.log(`   📱 Total: ${iphones.length} modelos\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao cadastrar iPhones:", error);
    process.exit(1);
  }
}

addIphones();
