# Guia de Automação com Railway CLI

Este guia descreve os passos para instalar, configurar e utilizar a Interface de Linha de Comando (CLI) do Railway para monitorar e automatizar seus deploys.

## 1. Instalação

Você pode instalar o Railway CLI usando npm (Node.js) ou via script shell.

### Via NPM (Recomendado)
Se você já tem o Node.js instalado:
```bash
npm i -g @railway/cli
```

### Via Shell (Mac/Linux)
```bash
curl -fsSL https://railway.app/install.sh | sh
```

## 2. Autenticação

Após instalar, você precisa conectar o CLI à sua conta Railway.

```bash
railway login
```
Isso abrirá seu navegador para confirmar a autenticação.

**Para servidores (CI/CD):**
Se estiver em um ambiente sem navegador (como GitHub Actions ou VPS), use um token:
1. No painel do Railway, vá em **Settings > Tokens** e crie um novo token.
2. No terminal, execute:
```bash
railway login --browserless
```
Ou defina a variável de ambiente `RAILWAY_TOKEN`.

## 3. Vincular Projeto

Navegue até a pasta do seu projeto e vincule-o ao Railway:

```bash
cd /caminho/do/seu/projeto
railway link
```
Selecione o projeto **CellSync** na lista que aparecerá.

## 4. Comandos Úteis

*   **Verificar Status:** Mostra o status do serviço atual.
    ```bash
    railway status
    ```
*   **Ver Logs:** Acompanha os logs em tempo real.
    ```bash
    railway logs
    ```
*   **Forçar Deploy:** Dispara um novo deploy manualmente.
    ```bash
    railway up
    ```

## 5. Script de Automação (Exemplo)

Abaixo, um exemplo de script Bash para verificar automaticamente se o deploy foi concluído com sucesso. Salve como `check_deploy.sh`:

```bash
#!/bin/bash

echo "🔍 Verificando status do deploy no Railway..."

# Loop para verificar status a cada 10 segundos
while true; do
  # Captura o status (pode precisar de ajustes dependendo da saída exata do CLI na sua versão)
  STATUS=$(railway status --json | grep -o '"status": *"[^"]*"' | head -1 | cut -d'"' -f4)
  
  echo "Status atual: $STATUS"

  if [ "$STATUS" == "SUCCESS" ] || [ "$STATUS" == "ACTIVE" ]; then
    echo "✅ Deploy concluído com sucesso!"
    exit 0
  elif [ "$STATUS" == "FAILED" ] || [ "$STATUS" == "CRASHED" ]; then
    echo "❌ Deploy falhou!"
    exit 1
  fi

  sleep 10
done
```

Para usar:
```bash
chmod +x check_deploy.sh
./check_deploy.sh
```

---
**Nota:** A saída do comando `railway status` pode variar conforme a versão do CLI. Recomenda-se testar o comando `railway status --json` para ver a estrutura exata dos dados antes de usar em produção.
