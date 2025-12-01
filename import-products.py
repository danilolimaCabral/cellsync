#!/usr/bin/env python3
"""
Script para importar produtos do CSV para o banco de dados MySQL
"""
import pandas as pd
import re
import os
import sys

# Adicionar path do projeto
sys.path.insert(0, '/home/ubuntu/okcells')

def parse_price(price_str):
    """Converte string de preço brasileiro para centavos"""
    if pd.isna(price_str) or price_str == '' or price_str == '-':
        return 0
    
    # Remove R$, espaços e pontos de milhar
    price_str = str(price_str).replace('R$', '').replace('.', '').replace(' ', '').strip()
    
    # Substitui vírgula por ponto
    price_str = price_str.replace(',', '.')
    
    try:
        # Converte para float e depois para centavos
        return int(float(price_str) * 100)
    except:
        return 0

def extract_brand_and_model(product_name):
    """Extrai marca e modelo do nome do produto"""
    # Padrão: NOME MODELO (MARCA) - ESPECIFICAÇÕES
    match = re.search(r'\(([^)]+)\)', product_name)
    brand = match.group(1) if match else ""
    
    # Modelo é a primeira parte antes do (
    model = product_name.split('(')[0].strip() if '(' in product_name else product_name
    
    return brand, model

def categorize_product(product_name):
    """Categoriza o produto baseado no nome"""
    name_lower = product_name.lower()
    
    if 'iphone' in name_lower or 'samsung' in name_lower or 'xiaomi' in name_lower or 'poco' in name_lower or 'realme' in name_lower or 'motorola' in name_lower:
        return 'Smartphone'
    elif 'cabo' in name_lower or 'carregador' in name_lower or 'fonte' in name_lower:
        return 'Acessório'
    elif 'fone' in name_lower or 'headphone' in name_lower or 'earphone' in name_lower or 'boombox' in name_lower or 'jbl' in name_lower:
        return 'Áudio'
    elif 'capa' in name_lower or 'película' in name_lower or 'protetor' in name_lower:
        return 'Proteção'
    elif 'tablet' in name_lower or 'ipad' in name_lower:
        return 'Tablet'
    elif 'watch' in name_lower or 'smartwatch' in name_lower:
        return 'Smartwatch'
    else:
        return 'Outros'

def main():
    print("🚀 Iniciando importação de produtos...")
    
    # Ler CSV
    csv_path = '/home/ubuntu/upload/RelatóriodoEstoque(1).csv'
    print(f"📂 Lendo arquivo: {csv_path}")
    
    df = pd.read_csv(csv_path, sep=';', skiprows=1, encoding='latin-1')
    print(f"✅ {len(df)} linhas encontradas")
    
    # Agrupar por produto único (ignorar IMEI duplicados)
    products_unique = df.groupby('Produto').agg({
        'Custo': 'first',
        'Valor Varejo': 'first',
        'Valor Atacado': 'first',
        'Quantidade em Estoque': 'sum'
    }).reset_index()
    
    print(f"📦 {len(products_unique)} produtos únicos identificados")
    
    # Preparar dados para inserção
    products_to_insert = []
    
    for _, row in products_unique.iterrows():
        product_name = row['Produto']
        brand, model = extract_brand_and_model(product_name)
        category = categorize_product(product_name)
        
        cost_price = parse_price(row['Custo'])
        sale_price = parse_price(row['Valor Varejo'])
        
        # Gerar SKU baseado no nome
        sku = re.sub(r'[^A-Z0-9]', '', product_name.upper())[:20]
        
        product = {
            'name': product_name[:255],
            'brand': brand[:100] if brand else None,
            'model': model[:100] if model else None,
            'category': category,
            'sku': sku,
            'costPrice': cost_price,
            'salePrice': sale_price,
            'minStock': 5,
            'requiresImei': 'IPHONE' in product_name.upper() or 'SAMSUNG' in product_name.upper() or 'XIAOMI' in product_name.upper()
        }
        
        products_to_insert.append(product)
    
    # Conectar ao banco e inserir
    print(f"\n💾 Conectando ao banco de dados...")
    
    import mysql.connector
    from mysql.connector import Error
    
    # Ler DATABASE_URL da variável de ambiente
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL não encontrada nas variáveis de ambiente")
        print("Execute: export DATABASE_URL='...' antes de rodar o script")
        return
    
    # Parse DATABASE_URL (formato: mysql://user:pass@host:port/dbname)
    match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', database_url)
    if not match:
        print("❌ Formato inválido de DATABASE_URL")
        return
    
    user, password, host, port, database = match.groups()
    
    try:
        connection = mysql.connector.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=database
        )
        
        if connection.is_connected():
            print(f"✅ Conectado ao banco: {database}")
            cursor = connection.cursor()
            
            # Inserir produtos
            insert_query = """
            INSERT INTO products 
            (name, brand, model, category, sku, costPrice, salePrice, minStock, requiresImei, createdAt, updatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            
            success_count = 0
            error_count = 0
            
            for product in products_to_insert:
                try:
                    cursor.execute(insert_query, (
                        product['name'],
                        product['brand'],
                        product['model'],
                        product['category'],
                        product['sku'],
                        product['costPrice'],
                        product['salePrice'],
                        product['minStock'],
                        product['requiresImei']
                    ))
                    success_count += 1
                except Error as e:
                    error_count += 1
                    if 'Duplicate entry' not in str(e):
                        print(f"⚠️  Erro ao inserir '{product['name'][:50]}...': {e}")
            
            connection.commit()
            
            print(f"\n✅ Importação concluída!")
            print(f"   ✓ {success_count} produtos importados")
            print(f"   ✗ {error_count} erros/duplicados")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == '__main__':
    main()
