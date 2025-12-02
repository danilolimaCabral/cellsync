/**
 * Serviço de envio de emails
 * Usa a API de notificações do Manus para enviar emails
 */

import { ENV } from "./_core/env";
import { getWelcomeEmailTemplate, type WelcomeEmailData } from "./email-templates";

/**
 * Envia email de boas-vindas para novo usuário
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const { subject, html } = getWelcomeEmailTemplate(data);

    // Usar API de notificações do Manus para enviar email
    const response = await fetch(`${ENV.forgeApiUrl}/notification/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        type: "email",
        to: data.userEmail,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error("Erro ao enviar email:", await response.text());
      return false;
    }

    console.log(`✅ Email de boas-vindas enviado para: ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);
    return false;
  }
}

/**
 * Gera senha temporária aleatória
 */
export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
