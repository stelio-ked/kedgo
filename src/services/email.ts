/**
 * Serviço de E-mail — KedGo!
 *
 * Configurado por padrão para o Hostinger SMTP com o domínio oficial (@kedgo.pro)
 * ou qualquer provedor SMTP padrão / Gmail.
 *
 * Configuração recomendada nas variáveis de ambiente (.env):
 *   SMTP_HOST=smtp.hostinger.com
 *   SMTP_PORT=465
 *   SMTP_SECURE=true
 *   SMTP_USER=contato@kedgo.pro
 *   SMTP_PASS=SuaSenhaCriadaNaHostinger
 *   SMTP_FROM="KedGo!" <contato@kedgo.pro>
 *
 * Retrocompatibilidade:
 *   GMAIL_USER / GMAIL_APP_PASSWORD ainda são suportados como fallback.
 *
 * Em desenvolvimento (sem SMTP_PASS / GMAIL_APP_PASSWORD), os e-mails são
 * registrados no console com simulação segura.
 */

import nodemailer from "nodemailer";

// ─── Configuração do transportador ──────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : port === 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "contato@kedgo.pro";
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    return null; // modo dev: sem envio real se não houver senha definida
  }

  // Se o usuário ainda estiver usando Gmail explicitamente
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && !process.env.SMTP_USER && !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
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
  const defaultSenderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || "contato@kedgo.pro";
  const from = process.env.SMTP_FROM || `"KedGo!" <${defaultSenderEmail}>`;

  if (!transporter) {
    // Dev fallback: apenas loga no console
    console.log(`[DEV EMAIL] Para: ${payload.to} | De: ${from} | Assunto: ${payload.subject}`);
    return { sent: false };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: "contato@kedgo.pro",
    });

    console.log(`[EMAIL ENVIADO] Para: ${payload.to} | De: ${from} | MessageId: ${info.messageId}`);
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
              <!-- Promo Box com explicação dos 3 planos de acesso -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:20px;">
                    <p style="margin:0 0 14px;font-size:14px;color:#9A3412;font-weight:700;">
                      🎁 Ao se cadastrar com o convite, você ganha <span style="color:#C2410C;font-weight:800;">R$ 10,00 de desconto</span> em qualquer modalidade de acesso:
                    </p>
                    
                    <!-- Plano 1: Passe Viagem -->
                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;margin-bottom:10px;border:1px solid #fed7aa;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">🎟️ Passe Viagem</p>
                            <p style="margin:3px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                              Acesso completo aos recursos para <strong>1 viagem específica (+30 dias)</strong>. Ideal para viagens pontuais.
                            </p>
                          </td>
                          <td align="right" style="vertical-align:top;padding-left:10px;">
                            <span style="font-size:12px;font-weight:800;color:#D95D39;white-space:nowrap;">R$ 19,90</span>
                            <span style="display:block;font-size:10px;color:#94a3b8;text-decoration:line-through;">R$ 29,90</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Plano 2: KedGo Pro Anual -->
                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;margin-bottom:10px;border:2px solid #10b981;position:relative;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <span style="display:inline-block;background:#10b981;color:#ffffff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase;margin-bottom:4px;">🔥 Mais Popular</span>
                            <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">✨ KedGo Pro Anual</p>
                            <p style="margin:3px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                              <strong>Viagens &amp; OCR ilimitados (1 ano)</strong>, roteiros com IA, cofre criptografado offline e rateio em grupo.
                            </p>
                          </td>
                          <td align="right" style="vertical-align:top;padding-left:10px;">
                            <span style="font-size:12px;font-weight:800;color:#10b981;white-space:nowrap;">R$ 69,90/ano</span>
                            <span style="display:block;font-size:10px;color:#94a3b8;text-decoration:line-through;">R$ 79,90</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Plano 3: Founders Pass -->
                    <div style="background:#ffffff;border-radius:8px;padding:12px 14px;border:1px solid #fed7aa;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <span style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;text-transform:uppercase;margin-bottom:4px;">👑 Fundadores</span>
                            <p style="margin:0;font-size:13px;color:#1E3A5F;font-weight:700;">👑 Founders Pass (Vitalício)</p>
                            <p style="margin:3px 0 0;font-size:12px;color:#475569;line-height:1.45;">
                              Acesso <strong>vitalício e irrestrito</strong> a todas as funções atuais e futuras sem mensalidades ou renovação.
                            </p>
                          </td>
                          <td align="right" style="vertical-align:top;padding-left:10px;">
                            <span style="font-size:12px;font-weight:800;color:#D95D39;white-space:nowrap;">R$ 139,90</span>
                            <span style="display:block;font-size:10px;color:#94a3b8;text-decoration:line-through;">R$ 149,90</span>
                          </td>
                        </tr>
                      </table>
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

  const text = `Olá!\n\nSeu amigo ${referrerName} te convidou para usar o KedGo!\n\nAo se cadastrar, você ganha R$ 10,00 de desconto na escolha do seu plano:\n- 🎟️ Passe Viagem (1 viagem +30 dias): R$ 19,90 (de R$ 29,90)\n- ✨ KedGo Pro Anual (Viagens & OCR ilimitados): R$ 69,90/ano (de R$ 79,90)\n- 👑 Founders Pass (Acesso Vitalício sem renovação): R$ 139,90 único (de R$ 149,90)\n\nCrie sua conta pelo link: ${inviteUrl}\nOu use o código de convite: ${referralCode}\n\nKedGo!`;

  return { to: inviteeEmail, subject: title, html, text };
}

