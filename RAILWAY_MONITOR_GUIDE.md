# Guia de Monitoramento Automático de Deploys (Railway)

O Railway CLI não possui um sistema nativo de notificações push, mas você pode criar facilmente um script que monitora o status do seu projeto e envia alertas para **Discord**, **Slack** ou **Telegram** quando algo der errado.

Abaixo está um script completo para automatizar essa tarefa.

## 1. Script de Monitoramento (`monitor_deploy.sh`)

Este script verifica o status do seu serviço a cada minuto. Se detectar uma falha, ele envia uma notificação para um Webhook (ex: Discord).

### Passo 1: Crie o arquivo
Crie um arquivo chamado `monitor_deploy.sh` e cole o conteúdo abaixo:

```bash
#!/bin/bash

# --- CONFIGURAÇÃO ---
# Coloque aqui a URL do seu Webhook (Discord, Slack, etc.)
# Se estiver vazio, ele apenas exibirá o erro no terminal.
WEBHOOK_URL=""

# Intervalo de verificação em segundos
INTERVAL=60
# --------------------

echo "📡 Iniciando monitoramento do Railway..."
echo "Pressione [CTRL+C] para parar."

LAST_STATUS="UNKNOWN"

while true; do
  # Obtém o status atual do serviço vinculado
  # Nota: Ajuste o comando grep conforme a saída da sua versão do CLI se necessário
  CURRENT_STATUS=$(railway status --json 2>/dev/null | grep -o '"status": *"[^"]*"' | head -1 | cut -d'"' -f4)

  # Se não conseguir ler o status, tenta novamente no próximo ciclo
  if [ -z "$CURRENT_STATUS" ]; then
    echo "⚠️  Não foi possível ler o status. Tentando novamente em $INTERVAL s..."
    sleep $INTERVAL
    continue
  fi

  # Exibe status no terminal com carimbo de data/hora
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  
  # Lógica de detecção de mudança de status
  if [ "$CURRENT_STATUS" != "$LAST_STATUS" ]; then
    echo "[$TIMESTAMP] Status alterado: $LAST_STATUS -> $CURRENT_STATUS"
    
    # Se o novo status for de erro, envia alerta
    if [ "$CURRENT_STATUS" == "FAILED" ] || [ "$CURRENT_STATUS" == "CRASHED" ]; then
      MESSAGE="🚨 **ALERTA DE FALHA** 🚨\nO deploy do Railway falhou!\nStatus: $CURRENT_STATUS\nHorário: $TIMESTAMP"
      
      echo -e "$MESSAGE"
      
      # Envia para Webhook se configurado
      if [ ! -z "$WEBHOOK_URL" ]; then
        curl -H "Content-Type: application/json" \
             -d "{\"content\": \"$MESSAGE\"}" \
             $WEBHOOK_URL
      fi
    fi
    
    # Se o novo status for sucesso (e antes estava falhando ou desconhecido)
    if [ "$CURRENT_STATUS" == "SUCCESS" ] || [ "$CURRENT_STATUS" == "ACTIVE" ]; then
      echo "✅ Serviço operando normalmente."
    fi
  fi

  LAST_STATUS="$CURRENT_STATUS"
  sleep $INTERVAL
done
```

### Passo 2: Tornar executável
No terminal, dê permissão de execução:
```bash
chmod +x monitor_deploy.sh
```

## 2. Como obter um Webhook (Exemplo: Discord)

Para receber os alertas no seu celular ou computador via Discord:

1.  Crie um servidor no Discord (ou use um existente).
2.  Vá nas **Configurações do Canal** onde quer receber os alertas.
3.  Clique em **Integrações** > **Webhooks**.
4.  Clique em **Novo Webhook**, dê um nome (ex: "Railway Bot") e copie a **URL do Webhook**.
5.  Cole essa URL na variável `WEBHOOK_URL` dentro do script `monitor_deploy.sh`.

## 3. Executando

Basta rodar o script em um terminal que fique aberto (ou em um servidor VPS):

```bash
./monitor_deploy.sh
```

Agora, sempre que o status do Railway mudar para `FAILED` ou `CRASHED`, você receberá uma notificação instantânea! 🚀
