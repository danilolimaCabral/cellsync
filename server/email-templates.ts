/**
 * Templates de email do CellSync
 */

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  loginUrl: string;
  supportUrl: string;
}

/**
 * Template de email de boas-vindas
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): { subject: string; html: string } {
  const { userName, userEmail, temporaryPassword, loginUrl, supportUrl } = data;

  const subject = `🎉 Bem-vindo ao CellSync, ${userName}!`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao CellSync</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header com gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #3B82F6 0%, #A855F7 50%, #EC4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🎉 Bem-vindo ao CellSync!
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Sua conta foi criada com sucesso
              </p>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Olá <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Estamos muito felizes em tê-lo conosco! Sua conta no <strong>CellSync</strong> está pronta para transformar a gestão da sua loja de celular.
              </p>

              <!-- Credenciais de acesso -->
              <div style="background-color: #F3F4F6; border-left: 4px solid #3B82F6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #1F2937; font-size: 18px;">
                  🔐 Suas Credenciais de Acesso
                </h3>
                <p style="margin: 0 0 10px 0; color: #4B5563; font-size: 14px;">
                  <strong>Email:</strong> ${userEmail}
                </p>
                <p style="margin: 0 0 10px 0; color: #4B5563; font-size: 14px;">
                  <strong>Senha temporária:</strong> <code style="background-color: #E5E7EB; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code>
                </p>
                <p style="margin: 15px 0 0 0; color: #DC2626; font-size: 13px;">
                  ⚠️ <strong>Importante:</strong> Altere sua senha no primeiro acesso em <em>Configurações → Alterar Senha</em>
                </p>
              </div>

              <!-- Botão de acesso -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #A855F7); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  ⚡ Acessar Sistema
                </a>
              </div>

              <!-- Tutorial rápido -->
              <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #1F2937; font-size: 18px;">
                  🚀 Primeiros Passos
                </h3>
                
                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background-color: #3B82F6; color: #ffffff; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">1</div>
                  <span style="color: #374151; font-size: 15px;"><strong>Configure sua loja:</strong> Adicione logo, dados fiscais e informações em <em>Configurações</em></span>
                </div>

                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background-color: #A855F7; color: #ffffff; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">2</div>
                  <span style="color: #374151; font-size: 15px;"><strong>Cadastre produtos:</strong> Importe planilha ou cadastre manualmente em <em>Estoque</em></span>
                </div>

                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background-color: #EC4899; color: #ffffff; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">3</div>
                  <span style="color: #374151; font-size: 15px;"><strong>Adicione clientes:</strong> Cadastre sua base de clientes em <em>Clientes (CRM)</em></span>
                </div>

                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background-color: #10B981; color: #ffffff; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">4</div>
                  <span style="color: #374151; font-size: 15px;"><strong>Faça sua primeira venda:</strong> Acesse o <em>PDV</em> e comece a vender!</span>
                </div>

                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background-color: #F59E0B; color: #ffffff; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">5</div>
                  <span style="color: #374151; font-size: 15px;"><strong>Acompanhe resultados:</strong> Veja métricas em tempo real no <em>Dashboard</em></span>
                </div>
              </div>

              <!-- Suporte -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #92400E; font-size: 16px;">
                  💬 Precisa de ajuda?
                </h3>
                <p style="margin: 0; color: #78350F; font-size: 14px; line-height: 1.6;">
                  Nossa equipe está pronta para ajudar! Acesse nosso <a href="${supportUrl}" style="color: #D97706; text-decoration: underline;">Centro de Suporte</a> ou responda este email.
                </p>
              </div>

              <p style="margin: 30px 0 0 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                Obrigado por escolher o CellSync!<br>
                <strong>Equipe CellSync</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 12px;">
                © 2025 CellSync. Todos os direitos reservados.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
                Este é um email automático, por favor não responda diretamente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
