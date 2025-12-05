-- Script para corrigir os preços dos planos no banco de dados
-- Execute este script no painel do Railway (Database > Query)

-- Atualizar Plano Básico
UPDATE plans 
SET price_monthly = 9700, 
    price_yearly = 97000,
    max_users = 3,
    max_products = 1000,
    max_storage = 2048,
    ai_imports_limit = 20
WHERE slug = 'basico';

-- Atualizar Plano Profissional
UPDATE plans 
SET price_monthly = 19700, 
    price_yearly = 197000,
    max_users = 10,
    max_products = 5000,
    max_storage = 10240,
    ai_imports_limit = 100
WHERE slug = 'profissional';

-- Atualizar Plano Empresarial
UPDATE plans 
SET price_monthly = 59900, 
    price_yearly = 599000,
    max_users = 50,
    max_products = 50000,
    max_storage = 102400,
    ai_imports_limit = -1
WHERE slug = 'empresarial';

-- Verificar os preços atualizados
SELECT id, name, slug, price_monthly, price_yearly, max_users, max_products, ai_imports_limit 
FROM plans 
ORDER BY price_monthly ASC;
