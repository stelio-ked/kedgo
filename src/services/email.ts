/**
 * Serviço de E-mail — KedGo!
 *
 * Usa Nodemailer com Gmail SMTP via App Password (gratuito, até ~500 e-mails/dia).
 *
 * Configuração necessária nas variáveis de ambiente:
 *   GMAIL_USER=seuemail@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   ← Senha de App de 16 dígitos
 *
 * Como gerar uma Senha de App do Gmail:
 *   1. Acesse: https://myaccount.google.com/security
 *   2. Ative "Verificação em 2 etapas" se ainda não estiver ativa
 *   3. Acesse: https://myaccount.google.com/apppasswords
 *   4. Crie uma senha para "Outro (nome personalizado)" → "KedGo!"
 *   5. Copie os 16 caracteres gerados e defina GMAIL_APP_PASSWORD no .env
 *
 * Em desenvolvimento (sem GMAIL_APP_PASSWORD), os e-mails são registrados
 * no console e salvos em memória (simulatedEmails) como antes.
 */

import nodemailer from "nodemailer";

// ─── Configuração do transportador ──────────────────────────────────────────

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null; // modo dev: sem envio real
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// ─── Interface de e-mail ─────────────────────────────────────────────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ─── Função principal de envio ───────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; messageId?: string }> {
  const transporter = createTransporter();
  const from = process.env.GMAIL_USER || "noreply@kedgo.app";

  if (!transporter) {
    // Dev fallback: apenas loga no console
    console.log(`[DEV EMAIL] Para: ${payload.to} | Assunto: ${payload.subject}`);
    return { sent: false };
  }

  try {
    const info = await transporter.sendMail({
      from: `"KedGo!" <${from}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    console.log(`[EMAIL ENVIADO] Para: ${payload.to} | MessageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL ERRO] Falha ao enviar para ${payload.to}:`, err.message);
    throw err;
  }
}

// ─── Templates de e-mail ─────────────────────────────────────────────────────

export function buildPasswordSetupEmail(opts: {
  name: string;
  email: string;
  resetUrl: string;
  isNewAccount: boolean;
}): EmailPayload {
  const { name, email, resetUrl, isNewAccount } = opts;
  const title = isNewAccount
    ? "Crie sua senha de acesso — KedGo!"
    : "Defina ou atualize sua senha — KedGo!";

  const callToAction = isNewAccount
    ? "Você foi cadastrado na KedGo!! Para ativar sua conta, crie sua senha de acesso clicando no botão abaixo."
    : "Recebemos uma solicitação para configurar o acesso à sua conta. Clique no botão para definir sua senha.";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                ✈️ KedGo!
              </h1>
              <p style="margin:6px 0 0;color:#a0aec0;font-size:13px;">Roteiro & Custos de Viagem</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;">Olá, <strong>${name || "Viajante"}</strong>!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">${callToAction}</p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      🔐 Definir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #f6d860;border-radius:8px;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      ⚠️ Este link expira em <strong>1 hora</strong>. Se você não solicitou este e-mail, ignore-o com segurança.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                KedGo! — Seu diário de bordo de viagens.<br />
                Este é um e-mail automático, não responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Olá, ${name || "Viajante"}!\n\n${callToAction}\n\nLink para definir sua senha:\n${resetUrl}\n\nEste link expira em 1 hora.\n\nKedGo!`;

  return { to: email, subject: title, html, text };
}

export function buildAccountVerificationEmail(opts: {
  name: string;
  email: string;
  verifyUrl: string;
}): EmailPayload {
  const { name, email, verifyUrl } = opts;
  const title = "Confirme seu e-mail de cadastro — KedGo!";
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                ✈️ KedGo!
              </h1>
              <p style="margin:6px 0 0;color:#a0aec0;font-size:13px;">Roteiro & Custos de Viagem</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;">Olá, <strong>${name || "Organizador"}</strong>!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4a5568;line-height:1.6;">
                Obrigado por se cadastrar no KedGo!! Para concluir a criação da sua conta e liberar seu acesso, confirme seu e-mail clicando no botão abaixo:
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5 0%,#4338ca 100%);border-radius:8px;">
                    <a href="${verifyUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      ✅ Ativar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#fffbeb;border:1px solid #f6d860;border-radius:8px;padding:14px 16px;">
                    <p style="margin:0;font-size:13px;color:#92400e;">
                      ⚠️ Este link de confirmação expira em <strong>24 horas</strong>. Se você não solicitou este cadastro, ignore-o.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                KedGo! — Seu diário de bordo de viagens.<br />
                Este é um e-mail automático, não responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Olá, ${name || "Organizador"}!\n\nConfirme seu e-mail clicando no link abaixo:\n${verifyUrl}\n\nEste link expira em 24 horas.\n\nKedGo!`;

  return { to: email, subject: title, html, text };
}

export function buildReferralInviteEmail(opts: {
  referrerName: string;
  inviteeEmail: string;
  referralCode: string;
  inviteUrl: string;
}): EmailPayload {
  const { referrerName, inviteeEmail, referralCode, inviteUrl } = opts;
  // Assunto limpo para evitar filtros de SPAM (sem gatilhos agressivos de vendas ou excesso de emojis)
  const title = `${referrerName} convidou você para organizar viagens no KedGo!`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F 0%,#D95D39 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                KedGo!
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Programa Indique & Ganhe</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#2d3748;">Olá! 👋</p>
              <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.6;">
                Seu amigo <strong>${referrerName}</strong> usa o <strong>KedGo!</strong> para planejar roteiros, voos e custos de viagens e te convidou para fazer parte!
              </p>
              <!-- Promo Box com explicação dos 2 produtos -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:20px;">
                    <p style="margin:0 0 14px;font-size:14px;color:#9A3412;font-weight:700;">
                      🎁 Ao se cadastrar com o convite, você ganha <span style="color:#C2410C;font-weight:800;">R$ 10,00 de desconto</span> na escolha do seu produto:
                    </p>
                    
                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;margin-bottom:10px;border:1px solid #fed7aa;">
                      <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">🎫 Passe KedGo! (Avulso)</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                        Acesso total aos recursos inteligentes de IA, organização de voos, documentos e rateio financeiro para <strong>1 viagem específica</strong>. Ideal para quem viaja pontualmente.
                      </p>
                    </div>

                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;border:1px solid #fed7aa;">
                      <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">⭐ KedGo! Pro (Vitalício)</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                        Acesso <strong>vitalício e ilimitado</strong> para criar quantas viagens quiser, IA sem restrições, exportação em PDF e novas atualizações. Perfeito para quem viaja sempre.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1E3A5F 0%,#D95D39 100%);border-radius:8px;">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">
                      Criar Minha Conta Grátis
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Referral Code -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#F1F5F9;border-radius:8px;padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#64748B;">Ou use o código de convite ao se cadastrar:</p>
                    <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#1E3A5F;letter-spacing:2px;font-family:monospace;">${referralCode}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fa;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a0aec0;">
                KedGo! — Seu diário de bordo de viagens.<br />
                Este é um e-mail automático enviado a pedido de ${referrerName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Olá!\n\nSeu amigo ${referrerName} te convidou para usar o KedGo!\n\nAo se cadastrar, você ganha R$ 10,00 de desconto na escolha do seu produto:\n- Passe KedGo! (Avulso - 1 viagem): Recursos completos para 1 viagem específica.\n- KedGo! Pro (Vitalício): Acesso vitalício e ilimitado para todas as suas viagens.\n\nCrie sua conta pelo link: ${inviteUrl}\nOu use o código de convite: ${referralCode}\n\nKedGo!`;

  return { to: inviteeEmail, subject: title, html, text };
}

