import nodemailer from "nodemailer";

/** Creates a Nodemailer transporter from environment variables.
 *  Set the following in .env (or .env.local) after the app is deployed:
 *
 *    SMTP_HOST=smtp.example.com
 *    SMTP_PORT=587
 *    SMTP_USER=your@email.com
 *    SMTP_PASS=yourpassword
 *    SMTP_FROM="Kounta <noreply@example.com>"
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendInviteEmail({
  to,
  inviterName,
  orgName,
  role,
  inviteUrl,
}: {
  to: string;
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const from = process.env.SMTP_FROM ?? `Kounta <noreply@kounta.app>`;
  const transporter = createTransporter();

  const roleLabel = role === "owner" ? "Owner" : "Staff";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background: #f4f4f7; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f7; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background: #3E4095; padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">Kounta</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; color: #111827; font-size: 22px;">You've been invited!</h2>
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 12px;">
                    <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Kounta as a <strong>${roleLabel}</strong>.
                  </p>
                  <p style="color: #4b5563; line-height: 1.6; margin: 0 0 28px;">
                    Click the button below to accept the invitation and access your workspace.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto 28px;">
                    <tr>
                      <td style="background: #3E4095; border-radius: 8px; padding: 14px 32px;">
                        <a href="${inviteUrl}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px;">Accept Invitation</a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    If you didn't expect this invitation, you can safely ignore this email.
                    This link will expire in 7 days.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">Kounta · Business Management Platform</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
    You've been invited to join ${orgName} on Kounta as a ${roleLabel}.
    ${inviterName} sent you this invitation.

    Accept your invitation here: ${inviteUrl}

    If you didn't expect this, you can ignore this email.
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `You've been invited to join ${orgName} on Kounta`,
    html,
    text,
  });
}