// ─── 5. Alerta de Novo Feedback para o Administrador ─────────────────────────
export function buildAdminFeedbackNotificationEmail(params: {
  userName: string;
  userEmail: string;
  type: string;
  subject: string;
  message: string;
  rating?: number | null;
  createdAt?: Date | string;
}): EmailPayload {
  const { userName, userEmail, type, subject, message, rating, createdAt } = params;

  const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
    suggestion: { label: "Sugestão de Melhoria", icon: "💡", color: "#f59e0b" },
    bug: { label: "Relato de Erro / Bug", icon: "🐞", color: "#e11d48" },
    question: { label: "Dúvida de Uso", icon: "❓", color: "#2563eb" },
    praise: { label: "Elogio", icon: "⭐", color: "#059669" },
    other: { label: "Outro Feedback", icon: "📝", color: "#64748b" },
  };

  const badge = typeLabels[type] || typeLabels.other;
  const adminEmail = process.env.ADMIN_EMAIL || "theoked25@gmail.com";
  const title = `[KedGo! Feedback] ${badge.icon} ${badge.label}: ${subject}`;
  const dateFormatted = createdAt ? new Date(createdAt).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR");

  const starsHtml = rating && rating >= 1 && rating <= 5
    ? `<p style="margin:8px 0 0;font-size:14px;color:#f59e0b;">Avaliação: ${"⭐".repeat(rating)} (${rating}/5)</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F 0%,#0F172A 100%);padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">KedGo!</h1>
              <p style="margin:6px 0 0;color:#fbbf24;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                🔔 Notificação Executiva para o Super ADM
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <div style="display:inline-block;background:${badge.color}15;border:1px solid ${badge.color}40;color:${badge.color};font-weight:800;font-size:12px;padding:4px 10px;border-radius:20px;margin-bottom:16px;">
                ${badge.icon} ${badge.label}
              </div>

              <h2 style="margin:0 0 16px;font-size:18px;color:#1e293b;font-weight:800;line-height:1.4;">
                ${subject}
              </h2>

              <!-- Viajante Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px;">
                <tr>
                  <td>
                    <p style="margin:0;font-size:13px;color:#64748b;"><strong>Enviado por:</strong> ${userName}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;"><strong>E-mail:</strong> <a href="mailto:${userEmail}" style="color:#2563eb;text-decoration:none;">${userEmail}</a></p>
                    <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;"><strong>Data / Hora:</strong> ${dateFormatted}</p>
                    ${starsHtml}
                  </td>
                </tr>
              </table>

              <!-- Mensagem -->
              <p style="margin:0 0 8px;font-size:12px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">
                Mensagem do Viajante:
              </p>
              <div style="background:#ffffff;border:1px solid #cbd5e1;border-left:4px solid #1E3A5F;border-radius:8px;padding:16px;font-size:14px;color:#334155;line-height:1.6;white-space:pre-wrap;">${message}</div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
                <tr>
                  <td style="background:#1E3A5F;border-radius:10px;">
                    <a href="https://kedgo.pro" target="_blank"
                       style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Acessar Painel do Super ADM
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                KedGo! — Plataforma Inteligente de Viagens.<br />
                Esta é uma notificação em tempo real enviada a partir do recebimento de feedback na plataforma.
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

  const text = `[KedGo! Feedback Recebido]\n\nTipo: ${badge.label}\nAssunto: ${subject}\n\nEnviado por: ${userName} (${userEmail})\nData: ${dateFormatted}\n\nMensagem:\n${message}\n\nAcesse o painel em https://kedgo.pro`;

  return { to: adminEmail, subject: title, html, text };
}

