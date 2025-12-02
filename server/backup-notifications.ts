import { ENV } from "./_core/env";

export interface BackupNotificationData {
  success: boolean;
  filename?: string;
  fileSize?: number;
  uploadUrl?: string;
  deletedCount?: number;
  error?: string;
  timestamp: number;
  duration?: number;
}

/**
 * Template HTML para email de sucesso de backup
 */
function getSuccessEmailTemplate(data: BackupNotificationData): string {
  const date = new Date(data.timestamp).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const sizeInMB = data.fileSize
    ? (data.fileSize / 1024 / 1024).toFixed(2)
    : "N/A";
  const durationText = data.duration
    ? `${(data.duration / 1000).toFixed(1)}s`
    : "N/A";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
    .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #374151; }
    .info-value { color: #6b7280; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Backup Realizado com Sucesso</h1>
    </div>
    <div class="content">
      <div class="success-icon">✅</div>
      <p>O backup automático do banco de dados foi concluído com sucesso.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Data/Hora:</span>
          <span class="info-value">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Arquivo:</span>
          <span class="info-value">${data.filename || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tamanho:</span>
          <span class="info-value">${sizeInMB} MB</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duração:</span>
          <span class="info-value">${durationText}</span>
        </div>
        ${
          data.deletedCount !== undefined
            ? `
        <div class="info-row">
          <span class="info-label">Backups Antigos Removidos:</span>
          <span class="info-value">${data.deletedCount}</span>
        </div>
        `
            : ""
        }
      </div>
      
      <p><strong>Status:</strong> O backup foi enviado para o S3 e está disponível para restauração.</p>
      <p><strong>Retenção:</strong> Backups são mantidos por 30 dias e removidos automaticamente após esse período.</p>
    </div>
    <div class="footer">
      <p>CellSync - Sistema de Gestão para Lojas de Celular</p>
      <p>Este é um email automático do sistema de backup. Não responda.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Template HTML para email de falha de backup
 */
function getFailureEmailTemplate(data: BackupNotificationData): string {
  const date = new Date(data.timestamp).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px; }
    .error-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
    .error-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #374151; }
    .info-value { color: #6b7280; }
    .error-message { background: #fee2e2; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 13px; color: #991b1b; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Falha no Backup Automático</h1>
    </div>
    <div class="content">
      <div class="error-icon">❌</div>
      <p><strong>ATENÇÃO:</strong> O backup automático do banco de dados falhou.</p>
      
      <div class="error-box">
        <div class="info-row">
          <span class="info-label">Data/Hora:</span>
          <span class="info-value">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #ef4444; font-weight: 600;">FALHA</span>
        </div>
      </div>
      
      <p><strong>Erro:</strong></p>
      <div class="error-message">${data.error || "Erro desconhecido"}</div>
      
      <div class="alert">
        <p><strong>⚠️ Ação Necessária:</strong></p>
        <ul>
          <li>Verifique os logs do servidor para mais detalhes</li>
          <li>Confirme que o banco de dados está acessível</li>
          <li>Verifique as credenciais de conexão</li>
          <li>Execute um backup manual para garantir a segurança dos dados</li>
        </ul>
      </div>
      
      <p><strong>Próxima Tentativa:</strong> O sistema tentará novamente automaticamente às 3h AM de amanhã.</p>
    </div>
    <div class="footer">
      <p>CellSync - Sistema de Gestão para Lojas de Celular</p>
      <p>Este é um email automático do sistema de backup. Não responda.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Envia notificação de backup por email usando a API de notificações do Manus
 */
export async function sendBackupNotification(
  data: BackupNotificationData
): Promise<boolean> {
  try {
    const subject = data.success
      ? "✅ Backup Realizado com Sucesso"
      : "❌ Falha no Backup Automático";

    const htmlContent = data.success
      ? getSuccessEmailTemplate(data)
      : getFailureEmailTemplate(data);

    const notificationUrl = new URL(
      "v1/notification/email",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
    );

    const response = await fetch(notificationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        to: ENV.ownerName, // Email do owner do projeto
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(
        `[Backup Notification] Erro ao enviar email: ${response.status} ${errorText}`
      );
      return false;
    }

    console.log(
      `[Backup Notification] Email enviado com sucesso: ${subject}`
    );
    return true;
  } catch (error: any) {
    console.error(`[Backup Notification] Erro ao enviar notificação:`, error);
    return false;
  }
}
