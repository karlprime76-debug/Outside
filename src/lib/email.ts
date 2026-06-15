const API_URL = "https://api.brevo.com/v3/smtp/email";

const FROM = { name: "OUTSIDE", email: "noreply@outside.app" };

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: { name: string; email: string };
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[EMAIL] Would send to ${to}: ${subject}`);
      return { success: true as const, simulated: true };
    }
    throw new Error("BREVO_API_KEY not configured");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: FROM,
      to: [{ email: to }],
      replyTo: replyTo ?? FROM,
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[BREVO]", res.status, body);
    throw new Error(`Brevo API error: ${res.status}`);
  }

  return { success: true as const };
}

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export function passwordResetHtml(token: string, email: string): string {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:40px 32px 0;text-align:center">
<img src="https://outside-tau.vercel.app/logo.png" alt="OUTSIDE" width="40" height="40" style="border-radius:10px"/>
<h1 style="font-size:22px;font-weight:800;color:#1a1a2e;margin:24px 0 8px">Réinitialisation du mot de passe</h1>
<p style="font-size:15px;color:#666;margin:0 0 32px;line-height:1.5">Tu as demandé à réinitialiser ton mot de passe OUTSIDE. Clique sur le bouton ci-dessous pour le faire.</p>
<a href="${link}" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px">Réinitialiser mon mot de passe</a>
<p style="font-size:13px;color:#999;margin:32px 0 0;line-height:1.4">Ce lien expire dans 1 heure. Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;border-top:1px solid #eee;margin-top:32px">
<p style="font-size:12px;color:#aaa;margin:0">OUTSIDE · L'application qui connecte les soirées</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export function emailVerifyHtml(token: string, email: string): string {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:40px 32px 0;text-align:center">
<img src="https://outside-tau.vercel.app/logo.png" alt="OUTSIDE" width="40" height="40" style="border-radius:10px"/>
<h1 style="font-size:22px;font-weight:800;color:#1a1a2e;margin:24px 0 8px">Vérifie ton adresse email</h1>
<p style="font-size:15px;color:#666;margin:0 0 32px;line-height:1.5">Merci de t'être inscrit·e sur OUTSIDE ! Confirme ton adresse email en cliquant sur le bouton ci-dessous.</p>
<a href="${link}" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px">Confirmer mon email</a>
<p style="font-size:13px;color:#999;margin:32px 0 0;line-height:1.4">Ce lien expire dans 24 heures. Si tu n'as pas créé de compte sur OUTSIDE, ignore cet email.</p>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;border-top:1px solid #eee;margin-top:32px">
<p style="font-size:12px;color:#aaa;margin:0">OUTSIDE · L'application qui connecte les soirées</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export function welcomeHtml(name: string): string {
  const displayName = name || "et bienvenue";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:40px 32px 0;text-align:center">
<img src="https://outside-tau.vercel.app/logo.png" alt="OUTSIDE" width="40" height="40" style="border-radius:10px"/>
<h1 style="font-size:22px;font-weight:800;color:#1a1a2e;margin:24px 0 8px">Bienvenue sur OUTSIDE, ${displayName} 🎉</h1>
<p style="font-size:15px;color:#666;margin:0 0 8px;line-height:1.5">Ton compte a été créé avec succès !</p>
<p style="font-size:15px;color:#666;margin:0 0 32px;line-height:1.5">Découvre les plans près de chez toi, connecte-toi avec ta ville et vis des moments uniques.</p>
<a href="${appUrl()}/home" style="display:inline-block;padding:14px 32px;background:#8b5cf6;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px">Découvrir OUTSIDE</a>
</td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;border-top:1px solid #eee;margin-top:32px">
<p style="font-size:12px;color:#aaa;margin:0">OUTSIDE · L'application qui connecte les soirées</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}
