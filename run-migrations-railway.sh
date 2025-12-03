#!/bin/bash

# Script para executar migrations no Railway
echo "🚀 Executando migrations no Railway..."

# Selecionar serviço cellsync e executar migrations
cd /home/ubuntu/cellsync

# Executar db:push para criar tabelas
echo "📊 Criando tabelas no banco de dados..."
railway run --service cellsync pnpm db:push

# Executar seed para popular dados
echo "🌱 Populando dados iniciais..."
railway run --service cellsync node seed-plans.mjs

echo "✅ Migrations concluídas!"
